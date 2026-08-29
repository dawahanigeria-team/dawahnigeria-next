import Link from "next/link";
import Image from "next/image";
import { FiEye } from "react-icons/fi";
import { MdFavorite } from "react-icons/md";
import { IoShareSocialOutline, IoChatbubbleOutline } from "react-icons/io5";
import { ROUTES } from "@/lib/routes";
import { formatNumber } from "@/lib/formatNumber";
import { formatDuration, resolveLecture } from "../lectureFields";
import { DownloadButton } from "./DownloadButton";
import { ShareLectureButton } from "./audio-detail/ShareLectureButton";
import { AddToPlaylistMenu } from "@/features/library/AddToPlaylistMenu";
import { RowPlayControl, RowQueueProvider } from "./RowPlay";
import { lectureQueue, lectureToPlayerTrack } from "@/features/player/toPlayerTrack";
import type { UserPlaylist } from "@/features/library/server";
import type { LectureSummary } from "../server/landing";

/**
 * Numbered listing table used by Trending / New / Charts, ported from CRA's
 * `components/list/list.jsx` + `list.scss`.
 *
 * Desktop lays out as `#/Title | Lecturer | Time` with the title column at 35%;
 * below 615px the lecturer and time columns drop and each row becomes a card,
 * which is what the live site does.
 */
export function LectureTableHeader() {
  return (
    <div className="mb-2 hidden w-full grid-cols-[35%_1fr_auto] items-center gap-4 border-b border-white/10 pb-2 text-[14px] text-color mobile-up:grid">
      <div className="flex items-center gap-4">
        <span className="w-5 text-center">#</span>
        <span>Title</span>
      </div>
      <span>Lecturer</span>
      <span className="pr-2">Time</span>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1" title={`${value} ${label}`}>
      <span className="flex h-3 w-3 items-center justify-center text-[12px]" aria-hidden>
        {icon}
      </span>
      <span className="text-[12px]">{formatNumber(value)}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LectureTableRow({
  lecture,
  index,
  highlight,
  playlists,
}: {
  lecture: LectureSummary;
  /** Zero-based; rendered as a 1-based rank. */
  index: number;
  /** CRA marks the top 3 with a brand-tinted left border. */
  highlight?: boolean;
  /** Signed-in user's playlists; omitted for anonymous visitors. */
  playlists?: UserPlaylist[];
}) {
  const l = resolveLecture(lecture);
  const time = formatDuration(l.duration);

  return (
    <div
      className={[
        "group w-full border-b border-white/5 transition-colors hover:bg-white/[0.03]",
        highlight ? "border-l-2 border-l-[#ffa736]" : "border-l-2 border-l-transparent",
      ].join(" ")}
    >
      <div className="grid grid-cols-1 items-center gap-4 py-3 pl-3 pr-2 mobile-up:grid-cols-[35%_1fr_auto]">
        {/* # + thumbnail + title/stats */}
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <RowPlayControl track={lectureToPlayerTrack(lecture)} index={index} />
            <Link
              href={ROUTES.lecture(l.id)}
              className="relative h-[43px] w-[43px] shrink-0 overflow-hidden rounded-[3px] bg-muted"
            >
              {l.image && (
                <Image
                  src={l.image}
                  alt=""
                  fill
                  sizes="43px"
                  className="object-cover"
                />
              )}
            </Link>
            <div className="flex min-w-0 flex-col items-start">
              <Link
                href={ROUTES.lecture(l.id)}
                className="mb-[3px] line-clamp-1 text-[14px] text-foreground hover:text-gray-400"
              >
                {l.title}
              </Link>
              <div className="flex flex-row flex-wrap items-center gap-3 text-color">
                <Stat icon={<FiEye />} value={l.views} label="views" />
                <Stat icon={<MdFavorite />} value={l.favorites} label="favourites" />
                <Stat icon={<IoShareSocialOutline />} value={l.shares} label="shares" />
                <Stat icon={<IoChatbubbleOutline />} value={l.comments} label="comments" />
              </div>
            </div>
          </div>
          {/* Quick download on mobile */}
          <div className="flex shrink-0 items-center mobile-up:hidden">
            <DownloadButton
              lectureId={String(l.id)}
              title={l.title}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-color transition-colors hover:text-foreground active:scale-95"
            />
          </div>
        </div>

        {/* Lecturer — hidden on mobile, as on the live site */}
        <div className="hidden min-w-0 mobile-up:block">
          {l.lecturer &&
            (l.lecturerId ? (
              <Link
                href={ROUTES.resourcePerson(l.lecturerId)}
                className="line-clamp-2 text-[13px] text-color hover:text-foreground"
              >
                {l.lecturer}
              </Link>
            ) : (
              <span className="line-clamp-2 text-[13px] text-color">
                {l.lecturer}
              </span>
            ))}
        </div>

        {/* Row actions + duration */}
        <div className="hidden items-center gap-3 pr-2 mobile-up:flex">
          {playlists && (
            <AddToPlaylistMenu
              audioId={l.id}
              playlists={playlists}
              label={l.title}
            />
          )}
          <ShareLectureButton
            title={l.title}
            lecturer={l.lecturer}
            href={ROUTES.lecture(l.id)}
            variant="icon"
            className="text-color transition-colors hover:text-foreground"
          />
          <DownloadButton lectureId={l.id} title={l.title} />
          <span className="min-w-[52px] text-right text-[13px] tabular-nums text-color">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LectureTable({
  lectures,
  highlightTop = 0,
  playlists,
}: {
  lectures: LectureSummary[];
  /** How many leading rows get the brand accent (CRA uses 3 on Trending). */
  highlightTop?: number;
  playlists?: UserPlaylist[];
}) {
  if (!lectures.length) return null;
  return (
    <RowQueueProvider queue={lectureQueue(lectures)}>
      <div className="w-full">
        <LectureTableHeader />
        {lectures.map((lecture, i) => (
          <LectureTableRow
            key={`${lecture.nid ?? lecture.id}-${i}`}
            lecture={lecture}
            index={i}
            highlight={i < highlightTop}
            playlists={playlists}
          />
        ))}
      </div>
    </RowQueueProvider>
  );
}
