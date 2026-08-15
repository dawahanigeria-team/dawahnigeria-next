import "server-only";
import { api } from "@/lib/api";

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
 */
export async function getUserPlaylists(userId: string): Promise<UserPlaylist[]> {
  const list = await api.get<UserPlaylistRaw[]>(
    `/playlistApi.php?user_id=${encodeURIComponent(userId)}&action=user_playlists`,
    { cache: { revalidate: false } },
  );
  const seen = new Set<string>();
  const out: UserPlaylist[] = [];
  for (const raw of list ?? []) {
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
