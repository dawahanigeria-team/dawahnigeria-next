import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import {
  ALL_LANGUAGES_ID,
  LANGUAGE_COOKIE,
  parseLanguageValue,
  rotatingLanguageId,
  type LanguageId,
} from "@/lib/languages";
import {
  getListeningPreferences,
  preferenceQuery,
} from "@/features/preferences/server";

export type HomeLanguageSource = "preferences" | "chosen" | "rotating";

export type HomeLanguage = {
  /** The language the page leads with. */
  id: LanguageId;
  /** Where it came from. The chips highlight a real choice; a rotation is not one. */
  source: HomeLanguageSource;
};

/**
 * Which language the home page speaks, resolved once per request.
 *
 * Three sources, in descending order of how much the visitor has told us:
 *
 *  1. **Saved preferences.** Signed in and configured — the strongest signal.
 *  2. **The language chip**, mirrored into a cookie by `storeLanguage`. This is
 *     the reason the cookie exists: the chips live in a client component, but
 *     the hero and "recently posted" render on the server, so localStorage
 *     alone left the two halves of one page disagreeing.
 *  3. **A rotation.** Nothing has been said, so pick a different language every
 *     few minutes rather than defaulting to one forever. Uploads are lopsided
 *     — the last 240 were 87.5% a single language — so a fixed default makes a
 *     multilingual catalogue read as a single-language platform to anyone who
 *     has not chosen yet.
 *
 * Rotating means an unchosen front page changes under the visitor, which is the
 * point: it stops the moment they touch a chip, and never resumes.
 */
export const getHomeLanguage = cache(async function getHomeLanguage(): Promise<HomeLanguage> {
  const preferences = await getListeningPreferences();
  if (preferences.configured && preferences.languageIds.length) {
    return { id: preferences.languageIds[0], source: "preferences" };
  }

  const chosen = parseLanguageValue((await cookies()).get(LANGUAGE_COOKIE)?.value);
  if (chosen !== undefined) return { id: chosen, source: "chosen" };

  // `Date.now()` is impure; this marks the request-time boundary it needs.
  await connection();
  return { id: rotatingLanguageId(Date.now()), source: "rotating" };
});

/**
 * The language filter for the landing feeds, as a query-string fragment.
 *
 * Configured visitors get every language they picked; everyone else gets the
 * single language `getHomeLanguage` resolved, so the hero, the chips and the
 * rows underneath cannot contradict each other.
 */
export async function homeLanguageQuery(): Promise<string> {
  const preferences = await getListeningPreferences();
  if (preferences.configured) return preferenceQuery(preferences);

  const { id } = await getHomeLanguage();
  return id === ALL_LANGUAGES_ID ? "" : `&language_ids=${id}`;
}
