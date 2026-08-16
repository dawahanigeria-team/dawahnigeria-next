"use client";

import { usePlayer } from "./store";
import { ShareMenu } from "@/features/sharing/ShareMenu";

/**
 * Shares whatever is currently playing. Falls back to the current path when the
 * track carries no canonical route.
 */
export function ShareButton() {
  const track = usePlayer((s) => s.track);

  if (!track) return null;

  return (
    <ShareMenu
      url={track.href}
      title={track.title}
      lecturer={track.lecturer}
      contentId={track.id}
      variant="icon"
      className="h-9 w-9 justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground"
    />
  );
}
