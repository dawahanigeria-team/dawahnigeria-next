import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/lib/routes";
import { formatDuration, resolveLecture } from "../lectureFields";
import { DownloadButton } from "./DownloadButton";
import { ShareLectureButton } from "./audio-detail/ShareLectureButton";
import { AddToPlaylistMenu } from "@/features/library/AddToPlaylistMenu";
import { RowPlayControl, RowQueueProvider } from "./RowPlay";
import { lectureQueue, lectureToPlayerTrack } from "@/features/player/toPlayerTrack";
import type { UserPlaylist } from "@/features/library/server";
import type { LectureSummary } from "../server/landing";

/**
 * Card-style listing used only by New Releases, which runs its own editorial
 * palette (accent #d4a574 on a #1a1d2e surface) rather than the app theme.
 * Trending's flush `LectureTable` is the other listing style — the live site
 * genuinely uses two.
 */
export function NewReleaseTable({
  lectures,
  playlists,
}: {
  lectures: LectureSummary[];
  playlists?: UserPlaylist[];
}) {
  if (!lectures.length) return null;

  return (
    <RowQueueProvider queue={lectureQueue(lectures)}>
      <div className="w-full font-body">
        {/* Column headers — uppercase, letterspaced */}
        <div className="mb-4 hidden grid-cols-[3rem_minmax(0,1fr)_15rem_auto] items-center gap-4 border-b border-white/[0.08] px-4 pb-4 text-[0.75rem] uppercase tracking-[0.08em] text-[#7a7768] mobile-up:grid">
          <span>#</span>
          <span>Title</span>
          <span>Lecturer</span>
          <span className="text-right">Duration</span>
        </div>

        <ul className="flex flex-col gap-2">
          {lectures.map((lecture, i) => {
            const l = resolveLecture(lecture);
            const time = formatDuration(l.duration);
            return (
              <li
                key={`${l.id}-${i}`}
                className="group grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-4 rounded-xl border border-transparent bg-[#1a1d2e]/60 px-4 py-3 transition-all hover:border-[rgba(212,165,116,0.15)] hover:bg-[#252939]/70 mobile-up:grid-cols-[3rem_minmax(0,1fr)_15rem_auto]"
              >
                <RowPlayControl
                  track={lectureToPlayerTrack(lecture)}
                  index={i}
                  className="w-8"
                  numberClassName="text-[0.938rem] text-[#7a7768]"
                  buttonClassName="text-[#e8b887] hover:bg-white/10"
                />

                <div className="flex min-w-0 items-center gap-4">
                  <Link
                    href={ROUTES.lecture(l.id)}
                    className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#252939]"
                  >
                    {l.image && (
                      <Image
                        src={l.image}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <Link
                    href={ROUTES.lecture(l.id)}
                    className="line-clamp-2 min-w-0 text-[0.938rem] text-[#f5f3ef] transition-colors hover:text-[#e8b887]"
                  >
                    {l.title}
                  </Link>
                </div>

                <div className="hidden min-w-0 mobile-up:block">
                  {l.lecturer &&
                    (l.lecturerId ? (
                      <Link
                        href={ROUTES.resourcePerson(l.lecturerId)}
                        className="line-clamp-2 text-[0.875rem] text-[#b8b5ad] transition-colors hover:text-[#e8b887]"
                      >
                        {l.lecturer}
                      </Link>
                    ) : (
                      <span className="line-clamp-2 text-[0.875rem] text-[#b8b5ad]">
                        {l.lecturer}
                      </span>
                    ))}
                </div>

                <div className="hidden items-center gap-3 mobile-up:flex">
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
                    className="text-[#b8b5ad] transition-colors hover:text-[#e8b887]"
                  />
                  <DownloadButton
                    lectureId={l.id}
                    title={l.title}
                    className="text-[#b8b5ad] transition-colors hover:text-[#e8b887]"
                  />
                  {time && (
                    <span className="min-w-[3.5rem] rounded-md bg-white/5 px-2 py-1 text-center text-[0.813rem] tabular-nums text-[#b8b5ad]">
                      {time}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </RowQueueProvider>
  );
}
