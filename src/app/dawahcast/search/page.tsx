import type { Metadata } from "next";
import Link from "next/link";
import {
  searchAll,
  deriveFacets,
  type SearchSort,
  type Facet,
} from "@/features/search/server";
import { SearchControls } from "@/features/search/SearchControls";
import { SearchResultRow } from "@/features/search/SearchResultRow";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

type Search = {
  query?: string;
  page?: string;
  sort?: string;
  lang?: string;
  rp?: string;
  cat?: string;
  album?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const { query } = await searchParams;
  return {
    title: query ? `Search: ${query}` : "Search",
    description: `Search for ${query || "Islamic"} resources on Dawah Nigeria.`,
    alternates: { canonical: ROUTES.search },
    robots: { index: false },
  };
}

const FILTER_KEYS = ["lang", "rp", "cat", "album"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

function parseSort(v: string | undefined): SearchSort {
  return v === "newest" || v === "oldest" ? v : "relevance";
}

function csvToList(v: string | undefined): string[] {
  return v ? v.split(",").filter(Boolean) : [];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const query = (sp.query ?? "").trim();
  const sort = parseSort(sp.sort);
  const page = Math.max(1, Number(sp.page) || 1);

  const filters: Record<FilterKey, string[]> = {
    lang: csvToList(sp.lang),
    rp: csvToList(sp.rp),
    cat: csvToList(sp.cat),
    album: csvToList(sp.album),
  };
  const activeCount =
    filters.lang.length + filters.rp.length + filters.cat.length + filters.album.length;

  // Build a URL with one filter id toggled, always resetting to page 1.
  const hrefWithFilters = (next: Record<FilterKey, string[]>) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (sort !== "relevance") params.set("sort", sort);
    for (const key of FILTER_KEYS) {
      if (next[key].length) params.set(key, next[key].join(","));
    }
    return `${ROUTES.search}?${params.toString()}`;
  };

  const toggleHref = (key: FilterKey, id: string) => {
    const has = filters[key].includes(id);
    const nextList = has
      ? filters[key].filter((x) => x !== id)
      : [...filters[key], id];
    return hrefWithFilters({ ...filters, [key]: nextList });
  };

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (sort !== "relevance") params.set("sort", sort);
    for (const key of FILTER_KEYS) {
      if (filters[key].length) params.set(key, filters[key].join(","));
    }
    params.set("page", String(p));
    return `${ROUTES.search}?${params.toString()}`;
  };

  if (!query) {
    return (
      <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
        <h1 className="text-2xl font-semibold text-foreground">Search</h1>
        <div className="mt-4">
          <SearchControls initialQuery="" sort={sort} />
        </div>
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Search for lectures, albums, lecturers, and more.
        </p>
      </div>
    );
  }

  const { results, total, totalPages } = await searchAll({
    query,
    page,
    langId: filters.lang.join(",") || undefined,
    rpId: filters.rp.join(",") || undefined,
    catId: filters.cat.join(",") || undefined,
    albumId: filters.album.join(",") || undefined,
    sort,
  }).catch(() => ({ results: [], total: 0, totalPages: 0 }));

  const facets = deriveFacets(results);

  const facetLabel = (key: FilterKey, id: string): string | undefined => {
    const list: Facet[] =
      key === "lang" ? facets.lang : key === "rp" ? facets.rp : key === "cat" ? facets.cat : facets.alb;
    return list.find((f) => f.id === id)?.name;
  };

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="text-2xl font-semibold text-foreground">Search</h1>

      <div className="mt-4">
        <SearchControls initialQuery={query} sort={sort} />
      </div>

      <p className="mt-4 text-lg text-foreground sm:text-xl">
        {activeCount > 0
          ? `Showing ${results.length} of ${total.toLocaleString()} results for '${query}'`
          : `${total.toLocaleString()} results for '${query}'`}
      </p>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {FILTER_KEYS.flatMap((key) =>
            filters[key].map((id) => {
              const label = facetLabel(key, id) ?? id;
              return (
                <Link
                  key={`${key}-${id}`}
                  href={toggleHref(key, id)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm text-foreground"
                >
                  <span className="max-w-[200px] truncate capitalize">{label}</span>
                  <span aria-hidden>×</span>
                  <span className="sr-only">Remove {label} filter</span>
                </Link>
              );
            }),
          )}
          {/* Not `text-primary`: that token is the CTA *fill* (brand lime),
              which is unreadable as text on the light theme's white ground. */}
          <Link
            href={hrefWithFilters({ lang: [], rp: [], cat: [], album: [] })}
            className="text-sm font-medium text-color-primary underline hover:text-foreground"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Facets live in the sidebar on this route (see SideNav), matching live. */}
      <div className="mt-4">
        <div>
          {results.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-2xl tracking-wide text-muted-foreground sm:text-3xl">
                No search results found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-border">
                {results.map((item, idx) => (
                  <SearchResultRow key={(item._id as { $oid?: string })?.$oid || `${item.id}-${idx}`} item={item} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  {page > 1 ? (
                    <Link
                      href={pageHref(page - 1)}
                      className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded bg-muted px-4 py-2 text-sm text-muted-foreground">
                      Previous
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      href={pageHref(page + 1)}
                      className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="cursor-not-allowed rounded bg-muted px-4 py-2 text-sm text-muted-foreground">
                      Next
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

