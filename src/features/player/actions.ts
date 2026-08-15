"use server";

import { getSession } from "@/features/auth/session";
import { getFavoriteIds } from "@/features/favorites/server";
import { getUserPlaylists } from "@/features/library/server";
import type { UserPlaylist } from "@/features/library/server";

export type PlayerTrackState = {
  signedIn: boolean;
  favorited: boolean;
  playlists: UserPlaylist[];
};

const ANONYMOUS: PlayerTrackState = {
  signedIn: false,
  favorited: false,
  playlists: [],
};

/**
 * Per-track state for the player bar's Favourite and Add-to-playlist controls.
 *
 * Fetched on demand from the client rather than server-rendered: the player
 * lives in the dawahcast layout, and reading the session there would call
 * `cookies()` in a layout and force every route under it dynamic. Nothing is
 * requested until someone actually plays something.
 */
export async function getPlayerTrackState(
  audioId: string,
): Promise<PlayerTrackState> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return ANONYMOUS;

  const [favoriteIds, playlists] = await Promise.all([
    getFavoriteIds(userId, "audio").catch(() => new Set<string>()),
    getUserPlaylists(userId).catch(() => [] as UserPlaylist[]),
  ]);

  return {
    signedIn: true,
    favorited: favoriteIds.has(String(audioId)),
    playlists,
  };
}
