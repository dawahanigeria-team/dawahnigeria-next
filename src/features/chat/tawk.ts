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

/**
 * Defer well beyond first interaction on constrained connections. The widget
 * transfers more than 200KB, so a short 1.5s timeout made it part of the
 * effective startup payload even though it used requestIdleCallback.
 */
export function scheduleWhenIdle(callback: () => void, timeout = 10_000): () => void {
  if (typeof window === "undefined") return () => {};

  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  }).connection;
  const constrained =
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g" ||
    connection?.effectiveType === "3g";
  const delay = constrained ? 30_000 : timeout;

  let idleId: number | undefined;
  const timerId = window.setTimeout(() => {
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(callback, { timeout: 1500 });
      return;
    }
    callback();
  }, delay);

  return () => {
    window.clearTimeout(timerId);
    if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
  };
}
