import { api, apiAdminister } from "@/lib/api";
import {
  preferenceQuery,
  type ListeningPreferences,
} from "@/features/preferences/server";

// ─── Shared types ────────────────────────────────────────────────────────────
// These mirror the shapes returned by the legacy PHP endpoints. They are kept
// intentionally loose (record-like) because the upstream API is untyped; tighten
// them as each consuming page is migrated.

export type LectureSummary = {
  id: string | number;
  nid?: string | number;
  title: string;
  lecturer?: string;
  image?: string;
  audio?: string;
  duration?: string | number;
  views?: string | number;
  postedOn?: string;
};

// ─── Cache tags ──────────────────────────────────────────────────────────────
// Tag groups let us revalidate related caches at once via revalidateTag().
export const LANDING_TAGS = {
  specialFeatures: "dawahcast:landing:special",
  recent: "dawahcast:landing:recent",
} as const;

// ─── Server functions ────────────────────────────────────────────────────────

/**
 * Editor-curated "special features" row.
 * Source: POST /spcl_ftr_api.php  (administer base URL)
 *
 * Revalidates every 10 minutes; tag for webhook-driven invalidation.
 */
export async function getSpecialFeaturesLectures() {
  return apiAdminister.post<LectureSummary[]>("/spcl_ftr_api.php", {
    action: "retrieve_spcl_ftr_data",
  }, {
    cache: { revalidate: 600, tags: [LANDING_TAGS.specialFeatures] },
  });
}

/**
 * Paginated "recently posted" lectures.
 * Source: GET /leclisting_recent.php?action=get_recent_audio&page=N
 *
 * 60s revalidate keeps the firehose fresh without hammering upstream.
 */
export async function getRecentlyPosted(
  page = 1,
  preferences?: ListeningPreferences,
) {
  return api.get<LectureSummary[]>(
    `/leclisting_recent.php?action=get_recent_audio&page=${page}${
      preferences ? preferenceQuery(preferences) : ""
    }`,
    { cache: { revalidate: 60, tags: [LANDING_TAGS.recent] } },
  );
}

/**
 * Default "recently viewed" content for anonymous visitors.
 * Source: GET /leclisting_lang.php?langid=6&page=N
 *
 * Anonymous + paginated → safe to cache across users.
 */
export async function getRecentlyViewedAnonymous(page = 1) {
  return api.get<LectureSummary[]>(
    `/leclisting_lang.php?langid=6&page=${page}`,
    { cache: { revalidate: 60 } },
  );
}

/**
 * Authenticated user's recently viewed history.
 * Source: GET /recentApi.php?user_id=X&action=get_recent
 *
 * Per-user data → MUST NOT be cached across users.
 * Hard-coded to no-store; do not change without re-keying by userId.
 */
export async function getRecentlyViewedForUser(userId: string) {
  return api.get<Array<{ data: Record<string, LectureSummary> }>>(
    `/recentApi.php?user_id=${encodeURIComponent(userId)}&action=get_recent`,
    { cache: { revalidate: false } },
  );
}

/**
 * Resolve a comma-separated list of album NIDs to full album records.
 * Source: GET /albumlisting_multi_nid_api.php?id=X,Y,Z
 */
export async function getAlbumsByNids(nids: string) {
  return api.get<LectureSummary[]>(
    `/albumlisting_multi_nid_api.php?id=${encodeURIComponent(nids)}`,
    { cache: { revalidate: 300 } },
  );
}
