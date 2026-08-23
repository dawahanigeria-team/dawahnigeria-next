import Link from "next/link";
import { PlayButton } from "@/features/player/PlayButton";
import { toPlayerTrack, toPlayerQueue } from "@/features/player/toPlayerTrack";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { AddToPlaylistMenu } from "@/features/library/AddToPlaylistMenu";
import { RemoveFromPlaylistButton } from "@/features/library/RemoveFromPlaylistButton";
import { formatTrackDuration } from "../../albumPlayback";
import { ROUTES } from "@/lib/routes";
import type { UserPlaylist } from "@/features/library/server";
import type { AlbumTrack } from "../../server/audioDetail";

type Props = {
  tracks: AlbumTrack[];
  /** When provided, renders a heart per row reflecting which ids are saved.
   *  Undefined = anonymous visitor → no hearts. */
  favoritedAudioIds?: Set<string>;
  /** When provided, renders an "Add to playlist" menu per row.
   *  Undefined = anonymous visitor → no menu. Empty array = signed in but
   *  no playlists yet (menu still shows, with a "create one first" hint). */
  userPlaylists?: UserPlaylist[];
  /** When set, the list is rendering a playlist's contents; each row gets a
   *  remove button keyed to this playlist id. Caller is responsible for
   *  confirming ownership before passing this. */
  removableFromPlaylistId?: string | number;
};

/**
 * Album/playlist track table, matching the live layout:
 * `# | Title | Lecturer | Time` with the lecturer and time columns dropping
 * below 615px.
 *
 * The mobile track is three columns, not two. Only the lecturer is hidden below
 * 615px — the action buttons stay — and a `display:none` element leaves the grid
 * entirely, so a two-column track auto-placed the actions onto a second row
 * inside the 2.5rem number column.
 */
export function TrackList({
  tracks,
  favoritedAudioIds,
  userPlaylists,
  removableFromPlaylistId,
}: Props) {
  const queue = toPlayerQueue(tracks);

  return (
    <div className="w-full">
      <div className="mb-1 hidden grid-cols-[2.5rem_minmax(0,1fr)_14rem_auto] items-center gap-4 border-b border-white/10 px-3 pb-2 text-[13px] uppercase tracking-wide text-color mobile-up:grid">
        <span>#</span>
        <span>Title</span>
        <span>Lecturer</span>
        <span className="pr-1 text-right">Time</span>
      </div>

      <ol className="flex flex-col">
        {tracks.map((track, i) => {
          const id = track.nid ?? track.id;
          const idStr = String(id);
          const title =
            track.mp3_title || track.Title || track.title || `Track ${i + 1}`;
          // Durations arrive as "HH:MM:SS"; parseTrackDuration handles that and
          // treats an all-zero value as unknown rather than 0 seconds.
          const duration = formatTrackDuration(
            (track.mp3_duration ?? track.duration) as string | number | undefined,
          );
          const playerTrack = toPlayerTrack(track);

          return (
            <li
              key={`${id}-${i}`}
              className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-white/5 px-3 py-3 transition-colors hover:bg-white/[0.03] mobile-up:grid-cols-[2.5rem_minmax(0,1fr)_14rem_auto]"
            >
              <span className="text-sm tabular-nums text-color">{i + 1}</span>

              <span className="min-w-0 text-sm text-foreground">
                {id === undefined || id === null ? (
                  <span className="block truncate">{title}</span>
                ) : (
                  <Link
                    href={ROUTES.lecture(id)}
                    className="block truncate hover:text-gray-400"
                  >
                    {title}
                  </Link>
                )}
              </span>

              <span className="hidden min-w-0 truncate text-[13px] text-color mobile-up:block">
                {track.rpname &&
                  (track.rpid ? (
                    <Link
                      href={ROUTES.resourcePerson(track.rpid)}
                      className="hover:text-foreground"
                    >
                      {track.rpname}
                    </Link>
                  ) : (
                    track.rpname
                  ))}
              </span>

              <span className="flex items-center justify-end gap-2">
                {favoritedAudioIds && (
                  <FavoriteButton
                    itemId={idStr}
                    type="audio"
                    initialFavorited={favoritedAudioIds.has(idStr)}
                    label={title}
                  />
                )}
                {userPlaylists && (
                  <AddToPlaylistMenu
                    audioId={idStr}
                    playlists={userPlaylists}
                    label={title}
                  />
                )}
                {removableFromPlaylistId !== undefined && (
                  <RemoveFromPlaylistButton
                    playlistId={removableFromPlaylistId}
                    audioId={idStr}
                    label={title}
                  />
                )}
                <span className="hidden min-w-[4.5rem] text-right text-[13px] tabular-nums text-color mobile-up:inline">
                  {duration}
                </span>
                {playerTrack && <PlayButton track={playerTrack} queue={queue} />}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
