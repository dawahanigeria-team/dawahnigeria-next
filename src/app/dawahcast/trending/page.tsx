import type { Metadata } from "next";
import { getTrending } from "@/features/dawahcast/server/listings";
import { TrendingList } from "@/features/dawahcast/components/TrendingList";
import { getSession } from "@/features/auth/session";
import { getUserPlaylists } from "@/features/library/server";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";

const TOP_TRENDING_COUNT = 3;

export const metadata: Metadata = {
  title: "Trending resources on Dawah Nigeria - Home of islamic contents",
  description:
    "The most listened-to lectures on Dawah Nigeria right now.",
  alternates: { canonical: ROUTES.trending },
};

export default async function TrendingPage() {
  // Page 1 only: the rest is appended client-side as the sentinel scrolls into
  // view, so there is no `?page=` to read here any more.
  const lectures = await getTrending(1);

  // Row actions need the viewer's playlists; anonymous visitors get no menu.
  const session = await getSession();
  const playlists = session
    ? await getUserPlaylists(session.user.id)
    : undefined;

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Trending</h1>
      <PageHeaderRouter title="Trending" />

      <TrendingList
        initialLectures={lectures}
        playlists={playlists}
        highlightTop={TOP_TRENDING_COUNT}
      />
    </div>
  );
}
