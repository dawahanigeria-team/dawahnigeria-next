import { getRecentlyPosted } from "../../server/landing";
import { LectureRow } from "../LectureRow";
import { ROUTES } from "@/lib/routes";
import { getListeningPreferences } from "@/features/preferences/server";

export async function RecentlyPostedSection() {
  const preferences = await getListeningPreferences();
  const lectures = await getRecentlyPosted(1);
  return (
    <LectureRow
      heading={preferences.configured ? "Fresh for You" : "Recently Posted"}
      lectures={lectures}
      moreHref={ROUTES.moreRecent}
      limit={6}
    />
  );
}
