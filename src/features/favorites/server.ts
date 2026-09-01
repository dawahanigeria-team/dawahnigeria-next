import "server-only";
import { getAccessToken } from "@/features/auth/session";
import { api } from "@/lib/api";
import type { LectureSummary } from "@/features/dawahcast/server/landing";

export type FavoriteType = "audio" | "album" | "rp" | "playlist";

/**
 * GET /leclisting_favorites.php?user_id={id}&type={type}
 *
 * Per-user → no shared cache. Same shape as a lecture listing for `audio`/
 * `album`; for `rp` it's lecturer records; for `playlist` it's playlist records.
 * We type all of them loosely as Record<string, unknown> at the boundary and
 * let each list page interpret the fields it needs.
 */
export async function getFavorites(
  userId: string,
  type: FavoriteType,
): Promise<Record<string, unknown>[]> {
  const list = await api.get<unknown>(
    `/leclisting_favorites.php?user_id=${encodeURIComponent(userId)}&type=${type}`,
    { cache: { revalidate: false }, token: (await getAccessToken()) ?? undefined },
  );
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}

export async function getFavoriteAudio(userId: string): Promise<LectureSummary[]> {
  return (await getFavorites(userId, "audio")) as unknown as LectureSummary[];
}

export async function getFavoriteAlbums(userId: string): Promise<LectureSummary[]> {
  return (await getFavorites(userId, "album")) as unknown as LectureSummary[];
}

/** Returns the lecture ids the user has favorited — used to mark cards as filled. */
export async function getFavoriteIds(
  userId: string,
  type: FavoriteType,
): Promise<Set<string>> {
  const list = await getFavorites(userId, type);
  const ids = new Set<string>();
  for (const item of list) {
    const id = item.nid ?? item.id;
    if (id !== undefined && id !== null) ids.add(String(id));
  }
  return ids;
}
