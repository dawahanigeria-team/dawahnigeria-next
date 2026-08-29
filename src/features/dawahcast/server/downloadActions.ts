"use server";

import { ApiError } from "@/lib/api";
import { getSession, getAccessToken } from "@/features/auth/session";
import { getDownloadLinks, type DownloadLinks } from "./listings";

export type DownloadResult =
  | { ok: true; links: DownloadLinks }
  | {
      ok: false;
      code: "unauthenticated" | "limit_reached" | "unavailable" | "upstream";
      message: string;
      /** Present on "limit_reached" so the modal can name the allowance. */
      limit?: number;
    };

/**
 * Resolves a lecture's downloadable files.
 *
 * Called from the Download press, not from opening the modal. Upstream,
 * resolving a lecture is the same act as claiming it: the endpoint hands out
 * the media URL and spends one of the caller's free monthly slots in the same
 * round trip. Fetching on open would therefore charge visitors for lectures
 * they only glanced at, and any "resolve without claiming" variant would let a
 * signed-in caller harvest URLs and download outside the quota entirely.
 *
 * The session check here is the real gate, not the button's appearance: a
 * Server Action is a public endpoint, so a signed-out caller must be refused
 * on the server even though the UI already offers them sign-in instead.
 */
export async function fetchDownloadLinks(
  lectureId: string,
): Promise<DownloadResult> {
  const session = await getSession();
  const token = session ? await getAccessToken() : null;
  if (!session || !token) {
    return {
      ok: false,
      code: "unauthenticated",
      message: "Sign in to download this lecture.",
    };
  }

  try {
    return { ok: true, links: await getDownloadLinks(lectureId, token) };
  } catch (err) {
    if (err instanceof ApiError) {
      // 401 here means the cookie outlived the access token upstream; the
      // visitor still has to sign in again, so it lands on the same panel.
      if (err.status === 401) {
        return {
          ok: false,
          code: "unauthenticated",
          message: "Your session has expired. Sign in again to download.",
        };
      }
      if (err.status === 403) {
        const payload = err.payload as {
          message?: string;
          free_download_limit?: number;
        } | null;
        return {
          ok: false,
          code: "limit_reached",
          message:
            payload?.message ??
            "You have used all your free downloads this month.",
          limit: payload?.free_download_limit,
        };
      }
      // The upstream throws — and so 500s — when a lecture has no `tbl_mp3`
      // row at all. Roughly one in ten of the catalogue is such an orphan, so
      // this is a routine outcome, not an incident.
      if (err.status >= 500) {
        return {
          ok: false,
          code: "unavailable",
          message: "This lecture has no downloadable file yet.",
        };
      }
    }
    return {
      ok: false,
      code: "upstream",
      message: "Couldn't start the download. Please try again.",
    };
  }
}
