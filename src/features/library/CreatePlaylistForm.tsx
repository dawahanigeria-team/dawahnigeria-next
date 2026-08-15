"use client";

import { useActionState, useEffect, useState } from "react";
import { BsPlus } from "react-icons/bs";
import { trackPlaylistCreate } from "@/features/analytics/posthog";
import { createPlaylistAction, type CreatePlaylistState } from "./actions";

const initial: CreatePlaylistState = {};

export function CreatePlaylistForm() {
  const [state, formAction, isPending] = useActionState(
    createPlaylistAction,
    initial,
  );
  const [open, setOpen] = useState(false);
  const [handledSuccess, setHandledSuccess] = useState(false);

  // Close on successful submit; the revalidated grid shows the new playlist
  // below. Adjusting during render (rather than in an effect) avoids the extra
  // commit where the form is still visible after it has already succeeded.
  // Closing unmounts the <form>, so the fields reset on their own.
  const succeeded = Boolean(state.success);
  if (succeeded !== handledSuccess) {
    setHandledSuccess(succeeded);
    if (succeeded) setOpen(false);
  }

  // Analytics is a side effect, so it belongs in an effect rather than in the
  // render-time adjustment above (which React may discard and re-run).
  useEffect(() => {
    if (state.success) trackPlaylistCreate(state.name ?? "");
  }, [state.success, state.name]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md bg-dncolor-500 px-3 py-2 text-sm font-medium text-black hover:opacity-90"
      >
        <BsPlus className="h-5 w-5" aria-hidden />
        New playlist
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-3 rounded-md border border-border bg-background p-4"
      noValidate
    >
      <div>
        <label htmlFor="playlist-name" className="text-sm font-medium text-foreground">
          Playlist name
        </label>
        <input
          id="playlist-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={60}
          autoFocus
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={state.fieldErrors?.name ? "err-name" : undefined}
          className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {state.fieldErrors?.name && (
          <p id="err-name" className="mt-1 text-xs text-destructive">
            {state.fieldErrors.name}
          </p>
        )}
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="isPrivate"
          className="h-4 w-4 rounded border-border accent-dncolor-500"
        />
        Keep this playlist private
      </label>
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={isPending}
          className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-hover disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-dncolor-500 px-3 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}
