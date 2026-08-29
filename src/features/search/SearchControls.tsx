"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import type { SearchSort } from "./server";
import { trackSearch } from "@/features/analytics/posthog";
import { ROUTES } from "@/lib/routes";

const FILTER_KEYS = ["lang", "rp", "cat", "album"] as const;
export type SearchFilterState = Record<(typeof FILTER_KEYS)[number], string[]>;

export function SearchControls({
  initialQuery,
  sort,
  filters,
  autoFocus = false,
}: {
  initialQuery: string;
  sort: SearchSort;
  /** Focus the field on mount. Set on the empty search page, whose only job is this input. */
  autoFocus?: boolean;
  /** Active facet selections, so the controls can carry them across a re-query. */
  filters: SearchFilterState;
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
    // Facets are deliberately not carried over: their ids belong to the
    // previous query's results, so a lecturer or album filter would usually
    // strand the new search on zero results.
    router.push(`${ROUTES.search}?${params.toString()}`);
  };

  const onSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams();
    if (initialQuery) params.set("query", initialQuery);
    const next = e.target.value;
    if (next !== "relevance") params.set("sort", next);
    // Sort is orthogonal to the facets, so the active ones have to survive it.
    // Rebuilding the URL from query+sort alone dropped them, which silently
    // widened the result set the moment anyone touched this control.
    for (const key of FILTER_KEYS) {
      if (filters[key].length) params.set(key, filters[key].join(","));
    }
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
            autoFocus={autoFocus}
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

      {/* Nothing to order until there are results, and offering it first
          implies the page is already showing some. */}
      {initialQuery ? (
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
      ) : null}
    </div>
  );
}
