"use client";

import { useMemo } from "react";
import { LectureTable } from "./LectureTable";
import { TrendingHero } from "./TrendingHero";
import { InfiniteFooter } from "./InfiniteFooter";
import { useInfiniteItems } from "../useInfiniteItems";
import { fetchTrendingPage } from "../server/listingActions";
import { resolveLecture } from "../lectureFields";
import type { LectureSummary } from "../server/landing";
import type { UserPlaylist } from "@/features/library/server";

/**
 * Trending feed with CRA's infinite scroll.
 *
 * Owns the hero as well as the table because both are derived from the same
 * accumulated list — CRA recomputes its totals over every page it has loaded,
 * so leaving the hero server-rendered from page 1 would leave the counts
 * disagreeing with the rows underneath them.
 */
export function TrendingList({
  initialLectures,
  playlists,
  highlightTop,
}: {
  initialLectures: LectureSummary[];
  playlists?: UserPlaylist[];
  highlightTop: number;
}) {
  const { items, sentinelRef, loading, done, failed, retry } = useInfiniteItems({
    initialItems: initialLectures,
    loadPage: fetchTrendingPage,
  });

  // The upstream repeats entries across pages, so this has to run over the
  // whole accumulated list, not per page — otherwise duplicates reappear as
  // soon as page 2 lands. CRA does the same with lodash `uniqBy(…, "nid")`.
  const unique = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((lecture) => {
      const id = String(lecture.nid ?? lecture.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [items]);

  const totals = useMemo(
    () =>
      unique.reduce(
        (acc, lecture) => {
          const r = resolveLecture(lecture);
          acc.views += r.views;
          acc.favorites += r.favorites;
          return acc;
        },
        { views: 0, favorites: 0 },
      ),
    [unique],
  );

  if (!unique.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-lg font-semibold text-foreground">
          No Trending Content Yet
        </p>
        <p className="text-sm text-color">
          Check back soon to see what&apos;s trending in the community
        </p>
      </div>
    );
  }

  return (
    <>
      <TrendingHero
        totalItems={unique.length}
        totalViews={totals.views}
        totalFavorites={totals.favorites}
      />
      <LectureTable
        lectures={unique}
        highlightTop={highlightTop}
        playlists={playlists}
      />
      <InfiniteFooter
        sentinelRef={sentinelRef}
        loading={loading}
        done={done}
        failed={failed}
        onRetry={retry}
        loadedCount={unique.length}
        itemNoun="lectures"
      />
    </>
  );
}
