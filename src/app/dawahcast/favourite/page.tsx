import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import {
  getFavorites,
  type FavoriteType,
} from "@/features/favorites/server";
import { LectureCard } from "@/features/dawahcast/components/LectureCard";
import { LecturerCard } from "@/features/dawahcast/components/LecturerCard";
import { PlaylistCard } from "@/features/dawahcast/components/PlaylistCard";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";

const TABS: Array<{
  key: FavoriteType;
  label: string;
  emptyCopy: string;
}> = [
  { key: "audio", label: "Lectures", emptyCopy: "Lectures you favorite will appear here." },
  { key: "album", label: "Albums", emptyCopy: "Favorited albums will appear here." },
  { key: "rp", label: "Lecturers", emptyCopy: "Lecturers you favorite will appear here." },
  { key: "playlist", label: "Playlists", emptyCopy: "Favorited playlists will appear here." },
];

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your saved lectures, albums, lecturers, and playlists.",
  alternates: { canonical: ROUTES.favourite },
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function getTab(searchTab: string | undefined): (typeof TABS)[number] {
  return TABS.find((t) => t.key === searchTab) ?? TABS[0];
}

export default async function FavouritePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(ROUTES.favourite)}`);
  }

  const { tab: tabParam } = await searchParams;
  const tab = getTab(tabParam);
  const items = await getFavorites(session.user.id, tab.key);

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <PageHeaderRouter title="Favourites" />
      <h1 className="text-2xl font-semibold text-foreground">Favorites</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Items you&apos;ve saved on DawahCast.
      </p>

      <nav
        aria-label="Favorites category"
        className="mt-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {TABS.map((t) => {
          const active = t.key === tab.key;
          return (
            <Link
              key={t.key}
              href={`${ROUTES.favourite}?tab=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={[
                "border-b-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-foreground font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          {tab.emptyCopy}
        </p>
      ) : (
        <FavoriteGrid kind={tab.key} items={items} />
      )}
    </div>
  );
}

function FavoriteGrid({
  kind,
  items,
}: {
  kind: FavoriteType;
  items: Record<string, unknown>[];
}) {
  if (kind === "rp") {
    return (
      <ul className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((raw, i) => {
          const id = (raw.nid ?? raw.id) as string | number | undefined;
          if (id === undefined) return null;
          const name =
            (raw.rpname as string | undefined) ||
            (raw.name as string | undefined) ||
            "Unknown lecturer";
          const image = (raw.img as string | undefined) || (raw.image as string | undefined);
          return (
            <li key={`${id}-${i}`} className="relative">
              <LecturerCard
                lecturer={{ id, name, image, raw }}
              />
              <FavoriteButton
                itemId={id}
                type="rp"
                initialFavorited
                label={name}
                className="absolute right-1 top-1 bg-background/80"
              />
            </li>
          );
        })}
      </ul>
    );
  }

  if (kind === "playlist") {
    return (
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {items.map((raw, i) => {
          const id =
            (raw.playlist_id as string | number | undefined) ??
            (raw.id as string | number | undefined);
          if (id === undefined) return null;
          const title =
            (raw.playlist_name as string | undefined) ||
            (raw.title as string | undefined) ||
            "Untitled";
          const image =
            (raw.playlist_image as string | undefined) ||
            (raw.image as string | undefined);
          const owner = raw.username as string | undefined;
          return (
            <li key={`${id}-${i}`} className="relative">
              <PlaylistCard
                playlist={{
                  id,
                  title,
                  image,
                  owner,
                  trackCount: Number(raw.lec_no ?? 0) || 0,
                  raw,
                }}
              />
              <FavoriteButton
                itemId={id}
                type="playlist"
                initialFavorited
                label={title}
                className="absolute right-1 top-1 bg-background/80"
              />
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {items.map((raw, i) => {
        const id = (raw.nid ?? raw.id) as string | number | undefined;
        if (id === undefined) return null;
        const title =
          (raw.mp3_title as string | undefined) ||
          (raw.Title as string | undefined) ||
          (raw.title as string | undefined) ||
          "Untitled";
        return (
          <li key={`${id}-${i}`} className="relative">
            <LectureCard lecture={raw as Parameters<typeof LectureCard>[0]["lecture"]} />
            <FavoriteButton
              itemId={id}
              type={kind}
              initialFavorited
              label={title}
              className="absolute right-1 top-1 bg-background/80"
            />
          </li>
        );
      })}
    </ul>
  );
}
