import Link from "next/link";
import { FiChevronsRight } from "react-icons/fi";

type Props = {
  heading: string;
  /** Optional "more" target. The link is hidden if absent. */
  moreHref?: string;
};

/**
 * CRA `.groupWidget_top`: 2% side padding, 22px/600 heading dropping to 20px
 * under 900px, and a "more" button with a double chevron. Shared by every
 * scroll row so lecture and album rows stay visually identical.
 */
export function RowHeading({ heading, moreHref }: Props) {
  return (
    <div className="mb-2 flex items-center justify-between px-[2%] mobile:mb-0 mobile:px-0">
      <h2 className="text-[22px] font-semibold leading-[42px] text-color-primary mid:text-[20px]">
        {heading}
      </h2>
      {moreHref && (
        <Link
          href={moreHref}
          className="flex items-center rounded text-[15px] text-color-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dncolor-500 dark:text-dncolor-500"
          aria-label={`View more ${heading}`}
        >
          <span>more</span>
          <FiChevronsRight className="pt-1 text-[20px]" aria-hidden />
        </Link>
      )}
    </div>
  );
}
