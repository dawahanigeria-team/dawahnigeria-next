"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Log in / Sign up switcher. The active tab swaps typeface as well as size —
 * DM Serif Display at 28px vs Manrope 500 at 16px — and grows a gradient
 * underline. Hidden on /auth/selectlanguage, which is a continuation of signup
 * rather than a choice between the two.
 */
export function AuthTabs() {
  const pathname = usePathname();
  if (pathname === "/auth/selectlanguage") return null;

  const tabs = [
    { href: "/auth/login", label: "Log in" },
    { href: "/auth/signup", label: "Sign up" },
  ];

  return (
    <div className="auth-fade-up mb-10 flex w-full flex-row items-center justify-center gap-10 md-auth:gap-16">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            // Both tabs are force-dynamic with no loading boundary, so the
            // default prefetch fetches nothing reusable. See Footer.tsx.
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className="relative -m-2 p-2 no-underline md-auth:m-0 md-auth:p-0"
          >
            <span className="relative flex flex-col items-center">
              <span
                className={[
                  "text-foreground transition-all duration-300",
                  active
                    ? "font-serif text-[28px] font-normal"
                    : "font-manrope text-[16px] font-medium",
                ].join(" ")}
              >
                {tab.label}
              </span>
              {active && (
                <span
                  aria-hidden
                  className="absolute -bottom-2 left-0 right-0 h-[3px] rounded-sm bg-gradient-to-r from-[#d6ff00] to-[#8faa00] shadow-[0_0_12px_rgba(214,255,0,0.6)] md-auth:h-[2px] md-auth:shadow-[0_0_10px_rgba(214,255,0,0.5)]"
                />
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
