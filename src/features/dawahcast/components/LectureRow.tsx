import { LectureCard } from "./LectureCard";
import { RowHeading } from "./RowHeading";
import { ScrollRow } from "./ScrollRow";
import { lectureQueue } from "@/features/player/toPlayerTrack";
import type { LectureSummary } from "../server/landing";

type Props = {
  heading: string;
  lectures: LectureSummary[];
  /** Optional "more" target. Hidden if absent. */
  moreHref?: string;
  /** Cap rendered items; default 10 matches CRA. */
  limit?: number;
};

export function LectureRow({ heading, lectures, moreHref, limit = 10 }: Props) {
  if (!lectures.length) return null;
  const items = lectures.slice(0, limit);
  // Built from the rendered slice, so pressing play on a card continues through
  // the rest of the row rather than stopping after one lecture. Unplayable
  // records are dropped by lectureQueue, so the queue never contains a dead end.
  const queue = lectureQueue(items);

  return (
    <section className="my-4 sm:my-6">
      <RowHeading heading={heading} moreHref={moreHref} />
      <ScrollRow>
        {items.map((lecture, i) => (
          <li
            key={`${lecture.nid ?? lecture.id}-${i}`}
            className="w-[160px] shrink-0 sm:w-[190px]"
          >
            <LectureCard lecture={lecture} queue={queue} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
