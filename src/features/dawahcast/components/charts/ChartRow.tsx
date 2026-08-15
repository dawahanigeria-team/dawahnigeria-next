import Link from "next/link";
import Image from "next/image";
import { FiEye } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";
import { ScrollRow } from "../ScrollRow";
import { CardPlayControl, RowQueueProvider } from "../RowPlay";
import { lectureQueue, lectureToPlayerTrack } from "@/features/player/toPlayerTrack";
import type { LectureSummary } from "../../server/landing";
import type { ChartItem, ChartKind } from "../../server/charts";

const RANK_COLORS = ["bg-[#ffa736]", "bg-[#76a8d7]", "bg-[#96734a]"];

function hrefFor(kind: ChartKind, id: string | number): string {
  switch (kind) {
    case "album":
      return ROUTES.album(id);
    case "lecturer":
      return ROUTES.resourcePerson(id);
    case "playlist":
      return ROUTES.playlist(id);
    default:
      return ROUTES.lecture(id);
  }
}

function formatViews(n: number | undefined): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ChartRow({
  heading,
  kind,
  items,
  limit = 10,
}: {
  heading: string;
  kind: ChartKind;
  items: ChartItem[];
  limit?: number;
}) {
  if (!items.length) return null;
  const list = items.slice(0, limit);
  const rounded = kind === "lecturer";

  // Only the lecture charts are single playable tracks — an album, lecturer or
  // playlist card opens a page instead. Their `raw` records carry `mp3_url`.
  const playable = kind === "lectures";
  const queue = playable
    ? lectureQueue(list.map((item) => item.raw as LectureSummary))
    : [];

  return (
    <RowQueueProvider queue={queue}>
      <section className="my-4 sm:my-6">
        <h2 className="mb-3 px-1 text-lg font-bold text-foreground sm:text-xl">
          {heading}
        </h2>
        <ScrollRow>
          {list.map((item, i) => {
            const views = formatViews(item.views);
            return (
              <li key={`${item.id}-${i}`} className="group relative shrink-0">
                <Link
                  href={hrefFor(kind, item.id)}
                  className="flex w-[140px] flex-col gap-2 sm:w-[160px]"
                >
                  <div
                    className={`relative aspect-square w-full overflow-hidden bg-muted ${
                      rounded ? "rounded-full" : "rounded-md"
                    }`}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="160px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : null}
                    {views && (
                      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
                        <FiEye aria-hidden />
                        <span>{views}</span>
                      </div>
                    )}
                    {i < 3 && (
                      <span
                        className={`absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full text-xl text-white ${RANK_COLORS[i]}`}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <div className="px-0.5">
                    <p className="line-clamp-2 text-xs font-medium text-foreground sm:text-sm">
                      {item.title}
                    </p>
                    {item.lecturer && (
                      <p className="line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">
                        {item.lecturer}
                      </p>
                    )}
                  </div>
                </Link>
                {playable && (
                  <CardPlayControl
                    track={lectureToPlayerTrack(item.raw as LectureSummary)}
                  />
                )}
              </li>
            );
          })}
        </ScrollRow>
      </section>
    </RowQueueProvider>
  );
}
