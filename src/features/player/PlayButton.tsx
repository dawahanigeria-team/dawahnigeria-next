"use client";

import { FaPlay, FaPause } from "react-icons/fa";
import { usePlayer } from "./store";
import type { PlayerTrack } from "./types";

type Props = {
  track: PlayerTrack;
  /** Tracks to queue alongside this one (e.g. the rest of the album). */
  queue?: PlayerTrack[];
  className?: string;
  /** Override the visual variant. */
  variant?: "icon" | "round";
};

/**
 * Toggle play/pause for a specific track. If the track is already current,
 * toggles play/pause; otherwise loads it (with the provided queue) and plays.
 */
export function PlayButton({
  track,
  queue,
  className,
  variant = "icon",
}: Props) {
  const currentId = usePlayer((s) => s.track?.id);
  const playing = usePlayer((s) => s.playing);
  const playTrack = usePlayer((s) => s.playTrack);
  const togglePlay = usePlayer((s) => s.togglePlay);

  const isCurrent = currentId === track.id;
  const isPlayingThis = isCurrent && playing;

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queue);
    }
  }

  const Icon = isPlayingThis ? FaPause : FaPlay;
  const label = isPlayingThis ? `Pause ${track.title}` : `Play ${track.title}`;

  const base =
    variant === "round"
      ? "inline-flex h-10 w-10 items-center justify-center rounded-full bg-dncolor-500 text-black hover:opacity-90"
      : "inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-hover";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isPlayingThis}
      className={[base, className].filter(Boolean).join(" ")}
    >
      <Icon className={variant === "round" ? "h-4 w-4" : "h-3 w-3"} aria-hidden />
    </button>
  );
}
