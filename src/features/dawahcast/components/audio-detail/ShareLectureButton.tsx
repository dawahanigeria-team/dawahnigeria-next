"use client";

import { ShareMenu } from "@/features/sharing/ShareMenu";

/**
 * Shares the lecture itself (the player's ShareButton shares the *current*
 * track, which isn't necessarily the one being viewed).
 *
 * Thin wrapper over ShareMenu, kept so the many call sites don't all have to
 * change shape.
 */
export function ShareLectureButton({
  title,
  lecturer,
  href,
  count,
  className,
  variant = "pill",
  lectureId,
  contentType,
}: {
  title: string;
  lecturer?: string;
  href: string;
  count?: number;
  className?: string;
  /** "pill" is the detail-page chip; "icon" is the bare glyph used in tables. */
  variant?: "pill" | "icon";
  /** Falls back to the path when a caller has no id to hand. */
  lectureId?: string;
  contentType?: string;
}) {
  return (
    <ShareMenu
      url={href}
      title={title}
      lecturer={lecturer}
      contentId={lectureId ?? href}
      contentType={contentType}
      count={count}
      variant={variant}
      className={className}
    />
  );
}
