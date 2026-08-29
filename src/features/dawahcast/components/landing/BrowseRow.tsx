import Link from "next/link";
import {
  MdLibraryMusic,
  MdBarChart,
  MdPerson,
  MdMenuBook,
  MdQueueMusic,
  MdPlayCircleFilled,
  MdGridView,
  MdTrendingUp,
  MdFiberNew,
} from "react-icons/md";
import { ROUTES } from "@/lib/routes";

const ITEMS = [
  { label: "Lecturers", href: ROUTES.lecturers, Icon: MdPerson },
  { label: "Quran", href: ROUTES.recitations, Icon: MdMenuBook },
  { label: "Categories", href: ROUTES.categories, Icon: MdGridView },
  { label: "Trending", href: ROUTES.trending, Icon: MdTrendingUp },
  { label: "New", href: ROUTES.new, Icon: MdFiberNew },
  { label: "Playlists", href: ROUTES.playlists, Icon: MdQueueMusic },
  { label: "Videos", href: ROUTES.videos, Icon: MdPlayCircleFilled },
  { label: "Charts", href: ROUTES.charts, Icon: MdBarChart },
  { label: "Library", href: ROUTES.library, Icon: MdLibraryMusic },
];

export function BrowseRow() {
  return (
    <section className="mb-6 sm:mb-8" aria-label="Quick Browse Categories">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-color-primary sm:text-lg">
          Explore by Category
        </h2>
      </div>
      <ul className="no-scrollbar flex gap-3 overflow-x-auto pb-1 sm:gap-4">
        {ITEMS.map(({ label, href, Icon }) => (
          <li key={label} className="shrink-0">
            <Link
              href={href}
              aria-label={`Go to ${label}`}
              className="group flex flex-col items-center gap-1.5 rounded-xl p-1 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dncolor-500 sm:w-[72px]"
            >
              <span className="grid h-[44px] w-[44px] place-items-center rounded-2xl bg-dncolor-500/15 text-dncolor-500 transition-colors group-hover:bg-dncolor-500 group-hover:text-black sm:h-[50px] sm:w-[50px]">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-center text-[11px] font-medium text-color transition-colors group-hover:text-foreground sm:text-xs">
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
