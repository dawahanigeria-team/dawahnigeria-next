"use client";

import { useOptimistic, useState, useTransition } from "react";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { toggleFavoriteAction } from "./actions";
import { trackFavorite } from "@/features/analytics/posthog";
import type { FavoriteType } from "./server";

type Props = {
  itemId: string | number;
  type: FavoriteType;
  /** Server-rendered initial state (from `getFavoriteIds`). */
  initialFavorited: boolean;
  /** Label fragment used in the button's aria-label. */
  label: string;
  className?: string;
};

export function FavoriteButton({
  itemId,
  type,
  initialFavorited,
  label,
  className,
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [optimistic, setOptimistic] = useOptimistic(
    favorited,
    (_current, next: boolean) => next,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      setError(null);
      setOptimistic(!favorited);
      const result = await toggleFavoriteAction({
        itemId,
        type,
        currentlyFavorited: favorited,
      });
      if (result.ok) {
        setFavorited(result.favorited);
        // Emit only on a confirmed toggle — an optimistic flip that the server
        // rejects would otherwise inflate the favourite counts.
        trackFavorite(
          { id: String(itemId), title: label, type },
          result.favorited ? "add" : "remove",
        );
      } else {
        // revert
        setOptimistic(favorited);
        setError(result.message);
      }
    });
  }

  const Icon = optimistic ? MdFavorite : MdFavoriteBorder;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={optimistic}
      aria-label={
        optimistic ? `Remove ${label} from favorites` : `Add ${label} to favorites`
      }
      title={error ?? undefined}
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        optimistic ? "text-destructive" : "text-muted-foreground hover:text-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
