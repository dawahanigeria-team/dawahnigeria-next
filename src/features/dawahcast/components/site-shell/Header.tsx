import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { SearchBar } from "./SearchBar";
import { SidebarToggle } from "./SidebarToggle";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.dawahnigeria.app&pcampaignid=web_share";
const APP_STORE_URL = "https://apps.apple.com/ng/app/dawahnigeria-app/id6759193375";

/**
 * Mirrors CRA's `nav/Nav.jsx` + `nav.scss`.
 *
 * Fixed, full-width and z-15 — deliberately *below* the sidebar's z-30, so on
 * desktop the sidebar paints over this bar's left 240px and hides the small
 * logo + hamburger. That overlap is how the live site renders; the logo here is
 * only ever visible once the sidebar is gone (≤767px).
 *
 * Note there is no theme toggle or auth control in this bar — both live in the
 * sidebar on the live site.
 */
export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-[15] h-fit border-b border-border bg-search p-[1%] mobile:w-full mobile:p-[2%] dark:border-b-0">
      {/* Mobile-first gap chain on purpose: `mobile` (max-615) is declared
          before `narrow` (max-1035) in tailwind.config, so a `mobile:` gap
          loses to a `narrow:` one at 375px and the "Get app" pill gets pushed
          off-screen. Min-width steps can't collide. */}
      <div className="relative flex w-full flex-row items-center gap-2 mobile-up:gap-4 narrow-up:gap-6">
        <div className="flex shrink-0 flex-row items-center gap-4">
          <SidebarToggle />
          <Link
            href={ROUTES.home}
            aria-label="DawahCast home"
            className="block h-[35px] w-[35px] cursor-pointer mobile:h-[30px] mobile:w-[30px]"
          >
            {/* CRA sizes this box 35×35 and stretches the 79×59 source to fill
                it. Matched deliberately for visual parity with the live site. */}
            <Image
              src="/brand/dn-logo.png"
              alt="DN Dawahcast logo"
              width={35}
              height={35}
              priority
              className="h-full w-full"
            />
          </Link>
        </div>

        {/* Desktop/tablet search: fixed basis, centred by auto margins. */}
        <div className="mx-auto max-w-[450px] flex-[0_1_350px] mobile:hidden">
          <SearchBar />
        </div>

        {/* ≤615px gets a narrower inline field instead. */}
        <div className="hidden max-w-[200px] flex-auto mobile:flex mobile:items-center">
          <SearchBar />
        </div>

        <div className="ml-auto flex shrink-0 flex-row items-center gap-3 narrow:hidden">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download app on Google play"
          >
            <Image
              src="/brand/googleplay.svg"
              alt="Get it on Google Play"
              width={132}
              height={40}
              className="h-10 w-auto"
            />
          </a>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download app on App Store"
          >
            <Image
              src="/brand/apple.svg"
              alt="Download on the App Store"
              width={132}
              height={40}
              className="h-10 w-auto"
            />
          </a>
        </div>

        {/* Below 1035px the two badges collapse into one pill. */}
        <div className="ml-auto hidden shrink-0 narrow:flex">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer flex-row items-center justify-center whitespace-nowrap rounded-[32px] border border-border bg-background px-4 py-2 text-[0.9rem] text-color mobile:px-[10px] mobile:py-[6px] mobile:text-[0.75rem]"
          >
            Get app
          </a>
        </div>
      </div>
    </header>
  );
}
