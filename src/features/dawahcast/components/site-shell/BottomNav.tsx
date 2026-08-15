"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV, isActive } from "./nav-items";

/**
 * CRA's `.layout_buttom_menue2` — the four-tab bar that sits under the player.
 *
 * Shown at every width, matching the live site. In the CRA source this is meant
 * to be mobile-only, but the `display: none` in its `min-width: 768px` block is
 * declared *before* the base `display: flex`, so the later rule wins and the bar
 * renders on desktop too. Replicated intentionally.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary mobile" className="w-full px-6 py-2">
      <ul className="grid grid-cols-4">
        {BOTTOM_NAV.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1"
              >
                <Icon
                  className={[
                    "h-5 w-5",
                    active ? "text-color-foreground dark:text-[#ddff2b]" : "text-color",
                  ].join(" ")}
                  aria-hidden
                />
                <span
                  className={[
                    "text-xs",
                    active
                      ? "font-semibold text-color-foreground dark:text-[#ddff2b]"
                      : "text-color",
                  ].join(" ")}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
