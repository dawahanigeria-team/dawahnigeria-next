import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/** Hosts allowed to be crawled. Everything else serves the same content as a preview. */
const INDEXABLE_HOSTS = new Set(["dawahnigeria.com", "www.dawahnigeria.com"]);

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
    rules: [
      indexable
        ? { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS }
        : { userAgent: "*", disallow: "/" },
    ],
    // Always the canonical site's sitemap — a preview host should never
    // advertise its own copy.
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
