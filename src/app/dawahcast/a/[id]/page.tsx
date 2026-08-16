import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlbum } from "@/features/dawahcast/server/audioDetail";
import { AlbumHero } from "@/features/dawahcast/components/audio-detail/AlbumHero";
import { BackLink } from "@/features/dawahcast/components/BackLink";
import { TrackList } from "@/features/dawahcast/components/audio-detail/TrackList";
import { SimilarAlbumsSection } from "@/features/dawahcast/components/audio-detail/SimilarAlbumsSection";
import { LectureRowSkeleton } from "@/features/dawahcast/components/Skeletons";
import { getSession } from "@/features/auth/session";
import { getFavoriteIds } from "@/features/favorites/server";
import { AlbumActions } from "@/features/dawahcast/components/audio-detail/AlbumActions";
import { getUserPlaylists } from "@/features/library/server";
import { CommentSection } from "@/features/comments/CommentSection";
import { ROUTES } from "@/lib/routes";
import { OG_FALLBACK_IMAGE, socialImageUrl } from "@/lib/socialMeta";
import { env } from "@/lib/env";
import { absoluteUrl, durationToIso8601, JsonLd } from "@/lib/JsonLd";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) return { title: "Album not found" };

  const description = album.lecturer
    ? `${album.title} — ${album.tracks.length} tracks by ${album.lecturer} on DawahCast.`
    : `${album.title} — ${album.tracks.length} tracks on DawahCast.`;

  return {
    title: album.title,
    description,
    alternates: { canonical: ROUTES.album(id) },
    openGraph: {
      type: "music.album",
      title: album.title,
      description,
      images: [{ url: socialImageUrl(album.image) || OG_FALLBACK_IMAGE }],
      url: ROUTES.album(id),
    },
    twitter: {
      card: "summary_large_image",
      title: album.title,
      description,
      images: [socialImageUrl(album.image) || OG_FALLBACK_IMAGE],
    },
  };
}

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();
  const canonicalUrl = absoluteUrl(env.siteUrl, ROUTES.album(id));

  const session = await getSession();
  // Three independent per-user reads — fire them concurrently to keep TTFB flat.
  const [favoriteAudioIds, favoriteAlbumIds, userPlaylists] = session
    ? await Promise.all([
        getFavoriteIds(session.user.id, "audio"),
        getFavoriteIds(session.user.id, "album"),
        getUserPlaylists(session.user.id),
      ])
    : [undefined, undefined, undefined];

  const albumActions = (
    <AlbumActions
      itemId={id}
      type="album"
      title={album.title}
      href={ROUTES.album(id)}
      isAuthed={Boolean(session)}
      initialFavorited={Boolean(favoriteAlbumIds?.has(id))}
    />
  );

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicAlbum",
          name: album.title,
          url: canonicalUrl,
          image: album.image,
          byArtist: album.lecturer
            ? { "@type": "Person", name: album.lecturer }
            : undefined,
          numTracks: album.tracks.length,
          track: album.tracks.map((track, index) => ({
            "@type": "MusicRecording",
            position: index + 1,
            name: track.mp3_title || track.Title || track.title,
            url: absoluteUrl(env.siteUrl, ROUTES.lecture(track.nid ?? track.id)),
            contentUrl: track.mp3_url || track.audio,
            duration: durationToIso8601(track.mp3_duration || track.duration),
          })),
        }}
      />
      <BackLink />
      <AlbumHero collection={album} kind="Album" actions={albumActions} />
      <section aria-label="Tracks" className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Audio
          <span className="text-dncolor-500">({album.tracks.length})</span>
        </h2>
        <TrackList
          tracks={album.tracks}
          favoritedAudioIds={favoriteAudioIds}
          userPlaylists={userPlaylists}
        />
      </section>
      {album.lecturerId && (
        <Suspense fallback={<LectureRowSkeleton />}>
          <SimilarAlbumsSection
            lecturerId={album.lecturerId}
            lecturerName={album.lecturer}
          />
        </Suspense>
      )}
      <CommentSection itemId={id} type="album" pathname={ROUTES.album(id)} />
    </div>
  );
}
