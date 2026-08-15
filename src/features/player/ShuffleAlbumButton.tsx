"use client";

import { FaRandom } from "react-icons/fa";
import { usePlayer } from "./store";
import type { PlayerTrack } from "./types";

/** Fisher–Yates, matching CRA's `shuffleAlbumTracks`. */
function shuffle(tracks: PlayerTrack[]): PlayerTrack[] {
  const out = [...tracks];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Plays the collection in a random order. Shuffles once on click and hands the
 * player a reordered queue, rather than randomising each `next()` — so the
 * running order stays stable and the user can go back a track.
 */
export function ShuffleAlbumButton({ queue }: { queue: PlayerTrack[] }) {
  const playTrack = usePlayer((s) => s.playTrack);
  if (!queue.length) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const shuffled = shuffle(queue);
        playTrack(shuffled[0], shuffled);
      }}
      aria-label="Shuffle play"
      className="flex h-10 w-14 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-hover"
    >
      <FaRandom className="h-4 w-4" aria-hidden />
    </button>
  );
}
