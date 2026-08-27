import { getVisibleSpecialFeatureGroups } from "../../server/landing";
import { LectureRow } from "../LectureRow";
import { ROUTES } from "@/lib/routes";

/** Cards shown in the row; the rest live on the group's more page. */
const ROW_LIMIT = 6;

export async function SpecialFeaturesSection() {
  // The admin endpoint is intermittently 500-ing on upstream. Treat any
  // failure as "no special-feature rows today" rather than tearing down the
  // landing — the other Suspense boundaries already streamed cleanly.
  let groups;
  try {
    groups = await getVisibleSpecialFeatureGroups();
  } catch (err) {
    console.error("SpecialFeaturesSection: upstream error", err);
    return null;
  }
  if (!groups.length) return null;

  return (
    <>
      {groups.map((g) => (
        <LectureRow
          key={g.name}
          heading={g.name}
          lectures={g.more!}
          limit={ROW_LIMIT}
          // Only offer "more" when the page would show something the row
          // doesn't already.
          moreHref={
            g.more!.length > ROW_LIMIT ? ROUTES.moreFeature(g.name) : undefined
          }
        />
      ))}
    </>
  );
}
