import { getTrendingByLanguage } from "../../server/listings";
import { DEFAULT_LANGUAGE_ID } from "@/lib/languages";
import { HomeTrending } from "./HomeTrending";

/**
 * Server half of the home trending row: fetches the default (English) feed so
 * the row is populated on first paint. The client half swaps it out if the
 * visitor has a stored language preference.
 */
export async function TrendingSection() {
  const lectures = await getTrendingByLanguage(DEFAULT_LANGUAGE_ID, 1);
  return <HomeTrending initialLectures={lectures} />;
}
