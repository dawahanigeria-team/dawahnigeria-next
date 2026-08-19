import { getTrendingByLanguage } from "../../server/listings";
import { getHomeLanguage } from "../../server/homeLanguage";
import { HomeTrending } from "./HomeTrending";
import { getListeningPreferences } from "@/features/preferences/server";
import { getRecentlyPosted } from "../../server/landing";
import { LectureRow } from "../LectureRow";

/**
 * Server half of the home trending row.
 *
 * The language now comes from `getHomeLanguage`, so the chips start on whatever
 * the hero and "recently posted" are already showing. Previously this always
 * rendered English while those two rendered something else entirely, and the
 * client half then refetched on mount — a visible swap on every first paint for
 * anyone with a stored choice.
 */
export async function TrendingSection() {
  const preferences = await getListeningPreferences();
  if (preferences.configured) {
    const lectures = await getRecentlyPosted(1);
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
  const { id: languageId } = await getHomeLanguage();
  const lectures = await getTrendingByLanguage(languageId, 1);
  return <HomeTrending initialLectures={lectures} initialLanguageId={languageId} />;
}
