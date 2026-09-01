import type { Metadata } from "next";
import { getMoreRecentlyViewed } from "@/features/dawahcast/server/listings";
import { MoreListing } from "@/features/dawahcast/components/MoreListing";
import { parsePage } from "@/features/dawahcast/components/PageNav";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 15;

export const metadata: Metadata = {
  title: "Recently Viewed resources on Dawah Nigeria",
  description: "All recently viewed lectures on DawahCast.",
  alternates: { canonical: ROUTES.moreRecentlyViewed },
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
  const lectures = await getMoreRecentlyViewed(page).catch(() => []);

  return (
    <MoreListing
      title="Recently Viewed"
      lectures={lectures}
      basePath={ROUTES.moreRecentlyViewed}
      page={page}
      hasNext={lectures.length >= PAGE_SIZE}
    />
  );
}
