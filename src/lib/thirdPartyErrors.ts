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
