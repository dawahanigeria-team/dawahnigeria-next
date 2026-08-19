"use client";

import type { PostHog } from "posthog-js";
import { EVENTS, type EventName, type EventProperties } from "./events";

export { EVENTS };
export type { EventName };

/**
 * `NEXT_PUBLIC_*` reads must be written literally for Next to inline them at
 * build time — don't refactor these into a lookup.
 */
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const POSTHOG_UI_HOST = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST;

/**
 * posthog-js is 233KB, and a static import put it on the critical path of every
 * page via <AnalyticsProvider> in the root layout. Analytics must never block
 * first paint, so the SDK is fetched dynamically after mount instead.
 *
 * The cost of deferring is a window between the first capture() call and the
 * bundle arriving. Rather than drop those events — the initial $pageview lands
 * squarely inside it — calls made while loading are queued and replayed in
 * order. Each closure captures its own timestamp at call time, so a replayed
 * event is still stamped when it happened, not when it was flushed.
 */
let ph: PostHog | null = null;
let loading = false;
const pending: Array<(p: PostHog) => void> = [];

function withPostHog(fn: (p: PostHog) => void) {
  if (ph) {
    fn(ph);
    return;
  }
  // Deliberately not queued before initPostHog() runs: with no key there is no
  // consumer for these events and the queue would grow unbounded.
  if (loading) pending.push(fn);
}

/** True once the SDK is loaded or on its way. Guards every capture below. */
export function isEnabled(): boolean {
  return ph !== null || loading;
}

export function initPostHog() {
  if (loading || ph || typeof window === "undefined") return;
  // Copied to locals so the narrowing survives into the async callback.
  const key = POSTHOG_KEY;
  const host = POSTHOG_HOST;
  const uiHost = POSTHOG_UI_HOST;
  if (!key || !host || !uiHost) return;

  // Set before the import resolves so a second call cannot start a second
  // init, and so withPostHog() begins queueing immediately rather than
  // dropping the events fired during the fetch.
  loading = true;

  void import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host,
        // api_host is the first-party managed proxy. Keep ui_host pointed at
        // the real EU PostHog app so toolbar and dashboard links still work.
        ui_host: uiHost,
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
        loaded: (p) => {
          if (process.env.NODE_ENV === "development") p.debug();
        },
      });

      // The CRA app and this rewrite report into the same PostHog project. This
      // super property is attached to every event from here so the two can be told
      // apart (and compared) while both are live.
      posthog.register({ app: "next-web" });

      ph = posthog;
      for (const fn of pending.splice(0)) fn(posthog);
    })
    .catch(() => {
      // A blocked or failed chunk must not strand every later call in the
      // queue. Reopening the gate also lets a subsequent init() retry.
      loading = false;
      pending.length = 0;
    });
}

export function capture(event: EventName, properties: EventProperties = {}) {
  const timestamp = new Date().toISOString();
  withPostHog((p) =>
    p.capture(event, {
      ...properties,
      timestamp,
    }),
  );
}

export function capturePageView(properties: EventProperties = {}) {
  withPostHog((p) => p.capture("$pageview", properties));
}

export function captureWebVital(metric: {
  id: string;
  name: string;
  value: number;
  rating: string;
  navigationType: string;
}) {
  withPostHog((p) =>
    p.capture("web_vital", {
      ...metric,
      app: "next-web",
    }),
  );
}

export function identifyUser(
  userId: string,
  properties: EventProperties = {},
) {
  if (!userId) return;
  withPostHog((p) => p.identify(userId, properties));
}

export function resetUser() {
  withPostHog((p) => p.reset());
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
