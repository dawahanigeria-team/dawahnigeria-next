import { ROUTES } from "@/lib/routes";
import { resolveLecture } from "@/features/dawahcast/lectureFields";
import { isPlayableUrl } from "./playableUrl";
import type { AlbumTrack } from "@/features/dawahcast/server/audioDetail";
import type { LectureSummary } from "@/features/dawahcast/server/landing";
import type { PlayerTrack } from "./types";

/**
 * Convert an upstream AlbumTrack into the player's normalized PlayerTrack.
 * Returns null when the track has no playable audio URL.
 */
export function toPlayerTrack(track: AlbumTrack): PlayerTrack | null {
  // `mp3_url` is the canonical field after normalization; older normalizers
  // may leave `audio` directly on the record.
  const audioUrl =
    (track.mp3_url as string | undefined) ||
    ((track as Record<string, unknown>).audio as string | undefined);
  if (!isPlayableUrl(audioUrl)) return null;

  const id = String(track.nid ?? track.id ?? "");
  if (!id) return null;

  const title =
    track.mp3_title || track.Title || track.title || "Untitled lecture";
  const image =
    (track as Record<string, unknown>).mp3_thumbnail as string | undefined ||
    track.img ||
    track.image;

  return {
    id,
    title,
    lecturer: track.rpname,
    image,
    audioUrl,
    href: ROUTES.lecture(id),
  };
}

/**
 * Same mapping for the listing shape (`popular_lec_api.php` and friends), which
 * carries the media URL as `audio` and is already normalized by
 * `resolveLecture`. Returns null when the row has no playable URL — some
 * listings are video or placeholder records.
 */
export function lectureToPlayerTrack(lecture: LectureSummary): PlayerTrack | null {
  const l = resolveLecture(lecture);
  // Placeholder URLs would render a play button that can only 404, so the row
  // gets no control at all rather than one that lies.
  if (!isPlayableUrl(l.audioUrl) || !l.id) return null;

  return {
    id: l.id,
    title: l.title,
    lecturer: l.lecturer,
    image: l.image,
    audioUrl: l.audioUrl,
    href: ROUTES.lecture(l.id),
  };
}

export function lectureQueue(lectures: LectureSummary[]): PlayerTrack[] {
  const out: PlayerTrack[] = [];
  for (const lecture of lectures) {
    const mapped = lectureToPlayerTrack(lecture);
    if (mapped) out.push(mapped);
  }
  return out;
}

export function toPlayerQueue(tracks: AlbumTrack[]): PlayerTrack[] {
  const out: PlayerTrack[] = [];
  for (const t of tracks) {
    const mapped = toPlayerTrack(t);
    if (mapped) out.push(mapped);
  }
  return out;
}
