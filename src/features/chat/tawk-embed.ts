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
 * Re-measured in-browser on the live site, 2026-08-31, by reading the height of
 * the fixed bottom container directly:
 *   375px wide → 179px of chrome
 *   713px wide → 131px of chrome
 *
 * The previous desktop value of 95px was derived from the player bar alone
 * (77px). It missed the tab bar, which this app renders at *every* width, not
 * only on mobile — so the launcher sat behind the player and could not be
 * clicked on anything wider than the mobile breakpoint. 150px clears the
 * measured 131px with room for the chrome to grow a little.
 */
const DESKTOP_Y_OFFSET = 150;
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
  // No `crossorigin`: "*" is not one of its three legal values ("",
  // "anonymous", "use-credentials"), and an invalid value is coerced to
  // "anonymous" — which puts this classic script into CORS mode and makes it
  // fail outright whenever Tawk's CDN answers without `Access-Control-Allow-
  // Origin`. A classic <script> needs no CORS handshake, so requesting one only
  // adds a failure mode.

  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  return script;
}
