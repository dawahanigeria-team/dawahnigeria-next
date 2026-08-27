import { cache } from "react";
import { connection } from "next/server";
import { api, apiAdminister } from "@/lib/api";
import {
  getListeningPreferences,
  matchesListeningPreferences,
} from "@/features/preferences/server";
import { resolveLecture } from "../lectureFields";
import { homeLanguageQuery } from "./homeLanguage";

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
 * One editor-curated group from the admin tool. The tool assigns no stable id
 * — a group is identified by its name — and each group carries its full
 * curated lecture list inline (`more`, capped around 30 upstream). Shape is
 * loose because the upstream is untyped.
 */
export type SpecialFeatureGroup = {
  name: string;
  desc?: string;
  more?: LectureSummary[];
};

/**
 * Editor-curated "special features" groups.
 * Source: POST /spcl_ftr_api.php  (administer base URL)
 *
 * Revalidates every 10 minutes; tag for webhook-driven invalidation.
 */
export async function getSpecialFeaturesLectures() {
  return apiAdminister.post<SpecialFeatureGroup[]>("/spcl_ftr_api.php", {
    action: "retrieve_spcl_ftr_data",
  }, {
    cache: { revalidate: 600, tags: [LANDING_TAGS.specialFeatures] },
  });
}

/**
 * Special-feature groups as they should be displayed: the signed-in user's
 * listening preferences applied and empty groups dropped. Shared by the
 * landing rows and /dawahcast/more/feature/[slug] so the row and its "more"
 * page always agree on what a group contains.
 *
 * Wrapped in React cache() because generateMetadata and the page body both
 * need the group, and POST responses don't get Next's fetch-cache dedupe.
 */
export const getVisibleSpecialFeatureGroups = cache(
  async function getVisibleSpecialFeatureGroups(): Promise<SpecialFeatureGroup[]> {
    const [groups, preferences] = await Promise.all([
      getSpecialFeaturesLectures(),
      getListeningPreferences(),
    ]);
    return groups
      .map((group) => ({
        ...group,
        more: preferences.configured
          ? group.more?.filter((lecture) =>
              matchesListeningPreferences(
                lecture as unknown as Record<string, unknown>,
                preferences,
              ),
            )
          : group.more,
      }))
      .filter((group) => Array.isArray(group.more) && group.more.length > 0);
  },
);

/**
 * Paginated "recently posted" lectures.
 * Source: GET /leclisting_recent.php?action=get_recent_audio&page=N
 *
 * 60s revalidate keeps the firehose fresh without hammering upstream.
 */
export async function getRecentlyPosted(page = 1) {
  return api.get<LectureSummary[]>(
    `/leclisting_recent.php?action=get_recent_audio&page=${page}${await homeLanguageQuery()}`,
    { cache: { revalidate: 60, tags: [LANDING_TAGS.recent] } },
  );
}

/** How many of the newest lectures the hero may pick from. */
const HERO_POOL_SIZE = 8;

/**
 * How often the hero's pick advances.
 *
 * Anonymous home HTML is edge-cached for 300s (`LISTING` in `lib/htmlCache`),
 * so a per-request pick would be frozen for the life of each cache entry anyway
 * while signed-in visitors — who bypass that cache — got a different hero on
 * every navigation. Advancing on a fixed clock gives both the same cadence, and
 * aligning it with the cache window means the entry that gets stored is still
 * the right one when it expires.
 */
const HERO_ROTATION_MS = 5 * 60_000;

/**
 * The lecture the home page leads with.
 *
 * Rotates rather than always taking the newest: the feed only moves when
 * something is published, so pinning the hero to index 0 left the same lecture
 * on the front page for hours at a time.
 *
 * The clock read lives here rather than in the component because `Date.now()`
 * is impure and React forbids calling it during render. `connection()` marks
 * the request-time boundary the read depends on, which is also what keeps this
 * correct if the app ever turns on Cache Components.
 */
export async function getFeaturedLecture(): Promise<LectureSummary | null> {
  await connection();

  const lectures = await getRecentlyPosted(1);
  const pool = lectures
    .filter((lecture) => {
      const resolved = resolveLecture(lecture);
      return Boolean(resolved.id && resolved.title);
    })
    .slice(0, HERO_POOL_SIZE);

  if (!pool.length) return null;

  return pool[Math.floor(Date.now() / HERO_ROTATION_MS) % pool.length];
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
