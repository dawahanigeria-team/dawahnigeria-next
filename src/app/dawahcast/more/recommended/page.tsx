import type { Metadata } from "next";
import { getMoreRecommended } from "@/features/dawahcast/server/listings";
import { MoreListing } from "@/features/dawahcast/components/MoreListing";
import { parsePage } from "@/features/dawahcast/components/PageNav";
import { ROUTES } from "@/lib/routes";

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
  // /popular_lec_api.php takes no `page`: it returns one fixed mix of the
  // top lectures by weekly views plus a random sample of recent ones. Asking for
  // page 2 returned the same 15 of 20 rows again, so this view is a single page.
  const lectures = await getMoreRecommended().catch(() => []);

  return (
    <MoreListing
      title="Recommended"
      lectures={lectures}
      basePath={ROUTES.moreRecommended}
      page={page}
      hasNext={false}
    />
  );
}
