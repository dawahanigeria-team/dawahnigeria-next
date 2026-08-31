import { scholarInitials, scholarMonogramColor } from "../scholarMonogram";

/**
 * Circular monogram for a scholar.
 *
 * Deliberately not an <img>: the catalogue's scholar artwork is a wide branded
 * name card, so cropping it to a circle truncated the name it was made of while
 * costing up to 820KB per picture. The initials render instantly, stay sharp at
 * any size, and never fail to load.
 *
 * `sizeClass` carries the dimensions so each caller keeps its own responsive
 * sizing; `textClass` scales the initials to match.
 */
export function ScholarAvatar({
  name,
  sizeClass,
  textClass = "text-lg",
  className = "",
}: {
  name: string;
  sizeClass: string;
  textClass?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white ${sizeClass} ${textClass} ${className}`}
      style={{ backgroundColor: scholarMonogramColor(name) }}
    >
      {scholarInitials(name)}
    </div>
  );
}
