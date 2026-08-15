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

/**
 * "Browse" quick links, mobile only.
 *
 * CRA renders this as a react-slick row (`OPTIONS_SLIDER_SETTINGS`,
 * `slidesToShow: 6`) behind the same `isMobile` check as the hero, so it never
 * appears above 615px — `.landing_options` and `.landing_browse_heading` are
 * both `display: none` until the mobile media query. The order here is CRA's.
 *
 * Slick is only a horizontal scroller at this size (its arrows are hidden), so
 * this is a plain overflow row rather than a carousel. CRA's icons are PNG
 * assets; these are the react-icons equivalents the rest of the app already
 * uses, keeping the 43px lime disc and 12px label from `landop.scss`.
 */
const ITEMS = [
  { label: "Library", href: ROUTES.library, Icon: MdLibraryMusic },
  { label: "Charts", href: ROUTES.charts, Icon: MdBarChart },
  { label: "Lecturers", href: ROUTES.lecturers, Icon: MdPerson },
  { label: "Quran", href: ROUTES.recitations, Icon: MdMenuBook },
  { label: "Playlists", href: ROUTES.playlists, Icon: MdQueueMusic },
  { label: "Video", href: ROUTES.videos, Icon: MdPlayCircleFilled },
  { label: "Categories", href: ROUTES.categories, Icon: MdGridView },
  { label: "Trending", href: ROUTES.trending, Icon: MdTrendingUp },
  { label: "New", href: ROUTES.new, Icon: MdFiberNew },
];

export function BrowseRow() {
  return (
    <section className="mb-8 hidden mobile:block" aria-label="Browse">
      <h2 className="mb-2 ml-1 text-base font-semibold text-color-primary">
        Browse
      </h2>
      <ul className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
        {ITEMS.map(({ label, href, Icon }) => (
          <li key={label} className="shrink-0">
            <Link
              href={href}
              aria-label={`Go to ${label}`}
              className="flex w-[58px] flex-col items-center gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dncolor-500"
            >
              <span className="grid h-[43px] w-[43px] place-items-center rounded-full bg-dncolor-500 text-[#0d0d0d]">
                <Icon className="h-[22px] w-[22px]" aria-hidden />
              </span>
              <span className="text-center text-[12px] text-color">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
