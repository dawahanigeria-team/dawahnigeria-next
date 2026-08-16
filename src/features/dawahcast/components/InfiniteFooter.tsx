"use client";

import type { RefObject } from "react";

/**
 * Sentinel + status line shared by the infinite-scrolling listings.
 *
 * The sentinel keeps a little height even when idle: a zero-height target never
 * satisfies the observer's `threshold: 1`, so the list would stall.
 */
export function InfiniteFooter({
  sentinelRef,
  loading,
  done,
  failed,
  onRetry,
  loadedCount,
  itemNoun = "items",
}: {
  sentinelRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  done: boolean;
  failed: boolean;
  onRetry: () => void;
  loadedCount: number;
  itemNoun?: string;
}) {
  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      <div
        className="flex min-h-[3rem] items-center justify-center py-6 text-sm text-color"
        aria-live="polite"
      >
        {failed ? (
          <span className="flex items-center gap-3">
            Couldn&apos;t load more.
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-border px-3 py-1.5 text-foreground transition-colors hover:bg-hover"
            >
              Retry
            </button>
          </span>
        ) : loading ? (
          <span className="flex items-center gap-2">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
              aria-hidden
            />
            Loading more…
          </span>
        ) : done && loadedCount > 0 ? (
          <span>
            {loadedCount} {itemNoun}
          </span>
        ) : null}
      </div>
    </>
  );
}
