"use client";

import { useActionState, useEffect, useRef } from "react";
import { addCommentAction, type AddCommentState } from "./actions";
import type { CommentType } from "./server";

const initial: AddCommentState = {};

type Props = {
  itemId: string | number;
  type: CommentType;
  /** Path to revalidate after a successful post. */
  revalidatePath: string;
};

export function CommentForm({ itemId, type, revalidatePath }: Props) {
  const [state, formAction, isPending] = useActionState(addCommentAction, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="itemId" value={String(itemId)} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="revalidate" value={revalidatePath} />
      <label htmlFor="comment" className="sr-only">
        Add a comment
      </label>
      <textarea
        id="comment"
        name="comment"
        rows={3}
        maxLength={500}
        required
        placeholder="Share your thoughts…"
        aria-invalid={Boolean(state.fieldErrors?.comment)}
        aria-describedby={state.fieldErrors?.comment ? "err-comment" : undefined}
        className="w-full resize-y rounded-md border border-border bg-comment px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {state.fieldErrors?.comment && (
        <p id="err-comment" className="text-xs text-destructive">
          {state.fieldErrors.comment}
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-dncolor-500 px-3 py-1.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
