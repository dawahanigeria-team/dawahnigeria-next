"use client";

import { FaPlay, FaPause } from "react-icons/fa";
import { usePlayer } from "./store";
import type { PlayerTrack } from "./types";

type Props = {
  queue: PlayerTrack[];
  label?: string;
};

/**
 * Plays the album/playlist from the top. If a queue track is already current,
 * toggles play/pause instead so the user can use this button as the primary
 * control while a track from this collection plays.
 */
export function PlayAllButton({ queue, label = "Play all" }: Props) {
  const currentId = usePlayer((s) => s.track?.id);
  const playing = usePlayer((s) => s.playing);
  const playTrack = usePlayer((s) => s.playTrack);
  const togglePlay = usePlayer((s) => s.togglePlay);

  if (!queue.length) return null;

  const queueIds = new Set(queue.map((t) => t.id));
  const playingFromThisCollection =
    currentId !== undefined && queueIds.has(currentId);

  function onClick() {
    if (playingFromThisCollection) {
      togglePlay();
    } else {
      playTrack(queue[0], queue);
    }
  }

  const Icon = playingFromThisCollection && playing ? FaPause : FaPlay;
  const buttonLabel =
    playingFromThisCollection && playing ? "Pause" : label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={buttonLabel}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{buttonLabel}</span>
    </button>
  );
}
