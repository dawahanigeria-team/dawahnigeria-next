import Link from "next/link";
import { FiChevronsRight } from "react-icons/fi";
import { LectureCard } from "./LectureCard";
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
      {/* CRA .groupWidget_top: 2% side padding, 22px/600 heading dropping to
          20px under 900px, and a "more" button with a double chevron. */}
      <div className="mb-2 flex items-center justify-between px-[2%] mobile:mb-0 mobile:px-0">
        <h2 className="text-[22px] font-semibold leading-[42px] text-color-primary mid:text-[20px]">
          {heading}
        </h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="flex items-center rounded text-[15px] text-color-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dncolor-500 dark:text-dncolor-500"
            aria-label={`View more ${heading}`}
          >
            <span>more</span>
            <FiChevronsRight className="pt-1 text-[20px]" aria-hidden />
          </Link>
        )}
      </div>
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
