import type { Metadata } from "next";
import { getTrending } from "@/features/dawahcast/server/listings";
import { LectureTable } from "@/features/dawahcast/components/LectureTable";
import { TrendingHero } from "@/features/dawahcast/components/TrendingHero";
import { PageNav, parsePage } from "@/features/dawahcast/components/PageNav";
import { resolveLecture } from "@/features/dawahcast/lectureFields";
import { getSession } from "@/features/auth/session";
import { getUserPlaylists } from "@/features/library/server";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 10;

/** CRA accents the leading three rows. */
const TOP_TRENDING_COUNT = 3;

export const metadata: Metadata = {
  title: "Trending resources on Dawah Nigeria - Home of islamic contents",
  description: "The lectures everyone's listening to on DawahCast right now.",
  alternates: { canonical: ROUTES.trending },
};

export default async function TrendingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const lectures = await getTrending(page);

  // Row actions need the viewer's playlists; anonymous visitors get no menu.
  const session = await getSession();
  const playlists = session
    ? await getUserPlaylists(session.user.id)
    : undefined;

  // The upstream repeats entries across pages, so dedupe before counting or the
  // stat cards inflate. CRA does the same via lodash `uniqBy(…, "nid")`.
  const seen = new Set<string>();
  const unique = lectures.filter((l) => {
    const id = String(l.nid ?? l.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const totals = unique.reduce(
    (acc, lecture) => {
      const r = resolveLecture(lecture);
      acc.views += r.views;
      acc.favorites += r.favorites;
      return acc;
    },
    { views: 0, favorites: 0 },
  );

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Trending</h1>

      {unique.length > 0 && (
        <TrendingHero
          totalItems={unique.length}
          totalViews={totals.views}
          totalFavorites={totals.favorites}
        />
      )}

      {unique.length > 0 ? (
        <LectureTable
          lectures={unique}
          highlightTop={TOP_TRENDING_COUNT}
          playlists={playlists}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-lg font-semibold text-foreground">
            No Trending Content Yet
          </p>
          <p className="text-sm text-color">
            Check back soon to see what&apos;s trending in the community
          </p>
        </div>
      )}

      <PageNav
        basePath={ROUTES.trending}
        page={page}
        hasNext={lectures.length >= PAGE_SIZE}
      />
    </div>
  );
}
