"use client";

/** What gets applied to <html>. */
export type Theme = "light" | "dark";

/**
 * What the user picked. "system" defers to the OS.
 *
 * CRA models this too (its dropdown offers System / Dark / Light), but its
 * `useThemeHook` immediately dispatches the *resolved* value back into state, so
 * the choice collapses to a concrete light/dark and stops tracking the OS after
 * the first resolve. Here "system" is kept as a real mode: the preference is
 * stored as-is and re-resolved whenever the OS scheme changes.
 */
export type ThemePreference = Theme | "system";

const STORAGE_KEY = "dn:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);

  // While the preference is "system", the OS is a second source of change that
  // no click will announce — mirror it into the same notification channel.
  const media = window.matchMedia(DARK_QUERY);
  const onSchemeChange = () => {
    if (getPreferenceSnapshot() !== "system") return;
    applyTheme(media.matches ? "dark" : "light");
    notify();
  };
  media.addEventListener("change", onSchemeChange);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSchemeChange);
  };
}

/**
 * The `dark` class on <html> is the source of truth for the *resolved* theme —
 * ThemeScript applies it before first paint, so reading it avoids a second
 * source that could drift.
 */
export function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Matches ThemeScript's default when no preference is saved. */
export function getThemeServerSnapshot(): Theme {
  return "dark";
}

export function getPreferenceSnapshot(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {
    // Private-mode reads can throw; fall through to the default.
  }
  return "dark";
}

export function getPreferenceServerSnapshot(): ThemePreference {
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Resolves a preference to the theme that should actually be applied. */
export function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== "system") return preference;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function setThemePreference(next: ThemePreference) {
  applyTheme(resolveTheme(next));
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private-mode / quota failures shouldn't break the control.
  }
  notify();
}
