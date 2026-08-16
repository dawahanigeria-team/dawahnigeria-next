import { SiteShell } from "@/features/dawahcast/components/site-shell/SiteShell";
import { TawkChat } from "@/features/chat/TawkChat";

export default function DawahcastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteShell>{children}</SiteShell>
      {/* Scoped to the app shell rather than the root layout: the launcher's
          offsets are measured against the player bar + bottom nav, which only
          exist here. On the auth pages it would float far off the bottom. */}
      <TawkChat />
    </>
  );
}
