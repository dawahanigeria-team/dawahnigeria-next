import Link from "next/link";
import { MdFavoriteBorder, MdChatBubbleOutline } from "react-icons/md";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { ShareLectureButton } from "./ShareLectureButton";

/** Labelled control, matching the live action row (icon box + caption). */
function Action({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-10 min-w-[3.5rem] items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-foreground transition-colors hover:bg-hover">
        {children}
      </div>
      <span className="text-xs text-color">{label}</span>
    </div>
  );
}

/**
 * Like / Share / Comment row shown beside Play and Shuffle on album and
 * playlist pages.
 *
 * The Like control needs a session; for anonymous visitors it renders as a link
 * to sign-in rather than a dead button, so the affordance still matches live.
 */
export function AlbumActions({
  itemId,
  type,
  title,
  href,
  isAuthed,
  initialFavorited,
}: {
  itemId: string;
  type: "album" | "playlist";
  title: string;
  href: string;
  isAuthed: boolean;
  initialFavorited: boolean;
}) {
  return (
    <>
      <Action label="Like">
        {isAuthed ? (
          <FavoriteButton
            itemId={itemId}
            type={type}
            initialFavorited={initialFavorited}
            label={title}
          />
        ) : (
          <Link
            href={`/auth/login?next=${encodeURIComponent(href)}`}
            aria-label={`Sign in to like ${title}`}
            className="flex items-center"
          >
            <MdFavoriteBorder className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </Action>

      <Action label="Share">
        <ShareLectureButton
          title={title}
          href={href}
          variant="icon"
          className="text-foreground"
        />
      </Action>

      <Action label="Comment">
        <a
          href="#comments"
          aria-label="Jump to comments"
          className="flex min-h-11 min-w-11 items-center justify-center"
        >
          <MdChatBubbleOutline className="h-4 w-4" aria-hidden />
        </a>
      </Action>
    </>
  );
}
