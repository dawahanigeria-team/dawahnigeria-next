"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { getAccessToken, getSession } from "@/features/auth/session";
import { getUserPlaylists } from "./server";

export type CreatePlaylistState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
  /** Echoed back on success so the client can attach it to the analytics event. */
  name?: string;
};

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * POST /playlistApi.php
 *   { name, is_private, user_id, action: "create_playlist" }
 *
 * The upstream allows duplicate names so we guard client-side first.
 */
export async function createPlaylistAction(
  _prev: CreatePlaylistState,
  formData: FormData,
): Promise<CreatePlaylistState> {
  const session = await getSession();
  if (!session) {
    return { error: "Sign in to create playlists." };
  }

  const name = asString(formData.get("name"));
  const isPrivate = formData.get("isPrivate") === "on" ? 1 : 0;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Required";
  else if (name.length < 2) fieldErrors.name = "Must be at least 2 characters";
  else if (name.length > 60) fieldErrors.name = "Keep it under 60 characters";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Duplicate-name guard: the upstream accepts dupes but the CRA UX rejects.
  try {
    const existing = await getUserPlaylists(session.user.id);
    const lower = name.toLowerCase();
    if (existing.some((p) => p.name.toLowerCase() === lower)) {
      return { fieldErrors: { name: "You already have a playlist with this name." } };
    }
  } catch {
    // If the lookup fails the upstream may also reject, but we'd rather let
    // the user try than block on a transient read error.
  }

  try {
    await api.post(
      "/playlistApi.php",
      {
        action: "create_playlist",
        name,
        is_private: isPrivate,
        user_id: Number(session.user.id) || session.user.id,
      },
      { cache: { revalidate: false }, token: (await getAccessToken()) ?? undefined },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: "Couldn't create playlist. Please try again." };
    }
    return { error: "Network error. Please try again." };
  }

  revalidatePath("/dawahcast/library");
  return { success: true, name };
}

export type AddTrackResult =
  | { ok: true; message: string }
  | { ok: false; code: "unauthenticated" | "upstream" | "network"; message: string };

/**
 * POST /playlistApi.php
 *   { user_id, audio_id, playlist_id, action: "add_playlist_audio" }
 *
 * The upstream returns a `message` field describing the outcome — including
 * the "already in playlist" case. We pass that through to the UI verbatim.
 */
export async function addAudioToPlaylistAction(input: {
  playlistId: string | number;
  audioId: string | number;
}): Promise<AddTrackResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      code: "unauthenticated",
      message: "Sign in to add tracks to a playlist.",
    };
  }

  let response: unknown;
  try {
    response = await api.post(
      "/playlistApi.php",
      {
        action: "add_playlist_audio",
        user_id: Number(session.user.id) || session.user.id,
        audio_id:
          typeof input.audioId === "string"
            ? Number(input.audioId) || input.audioId
            : input.audioId,
        playlist_id:
          typeof input.playlistId === "string"
            ? Number(input.playlistId) || input.playlistId
            : input.playlistId,
      },
      { cache: { revalidate: false }, token: (await getAccessToken()) ?? undefined },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        code: "upstream",
        message: "Couldn't add to the playlist. Please try again.",
      };
    }
    return {
      ok: false,
      code: "network",
      message: "Network error. Please try again.",
    };
  }

  // Bust the playlist detail page (the new track should appear) and library
  // grid (count may have changed).
  revalidatePath(`/dawahcast/pl/${input.playlistId}`);
  revalidatePath("/dawahcast/library");

  const message =
    (response && typeof response === "object" && typeof (response as { message?: unknown }).message === "string"
      ? (response as { message: string }).message
      : "Added to playlist");
  return { ok: true, message };
}

export type RemoveTrackResult =
  | { ok: true }
  | { ok: false; code: "unauthenticated" | "upstream" | "network"; message: string };

/**
 * POST /playlistApi.php
 *   { user_id, audio_id, playlist_id, action: "remove_playlist_audio" }
 *
 * The upstream returns { success, message }; we surface success/failure but
 * don't need the message text for the UI (the track just disappears).
 */
export async function removeAudioFromPlaylistAction(input: {
  playlistId: string | number;
  audioId: string | number;
}): Promise<RemoveTrackResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, code: "unauthenticated", message: "Sign in first." };
  }

  let result: { success?: boolean; message?: string } | null = null;
  try {
    result = await api.post<{ success?: boolean; message?: string }>(
      "/playlistApi.php",
      {
        action: "remove_playlist_audio",
        user_id: Number(session.user.id) || session.user.id,
        audio_id:
          typeof input.audioId === "string"
            ? Number(input.audioId) || input.audioId
            : input.audioId,
        playlist_id:
          typeof input.playlistId === "string"
            ? Number(input.playlistId) || input.playlistId
            : input.playlistId,
      },
      { cache: { revalidate: false }, token: (await getAccessToken()) ?? undefined },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, code: "upstream", message: "Couldn't remove. Please try again." };
    }
    return { ok: false, code: "network", message: "Network error." };
  }

  if (result?.success === false) {
    return {
      ok: false,
      code: "upstream",
      message: result.message || "Couldn't remove the track.",
    };
  }

  revalidatePath(`/dawahcast/pl/${input.playlistId}`);
  revalidatePath("/dawahcast/library");
  return { ok: true };
}
