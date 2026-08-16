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

// Render per-request so the build doesn't depend on upstream being reachable.
// Per-fetch revalidate windows still cache responses across requests.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Welcome to DawahCast — discover Islamic lectures, recitations, podcasts, and videos curated for you.",
  alternates: { canonical: ROUTES.home },
  openGraph: { url: ROUTES.home },
};

export default function DawahcastHomePage() {
  return (
    // CRA .landing_wrapper: `padding: 2rem 3% 4rem`. The horizontal value is a
    // percentage of the content column, so it tracks the sidebar's 240px.
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
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
