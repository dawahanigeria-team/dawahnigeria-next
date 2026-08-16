import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MdFavoriteBorder, MdChatBubbleOutline } from "react-icons/md";
import { getVideo, getVideos } from "@/features/dawahcast/server/video";
import { LabelledAction } from "@/features/dawahcast/components/audio-detail/LabelledAction";
import { ShareLectureButton } from "@/features/dawahcast/components/audio-detail/ShareLectureButton";
import { formatNumber } from "@/lib/formatNumber";
import { YouTubeEmbed } from "@/features/dawahcast/components/video-detail/YouTubeEmbed";
import { CommentSection } from "@/features/comments/CommentSection";
import { ROUTES } from "@/lib/routes";
import { OG_FALLBACK_IMAGE, socialImageUrl } from "@/lib/socialMeta";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) return { title: "Video not found" };

  const description = video.description?.slice(0, 200) ?? (
    video.lecturer ? `Watch ${video.title} by ${video.lecturer} on DawahCast.`
                   : `Watch ${video.title} on DawahCast.`
  );

  return {
    title: video.title,
    description,
    alternates: { canonical: ROUTES.video(id) },
    openGraph: {
      type: "video.other",
      title: video.title,
      description,
      images: [{ url: socialImageUrl(video.thumbnail) || OG_FALLBACK_IMAGE }],
      url: ROUTES.video(id),
    },
    twitter: {
      card: "player",
      title: video.title,
      description,
      images: [socialImageUrl(video.thumbnail) || OG_FALLBACK_IMAGE],
    },
  };
}

export default async function VideoPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  // "You may also like" — the rest of the catalogue, most-viewed first.
  const related = (await getVideos(1).catch(() => []))
    .filter((v) => String(v.id) !== String(id))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href={ROUTES.videos} className="text-color hover:text-foreground">
          Videos
        </Link>
        <span className="text-color" aria-hidden>
          /
        </span>
        <span className="truncate text-foreground">{video.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {video.youtubeId ? (
            <YouTubeEmbed youtubeId={video.youtubeId} title={video.title} />
          ) : (
            <div className="aspect-video w-full rounded-md bg-muted" />
          )}

          <header className="mt-4">
            <h1 className="text-xl font-semibold text-foreground mobile-up:text-2xl">
              {video.title}
            </h1>
            <p className="mt-1 text-sm text-color">
              {formatNumber(video.views)} views
              {video.lecturer && `, ${video.lecturer}`}
            </p>

            <div className="mt-4 flex flex-wrap items-start gap-3">
              <LabelledAction label="Like" count={video.favorites}>
                <MdFavoriteBorder className="h-4 w-4" aria-hidden />
              </LabelledAction>
              <LabelledAction label="Share">
                <ShareLectureButton
                  title={video.title}
                  lecturer={video.lecturer}
                  href={ROUTES.video(id)}
                  variant="icon"
                  className="text-foreground"
                />
              </LabelledAction>
              <LabelledAction label="Comment">
                <a href="#comments" aria-label="Jump to comments" className="flex items-center">
                  <MdChatBubbleOutline className="h-4 w-4" aria-hidden />
                </a>
              </LabelledAction>
            </div>

            {video.description && (
              <p className="mt-4 whitespace-pre-line text-sm text-color">
                {video.description}
              </p>
            )}
          </header>

          <CommentSection itemId={id} type="video" pathname={ROUTES.video(id)} />
        </div>

        {related.length > 0 && (
          <aside aria-label="You may also like">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              You may also like
            </h2>
            <ul className="flex flex-col gap-4">
              {related.map((v) => (
                <li key={v.id}>
                  <Link href={ROUTES.video(v.id)} className="group flex gap-3">
                    <span className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-md bg-muted">
                      {v.thumbnail && (
                        <Image
                          src={v.thumbnail}
                          alt=""
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm text-foreground group-hover:text-dncolor-500">
                        {v.title}
                      </span>
                      <span className="mt-1 block text-xs text-color">
                        {formatNumber(v.views)} views
                      </span>
                      {v.lecturer && (
                        <span className="block truncate text-xs text-color">
                          {v.lecturer}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
