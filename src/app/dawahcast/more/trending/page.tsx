import type { Metadata } from "next";
import { getMoreTrending } from "@/features/dawahcast/server/listings";
import { MoreListing } from "@/features/dawahcast/components/MoreListing";
import { parsePage } from "@/features/dawahcast/components/PageNav";
import { ROUTES } from "@/lib/routes";

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
  // /popular_lec_api.php takes no `page`: it returns one fixed mix of the
  // top lectures by weekly views plus a random sample of recent ones. Asking for
  // page 2 returned the same 15 of 20 rows again, so this view is a single page.
  const lectures = await getMoreTrending().catch(() => []);

  return (
    <MoreListing
      title="Trending"
      lectures={lectures}
      basePath={ROUTES.moreTrending}
      page={page}
      hasNext={false}
    />
  );
}
