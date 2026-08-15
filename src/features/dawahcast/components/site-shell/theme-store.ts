"use client";

export type Theme = "light" | "dark";

const STORAGE_KEY = "dn:theme";

const listeners = new Set<() => void>();

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The `dark` class on <html> is the source of truth — ThemeScript applies it
 * before first paint, so reading it avoids a second source that could drift.
 */
export function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Matches ThemeScript's default when no preference is saved. */
export function getThemeServerSnapshot(): Theme {
  return "dark";
}

export function setTheme(next: Theme) {
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private-mode / quota failures shouldn't break the toggle.
  }
  listeners.forEach((listener) => listener());
}
