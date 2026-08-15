import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

const config = defineCloudflareConfig({
  // R2 holds the cache; the regional wrapper puts a colo-local Cache API layer
  // in front so a burst of requests in one data centre costs one R2 read.
  // "short-lived" keeps entries ~1 minute — long enough to absorb a burst,
  // short enough that it doesn't stack on top of the page's own revalidate
  // window the way "long-lived" (up to 30 min) would.
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "short-lived" }),
  queue: doQueue,
});

// Next 16 builds with Turbopack by default, and its standalone output omits
// server/instrumentation.js while still emitting the trace manifest that lists
// it — OpenNext's file tracer then dies looking for the file. Webpack emits it.
// Drop this once Turbopack standalone output includes instrumentation files.
config.buildCommand = "npx next build --webpack";

export default config;
