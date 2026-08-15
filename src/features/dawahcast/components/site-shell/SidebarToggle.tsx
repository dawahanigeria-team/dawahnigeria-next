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
      className="hidden cursor-pointer text-[2rem] leading-none text-color tab:block"
    >
      <FiMenu aria-hidden />
    </button>
  );
}
