import Link from "next/link";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import {
  AiOutlineCopyrightCircle,
  AiFillInstagram,
  AiOutlineTwitter,
} from "react-icons/ai";
import { ROUTES } from "@/lib/routes";
import { StoreBadge } from "./StoreBadge";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.dawahnigeria.app&pcampaignid=web_share";
const APP_STORE_URL = "https://apps.apple.com/ng/app/dawahnigeria-app/id6759193375";

type FooterLink = { text: string; href?: string };

/**
 * Auth routes are `force-dynamic` and have no `loading.tsx` anywhere in their
 * segment chain. Next's default prefetch (`auto`) on a dynamic route fetches
 * "the partial route down to the nearest segment with a loading boundary" —
 * with no such boundary it returns nothing the router can reuse, so each
 * prefetch is a wasted dynamic render on the Worker.
 *
 * This footer is on every page, so the Login/Signup entry was firing that
 * request on every signed-out page view. Those aborted mid-flight on flaky
 * mobile connections and surfaced as `Network connection lost.` in the Worker
 * logs, triggered by `GET /auth/login?_rsc=…`.
 */
const AUTH_PREFIX = "/auth/";

/**
 * Ported from CRA's `footer/Footer.jsx` + its four `footermodals` columns.
 *
 * CRA renders each column with a mobile accordion toggle; here the columns are
 * plain lists that wrap, which needs no client JS. Entries with no `href` are
 * the ones CRA wires to a "coming soon" modal — rendered as inert text rather
 * than links that go nowhere.
 */
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Explore",
    links: [
      { text: "Rp", href: ROUTES.lecturers },
      { text: "Trending Lectures", href: ROUTES.trending },
      { text: "New Lectures", href: ROUTES.new },
      { text: "Charts", href: ROUTES.charts },
      { text: "Videos", href: ROUTES.videos },
    ],
  },
  {
    title: "For Users",
    links: [
      { text: "Download" },
      { text: "Help Centre" },
      { text: "Login/Signup", href: "/auth/login" },
      { text: "Playlist", href: ROUTES.playlists },
    ],
  },
  {
    title: "For Rp",
    links: [{ text: "RP Portal" }, { text: "RP CR" }, { text: "RP FAQ" }],
  },
  {
    title: "Company",
    links: [
      { text: "About" },
      { text: "Contact" },
      { text: "Advertising" },
      { text: "Privacy Policy", href: ROUTES.privacy },
    ],
  },
];

const SOCIALS = [
  { href: "https://web.facebook.com/dawahnigeria", label: "Facebook", Icon: FaFacebook },
  { href: "https://twitter.com/dawahnigeria", label: "Twitter", Icon: AiOutlineTwitter },
  { href: "https://www.instagram.com/dawahnigeria/", label: "Instagram", Icon: AiFillInstagram },
  { href: "https://www.youtube.com/@DawahNigeria", label: "YouTube", Icon: FaYoutube },
];

export function Footer() {
  return (
    <footer className="relative w-full bg-footer">
      <div className="mx-auto w-full px-6 py-12 mobile-up:px-10">
        <div className="grid grid-cols-2 gap-8 mobile-up:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col">
              <h2 className="mb-4 text-[16px] font-bold text-foreground">
                {column.title}
              </h2>
              <div className="flex flex-col gap-3">
                {column.links.map((link) =>
                  link.href ? (
                    <Link
                      key={link.text}
                      href={link.href}
                      // Only the auth links opt out — every other footer
                      // destination is a static catalogue page that prefetches
                      // usefully. See the note on AUTH_PREFIX above.
                      prefetch={
                        link.href.startsWith(AUTH_PREFIX) ? false : undefined
                      }
                      className="text-[14px] text-color transition-colors hover:text-color-foreground dark:hover:text-[#ddff00]"
                    >
                      {link.text}
                    </Link>
                  ) : (
                    <span
                      key={link.text}
                      className="text-[14px] text-color"
                      title="Coming soon"
                    >
                      {link.text}
                    </span>
                  ),
                )}
              </div>
            </div>
          ))}

          <div className="col-span-2 flex flex-col gap-8 mobile-up:col-span-3 lg:col-span-1">
            <div>
              <h3 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-dncolor-500">
                Download Our App
              </h3>
              <div className="flex flex-col gap-3">
                <StoreBadge href={APP_STORE_URL} store="App Store" />
                <StoreBadge href={PLAY_STORE_URL} store="Google Play" />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-dncolor-500">
                Connect With Us
              </h3>
              <div className="flex flex-row gap-3">
                {SOCIALS.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-hover text-foreground transition-colors hover:text-dncolor-500"
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-border/40" aria-hidden />

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-1 text-[14px] text-color">
            <AiOutlineCopyrightCircle aria-hidden />
            <span>{new Date().getFullYear()}</span>
            <span>Dawah Nigeria. All rights reserved.</span>
          </div>
          <div className="text-[13px] text-color">
            Empowering minds through Islamic knowledge
          </div>
        </div>
      </div>
    </footer>
  );
}
