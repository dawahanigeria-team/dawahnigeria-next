import type { Metadata } from "next";
import { getRecitationAlbums } from "@/features/dawahcast/server/listings";
import { RecitationGrid } from "@/features/dawahcast/components/RecitationGrid";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";
import { CollectionJsonLd } from "@/lib/CollectionJsonLd";
import { resolveAlbum } from "@/features/dawahcast/lectureFields";

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "Quran Recitations",
  description: "Quranic recitation albums on DawahCast.",
  alternates: { canonical: ROUTES.recitations },
};

export default async function RecitationsPage() {
  // Page 1 is server-rendered; later pages append as the sentinel appears.
  const albums = await getRecitationAlbums(1, PAGE_SIZE);

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Quran recitations</h1>
      <CollectionJsonLd
        name="Quran Recitations"
        description="Complete Quranic recitation albums from reciters on DawahCast."
        path={ROUTES.recitations}
        items={albums.map((album) => {
          // Album rows arrive raw: the title lives under `name`/`album_name`,
          // never `title`. Without this the list rendered on screen but the
          // ItemList came out empty.
          const a = resolveAlbum(album);
          return { name: a.title, path: ROUTES.album(a.id), image: a.image };
        })}
      />
      <PageHeaderRouter title="Quran" />
      <RecitationGrid initialAlbums={albums} pageSize={PAGE_SIZE} />
    </div>
  );
}
