import type { Metadata } from "next";
import { getRecitationAlbums } from "@/features/dawahcast/server/listings";
import { AlbumCard } from "@/features/dawahcast/components/AlbumCard";
import { PageNav, parsePage } from "@/features/dawahcast/components/PageNav";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "Quran recitations on Dawah Nigeria - Home of islamic resources",
  description: "Quranic recitation albums on DawahCast.",
  alternates: { canonical: ROUTES.recitations },
};

export default async function RecitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const albums = await getRecitationAlbums(page, PAGE_SIZE);

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Quran recitations</h1>
      {albums.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 mobile-up:grid-cols-3 lg:grid-cols-5">
          {albums.map((a, i) => (
            <li key={`${a.nid ?? a.id}-${i}`}>
              <AlbumCard album={a} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-sm text-color">
          No recitations available yet.
        </p>
      )}
      <PageNav
        basePath={ROUTES.recitations}
        page={page}
        hasNext={albums.length >= PAGE_SIZE}
      />
    </div>
  );
}
