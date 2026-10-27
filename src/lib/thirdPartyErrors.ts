/**
 * Recognises errors thrown by the embedded Tawk.to widget.
 *
 * Ported from the CRA `utils/thirdPartyErrors.js`. Tawk generates a steady
 * trickle of cookie/CORS/resource failures from inside its own iframes that we
 * can neither fix nor act on; without this filter they drown the Sentry issue
 * feed. Deliberately narrow — a message pattern only matches when the file or
 * stack also points at Tawk, so app errors that merely mention cookies survive.
 */
const TAWK_PATH_PATTERNS = [
  "tawk.to",
  "embed.tawk.to",
  "twk-",
  "twk-chunk",
  "/_s/v4/app/",
];

const TAWK_MESSAGE_PATTERNS = [
  "unable to store cookie",
  "blocked by cors policy",
  "failed to load resource",
];

function includesPattern(value: string, patterns: readonly string[]): boolean {
  const normalized = value.toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern));
}

export function isTawkError({
  message = "",
  filename = "",
  stack = "",
}: {
  message?: string;
  filename?: string;
  stack?: string;
} = {}): boolean {
  return (
    includesPattern(filename, TAWK_PATH_PATTERNS) ||
    includesPattern(stack, TAWK_PATH_PATTERNS) ||
    (includesPattern(message, TAWK_MESSAGE_PATTERNS) &&
      (includesPattern(filename, TAWK_PATH_PATTERNS) ||
        includesPattern(stack, TAWK_PATH_PATTERNS) ||
        message.toLowerCase().includes("tawk")))
  );
}

/**
 * The subset of a captured exception these checks need.
 *
 * Deliberately structural rather than imported from either SDK: PostHog's
 * `$exception_list` entries and Sentry's `event.exception.values` entries
 * agree on `value` and `stacktrace.frames`, so one shape serves both reporters.
 */
export type CapturedException = {
  type?: unknown;
  value?: unknown;
  stacktrace?: { frames?: Array<{ filename?: string; function?: string }> } | null;
};

/**
 * The browser's sentinel for "a script from another origin threw".
 *
 * A cross-origin script only reports its real message, file and line to
 * `window.onerror` when it was served with CORS headers *and* loaded with a
 * `crossorigin` attribute. Otherwise the browser blanks all three and passes
 * this literal string with no Error object, so the reporter has nothing to
 * symbolicate — no frame, no file, no line.
 */
const OPAQUE_CROSS_ORIGIN_MESSAGE = /^Script error\.?$/;

/**
 * True for an exception that carries the cross-origin sentinel and no stack.
 *
 * In practice on this site these are injected by the visitor's browser rather
 * than by the page: the affected user agents are almost entirely Phoenix
 * Browser (`PHX/*`, the default on many TECNO/Infinix/itel handsets) and
 * MiuiBrowser, which run their own scripts against every page and re-run them
 * on each App Router navigation — hence bursts of identical reports firing
 * just before each `$pageview`.
 *
 * Nothing in this app can be cross-origin: its chunks are same-origin, and
 * posthog-js loads its own extensions with `crossOrigin="anonymous"`. So a
 * report matching this shape is never ours, and never actionable.
 * `@sentry/core` drops it in its default `eventFilters` for the same reason;
 * this is the equivalent for PostHog, which ships no such default.
 *
 * The stack check keeps the match narrow: a genuine same-origin throw always
 * arrives with frames, so it survives even if it somehow carried this message.
 */
export function isOpaqueCrossOriginError(
  exception: CapturedException | undefined,
): boolean {
  if (!exception) return false;
  const value = typeof exception.value === "string" ? exception.value : "";
  if (!OPAQUE_CROSS_ORIGIN_MESSAGE.test(value.trim())) return false;
  return !exception.stacktrace?.frames?.length;
}

/**
 * Joins a captured stack into the single string `isTawkError` matches against.
 *
 * The field is `filename` and it holds the full script URL. That is only true
 * client-side: posthog-js builds frames as
 * `{ platform, filename, function, in_app, lineno, colno }`, and ingestion
 * later rewrites `filename` to a host-stripped `source`. `before_send` runs
 * before that rewrite, so `filename` is the field to read here — reading
 * `source` (what the PostHog UI shows) would silently never match.
 */
function framesToStack(exception: CapturedException): string {
  const frames = exception.stacktrace?.frames ?? [];
  return frames
    .map((frame) => `${frame?.filename ?? ""} ${frame?.function ?? ""}`)
    .join("\n");
}

/**
 * True for an exception thrown inside the embedded Tawk.to widget.
 *
 * The PostHog-shaped counterpart of the check `instrumentation-client.ts`
 * already applies to Sentry, so both reporters hold the same line on the same
 * third party rather than one seeing noise the other hides.
 *
 * Tawk's frames arrive with `in_app: true` — it is loaded as a classic script
 * into this page, so nothing in the frame metadata distinguishes it. The path
 * patterns above are what separate it: its chunks live under
 * `/_s/v4/app/<hash>/js/twk-*.js` on `embed.tawk.to`.
 */
export function isTawkException(
  exception: CapturedException | undefined,
): boolean {
  if (!exception) return false;
  return isTawkError({
    message: typeof exception.value === "string" ? exception.value : "",
    stack: framesToStack(exception),
  });
}

/**
 * Scripts that iOS browsers (Firefox, and Brave on the same WebKit scaffolding)
 * inject into every page, which then run against a `window.__firefox__` the
 * browser never defined. The throw has one frame, "global code" at the page URL,
 * with no line or column: the page's own code is not on the stack.
 */
const BROWSER_INJECTED_PATTERN = /\b__firefox__\b/;

export function isBrowserInjectedScriptError(
  exception: CapturedException | undefined,
): boolean {
  const value = typeof exception?.value === "string" ? exception.value : "";
  return BROWSER_INJECTED_PATTERN.test(value);
}

/**
 * The failure messages browsers use when a request never reached the server.
 * Chrome says "Failed to fetch", Firefox "NetworkError when attempting to fetch
 * resource.", Safari "Load failed" (newer versions append the host, as in
 * "Load failed (img.dawahnigeria.com)"), and some Opera builds "network error".
 */
const NETWORK_FAILURE_PATTERN =
  /^(Failed to fetch|Load failed(?: \([^\s()]+\))?|NetworkError when attempting to fetch resource\.?|network error)$/i;

/**
 * A fetch that died on the visitor's connection. This app only fetches its own
 * origin from the browser (server actions and RSC navigations), so the report
 * says the visitor was offline or on a dropped mobile link, not that anything
 * here is broken. The UI already offers a retry.
 *
 * A failure naming another host is not ours either: Opera Touch on iOS fetches
 * the Media Session artwork from img.dawahnigeria.com with the page's `fetch`,
 * and that host sends no CORS headers, so every attempt fails.
 */
export function isClientNetworkFailure(
  exception: CapturedException | undefined,
): boolean {
  if (exception?.type !== "TypeError") return false;
  const value = typeof exception.value === "string" ? exception.value : "";
  return NETWORK_FAILURE_PATTERN.test(value.trim());
}

/**
 * A tab that outlived a deploy. Server Action ids are hashed per build, so the
 * old page posts an id the new server has never heard of and Next throws this.
 * Reloading fixes it, and nothing in the source can prevent it.
 */
export function isStaleServerAction(
  exception: CapturedException | undefined,
): boolean {
  return exception?.type === "UnrecognizedActionError";
}

/**
 * React's streaming runtime ($RS, $RC, $RR) is an inline script that swaps a
 * Suspense fallback for the streamed content by looking up placeholder nodes by
 * id. When something else has already rewritten that DOM (a translation
 * feature, a data-saver proxy, an extension) the lookup returns null and the
 * script throws. It is not the app's code, and the same sessions log hydration
 * mismatch #418 first.
 */
const REACT_STREAM_INSTRUCTIONS = /^\$R[A-Z]?$/;

export function isStreamedMarkupTampering(
  exception: CapturedException | undefined,
): boolean {
  if (exception?.type !== "TypeError") return false;
  const value = typeof exception.value === "string" ? exception.value : "";
  if (!value.includes("reading 'parentNode'")) return false;
  const frames = exception.stacktrace?.frames ?? [];
  return frames.some((frame) =>
    REACT_STREAM_INSTRUCTIONS.test(frame?.function ?? ""),
  );
}

/**
 * MetaMask's extension injects `scripts/inpage.js` into every page and rejects
 * "MetaMask extension not found" when it cannot reach its own background page.
 * This app has no wallet code. The frame cannot carry the evidence: Sentry's
 * Next.js integration rewrites the `chrome-extension://` origin to `app://`
 * before `beforeSend` runs, so the match is on the name instead.
 */
const WALLET_EXTENSION_PATTERN = /\bMetaMask\b/;

export function isWalletExtensionError(
  exception: CapturedException | undefined,
): boolean {
  const value = typeof exception?.value === "string" ? exception.value : "";
  return WALLET_EXTENSION_PATTERN.test(value);
}

/** Reports that no code in this repo can cause or fix. Sentry's `beforeSend` uses it. */
export function isUnactionableClientError(
  exception: CapturedException | undefined,
): boolean {
  return (
    isBrowserInjectedScriptError(exception) ||
    isWalletExtensionError(exception) ||
    isClientNetworkFailure(exception) ||
    isStaleServerAction(exception) ||
    isStreamedMarkupTampering(exception)
  );
}
