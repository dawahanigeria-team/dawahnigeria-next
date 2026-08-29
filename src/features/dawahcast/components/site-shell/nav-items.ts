import type { IconType } from "react-icons";
import { FaHome, FaQuran } from "react-icons/fa";
import { AiOutlineLineChart } from "react-icons/ai";
import { ImMusic } from "react-icons/im";
import { MdPerson, MdFavorite } from "react-icons/md";
import { TiChartBar } from "react-icons/ti";
import { CgUserList } from "react-icons/cg";
import { SiApplemusic } from "react-icons/si";
import { BsMoonStarsFill, BsYoutube, BsMusicNoteList, BsFileEarmarkMusicFill, BsFillDiscFill } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";

export type NavItem = {
  name: string;
  href: string;
  icon: IconType;
  /** Match exactly (default) or as a prefix (e.g. /dawahcast/videos for /dawahcast/videos/123). */
  matchAs?: "exact" | "prefix";
};

export const PRIMARY_NAV: NavItem[] = [
  { name: "Home", href: ROUTES.home, icon: FaHome },
  { name: "Trending", href: ROUTES.trending, icon: AiOutlineLineChart },
  { name: "New", href: ROUTES.new, icon: ImMusic },
  { name: "Ramadan", href: ROUTES.ramadan, icon: BsMoonStarsFill, matchAs: "prefix" },
  { name: "Lecturers", href: ROUTES.lecturers, icon: MdPerson, matchAs: "prefix" },
  { name: "Quran", href: ROUTES.recitations, icon: FaQuran },
  { name: "Videos", href: ROUTES.videos, icon: BsYoutube, matchAs: "prefix" },
  { name: "Playlists", href: ROUTES.playlists, icon: BsMusicNoteList, matchAs: "prefix" },
  { name: "Charts", href: ROUTES.charts, icon: TiChartBar },
  { name: "Categories", href: ROUTES.categories, icon: BsFileEarmarkMusicFill, matchAs: "prefix" },
];

// Matches CRA's `sideNav/data.js` — same three entries, same order, same
// labels (British "Favourites" here; the bottom tab bar says "Favorites").
export const LIBRARY_NAV: NavItem[] = [
  { name: "Add Playlist", href: ROUTES.library, icon: BsFillDiscFill, matchAs: "prefix" },
  { name: "Favourites", href: ROUTES.favourite, icon: MdFavorite, matchAs: "prefix" },
  { name: "My Playlist", href: ROUTES.myplaylist, icon: CgUserList, matchAs: "prefix" },
];

// Mobile bottom bar: Home / Search / Lecturers / Library
export const BOTTOM_NAV: NavItem[] = [
  { name: "Home", href: ROUTES.home, icon: FaHome },
  { name: "Search", href: ROUTES.search, icon: FiSearch, matchAs: "prefix" },
  { name: "Lecturers", href: ROUTES.lecturers, icon: MdPerson, matchAs: "prefix" },
  { name: "Library", href: ROUTES.library, icon: SiApplemusic, matchAs: "prefix" },
];

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchAs === "prefix") return pathname.startsWith(item.href);
  return pathname === item.href;
}
