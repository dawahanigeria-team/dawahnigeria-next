import { LectureCard } from "./LectureCard";
import type { LectureSummary } from "../server/landing";

export function LectureGrid({ lectures }: { lectures: LectureSummary[] }) {
  if (!lectures.length) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Nothing to show here yet.
      </p>
    );
  }
  return (
    <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {lectures.map((lecture, i) => (
        <li key={`${lecture.nid ?? lecture.id}-${i}`}>
          <LectureCard lecture={lecture} />
        </li>
      ))}
    </ul>
  );
}
