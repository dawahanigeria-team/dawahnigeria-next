"use client";

import { create } from "zustand";

type SidebarState = {
  /** Mobile drawer only. The desktop sidebar is permanent, as on the live site. */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

/**
 * CRA has no desktop collapse: `.nav_res_hamburger` is `display: none` above
 * 767px, so the sidebar is permanent there and the hamburger only ever drives
 * the mobile drawer. Deliberately not persisted — CRA's `isOpen` is session
 * state, and a drawer that reopens itself on the next visit is a nuisance.
 */
export const useSidebar = create<SidebarState>((set) => ({
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
}));
