import "server-only";
import { cache } from "react";
import { readAccessToken, readUserCookie } from "./cookies";

/**
 * Lightweight session read for RSC. Returns the user identity from the
 * non-httpOnly user cookie (so we don't have to round-trip), plus a
 * "hasToken" hint. Use `getAccessToken()` separately when you need the bearer.
 *
 * Returns null when the visitor is not signed in.
 *
 * Wrapped in `cache()` because a single render calls this from several places
 * at once — SiteShell, the page itself, and CommentSection all ask
 * independently. Per-request memoization collapses those to one read and, more
 * usefully, guarantees they cannot disagree part-way through a render.
 */
export const getSession = cache(async function getSession(): Promise<{
  user: { id: string; email?: string; username?: string; name?: string };
  hasToken: boolean;
} | null> {
  const user = await readUserCookie();
  if (!user) return null;
  const token = await readAccessToken();
  return { user, hasToken: Boolean(token) };
});

export async function getAccessToken(): Promise<string | null> {
  return readAccessToken();
}
