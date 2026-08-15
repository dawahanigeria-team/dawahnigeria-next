"use client";

const STORAGE_TEST_KEY = "__dn_tawk_probe__";

function canUseStorage(storage: Storage | undefined): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_TEST_KEY, "1");
    storage.removeItem(STORAGE_TEST_KEY);
    return true;
  } catch {
    // Safari private mode / storage disabled / quota exceeded.
    return false;
  }
}

function isDoNotTrackEnabled(): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string };
  return [nav.doNotTrack, nav.msDoNotTrack, win.doNotTrack]
    .filter((v) => v !== undefined && v !== null)
    .map((v) => String(v).toLowerCase())
    .some((v) => v === "1" || v === "yes");
}

/**
 * Consent/capability gate, ported from the CRA `utils/tawk.js`.
 *
 * Tawk drops cookies and writes to both storages; loading it for a visitor who
 * has signalled otherwise is what produced the "Unable to store cookie" noise
 * the CRA Sentry config had to filter. Bail out before injecting instead.
 */
export function shouldLoadTawkWidget(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  if (process.env.NEXT_PUBLIC_ENABLE_TAWK === "false") return false;

  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl) return false;
  if (isDoNotTrackEnabled()) return false;
  if (navigator.cookieEnabled === false) return false;

  return canUseStorage(window.localStorage) && canUseStorage(window.sessionStorage);
}

/** Defer to idle so the widget never competes with first paint. */
export function scheduleWhenIdle(callback: () => void, timeout = 1500): () => void {
  if (typeof window === "undefined") return () => {};

  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, timeout);
  return () => window.clearTimeout(id);
}
