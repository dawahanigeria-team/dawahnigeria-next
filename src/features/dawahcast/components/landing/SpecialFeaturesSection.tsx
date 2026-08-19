import { getSpecialFeaturesLectures, type LectureSummary } from "../../server/landing";
import { LectureRow } from "../LectureRow";
import {
  getListeningPreferences,
  matchesListeningPreferences,
} from "@/features/preferences/server";

// The admin endpoint returns an array of "groups". Each group has a name and a
// `more` array of lectures. Shape is loose because the upstream is untyped.
type SpecialFeatureGroup = {
  name: string;
  more?: LectureSummary[];
};

export async function SpecialFeaturesSection() {
  // The admin endpoint is intermittently 500-ing on upstream. Treat any
  // failure as "no special-feature rows today" rather than tearing down the
  // landing — the other Suspense boundaries already streamed cleanly.
  let groups: SpecialFeatureGroup[] = [];
  try {
    const [featureGroups, preferences] = await Promise.all([
      getSpecialFeaturesLectures(),
      getListeningPreferences(),
    ]);
    groups = (featureGroups as unknown as SpecialFeatureGroup[]).map((group) => ({
      ...group,
      more: preferences.configured
        ? group.more?.filter((lecture) =>
            matchesListeningPreferences(
              lecture as unknown as Record<string, unknown>,
              preferences,
            ),
          )
        : group.more,
    }));
  } catch (err) {
    console.error("SpecialFeaturesSection: upstream error", err);
    return null;
  }
  const visible = groups.filter(
    (g) => Array.isArray(g.more) && g.more.length > 0,
  );
  if (!visible.length) return null;

  return (
    <>
      {visible.map((g) => (
        <LectureRow key={g.name} heading={g.name} lectures={g.more!} limit={6} />
      ))}
    </>
  );
}
