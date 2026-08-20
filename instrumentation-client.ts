import type * as SentryTypes from "@sentry/nextjs";
import { isTawkError } from "@/lib/thirdPartyErrors";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * `@sentry/nextjs` is ~484KB, and a static import here put it on the critical
 * path of every page — more than posthog-js was, and this file runs before
 * hydration. It is loaded after first paint instead.
 *
 * Deferring an *error* reporter is riskier than deferring analytics, because
 * the errors most worth catching are the early ones. So native `error` and
 * `unhandledrejection` listeners are installed synchronously below and buffer
 * anything that fires before the SDK arrives; they are replayed through
 * captureException once it does, then removed.
 *
 * Residual gap: a React render error swallowed by an error boundary never
 * reaches window.onerror, so a component crashing inside the load window —
 * roughly first paint to idle — is still missed. Dropping tracing was measured
 * as the alternative and saves only 55KB of the 484KB, which is not worth
 * losing client performance monitoring for.
 *
 * Session Replay and browser profiling were added on top of that baseline, so
 * the deferred chunk is now larger still. They ride the same lazy import and
 * never touch the critical path — but if this file is ever changed back to a
 * static import, that is now an even worse trade than when it was written.
 */
let sentry: typeof SentryTypes | null = null;

/** Errors raised before the SDK landed, replayed in order once it has. */
const buffered: unknown[] = [];

function bufferError(event: ErrorEvent) {
  buffered.push(event.error ?? event.message);
}

function bufferRejection(event: PromiseRejectionEvent) {
  buffered.push(event.reason);
}

function initSentry(Sentry: typeof SentryTypes, dsnValue: string) {
  Sentry.init({
    dsn: dsnValue,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1",
    ),
    integrations: [
      // Replay masks all text, inputs and media by default; those defaults are
      // left in place deliberately — this app renders signed-in users' names,
      // emails and playlists, none of which belong in a replay.
      Sentry.replayIntegration(),
      // Chromium-only (JS Self-Profiling API) and inert unless the document was
      // served with `Document-Policy: js-profiling`, which custom-worker.ts adds
      // to HTML responses. Without that header this collects nothing at all.
      Sentry.browserProfilingIntegration(),
    ],
    // Record a small share of ordinary sessions, but keep every session that
    // hit an error (replay buffers the preceding 60s and flushes on error).
    replaysSessionSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ?? "0.1",
    ),
    replaysOnErrorSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? "1.0",
    ),
    // Relative to tracesSampleRate, not absolute: the effective profiling rate
    // is tracesSampleRate * profilesSampleRate, so 0.1 * 1.0 = 10% of sessions.
    profilesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ?? "1.0",
    ),
    // Carried over from CRA: Tawk's cookie failures are unactionable noise.
    ignoreErrors: ["Unable to store cookie"],
    beforeSend(event, hint) {
      const original = hint?.originalException as
        | { message?: string; stack?: string }
        | undefined;

      const stackFromEvent = event.exception?.values?.[0]?.stacktrace?.frames
        ?.map((frame) => `${frame.filename ?? ""} ${frame.function ?? ""}`)
        .join("\n");

      if (
        isTawkError({
          message:
            original?.message ??
            event.message ??
            event.exception?.values?.[0]?.value,
          filename: event.request?.url ?? "",
          stack: original?.stack ?? stackFromEvent ?? "",
        })
      ) {
        return null;
      }

      return event;
    },
  });
}

function loadSentry(dsnValue: string) {
  if (sentry) return;
  void import("@sentry/nextjs")
    .then((Sentry) => {
      initSentry(Sentry, dsnValue);
      sentry = Sentry;

      window.removeEventListener("error", bufferError);
      window.removeEventListener("unhandledrejection", bufferRejection);

      for (const value of buffered.splice(0)) Sentry.captureException(value);
    })
    .catch(() => {
      // A blocked chunk must not leave the buffer growing for the session.
      window.removeEventListener("error", bufferError);
      window.removeEventListener("unhandledrejection", bufferRejection);
      buffered.length = 0;
    });
}

if (dsn && typeof window !== "undefined") {
  window.addEventListener("error", bufferError);
  window.addEventListener("unhandledrejection", bufferRejection);

  const schedule = () => {
    // `timeout` matters: on a busy main thread idle may never come, and
    // monitoring that never loads is worse than monitoring that loads late.
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => loadSentry(dsn), { timeout: 3000 });
    } else {
      window.setTimeout(() => loadSentry(dsn), 1000);
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}

/**
 * Required by @sentry/nextjs to instrument App Router client navigations.
 * Navigations that happen before the SDK loads are simply not instrumented —
 * acceptable at a 0.1 trace sample rate.
 */
export function onRouterTransitionStart(
  ...args: Parameters<typeof SentryTypes.captureRouterTransitionStart>
) {
  sentry?.captureRouterTransitionStart(...args);
}
