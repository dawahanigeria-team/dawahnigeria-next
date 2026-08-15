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
