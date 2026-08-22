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
