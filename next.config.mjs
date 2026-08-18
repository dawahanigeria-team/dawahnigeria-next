import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Exposes the wrangler.jsonc bindings (R2, Images, the queue DO) to `next dev`,
// so local runs hit the same cache path as production instead of a no-op stub.
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Two lockfiles exist in the monorepo (CRA root + next-app); pin the workspace
  // root so Next stops warning and traces from the right dir.
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.dawahnigeria.com" },
      { protocol: "https", hostname: "dawahnigeria.com" },
      { protocol: "https", hostname: "media.dawahnigeria.com" },
    ],
    // The catalogue's artwork is already a sized derivative: every image under
    // media.dawahnigeria.com/dc_images is 250x200 and ~30KB. Next cannot read
    // the intrinsic size of a remote image, so it generated the full default
    // ladder anyway -- the live landing page was requesting w=1920, w=2048 and
    // w=3840 of a 250px source, i.e. paying Cloudflare to upscale 15x into a
    // file bigger and blurrier than the original.
    //
    // Cloudflare bills $0.50 per 1,000 unique (image, width, quality) per
    // calendar month, and the sitemap has Googlebot walk the whole catalogue
    // every month, so that full ladder gets minted whether or not a human ever
    // looks at it. One landing page alone emitted 246 distinct transformations
    // across 13 widths.
    //
    // Serving the derivative as-is is both cheaper and sharper. The only thing
    // given up is WebP/AVIF re-encoding, worth single-digit KB on a 30KB JPEG
    // -- not worth a per-image fee. If the backend ever starts storing large
    // originals, revisit this rather than reaching for the optimiser again.
    unoptimized: true,
  },
  async redirects() {
    return [
      // Permanent: the apex is the site's most linked URL, and a 307 tells
      // search engines not to consolidate its ranking signals into the target.
      // The app has never served content at "/" and is not going to.
      { source: "/", destination: "/dawahcast", permanent: true },
      { source: "/dawahcast/home", destination: "/dawahcast", permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source-map upload only happens where an auth token exists (CI). Local and
  // preview builds skip it rather than failing.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Strip source maps from the client bundle after upload so they aren't
  // publicly served.
  widenClientFileUpload: true,
  // Routes Sentry's browser requests through the app's own origin so ad/tracker
  // blockers don't silently drop error reports.
  tunnelRoute: "/monitoring",
});
