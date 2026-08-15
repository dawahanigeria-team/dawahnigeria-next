"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  EVENTS,
  capture,
  capturePageView,
  identifyUser,
  initPostHog,
  resetUser,
} from "./posthog";

/** Mirrors the payload written by `writeSessionCookies` (non-httpOnly by design). */
type UserCookie = {
  id?: string;
  email?: string;
  username?: string;
  name?: string;
};

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function readUserCookie(): UserCookie | null {
  const raw = readCookie("dn_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Reads the one-shot auth marker and clears it so it fires exactly once. */
function consumeAuthEvent(): string | null {
  const kind = readCookie("dn_auth_event");
  if (kind) document.cookie = "dn_auth_event=; Max-Age=0; path=/";
  return kind;
}

/**
 * Keeps the PostHog identity in step with the session cookie.
 *
 * Reading the cookie client-side (rather than passing the session down from a
 * Server Component) is deliberate: touching `cookies()` in the root layout
 * would opt every route into dynamic rendering. `dn_user` is already
 * non-httpOnly for exactly this kind of use.
 */
function useIdentitySync(pathname: string) {
  const identifiedAs = useRef<string | null>(null);

  useEffect(() => {
    const user = readUserCookie();
    const userId = user?.id ?? null;
    const authEvent = consumeAuthEvent();

    if (userId && identifiedAs.current !== userId) {
      identifyUser(userId, {
        email: user?.email,
        username: user?.username,
        name: user?.name,
      });
      identifiedAs.current = userId;
      if (authEvent === "signup") capture(EVENTS.USER_SIGNED_UP);
      else if (authEvent === "login") capture(EVENTS.USER_LOGGED_IN);
      return;
    }

    // Cookie gone but we had identified → the user signed out (or the session
    // was cleared by the proxy after a failed refresh). Drop the identity so
    // subsequent events aren't attributed to them.
    if (!userId && identifiedAs.current !== null) {
      // Capture before reset, so the logout is attributed to the user who
      // performed it rather than to the fresh anonymous id. (CRA reset first,
      // which filed every logout under a new anonymous person.)
      if (authEvent === "logout") capture(EVENTS.USER_LOGGED_OUT);
      resetUser();
      identifiedAs.current = null;
    }
  }, [pathname]);
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useIdentitySync(pathname);

  useEffect(() => {
    const query = searchParams.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;

    // The App Router can re-render this on non-navigation updates; only emit
    // when the URL actually changed.
    if (lastTracked.current === fullPath) return;
    lastTracked.current = fullPath;

    capturePageView({
      $current_url: window.location.href,
      page_path: fullPath,
      page_pathname: pathname,
      page_search: query ? `?${query}` : "",
    });
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider() {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    // useSearchParams() suspends during prerender; without this boundary the
    // whole tree would be forced out of static rendering.
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
