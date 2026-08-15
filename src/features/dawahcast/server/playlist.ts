import { api } from "@/lib/api";
import type { LectureSummary } from "./landing";

export type Playlist = {
  id: string | number;
  title: string;
  description: string | undefined;
  image: string | undefined;
  owner: string | undefined;
  /** Comma-separated lecture nids referenced by the playlist. */
  lectureIds: string;
  raw: Record<string, unknown>;
};

type PlaylistRaw = Record<string, unknown> & {
  playlist_id?: string | number;
  id?: string | number;
  playlist_name?: string;
  title?: string;
  description?: string;
  playlist_image?: string;
  image?: string;
  username?: string;
  lecture_ids?: string;
  lec_ids?: string;
};

/**
 * GET /playlistApi.php?playlist_id={id}&action=single_playlist_data
 * Returns the playlist record (or an array of one).
 */
export async function getPlaylist(id: string): Promise<Playlist | null> {
  // Third endpoint using the `{ success, message, data: [...] }` envelope
  // (see also all_public_playlist_data). Unwrap it before reading fields —
  // treating the envelope as the record yields "Untitled playlist".
  const result = await api.get<
    { data?: PlaylistRaw[] } | PlaylistRaw | PlaylistRaw[]
  >(
    `/playlistApi.php?playlist_id=${encodeURIComponent(id)}&action=single_playlist_data`,
    { cache: { revalidate: 600, tags: [`playlist:${id}`] } },
  );

  const rows: PlaylistRaw[] = Array.isArray(result)
    ? result
    : Array.isArray((result as { data?: PlaylistRaw[] })?.data)
      ? ((result as { data?: PlaylistRaw[] }).data as PlaylistRaw[])
      : result
        ? [result as PlaylistRaw]
        : [];
  const raw = rows[0];
  if (!raw) return null;

  // `audio` is an array of lecture ids; the multi-nid endpoint wants them
  // comma-separated.
  const audio = (raw as Record<string, unknown>).audio;
  const lectureIds = Array.isArray(audio)
    ? audio.join(",")
    : ((raw.lecture_ids || raw.lec_ids || "") as string);

  return {
    id: (raw.playlist_id ?? raw.id ?? id) as string | number,
    title: (raw.playlist_name ||
      (raw as Record<string, unknown>).name ||
      raw.title ||
      "Untitled playlist") as string,
    description: raw.description as string | undefined,
    image: (raw.playlist_image ||
      (raw as Record<string, unknown>).playlist_thumbnail ||
      (raw as Record<string, unknown>).img ||
      raw.image) as string | undefined,
    owner: raw.username as string | undefined,
    lectureIds,
    raw,
  };
}

/**
 * GET /leclisting_multi_nid_api.php?id={comma-separated-nids}
 * Resolves the playlist's lecture ids into full lecture records.
 */
export async function getPlaylistLectures(
  multiId: string,
): Promise<LectureSummary[]> {
  if (!multiId) return [];
  return api.get<LectureSummary[]>(
    `/leclisting_multi_nid_api.php?id=${encodeURIComponent(multiId)}`,
    { cache: { revalidate: 600 } },
  );
}
