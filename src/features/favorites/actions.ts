"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/features/auth/session";
import type { FavoriteType } from "./server";

export type ToggleResult =
  | { ok: true; favorited: boolean }
  | { ok: false; code: "unauthenticated" | "network" | "upstream"; message: string };

/**
 * Toggle a favorite. The upstream `/leclisting_favorites.php` POST flips state
 * (add when missing, remove when present) and returns a message string.
 * We hint the new desired state via `currentlyFavorited` so the caller can
 * compute optimistic UI; the actual source of truth is the next GET.
 */
export async function toggleFavoriteAction(input: {
  itemId: string | number;
  type: FavoriteType;
  currentlyFavorited: boolean;
}): Promise<ToggleResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      code: "unauthenticated",
      message: "Sign in to save favorites.",
    };
  }

  try {
    await api.post(
      "/leclisting_favorites.php",
      {
        user_id: session.user.id,
        item_id: input.itemId,
        type: input.type,
      },
      { cache: { revalidate: false } },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        code: "upstream",
        message: "Couldn't save. Please try again.",
      };
    }
    return {
      ok: false,
      code: "network",
      message: "Network error. Please try again.",
    };
  }

  // Bust any RSC that read this user's favorites.
  revalidatePath("/dawahcast/favourite");

  return { ok: true, favorited: !input.currentlyFavorited };
}
