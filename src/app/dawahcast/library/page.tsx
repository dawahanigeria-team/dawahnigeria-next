import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { getUserPlaylists } from "@/features/library/server";
import { CreatePlaylistForm } from "@/features/library/CreatePlaylistForm";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Your library",
  description: "Your DawahCast playlists.",
  alternates: { canonical: ROUTES.library },
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await getSession();
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(ROUTES.library)}`);
  }

  const playlists = await getUserPlaylists(session.user.id);

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Your library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Playlists you&apos;ve created on DawahCast.
          </p>
        </div>
        <CreatePlaylistForm />
      </header>

      {playlists.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          You haven&apos;t created any playlists yet. Use{" "}
          <span className="font-medium text-foreground">New playlist</span> above to get started.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {playlists.map((p, i) => (
            <li key={`${p.id}-${i}`}>
              <Link
                href={ROUTES.playlist(p.id)}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(min-width: 640px) 200px, 45vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <p className="line-clamp-2 text-sm font-medium text-foreground">
                  {p.name}
                </p>
                {typeof p.count === "number" && (
                  <p className="text-xs text-muted-foreground">
                    {p.count} {p.count === 1 ? "track" : "tracks"}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
