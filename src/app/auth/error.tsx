"use client";

import { useEffect } from "react";

import { AuthHeading, AuthSubmitButton } from "@/features/auth/AuthFields";

/**
 * Error boundary for the four /auth routes.
 *
 * `layout.tsx` survives this, so the hero, tabs and close button stay on screen
 * and the failure renders inside the auth card rather than replacing the
 * document — unlike `global-error.tsx`, which only catches root-layout throws.
 *
 * It exists because these pages read the upstream PHP API during render (the
 * language list on `/auth/selectlanguage`), and an unreachable upstream would
 * otherwise drop a half-finished Google signup onto Next's unstyled
 * `<html id="__next_error__">` document.
 *
 * `reset()` is safe to offer here: the OAuth payload lives in sessionStorage
 * and `LanguageSelect` only clears it once the signup action has run, so a
 * retry re-renders the page with the pending signup still intact.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
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
    <div className="flex w-full flex-col">
      <AuthHeading
        title="Something went wrong"
        subtitle="We couldn't load this step. It's usually temporary — try again."
      />

      {error.digest && (
        <p className="mb-6 text-xs text-muted-foreground">
          Reference: <code>{error.digest}</code>
        </p>
      )}

      <AuthSubmitButton pending={false} onClick={reset} type="button">
        Try again
      </AuthSubmitButton>
    </div>
  );
}
