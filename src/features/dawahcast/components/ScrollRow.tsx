"use client";

import { useCallback, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * The horizontal card scroller behind every home/detail row, ported from CRA's
 * `GroupWidget` (`overflow_hidden_wrapper` + the prev/next buttons). Despite
 * `react-slick` being a dependency there, the row is not a carousel — it is a
 * native scroll container nudged by `scrollBy`, and each arrow hides once that
 * end is reached.
 */
export function ScrollRow({ children }: { children: React.ReactNode }) {
  const node = useRef<HTMLUListElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Measuring happens in a ref callback rather than an effect: the element is
  // attached here, so there is no setState-during-effect (which
  // `react-hooks/set-state-in-effect` flags) and no post-paint flash of a
  // wrongly-enabled arrow. React 19 runs the returned cleanup on detach.
  const attach = useCallback((el: HTMLUListElement | null) => {
    node.current = el;
    if (!el) return;

    const sync = () => {
      setCanPrev(el.scrollLeft > 0);
      // Sub-pixel track widths mean the end rarely lands exactly on scrollWidth.
      setCanNext(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 1);
    };

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    // Cards load images and the sidebar collapses, both of which change whether
    // the row overflows at all.
    const observer = new ResizeObserver(sync);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, []);

  // CRA scrolls by a tenth of the full track per press.
  function nudge(direction: 1 | -1) {
    const el = node.current;
    if (!el) return;
    el.scrollBy({ left: (direction * el.scrollWidth) / 10, behavior: "smooth" });
  }

  const arrow =
    "absolute bottom-[45%] z-[1] grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dncolor-500 mobile:hidden";

  return (
    <div className="relative w-full overflow-x-hidden">
      {canPrev && (
        <button
          type="button"
          onClick={() => nudge(-1)}
          className={`${arrow} left-[15px]`}
          aria-label="Scroll left"
        >
          <FiChevronLeft className="text-[20px]" aria-hidden />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => nudge(1)}
          className={`${arrow} right-[7px]`}
          aria-label="Scroll right"
        >
          <FiChevronRight className="text-[20px]" aria-hidden />
        </button>
      )}
      {/* w-[105%] + the wrapper's overflow-x-hidden reproduce CRA's bleed, where
          the row runs past the right edge instead of stopping at it. */}
      <ul
        ref={attach}
        className="no-scrollbar flex w-[105%] gap-4 overflow-x-auto py-1 pl-4 pr-16 mobile:gap-2 mobile:p-2 mobile:pl-0"
      >
        {children}
      </ul>
    </div>
  );
}
