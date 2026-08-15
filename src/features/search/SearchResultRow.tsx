import Link from "next/link";
import Image from "next/image";
import { FaPlay, FaEye } from "react-icons/fa";
import { ROUTES } from "@/lib/routes";
import { formatLectureDate } from "@/lib/formatLectureDate";
import type { SearchItem } from "./server";

function hrefForResult(type: string | undefined, id: string | number): string {
  switch ((type || "").toLowerCase()) {
    case "album":
      return ROUTES.album(id);
    case "video":
      return ROUTES.video(id);
    case "playlist":
      return ROUTES.playlist(id);
    case "lecturer":
    case "resource_person":
      return ROUTES.resourcePerson(id);
    case "recitation":
    case "quran":
      return ROUTES.recitations;
    default:
      return ROUTES.lecture(id);
  }
}

function resultImage(item: SearchItem): string | undefined {
  return (
    (item.img as string | undefined) ||
    (item.img_url as string | undefined) ||
    (item.lecturer_image as string | undefined) ||
    (item.album_image as string | undefined) ||
    (item.image as string | undefined) ||
    (item.thumbnail as string | undefined)
  );
}

export function SearchResultRow({ item }: { item: SearchItem }) {
  const type = item.type;
  const id = (item.id ?? "") as string | number;
  const title = item.mp3_title || item.title || item.name || "Untitled";
  const lecturer = item.lecturer_name;
  const duration = item.mp3_duration || item.duration;
  const views = item.views;
  const language = item.language_name;
  const date = formatLectureDate(item.updated_date);
  const img = resultImage(item);

  return (
    <Link
      href={hrefForResult(type, id)}
      className="group flex gap-3 border-b border-border p-3 transition-colors hover:bg-hover sm:gap-4 sm:p-4"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-muted sm:h-20 sm:w-20">
        {img ? (
          <Image src={img} alt={lecturer || title} fill sizes="80px" className="object-cover" />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <FaPlay className="text-xl text-white sm:text-2xl" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="mb-1 line-clamp-2 text-sm font-medium text-foreground sm:text-base">
          {title}
        </h3>
        <div className="space-y-0.5 text-xs text-muted-foreground sm:text-sm">
          {lecturer && (
            <p className="flex items-center gap-1.5">
              <span className="shrink-0 font-semibold">By:</span>
              <span className="truncate">{lecturer}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {type && (
              <span className="flex items-center gap-1">
                <span className="font-semibold">Type:</span>
                <span className="capitalize">{type}</span>
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <span className="font-semibold">Duration:</span>
                <span>{duration}</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-0.5 sm:gap-3">
            {typeof views === "number" && views > 0 && (
              <span className="flex items-center gap-1">
                <FaEye className="text-xs" />
                <span className="text-xs">{views.toLocaleString()}</span>
              </span>
            )}
            {language && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:px-2 sm:text-xs">
                {language}
              </span>
            )}
            {date && <span className="text-xs">{date}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
