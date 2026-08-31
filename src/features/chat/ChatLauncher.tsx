"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { injectTawkScript } from "./tawk-embed";
import { shouldLoadTawkWidget } from "./tawk";

// Same Tawk property as the CRA app, so chat history and agent routing carry
// over. These are public embed ids, not secrets.
const TAWK_PROPERTY_ID = "5cd3dd3ed07d7e0c6392ad09";
const TAWK_WIDGET_ID = "default";

// The bottom offsets in the className (205px mobile, 150px from `sm`) mirror
// MOBILE_Y_OFFSET and DESKTOP_Y_OFFSET in tawk-embed.ts, so the placeholder sits
// exactly where the real launcher appears — the swap on click must not move
// under the cursor. Both clear this app's player bar and tab bar.

type TawkWindow = Window & { Tawk_API?: Record<string, unknown> };

/**
 * Eligibility is read through useSyncExternalStore rather than set in an effect:
 * the server has no way to know the answer (it depends on navigator and
 * storage), and this keeps the server snapshot explicit instead of rendering a
 * launcher the client then has to take away.
 *
 * The answer cannot change during a visit, so it is computed once — getSnapshot
 * runs on every render and must not re-probe storage each time.
 */
let cachedEligible: boolean | null = null;

function subscribeEligible() {
  return () => {};
}

function readEligible(): boolean {
  if (cachedEligible === null) cachedEligible = shouldLoadTawkWidget();
  return cachedEligible;
}

function readEligibleOnServer(): boolean {
  return false;
}

/**
 * A placeholder for the Tawk chat launcher that loads the real widget on click.
 *
 * Tawk costs roughly 180KB across nineteen requests, plus a 295KB emoji library
 * it pulls from a third-party CDN — measured, on every page. Almost nobody opens
 * the chat, so nearly all of that was paid by people who never used it, on
 * connections and data plans that can least afford it.
 *
 * Deferring it (which this app already did, by 10s, or 30s on 2G/3G) keeps it
 * off the critical path but still downloads it for everyone. Loading it on
 * intent instead costs the visitor who wants chat about a second of latency, and
 * everyone else nothing at all.
 */
export function ChatLauncher() {
  const eligible = useSyncExternalStore(
    subscribeEligible,
    readEligible,
    readEligibleOnServer,
  );
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const pollRef = useRef<number | undefined>(undefined);

  const openChat = useCallback(() => {
    if (loading || loaded) return;
    setLoading(true);

    const win = window as TawkWindow;
    win.Tawk_API = win.Tawk_API || {};

    // Hand over as soon as Tawk can be driven, then stand down.
    //
    // Tawk's own `onLoad` is the documented hook, but it does not fire on a
    // domain the property does not recognise (a local dev host, for one) even
    // though the API object still arrives. Relying on it alone would leave this
    // placeholder sitting next to Tawk's real launcher. Polling for the method
    // we actually need is true wherever it runs.
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      const api = (window as TawkWindow).Tawk_API;
      if (typeof api?.maximize === "function") {
        (api.maximize as () => void)();
      }
      setLoaded(true);
      setLoading(false);
    };

    win.Tawk_API.onLoad = finish;

    scriptRef.current = injectTawkScript({
      propertyId: TAWK_PROPERTY_ID,
      widgetId: TAWK_WIDGET_ID,
    });

    if (!scriptRef.current) {
      setLoading(false);
      return;
    }
    scriptRef.current.addEventListener("error", () => {
      console.warn("Tawk widget failed to load");
      window.clearInterval(pollRef.current);
      setLoading(false);
    });

    const startedAt = Date.now();
    pollRef.current = window.setInterval(() => {
      const api = (window as TawkWindow).Tawk_API;
      if (typeof api?.maximize === "function") {
        window.clearInterval(pollRef.current);
        finish();
        return;
      }
      // Give up quietly rather than spin forever; the button stays, so a
      // visitor whose network dropped the script can simply press it again.
      if (Date.now() - startedAt > 15_000) {
        window.clearInterval(pollRef.current);
        setLoading(false);
      }
    }, 250);
  }, [loading, loaded]);

  useEffect(() => () => window.clearInterval(pollRef.current), []);

  // Once Tawk is up it renders its own launcher; a second one would sit on top.
  if (!eligible || loaded) return null;

  return (
    <button
      type="button"
      onClick={openChat}
      aria-label="Open support chat"
      aria-busy={loading}
      className="fixed bottom-[205px] right-3 z-40 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#3fa34d] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ddff2b] active:scale-95 sm:bottom-[150px] sm:right-5"
    >
      {loading ? (
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          aria-hidden
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 3C6.99 3 3 6.58 3 11c0 2.4 1.2 4.55 3.1 6.02V21l3.4-1.87c.8.2 1.64.31 2.5.31 5.01 0 9-3.58 9-8s-3.99-8-9-8z" />
        </svg>
      )}
    </button>
  );
}
