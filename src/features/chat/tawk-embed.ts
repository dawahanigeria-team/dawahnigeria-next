"use client";

type TawkWindow = Window & {
  Tawk_API?: Record<string, unknown>;
  Tawk_LoadStart?: Date;
};

/**
 * Launcher offsets, measured against this app's bottom chrome (not CRA's).
 *
 * The launcher defaults to the bottom-right corner, where it lands on top of
 * the player's transport controls and makes play/pause unclickable. Tawk
 * renders into iframes with randomised ids and no stable class, so CSS can't
 * reach it — the offset has to go through Tawk_API, and it must be assigned
 * *before* the embed script runs.
 *
 * Measured in-browser at 2026-08-09:
 *   desktop (881px): PlayerBar `bottom-0`, 77px tall  → 77px of chrome
 *   mobile  (375px): PlayerBar `bottom-16` (125px) over a 57px BottomNav → 189px
 *
 * CRA used a single 170px for both, which is too small on this layout's mobile
 * breakpoint and needlessly high on desktop. Tawk takes per-platform values, so
 * each clears its own chrome with a small margin.
 */
const DESKTOP_Y_OFFSET = 95;
const MOBILE_Y_OFFSET = 205;

export function buildTawkSrc(propertyId: string, widgetId: string): string {
  return `https://embed.tawk.to/${propertyId}/${widgetId}`;
}

export function injectTawkScript({
  propertyId,
  widgetId,
}: {
  propertyId: string;
  widgetId: string;
}): HTMLScriptElement | null {
  if (!propertyId || !widgetId || typeof window === "undefined") return null;

  const src = buildTawkSrc(propertyId, widgetId);
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${src}"]`,
  );
  if (existing) return existing;

  const win = window as TawkWindow;
  win.Tawk_API = win.Tawk_API || {};
  win.Tawk_API.customStyle = win.Tawk_API.customStyle || {
    visibility: {
      desktop: { position: "br", xOffset: 20, yOffset: DESKTOP_Y_OFFSET },
      mobile: { position: "br", xOffset: 12, yOffset: MOBILE_Y_OFFSET },
    },
  };
  win.Tawk_LoadStart = new Date();

  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.charset = "UTF-8";
  script.setAttribute("crossorigin", "*");

  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  return script;
}
