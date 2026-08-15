"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoCloseOutline } from "react-icons/io5";

/** Dismisses the auth screens back to the app. Hidden on /auth/selectlanguage,
 *  where abandoning half-finished signup would leave the account languageless. */
export function AuthCloseButton() {
  const pathname = usePathname();
  if (pathname === "/auth/selectlanguage") return null;

  return (
    <div className="absolute right-4 top-4 z-20 md-auth:right-6 md-auth:top-6">
      <Link
        href="/dawahcast"
        aria-label="Close and return to DawahCast"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
      >
        <IoCloseOutline className="text-2xl text-foreground" aria-hidden />
      </Link>
    </div>
  );
}
