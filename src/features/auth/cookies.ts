import { cookies } from "next/headers";
import type { Session } from "./types";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  USER_COOKIE,
} from "./refresh";

const AUTH_EVENT_COOKIE = "dn_auth_event";

const baseCookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/**
 * Persist a session to cookies. Must be called from a Server Action or
 * Route Handler — Next forbids cookie writes from inside RSC render.
 */
export async function writeSessionCookies(session: Session) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, session.accessToken, {
    ...baseCookieOpts,
    maxAge: ACCESS_MAX_AGE,
  });
  if (session.refreshToken) {
    jar.set(REFRESH_COOKIE, session.refreshToken, {
      ...baseCookieOpts,
      maxAge: REFRESH_MAX_AGE,
    });
  }
  // User profile is NOT httpOnly so the client UI can render avatars/usernames
  // without a round-trip. Tokens stay locked down.
  jar.set(
    USER_COOKIE,
    JSON.stringify({
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      name: session.user.name,
    }),
    {
      ...baseCookieOpts,
      httpOnly: false,
      maxAge: REFRESH_MAX_AGE,
    },
  );
}

export type AuthEventKind = "login" | "signup" | "logout";

/**
 * One-shot marker read (and deleted) by the client analytics layer.
 *
 * The auth actions end in `redirect()`, so the submitting form never observes
 * success — from the browser's side a login and a signup both look like "a user
 * cookie appeared". This carries the distinction across the redirect. Not
 * httpOnly (the client must read it) and short-lived; it holds no secret.
 */
export async function writeAuthEventCookie(kind: AuthEventKind) {
  const jar = await cookies();
  jar.set(AUTH_EVENT_COOKIE, kind, {
    ...baseCookieOpts,
    httpOnly: false,
    maxAge: 60,
  });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(USER_COOKIE);
}

export async function readAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

export async function readUserCookie(): Promise<{
  id: string;
  email?: string;
  username?: string;
  name?: string;
} | null> {
  const jar = await cookies();
  const raw = jar.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
