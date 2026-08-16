"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";
import { MdFavorite } from "react-icons/md";
import { ROUTES } from "@/lib/routes";
import { formatNumber } from "@/lib/formatNumber";
// `import type` is erased at build time; importing a *value* from the server
// module here would pull lib/api → lib/env into the client bundle and throw.
import type { Video } from "../server/video";
import { videoCategories } from "../videoFields";
import { InfiniteFooter } from "./InfiniteFooter";
import { useInfiniteItems } from "../useInfiniteItems";
import { fetchVideosPage } from "../server/listingActions";

/** Hardcoded in CRA's `pages/videos/data.js` — an editorial list, not an API. */
const CATEGORIES = [
  "All",
  "Charity",
  "Men",
  "Character & Manners",
  "Knowledge",
  "Q&A",
  "Jumuah",
  "Ramadan",
  "Sacred Months",
];

function VideoCard({ video, large }: { video: Video; large?: boolean }) {
  return (
    <Link href={ROUTES.video(video.id)} className="group block">
      <div
        className={[
          "relative w-full overflow-hidden rounded-xl bg-muted",
          large ? "aspect-[16/9]" : "aspect-video",
        ].join(" ")}
      >
        {video.thumbnail && (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            sizes={large ? "(min-width: 690px) 45vw, 100vw" : "(min-width: 690px) 30vw, 100vw"}
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
        <span
          className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white transition-colors group-hover:bg-black/70"
          aria-hidden
        >
          <FaPlay className="ml-1 text-xl" />
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-semibold uppercase text-foreground">
        {video.title}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-6 w-6 shrink-0 rounded-full bg-[#5e5e5e]"
            aria-hidden
          />
          <span className="line-clamp-1 text-xs text-color">
            {video.lecturer}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-color">
          <MdFavorite aria-hidden />
          <span>{formatNumber(video.favorites)}</span>
          <span aria-hidden>·</span>
          <span>{formatNumber(video.views)} views</span>
        </span>
      </div>
    </Link>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-color">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

/**
 * The DN Video Hub, ported from CRA's `pages/videos/Videos.jsx`.
 *
 * Splits one list three ways, exactly as CRA does: curated picks (or the two
 * most-viewed as a fallback) → the next six by views → everything else. The
 * category chips filter in place without navigating.
 */
export function VideoHub({
  videos,
  curated,
}: {
  /** Page 1, server-rendered. Later pages are appended as the user scrolls. */
  videos: Video[];
  curated: Video[];
}) {
  const [active, setActive] = useState("All");

  const {
    items: allVideos,
    sentinelRef,
    loading,
    done,
    failed,
    retry,
  } = useInfiniteItems({
    initialItems: videos,
    loadPage: fetchVideosPage,
  });

  const { featured, trending, rest } = useMemo(() => {
    // Declared inside the memo so `active` is the only dependency that matters
    // — hoisting it would need an exhaustive-deps suppression.
    const inCategory = (list: Video[]) =>
      active === "All"
        ? list
        : list.filter((v) =>
            videoCategories(v).some(
              (c) => c.toLowerCase() === active.toLowerCase(),
            ),
          );

    const sortedByViews = [...inCategory(allVideos)].sort(
      (a, b) => b.views - a.views,
    );
    const curatedFiltered = inCategory(curated);

    const featured = (
      curatedFiltered.length > 0 ? curatedFiltered : sortedByViews
    ).slice(0, 2);
    const featuredIds = new Set(featured.map((v) => String(v.id)));

    const trending = sortedByViews
      .filter((v) => !featuredIds.has(String(v.id)))
      .slice(0, 6);
    const trendingIds = new Set(trending.map((v) => String(v.id)));

    const rest = inCategory(allVideos).filter(
      (v) => !featuredIds.has(String(v.id)) && !trendingIds.has(String(v.id)),
    );
    return { featured, trending, rest };
  }, [allVideos, curated, active]);

  const empty = featured.length === 0 && trending.length === 0 && rest.length === 0;

  return (
    <>
      <div
        className="mb-6 flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="radiogroup"
        aria-label="Filter videos by category"
      >
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active === c}
            onClick={() => setActive(c)}
            className={[
              "flex-none cursor-pointer whitespace-nowrap rounded-full border px-4 py-[7px] text-[13px] leading-[1.2] transition-colors",
              active === c
                ? "border-[#ddff2b] bg-[#ddff2b] font-semibold text-[#101010]"
                : "border-white/[0.16] bg-white/[0.06] font-medium text-[#e6e6e6] hover:bg-white/[0.12]",
            ].join(" ")}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <span className="inline-block rounded-md bg-[#ddff2b]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#ddff2b]">
          DN Video Hub
        </span>
        <p className="mt-3 text-sm text-color">
          Curated Islamic videos for the Ummah, the Nigerian way.
        </p>
      </div>

      {empty ? (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold text-foreground">
            {active === "All" ? "No videos yet" : `No ${active} videos yet`}
          </p>
          <p className="mt-1 text-sm text-color">
            Check back soon — new videos are added regularly.
          </p>
          {active !== "All" && (
            <button
              type="button"
              onClick={() => setActive("All")}
              className="mt-4 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-hover"
            >
              Show all videos
            </button>
          )}
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <Section
              title="Featured picks"
              subtitle="Carefully selected lectures to start with."
            >
              <div className="grid grid-cols-1 gap-6 mobile-up:grid-cols-2">
                {featured.map((v) => (
                  <VideoCard key={v.id} video={v} large />
                ))}
              </div>
            </Section>
          )}

          {trending.length > 0 && (
            <Section
              title="Most watched"
              subtitle="What the community is watching on DN."
            >
              <div className="grid grid-cols-1 gap-6 mobile-up:grid-cols-2 lg:grid-cols-3">
                {trending.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </Section>
          )}

          {rest.length > 0 && (
            <Section title="All videos" subtitle="Explore the full library.">
              <div className="grid grid-cols-1 gap-6 mobile-up:grid-cols-2 lg:grid-cols-3">
                {rest.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      {/* Outside the empty branch on purpose: when a category matches nothing
          in the pages loaded so far, the sentinel still has to keep pulling —
          a later page may well contain matches. */}
      <InfiniteFooter
        sentinelRef={sentinelRef}
        loading={loading}
        done={done}
        failed={failed}
        onRetry={retry}
        loadedCount={allVideos.length}
        itemNoun="videos"
      />
    </>
  );
}
