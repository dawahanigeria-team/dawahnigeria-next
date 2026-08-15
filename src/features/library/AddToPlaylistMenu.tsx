"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BsPlus, BsCheck2 } from "react-icons/bs";
import { addAudioToPlaylistAction, type AddTrackResult } from "./actions";
import type { UserPlaylist } from "./server";

type Props = {
  audioId: string | number;
  playlists: UserPlaylist[];
  /** Used in the menu button's aria-label. */
  label: string;
};

type Feedback = { kind: "ok" | "error"; message: string } | null;

export function AddToPlaylistMenu({ audioId, playlists, label }: Props) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pendingPlaylistId, setPendingPlaylistId] = useState<
    string | number | null
  >(null);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside-to-close.
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Auto-dismiss the feedback chip after 2s.
  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 2000);
    return () => window.clearTimeout(id);
  }, [feedback]);

  function onPick(playlist: UserPlaylist, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPendingPlaylistId(playlist.id);
    startTransition(async () => {
      const result: AddTrackResult = await addAudioToPlaylistAction({
        playlistId: playlist.id,
        audioId,
      });
      setPendingPlaylistId(null);
      if (result.ok) {
        setFeedback({ kind: "ok", message: result.message });
        setOpen(false);
      } else {
        setFeedback({ kind: "error", message: result.message });
      }
    });
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Add ${label} to a playlist`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
      >
        <BsPlus className="h-4 w-4" aria-hidden />
      </button>

      {feedback && (
        <span
          role="status"
          className={[
            "pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs shadow-sm",
            feedback.kind === "ok"
              ? "bg-foreground text-background"
              : "bg-destructive text-destructive-foreground",
          ].join(" ")}
        >
          {feedback.message}
        </span>
      )}

      {open && (
        <ul
          role="menu"
          className="absolute right-0 top-8 z-20 max-h-64 min-w-[14rem] overflow-y-auto rounded-md border border-border bg-background py-1 shadow-md"
        >
          {playlists.length === 0 ? (
            <li role="none" className="px-3 py-2 text-xs text-muted-foreground">
              No playlists yet. Create one from your library.
            </li>
          ) : (
            playlists.map((p) => {
              const pending = pendingPlaylistId === p.id;
              return (
                <li key={p.id} role="none">
                  <button
                    role="menuitem"
                    onClick={(e) => onPick(p, e)}
                    disabled={pending}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-hover disabled:opacity-60"
                  >
                    <span className="truncate">{p.name}</span>
                    {pending && (
                      <BsCheck2 className="h-3.5 w-3.5 animate-pulse text-muted-foreground" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
