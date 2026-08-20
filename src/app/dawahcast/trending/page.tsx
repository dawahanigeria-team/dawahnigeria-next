import type { Metadata } from "next";
import { getTrending } from "@/features/dawahcast/server/listings";
import { TrendingList } from "@/features/dawahcast/components/TrendingList";
import { getSession } from "@/features/auth/session";
import { getUserPlaylists } from "@/features/library/server";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";
import { CollectionJsonLd } from "@/lib/CollectionJsonLd";
import {
  pickResolverFields,
  resolveLecture,
} from "@/features/dawahcast/lectureFields";

const TOP_TRENDING_COUNT = 3;

export const metadata: Metadata = {
  title: "Trending Islamic Lectures",
  description:
    "The most listened-to lectures on Dawah Nigeria right now.",
  alternates: { canonical: ROUTES.trending },
};

export default async function TrendingPage() {
  // Page 1 only: the rest is appended client-side as the sentinel scrolls into
  // view, so there is no `?page=` to read here any more.
  //
  // Projected because these rows are handed to <TrendingList/>, a Client
  // Component: without it every unread catalogue column (description, file_url,
  // downloads …) is serialized into the flight payload for every visitor. The
  // JSON-LD below reads only resolver keys, so it is unaffected.
  const lectures = pickResolverFields(await getTrending(1));

  // Row actions need the viewer's playlists; anonymous visitors get no menu.
  const session = await getSession();
  const playlists = session
    ? await getUserPlaylists(session.user.id)
    : undefined;

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Trending</h1>
      <CollectionJsonLd
        name="Trending Islamic Lectures"
        description="The most listened-to Islamic lectures on DawahCast right now."
        path={ROUTES.trending}
        items={lectures.map((lecture) => {
          // Rows arrive raw from the catalogue API — `title`/`image` only exist
          // after `resolveLecture` maps mp3_title/mp3_thumbnail across, which is
          // the same normaliser the visible table uses.
          const l = resolveLecture(lecture);
          return { name: l.title, path: ROUTES.lecture(l.id), image: l.image };
        })}
      />
      <PageHeaderRouter title="Trending" />

      <TrendingList
        initialLectures={lectures}
        playlists={playlists}
        highlightTop={TOP_TRENDING_COUNT}
      />
    </div>
  );
}
