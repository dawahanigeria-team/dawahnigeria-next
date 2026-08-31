import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { env } from "@/lib/env";
import { ROUTES } from "@/lib/routes";
import {
  ALBUM_PAGES,
  FETCH_BATCH,
  LECTURE_PAGES,
  LECTURER_PAGES,
} from "@/lib/sitemapShards";
import {
  getNewLectures,
  getLecturers,
  getPlaylists,
  getRecitationAlbums,
  getCategories,
} from "@/features/dawahcast/server/listings";

/**
 * Sitemap for the dawahcast surface.
 *
 * Two things this deliberately does not do:
 *
 *  - It does not stamp `lastModified: new Date()`. A sitemap whose every
 *    `lastmod` equals the time it was fetched carries no information, and Google
 *    discounts the field entirely once it looks always-current. Entries carry a
 *    date only where the catalogue gives a real one (see `lastModifiedOf`); the
 *    rest omit it, which leaves crawl scheduling to the crawler.
 *  - It still does not enumerate the whole ~300k-item catalogue. The listing API
 *    is page-based with no "everything since X" feed, so full coverage needs a
 *    paginated catalogue endpoint on the backend. Until that exists this walks
 *    as deep as is reasonable rather than publishing eleven listing pages and
 *    calling it done.
 */

/**
 * Built on request rather than at deploy time.
 *
 * The walk below is 112 upstream requests, and this was one of only two
 * prerendered routes in the app - so it ran inside Next's 60s per-page build
 * limit, against an API whose latency from the build region is nothing like
 * ours. It exceeded that limit on all three attempts and failed the deploy.
 * Prerendering it made every deploy depend on the catalogue API being fast,
 * for a file no user waits on.
 *
 * The cost of moving it is one slow response per revalidation window, paid by
 * a crawler rather than a person. `unstable_cache` rather than the route's own
 * `revalidate` because a route can be dynamic or cached, not both: the work is
 * cached here so the route itself can stay off the build.
 */
export const dynamic = "force-dynamic";

/** A catalogue this size does not change meaningfully within a day. */
const SITEMAP_TTL_SECONDS = 60 * 60 * 24;

/** Page-based upstreams fail independently; one bad page must not empty a section. */
async function walkPages<T>(
  fetchPage: (page: number) => Promise<T[]>,
  pageCount: number,
): Promise<T[]> {
  const out: T[] = [];
  for (let start = 1; start <= pageCount; start += FETCH_BATCH) {
    const batch = Array.from(
      { length: Math.min(FETCH_BATCH, pageCount - start + 1) },
      (_, i) => start + i,
    );
    // The callback is wrapped rather than passed straight to `map`: `map` invokes
    // it as (value, index, array), and both `getLecturers(page, state)` and
    // `getRecitationAlbums(page, limit)` take a meaningful second argument — so
    // `batch.map(fetchPage)` quietly fed them the array index as a state filter
    // and a page size.
    const results = await Promise.allSettled(batch.map((page) => fetchPage(page)));
    for (const r of results) if (r.status === "fulfilled") out.push(...r.value);
  }
  return out;
}

function dedupe(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

/**
 * Pull a real modification date off a catalogue row.
 *
 * `LectureSummary.postedOn` is never populated on this endpoint — the rows come
 * back raw, carrying `updated_date` as an unparseable display string
 * ("Fri, 2026/08/14 - 13:11") and `updated_date_ts` as a Mongo extended-JSON
 * wrapper around epoch milliseconds. The timestamp is the only field here a
 * `Date` can be built from reliably, so it is tried first.
 *
 * Returns undefined rather than a guess: an omitted `lastmod` is a crawler
 * scheduling its own recrawl, whereas a wrong one actively misleads it.
 */
function lastModifiedOf(row: unknown): Date | undefined {
  const raw = row as Record<string, unknown> | null;
  if (!raw) return undefined;

  const ts = raw.updated_date_ts as
    | { $date?: { $numberLong?: string } }
    | undefined;
  const millis = Number(ts?.$date?.$numberLong);
  if (Number.isFinite(millis) && millis > 0) {
    const date = new Date(millis);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const posted = raw.postedOn;
  if (typeof posted === "string" && posted) {
    const date = new Date(posted);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return undefined;
}

const buildSitemap = unstable_cache(
  async (): Promise<MetadataRoute.Sitemap> => {
    const base = env.siteUrl;

    const staticPaths = [
      ROUTES.home,
      ROUTES.trending,
      ROUTES.new,
      ROUTES.ramadan,
      ROUTES.lecturers,
      ROUTES.recitations,
      ROUTES.videos,
      ROUTES.playlists,
      ROUTES.categories,
      ROUTES.charts,
      ROUTES.genres,
      ROUTES.more,
      ROUTES.moreRecent,
      ROUTES.moreTrending,
      ROUTES.moreRecommended,
      ROUTES.privacy,
      ROUTES.terms,
    ];

    const [lectures, lecturers, albums, playlists, categories] = await Promise.all([
      walkPages(getNewLectures, LECTURE_PAGES),
      walkPages((page) => getLecturers(page).then((r) => r.items), LECTURER_PAGES),
      // Every Quran recitation on the site is an album, so leaving these out left
      // the whole recitation catalogue reachable only by crawling listing pages.
      walkPages(getRecitationAlbums, ALBUM_PAGES),
      getPlaylists().catch(() => []),
      getCategories(100).catch(() => []),
    ]);

    return dedupe([
      ...staticPaths.map((path) => ({
        url: `${base}${path}`,
        changeFrequency: "daily" as const,
      })),
      ...lectures.map((lecture) => ({
        url: `${base}${ROUTES.lecture(lecture.nid ?? lecture.id)}`,
        lastModified: lastModifiedOf(lecture),
        changeFrequency: "weekly" as const,
      })),
      ...lecturers.map((lecturer) => ({
        url: `${base}${ROUTES.resourcePerson(lecturer.id)}`,
        changeFrequency: "weekly" as const,
      })),
      ...albums.map((album) => ({
        url: `${base}${ROUTES.album(album.nid ?? album.id)}`,
        changeFrequency: "weekly" as const,
      })),
      ...playlists
        // 228 of the ~312 public playlists currently resolve to zero tracks — the
        // detail page renders an empty track list for them on the live site too.
        // Submitting those is submitting thin pages, which costs crawl budget and
        // invites a soft-404 rather than earning an impression. They are still
        // linked from /dawahcast/playlists, so nothing becomes unreachable; they
        // simply stop being *advertised* until they have content. Drop this filter
        // once the playlist-contents endpoint is fixed.
        .filter((playlist) => playlist.trackCount > 0)
        .map((playlist) => ({
          url: `${base}${ROUTES.playlist(playlist.id)}`,
          changeFrequency: "weekly" as const,
        })),
      ...categories.map((category) => ({
        url: `${base}${ROUTES.category(category.id)}`,
        changeFrequency: "weekly" as const,
      })),
    ]);
  },
  ["dawahcast-sitemap"],
  // Keyed on nothing: there is one sitemap. The tag lets a catalogue import
  // drop it early via revalidateTag instead of waiting out the window.
  { revalidate: SITEMAP_TTL_SECONDS, tags: ["sitemap"] },
);

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
