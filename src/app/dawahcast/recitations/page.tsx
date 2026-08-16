import type { Metadata } from "next";
import { getRecitationAlbums } from "@/features/dawahcast/server/listings";
import { RecitationGrid } from "@/features/dawahcast/components/RecitationGrid";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "Quran recitations on Dawah Nigeria - Home of islamic resources",
  description: "Quranic recitation albums on DawahCast.",
  alternates: { canonical: ROUTES.recitations },
};

export default async function RecitationsPage() {
  // Page 1 is server-rendered; later pages append as the sentinel appears.
  const albums = await getRecitationAlbums(1, PAGE_SIZE);

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Quran recitations</h1>
      <PageHeaderRouter title="Quran" />
      <RecitationGrid initialAlbums={albums} pageSize={PAGE_SIZE} />
    </div>
  );
}
