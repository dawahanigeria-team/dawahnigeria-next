# Workers-only caching

Runtime public API responses and the completed sitemap use `caches.open("dn-public-data")`.
Anonymous catalogue HTML retains the existing `dn-html` Cache API layer.
There are no runtime R2, KV, D1 or revalidation-queue bindings.
Build-time prerendered pages are shipped through the OpenNext static-assets cache.

## Safety and freshness

- Only GET requests with an explicit positive TTL and no bearer token are cached.
- Authentication, account data and all mutations bypass this cache and Next's fetch cache.
- Public data expires by its existing TTL; `ApiCache.tags` are descriptive only.
  `revalidateTag` does not invalidate this Cache API layer. No public tag-based
  invalidation workflow exists today; add explicit cache purging before introducing one.
- Entries are deployment-scoped. Evictions and cache errors fall back to the upstream API.
- The Cache API is local to a Cloudflare data centre, not durable or globally replicated.
  A cold region fetches public data again. This tradeoff removes metered storage operations.

## Deploy and verify

Run `node --test tests/public-data-cache.test.mjs` (Node 22.18+), `pnpm lint`,
`pnpm typecheck`, `pnpm build`, and preview before deploying with
`pnpm exec opennextjs-cloudflare deploy`.
Check public listings, detail pages, charts, sitemap, auth pages and client navigation.
Confirm the deployed Worker has no `NEXT_INC_CACHE_R2_BUCKET` binding.

## Billing limits and cleanup

The $5 Workers subscription is not a hard spend cap: requests and CPU can exceed
the included allowance. Cache API entries and static assets do not remove this risk.
Keep an eye on measured CPU usage; per-invocation CPU limits are not monthly budget caps.

After deployment, the old `dn-dawahcast-next-cache` bucket is unused and disposable,
but preserve it until the rollback window closes. Never roll back to an R2-dependent
version after cancelling R2 without restoring that dependency.
The account also has `quranopedia-media` (12,477 objects, about 439 MB at inspection).
Do not delete that bucket or cancel account-wide R2 without the owner's decision
about that other project's media. Existing storage remains subject to R2 pricing.

The old DO class export and historical migration remain solely for deployment
compatibility; no new requests use its queue. No DO data is purged by this change.
