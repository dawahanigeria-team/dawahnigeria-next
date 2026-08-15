import * as Sentry from "@sentry/nextjs";
import { isTawkError } from "@/lib/thirdPartyErrors";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1",
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

// Required by @sentry/nextjs to instrument App Router client navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
