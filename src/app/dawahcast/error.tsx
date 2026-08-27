"use client";

import { useEffect } from "react";

/**
 * Error boundary for the whole catalogue surface.
 *
 * It sits inside `DawahcastLayout`, so `SiteShell` — header, bottom nav and the
 * player bar — stays on screen, and the single <audio> in the *root* layout is
 * untouched: a failed page no longer stops whatever the visitor is listening to.
 *
 * Paired with `loading.tsx` in this segment, and that pairing is load-bearing.
 * These pages await their data at the top level, so without a Suspense boundary
 * to flush the shell first, a server throw takes the whole document down and
 * Next serves its unstyled `<html id="__next_error__">` page instead of this.
 */
export default function DawahcastError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Imported lazily, matching instrumentation.ts: a static `@sentry/nextjs`
    // import is evaluated when the *server* bundle initialises too (this file is
    // SSR'd), and the Node SDK compiles a Wasm module lexer at module scope —
    // which Cloudflare Workers refuse, producing an unhandledRejection that can
    // take the isolate down on a cold start.
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        This page didn&apos;t load
      </h1>
      <p className="max-w-md text-sm text-color">
        Something went wrong fetching it. Your playback is unaffected — try
        again, or head back to browsing.
      </p>

      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Reference: <code>{error.digest}</code>
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-[#ddff2b] px-5 py-2 text-sm font-semibold text-[#101010] transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/dawahcast"
          className="rounded-full border border-border px-5 py-2 text-sm text-foreground transition-colors hover:bg-hover"
        >
          Go to home
        </a>
      </div>
    </div>
  );
}
