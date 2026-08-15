import type * as SentryTypes from "@sentry/nextjs";

/**
 * Sentry's server SDK cannot run on Cloudflare Workers.
 *
 * `@sentry/nextjs` pulls in `@sentry/node` → `import-in-the-middle`, which
 * compiles a WebAssembly module lexer at module scope. Workers disallow runtime
 * Wasm compilation, so that promise rejects with
 *
 *   CompileError: WebAssembly.compile(): Wasm code generation disallowed by embedder
 *
 * as an unhandledRejection while the isolate starts. The isolate goes down with
 * it: the request 503s and any in-flight RSC stream is cut, which surfaces in
 * the browser as React error #412, "Connection closed". It only bites on a cold
 * start, which is why it looked intermittent.
 *
 * Both the static import and the config import are therefore skipped on
 * Workers. Browser-side Sentry is unaffected and still reports.
 *
 * Server-side reporting is off here as a result; restoring it means
 * `@sentry/cloudflare`, which is built for this runtime.
 */
const isCloudflareWorkers =
  typeof navigator !== "undefined" &&
  navigator.userAgent === "Cloudflare-Workers";

export async function register() {
  if (isCloudflareWorkers) return;

  // `proxy.ts` runs on the Node runtime in Next 16, so there is no edge config
  // to load — this app has no edge-runtime entrypoints.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

/**
 * Imported lazily for the same reason: a static `@sentry/nextjs` import would
 * evaluate the Node SDK — and its Wasm — on every runtime, Workers included.
 */
export const onRequestError: typeof SentryTypes.captureRequestError = async (
  ...args
) => {
  if (isCloudflareWorkers) return;
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...args);
};
