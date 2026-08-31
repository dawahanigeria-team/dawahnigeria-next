import type { Metadata } from "next";
import { getMoreRecommended } from "@/features/dawahcast/server/listings";
import { MoreListing } from "@/features/dawahcast/components/MoreListing";
import { parsePage } from "@/features/dawahcast/components/PageNav";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "Recommended resources on Dawah Nigeria",
  description: "All recommended lectures on DawahCast.",
  alternates: { canonical: ROUTES.moreRecommended },
};

export default async function MorePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  // A failing upstream should show an empty section, not 500 the route.
  const lectures = await getMoreRecommended(page).catch(() => []);

  return (
    <MoreListing
      title="Recommended"
      lectures={lectures}
      basePath={ROUTES.moreRecommended}
      page={page}
      hasNext={lectures.length >= PAGE_SIZE}
    />
  );
}
