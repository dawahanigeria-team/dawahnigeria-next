"use client";

import { useEffect, useState } from "react";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { AddToPlaylistMenu } from "@/features/library/AddToPlaylistMenu";
import { DownloadButton } from "@/features/dawahcast/components/DownloadButton";
import { getPlayerTrackState, type PlayerTrackState } from "./actions";
import type { PlayerTrack } from "./types";

/**
 * Favourite, add-to-playlist and download for whatever is playing — the three
 * per-track actions CRA keeps in its player bar (`AddFavourites`,
 * `Addplaylist`, `AudioDownloadModal`) and the port was missing. Without them
 * you have to navigate back to the lecture page mid-listen.
 *
 * Favourite and playlist need the signed-in user, which the player cannot get
 * from props: it renders in the dawahcast layout, and reading the session there
 * would force every route under it dynamic. So state is fetched per track from
 * the client, and only once something is actually playing.
 *
 * Download needs no session and renders for everyone, which matches CRA.
 */
export function TrackActions({ track }: { track: PlayerTrack }) {
  const [state, setState] = useState<PlayerTrackState | null>(null);

  // PlayerBar keys this component by track id, so a new track remounts it and
  // state starts null again. Clearing it here instead would be a setState in an
  // effect body, which `react-hooks/set-state-in-effect` rightly rejects.
  useEffect(() => {
    let cancelled = false;
    getPlayerTrackState(track.id)
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch(() => {
        // A failed lookup should cost the listener the two signed-in controls,
        // not the whole player.
        if (!cancelled) setState({ signedIn: false, favorited: false, playlists: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [track.id]);

  return (
    <>
      {state?.signedIn && (
        <FavoriteButton
          itemId={track.id}
          type="audio"
          initialFavorited={state.favorited}
          label={track.title}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-hover"
        />
      )}
      {state?.signedIn && state.playlists.length > 0 && (
        <AddToPlaylistMenu
          audioId={track.id}
          playlists={state.playlists}
          label={track.title}
        />
      )}
      <DownloadButton
        lectureId={track.id}
        title={track.title}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-hover"
      />
    </>
  );
}
