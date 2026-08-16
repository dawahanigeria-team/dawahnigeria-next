"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Nunito_Sans } from "next/font/google";
import { ThemeScript } from "@/features/dawahcast/components/site-shell/ThemeScript";
import "./globals.css";

/**
 * Last-resort boundary for errors thrown while rendering the root layout.
 *
 * Next replaces the *entire* document with this when it fires, so it has to
 * render its own <html>/<body> and pull in the stylesheet and font itself —
 * nothing from `layout.tsx` is available here. Only one font is loaded (the
 * shell's Nunito Sans); the per-route pairings aren't worth the weight on a
 * page that exists to apologise.
 *
 * Without this file `@sentry/nextjs` warns on every build and React rendering
 * errors never reach Sentry.
 */

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <head>
        {/* Without this the crash page ignores a saved light-mode preference
            and always paints the dark default. */}
        <ThemeScript />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-color">
            An unexpected error stopped this page from loading. The team has
            been notified.
          </p>

          {/* The digest is the only handle support has to tie a user's report
              to the captured event, so surface it when Next provides one. */}
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Reference: <code>{error.digest}</code>
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-[#ddff2b] px-5 py-2 text-sm font-semibold text-[#101010] transition-opacity hover:opacity-90"
            >
              Try again
            </button>
            {/* A plain anchor, not next/link: the router is part of what just
                failed, so a full document load is the reliable escape. */}
            <a
              href="/dawahcast"
              className="rounded-full border border-border px-5 py-2 text-sm text-foreground transition-colors hover:bg-hover"
            >
              Go to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
