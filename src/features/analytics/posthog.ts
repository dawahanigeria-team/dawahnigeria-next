"use client";

import posthog from "posthog-js";
import { EVENTS, type EventName, type EventProperties } from "./events";

export { EVENTS };
export type { EventName };

/**
 * `NEXT_PUBLIC_*` reads must be written literally for Next to inline them at
 * build time — don't refactor these into a lookup.
 */
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let started = false;

/** True once init() has run with a usable key. Guards every capture below. */
export function isEnabled(): boolean {
  return started;
}

export function initPostHog() {
  if (started || typeof window === "undefined") return;
  if (!POSTHOG_KEY || !POSTHOG_HOST) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Pageviews are captured manually by <PageViewTracker>. The App Router
    // navigates without a document load, and posthog's own history hook would
    // double-count against our explicit capture (which is what CRA did — it
    // ran capture_pageview:true *and* a manual $pageview on every route).
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: false,
    enable_recording_console_log: true,
    capture_performance: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });

  // The CRA app and this rewrite report into the same PostHog project. This
  // super property is attached to every event from here so the two can be told
  // apart (and compared) while both are live.
  posthog.register({ app: "next-web" });

  started = true;
}

export function capture(event: EventName, properties: EventProperties = {}) {
  if (!started) return;
  posthog.capture(event, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

export function capturePageView(properties: EventProperties = {}) {
  if (!started) return;
  posthog.capture("$pageview", properties);
}

export function captureWebVital(metric: {
  id: string;
  name: string;
  value: number;
  rating: string;
  navigationType: string;
}) {
  if (!started) return;
  posthog.capture("web_vital", {
    ...metric,
    app: "next-web",
  });
}

export function identifyUser(
  userId: string,
  properties: EventProperties = {},
) {
  if (!started || !userId) return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (!started) return;
  posthog.reset();
}

// ─── Domain helpers ──────────────────────────────────────────────────────────
// Mirrors of the CRA helpers, retyped against this app's PlayerTrack shape.
// Property names match CRA so existing insights keep resolving.

type TrackLike = {
  id: string;
  title: string;
  lecturer?: string;
  lecturerId?: string;
  category?: string;
  duration?: number;
};

export function trackLecturePlay(track: TrackLike) {
  capture(EVENTS.LECTURE_PLAYED, {
    lecture_id: track.id,
    lecture_title: track.title,
    lecturer: track.lecturer,
    lecturer_id: track.lecturerId,
    duration: track.duration,
    category: track.category,
  });
}

export function trackLecturePause(track: TrackLike, currentTime: number) {
  capture(EVENTS.LECTURE_PAUSED, {
    lecture_id: track.id,
    lecture_title: track.title,
    current_time: currentTime,
    lecturer: track.lecturer,
  });
}

export function trackLectureView(track: TrackLike) {
  capture(EVENTS.LECTURE_VIEWED, {
    lecture_id: track.id,
    lecture_title: track.title,
    lecturer: track.lecturer,
    lecturer_id: track.lecturerId,
    category: track.category,
  });
}

export function trackLectureCompletion(
  track: TrackLike,
  listenDuration: number,
) {
  const totalDuration = track.duration;
  // CRA guards against a divide-by-zero when duration is missing/0; keep null
  // rather than emitting Infinity or NaN into the property.
  const completionRate =
    totalDuration && totalDuration > 0 ? listenDuration / totalDuration : null;

  capture(EVENTS.LECTURE_COMPLETED, {
    lecture_id: track.id,
    lecture_title: track.title,
    lecturer: track.lecturer,
    listen_duration: listenDuration,
    completion_rate: completionRate,
    total_duration: totalDuration ?? null,
  });
}

export function trackFavorite(
  item: { id: string; title: string; lecturer?: string; type?: string },
  action: "add" | "remove" = "add",
) {
  capture(
    action === "add" ? EVENTS.LECTURE_FAVORITED : EVENTS.LECTURE_UNFAVORITED,
    {
      lecture_id: item.id,
      lecture_title: item.title,
      lecturer: item.lecturer,
      // The web favourite button also covers albums, playlists and lecturers,
      // which CRA's lecture-only helper had no way to express.
      item_type: item.type,
    },
  );
}

export function trackShare(
  content: { id: string; title: string; type?: string },
  platform = "generic",
) {
  capture(EVENTS.LECTURE_SHARED, {
    content_type: content.type ?? "lecture",
    content_id: content.id,
    content_title: content.title,
    share_platform: platform,
  });
}

export function trackSearch(
  query: string,
  filters: EventProperties = {},
) {
  capture(EVENTS.SEARCH_PERFORMED, {
    search_query: query,
    ...filters,
  });
}

export function trackPlaylistCreate(playlistName: string) {
  capture(EVENTS.PLAYLIST_CREATED, { playlist_name: playlistName });
}

export function trackAddToPlaylist(
  item: { id: string; title: string },
  playlistId: string,
  playlistName?: string,
) {
  capture(EVENTS.LECTURE_ADDED_TO_PLAYLIST, {
    lecture_id: item.id,
    lecture_title: item.title,
    playlist_id: playlistId,
    playlist_name: playlistName,
  });
}
