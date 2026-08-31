import type { Metadata } from "next";
import { getMoreTrending } from "@/features/dawahcast/server/listings";
import { MoreListing } from "@/features/dawahcast/components/MoreListing";
import { parsePage } from "@/features/dawahcast/components/PageNav";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "Trending resources on Dawah Nigeria",
  description: "All trending lectures on DawahCast.",
  alternates: { canonical: ROUTES.moreTrending },
};

export default async function MorePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  // A failing upstream should show an empty section, not 500 the route —
  // /trending_new.php is currently returning 500.
  const lectures = await getMoreTrending(page).catch(() => []);

  return (
    <MoreListing
      title="Trending"
      lectures={lectures}
      basePath={ROUTES.moreTrending}
      page={page}
      hasNext={lectures.length >= PAGE_SIZE}
    />
  );
}
