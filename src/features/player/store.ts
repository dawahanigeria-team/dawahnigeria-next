"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PlayerTrack } from "./types";

export type SleepDurationMinutes = 5 | 15 | 30;
export type RepeatMode = "off" | "one" | "all";
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

type PlayerState = {
  track: PlayerTrack | null;
  queue: PlayerTrack[];
  playing: boolean;
  /** Last-known playback position in seconds. Persisted to resume after refresh. */
  position: number;
  duration: number;
  /** Epoch ms when the sleep timer should stop playback. null = no timer. */
  sleepTimerEndsAt: number | null;
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
  /**
   * Message shown in the player bar when a track cannot be played, e.g. the
   * catalogue points at a file the media server no longer holds. Not persisted:
   * it describes one failed attempt, not player state worth restoring.
   */
  error: string | null;

  // ─── Actions ───────────────────────────────────────────────────────────────
  setError: (message: string | null) => void;
  /** Replace current track and (optionally) the queue around it. */
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setPosition: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  /** Move within the queue. No-op if no queue or at edge. */
  next: () => void;
  prev: () => void;
  /** Decide what happens at end-of-track based on repeatMode.
   *  Returns true if a new track was selected (caller leaves audio alone),
   *  false if the caller should restart the current track from 0. */
  handleEnded: () => boolean;
  /** Start/extend/cancel sleep timer. Pass null to cancel. */
  setSleepTimer: (minutes: SleepDurationMinutes | null) => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  cycleRepeatMode: () => void;
};

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      track: null,
      queue: [],
      playing: false,
      position: 0,
      duration: 0,
      sleepTimerEndsAt: null,
      playbackRate: 1,
      repeatMode: "off",
      error: null,

      setError: (message) => set({ error: message }),

      playTrack: (track, queue) =>
        set({
          track,
          queue: queue ?? [track],
          playing: true,
          // A new selection clears any message left by the previous attempt.
          error: null,
          position: 0,
          duration: 0,
        }),

      togglePlay: () => set((s) => ({ playing: !s.playing })),
      setPlaying: (playing) => set({ playing }),
      setPosition: (seconds) => set({ position: seconds }),
      setDuration: (seconds) => set({ duration: seconds }),

      next: () => {
        const { track, queue } = get();
        if (!track || !queue.length) return;
        const idx = queue.findIndex((t) => t.id === track.id);
        const nextTrack = queue[idx + 1];
        if (!nextTrack) return;
        set({ track: nextTrack, position: 0, duration: 0, playing: true });
      },

      prev: () => {
        const { track, queue } = get();
        if (!track || !queue.length) return;
        const idx = queue.findIndex((t) => t.id === track.id);
        const prevTrack = queue[idx - 1];
        if (!prevTrack) return;
        set({ track: prevTrack, position: 0, duration: 0, playing: true });
      },

      handleEnded: () => {
        const { track, queue, repeatMode } = get();
        if (!track) return false;

        if (repeatMode === "one") {
          // Caller restarts current track in place.
          return false;
        }

        const idx = queue.findIndex((t) => t.id === track.id);
        const nextTrack = queue[idx + 1];

        if (nextTrack) {
          set({ track: nextTrack, position: 0, duration: 0, playing: true });
          return true;
        }

        // No next track in queue.
        if (repeatMode === "all" && queue.length > 0) {
          // Loop back to the first track.
          set({ track: queue[0], position: 0, duration: 0, playing: true });
          return true;
        }

        // repeatMode === "off" and end of queue → stop.
        set({ playing: false });
        return true;
      },

      setSleepTimer: (minutes) =>
        set({
          sleepTimerEndsAt:
            minutes === null ? null : Date.now() + minutes * 60_000,
        }),

      setPlaybackRate: (rate) => set({ playbackRate: rate }),
      cycleRepeatMode: () =>
        set((s) => {
          const order: RepeatMode[] = ["off", "all", "one"];
          const i = order.indexOf(s.repeatMode);
          return { repeatMode: order[(i + 1) % order.length] };
        }),
    }),
    {
      name: "dn:player",
      storage: createJSONStorage(() => localStorage),
      // Don't persist `playing` — autoplay on reload is blocked by browsers.
      // Don't persist the sleep timer — it's session-scoped.
      partialize: (s) => ({
        track: s.track,
        queue: s.queue,
        position: s.position,
        playbackRate: s.playbackRate,
        repeatMode: s.repeatMode,
      }),
    },
  ),
);
