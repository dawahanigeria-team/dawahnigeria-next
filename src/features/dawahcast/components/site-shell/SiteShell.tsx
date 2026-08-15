import { getSession } from "@/features/auth/session";
import { Header } from "./Header";
import { SideNav } from "./SideNav";
import { Footer } from "./Footer";
import { LayoutShell } from "./LayoutShell";

/**
 * CRA composes this across two files: `layout/Layout.jsx` supplies the sidebar
 * + bottom bar, and every page wraps itself in `container/Container.jsx`, which
 * contributes the fixed Nav, a `3.5rem` top padding and the Footer. Both are
 * merged here so pages stay plain content.
 */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen">
      <LayoutShell
        sidebar={
          <SideNav
            isAuthed={Boolean(session)}
            username={session?.user.username ?? session?.user.name}
          />
        }
      >
        <div className="relative flex w-full flex-col overflow-hidden">
          <Header />
          {/* CRA .container_child: 3.5rem block padding to clear the fixed nav,
              3rem at ≤690px. `pb-[146px]` clears the fixed bottom bar. */}
          <div className="w-full py-14 pb-[146px] mobile:pt-12">{children}</div>
          <Footer />
        </div>
      </LayoutShell>
    </div>
  );
}
