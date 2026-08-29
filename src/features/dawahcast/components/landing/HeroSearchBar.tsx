"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiX } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";
import { trackSearch } from "@/features/analytics/posthog";

const POPULAR_TAGS = [
  { label: "Sheikh Albani Zaria", query: "Albani" },
  { label: "Tafseer", query: "Tafseer" },
  { label: "Dr. Isa Pantami", query: "Pantami" },
  { label: "Sheikh Aminu Daurawa", query: "Daurawa" },
  { label: "Quran Recitation", query: "Quran" },
  { label: "Ramadan", query: "Ramadan" },
];

export function HeroSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    trackSearch(trimmed, { source: "hero_search" });
    router.push(`${ROUTES.search}?query=${encodeURIComponent(trimmed)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="w-full">
      {/* Search Input Box */}
      <form
        onSubmit={onSubmit}
        className="group relative flex w-full items-center rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-2xl backdrop-blur-md transition-all duration-200 focus-within:border-dncolor-500 focus-within:bg-white/15 focus-within:ring-4 focus-within:ring-dncolor-500/20 hover:border-white/30"
      >
        <div className="flex pl-3.5 pr-2 text-white/60 group-focus-within:text-dncolor-500">
          <FiSearch className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 100,000+ lectures, scholars, surahs, or topics..."
          aria-label="Search DawahCast catalog"
          className="min-h-[44px] min-w-0 flex-1 bg-transparent pr-2 text-base font-medium text-white placeholder-white/50 outline-none sm:text-lg [&::-webkit-search-cancel-button]:hidden"
        />

        {query.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <FiX className="h-4 w-4" aria-hidden />
          </button>
        )}

        <button
          type="submit"
          disabled={!query.trim()}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-dncolor-500 px-5 py-2.5 text-sm font-bold text-[#071c18] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>Search</span>
        </button>
      </form>

      {/* Popular Quick Search Tags */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
          Popular:
        </span>
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => {
              setQuery(tag.query);
              handleSearch(tag.query);
            }}
            className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:border-dncolor-500/50 hover:bg-dncolor-500/15 hover:text-dncolor-500"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
