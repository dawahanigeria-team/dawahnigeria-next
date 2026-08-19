import { getSession } from "@/features/auth/session";
import {
  getRecentlyViewedAnonymous,
  getRecentlyViewedForUser,
  getAlbumsByNids,
} from "../../server/landing";
import { LectureRow } from "../LectureRow";
import { ROUTES } from "@/lib/routes";

/**
 * Per-user variant: hits /recentApi.php?user_id=X, then resolves the recent
 * album NIDs into full records. Falls back to anonymous content if the user
 * has no recent history yet.
 */
async function authenticatedRecentlyViewed(userId: string) {
  try {
    const result = await getRecentlyViewedForUser(userId);
    const recent = result?.[0]?.data;
    if (!recent || typeof recent !== "object") return null;
    const nids = Object.keys(recent);
    if (!nids.length) return null;
    return await getAlbumsByNids(nids.join(","));
  } catch {
    return null;
  }
}

export async function RecentlyViewedSection() {
  const session = await getSession();
  const lectures = session
    ? (await authenticatedRecentlyViewed(session.user.id)) ??
      (await getRecentlyViewedAnonymous(1))
    : await getRecentlyViewedAnonymous(1);

  return (
    <LectureRow
      heading={session ? "Pick up where you left off" : "Recently Viewed"}
      lectures={lectures}
      moreHref={ROUTES.moreRecentlyViewed}
      limit={6}
    />
  );
}
