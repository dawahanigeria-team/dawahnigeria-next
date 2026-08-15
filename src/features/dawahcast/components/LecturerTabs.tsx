"use client";

import { useState } from "react";
import { LectureTable } from "./LectureTable";
import { AlbumCard } from "./AlbumCard";
import { PlaylistCard } from "./PlaylistCard";
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
 * All three lists are fetched on the server and passed in, so switching tabs is
 * instant and needs no refetch.
 */
export function LecturerTabs({
  lectures,
  albums,
  playlists,
  totals,
}: {
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

      {tab === "audio" &&
        (lectures.length > 0 ? (
          <LectureTable lectures={lectures} />
        ) : (
          <Empty label="lectures" />
        ))}

      {tab === "album" &&
        (albums.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 mobile-up:grid-cols-3 lg:grid-cols-5">
            {albums.map((a, i) => (
              <li key={`${a.nid ?? a.id}-${i}`}>
                <AlbumCard album={a} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty label="albums" />
        ))}

      {tab === "playlist" &&
        (playlists.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 mobile-up:grid-cols-3 lg:grid-cols-5">
            {playlists.map((p, i) => (
              <li key={`${p.id}-${i}`}>
                <PlaylistCard playlist={p} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty label="playlists" />
        ))}
    </>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="py-12 text-center text-sm text-color">
      No {label} from this lecturer yet.
    </p>
  );
}
