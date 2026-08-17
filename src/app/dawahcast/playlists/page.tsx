import type { Metadata } from "next";
import {
  getPlaylists,
  getCategories,
} from "@/features/dawahcast/server/listings";
import { getLanguages } from "@/features/dawahcast/server/languages";
import { PlaylistBrowser } from "@/features/dawahcast/components/PlaylistBrowser";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";
import { CollectionJsonLd } from "@/lib/CollectionJsonLd";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Islamic Lecture Playlists",
  description: "Curated DawahCast playlists.",
  alternates: { canonical: ROUTES.playlists },
};

export default async function PlaylistsPage() {
  const [playlists, categories, languages] = await Promise.all([
    getPlaylists(),
    getCategories(),
    getLanguages(),
  ]);

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Playlists</h1>
      <CollectionJsonLd
        name="Islamic Lecture Playlists"
        description="Curated playlists of Islamic lectures and recitations on DawahCast."
        path={ROUTES.playlists}
        items={playlists.map((playlist) => ({
          name: playlist.title,
          path: ROUTES.playlist(playlist.id),
          image: playlist.image,
        }))}
      />
      <PageHeaderRouter title="Playlist" />
      {/* NOTE: the live site shows an empty grid here. Its data call never
          unwraps the endpoint's `{ success, message, data }` envelope, so its
          `Array.isArray()` guard is always false. `getPlaylists` unwraps it, so
          this page shows the playlists the API actually returns. */}
      <PlaylistBrowser
        playlists={playlists}
        categories={categories}
        languages={languages}
      />
    </div>
  );
}
