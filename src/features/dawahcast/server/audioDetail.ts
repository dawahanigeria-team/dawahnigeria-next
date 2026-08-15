import { api } from "@/lib/api";
import type { LectureSummary } from "./landing";
import { getCategoryLectures } from "./category";
import { orderAlbumTracks } from "../albumPlayback";

// Loose record per track. Only `nid`/`id` are treated as reliable;
// everything else is best-effort because the upstream is untyped.
// Note: leclistingapi.php and albumapi3.php return different field names —
// `getAlbum()` normalizes album responses into this shape.
export type AlbumTrack = LectureSummary & {
  album_name?: string;
  rpname?: string;
  Title?: string;
  mp3_title?: string;
  mp3_url?: string;
  mp3_thumbnail?: string;
  mp3_duration?: string | number;
  rpid?: string | number;
  img?: string;
};

// Shape returned by /albumapi3.php — different field names than other endpoints.
type AlbumApi3Track = {
  lectitle?: string;
  audio?: string;
  nid?: string | number;
  duration?: string | number;
  lec_img?: string;
  mp3_thumbnail?: string;
  album_name?: string;
  rp_id?: string | number;
  rp?: string;
  rp_image?: string;
};

function normalizeAlbumApi3(raw: AlbumApi3Track): AlbumTrack | null {
  if (raw.nid === undefined || raw.nid === null) return null;
  const image = raw.mp3_thumbnail || raw.lec_img;
  return {
    nid: raw.nid,
    id: raw.nid,
    mp3_title: raw.lectitle,
    title: raw.lectitle ?? "Untitled",
    mp3_url: raw.audio,
    mp3_thumbnail: image,
    img: image,
    image,
    mp3_duration: raw.duration,
    rpname: raw.rp,
    lecturer: raw.rp,
    rpid: raw.rp_id,
    album_name: raw.album_name,
  };
}

export type TrackCollection = {
  /** Display title (derived from track[0].album_name or first track title). */
  title: string;
  /** Resource-person (lecturer) name. */
  lecturer: string | undefined;
  /** Resource-person id, used to fetch related content. */
  lecturerId: string | number | undefined;
  /** Hero image URL. */
  image: string | undefined;
  /** Per-track listing. */
  tracks: AlbumTrack[];
};

function summarize(tracks: AlbumTrack[]): TrackCollection | null {
  if (!tracks?.length) return null;
  const first = tracks[0];
  // Use the album name whole. An earlier version split on "-" and took the
  // first segment, which truncated "Dr Abdur-Razaq Alaro (Yoruba translation)"
  // to "Dr Abdur" — the live site shows the full name.
  const title =
    first.album_name?.trim() || first.Title || first.title || "Untitled";
  return {
    title,
    lecturer: first.rpname,
    lecturerId: first.rpid,
    image: first.img || first.image,
    // Oldest-first, which is what the live site labels the order and what a
    // taught series needs — the upstream returns newest-first.
    tracks: orderAlbumTracks(tracks),
  };
}

/**
 * GET /leclistingapi.php?lecid={id}
 * Returns the album that contains lecture {id} (the "siblings" view used by
 * the lecture player page). Cached by lecture id for granular invalidation.
 */
export async function getLectureWithSiblings(
  lecid: string,
): Promise<TrackCollection | null> {
  const tracks = await api.get<AlbumTrack[]>(
    `/leclistingapi.php?lecid=${encodeURIComponent(lecid)}`,
    { cache: { revalidate: 300, tags: [`lecture:${lecid}`] } },
  );
  return summarize(tracks);
}

/** A single lecture, as shown on the /dawahcast/l/[id] detail page. */
export type Lecture = {
  id: string;
  title: string;
  lecturer: string | undefined;
  /** Album this lecture belongs to; live shows it under the lecturer. */
  albumName: string | undefined;
  categoryName: string | undefined;
  categoryId: string | number | undefined;
  description: string | undefined;
  postDate: string | undefined;
  image: string | undefined;
  audioUrl: string | undefined;
  duration: string | undefined;
  favorites: number;
  share: number;
  comment: number;
  downloads: number;
  views: number;
  raw: Record<string, unknown>;
};

function toNum(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

/**
 * GET /leclistingapi.php?lecid={id}
 * Despite the album-shaped endpoint, this returns a single-element array with
 * the requested lecture's full metadata. The lecture detail page renders that
 * one lecture (not a track list), mirroring the CRA's AudioDetail.
 */
export async function getLecture(lecid: string): Promise<Lecture | null> {
  const rows = await api.get<Record<string, unknown>[]>(
    `/leclistingapi.php?lecid=${encodeURIComponent(lecid)}`,
    { cache: { revalidate: 300, tags: [`lecture:${lecid}`] } },
  );
  const list = Array.isArray(rows) ? rows : [];
  // Prefer the row whose nid matches the requested id; fall back to the first.
  const raw =
    list.find((r) => String(r.nid ?? r.id) === String(lecid)) ?? list[0];
  if (!raw) return null;

  const catIdRaw = raw.cat_id;
  const categoryId = Array.isArray(catIdRaw)
    ? (catIdRaw[0] as string | number | undefined)
    : (catIdRaw as string | number | undefined);

  return {
    id: String(raw.nid ?? raw.id ?? lecid),
    title:
      (raw.Title as string) ||
      (raw.title as string) ||
      (raw.mp3_title as string) ||
      (raw.album_name as string) ||
      "Untitled",
    lecturer: (raw.rpname as string | undefined) || undefined,
    /** Album this lecture belongs to; live shows it under the lecturer. */
    albumName: (raw.album_name as string | undefined) || undefined,
    categoryName: (raw.cats as string | undefined) || undefined,
    categoryId,
    description: (raw.description as string | undefined) || undefined,
    postDate: (raw.post_date as string | undefined) || undefined,
    image:
      (raw.img as string | undefined) || (raw.lec_img as string | undefined),
    audioUrl: (raw.audio as string | undefined) || undefined,
    duration: (raw.duration as string | undefined) || undefined,
    favorites: toNum(raw.favorites),
    share: toNum(raw.share),
    comment: toNum(raw.comment),
    downloads: toNum(raw.downloads),
    views: toNum(raw.views),
    raw,
  };
}

/**
 * Lectures in the same category (the CRA's "Similar Audio" row), via
 * /genre_api.php?cat_id={id}. Returns [] when no category is known.
 */
export async function getSimilarByCategory(
  categoryId: string | number | undefined,
  excludeId?: string,
): Promise<LectureSummary[]> {
  if (categoryId === undefined || categoryId === null) return [];
  const list = await getCategoryLectures(String(categoryId));
  if (!excludeId) return list;
  return list.filter(
    (l) => String((l as LectureSummary).nid ?? (l as LectureSummary).id) !== String(excludeId),
  );
}

/**
 * GET /albumapi3.php?aid={id}&page=1
 * Returns all tracks for an album.
 */
export async function getAlbum(aid: string): Promise<TrackCollection | null> {
  const raw = await api.get<AlbumApi3Track[]>(
    `/albumapi3.php?aid=${encodeURIComponent(aid)}&page=1`,
    { cache: { revalidate: 600, tags: [`album:${aid}`] } },
  );
  const tracks: AlbumTrack[] = [];
  for (const r of raw ?? []) {
    const t = normalizeAlbumApi3(r);
    if (t) tracks.push(t);
  }
  return summarize(tracks);
}

/**
 * GET /leclisting_rp.php?page=N&lim=10&offset=30&rpid={id}
 * Related lectures by the same resource person.
 */
export async function getSimilarByLecturer(
  lecturerId: string | number,
  page = 1,
): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/leclisting_rp.php?page=${page}&lim=10&offset=30&rpid=${encodeURIComponent(String(lecturerId))}`,
    { cache: { revalidate: 600, tags: [`lecturer:${lecturerId}:similar`] } },
  );
}

/**
 * GET /albumlisting_rp.php?offset=30&lim=10&page=N&rpid={id}
 * Other albums by the same resource person.
 */
export async function getSimilarAlbums(
  lecturerId: string | number,
  page = 1,
): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/albumlisting_rp.php?offset=30&lim=10&page=${page}&rpid=${encodeURIComponent(String(lecturerId))}`,
    { cache: { revalidate: 600, tags: [`lecturer:${lecturerId}:albums`] } },
  );
}
