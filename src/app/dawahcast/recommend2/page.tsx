import type { Metadata } from "next";
import { ComingSoon } from "@/features/dawahcast/components/ComingSoon";

export const metadata: Metadata = {
  title: "Podcast is coming soon on Dawah Nigeria",
};

export default function PodcastPage() {
  return (
    <div className="px-4 py-4 sm:py-6">
      <ComingSoon />
    </div>
  );
}
