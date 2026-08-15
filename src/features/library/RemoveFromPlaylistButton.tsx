"use client";

import { useState, useTransition } from "react";
import { BsTrash } from "react-icons/bs";
import { removeAudioFromPlaylistAction } from "./actions";

type Props = {
  playlistId: string | number;
  audioId: string | number;
  label: string;
};

export function RemoveFromPlaylistButton({ playlistId, audioId, label }: Props) {
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Remove "${label}" from this playlist?`)) return;
    setPending(true);
    setError(null);
    startTransition(async () => {
      const result = await removeAudioFromPlaylistAction({ playlistId, audioId });
      setPending(false);
      if (!result.ok) setError(result.message);
      // On success, revalidatePath in the action removes this row from the next render.
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={`Remove ${label} from this playlist`}
      title={error ?? "Remove from playlist"}
      className={[
        "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        error
          ? "text-destructive"
          : "text-muted-foreground hover:bg-hover hover:text-destructive",
        "disabled:opacity-50",
      ].join(" ")}
    >
      <BsTrash className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}
