import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FiPlay } from "react-icons/fi";
import { getRamadanYearAlbums } from "@/features/dawahcast/server/ramadan";
import { PageNav, parsePage } from "@/features/dawahcast/components/PageNav";
import { BackLink } from "@/features/dawahcast/components/BackLink";
import { ROUTES } from "@/lib/routes";

type Params = { id: string };
type Search = { page?: string; lang?: string; q?: string };

const PAGE_SIZE = 20;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = `Ramadan Tafseer ${id}`;
  return {
    title,
    description: `${title} albums on Dawah Nigeria.`,
    alternates: { canonical: ROUTES.ramadanYear(id) },
    openGraph: { type: "website", title, url: ROUTES.ramadanYear(id) },
  };
}

/** "Title - Lecturer" → split into display title + lecturer name. */
function parseAlbumTitle(raw = ""): { title: string; lecturer: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { title: "Untitled Album", lecturer: "" };
  const parts = trimmed.split(" - ");
  if (parts.length < 2) return { title: trimmed, lecturer: "" };
  const lecturer = parts.pop()!.trim();
  return { title: parts.join(" - ").trim(), lecturer };
}

export default async function RamadanYearPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { id: year } = await params;
  const { page: pageParam, lang, q } = await searchParams;
  const page = parsePage(pageParam);

  const { albums, total } = await getRamadanYearAlbums(year, page, q ?? "").catch(() => ({
    albums: [],
    total: 0,
  }));

  // Language pills are derived from the albums on the current page.
  const languages = Array.from(
    new Set(albums.map((a) => a.language).filter(Boolean) as string[]),
  );
  const visible = lang ? albums.filter((a) => a.language === lang) : albums;
  const lectureTotal = albums.reduce((sum, a) => sum + (a.lectureCount ?? 0), 0);

  const pillHref = (l?: string) =>
    `${ROUTES.ramadanYear(year)}${l ? `?lang=${encodeURIComponent(l)}` : ""}`;

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      {/* Top bar — back chevron + collection name, as on live. */}
      <div className="mb-8 flex items-center gap-4">
        <BackLink variant="button" />
        <p className="font-cormorant text-2xl font-bold text-foreground">
          Ramadan Tafseer <span>{year}</span>{" "}
          <span className="text-base font-medium" style={{ color: "#D4AF37" }}>
            AH
          </span>
        </p>
      </div>

      <header className="mb-10 text-center font-plex">
        <span
          className="inline-block rounded-md px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "#D4AF37", backgroundColor: "rgba(212,175,55,0.12)" }}
        >
          Tafseer Collection
        </span>
        <h1 className="mt-5 font-cormorant text-[clamp(2.5rem,7vw,4rem)] font-bold leading-none text-foreground">
          Ramadan {year}
        </h1>
        <p className="mt-3 text-color">
          Explore the blessed month&apos;s teachings and reflections
        </p>

        {/* Albums is the API's own total; lectures and languages are derived
            from the loaded page, so they track what is on screen. */}
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {[
            { value: total, label: "Albums" },
            { value: lectureTotal, label: "Lectures" },
            { value: languages.length, label: "Languages" },
          ].map((stat) => (
            <li
              key={stat.label}
              className="min-w-[6.5rem] rounded-xl border border-border/50 bg-white/[0.03] px-6 py-4"
            >
              <p className="font-cormorant text-3xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-[0.7rem] uppercase tracking-[0.08em] text-color">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </header>

      <form
        action={ROUTES.ramadanYear(year)}
        className="mx-auto mb-8 flex w-full max-w-xl items-center gap-2 rounded-xl border border-border/60 bg-white/[0.03] px-4 py-3"
      >
        <label htmlFor="ramadan-q" className="sr-only">
          Search by title or lecturer
        </label>
        <input
          id="ramadan-q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search by title or lecturer..."
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-color"
        />
      </form>

      {languages.length > 0 && (
        <nav
          aria-label="Filter by language"
          className="mt-4 flex flex-wrap gap-2"
        >
          <Link
            href={pillHref()}
            aria-current={!lang ? "page" : undefined}
            className={[
              "rounded-full border px-3 py-1 text-sm transition-colors",
              !lang
                ? "border-foreground bg-hover font-semibold text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            All ({total})
          </Link>
          {languages.map((l) => (
            <Link
              key={l}
              href={pillHref(l)}
              aria-current={lang === l ? "page" : undefined}
              className={[
                "rounded-full border px-3 py-1 text-sm transition-colors",
                lang === l
                  ? "border-foreground bg-hover font-semibold text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {l} ({albums.filter((a) => a.language === l).length})
            </Link>
          ))}
        </nav>
      )}

      {visible.length > 0 ? (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {visible.map((album, i) => {
            const parsed = parseAlbumTitle(album.title);
            return (
              <li key={`${album.nid}-${i}`}>
                <Link
                  href={ROUTES.album(album.nid)}
                  className="group flex flex-col gap-2"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                    {album.image ? (
                      <Image
                        src={album.image}
                        alt={parsed.title}
                        fill
                        sizes="(min-width: 640px) 200px, 45vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black opacity-0 transition-opacity group-hover:opacity-100">
                      <FiPlay />
                    </span>
                  </div>
                  <div>
                    <p className="line-clamp-2 text-sm font-medium text-foreground">
                      {parsed.title}
                    </p>
                    {parsed.lecturer && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {parsed.lecturer}
                      </p>
                    )}
                    {album.lectureCount !== undefined && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {album.lectureCount} lectures
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          No Tafseer albums available
          {lang ? ` in ${lang}` : ""}.
        </p>
      )}

      {/* Pagination only applies to the unfiltered list (filtering is per-page). */}
      {!lang && (
        <PageNav
          basePath={ROUTES.ramadanYear(year)}
          page={page}
          hasNext={albums.length >= PAGE_SIZE && page * PAGE_SIZE < total}
        />
      )}
    </div>
  );
}
