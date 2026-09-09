import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/** Hosts allowed to be crawled. Everything else serves the same content as a preview. */
const INDEXABLE_HOSTS = new Set(["dawahnigeria.com", "www.dawahnigeria.com"]);

/**
 * Commercial SEO crawlers, blocked for cost rather than privacy. They walk the
 * whole catalogue, and because every lecture URL is distinct each hit misses the
 * per-colo HTML cache and pays a full render -- measured 2026-09-09 at ~14% of
 * the Worker's CPU, against a route (`/dawahcast/l/{id}`) that is already 63% of
 * it. Nothing about the site's discoverability rides on them: search engines
 * match the `*` group below, and Cloudflare prepends its own AI-crawler blocks
 * to this file before it is served.
 *
 * These are the exact product tokens seen in production; per RFC 9309 a crawler
 * only obeys the group whose token matches its own, so a vendor's other tools
 * (AhrefsSiteAudit, the SemrushBot-* variants) each need their own entry if they
 * ever show up. robots.txt is voluntary -- if either starts ignoring it, the
 * enforcing fix is a WAF rule on the user agent.
 */
const BLOCKED_CRAWLERS = ["AhrefsBot", "SemrushBot"];

/**
 * Decided per host rather than per build, because the same bundle is served
 * from the workers.dev URL as well as production. Letting a preview host be
 * crawled would put a second copy of the whole catalogue into the index,
 * competing with the real site for its own pages.
 *
 * beta.dawahnigeria.com used to be the other such host; it was retired when the
 * app went live on the apex. Keep this host-gated rather than hardcoding a
 * single allow — any future preview domain is covered without a code change.
 *
 * Reading the host makes this route dynamic, which for a robots.txt costs
 * nothing worth measuring.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host")?.toLowerCase().split(":")[0] ?? "";
  const indexable = INDEXABLE_HOSTS.has(host);

  // Per-visitor and transactional surfaces. They render nothing a crawler can
  // use (signed-out they are empty shells) and spending crawl budget on them
  // comes straight out of the catalogue's share.
  const PRIVATE_PATHS = [
    "/dawahcast/account",
    "/dawahcast/library",
    "/dawahcast/favourite",
    "/dawahcast/myplaylist",
    "/dawahcast/download",
    "/dawahcast/search",
    "/dawahcast/subscription/",
    "/dawahcast/more/recently-viewed",
    "/auth/",
    "/api/",
  ];

  return {
    // On a non-indexable host the wildcard already denies everything, so the
    // per-crawler groups would be dead weight there.
    rules: indexable
      ? [
          ...BLOCKED_CRAWLERS.map((userAgent) => ({
            userAgent,
            disallow: "/",
          })),
          { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
        ]
      : [{ userAgent: "*", disallow: "/" }],
    // Always the canonical site's sitemap — a preview host should never
    // advertise its own copy.
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
