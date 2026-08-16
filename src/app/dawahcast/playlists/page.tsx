import type { Metadata } from "next";
import {
  getPlaylists,
  getCategories,
} from "@/features/dawahcast/server/listings";
import { getLanguages } from "@/features/dawahcast/server/languages";
import { PlaylistBrowser } from "@/features/dawahcast/components/PlaylistBrowser";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Playlists - Get islamic resources on Dawah Nigeria",
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
