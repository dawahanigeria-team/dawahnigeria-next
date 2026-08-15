"use client";

import { useSidebar } from "./sidebar-store";

/**
 * Mirrors CRA's `layout.scss` geometry.
 *
 * The sidebar is `fixed` and therefore out of flow — CRA compensates with
 * `justify-content: right` on a flex row; here the main column carries a
 * matching left margin, which is the same result with less trickery.
 *
 * z-order is load-bearing: the sidebar (z-30) sits *above* the fixed nav
 * (z-15), so the nav's logo and hamburger are covered on desktop. That is how
 * the live site renders — not an artefact of this port.
 *
 * Below 768px the sidebar leaves the layout and becomes a slide-in drawer.
 */
export function LayoutShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const drawerOpen = useSidebar((s) => s.drawerOpen);
  const closeDrawer = useSidebar((s) => s.closeDrawer);

  return (
    <div className="relative flex w-full flex-row overflow-hidden">
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeDrawer}
          className="fixed inset-0 z-20 hidden bg-black/50 backdrop-blur-[1.5px] tab:block"
        />
      )}

      <aside
        aria-label="Site navigation"
        className={[
          "fixed left-0 top-0 z-30 h-screen w-60 overflow-y-auto bg-background shadow-md mobile:w-[200px]",
          "border-r border-border dark:border-r-0",
          // Permanent from 768px up; a drawer below it.
          drawerOpen ? "block" : "hidden tab-up:block",
        ].join(" ")}
      >
        {sidebar}
      </aside>

      {/* CRA: .layout_outlet — width calc(100% - 240px), full width on mobile. */}
      <div className="w-full min-w-0 tab-up:ml-60 tab-up:w-[calc(100%-240px)]">
        {children}
      </div>
    </div>
  );
}
