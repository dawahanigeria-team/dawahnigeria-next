/**
 * Session-refresh primitives, deliberately free of `next/headers` and any Node
 * built-in so this module can be imported both by the app and by
 * `custom-worker.ts`, which runs in workerd ahead of the Next server.
 */

export const ACCESS_COOKIE = "dn_access";
export const REFRESH_COOKIE = "dn_refresh";
export const USER_COOKIE = "dn_user";

// Access cookie: 30 min, enough to span a session but short if leaked.
export const ACCESS_MAX_AGE = 60 * 30;
// Refresh cookie: 30 days; the typical refresh-token lifetime upstream.
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * The upstream wraps tokens under various keys (CRA had a 48-line resolver).
 * Walk the response object recursively and return the first hit.
 */
function findString(
  payload: unknown,
  keys: readonly string[],
): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v) return v;
  }
  for (const nested of ["tokens", "data", "user"]) {
    const inner = obj[nested];
    if (inner) {
      const found = findString(inner, keys);
      if (found) return found;
    }
  }
  return undefined;
}

const ACCESS_KEYS = ["accessToken", "access_token", "token", "auth_token"] as const;
const REFRESH_KEYS = ["refreshToken", "refresh_token"] as const;

export type RefreshedTokens = { access: string; refresh?: string };

/** Credentials are passed in rather than read from `process.env` — the Worker
 *  entrypoint gets them off the Cloudflare `env`, which has no `process`. */
export type UpstreamConfig = {
  baseUrl: string | undefined;
  projectId: string | undefined;
};

export async function refreshUpstream(
  refreshToken: string,
  { baseUrl, projectId }: UpstreamConfig,
): Promise<RefreshedTokens | null> {
  if (!baseUrl || !projectId) return null;

  try {
    const res = await fetch(`${baseUrl}/user_auth.php`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-project": projectId,
      },
      body: JSON.stringify({
        action: "refresh_token",
        refresh_token: refreshToken,
      }),
      // Refresh is per-request; don't let the Edge cache anything.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    const access = findString(data, ACCESS_KEYS);
    if (!access) return null;
    const refresh = findString(data, REFRESH_KEYS);
    return { access, refresh };
  } catch {
    return null;
  }
}
