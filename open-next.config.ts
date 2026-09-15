import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

const config = defineCloudflareConfig({
  // Only build-time prerendered data lives here, shipped as free static assets.
  // Runtime public data and anonymous HTML use the Cache API, not paid storage.
  // No ISR routes: runtime refresh is TTL-based and needs no DO queue.
  incrementalCache: staticAssetsIncrementalCache,
  queue: "dummy",
});

// Next 16 builds with Turbopack by default, and its standalone output omits
// server/instrumentation.js while still emitting the trace manifest that lists
// it — OpenNext's file tracer then dies looking for the file. Webpack emits it.
// Drop this once Turbopack standalone output includes instrumentation files.
config.buildCommand = "npx next build --webpack";

export default config;
