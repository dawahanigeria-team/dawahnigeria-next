"use server";

import { searchAll, deriveFacets, type SearchSort, type Facet } from "./server";

/**
 * Facets for the current query, used by the sidebar on /dawahcast/search.
 *
 * The sidebar lives in the layout while results live in the page, so it can't
 * receive them as props. It refetches instead — the same cached `searchAll`
 * call the page makes, so this costs a cache read, not a second upstream hit.
 */
export async function fetchSearchFacets(
  query: string,
  sort: SearchSort = "relevance",
): Promise<{ lang: Facet[]; rp: Facet[]; cat: Facet[]; alb: Facet[] }> {
  if (!query) return { lang: [], rp: [], cat: [], alb: [] };
  try {
    const res = await searchAll({ query, sort });
    return deriveFacets(res.results);
  } catch {
    return { lang: [], rp: [], cat: [], alb: [] };
  }
}
