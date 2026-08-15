"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { ThemeToggle } from "./ThemeToggle";
import { PRIMARY_NAV, LIBRARY_NAV, isActive, type NavItem } from "./nav-items";
import { SearchFacets } from "@/features/search/SearchFacets";

/**
 * Mirrors CRA's `iconText/IconText.jsx` + `iconText.scss`.
 *
 * The active state is colour only (brand yellow in dark, foreground in light) —
 * there is deliberately no pill/background, which is what CRA renders.
 */
function NavList({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex flex-row items-center"
          >
            <span
              className={
                active
                  ? "mt-[3px] text-color-foreground dark:text-[#ddff00]"
                  : "mt-[3px] text-color hover:text-color-foreground dark:hover:text-[#ddff00]"
              }
            >
              <Icon className="mb-4 text-[16px]" aria-hidden />
            </span>
            <span
              className={[
                "mb-4 ml-4 text-[14px] leading-[21px]",
                active
                  ? "font-semibold text-color-foreground dark:text-[#ddff00]"
                  : "text-color hover:font-semibold hover:text-color-foreground dark:hover:text-[#ddff00]",
              ].join(" ")}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  // CRA: Nunito Sans 400 / 14px / 21px, 0.5rem bottom margin.
  return (
    <h2 className="mb-2 flex items-center text-[14px] font-normal leading-[21px] text-color-foreground">
      {children}
    </h2>
  );
}

export function SideNav({
  isAuthed,
  username,
}: {
  isAuthed: boolean;
  username?: string;
}) {
  const pathname = usePathname();
  // CRA hides the nav lists on the search route, where the sidebar is given
  // over to the search facets instead.
  const onSearch = pathname === ROUTES.search;

  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-full flex-col items-start overflow-y-auto px-8 pb-[90px] pt-6"
    >
      {/* Logo + theme toggle, space-between (CRA .sidenav_logo) */}
      <div className="mb-4 flex w-full items-center justify-between">
        <Link href={ROUTES.home} aria-label="DawahCast home">
          <Image
            src="/brand/dn-logo.png"
            alt="DN Dawahcast logo"
            width={79}
            height={59}
            priority
          />
        </Link>
        <ThemeToggle />
      </div>

      {isAuthed && (
        <div className="mb-2 flex w-full items-end justify-end">
          <LogoutButton className="flex items-center justify-center rounded-[1px] border border-border p-[1%] text-[12px] text-color hover:text-[#d6ff00]" />
        </div>
      )}

      {/* Avatar + auth text (CRA .sidenav_auth) */}
      <div className="mb-6 flex items-center">
        <span className="mr-[0.7rem] flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full bg-[#5e5e5e]">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" aria-hidden>
            <path
              fill="currentColor"
              d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
            />
          </svg>
        </span>
        {isAuthed ? (
          <Link
            href={ROUTES.account}
            className="text-[14px] font-bold capitalize leading-[21px] text-color hover:text-color-foreground dark:hover:text-[#ddff00]"
          >
            {username?.split(" ")[0] ?? username}
            <span className="block text-[10px] text-[#9ca3af]">
              Tap to manage account
            </span>
          </Link>
        ) : (
          <span className="flex flex-row items-center gap-[0.2rem]">
            <Link
              href="/auth/login"
              className="text-[14px] font-bold leading-[21px] text-color hover:text-color-foreground mobile:text-[12px] dark:hover:text-[#ddff00]"
            >
              Log in/
            </Link>
            <Link
              href="/auth/signup"
              className="text-[14px] font-bold leading-[21px] text-color hover:text-color-foreground mobile:text-[12px] dark:hover:text-[#ddff00]"
            >
              Sign Up
            </Link>
          </span>
        )}
      </div>

      {/* On /search the nav lists give way to the result facets, as on live. */}
      {onSearch && (
        <Suspense fallback={null}>
          <SearchFacets />
        </Suspense>
      )}

      {!onSearch && (
        <div className="w-full">
          <div className="flex flex-col items-start">
            <SectionHeader>Lectures</SectionHeader>
            <NavList items={PRIMARY_NAV} pathname={pathname} />
          </div>
          <div className="flex flex-col items-start">
            <SectionHeader>Library</SectionHeader>
            <NavList items={LIBRARY_NAV} pathname={pathname} />
          </div>
        </div>
      )}
    </nav>
  );
}
