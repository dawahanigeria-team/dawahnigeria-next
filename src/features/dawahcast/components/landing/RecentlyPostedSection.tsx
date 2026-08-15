import { getRecentlyPosted } from "../../server/landing";
import { LectureRow } from "../LectureRow";
import { ROUTES } from "@/lib/routes";

export async function RecentlyPostedSection() {
  const lectures = await getRecentlyPosted(1);
  return (
    <LectureRow
      heading="Recently Posted"
      lectures={lectures}
      moreHref={ROUTES.moreRecent}
    />
  );
}
