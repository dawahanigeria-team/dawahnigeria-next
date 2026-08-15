import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Downloads",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DownloadPage() {
  const session = await getSession();
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(ROUTES.download)}`);
  }

  return (
    <div className="w-full px-6 py-8 text-foreground">
      <div className="flex min-h-[50vh] items-center justify-center text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Downloads</h1>
          <p className="text-muted-foreground">Downloads feature is coming soon.</p>
        </div>
      </div>
    </div>
  );
}
