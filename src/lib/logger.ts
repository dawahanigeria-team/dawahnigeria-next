/**
 * Ported from the CRA `utils/logger.js`.
 *
 * Sentry is imported lazily and only off the Workers runtime. A static
 * `@sentry/nextjs` import here would reach every server module that logs, and
 * on Cloudflare that means evaluating `@sentry/node` → `import-in-the-middle`,
 * which compiles WebAssembly at module scope — disallowed on Workers, and fatal
 * to the isolate. See instrumentation.ts for the full account.
 *
 * Console output is unconditional, so nothing is lost from the Worker log;
 * capture is what's skipped there. Browser-side capture is unaffected.
 *
 * Works on both server and client.
 */
const isCloudflareWorkers =
  typeof navigator !== "undefined" &&
  navigator.userAgent === "Cloudflare-Workers";

function capture(error: unknown, context: Record<string, unknown>) {
  if (isCloudflareWorkers) return;
  // Fire-and-forget: a logging call must never reject into its caller, and the
  // CRA original was async here too.
  void import("@sentry/nextjs")
    .then((Sentry) => Sentry.captureException(error, { extra: context }))
    .catch(() => {});
}

export const logger = {
  log: (...args: unknown[]) => console.log(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),

  error: (error: unknown, context: Record<string, unknown> = {}) => {
    console.error(error, context);
    capture(error, context);
  },
};

export default logger;
