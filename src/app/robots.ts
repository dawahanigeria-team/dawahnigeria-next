import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/** Hosts allowed to be crawled. Everything else serves the same content as a preview. */
const INDEXABLE_HOSTS = new Set(["dawahnigeria.com", "www.dawahnigeria.com"]);

/**
 * Decided per host rather than per build, because one bundle is served from
 * beta.dawahnigeria.com and the workers.dev URL as well as production. Letting a
 * preview host be crawled would put a second copy of the whole catalogue into
 * the index, competing with the real site for its own pages.
 *
 * Reading the host makes this route dynamic, which for a robots.txt costs
 * nothing worth measuring.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host")?.toLowerCase().split(":")[0] ?? "";
  const indexable = INDEXABLE_HOSTS.has(host);

  return {
    rules: [
      indexable
        ? { userAgent: "*", allow: "/" }
        : { userAgent: "*", disallow: "/" },
    ],
    // Always the canonical site's sitemap — a preview host should never
    // advertise its own copy.
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
