import { getCloudflareContext } from "@opennextjs/cloudflare";

type CacheContext = {
  version: string;
  waitUntil: (promise: Promise<unknown>) => void;
};

function cacheContext(): CacheContext | null {
  try {
    const { env, ctx } = getCloudflareContext();
    const version = env.CF_VERSION_METADATA?.id ?? process.env.OPEN_NEXT_BUILD_ID;
    if (!version || typeof caches === "undefined") return null;
    return { version, waitUntil: (promise) => ctx.waitUntil(promise) };
  } catch {
    // Next builds and non-Workers development have no Cache API context.
    return null;
  }
}

/** Only explicitly public, unauthenticated GETs may enter a shared cache. */
export function canCachePublicRequest(
  method: string,
  token: string | undefined,
  ttl: number | false | undefined,
): ttl is number {
  return method === "GET" && !token && typeof ttl === "number" &&
    Number.isFinite(ttl) && ttl > 0;
}

/**
 * Colo-local, disposable JSON cache. No R2/KV/D1 writes or revalidation queue.
 * Entries expire by TTL (not tag invalidation), and deployments start fresh.
 * This must never be used for sessions, account data or mutations.
 */
export async function withPublicDataCache<T>(
  key: string,
  ttl: number,
  load: () => Promise<T>,
  context: CacheContext | null = cacheContext(),
): Promise<T> {
  if (!context || !Number.isFinite(ttl) || ttl <= 0) return load();

  const cacheKey = new Request(
    `https://dawahnigeria.com/__dn-data-cache/${encodeURIComponent(context.version)}/${encodeURIComponent(key)}`,
  );
  let cache: Cache | undefined;
  try {
    cache = await caches.open("dn-public-data");
    const hit = await cache.match(cacheKey);
    if (hit) {
      const storedAt = Number(hit.headers.get("x-dn-cached-at"));
      if (storedAt > 0 && Date.now() - storedAt < ttl * 1000) {
        return await hit.json() as T;
      }
    }
  } catch {
    // Cache eviction/outage/corruption must not prevent serving live data.
  }

  // Outside the cache try/catch: upstream errors must not retry a request or
  // become cached successes. In particular, never retry authentication writes.
  const value = await load();
  if (cache) {
    try {
      const failed = value && typeof value === "object" &&
        "success" in value && value.success === false;
      const body = JSON.stringify(value);
      // Keep cache payloads bounded. Large catalogue walks may bypass it.
      if (!failed && body !== undefined && body.length <= 4 * 1024 * 1024) {
        context.waitUntil(cache.put(cacheKey, new Response(body, {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${Math.ceil(ttl)}`,
            "x-dn-cached-at": String(Date.now()),
          },
        })).catch(() => {}));
      }
    } catch {
      // Serialization/cache failures are best effort, not request failures.
    }
  }
  return value;
}
