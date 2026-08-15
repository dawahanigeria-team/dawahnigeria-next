"use client";

import { useEffect, useState } from "react";
import { SlShare } from "react-icons/sl";

/**
 * Shares the lecture itself (the player's ShareButton shares the *current*
 * track, which isn't necessarily the one being viewed). Web Share on mobile,
 * clipboard fallback elsewhere.
 */
export function ShareLectureButton({
  title,
  lecturer,
  href,
  count,
  className,
  variant = "pill",
}: {
  title: string;
  lecturer?: string;
  href: string;
  count?: number;
  className?: string;
  /** "pill" is the detail-page chip; "icon" is the bare glyph used in tables. */
  variant?: "pill" | "icon";
}) {
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 2000);
    return () => window.clearTimeout(id);
  }, [feedback]);

  async function share() {
    const url = new URL(href, window.location.origin).toString();
    const data = {
      title,
      text: lecturer ? `${title} — ${lecturer}` : title,
      url,
    };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Link copied");
    } catch {
      setFeedback("Couldn't copy link");
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={share}
        aria-label={`Share ${title}`}
        title="Share"
        className={[
          "inline-flex items-center gap-1.5 transition-colors",
          variant === "icon"
            ? ""
            : "rounded-full bg-muted px-3 py-2 text-sm text-foreground hover:bg-hover",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <SlShare className="h-4 w-4" aria-hidden />
        {count !== undefined && <span className="tabular-nums">{count}</span>}
      </button>
      {feedback && (
        <span
          role="status"
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-sm"
        >
          {feedback}
        </span>
      )}
    </div>
  );
}
