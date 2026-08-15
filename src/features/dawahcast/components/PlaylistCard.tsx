import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import type { PlaylistListItem } from "../server/listings";

export function PlaylistCard({ playlist }: { playlist: PlaylistListItem }) {
  return (
    <Link
      href={ROUTES.playlist(playlist.id)}
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
        {playlist.image ? (
          <Image
            src={playlist.image}
            alt={playlist.title}
            fill
            sizes="(min-width: 640px) 200px, 45vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
      </div>
      <p className="line-clamp-2 text-sm font-medium text-foreground">
        {playlist.title}
      </p>
      {/* CRA's AlbumWidget shows the lecture count under the title. */}
      <p className="line-clamp-1 text-xs text-color">
        {playlist.owner
          ? `${playlist.owner} · ${playlist.trackCount} lectures`
          : `${playlist.trackCount} lectures`}
      </p>
    </Link>
  );
}
