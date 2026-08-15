import type { Metadata } from "next";
import Link from "next/link";
import { getRamadanYears } from "@/features/dawahcast/server/ramadan";
import { AlbumCard } from "@/features/dawahcast/components/AlbumCard";
import type { LectureSummary } from "@/features/dawahcast/server/landing";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ramadan lectures on Dawah Nigeria - Home of Islamic resources",
  description: "Ramadan lecture archives by year on DawahCast.",
  alternates: { canonical: ROUTES.ramadan },
};

const GOLD = "#D4AF37";

export default async function RamadanPage() {
  const years = await getRamadanYears();
  const [featured, ...previous] = years;

  return (
    <div className="relative flex w-full flex-col px-[3%] pb-16 pt-8 font-plex">
      {/* Faint grid, matching CRA's .ramadan-geometric-bg */}
      <div
        aria-hidden
        className="ramadan-grid-bg pointer-events-none absolute inset-0 opacity-[0.04]"
      />

      <header className="relative mb-10 text-center">
        <h1 className="font-cormorant text-[clamp(2.5rem,7vw,4.5rem)] font-bold leading-none text-foreground">
          Ramadan
        </h1>
        <span className="mt-2 block text-[clamp(0.875rem,2vw,1.125rem)] uppercase tracking-[0.05em] text-color">
          A Journey Through Sacred Teachings
        </span>
      </header>

      {featured && (
        <section
          aria-labelledby="featured-year"
          className="relative mb-14 rounded-3xl border border-[rgba(13,97,112,0.25)] bg-[linear-gradient(135deg,rgba(13,97,112,0.06)_0%,rgba(212,175,55,0.08)_100%)] p-6 mobile-up:p-10"
        >
          <span
            className="inline-block rounded-md px-3 py-1 text-[0.875rem] font-semibold uppercase tracking-[0.1em]"
            style={{ color: GOLD, backgroundColor: "rgba(212,175,55,0.12)" }}
          >
            Latest Collection
          </span>

          <h2
            id="featured-year"
            className="mt-4 font-cormorant text-[clamp(3.5rem,10vw,6rem)] font-bold leading-none text-foreground"
          >
            {featured.year}
            <span
              className="ml-1 align-baseline text-[clamp(1.25rem,3vw,1.75rem)] font-medium"
              style={{ color: GOLD }}
            >
              AH
            </span>
          </h2>

          <p className="mt-2 text-lg text-foreground">{featured.name}</p>

          <p className="mt-4 text-color">
            <span className="text-2xl font-semibold text-foreground">
              {featured.albumCount}
            </span>{" "}
            Albums
          </p>

          <Link
            href={ROUTES.ramadanYear(featured.id)}
            aria-label={`View all ${featured.albumCount} albums from ${featured.name}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-[rgba(212,175,55,0.12)]"
            style={{ color: GOLD, borderColor: "rgba(212,175,55,0.4)" }}
          >
            <span>View All {featured.albumCount} Albums</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {featured.albums.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-foreground">Preview</h3>
              <p className="mt-1 text-sm text-color">
                Showing {Math.min(6, featured.albums.length)} of{" "}
                {featured.albumCount} albums
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-4 mobile-up:grid-cols-3 lg:grid-cols-6">
                {featured.albums.slice(0, 6).map((doc, i) => (
                  <li key={String(doc.id ?? doc.nid ?? i)}>
                    <AlbumCard album={doc as unknown as LectureSummary} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {previous.length > 0 && (
        <section aria-label="Previous Ramadan years" className="relative">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Previous Years
          </h2>
          <ul className="flex flex-col">
            {previous.map((y, i) => (
              <li key={`${y.id}-${i}`}>
                <Link
                  href={ROUTES.ramadanYear(y.id)}
                  className="flex items-center justify-between gap-4 border-b border-border/40 py-4 transition-colors hover:bg-hover/40"
                >
                  <span className="flex items-baseline gap-2">
                    <span className="font-cormorant text-3xl font-bold text-foreground">
                      {y.year}
                    </span>
                    <span className="text-sm font-medium" style={{ color: GOLD }}>
                      AH
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-color">
                    {y.name}
                  </span>
                  <span className="shrink-0 text-sm text-color">
                    {y.albumCount} albums
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {years.length === 0 && (
        <p className="py-12 text-center text-sm text-color">
          No Ramadan collections available yet.
        </p>
      )}
    </div>
  );
}
