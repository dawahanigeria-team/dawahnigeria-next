"use client";

import { useEffect, useState } from "react";
import { BsShare } from "react-icons/bs";
import { usePlayer } from "./store";
import { trackShare } from "@/features/analytics/posthog";

export function ShareButton() {
  const track = usePlayer((s) => s.track);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 2000);
    return () => window.clearTimeout(id);
  }, [feedback]);

  if (!track) return null;

  async function share() {
    if (!track) return;
    // Build absolute URL from the in-app route. Falls back to current href if no
    // canonical route is known.
    const path = track.href ?? window.location.pathname;
    const url = new URL(path, window.location.origin).toString();
    const data = {
      title: track.title,
      text: track.lecturer ? `${track.title} — ${track.lecturer}` : track.title,
      url,
    };

    // Web Share is the better UX on mobile; fall back to clipboard everywhere else.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(data);
        trackShare({ id: track.id, title: track.title }, "native");
        return;
      } catch (err) {
        // AbortError = user dismissed the share sheet — no feedback needed, and
        // no event: a cancelled sheet is not a share.
        if ((err as Error)?.name === "AbortError") return;
        // Other errors fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      trackShare({ id: track.id, title: track.title }, "copy");
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
        aria-label="Share this lecture"
        title="Share"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground"
      >
        <BsShare className="h-4 w-4" aria-hidden />
      </button>
      {feedback && (
        <span
          role="status"
          className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-sm"
        >
          {feedback}
        </span>
      )}
    </div>
  );
}
