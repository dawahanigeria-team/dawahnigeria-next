"use client";

import { useCallback, useMemo, useState } from "react";
import { LectureTable } from "./LectureTable";
import { AlbumCard } from "./AlbumCard";
import { PlaylistCard } from "./PlaylistCard";
import { InfiniteFooter } from "./InfiniteFooter";
import { useInfiniteItems } from "../useInfiniteItems";
import {
  fetchLecturerAlbumsPage,
  fetchLecturerLecturesPage,
} from "../server/listingActions";
import type { LectureSummary } from "../server/landing";
import type { PlaylistListItem } from "../server/listings";

type Tab = "audio" | "album" | "playlist";

/**
 * Audio / Album / Playlist switcher on the lecturer page.
 *
 * Counts come from the API's own `total_audio` / `total_albums` /
 * `total_playlist`, not from the loaded page — the first page is only 10 rows,
 * so deriving the label from it would read "Audio(10)" instead of "Audio(2646)".
 *
 * Page 1 of Audio and Album is server-rendered and passed in; further pages load
 * as the user scrolls, like the app. Inactive panels stay mounted but `hidden`,
 * so switching tabs keeps what was loaded, and a hidden panel's sentinel can
 * never intersect, so only the visible tab fetches.
 */
export function LecturerTabs({
  lecturerId,
  lectures,
  albums,
  playlists,
  totals,
}: {
  lecturerId: string;
  lectures: LectureSummary[];
  albums: LectureSummary[];
  playlists: PlaylistListItem[];
  totals: { audio: number; albums: number; playlists: number };
}) {
  const [tab, setTab] = useState<Tab>("audio");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "audio", label: "Audio", count: totals.audio },
    { key: "album", label: "Album", count: totals.albums },
    { key: "playlist", label: "Playlist", count: totals.playlists },
  ];

  return (
    <>
      <div
        role="tablist"
        aria-label="Lecturer content"
        className="mb-6 flex items-center gap-8 border-b border-white/10"
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={[
                "-mb-px border-b-2 pb-3 text-lg font-semibold transition-colors",
                active
                  ? "border-dncolor-500 text-foreground"
                  : "border-transparent text-color hover:text-foreground",
              ].join(" ")}
            >
              {t.label}
              {/* CRA omits the count on the Playlist tab. */}
              {t.key !== "playlist" && (
                <span className="text-dncolor-500">({t.count})</span>
              )}
            </button>
          );
        })}
      </div>

      <div hidden={tab !== "audio"}>
        <AudioPanel lecturerId={lecturerId} initialLectures={lectures} />
      </div>

      <div hidden={tab !== "album"}>
        <AlbumPanel lecturerId={lecturerId} initialAlbums={albums} />
      </div>

      <div hidden={tab !== "playlist"}>
        {playlists.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 mobile-up:grid-cols-3 lg:grid-cols-5">
            {playlists.map((p, i) => (
              <li key={`${p.id}-${i}`}>
                <PlaylistCard playlist={p} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty label="playlists" />
        )}
      </div>
    </>
  );
}

function AudioPanel({
  lecturerId,
  initialLectures,
}: {
  lecturerId: string;
  initialLectures: LectureSummary[];
}) {
  const loadPage = useCallback(
    (page: number) => fetchLecturerLecturesPage(lecturerId, page),
    [lecturerId],
  );
  const { items, sentinelRef, loading, done, failed, retry } = useInfiniteItems({
    initialItems: initialLectures,
    loadPage,
  });
  const unique = useUniqueByNid(items);

  if (!unique.length) return <Empty label="lectures" />;

  return (
    <>
      <LectureTable lectures={unique} />
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

function AlbumPanel({
  lecturerId,
  initialAlbums,
}: {
  lecturerId: string;
  initialAlbums: LectureSummary[];
}) {
  const loadPage = useCallback(
    (page: number) => fetchLecturerAlbumsPage(lecturerId, page),
    [lecturerId],
  );
  const { items, sentinelRef, loading, done, failed, retry } = useInfiniteItems({
    initialItems: initialAlbums,
    loadPage,
  });
  const unique = useUniqueByNid(items);

  if (!unique.length) return <Empty label="albums" />;

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 mobile-up:grid-cols-3 lg:grid-cols-5">
        {unique.map((a, i) => (
          <li key={`${a.nid ?? a.id}-${i}`}>
            <AlbumCard album={a} />
          </li>
        ))}
      </ul>
      <InfiniteFooter
        sentinelRef={sentinelRef}
        loading={loading}
        done={done}
        failed={failed}
        onRetry={retry}
        loadedCount={unique.length}
        itemNoun="albums"
      />
    </>
  );
}

// The upstream repeats rows, sometimes within one page (this lecturer's album
// page 3 lists the same album twice), so dedupe across everything loaded.
function useUniqueByNid(items: LectureSummary[]) {
  return useMemo(() => {
    const seen = new Set<string>();
    return items.filter((row) => {
      const id = String(row.nid ?? row.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [items]);
}

function Empty({ label }: { label: string }) {
  return (
    <p className="py-12 text-center text-sm text-color">
      No {label} from this lecturer yet.
    </p>
  );
}
