/**
 * How deep the sitemap walks the page-based catalogue endpoints.
 *
 * These live outside `app/sitemap.ts` only so they can be adjusted (and read)
 * without touching the route itself.
 *
 * Raise `LECTURE_PAGES` to index more of the catalogue. The sitemap is
 * prerendered at build time, so the cost is build duration and upstream load
 * rather than request latency — but note that ~300k lectures is roughly 10,000
 * upstream pages at 30 rows each, which is why full coverage still wants a
 * dedicated paginated feed on the backend rather than a bigger number here.
 *
 * A single sitemap is deliberate: at ~3.1k URLs we are at 6% of the 50,000-URL
 * limit, and sharding via `generateSitemaps` cannot coexist with a hand-written
 * index — Turbopack rejects the build with "Conflicting route and metadata at
 * /sitemap.xml". Shard only once the URL count actually approaches the ceiling.
 */
export const LECTURE_PAGES = 96;
export const LECTURER_PAGES = 8;
export const ALBUM_PAGES = 8;

/** Upstream pages fetched at once, so a deep walk doesn't stampede the API. */
export const FETCH_BATCH = 8;
