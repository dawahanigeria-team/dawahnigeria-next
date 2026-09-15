import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { canCachePublicRequest, withPublicDataCache } from "../src/lib/publicDataCache.ts";

let entries;
let pending;
let cache;
let originalCaches;
let context;

beforeEach(() => {
  originalCaches = globalThis.caches;
  entries = new Map();
  pending = [];
  cache = {
    match: async (key) => entries.get(key.url)?.clone(),
    put: async (key, value) => { entries.set(key.url, value.clone()); },
  };
  globalThis.caches = { open: async () => cache };
  context = { version: "build-one", waitUntil: (work) => pending.push(work) };
});

afterEach(async () => {
  await Promise.all(pending);
  if (originalCaches === undefined) delete globalThis.caches;
  else globalThis.caches = originalCaches;
});

test("only explicit public GET TTLs are cacheable", () => {
  assert.equal(canCachePublicRequest("GET", undefined, 60), true);
  for (const method of ["POST", "PATCH", "PUT", "DELETE"]) {
    assert.equal(canCachePublicRequest(method, undefined, 60), false);
  }
  assert.equal(canCachePublicRequest("GET", "private-token", 60), false);
  for (const ttl of [false, undefined, 0, -1, NaN, Infinity]) {
    assert.equal(canCachePublicRequest("GET", undefined, ttl), false);
  }
});

test("public reads hit the cache without repeating upstream work", async () => {
  let calls = 0;
  const load = async () => { calls++; return [{ id: 6, name: "English" }]; };
  assert.deepEqual(await withPublicDataCache("languages", 60, load, context), [{ id: 6, name: "English" }]);
  await Promise.all(pending);
  assert.deepEqual(await withPublicDataCache("languages", 60, load, context), [{ id: 6, name: "English" }]);
  assert.equal(calls, 1);
});

test("cache keys isolate URLs and deployments", async () => {
  let calls = 0;
  const load = async () => ++calls;
  await withPublicDataCache("url-one", 60, load, context);
  await Promise.all(pending);
  assert.equal(await withPublicDataCache("url-two", 60, load, context), 2);
  assert.equal(await withPublicDataCache("url-one", 60, load, { ...context, version: "build-two" }), 3);
});

test("expired entries are refreshed synchronously", async () => {
  await withPublicDataCache("expired", 60, async () => "old", context);
  await Promise.all(pending);
  const [key, value] = [...entries][0];
  value.headers.set("x-dn-cached-at", String(Date.now() - 61_000));
  entries.set(key, value);
  assert.equal(await withPublicDataCache("expired", 60, async () => "fresh", context), "fresh");
});

test("without Workers context or a positive TTL reads remain uncached", async () => {
  let calls = 0;
  await withPublicDataCache("none", 60, async () => ++calls, null);
  await withPublicDataCache("none", 0, async () => ++calls, context);
  assert.equal(calls, 2);
  assert.equal(entries.size, 0);
});

test("lookup and write failures do not fail the live request", async () => {
  cache.match = async () => { throw new Error("cache unavailable"); };
  cache.put = async () => { throw new Error("write unavailable"); };
  assert.equal(await withPublicDataCache("outage", 60, async () => "live", context), "live");
  await Promise.all(pending);
  globalThis.caches.open = async () => { throw new Error("open unavailable"); };
  assert.equal(await withPublicDataCache("outage", 60, async () => "live", context), "live");
});

test("upstream exceptions are never retried or cached", async () => {
  let calls = 0;
  await assert.rejects(withPublicDataCache("failure", 60, async () => {
    calls++;
    throw new Error("upstream failed");
  }, context), /upstream failed/);
  assert.equal(calls, 1);
  assert.equal(entries.size, 0);
});

test("unsuccessful API payloads and oversized data are not cached", async () => {
  await withPublicDataCache("failure", 60, async () => ({ success: false }), context);
  await withPublicDataCache("large", 60, async () => "x".repeat(4 * 1024 * 1024), context);
  assert.equal(entries.size, 0);
});

test("sitemap lastModified dates survive JSON caching as ISO strings", async () => {
  const data = [{ url: "https://dawahnigeria.com/dawahcast", lastModified: new Date("2026-09-15") }];
  await withPublicDataCache("sitemap", 86400, async () => data, context);
  await Promise.all(pending);
  const hit = await withPublicDataCache("sitemap", 86400, async () => { throw new Error("should hit"); }, context);
  assert.equal(hit[0].lastModified, "2026-09-15T00:00:00.000Z");
});
