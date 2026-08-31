import Image from "next/image";
import { scholarInitials, scholarMonogramColor } from "../scholarMonogram";

/**
 * A scholar's picture, in the shape it was made for.
 *
 * The artwork is a wide branded name card — the stored original and the
 * purpose-built `rp_thumbnail` are both 1.67:1 — so it is displayed landscape
 * and uncropped. Forcing it into a circle cut the scholar's name in half, which
 * is the one thing the image exists to show.
 *
 * The monogram is a fallback for the handful of scholars with no artwork at all,
 * not a replacement for artwork that exists.
 */
export function ScholarAvatar({
  name,
  image,
  sizeClass,
  textClass = "text-lg",
  className = "",
  sizes = "200px",
  priority = false,
}: {
  name: string;
  image?: string;
  sizeClass: string;
  textClass?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (image) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl bg-muted ${sizeClass} ${className}`}
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl font-bold text-white ${sizeClass} ${textClass} ${className}`}
      style={{ backgroundColor: scholarMonogramColor(name) }}
    >
      {scholarInitials(name)}
    </div>
  );
}
