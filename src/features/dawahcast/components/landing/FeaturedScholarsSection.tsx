import Link from "next/link";
import { getLecturers } from "../../server/listings";
import { ROUTES } from "@/lib/routes";
import { FiArrowRight } from "react-icons/fi";
import { ScholarAvatar } from "../ScholarAvatar";

export async function FeaturedScholarsSection() {
  let lecturers;
  try {
    lecturers = (await getLecturers(1)).items;
  } catch (e) {
    console.error("FeaturedScholarsSection: Failed to load lecturers", e);
    return null;
  }

  if (!lecturers || lecturers.length === 0) return null;

  const topScholars = lecturers.slice(0, 10);

  return (
    <section className="my-6 sm:my-8" aria-label="Featured Islamic Scholars">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Popular Scholars & Lecturers
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Listen to verified recordings from knowledgeable scholars across Nigeria
          </p>
        </div>
        <Link
          href={ROUTES.lecturers}
          className="inline-flex items-center gap-1 text-xs font-semibold text-color-primary hover:underline sm:text-sm"
        >
          <span>View All</span>
          <FiArrowRight aria-hidden />
        </Link>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {topScholars.map((scholar) => (
          <Link
            key={String(scholar.id)}
            href={ROUTES.resourcePerson(scholar.id)}
            className="group flex w-[150px] shrink-0 flex-col focus-visible:outline-none sm:w-[180px]"
          >
            <ScholarAvatar
              name={scholar.name}
              image={scholar.card}
              sizeClass="mb-2 aspect-[5/3] w-full"
              textClass="text-xl"
              className="border-2 border-transparent shadow-md transition-all duration-200 group-hover:scale-[1.03] group-hover:border-dncolor-500 group-focus-visible:border-dncolor-500"
              sizes="200px"
            />
            <span className="line-clamp-2 text-xs font-medium text-foreground transition-colors group-hover:text-dncolor-500 sm:text-sm">
              {scholar.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
