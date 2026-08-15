"use client";

import { createContext, useContext } from "react";
import { PlayButton } from "@/features/player/PlayButton";
import type { PlayerTrack } from "@/features/player/types";

/**
 * Every row in a listing plays into the same queue, so the queue is provided
 * once here instead of being passed to each row. Handing each row its own copy
 * would serialize the whole list N times into the RSC payload.
 */
const QueueContext = createContext<PlayerTrack[] | undefined>(undefined);

export function RowQueueProvider({
  queue,
  children,
}: {
  queue: PlayerTrack[];
  children: React.ReactNode;
}) {
  return <QueueContext.Provider value={queue}>{children}</QueueContext.Provider>;
}

/**
 * The rank number, swapped for a play button on hover — CRA does this with
 * `.td:hover .tr .plays { display: block }` in list.scss.
 *
 * Differences from CRA, both deliberate:
 *   - the swap uses opacity, not `display`, so the button stays in the tab order
 *     and keyboard users reach it (`group-focus-within` reveals it);
 *   - on touch, where there is no hover, the button is always shown instead of
 *     the number, since a hover-only control is unreachable there.
 *
 * Requires `group` on the row element. The class props exist because New
 * Releases runs its own editorial palette rather than the app theme.
 */
export function RowPlayControl({
  track,
  index,
  className = "w-5",
  numberClassName = "text-[13px] text-color",
  buttonClassName,
}: {
  track: PlayerTrack | null;
  /** Zero-based; rendered as a 1-based rank. */
  index: number;
  /** Sizing for the number/button slot. */
  className?: string;
  numberClassName?: string;
  buttonClassName?: string;
}) {
  const queue = useContext(QueueContext);

  if (!track) {
    return (
      <span className={`shrink-0 text-center ${className} ${numberClassName}`}>
        {index + 1}
      </span>
    );
  }

  return (
    <span className={`grid shrink-0 place-items-center ${className}`}>
      <span
        className={`col-start-1 row-start-1 transition-opacity mobile:hidden mobile-up:group-hover:opacity-0 mobile-up:group-focus-within:opacity-0 ${numberClassName}`}
        aria-hidden
      >
        {index + 1}
      </span>
      <PlayButton
        track={track}
        queue={queue}
        className={`col-start-1 row-start-1 transition-opacity mobile-up:opacity-0 mobile-up:group-hover:opacity-100 mobile-up:group-focus-within:opacity-100 ${buttonClassName ?? ""}`}
      />
    </span>
  );
}

/**
 * Play control for artwork cards (Charts), where there is no rank column to
 * swap. Sits centred over the square art and fades in on hover/focus; on touch
 * it stays visible, for the same reason as above.
 *
 * Renders as a sibling of the card's `<Link>`, never inside it — a `<button>`
 * nested in an `<a>` is invalid HTML and breaks activation. Requires `group` on
 * the card wrapper.
 */
export function CardPlayControl({ track }: { track: PlayerTrack | null }) {
  const queue = useContext(QueueContext);
  if (!track) return null;

  return (
    <span className="pointer-events-none absolute inset-x-0 top-0 grid aspect-square place-items-center">
      <PlayButton
        track={track}
        queue={queue}
        variant="round"
        className="pointer-events-auto shadow-lg transition-opacity mobile-up:opacity-0 mobile-up:group-hover:opacity-100 mobile-up:group-focus-within:opacity-100"
      />
    </span>
  );
}
