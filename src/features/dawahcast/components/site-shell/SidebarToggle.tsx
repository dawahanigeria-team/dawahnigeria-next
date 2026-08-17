"use client";

import { FiMenu } from "react-icons/fi";
import { useSidebar } from "./sidebar-store";

/**
 * Opens the mobile navigation drawer. Hidden at ≥768px, where the sidebar is
 * permanent — matching CRA's `.nav_res_hamburger`.
 */
export function SidebarToggle() {
  const openDrawer = useSidebar((s) => s.openDrawer);

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="Open navigation"
      // The glyph stays 2rem; the button grows to a 44px square around it so the
      // drawer toggle is reachable by thumb. `-ml-1.5` cancels the 6px the wider
      // box would otherwise add on the left, keeping the icon where it was.
      className="hidden cursor-pointer text-[2rem] leading-none text-color tab:-ml-1.5 tab:grid tab:h-11 tab:w-11 tab:place-items-center"
    >
      <FiMenu aria-hidden />
    </button>
  );
}
