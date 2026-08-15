import { api } from "@/lib/api";
import type { LectureSummary } from "./landing";

export type Lecturer = {
  id: string | number;
  name: string;
  image: string | undefined;
  bio: string | undefined;
  /** Totals the API reports directly — the tab labels use these, not page sizes. */
  totalAudio: number;
  totalAlbums: number;
  totalPlaylists: number;
  favorites: number;
  share: number;
  comment: number;
  raw: Record<string, unknown>;
};

function toNum(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

type LecturerRaw = Record<string, unknown> & {
  nid?: string | number;
  id?: string | number;
  rpname?: string;
  name?: string;
  img?: string;
  image?: string;
  description?: string;
  bio?: string;
};

function pickLecturer(raw: LecturerRaw): Lecturer {
  return {
    id: (raw.nid ?? raw.id) as string | number,
    name: (raw.rpname || raw.name || "Unknown lecturer") as string,
    image: (raw.img || raw.image) as string | undefined,
    bio: (raw.description || raw.bio) as string | undefined,
    totalAudio: toNum(raw.total_audio),
    totalAlbums: toNum(raw.total_albums),
    totalPlaylists: toNum(raw.total_playlist),
    favorites: toNum(raw.favorites),
    share: toNum(raw.share),
    comment: toNum(raw.comment),
    raw,
  };
}

/**
 * GET /rplisting_multi_nid_api.php?id={id}
 * Returns an array of lecturers matching the ids. We always request one.
 */
export async function getLecturer(id: string): Promise<Lecturer | null> {
  const list = await api.get<LecturerRaw[]>(
    `/rplisting_multi_nid_api.php?id=${encodeURIComponent(id)}`,
    { cache: { revalidate: 1800, tags: [`lecturer:${id}`] } },
  );
  if (!list?.length) return null;
  return pickLecturer(list[0]);
}

/**
 * GET /leclisting_rp.php?page={page}&rpid={id}
 * Lectures by this resource person, paginated.
 */
export async function getLecturerLectures(
  id: string,
  page = 1,
): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/leclisting_rp.php?page=${page}&rpid=${encodeURIComponent(id)}`,
    { cache: { revalidate: 300, tags: [`lecturer:${id}:lectures`] } },
  );
}

/**
 * GET /albumlisting_rp.php?offset=30&lim=10&page={page}&rpid={id}
 */
export async function getLecturerAlbums(
  id: string,
  page = 1,
): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/albumlisting_rp.php?offset=30&lim=10&page=${page}&rpid=${encodeURIComponent(id)}`,
    { cache: { revalidate: 600, tags: [`lecturer:${id}:albums`] } },
  );
}

/**
 * GET /playlistApi.php?action=all_public_playlist_data&rp_id={id}
 * Public playlists attributed to this resource person.
 *
 * Same `{ success, message, data }` envelope as the global playlist listing —
 * unwrap it or the result is never an array.
 */
export async function getLecturerPlaylists(
  id: string,
): Promise<Array<Record<string, unknown>>> {
  try {
    const res = await api.get<
      { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>
    >(`/playlistApi.php?action=all_public_playlist_data&rp_id=${encodeURIComponent(id)}`, {
      cache: { revalidate: 600, tags: [`lecturer:${id}:playlists`] },
    });
    return Array.isArray(res) ? res : (res?.data ?? []);
  } catch {
    return [];
  }
}
