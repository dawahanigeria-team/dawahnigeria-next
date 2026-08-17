/**
 * Edge cache for anonymous catalogue HTML.
 *
 * Why this lives in the Worker rather than as `export const revalidate` on each
 * page: `SiteShell` (in `src/app/dawahcast/layout.tsx`) calls `getSession()`,
 * and a `cookies()` read in a shared layout forces dynamic rendering for every
 * route beneath it. Page-level `revalidate` is silently overridden, which is
 * why every catalogue response ships `no-store` today. Caching in front of the
 * Next server sidesteps that without moving the session read out of the shell.
 *
 * Three rules keep it safe:
 *
 *  1. **Anonymous only.** Any auth cookie present → bypass entirely. A signed-in
 *     visitor never reads from, nor writes to, this cache, so a personalised
 *     shell can't leak to another visitor.
 *  2. **Documents only.** Next varies catalogue responses on four RSC headers.
 *     Cloudflare's cache ignores `Vary` beyond `Accept-Encoding`, so a flight
 *     payload cached under a document's URL would break client navigation. We
 *     only ever store plain document requests and never serve them to an RSC
 *     request.
 *  3. **Allowlisted paths.** Public catalogue surfaces only — never account,
 *     library, search, subscription or auth.
 */

const AUTH_COOKIES = ["dn_access", "dn_refresh", "dn_user"];

/** Query params that identify a campaign, not a document. */
const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "ref",
];

type Policy = { fresh: number; stale: number };

/** Serve-fresh and serve-stale windows, in seconds. */
const LISTING: Policy = { fresh: 300, stale: 3_600 };
const DETAIL: Policy = { fresh: 3_600, stale: 86_400 };
const STATIC: Policy = { fresh: 86_400, stale: 604_800 };

/**
 * Longest-prefix match wins, so `/dawahcast/more/recently-viewed` (private)
 * must be tested before `/dawahcast/more` (listing). Order matters here.
 */
const NEVER_CACHE = [
  "/dawahcast/account",
  "/dawahcast/library",
  "/dawahcast/favourite",
  "/dawahcast/myplaylist",
  "/dawahcast/download",
  "/dawahcast/search",
  "/dawahcast/subscription",
  "/dawahcast/more/recently-viewed",
  "/dawahcast/ramadan/leaderboard",
  "/auth",
  "/api",
];

const DETAIL_PREFIXES = [
  "/dawahcast/l/",
  "/dawahcast/a/",
  "/dawahcast/pl/",
  "/dawahcast/rp/",
  "/dawahcast/categories/",
  "/dawahcast/genres/",
  "/dawahcast/videos/",
  "/dawahcast/ramadan/year/",
];

const STATIC_PATHS = ["/dawahcast/privacy", "/dawahcast/terms"];

const LISTING_PATHS = [
  "/dawahcast",
  "/dawahcast/home",
  "/dawahcast/trending",
  "/dawahcast/new",
  "/dawahcast/lecturers",
  "/dawahcast/recitations",
  "/dawahcast/videos",
  "/dawahcast/playlists",
  "/dawahcast/categories",
  "/dawahcast/genres",
  "/dawahcast/charts",
  "/dawahcast/ramadan",
  "/dawahcast/more",
  "/dawahcast/more/recent",
  "/dawahcast/more/trending",
  "/dawahcast/more/recommended",
];

/** Marks when we stored an entry, so freshness is ours to decide, not the CDN's. */
const STORED_AT = "x-dn-cached-at";
const CACHE_STATUS = "x-dn-cache";

export function cachePolicyFor(pathname: string): Policy | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (NEVER_CACHE.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  if (STATIC_PATHS.includes(path)) return STATIC;
  if (DETAIL_PREFIXES.some((p) => path.startsWith(p))) return DETAIL;
  if (LISTING_PATHS.includes(path)) return LISTING;
  return null;
}

export function hasAuthCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return AUTH_COOKIES.some((name) =>
    new RegExp(`(?:^|;\\s*)${name}=[^;]`).test(cookieHeader),
  );
}

/**
 * True for a React Server Component payload request. Next sends the `RSC`
 * header on client navigations and appends `_rsc` when prefetching, and its
 * response is flight data rather than a document.
 */
export function isRscRequest(request: Request, url: URL): boolean {
  return request.headers.has("RSC") || url.searchParams.has("_rsc");
}

/**
 * Cache key. Explicit and document-only, so it can never collide with a flight
 * payload. Tracking params are stripped so a shared campaign link and a clean
 * one resolve to the same entry.
 */
function cacheKey(url: URL): Request {
  const key = new URL(url.toString());
  for (const param of TRACKING_PARAMS) key.searchParams.delete(param);
  key.searchParams.sort();
  key.hash = "";
  // A synthetic host keeps these entries in their own namespace, well away from
  // anything Cloudflare may cache for the real hostname.
  key.hostname = "html-cache.internal";
  key.protocol = "https:";
  return new Request(key.toString(), { method: "GET" });
}

export function isCacheableRequest(request: Request, url: URL): boolean {
  if (request.method !== "GET") return false;
  if (isRscRequest(request, url)) return false;
  if (hasAuthCookie(request.headers.get("Cookie"))) return false;
  return cachePolicyFor(url.pathname) !== null;
}

function ageOf(response: Response): number {
  const storedAt = Number(response.headers.get(STORED_AT));
  if (!Number.isFinite(storedAt) || storedAt <= 0) return Infinity;
  return (Date.now() - storedAt) / 1000;
}

/**
 * Prepare a response for storage. `Set-Cookie` is dropped (the Cache API
 * refuses to store it, and an anonymous entry must carry no session anyway),
 * and `Vary` is dropped because our key already pins the variant.
 */
function forStorage(response: Response, policy: Policy): Response {
  const stored = new Response(response.body, response);
  stored.headers.delete("Set-Cookie");
  stored.headers.delete("Vary");
  stored.headers.set(STORED_AT, String(Date.now()));
  // The Cache API evicts on this, so it spans the whole stale window; freshness
  // within that window is decided by `ageOf`, not by the CDN.
  stored.headers.set("Cache-Control", `public, s-maxage=${policy.stale}`);
  return stored;
}

/**
 * Prepare a response for the visitor.
 *
 * `Vary: Cookie` is doing real work: Cloudflare's edge cache does not support
 * varying on arbitrary headers, so its presence keeps the zone cache from
 * storing this response and handing an anonymous shell to a signed-in visitor.
 * Browsers *do* honour it, so a private browser cache stays correct across
 * login and logout.
 */
function forVisitor(response: Response, policy: Policy, status: string): Response {
  const out = new Response(response.body, response);
  out.headers.delete(STORED_AT);
  out.headers.set(
    "Cache-Control",
    `public, max-age=${policy.fresh}, stale-while-revalidate=${policy.stale}`,
  );
  const vary = out.headers.get("Vary");
  out.headers.set("Vary", vary ? `${vary}, Cookie` : "Cookie");
  out.headers.set(CACHE_STATUS, status);
  return out;
}

/**
 * Look the request up, and on a stale hit refresh it in the background so the
 * visitor never waits on the origin. Returns null when nothing usable is stored.
 */
export async function readCache(
  url: URL,
  policy: Policy,
  revalidate: () => Promise<Response>,
  waitUntil: (promise: Promise<unknown>) => void,
): Promise<Response | null> {
  const cache = await caches.open("dn-html");
  const key = cacheKey(url);
  const hit = await cache.match(key);
  if (!hit) return null;

  const age = ageOf(hit);
  if (age > policy.stale) return null;

  if (age > policy.fresh) {
    // Serve stale immediately, refill behind the response.
    waitUntil(
      revalidate()
        .then((fresh) => {
          if (fresh.status === 200) return cache.put(key, forStorage(fresh, policy));
        })
        .catch(() => {
          // A failed refresh must not surface — the visitor already has content.
        }),
    );
    return forVisitor(hit, policy, "STALE");
  }

  return forVisitor(hit, policy, "HIT");
}

/** Store a fresh origin response, and hand the visitor its own copy. */
export async function writeCache(
  response: Response,
  url: URL,
  policy: Policy,
  waitUntil: (promise: Promise<unknown>) => void,
): Promise<Response> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (response.status !== 200 || !contentType.includes("text/html")) {
    return response;
  }
  // The body can only be read once, so branch it: one copy to the cache, one to
  // the visitor.
  const [toStore, toSend] = response.body ? response.body.tee() : [null, null];
  const storable = forStorage(new Response(toStore, response), policy);
  const cache = await caches.open("dn-html");
  waitUntil(cache.put(cacheKey(url), storable));
  return forVisitor(new Response(toSend, response), policy, "MISS");
}
