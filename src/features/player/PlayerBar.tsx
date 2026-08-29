"use client";

import Image from "next/image";
import Link from "next/link";
import { type RefObject } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import {
  TbPlayerSkipBackFilled,
  TbPlayerSkipForwardFilled,
  TbRewindBackward15,
  TbRewindForward15,
} from "react-icons/tb";
import { usePlayer } from "./store";
import { SleepTimerMenu } from "./SleepTimerMenu";
import { PlaybackRateMenu } from "./PlaybackRateMenu";
import { RepeatButton } from "./RepeatButton";
import { ShareButton } from "./ShareButton";
import { TrackActions } from "./TrackActions";
import { DownloadButton } from "@/features/dawahcast/components/DownloadButton";

function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.floor(seconds);
  const mm = Math.floor(total / 60);
  const ss = String(total % 60).padStart(2, "0");
  const hh = Math.floor(mm / 60);
  if (hh > 0) return `${hh}:${String(mm % 60).padStart(2, "0")}:${ss}`;
  return `${mm}:${ss}`;
}

type Props = { audioRef: RefObject<HTMLAudioElement | null> };

export function PlayerBar({ audioRef }: Props) {
  const track = usePlayer((s) => s.track);
  const playing = usePlayer((s) => s.playing);
  const togglePlay = usePlayer((s) => s.togglePlay);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const queue = usePlayer((s) => s.queue);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const error = usePlayer((s) => s.error);

  if (!track) return null;

  const idx = queue.findIndex((t) => t.id === track.id);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < queue.length - 1;

  const skipBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(
      0,
      Math.min(audio.duration || 0, audio.currentTime + delta),
    );
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
  };

  return (
    <div
      role="region"
      aria-label="Audio player"
      // CRA .layout_buttom_menue1 — positioning belongs to the shared bottom
      // bar in PlayerProvider; this is just the upper row inside it.
      className="relative w-full border-b border-[rgba(88,88,88,0.2)] px-3 pb-[0.4rem] pt-2"
    >
      {/* Full-bleed, as CRA's bar is: the title gets the width it needs instead
          of being ellipsized inside a centred 1024px column. */}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
              {track.image ? (
                <Image
                  src={track.image}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              {track.href ? (
                <Link
                  href={track.href}
                  className="block truncate text-sm font-medium text-foreground hover:underline"
                >
                  {track.title}
                </Link>
              ) : (
                <p className="truncate text-sm font-medium text-foreground">
                  {track.title}
                </p>
              )}
              {/* Replaces the lecturer line rather than adding a row: the bar is
                  fixed-height and a phone has no space for both. */}
              {error ? (
                <p role="status" className="truncate text-xs text-[#ff9d9d]">
                  {error}
                </p>
              ) : (
                track.lecturer && (
                  <p className="truncate text-xs text-muted-foreground">
                    {track.lecturer}
                  </p>
                )
              )}
            </div>
          </div>

          {/* Quick download button right in the active mobile player bar */}
          <div className="flex shrink-0 items-center sm:hidden">
            <DownloadButton
              lectureId={track.id}
              title={track.title}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-color hover:text-foreground active:scale-95"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prev}
            disabled={!hasPrev}
            aria-label="Previous track"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-hover disabled:opacity-30"
          >
            <TbPlayerSkipBackFilled className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => skipBy(-15)}
            aria-label="Rewind 15 seconds"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-hover"
          >
            <TbRewindBackward15 className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-dncolor-500 text-black hover:opacity-90"
          >
            {playing ? (
              <FaPause className="h-4 w-4" aria-hidden />
            ) : (
              <FaPlay className="ml-0.5 h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => skipBy(15)}
            aria-label="Forward 15 seconds"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-hover"
          >
            <TbRewindForward15 className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!hasNext}
            aria-label="Next track"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-hover disabled:opacity-30"
          >
            <TbPlayerSkipForwardFilled className="h-4 w-4" aria-hidden />
          </button>
          {/* Secondary controls — hidden on small screens to keep the bar legible. */}
          <div className="hidden items-center gap-1 sm:flex">
            <RepeatButton />
            <PlaybackRateMenu />
            <ShareButton />
            <TrackActions key={track.id} track={track} />
          </div>
          <SleepTimerMenu />
        </div>
      </div>

      <div className="mt-1 flex w-full items-center gap-2 text-xs tabular-nums text-muted-foreground">
        <span>{fmtTime(position)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={Math.min(position, duration || 0)}
          onChange={handleSeek}
          step={1}
          aria-label="Seek"
          className="h-1 flex-1 accent-dncolor-500"
        />
        <span>{fmtTime(duration)}</span>
      </div>
    </div>
  );
}
