import Link from "next/link";

type Props = {
  /** Base path without the page query (e.g. /dawahcast/trending). */
  basePath: string;
  page: number;
  /** Whether there is at least one item on the current page. If false, prev still works. */
  hasNext: boolean;
};

function withPage(basePath: string, page: number): string {
  if (page <= 1) return basePath;
  return `${basePath}?page=${page}`;
}

export function PageNav({ basePath, page, hasNext }: Props) {
  if (page <= 1 && !hasNext) return null;
  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-between gap-4"
    >
      {page > 1 ? (
        <Link
          href={withPage(basePath, page - 1)}
          rel="prev"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-hover"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-xs text-muted-foreground">Page {page}</span>
      {hasNext ? (
        <Link
          href={withPage(basePath, page + 1)}
          rel="next"
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-hover"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/** Parse `?page=` from search params with a safe default. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}
