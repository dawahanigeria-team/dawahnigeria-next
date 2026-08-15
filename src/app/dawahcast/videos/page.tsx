import type { Metadata } from "next";
import { getVideos, getCuratedVideos } from "@/features/dawahcast/server/video";
import { VideoHub } from "@/features/dawahcast/components/VideoHub";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Videos - Get islamic resources on Dawah Nigeria",
  description: "Watch lecture videos on DawahCast.",
  alternates: { canonical: ROUTES.videos },
};

export default async function VideosPage() {
  // Independent loads — run them together.
  const [videos, curated] = await Promise.all([
    getVideos(1),
    getCuratedVideos(),
  ]);

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Videos</h1>
      <VideoHub videos={videos} curated={curated} />
    </div>
  );
}
