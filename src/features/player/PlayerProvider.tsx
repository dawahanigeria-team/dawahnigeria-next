"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePlayer } from "./store";
import { PlayerBar } from "./PlayerBar";
import { BottomNav } from "@/features/dawahcast/components/site-shell/BottomNav";
import {
  trackLectureCompletion,
  trackLecturePause,
  trackLecturePlay,
} from "@/features/analytics/posthog";
import type { PlayerTrack } from "./types";

/**
 * Every way `play()` can reject ends the same way for the listener: silence.
 * Only `NotAllowedError` used to reset the store, so a failed load — a 404, an
 * unsupported codec — left `playing: true`: the control showed "pause" while
 * nothing played, and nothing was logged.
 */
/** How many unplayable tracks to step over before giving up on a queue. */
const MAX_SKIPS_IN_A_ROW = 3;

function onPlayFailure(err: unknown) {
  const e = err as Error | undefined;
  // play() interrupted by a newer load; that newer call owns the state now.
  if (e?.name === "AbortError") return;
  usePlayer.getState().setPlaying(false);
  console.error(`[player] playback failed: ${e?.name}: ${e?.message}`);
}

/** PlayerTrack → the shape the analytics helpers expect. */
function forAnalytics(track: PlayerTrack) {
  return {
    id: track.id,
    title: track.title,
    lecturer: track.lecturer,
    duration: usePlayer.getState().duration || undefined,
  };
}

/**
 * Hosts the single <audio> element and bridges it to the Zustand store.
 *
 * Lifecycle:
 *   store.track changes  → load new src, optionally autoplay
 *   store.playing toggle → call .play() or .pause()
 *   <audio> ontimeupdate → mirror current time into store.position
 *   <audio> onended      → store.next()
 *   sleep timer expires  → store.setPlaying(false)
 *   navigator.mediaSession actions → forward to store
 *
 * Mounted once in the ROOT layout, not the dawahcast layout. A nested layout is
 * only preserved while navigating inside its own segment, so hosting the
 * <audio> there tore it down — and stopped playback — on any route outside
 * /dawahcast. At the root there is no layout boundary left that can unmount it.
 *
 * The bottom chrome still belongs to the app shell only: BottomNav is the
 * dawahcast tab bar and has no meaning on the auth pages, so it is gated on the
 * pathname while the audio element itself stays mounted everywhere. Audio keeps
 * playing while signing in; only the controls are hidden.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pathname = usePathname();
  const showChrome = pathname?.startsWith("/dawahcast") ?? false;
  // Swapping `src` on a playing element makes it emit `pause`. That is the
  // browser loading, not the user pausing, so the handler must ignore exactly
  // one such event or the store flips to paused and the new track never starts.
  const swappingSrc = useRef(false);
  // Guards the one-time seek to the position restored from localStorage. Not
  // state: flipping it must not re-render, and it is read in the same effect
  // that sets it.
  const restoredPosition = useRef(false);
  // Consecutive unplayable tracks, so auto-skip cannot run away down a queue
  // whose files are all missing. Reset as soon as anything plays.
  const failedInARow = useRef(0);
  // Media events can be duplicated or even dispatched synthetically by browser
  // integrations. Treat the audio element's real `paused` property as the
  // source of truth and only sync/track genuine state transitions. Without
  // this guard, one affected browser can emit thousands of alternating
  // lecture_played/lecture_paused events and exhaust PostHog's client limiter.
  const mediaIsPlaying = useRef(false);

  const track = usePlayer((s) => s.track);
  const playing = usePlayer((s) => s.playing);
  const sleepTimerEndsAt = usePlayer((s) => s.sleepTimerEndsAt);
  const playbackRate = usePlayer((s) => s.playbackRate);

  // ─── src + autoplay on track change ────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    // `audio.src` reads back as an absolute, percent-encoded URL, so comparing
    // it to the raw upstream string (many contain spaces and parentheses) is
    // never equal. Compare against what the browser resolved instead.
    const resolved = new URL(track.audioUrl, document.baseURI).href;
    if (audio.src !== resolved) {
      if (!audio.paused) swappingSrc.current = true;
      // A source change ends the previous track's playing state even in a
      // browser that omits or delays the corresponding pause event.
      mediaIsPlaying.current = false;
      audio.src = track.audioUrl;
      // Restore the persisted position, but only for the first src we load —
      // that is the track rehydrated from localStorage on a cold start.
      //
      // Every later track change already zeroes `position` in the store, so
      // reading it again here only opens a race: `timeupdate` fires ~4x/second
      // and this effect runs after paint, so an event landing in between would
      // put the *outgoing* track's timestamp back and seek the incoming track
      // to it. The flag closes that window.
      if (!restoredPosition.current) {
        restoredPosition.current = true;
        const persistedPosition = usePlayer.getState().position;
        if (persistedPosition > 0) {
          const seekOnce = () => {
            audio.currentTime = persistedPosition;
            audio.removeEventListener("loadedmetadata", seekOnce);
          };
          audio.addEventListener("loadedmetadata", seekOnce);
        }
      }
      // Selecting a track while another is already playing leaves `playing`
      // true, so the play/pause effect below never re-runs. Start it here.
      if (usePlayer.getState().playing) {
        audio.play().catch(onPlayFailure);
      }
    }
  }, [track]);

  // ─── play/pause syncing ────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(onPlayFailure);
    } else {
      audio.pause();
    }
  }, [playing]);

  // ─── playbackRate syncing ─────────────────────────────────────────────────
  // Apply rate whenever it changes OR when a new track loads (browsers reset
  // the playbackRate to 1 on src change). The `track` dep covers the second case.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.playbackRate !== playbackRate) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate, track]);

  // ─── sleep timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (sleepTimerEndsAt === null) return;
    const remaining = sleepTimerEndsAt - Date.now();
    if (remaining <= 0) {
      usePlayer.getState().setPlaying(false);
      usePlayer.getState().setSleepTimer(null);
      return;
    }
    const id = window.setTimeout(() => {
      usePlayer.getState().setPlaying(false);
      usePlayer.getState().setSleepTimer(null);
    }, remaining);
    return () => window.clearTimeout(id);
  }, [sleepTimerEndsAt]);

  // ─── MediaSession (OS lockscreen controls) ────────────────────────────────
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.lecturer ?? "DawahCast",
      artwork: track.image
        ? [{ src: track.image, sizes: "512x512", type: "image/jpeg" }]
        : undefined,
    });
    const { setPlaying, next, prev } = usePlayer.getState();
    navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
    navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
    navigator.mediaSession.setActionHandler("nexttrack", () => next());
    navigator.mediaSession.setActionHandler("previoustrack", () => prev());
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      const audio = audioRef.current;
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - 15);
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15);
      }
    });
  }, [track]);

  return (
    <>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(e) =>
          usePlayer.getState().setPosition(e.currentTarget.currentTime)
        }
        onLoadedMetadata={(e) =>
          usePlayer.getState().setDuration(e.currentTarget.duration || 0)
        }
        onEnded={() => {
          mediaIsPlaying.current = false;
          const ended = usePlayer.getState().track;
          if (ended) {
            // Reached the end, so listen duration is the full track length.
            trackLectureCompletion(
              forAnalytics(ended),
              usePlayer.getState().duration,
            );
          }
          const advanced = usePlayer.getState().handleEnded();
          if (!advanced) {
            // repeat-one: restart the current track in place.
            const audio = audioRef.current;
            if (audio) {
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }
          }
        }}
        onPlay={(e) => {
          // A synthetic/duplicate event must not mutate the store or analytics.
          if (e.currentTarget.paused || mediaIsPlaying.current) return;
          mediaIsPlaying.current = true;

          // Anything playing means the run of dead tracks is over, and clears
          // the skip notice so it does not linger over a working lecture.
          failedInARow.current = 0;
          usePlayer.getState().setError(null);
          usePlayer.getState().setPlaying(true);
          const current = usePlayer.getState().track;
          if (current) trackLecturePlay(forAnalytics(current));
        }}
        onError={() => {
          mediaIsPlaying.current = false;
          const media = audioRef.current?.error;
          console.error(
            `[player] media error ${media?.code ?? "?"}: ${media?.message || "could not load audio"}`,
          );

          // Roughly one in ten catalogue rows points at a file the media server
          // no longer holds; the request 404s to an HTML error page and the
          // element reports a format error. Stalling silently on it reads as a
          // broken site, so step over the dead track and say why.
          const { track, queue, next, setPlaying, setError } = usePlayer.getState();
          const idx = queue.findIndex((t) => t.id === track?.id);
          const hasNext = idx >= 0 && idx + 1 < queue.length;

          // Bounded: an album whose files are all missing would otherwise race
          // through every track in a fraction of a second.
          if (hasNext && failedInARow.current < MAX_SKIPS_IN_A_ROW) {
            failedInARow.current += 1;
            setError("Lecture unavailable — skipping to the next one.");
            next();
            return;
          }

          failedInARow.current = 0;
          setPlaying(false);
          setError(
            hasNext
              ? "Several lectures in a row are unavailable. Please try another."
              : "This lecture is unavailable right now.",
          );
        }}
        onPause={(e) => {
          // Some browser integrations dispatch `pause` without actually
          // pausing the media element. Ignore those events entirely.
          if (!e.currentTarget.paused) return;

          // The `pause` the browser emits while swapping src is not the user
          // pausing — consume it and leave the store alone.
          if (swappingSrc.current) {
            swappingSrc.current = false;
            mediaIsPlaying.current = false;
            return;
          }

          // Duplicate pause events are not new user actions.
          if (!mediaIsPlaying.current) return;
          mediaIsPlaying.current = false;

          usePlayer.getState().setPlaying(false);
          const current = usePlayer.getState().track;
          // The browser fires `pause` immediately before `ended`; skip that one
          // so a finished track doesn't log a pause at its own duration.
          if (current && !e.currentTarget.ended) {
            trackLecturePause(
              forAnalytics(current),
              e.currentTarget.currentTime,
            );
          }
        }}
      />
      {/* CRA .layout_buttom_menue — fixed, z-90, holds the player row above the
          four-tab bar. Shown at every width, as the live site does. App shell
          only: the <audio> above stays mounted on every route, but BottomNav is
          dawahcast navigation and would be meaningless on the auth pages. */}
      {showChrome && (
        <div className="fixed inset-x-0 bottom-0 z-[90] flex w-full flex-col bg-background">
          <PlayerBar audioRef={audioRef} />
          <BottomNav />
        </div>
      )}
    </>
  );
}
