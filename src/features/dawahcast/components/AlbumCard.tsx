import Image from "next/image";
import Link from "next/link";
import { FiEye } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";
import { formatNumber } from "@/lib/formatNumber";
import type { LectureSummary } from "../server/landing";

/**
 * Album tile used by Recitations (and any album listing).
 *
 * Distinct from `LectureCard` in two ways that matter: it links to
 * `/dawahcast/a/{id}` rather than `/l/{id}`, and album endpoints title their
 * rows with `name` — a key the lecture resolver deliberately doesn't read,
 * since on other shapes `name` is the *lecturer*.
 */
export function AlbumCard({ album }: { album: LectureSummary }) {
  const raw = album as unknown as Record<string, unknown>;
  const id = String(album.nid ?? album.id ?? "");
  const title =
    (raw.name as string | undefined) ||
    (raw.album_name as string | undefined) ||
    album.title ||
    "Untitled";
  const image =
    (raw.alb_thumbnail as string | undefined) ||
    (raw.img as string | undefined) ||
    album.image;
  const views = Number(raw.views ?? 0) || 0;

  return (
    <Link href={ROUTES.album(id)} className="group flex w-full flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
        {image && (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 1024px) 200px, (min-width: 615px) 30vw, 45vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
        {views > 0 && (
          <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
            <FiEye aria-hidden />
            {formatNumber(views)}
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-sm font-medium text-foreground">{title}</p>
    </Link>
  );
}
