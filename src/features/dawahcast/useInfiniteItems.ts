"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Appends further pages as a sentinel scrolls into view.
 *
 * Ported from CRA's `useInfiniteScrollPagination` + `UI/infiniteScroll.js`,
 * which observe a node at `threshold: 1` and bump a page counter. Two
 * deliberate differences:
 *
 *  - Page 1 stays server-rendered and is passed in as `initialItems`, so the
 *    first screen is still SSR'd for crawlers. CRA fetched everything client
 *    side and shipped an empty list in the HTML.
 *  - Loading stops once a page comes back empty. CRA kept incrementing
 *    forever, re-requesting the last page each time the sentinel re-entered
 *    the viewport.
 *
 * Emptiness — not a short page — is the stop condition because these upstreams
 * don't fill pages reliably: `all_rps_api.php` returns 9 rows for page 1 and 10
 * for page 2 at the same `lim=10`, so a "shorter than a full page means last
 * page" rule would end the lecturer list before it ever loaded page 2. The cost
 * is one final request that returns nothing.
 *
 * `loadPage` is a Server Action returning plain data rather than JSX, so the
 * caller can render the whole accumulated array in one pass — the trending
 * table needs that to build a single play queue across every loaded page.
 */
export function useInfiniteItems<T>({
  initialItems,
  loadPage,
}: {
  initialItems: T[];
  loadPage: (page: number) => Promise<T[]>;
}) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(initialItems.length === 0);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Guards against a second observer callback firing while a fetch is in
  // flight; `loading` state alone lags a tick behind.
  const busy = useRef(false);

  // A filter change swaps `initialItems` — restart from page 1 rather than
  // appending the new feed onto the old one.
  //
  // Adjusted during render rather than in an effect: React's documented pattern
  // for resetting state when a prop changes. An effect would re-render once
  // with the stale list first, and trips `react-hooks/set-state-in-effect`.
  const [seenInitial, setSeenInitial] = useState(initialItems);
  if (seenInitial !== initialItems) {
    setSeenInitial(initialItems);
    setItems(initialItems);
    setPage(1);
    setFailed(false);
    setDone(initialItems.length === 0);
  }

  // Identity of the feed a request was started against. A request in flight when
  // the user switches filter must be discarded, or the old feed's rows get
  // appended to the new one.
  const activeFeed = useRef(initialItems);
  useEffect(() => {
    activeFeed.current = initialItems;
  }, [initialItems]);

  const loadNext = useCallback(async () => {
    if (busy.current || done) return;
    busy.current = true;
    setLoading(true);
    const startedWith = activeFeed.current;
    const next = page + 1;
    try {
      const batch = await loadPage(next);
      if (activeFeed.current !== startedWith) return; // filter moved on
      if (batch.length === 0) {
        setDone(true);
      } else {
        setItems((prev) => [...prev, ...batch]);
        setPage(next);
      }
      setFailed(false);
    } catch {
      // Leave what is already on screen and offer a retry — an infinite list
      // that empties itself on one bad response is worse than a stuck one.
      if (activeFeed.current === startedWith) setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [done, loadPage, page]);

  useEffect(() => {
    const node = sentinelRef.current;
    // `failed` pauses the observer so a broken page doesn't spin; the retry
    // button drives `loadNext` by hand instead.
    if (!node || done || failed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadNext();
      },
      // CRA used a bare `threshold: 1`. The margin is added because the site
      // footer sits below the sentinel: landing at the very bottom of the page
      // leaves the sentinel scrolled *past* and out of view, so a fast scroll
      // could stop the list dead. Loading 300px early also hides the fetch.
      { threshold: 1, rootMargin: "300px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadNext, done, failed]);

  return { items, sentinelRef, loading, done, failed, retry: loadNext };
}
