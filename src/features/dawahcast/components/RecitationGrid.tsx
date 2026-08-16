"use client";

import { useCallback } from "react";
import { AlbumCard } from "./AlbumCard";
import { InfiniteFooter } from "./InfiniteFooter";
import { useInfiniteItems } from "../useInfiniteItems";
import { fetchRecitationsPage } from "../server/listingActions";
import type { LectureSummary } from "../server/landing";

/** Recitation albums with CRA's infinite scroll. */
export function RecitationGrid({
  initialAlbums,
  pageSize,
}: {
  initialAlbums: LectureSummary[];
  pageSize: number;
}) {
  // The endpoint takes an explicit `limit`, so the page size has to travel with
  // the request rather than being inferred by the hook.
  const loadPage = useCallback(
    (page: number) => fetchRecitationsPage(page, pageSize),
    [pageSize],
  );

  const { items, sentinelRef, loading, done, failed, retry } = useInfiniteItems({
    initialItems: initialAlbums,
    loadPage,
  });

  if (!items.length) {
    return (
      <p className="py-12 text-center text-sm text-color">
        No recitations available yet.
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 mobile-up:grid-cols-3 lg:grid-cols-5">
        {items.map((album, i) => (
          <li key={`${album.nid ?? album.id}-${i}`}>
            <AlbumCard album={album} />
          </li>
        ))}
      </ul>
      <InfiniteFooter
        sentinelRef={sentinelRef}
        loading={loading}
        done={done}
        failed={failed}
        onRetry={retry}
        loadedCount={items.length}
        itemNoun="albums"
      />
    </>
  );
}
