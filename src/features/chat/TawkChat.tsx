"use client";

import { useEffect } from "react";
import { injectTawkScript } from "./tawk-embed";
import { scheduleWhenIdle, shouldLoadTawkWidget } from "./tawk";

// Same Tawk property as the CRA app, so chat history and agent routing carry
// over. These are public embed ids, not secrets.
const TAWK_PROPERTY_ID = "5cd3dd3ed07d7e0c6392ad09";
const TAWK_WIDGET_ID = "default";

/**
 * Loads the Tawk.to chat widget on the client, after idle, and only for
 * visitors who haven't opted out (see `shouldLoadTawkWidget`).
 *
 * Renders nothing — Tawk injects its own iframes into <body>.
 */
export function TawkChat() {
  useEffect(() => {
    if (!shouldLoadTawkWidget()) return;

    let script: HTMLScriptElement | null = null;
    const handleError = () => {
      console.warn("Tawk widget failed to load");
    };

    const cancelIdle = scheduleWhenIdle(() => {
      script = injectTawkScript({
        propertyId: TAWK_PROPERTY_ID,
        widgetId: TAWK_WIDGET_ID,
      });
      script?.addEventListener("error", handleError);
    });

    return () => {
      // Covers both orderings: unmount before idle fires, and after.
      cancelIdle();
      script?.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
