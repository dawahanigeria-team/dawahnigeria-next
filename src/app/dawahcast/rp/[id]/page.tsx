import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MdFavoriteBorder, MdChatBubbleOutline } from "react-icons/md";
import {
  getLecturer,
  getLecturerLectures,
  getLecturerAlbums,
  getLecturerPlaylists,
} from "@/features/dawahcast/server/lecturer";
import { LecturerTabs } from "@/features/dawahcast/components/LecturerTabs";
import { LabelledAction } from "@/features/dawahcast/components/audio-detail/LabelledAction";
import { ShareLectureButton } from "@/features/dawahcast/components/audio-detail/ShareLectureButton";
import { BackLink } from "@/features/dawahcast/components/BackLink";
import { getSession } from "@/features/auth/session";
import { getFavoriteIds } from "@/features/favorites/server";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { CommentSection } from "@/features/comments/CommentSection";
import type { PlaylistListItem } from "@/features/dawahcast/server/listings";
import { ROUTES } from "@/lib/routes";
import { ShareLinks } from "@/lib/ShareLinks";
import { OG_FALLBACK_IMAGE, socialImageUrl, seoTitle } from "@/lib/socialMeta";
import { env } from "@/lib/env";
import { absoluteUrl, JsonLd } from "@/lib/JsonLd";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const lecturer = await getLecturer(id);
  if (!lecturer) return { title: "Lecturer not found" };

  const description =
    lecturer.bio?.slice(0, 200) ?? `Lectures by ${lecturer.name} on DawahCast.`;

  return {
    // Was "<name> on Dawah Nigeria - Home of islamic resources", which with the
    // " · DawahCast" template ran past 100 characters — the tail Google cuts is
    // pure boilerplate, and it repeated the brand twice. Lead with the query
    // people actually type: the scholar's name.
    title: seoTitle(`Lectures by ${lecturer.name}`),
    description,
    alternates: { canonical: ROUTES.resourcePerson(id) },
    openGraph: {
      type: "profile",
      title: lecturer.name,
      description,
      images: [{ url: socialImageUrl(lecturer.image) || OG_FALLBACK_IMAGE }],
      url: ROUTES.resourcePerson(id),
    },
    twitter: {
      card: "summary",
      title: lecturer.name,
      description,
      images: [socialImageUrl(lecturer.image) || OG_FALLBACK_IMAGE],
    },
  };
}

/** The playlist endpoint is untyped; map just what PlaylistCard needs. */
function toPlaylistItems(
  rows: Array<Record<string, unknown>>,
): PlaylistListItem[] {
  return rows.map((raw) => ({
    id: (raw.id ?? raw.nid) as string | number,
    title: (raw.name || raw.playlist_name || "Untitled") as string,
    image: (raw.playlist_thumbnail || raw.img) as string | undefined,
    owner: raw.username as string | undefined,
    trackCount: Array.isArray(raw.audio) ? raw.audio.length : 0,
    raw,
  }));
}

export default async function LecturerPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  // Every fetch on this page keys off `id`, not off the lecturer record, so the
  // profile, the three tab datasets and the per-user read all start together —
  // one round trip instead of three. Each is caught individually so one empty
  // tab doesn't take down the profile.
  const lecturerPromise = getLecturer(id);
  const tabsPromise = Promise.all([
    getLecturerLectures(id, 1).catch(() => []),
    getLecturerAlbums(id, 1).catch(() => []),
    getLecturerPlaylists(id).catch(() => []),
  ]);
  const session = await getSession();
  const favoritesPromise = session
    ? getFavoriteIds(session.user.id, "rp").catch(() => undefined)
    : null;

  const lecturer = await lecturerPromise;
  if (!lecturer) notFound();
  const canonicalUrl = absoluteUrl(env.siteUrl, ROUTES.resourcePerson(id));

  const [lectures, albums, playlistRows] = await tabsPromise;
  const favoriteLecturerIds = (await favoritesPromise) ?? undefined;

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <ShareLinks path={ROUTES.resourcePerson(id)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: lecturer.name,
          description: lecturer.bio,
          image: lecturer.image,
          url: canonicalUrl,
        }}
      />

      {/* Breadcrumb — live renders "Back/ <name>" */}
      <div className="mb-5 flex items-center gap-2 text-sm">
        <BackLink variant="inline" />
        <span className="text-color" aria-hidden>
          /
        </span>
        <span className="truncate text-foreground">{lecturer.name}</span>
      </div>

      <header className="mb-10 flex flex-col items-center gap-6 text-center mobile-up:flex-row mobile-up:items-center mobile-up:text-left">
        <div className="relative h-[180px] w-[180px] shrink-0 overflow-hidden rounded-full bg-muted">
          {lecturer.image && (
            <Image
              src={lecturer.image}
              alt={lecturer.name}
              fill
              sizes="180px"
              className="object-cover"
              priority
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-foreground mobile-up:text-3xl">
            {lecturer.name}
          </h1>
          {lecturer.bio && (
            <p className="mt-2 text-sm text-color">{lecturer.bio}</p>
          )}

          <div className="mt-5 flex flex-wrap items-start justify-center gap-3 mobile-up:justify-start">
            <LabelledAction label="Like" count={lecturer.favorites}>
              {session ? (
                <FavoriteButton
                  itemId={id}
                  type="rp"
                  initialFavorited={Boolean(favoriteLecturerIds?.has(id))}
                  label={lecturer.name}
                />
              ) : (
                <Link
                  href={`/auth/login?next=${encodeURIComponent(ROUTES.resourcePerson(id))}`}
                  aria-label={`Sign in to like ${lecturer.name}`}
                  className="flex min-h-11 min-w-11 items-center justify-center"
                >
                  <MdFavoriteBorder className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </LabelledAction>

            <LabelledAction label="Share" count={lecturer.share}>
              <ShareLectureButton
                title={lecturer.name}
                href={ROUTES.resourcePerson(id)}
                variant="icon"
                className="text-foreground"
              />
            </LabelledAction>

            <LabelledAction label="Comment" count={lecturer.comment}>
              <a
                href="#comments"
                aria-label="Jump to comments"
                className="flex min-h-11 min-w-11 items-center justify-center"
              >
                <MdChatBubbleOutline className="h-4 w-4" aria-hidden />
              </a>
            </LabelledAction>
          </div>
        </div>
      </header>

      <LecturerTabs
        lectures={lectures}
        albums={albums}
        playlists={toPlaylistItems(playlistRows)}
        totals={{
          audio: lecturer.totalAudio,
          albums: lecturer.totalAlbums,
          playlists: lecturer.totalPlaylists,
        }}
      />

      <CommentSection
        itemId={id}
        type="rp"
        pathname={ROUTES.resourcePerson(id)}
      />
    </div>
  );
}
