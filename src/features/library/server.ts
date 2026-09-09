import "server-only";
import { apiUser } from "@/lib/api-user";

export type UserPlaylist = {
  id: string | number;
  name: string;
  image: string | undefined;
  count: number | undefined;
  raw: Record<string, unknown>;
};

type UserPlaylistRaw = Record<string, unknown> & {
  playlist_id?: string | number;
  id?: string | number;
  playlist_name?: string;
  name?: string;
  playlist_image?: string;
  image?: string;
  lecture_count?: number;
  count?: number;
};

/**
 * GET /playlistApi.php?user_id={id}&action=user_playlists
 *
 * Per-user → no shared cache.
 *
 * This endpoint wraps its payload — `{ success, message, data }` — and omits
 * `data` entirely on failure (`{"success":false,"message":"Invalid user ID"}`).
 * `apiUser.get` does no unwrapping; its type parameter is an unchecked assertion.
 * Iterating the envelope directly threw `list is not iterable` and took down
 * every page that calls this: library, album, lecture, playlist, new and
 * trending, for signed-in users only.
 *
 * Never throws. On six of the seven call sites the playlist menu is secondary
 * to the page's actual content, so a playlist-API failure must not be able to
 * fail the render.
 */
export async function getUserPlaylists(userId: string): Promise<UserPlaylist[]> {
  let list: UserPlaylistRaw[];
  try {
    const res = await apiUser.get<{ data?: UserPlaylistRaw[] } | UserPlaylistRaw[]>(
      `/playlistApi.php?user_id=${encodeURIComponent(userId)}&action=user_playlists`
    );
    list = Array.isArray(res) ? res : (res?.data ?? []);
  } catch {
    return [];
  }
  const seen = new Set<string>();
  const out: UserPlaylist[] = [];
  for (const raw of list) {
    const id = raw.playlist_id ?? raw.id;
    if (id === undefined || id === null) continue;
    // Upstream sometimes duplicates; CRA dedupes by name with lodash uniqBy.
    const name = (raw.playlist_name || raw.name || "Untitled") as string;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({
      id,
      name,
      image: (raw.playlist_image || raw.image) as string | undefined,
      count: (raw.lecture_count ?? raw.count) as number | undefined,
      raw,
    });
  }
  return out;
}
