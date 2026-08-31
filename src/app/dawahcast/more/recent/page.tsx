import type { Metadata } from "next";
import { getMoreRecent } from "@/features/dawahcast/server/listings";
import { MoreListing } from "@/features/dawahcast/components/MoreListing";
import { parsePage } from "@/features/dawahcast/components/PageNav";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 30;

export const metadata: Metadata = {
  title: "Recently Posted resources on Dawah Nigeria",
  description: "All recently posted lectures on DawahCast.",
  alternates: { canonical: ROUTES.moreRecent },
};

export default async function MorePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  // A failing upstream should show an empty section, not 500 the route.
  const lectures = await getMoreRecent(page).catch(() => []);

  return (
    <MoreListing
      title="Recently Posted"
      lectures={lectures}
      basePath={ROUTES.moreRecent}
      page={page}
      hasNext={lectures.length >= PAGE_SIZE}
    />
  );
}
