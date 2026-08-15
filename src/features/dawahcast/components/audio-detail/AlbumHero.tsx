import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { PlayAllButton } from "@/features/player/PlayAllButton";
import { ShuffleAlbumButton } from "@/features/player/ShuffleAlbumButton";
import { toPlayerQueue } from "@/features/player/toPlayerTrack";
import { formatTotalDuration } from "../../albumPlayback";
import type { TrackCollection } from "../../server/audioDetail";

type Props = {
  collection: TrackCollection;
  /** Shown above the title on narrow layouts (e.g. "Album", "Playlist"). */
  kind: string;
  /** Rendered in the action row — e.g. Favourite, Share, Comment counts. */
  actions?: React.ReactNode;
};

/**
 * Album/playlist header, matching the live site: art on the left, then title,
 * a `N lectures • 1h 53m • Oldest first` meta line, and an action row of
 * labelled controls (Play in order / Shuffle / Like / Share / Comment).
 */
export function AlbumHero({ collection, kind, actions }: Props) {
  const queue = toPlayerQueue(collection.tracks);
  const total = formatTotalDuration(collection.tracks);

  return (
    <header className="rounded-2xl border border-border/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] p-5 mobile-up:p-7">
      <div className="flex flex-col gap-6 mobile-up:flex-row mobile-up:items-start">
        <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-lg bg-muted mobile-up:h-[180px] mobile-up:w-[180px]">
          {collection.image && (
            <Image
              src={collection.image}
              alt={collection.title}
              fill
              sizes="180px"
              className="object-cover"
              priority
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="mb-1 text-xs uppercase tracking-wider text-color mobile-up:hidden">
            {kind}
          </p>
          <h1 className="text-2xl font-semibold text-foreground mobile-up:text-3xl">
            {collection.title}
          </h1>

          {collection.lecturer && (
            <p className="mt-2 flex items-center gap-2 text-sm text-color">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5e5e5e]"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white">
                  <path
                    fill="currentColor"
                    d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                  />
                </svg>
              </span>
              {collection.lecturerId ? (
                <Link
                  href={ROUTES.resourcePerson(collection.lecturerId)}
                  className="truncate hover:text-foreground"
                >
                  {collection.lecturer}
                </Link>
              ) : (
                <span className="truncate">{collection.lecturer}</span>
              )}
            </p>
          )}

          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-color">
            <span>
              {collection.tracks.length}{" "}
              {collection.tracks.length === 1 ? "lecture" : "lectures"}
            </span>
            {total && (
              <>
                <span aria-hidden>•</span>
                <span>{total}</span>
              </>
            )}
            <span aria-hidden>•</span>
            <span>Oldest first</span>
          </p>

          <div className="mt-5 flex flex-wrap items-start gap-3">
            <div className="flex flex-col items-center gap-1">
              <PlayAllButton queue={queue} label="Play in order" />
              <span className="text-xs text-color">Play</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShuffleAlbumButton queue={queue} />
              <span className="text-xs text-color">Shuffle</span>
            </div>
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}
