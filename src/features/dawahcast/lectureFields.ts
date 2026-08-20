import type { LectureSummary } from "./server/landing";

/**
 * The legacy PHP endpoints return the same concepts under different keys
 * depending on which one you hit — `mp3_title` vs `Title` vs `title`,
 * `mp3_thumbnail` vs `img`, `rpname` vs `lecturer`. Resolve once here so every
 * card, row and table reads the same shape.
 */
export type ResolvedLecture = {
  id: string;
  title: string;
  lecturer?: string;
  lecturerId?: string;
  image?: string;
  /** Raw upstream duration, e.g. "00:18:45" or "0". */
  duration?: string;
  /** Direct media URL. The listing endpoints send `audio`; detail ones `mp3_url`. */
  audioUrl?: string;
  views: number;
  favorites: number;
  shares: number;
  comments: number;
  categories?: string;
};

function str(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "string" && v) return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

export type ResolvedAlbum = { id: string; title: string; image?: string };

/**
 * Album rows need their own key resolution: on these shapes `name` is the album
 * title, whereas on lecture shapes `name` is the *lecturer* — so
 * `resolveLecture` cannot be reused here.
 *
 * Extracted from `AlbumCard`, which had this inline. Keeping one copy is what
 * stops the visible grid and the structured data from disagreeing about an
 * album's title, which is exactly how /dawahcast/recitations ended up rendering
 * album names on screen while emitting an empty ItemList.
 */
export function resolveAlbum(album: LectureSummary): ResolvedAlbum {
  const raw = album as unknown as Record<string, unknown>;
  return {
    id: String(album.nid ?? album.id ?? ""),
    title: str(raw, "name", "album_name", "title") ?? "Untitled",
    image: str(raw, "alb_thumbnail", "img", "image"),
  };
}

function num(raw: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const v = raw[key];
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return 0;
}

export function resolveLecture(lecture: LectureSummary): ResolvedLecture {
  const raw = lecture as unknown as Record<string, unknown>;
  return {
    id: String(lecture.nid ?? lecture.id ?? ""),
    title:
      str(raw, "mp3_title", "lectitle", "album_name", "title", "Title") ??
      "Untitled",
    lecturer: str(raw, "lecturer", "rpname", "rp"),
    lecturerId: str(raw, "rp_id", "rpid"),
    image: str(raw, "mp3_thumbnail", "image", "img", "lec_thumbnail", "lec_img"),
    duration: str(raw, "duration", "mp3_duration"),
    audioUrl: str(raw, "mp3_url", "audio"),
    views: num(raw, "views"),
    favorites: num(raw, "favorites"),
    shares: num(raw, "share", "shares"),
    comments: num(raw, "comment", "comments"),
    categories: str(raw, "cats", "categories"),
  };
}

/**
 * Every key `resolveLecture` and `resolveAlbum` above can read.
 *
 * Kept immediately below them on purpose. Adding a lookup key to either
 * resolver without adding it here strips the column before the resolver ever
 * sees it, and the value goes quietly missing on the client — an "Untitled"
 * card rather than a crash. There is no test suite in this project to catch
 * that, so the two must be edited together.
 */
const RESOLVER_KEYS = new Set([
  "id", "nid",
  "title", "Title", "mp3_title", "lectitle", "album_name", "name",
  "lecturer", "rpname", "rp", "rp_id", "rpid",
  "image", "img", "mp3_thumbnail", "lec_thumbnail", "lec_img", "alb_thumbnail",
  "duration", "mp3_duration", "audio", "mp3_url",
  "views", "favorites", "share", "shares", "comment", "comments",
  "cats", "categories",
]);

/**
 * Listing endpoints return raw catalogue rows: ~15 columns of which the
 * resolvers read a handful. When such a row is handed to a Client Component,
 * *every* column is serialized into the RSC flight payload and shipped to the
 * browser — measured at ~64% waste on `/dawahcast/trending`, where columns like
 * `description`, `file_url` and `downloads` are read by nothing.
 *
 * Apply this at the boundary where rows cross into a Client Component, never
 * inside the shared fetchers: server-only consumers still need the full row
 * (`app/sitemap.ts` reads `updated_date_ts` for lastmod, which is deliberately
 * not in the set above).
 */
export function pickResolverFields<T extends LectureSummary>(rows: T[]): T[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(row)) {
      if (RESOLVER_KEYS.has(key)) out[key] = (row as Record<string, unknown>)[key];
    }
    return out as T;
  });
}

/**
 * Upstream durations arrive as "HH:MM:SS" (with the hour zero-padded to either
 * one or two digits), and "0" when unknown. The live site drops a zero hour and
 * the minutes' leading zero, so "00:02:53" reads as "2:53" and "0:10:44" as
 * "10:44".
 */
export function formatDuration(duration: string | undefined): string {
  if (!duration || duration === "0") return "";
  const parts = duration.split(":");
  if (parts.length !== 3) return duration;

  const [hours, minutes, seconds] = parts;
  if (Number(hours) > 0) return `${Number(hours)}:${minutes}:${seconds}`;
  return `${Number(minutes)}:${seconds}`;
}
