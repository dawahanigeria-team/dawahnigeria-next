import Link from "next/link";
import Image from "next/image";
import { FiEye } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";
import { PlayButton } from "@/features/player/PlayButton";
import { DownloadButton } from "./DownloadButton";
import { lectureToPlayerTrack } from "@/features/player/toPlayerTrack";
import type { PlayerTrack } from "@/features/player/types";
import type { LectureSummary } from "../server/landing";

function formatViews(n: string | number | undefined): string {
  if (n === undefined || n === null) return "";
  const num = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(num) || num === 0) return "";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export function LectureCard({
  lecture,
  queue,
}: {
  lecture: LectureSummary;
  /** The rest of the row, so playing a card keeps going instead of stopping. */
  queue?: PlayerTrack[];
}) {
  const raw = lecture as Record<string, unknown>;
  const id = lecture.nid ?? lecture.id;
  // The upstream PHP endpoints use a mix of field names (mp3_title vs Title vs
  // title, mp3_thumbnail vs img vs image, rpname vs lecturer). Read them all.
  const title =
    (raw.mp3_title as string | undefined) ||
    (raw.lectitle as string | undefined) ||
    (raw.album_name as string | undefined) ||
    lecture.title ||
    (raw.Title as string | undefined) ||
    "Untitled";
  const lecturer =
    lecture.lecturer ||
    (raw.rpname as string | undefined) ||
    (raw.rp as string | undefined);
  const img =
    (raw.mp3_thumbnail as string | undefined) ||
    lecture.image ||
    (raw.img as string | undefined) ||
    (raw.lec_thumbnail as string | undefined) ||
    (raw.lec_img as string | undefined);
  const views = formatViews(lecture.views);

  // Null when the record has no usable audio, so a card whose file is missing
  // shows no control rather than one that can only fail.
  const playerTrack = lectureToPlayerTrack(lecture);

  return (
    // The card is one link, not two. The title's `after:` pseudo-element is
    // stretched over the whole card to make it clickable, which keeps the play
    // control a real sibling button rather than a <button> nested in an <a>.
    <div className="group relative flex w-full flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
        {img ? (
          <Image
            src={img}
            alt=""
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {views && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
            <FiEye aria-hidden />
            <span>{views}</span>
          </div>
        )}
        {/* Quick action buttons (Download + Play) */}
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 opacity-100 transition-opacity mobile-up:opacity-0 mobile-up:group-hover:opacity-100 mobile-up:group-focus-within:opacity-100">
          <DownloadButton
            lectureId={String(id)}
            title={title}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-105"
          />
          {playerTrack && (
            <PlayButton track={playerTrack} queue={queue} variant="round" />
          )}
        </div>
      </div>
      <div className="px-0.5">
        <Link
          href={ROUTES.lecture(id)}
          className="line-clamp-2 text-xs font-medium text-foreground after:absolute after:inset-0 sm:text-sm"
        >
          {title}
        </Link>
        {lecturer && (
          <p className="line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">
            {lecturer}
          </p>
        )}
      </div>
    </div>
  );
}
