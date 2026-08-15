"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FiChevronDown } from "react-icons/fi";
import { fetchSearchFacets } from "./facetActions";
import type { Facet } from "./server";
import { ROUTES } from "@/lib/routes";

type FilterKey = "lang" | "rp" | "cat" | "album";

const GROUPS: { key: FilterKey; title: string }[] = [
  { key: "lang", title: "Languages" },
  { key: "rp", title: "Lecturers" },
  { key: "cat", title: "Categories" },
  { key: "album", title: "Albums" },
];

type Facets = { lang: Facet[]; rp: Facet[]; cat: Facet[]; alb: Facet[] };

const EMPTY: Facets = { lang: [], rp: [], cat: [], alb: [] };

function listFor(facets: Facets, key: FilterKey): Facet[] {
  return key === "album" ? facets.alb : facets[key];
}

/**
 * Search facets, rendered in the sidebar — the live site swaps its nav lists
 * for these accordions on /dawahcast/search.
 *
 * Toggling a facet is a plain link that rewrites the query string, so filter
 * state stays in the URL and the results page re-renders on the server.
 */
export function SearchFacets() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = (searchParams.get("query") ?? "").trim();
  const sort = searchParams.get("sort") ?? "relevance";

  const [facets, setFacets] = useState<Facets>(EMPTY);
  const [open, setOpen] = useState<Record<FilterKey, boolean>>({
    lang: false,
    rp: false,
    cat: false,
    album: false,
  });
  const loadedFor = useRef<string>("");

  useEffect(() => {
    const key = `${query}|${sort}`;
    if (!query || loadedFor.current === key) return;
    loadedFor.current = key;
    fetchSearchFacets(query, sort as "relevance" | "newest" | "oldest").then(
      setFacets,
    );
  }, [query, sort]);

  if (pathname !== ROUTES.search) return null;

  const active: Record<FilterKey, string[]> = {
    lang: (searchParams.get("lang") ?? "").split(",").filter(Boolean),
    rp: (searchParams.get("rp") ?? "").split(",").filter(Boolean),
    cat: (searchParams.get("cat") ?? "").split(",").filter(Boolean),
    album: (searchParams.get("album") ?? "").split(",").filter(Boolean),
  };

  const toggleHref = (key: FilterKey, id: string) => {
    const has = active[key].includes(id);
    const next = has
      ? active[key].filter((x) => x !== id)
      : [...active[key], id];

    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (sort !== "relevance") params.set("sort", sort);
    for (const g of GROUPS) {
      const list = g.key === key ? next : active[g.key];
      if (list.length) params.set(g.key, list.join(","));
    }
    return `${ROUTES.search}?${params.toString()}`;
  };

  return (
    <div className="w-full">
      {GROUPS.map(({ key, title }) => {
        const items = listFor(facets, key);
        const isOpen = open[key];
        return (
          <div key={key} className="border-b border-border/40">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
              className="flex w-full items-center justify-between py-3 text-sm text-foreground"
            >
              <span>{title}</span>
              <FiChevronDown
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {isOpen && (
              <ul className="max-h-56 overflow-y-auto pb-3">
                {items.length === 0 && (
                  <li className="py-1 text-xs text-color">No options</li>
                )}
                {items.map((f) => {
                  const on = active[key].includes(f.id);
                  return (
                    <li key={f.id}>
                      <Link
                        href={toggleHref(key, f.id)}
                        aria-pressed={on}
                        className={[
                          "flex items-center justify-between gap-2 py-1 text-xs",
                          on
                            ? "font-semibold text-dncolor-500"
                            : "text-color hover:text-foreground",
                        ].join(" ")}
                      >
                        <span className="truncate">{f.name}</span>
                        <span className="shrink-0 tabular-nums">{f.count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
