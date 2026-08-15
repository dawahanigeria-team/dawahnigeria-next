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
  },
  async redirects() {
    return [
      { source: "/", destination: "/dawahcast", permanent: false },
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
