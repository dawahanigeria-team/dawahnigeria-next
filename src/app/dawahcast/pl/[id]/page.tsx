import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getPlaylist,
  getPlaylistLectures,
} from "@/features/dawahcast/server/playlist";
import { TrackList } from "@/features/dawahcast/components/audio-detail/TrackList";
import type { AlbumTrack } from "@/features/dawahcast/server/audioDetail";
import { getSession } from "@/features/auth/session";
import { getFavoriteIds } from "@/features/favorites/server";
import { AlbumActions } from "@/features/dawahcast/components/audio-detail/AlbumActions";
import { BackLink } from "@/features/dawahcast/components/BackLink";
import { PlayAllButton } from "@/features/player/PlayAllButton";
import { toPlayerQueue } from "@/features/player/toPlayerTrack";
import { getUserPlaylists } from "@/features/library/server";
import { CommentSection } from "@/features/comments/CommentSection";
import { ROUTES } from "@/lib/routes";
import { OG_FALLBACK_IMAGE, socialImageUrl } from "@/lib/socialMeta";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const playlist = await getPlaylist(id);
  if (!playlist) return { title: "Playlist not found" };

  const description =
    playlist.description ??
    (playlist.owner
      ? `Playlist by ${playlist.owner} on DawahCast.`
      : "A DawahCast playlist.");

  return {
    title: playlist.title,
    description,
    alternates: { canonical: ROUTES.playlist(id) },
    openGraph: {
      type: "music.playlist",
      title: playlist.title,
      description,
      images: [{ url: socialImageUrl(playlist.image) || OG_FALLBACK_IMAGE }],
      url: ROUTES.playlist(id),
    },
  };
}

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const playlist = await getPlaylist(id);
  if (!playlist) notFound();

  const [lectures, session] = await Promise.all([
    getPlaylistLectures(playlist.lectureIds) as Promise<AlbumTrack[]>,
    getSession(),
  ]);
  const [favoriteAudioIds, favoritePlaylistIds, userPlaylists] = session
    ? await Promise.all([
        getFavoriteIds(session.user.id, "audio"),
        getFavoriteIds(session.user.id, "playlist"),
        getUserPlaylists(session.user.id),
      ])
    : [undefined, undefined, undefined];

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      {/* Breadcrumb — live renders "Back/ <name>" */}
      <div className="mb-5 flex items-center gap-2 text-sm">
        <BackLink variant="inline" />
        <span className="text-color" aria-hidden>
          /
        </span>
        <span className="truncate text-foreground">{playlist.title}</span>
      </div>

      <header className="mb-8 rounded-2xl border border-border/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] p-5 mobile-up:p-7">
        <div className="flex flex-col gap-6 mobile-up:flex-row mobile-up:items-start">
          <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-lg bg-muted mobile-up:h-[180px] mobile-up:w-[180px]">
            {playlist.image && (
              <Image
                src={playlist.image}
                alt={playlist.title}
                fill
                sizes="180px"
                className="object-cover"
                priority
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-foreground mobile-up:text-3xl">
              {playlist.title}
            </h1>
            {playlist.owner && (
              <p className="mt-2 text-sm text-color">{playlist.owner}</p>
            )}
            {playlist.description && (
              <p className="mt-2 text-sm text-color">{playlist.description}</p>
            )}

            <div className="mt-5 flex flex-wrap items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                <PlayAllButton queue={toPlayerQueue(lectures)} />
                <span className="text-xs text-color">Play</span>
              </div>
              <AlbumActions
                itemId={id}
                type="playlist"
                title={playlist.title}
                href={ROUTES.playlist(id)}
                isAuthed={Boolean(session)}
                initialFavorited={Boolean(favoritePlaylistIds?.has(id))}
              />
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Tracks">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {playlist.title}
            <span className="text-dncolor-500">({lectures.length})</span>
          </h2>
          <TrackList
            tracks={lectures}
            favoritedAudioIds={favoriteAudioIds}
            userPlaylists={userPlaylists}
            removableFromPlaylistId={
              session && playlist.owner === session.user.username ? id : undefined
            }
          />
      </section>
      <CommentSection itemId={id} type="playlist" pathname={ROUTES.playlist(id)} />
    </div>
  );
}
