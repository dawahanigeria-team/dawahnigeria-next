import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlbum } from "@/features/dawahcast/server/audioDetail";
import { AlbumHero } from "@/features/dawahcast/components/audio-detail/AlbumHero";
import { BackLink } from "@/features/dawahcast/components/BackLink";
import { TrackList } from "@/features/dawahcast/components/audio-detail/TrackList";
import { SimilarAlbumsSection } from "@/features/dawahcast/components/audio-detail/SimilarAlbumsSection";
import { AlbumRowSkeleton } from "@/features/dawahcast/components/Skeletons";
import { getSession } from "@/features/auth/session";
import { getFavoriteIds } from "@/features/favorites/server";
import { AlbumActions } from "@/features/dawahcast/components/audio-detail/AlbumActions";
import { getUserPlaylists } from "@/features/library/server";
import { CommentSection } from "@/features/comments/CommentSection";
import { ROUTES } from "@/lib/routes";
import { ShareLinks } from "@/lib/ShareLinks";
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
  // Started before the session read so the per-user calls below overlap it
  // rather than queueing behind it. The album endpoint runs ~800ms and the
  // per-user ones ~460ms; awaited in sequence that is the sum, in parallel it
  // is the max. getSession() only reads cookies, so it adds no latency here.
  const albumPromise = getAlbum(id);
  const session = await getSession();
  // Favorites/playlists are decoration on a public page: a failure should cost
  // the hearts and the playlist menu, not the album. getUserPlaylists already
  // swallows its own errors; this extends the same rule to favorites, and keeps
  // the promise from floating unhandled if the album 404s below.
  const userDataPromise = session
    ? Promise.all([
        getFavoriteIds(session.user.id, "audio"),
        getFavoriteIds(session.user.id, "album"),
        getUserPlaylists(session.user.id),
      ]).catch(() => [undefined, undefined, undefined] as const)
    : null;

  const album = await albumPromise;
  if (!album) notFound();
  const canonicalUrl = absoluteUrl(env.siteUrl, ROUTES.album(id));

  const [favoriteAudioIds, favoriteAlbumIds, userPlaylists] =
    (await userDataPromise) ?? [undefined, undefined, undefined];

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
      <ShareLinks path={ROUTES.album(id)} />
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
      {/* Ternary, not `&&`: lecturerId comes from the upstream `rp_id`, which is
          0 for records with no resource person — `&&` would print that 0. */}
      {album.lecturerId ? (
        <Suspense fallback={<AlbumRowSkeleton />}>
          <SimilarAlbumsSection
            lecturerId={album.lecturerId}
            lecturerName={album.lecturer}
          />
        </Suspense>
      ) : null}
      <CommentSection itemId={id} type="album" pathname={ROUTES.album(id)} />
    </div>
  );
}
