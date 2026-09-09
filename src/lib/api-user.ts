import "server-only";
import { api } from "./api";
import { getAccessToken } from "@/features/auth/session";

/**
 * The API client for calls that act on the signed-in user's own data —
 * comments, favourites, playlists, listening history.
 *
 * It exists so call sites cannot get this wrong in two specific ways.
 *
 * It attaches the bearer token itself. The upstream endpoints identify the
 * account from the token; a call that forgets it is a 401 in production, and
 * "remember to pass the token" is not a constraint a call site should carry.
 *
 * It forces `no-store`, and deliberately accepts no options at all, so a
 * caller cannot opt a user-scoped response into a shared cache. Next keys the
 * fetch cache on URL plus options, so a cached entry for one signed-in user
 * could otherwise be served to another — the read is per-user and must never
 * be shared.
 *
 * Public, cacheable reads keep using `api` directly: resolving a token there
 * would read cookies on every call and make every page dynamic.
 */
async function userInit() {
  return {
    token: (await getAccessToken()) ?? undefined,
    cache: { revalidate: false as const },
  };
}

export const apiUser = {
  get: async <T>(path: string): Promise<T> =>
    api.get<T>(path, await userInit()),
  post: async <T>(path: string, body?: unknown): Promise<T> =>
    api.post<T>(path, body, await userInit()),
  patch: async <T>(path: string, body?: unknown): Promise<T> =>
    api.patch<T>(path, body, await userInit()),
  put: async <T>(path: string, body?: unknown): Promise<T> =>
    api.put<T>(path, body, await userInit()),
  delete: async <T>(path: string, body?: unknown): Promise<T> =>
    api.delete<T>(path, body, await userInit()),
};
