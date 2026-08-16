import { Suspense } from "react";
import type { Metadata } from "next";
import { HeroSection } from "@/features/dawahcast/components/landing/HeroSection";
import { BrowseRow } from "@/features/dawahcast/components/landing/BrowseRow";
import { LeaderboardCta } from "@/features/dawahcast/components/landing/LeaderboardCta";
import { TrendingSection } from "@/features/dawahcast/components/landing/TrendingSection";
import { RecentlyPostedSection } from "@/features/dawahcast/components/landing/RecentlyPostedSection";
import { RecentlyViewedSection } from "@/features/dawahcast/components/landing/RecentlyViewedSection";
import { SpecialFeaturesSection } from "@/features/dawahcast/components/landing/SpecialFeaturesSection";
import {
  HeroSkeleton,
  LectureRowSkeleton,
} from "@/features/dawahcast/components/Skeletons";
import { ROUTES } from "@/lib/routes";
import { OG_FALLBACK_IMAGE } from "@/lib/socialMeta";

// Render per-request so the build doesn't depend on upstream being reachable.
// Per-fetch revalidate windows still cache responses across requests.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Welcome to DawahCast — discover Islamic lectures, recitations, podcasts, and videos curated for you.",
  alternates: { canonical: ROUTES.home },
  // Declaring `openGraph` replaces the root layout's block rather than merging
  // into it, so type, siteName and the share image all have to be repeated
  // here. Setting only `url` previously dropped all three.
  openGraph: {
    type: "website",
    siteName: "DawahCast",
    title: "DawahCast — Islamic lectures, recitations & podcasts",
    description:
      "Welcome to DawahCast — discover Islamic lectures, recitations, podcasts, and videos curated for you.",
    url: ROUTES.home,
    images: [
      {
        url: OG_FALLBACK_IMAGE,
        width: 1200,
        height: 630,
        alt: "DawahCast — Islamic lectures, recitations & podcasts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DawahCast — Islamic lectures, recitations & podcasts",
    description:
      "Welcome to DawahCast — discover Islamic lectures, recitations, podcasts, and videos curated for you.",
    images: [OG_FALLBACK_IMAGE],
  },
};

export default function DawahcastHomePage() {
  return (
    // CRA .landing_wrapper: `padding: 2rem 3% 4rem`. The horizontal value is a
    // percentage of the content column, so it tracks the sidebar's 240px.
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      {/* The home feed is built from carousels with their own h2s, so there was
          no h1 on the site's most important page. Visually hidden because the
          hero carousel is the design's title treatment, but it has to exist and
          be in the streamed-in-first shell rather than inside a Suspense
          boundary. */}
      <h1 className="sr-only">
        Dawah Nigeria — Islamic lectures, Quranic recitations and podcasts
      </h1>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* Both are mobile-only on the live site, sitting between the hero and the
          language chips. They render nothing above 615px. */}
      <BrowseRow />
      <LeaderboardCta />

      {/* Language chips + trending — the first content row on the live site. */}
      <Suspense fallback={<LectureRowSkeleton />}>
        <TrendingSection />
      </Suspense>

      <Suspense fallback={<LectureRowSkeleton />}>
        <RecentlyPostedSection />
      </Suspense>

      <Suspense fallback={<LectureRowSkeleton />}>
        <RecentlyViewedSection />
      </Suspense>

      <Suspense
        fallback={
          <>
            <LectureRowSkeleton />
            <LectureRowSkeleton />
          </>
        }
      >
        <SpecialFeaturesSection />
      </Suspense>
    </div>
  );
}
