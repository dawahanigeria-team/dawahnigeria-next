import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MdFavoriteBorder } from "react-icons/md";
import { DownloadButton } from "@/features/dawahcast/components/DownloadButton";
import { BiMessageRounded } from "react-icons/bi";
import { getLecture } from "@/features/dawahcast/server/audioDetail";
import { SimilarByCategorySection } from "@/features/dawahcast/components/audio-detail/SimilarByCategorySection";
import { ShareLectureButton } from "@/features/dawahcast/components/audio-detail/ShareLectureButton";
import { LabelledAction } from "@/features/dawahcast/components/audio-detail/LabelledAction";
import { BackLink } from "@/features/dawahcast/components/BackLink";
import { LectureRowSkeleton } from "@/features/dawahcast/components/Skeletons";
import { PlayButton } from "@/features/player/PlayButton";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { AddToPlaylistMenu } from "@/features/library/AddToPlaylistMenu";
import { getSession } from "@/features/auth/session";
import { getFavoriteIds } from "@/features/favorites/server";
import { getUserPlaylists } from "@/features/library/server";
import { CommentSection } from "@/features/comments/CommentSection";
import { formatReleaseDate } from "@/lib/formatLectureDate";
import type { PlayerTrack } from "@/features/player/types";
import { ROUTES } from "@/lib/routes";
import { ShareLinks } from "@/lib/ShareLinks";
import {
  OG_FALLBACK_IMAGE,
  socialImageUrl,
  lectureShareDescription,
  isUsableDescription,
  seoTitle,
} from "@/lib/socialMeta";
import { env } from "@/lib/env";
import { absoluteUrl, durationToIso8601, JsonLd } from "@/lib/JsonLd";

type Params = { id: string };


export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const lecture = await getLecture(id);
  if (!lecture) return { title: "Lecture not found" };

  // The upstream `description` is usually generated file metadata rather than
  // prose, so it is used only when it actually reads like a summary.
  const description = isUsableDescription(lecture.description)
    ? lecture.description
    : lectureShareDescription({
        title: lecture.title,
        lecturer: lecture.lecturer,
        albumName: lecture.albumName,
      });

  // Naming the lecturer in the title is what makes a shared link legible in a
  // WhatsApp list, where the title is often all that is read.
  const shareTitle = lecture.lecturer
    ? `${lecture.title} — ${lecture.lecturer}`
    : lecture.title;
  const images = [socialImageUrl(lecture.image) || OG_FALLBACK_IMAGE];

  return {
    // `shareTitle` below stays full-length on purpose — a WhatsApp card has room
    // for it. The SERP title does not, so it gets the trimmed form.
    title: seoTitle(lecture.title, lecture.lecturer),
    description,
    alternates: { canonical: ROUTES.lecture(id) },
    openGraph: {
      type: "music.song",
      siteName: "DawahCast",
      title: shareTitle,
      description,
      images,
      url: ROUTES.lecture(id),
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images,
    },
  };
}

export default async function LectureDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  // Started before the session read so the per-user calls overlap it instead of
  // queueing behind it. getSession() only reads cookies, so it costs nothing
  // here. See the album page for the same shape.
  const lecturePromise = getLecture(id);
  const session = await getSession();
  // Hearts and the playlist menu are decoration on a public page — a failure
  // should cost them, not the lecture. Also keeps the promise from floating
  // unhandled if the lecture 404s below.
  const userDataPromise = session
    ? Promise.all([
        getFavoriteIds(session.user.id, "audio"),
        getUserPlaylists(session.user.id),
      ]).catch(() => [undefined, undefined] as const)
    : null;

  const lecture = await lecturePromise;
  if (!lecture) notFound();

  const [favoriteAudioIds, userPlaylists] = (await userDataPromise) ?? [
    undefined,
    undefined,
  ];

  const playerTrack: PlayerTrack | null = lecture.audioUrl
    ? {
        id: lecture.id,
        title: lecture.title,
        lecturer: lecture.lecturer,
        image: lecture.image,
        audioUrl: lecture.audioUrl,
        href: ROUTES.lecture(lecture.id),
      }
    : null;

  const albumName = lecture.albumName;
  const releaseDate = formatReleaseDate(lecture.postDate);
  const canonicalUrl = absoluteUrl(env.siteUrl, ROUTES.lecture(id));

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <ShareLinks path={ROUTES.lecture(id)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AudioObject",
          name: lecture.title,
          description:
            lecture.description ||
            (lecture.lecturer ? `${lecture.title} by ${lecture.lecturer}.` : lecture.title),
          url: canonicalUrl,
          mainEntityOfPage: canonicalUrl,
          contentUrl: lecture.audioUrl,
          thumbnailUrl: lecture.image,
          uploadDate: lecture.postDate,
          duration: durationToIso8601(lecture.duration),
          inLanguage: lecture.raw.language || lecture.raw.lang,
          creator: lecture.lecturer
            ? { "@type": "Person", name: lecture.lecturer }
            : undefined,
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: { "@type": "ListenAction" },
            userInteractionCount: lecture.views,
          },
        }}
      />
      <BackLink />

      {/* Hero */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-56 sm:w-56">
          {lecture.image ? (
            <Image
              src={lecture.image}
              alt={lecture.title}
              fill
              sizes="(min-width: 640px) 224px, 192px"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {lecture.title}
          </h1>
          {lecture.lecturer && (
            <p className="text-sm text-foreground">{lecture.lecturer}</p>
          )}
          {/* Album this lecture belongs to — live shows it under the lecturer. */}
          {albumName && <p className="text-sm text-color">{albumName}</p>}

          {/* Action row — bordered icon boxes with captions, as on live. */}
          <div className="mt-4 flex flex-wrap items-start gap-3">
            {playerTrack && (
              <LabelledAction label="Play">
                <PlayButton track={playerTrack} variant="round" />
              </LabelledAction>
            )}

            <LabelledAction label="Like" count={lecture.favorites}>
              {session ? (
                <FavoriteButton
                  itemId={id}
                  type="audio"
                  initialFavorited={Boolean(favoriteAudioIds?.has(id))}
                  label={lecture.title}
                />
              ) : (
                <Link
                  href={`/auth/login?next=${encodeURIComponent(ROUTES.lecture(id))}`}
                  aria-label={`Sign in to like ${lecture.title}`}
                  className="flex min-h-11 min-w-11 items-center justify-center"
                >
                  <MdFavoriteBorder className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </LabelledAction>

            <LabelledAction label="Share" count={lecture.share}>
              <ShareLectureButton
                title={lecture.title}
                lecturer={lecture.lecturer}
                href={ROUTES.lecture(id)}
                variant="icon"
                className="text-foreground"
              />
            </LabelledAction>

            <LabelledAction label="Comment" count={lecture.comment}>
              <a
                href="#comments"
                aria-label="Jump to comments"
                className="flex min-h-11 min-w-11 items-center justify-center"
              >
                <BiMessageRounded className="h-4 w-4" aria-hidden />
              </a>
            </LabelledAction>

            <LabelledAction label="Download" count={lecture.downloads}>
              <DownloadButton
                lectureId={id}
                title={lecture.title}
                className="flex items-center text-foreground"
              />
            </LabelledAction>

            {userPlaylists && (
              <LabelledAction label="Playlist">
                <AddToPlaylistMenu
                  audioId={id}
                  playlists={userPlaylists}
                  label={lecture.title}
                />
              </LabelledAction>
            )}
          </div>
        </div>
      </header>

      {/* Info */}
      <section className="mt-6 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Category:</span>
          {lecture.categoryId !== undefined ? (
            <Link
              href={ROUTES.category(lecture.categoryId)}
              className="text-foreground hover:underline"
            >
              {lecture.categoryName || "Unknown"}
            </Link>
          ) : (
            <span className="text-foreground">{lecture.categoryName || "Unknown"}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Date of Release:</span>
          <span className="text-foreground">{releaseDate || "—"}</span>
        </div>
      </section>

      {/* Summary — always shown; live prints "unknown" when empty. */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-foreground">Summary</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-color">
          {lecture.description || "unknown"}
        </p>
      </section>

      {/* Similar Audio (same category) */}
      {lecture.categoryId !== undefined && (
        <Suspense fallback={<LectureRowSkeleton />}>
          <SimilarByCategorySection
            categoryId={lecture.categoryId}
            excludeId={id}
          />
        </Suspense>
      )}

      {/* Comments */}
      <div id="comments">
        <CommentSection itemId={id} type="audio" pathname={ROUTES.lecture(id)} />
      </div>
    </div>
  );
}
