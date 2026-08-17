import { AlbumCard } from "./AlbumCard";
import { RowHeading } from "./RowHeading";
import { ScrollRow } from "./ScrollRow";
import type { LectureSummary } from "../server/landing";

type Props = {
  heading: string;
  albums: LectureSummary[];
  /** Optional "more" target. Hidden if absent. */
  moreHref?: string;
  /** Cap rendered items; default 10 matches CRA. */
  limit?: number;
};

/**
 * The album counterpart to `LectureRow`. Kept separate rather than folded in
 * behind a flag because album endpoints title their rows with `name` and link
 * to `/dawahcast/a/{id}` — see `AlbumCard`. Albums also carry no `audio`, so
 * there is no play queue to build here.
 */
export function AlbumRow({ heading, albums, moreHref, limit = 10 }: Props) {
  if (!albums.length) return null;
  const items = albums.slice(0, limit);

  return (
    <section className="my-4 sm:my-6">
      <RowHeading heading={heading} moreHref={moreHref} />
      <ScrollRow>
        {items.map((album, i) => (
          <li
            key={`${album.nid ?? album.id}-${i}`}
            className="w-[160px] shrink-0 sm:w-[190px]"
          >
            <AlbumCard album={album} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
