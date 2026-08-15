import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

/**
 * Category tile, ported from CRA's `pages/genres/genreWidget.jsx` + `genres.scss`.
 *
 * A 180px square with the name overlaid bottom-left over a bottom-weighted
 * scrim (`rgba(217,217,217,0) → rgba(25,25,26,0.88)` at 71.74%), which is what
 * keeps the white label readable on light artwork.
 */
export function CategoryTile({
  id,
  name,
  image,
}: {
  id: string | number;
  name: string;
  image?: string;
}) {
  return (
    <Link
      href={ROUTES.category(id)}
      className="relative block h-[180px] w-full cursor-pointer overflow-hidden rounded-md mobile:h-40 mobile:rounded-[3px]"
    >
      {image && (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1100px) 180px, (min-width: 615px) 170px, 45vw"
          className="object-cover"
        />
      )}
      <span
        className="absolute inset-0 rounded-md bg-[linear-gradient(180deg,rgba(217,217,217,0)_0%,rgba(25,25,26,0.88)_71.74%)] mobile:rounded-[3px]"
        aria-hidden
      />
      <span className="absolute bottom-[3px] left-[7px] z-[1] text-[15px] font-medium text-white mobile:text-[14px]">
        {name}
      </span>
    </Link>
  );
}
