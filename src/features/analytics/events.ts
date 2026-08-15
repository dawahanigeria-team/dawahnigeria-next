/**
 * Event taxonomy, ported verbatim from the CRA app's `src/utils/posthog.js`.
 *
 * The names are load-bearing: existing PostHog insights, funnels and dashboards
 * query these exact strings. Do not rename one without migrating the saved
 * queries that reference it.
 */
export const EVENTS = {
  // User Authentication
  USER_SIGNED_UP: "user_signed_up",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",

  // Lecture Events
  LECTURE_VIEWED: "lecture_viewed",
  LECTURE_PLAYED: "lecture_played",
  LECTURE_PAUSED: "lecture_paused",
  LECTURE_COMPLETED: "lecture_completed",
  LECTURE_SEEKED: "lecture_seeked",

  // Engagement Events
  LECTURE_FAVORITED: "lecture_favorited",
  LECTURE_UNFAVORITED: "lecture_unfavorited",
  LECTURE_SHARED: "lecture_shared",
  LECTURE_DOWNLOADED: "lecture_downloaded",

  // Search & Discovery
  SEARCH_PERFORMED: "search_performed",
  SEARCH_RESULT_CLICKED: "search_result_clicked",
  FILTER_APPLIED: "filter_applied",

  // Navigation
  PAGE_VIEWED: "page_viewed",
  LECTURER_VIEWED: "lecturer_viewed",
  GENRE_VIEWED: "genre_viewed",
  PLAYLIST_VIEWED: "playlist_viewed",
  LEADERBOARD_CTA_CLICKED: "leaderboard_cta_clicked",
  LEADERBOARD_OPENED: "leaderboard_opened",
  LEADERBOARD_REFRESHED: "leaderboard_refreshed",
  LEADERBOARD_SHARED: "leaderboard_shared",

  // Playlist Events
  PLAYLIST_CREATED: "playlist_created",
  PLAYLIST_DELETED: "playlist_deleted",
  LECTURE_ADDED_TO_PLAYLIST: "lecture_added_to_playlist",
  LECTURE_REMOVED_FROM_PLAYLIST: "lecture_removed_from_playlist",

  // Video Events
  VIDEO_VIEWED: "video_viewed",
  VIDEO_PLAYED: "video_played",
  VIDEO_PAUSED: "video_paused",

  // Other
  COMMENT_POSTED: "comment_posted",
  LANGUAGE_CHANGED: "language_changed",
  THEME_CHANGED: "theme_changed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export type EventProperties = Record<string, unknown>;
