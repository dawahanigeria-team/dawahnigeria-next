"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import type { SearchSort } from "./server";
import { trackSearch } from "@/features/analytics/posthog";
import { ROUTES } from "@/lib/routes";

export function SearchControls({
  initialQuery,
  sort,
}: {
  initialQuery: string;
  sort: SearchSort;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const submitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    // Fired on submit rather than on the results page, so a shared/bookmarked
    // result URL doesn't count as a fresh search on every visit.
    trackSearch(q, { sort });
    const params = new URLSearchParams({ query: q });
    if (sort !== "relevance") params.set("sort", sort);
    router.push(`${ROUTES.search}?${params.toString()}`);
  };

  const onSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams();
    if (initialQuery) params.set("query", initialQuery);
    const next = e.target.value;
    if (next !== "relevance") params.set("sort", next);
    // Changing sort re-queries from page 1.
    router.push(`${ROUTES.search}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form onSubmit={submitQuery} className="flex flex-1 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-search px-4 py-2">
          <FiSearch className="h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search lecturers, lectures, albums…"
            aria-label="Search query"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Search
        </button>
      </form>

      <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">Sort:</span>
        <select
          value={sort}
          onChange={onSortChange}
          aria-label="Sort search results"
          className="bg-transparent text-sm font-medium text-foreground outline-none"
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </label>
    </div>
  );
}
