import { getTrendingByLanguage } from "../../server/listings";
import { DEFAULT_LANGUAGE_ID } from "@/lib/languages";
import { HomeTrending } from "./HomeTrending";
import { getListeningPreferences } from "@/features/preferences/server";
import { getRecentlyPosted } from "../../server/landing";
import { LectureRow } from "../LectureRow";

/**
 * Server half of the home trending row: fetches the default (English) feed so
 * the row is populated on first paint. The client half swaps it out if the
 * visitor has a stored language preference.
 */
export async function TrendingSection() {
  const preferences = await getListeningPreferences();
  if (preferences.configured) {
    const lectures = await getRecentlyPosted(1, preferences);
    return (
      <div className="my-1 mobile-up:my-3">
        <LectureRow
          heading="For You"
          lectures={lectures}
          limit={6}
        />
      </div>
    );
  }
  const lectures = await getTrendingByLanguage(DEFAULT_LANGUAGE_ID, 1);
  return <HomeTrending initialLectures={lectures} />;
}
