/**
 * Minimal track shape the player needs. Pages that have an `AlbumTrack` map
 * into this via `toPlayerTrack()`.
 */
export type PlayerTrack = {
  id: string;
  title: string;
  lecturer: string | undefined;
  image: string | undefined;
  audioUrl: string;
  /** Optional link target for "now playing" → detail page. */
  href: string | undefined;
};
