import type { Metadata } from "next";
import { ComingSoon } from "@/features/dawahcast/components/ComingSoon";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";

export const metadata: Metadata = {
  title: "Podcast is coming soon on Dawah Nigeria",
  // Placeholder page — see recommend1. Remove when Podcast ships.
  robots: { index: false },
};

export default function PodcastPage() {
  return (
    <div className="px-4 py-4 sm:py-6">
      <PageHeaderRouter title="Podcast" />
      <ComingSoon />
    </div>
  );
}
