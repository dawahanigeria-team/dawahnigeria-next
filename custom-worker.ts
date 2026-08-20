/**
 * Worker entrypoint. Wraps the OpenNext-generated handler with the transparent
 * session refresh that used to live in `src/proxy.ts`.
 *
 * Next 16 pins `proxy.ts` to the Node runtime and removed the `runtime` config
 * option, while @opennextjs/cloudflare can only compile edge middleware — so
 * the refresh runs here instead, in front of the Next server. Everything else
 * is delegated untouched.
 */

// @ts-expect-error `.open-next/worker.js` is generated at build time
import { default as openNextHandler } from "./.open-next/worker.js";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  USER_COOKIE,
  refreshUpstream,
} from "./src/features/auth/refresh";
import {
  cachePolicyFor,
  isCacheableRequest,
  languageVariant,
  readCache,
  writeCache,
} from "./src/lib/htmlCache";

// Mirrors the matcher `src/proxy.ts` used: skip Next internals, static assets,
// metadata files, and the auth pages themselves (they run before login
// completes and have no session to refresh).
const SKIP_PREFIXES = [
  "/_next/static",
  "/favicon.ico",
  "/robots.txt",
  // Covers both the index at /sitemap.xml and the `generateSitemaps` shards
  // served from /sitemap/<id>.xml.
  "/sitemap",
  "/brand",
  "/icons",
  "/auth",
];

function parseCookies(header: string | null): Map<string, string> {
  const jar = new Map<string, string>();
  if (!header) return jar;
  for (const pair of header.split(";")) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
  return jar;
}

function serializeCookie(
  name: string,
  value: string,
  maxAge: number,
  secure: boolean,
): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

/** Responses from the Next handler have immutable headers, so clone to append. */
function withSetCookies(response: Response, cookies: string[]): Response {
  if (cookies.length === 0) return response;
  const cloned = new Response(response.body, response);
  for (const cookie of cookies) cloned.headers.append("Set-Cookie", cookie);
  return cloned;
}

/**
 * Sentry's browser profiler only runs if the document that loaded the JS was
 * served with `Document-Policy: js-profiling` — without it the integration
 * initialises and silently collects nothing.
 *
 * Applied to HTML documents only. Static assets and RSC flight payloads never
 * start a profiler, and the early `Response.redirect` has no Content-Type so it
 * falls straight through. Added on the way out rather than per-branch so the
 * cached-HTML path picks it up too, and so the header is not what gets stored
 * in the Cache API entry.
 */
function withProfilingPolicy(response: Response): Response {
  if (!response.headers.get("Content-Type")?.includes("text/html")) {
    return response;
  }
  // Headers on a handler response are immutable; clone to set one.
  const cloned = new Response(response.body, response);
  cloned.headers.set("Document-Policy", "js-profiling");
  return cloned;
}

const worker = {
  async fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return withProfilingPolicy(await handleRequest(request, env, ctx));
  },
};

async function handleRequest(
  request: Request,
  env: CloudflareEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);

  // Keep a single indexable origin. This is an edge-level permanent redirect,
  // so it preserves paths and query strings without waiting for Next.js.
  if (url.hostname === "www.dawahnigeria.com") {
    url.hostname = "dawahnigeria.com";
    return Response.redirect(url, 308);
  }

  if (SKIP_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    return openNextHandler.fetch(request, env, ctx);
  }

  const jar = parseCookies(request.headers.get("Cookie"));

  // Fast path: a valid access cookie is present → nothing to do.
  // No tokens at all → anonymous visitor, no upstream call.
  const refreshToken = jar.get(REFRESH_COOKIE);
  if (jar.get(ACCESS_COOKIE) || !refreshToken) {
    // Anonymous catalogue documents are the crawler and cold-visitor path, and
    // the only responses safe to share between visitors. `isCacheableRequest`
    // re-checks the cookie jar itself, so an authed request falls straight
    // through to the Next server untouched.
    if (isCacheableRequest(request, url)) {
      const policy = cachePolicyFor(url.pathname)!;
      const origin = () => openNextHandler.fetch(request, env, ctx);
      // Entries are scoped to the deployed version: this cache survives a
      // deploy, but the asset set does not, so HTML from an earlier build
      // points at chunk hashes that now 404. Falls back to a constant off
      // Cloudflare (`wrangler dev`), where there is no version to read.
      const version = env.CF_VERSION_METADATA?.id ?? "dev";
      // The home page renders in the language this cookie names, so its
      // entries have to be separated by it or the first visitor through a
      // cold cache pins their language onto everyone else's front page.
      // Returns "" for every other path, which all render identically —
      // fragmenting those would cost hit rate and buy nothing.
      const variant = languageVariant(
        request.headers.get("Cookie"),
        url.pathname,
      );
      const cached = await readCache(
        url,
        policy,
        origin,
        (p) => ctx.waitUntil(p),
        version,
        variant,
      );
      if (cached) return cached;
      return writeCache(
        await origin(),
        url,
        policy,
        (p) => ctx.waitUntil(p),
        version,
        variant,
      );
    }
    return openNextHandler.fetch(request, env, ctx);
  }

  // Access expired but refresh present → try to refresh transparently.
  const secure = url.protocol === "https:";
  const result = await refreshUpstream(refreshToken, {
    baseUrl: env.API_BASE_URL,
    projectId: env.API_PROJECT_ID,
  });

  if (!result) {
    // Refresh genuinely failed (refresh token revoked, upstream down, etc).
    // Clear every auth cookie so the user falls back to anonymous instead of
    // looping through this codepath on every subsequent request.
    const response = await openNextHandler.fetch(request, env, ctx);
    return withSetCookies(
      response,
      [ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE].map((name) =>
        serializeCookie(name, "", 0, secure),
      ),
    );
  }

  // Rewrite the *request* cookie header so the downstream RSC render sees the
  // refreshed session in this same request — no second round-trip needed.
  jar.set(ACCESS_COOKIE, result.access);
  if (result.refresh) jar.set(REFRESH_COOKIE, result.refresh);

  const headers = new Headers(request.headers);
  headers.set(
    "Cookie",
    [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
  );

  const response = await openNextHandler.fetch(
    new Request(request, { headers }),
    env,
    ctx,
  );

  const setCookies = [
    serializeCookie(ACCESS_COOKIE, result.access, ACCESS_MAX_AGE, secure),
  ];
  if (result.refresh) {
    setCookies.push(
      serializeCookie(REFRESH_COOKIE, result.refresh, REFRESH_MAX_AGE, secure),
    );
  }
  return withSetCookies(response, setCookies);
}

export default worker;

// Re-exported so the NEXT_CACHE_DO_QUEUE binding resolves; the generated worker
// is no longer the entrypoint, so its exports do not reach wrangler on their own.
// @ts-expect-error `.open-next/worker.js` is generated at build time
export { DOQueueHandler } from "./.open-next/worker.js";
