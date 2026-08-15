"use server";

import { getTrendingByLanguage } from "./listings";
import type { LanguageId } from "@/lib/languages";
import type { LectureSummary } from "./landing";

/**
 * Re-fetches the home trending feed for a language.
 *
 * A Server Action rather than a route handler so the language feed stays off
 * the public API surface, and rather than a `?lang=` search param so the URL
 * doesn't change — matching the live site, where the choice lives in
 * localStorage and picking a chip re-cuts the row in place.
 */
export async function fetchTrendingForLanguage(
  languageId: LanguageId,
): Promise<LectureSummary[]> {
  try {
    return await getTrendingByLanguage(languageId, 1);
  } catch {
    // A failed re-cut should leave the row empty (the caller renders the
    // "nothing trending" copy), not blow up the page.
    return [];
  }
}
