import type { AlbumTrack } from "./server/audioDetail";

/**
 * Album track ordering + duration helpers, ported from CRA's
 * `utils/albumPlayback.js`.
 *
 * Lives outside `server/` because client components need it — importing a value
 * from a server module pulls `lib/env` into the browser bundle and throws.
 */

function trackTitle(track: AlbumTrack): string {
  const t = track as unknown as Record<string, unknown>;
  return String(
    t.lectitle || t.Title || t.title || t.mp3_title || "",
  );
}

function trackId(track: AlbumTrack): string {
  return String(track.nid ?? track.id ?? "");
}

/** "Dars 12", "Lesson no. 3", "Part-4" → the number. */
function sequenceFromTitle(title: string): number | null {
  const match = title.match(
    /\b(?:dars|lesson|part|episode|ep|lecture|hadith|class)\s*(?:no\.?\s*)?(?:-|:|#)?\s*(\d+)\b/i,
  );
  return match ? Number(match[1]) : null;
}

/** "(08-08-26)" → a timestamp, for series titled by recording date. */
function dateFromTitle(title: string): number | null {
  const match = title.match(
    /(?:^|\D)(\d{1,2})(?:-|\/)(\d{1,2})(?:-|\/)(\d{2}|\d{4})(?:\D|$)/,
  );
  if (!match) return null;
  const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
  const timestamp = Date.UTC(year, Number(match[2]) - 1, Number(match[1]));
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function parseTrackDuration(duration: string | number | undefined): number {
  if (typeof duration === "number") {
    return Number.isFinite(duration) ? Math.max(0, duration) : 0;
  }
  if (typeof duration !== "string" || !duration.trim()) return 0;
  const value = duration.trim();
  // "0", "0:00", "00:00:00" all mean "unknown", not "zero seconds".
  if (/^0+(?::0+){0,2}$/.test(value)) return 0;
  const parts = value.split(":").map(Number);
  if (parts.some((p) => !Number.isFinite(p))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  const seconds = Number(value);
  return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
}

export function formatTrackDuration(duration: string | number | undefined): string {
  const seconds = parseTrackDuration(duration);
  if (seconds <= 0) return "Duration updating";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

/** Total runtime across an album, rendered like live's "1h 53m". */
export function formatTotalDuration(tracks: AlbumTrack[]): string {
  const total = tracks.reduce(
    (sum, t) =>
      sum +
      parseTrackDuration(
        (t.mp3_duration ?? t.duration) as string | number | undefined,
      ),
    0,
  );
  if (total <= 0) return "";
  const hours = Math.floor(total / 3600);
  // Floor, not round — the live site reports 1h 53m for a total that rounds
  // up to 54, so it truncates the trailing seconds rather than rounding them.
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * Deduplicate, then order oldest-first — the order the live site labels
 * "Oldest first". Falls through four keys in turn: an explicit track number, a
 * "Dars 12"-style sequence in the title, a date in the title, then the numeric
 * id, so a series plays in teaching order rather than upload order.
 */
export function orderAlbumTracks(tracks: AlbumTrack[]): AlbumTrack[] {
  const unique = tracks.filter((track, index, source) => {
    const id = trackId(track);
    const title = trackTitle(track);
    return (
      source.findIndex(
        (c) => trackId(c) === id && trackTitle(c) === title,
      ) === index
    );
  });

  return unique
    .map((track, sourceIndex) => ({ track, sourceIndex }))
    .sort((left, right) => {
      const a = left.track as unknown as Record<string, unknown>;
      const b = right.track as unknown as Record<string, unknown>;

      const aNum = Number(a.track_number ?? a.trackNumber);
      const bNum = Number(b.track_number ?? b.trackNumber);
      if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
        return aNum - bNum;
      }

      const aSeq = sequenceFromTitle(trackTitle(left.track));
      const bSeq = sequenceFromTitle(trackTitle(right.track));
      if (aSeq != null && bSeq != null && aSeq !== bSeq) return aSeq - bSeq;

      const aDate = dateFromTitle(trackTitle(left.track));
      const bDate = dateFromTitle(trackTitle(right.track));
      if (aDate != null && bDate != null && aDate !== bDate) return aDate - bDate;

      const aId = Number(left.track.nid ?? left.track.id);
      const bId = Number(right.track.nid ?? right.track.id);
      if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
        return aId - bId;
      }
      return left.sourceIndex - right.sourceIndex;
    })
    .map(({ track }) => track);
}
