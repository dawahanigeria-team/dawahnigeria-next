import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { LectureCard } from "./LectureCard";
import { PageNav } from "./PageNav";
import type { LectureSummary } from "../server/landing";
import { ROUTES } from "@/lib/routes";

/**
 * Shared layout for the four `/dawahcast/more/*` pages.
 *
 * Live renders a `← Home / <section>` breadcrumb above a 4-up card grid, with
 * no heading or description — the breadcrumb *is* the heading.
 */
export function MoreListing({
  title,
  lectures,
  basePath,
  page,
  hasNext,
}: {
  title: string;
  lectures: LectureSummary[];
  basePath: string;
  page: number;
  hasNext: boolean;
}) {
  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <nav className="mb-6 flex items-center gap-3 text-sm" aria-label="Breadcrumb">
        <Link
          href={ROUTES.home}
          aria-label="Back to home"
          className="text-color transition-colors hover:text-foreground"
        >
          <FiArrowLeft aria-hidden />
        </Link>
        <Link href={ROUTES.home} className="text-color hover:text-foreground">
          Home
        </Link>
        <span className="text-color" aria-hidden>
          /
        </span>
        <h1 className="text-foreground">{title}</h1>
      </nav>

      {lectures.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 mobile-up:grid-cols-3 lg:grid-cols-4">
          {lectures.map((lecture, i) => (
            <li key={`${lecture.nid ?? lecture.id}-${i}`}>
              <LectureCard lecture={lecture} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-sm text-color">
          Nothing to show here yet.
        </p>
      )}

      <PageNav basePath={basePath} page={page} hasNext={hasNext} />
    </div>
  );
}
