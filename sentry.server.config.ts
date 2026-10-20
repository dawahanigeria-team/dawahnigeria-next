import * as Sentry from "@sentry/nextjs";

// Server DSN is separate from the browser one in CRA's env layout; fall back to
// the public DSN so a single-DSN setup still reports.
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    // `next dev` against an unreachable local API reported ECONNREFUSED and
    // "bad port" fetch failures from developer machines into the prod project.
    enabled: process.env.NODE_ENV !== "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
  });
}
