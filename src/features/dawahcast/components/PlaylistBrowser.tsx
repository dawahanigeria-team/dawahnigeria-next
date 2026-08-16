"use client";

import { useMemo, useState } from "react";
import { PlaylistCard } from "./PlaylistCard";
import type { NamedOption, PlaylistListItem } from "../server/listings";

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={[
        "flex-none cursor-pointer whitespace-nowrap rounded-full border px-4 py-[7px] text-[13px] leading-[1.2] transition-colors",
        selected
          ? "border-[#ddff2b] bg-[#ddff2b] font-semibold text-[#101010]"
          : "border-white/[0.16] bg-white/[0.06] font-medium text-[#e6e6e6] hover:bg-white/[0.12]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/**
 * Both filter rows scroll horizontally rather than wrapping, matching live
 * (`playlist_filter_categories`: overflow-x auto, nowrap, one 30px row). Wrapping
 * 16 categories + 10 languages costs ~800px of vertical space at 375px, which
 * pushes the grid itself below the fold.
 */
const FILTER_ROW =
  "flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-[10px] pt-[2px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * Public playlists with CRA's two filter rows (category, then language).
 *
 * The upstream returns every public playlist in one unfiltered call and CRA
 * filters client-side, so both rows work on the in-memory list — no refetch.
 * Playlists that carry no category/language tag stay visible under "All" only.
 */
export function PlaylistBrowser({
  playlists,
  categories,
  languages,
}: {
  playlists: PlaylistListItem[];
  categories: NamedOption[];
  languages: NamedOption[];
}) {
  const [category, setCategory] = useState<string>("All");
  const [language, setLanguage] = useState<string>("All");

  const filtered = useMemo(() => {
    return playlists.filter((p) => {
      const raw = p.raw as Record<string, unknown>;
      if (category !== "All") {
        const cats = String(raw.cats ?? raw.categories ?? "");
        if (!cats.toLowerCase().includes(category.toLowerCase())) return false;
      }
      if (language !== "All") {
        const lang = String(raw.lang ?? raw.language ?? "");
        if (lang.toLowerCase() !== language.toLowerCase()) return false;
      }
      return true;
    });
  }, [playlists, category, language]);

  return (
    <>
      <div
        className={`mb-3 ${FILTER_ROW}`}
        role="radiogroup"
        aria-label="Filter playlists by category"
      >
        <Chip selected={category === "All"} onClick={() => setCategory("All")}>
          All
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            selected={category === c.name}
            onClick={() => setCategory(c.name)}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      <div
        className={`mb-8 ${FILTER_ROW}`}
        role="radiogroup"
        aria-label="Filter playlists by language"
      >
        <Chip selected={language === "All"} onClick={() => setLanguage("All")}>
          All
        </Chip>
        {languages.map((l) => (
          <Chip
            key={l.id}
            selected={language === l.name}
            onClick={() => setLanguage(l.name)}
          >
            {l.name}
          </Chip>
        ))}
      </div>

      {filtered.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 mobile-up:grid-cols-3 lg:grid-cols-5">
          {filtered.map((p, i) => (
            <li key={`${p.id}-${i}`}>
              <PlaylistCard playlist={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-sm text-color" aria-live="polite">
          No playlists match this filter.
        </p>
      )}
    </>
  );
}
