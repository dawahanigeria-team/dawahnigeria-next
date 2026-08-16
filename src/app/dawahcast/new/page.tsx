import type { Metadata } from "next";
import { IoMusicalNotesOutline } from "react-icons/io5";
import { getNewLectures } from "@/features/dawahcast/server/listings";
import { NewReleaseTable } from "@/features/dawahcast/components/NewReleaseTable";
import { PageNav, parsePage } from "@/features/dawahcast/components/PageNav";
import { getSession } from "@/features/auth/session";
import { getUserPlaylists } from "@/features/library/server";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";

const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "New Releases — Dawah Nigeria | Fresh Islamic Content",
  description: "The latest lectures added to DawahCast.",
  alternates: { canonical: ROUTES.new },
};

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const lectures = await getNewLectures(page);

  // Row actions need the viewer's playlists; anonymous visitors get no menu.
  const session = await getSession();
  const playlists = session
    ? await getUserPlaylists(session.user.id)
    : undefined;

  return (
    // This page runs its own editorial palette rather than the app theme —
    // matching the live site, which scopes those CSS variables to `/new`.
    <div className="flex w-full flex-col bg-[#0f1117] px-[3%] pb-16 pt-8">
      <PageHeaderRouter title="New" />
      <section className="mb-10 border-b border-[rgba(212,165,116,0.15)] pb-8">
        <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(212,165,116,0.15)] bg-[rgba(212,165,116,0.1)] px-3.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d4a574]" aria-hidden />
          <span className="text-[0.75rem] uppercase tracking-[0.08em] text-[#e8b887]">
            Latest Uploads
          </span>
        </span>

        <div className="flex flex-col gap-4 mobile-up:flex-row mobile-up:items-end mobile-up:justify-between">
          <h1 className="m-0 bg-[linear-gradient(90deg,#d4a574_0%,#e8b887_50%,#d4a574_100%)] bg-clip-text font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-transparent">
            New Releases
          </h1>
          <p className="flex items-center gap-4 pb-2 font-body text-[0.938rem]">
            <span className="font-semibold text-[#e8b887]">
              {lectures.length} lectures
            </span>
            <span className="text-[#7a7768]" aria-hidden>
              •
            </span>
            <span className="text-[#b8b5ad]">Updated today</span>
          </p>
        </div>
      </section>

      {lectures.length > 0 ? (
        <NewReleaseTable lectures={lectures} playlists={playlists} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <IoMusicalNotesOutline
            className="text-4xl text-[#7a7768]"
            aria-hidden
          />
          <p className="font-body text-lg font-semibold text-[#f5f3ef]">
            No new releases yet
          </p>
          <p className="max-w-sm font-body text-sm text-[#b8b5ad]">
            New lectures are uploaded regularly. Check back soon for fresh
            content.
          </p>
        </div>
      )}

      <PageNav
        basePath={ROUTES.new}
        page={page}
        hasNext={lectures.length >= PAGE_SIZE}
      />
    </div>
  );
}
