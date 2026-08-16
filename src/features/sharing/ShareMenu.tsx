"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SlShare } from "react-icons/sl";
import {
  FaWhatsapp,
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaTelegram,
  FaLink,
  FaEllipsis,
} from "react-icons/fa6";
import { trackShare } from "@/features/analytics/posthog";

/** Stable no-op subscription: Web Share support cannot change at runtime. */
const subscribeToNothing = () => () => {};

type Network = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  href: (url: string, text: string) => string;
};

/**
 * Facebook and LinkedIn deliberately take no text parameter — both ignore any
 * caller-supplied copy and render the destination's Open Graph tags instead.
 * That is why the share image and description on each page matter more than
 * anything passed from here.
 */
const NETWORKS: Network[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    Icon: FaWhatsapp,
    href: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: FaFacebookF,
    href: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "x",
    label: "X",
    Icon: FaXTwitter,
    href: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
    href: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    Icon: FaTelegram,
    href: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

/**
 * Share control offering named networks rather than only the OS share sheet.
 *
 * The previous behaviour was `navigator.share()` with a clipboard fallback,
 * which meant desktop visitors got a copied link and no way to post to any
 * network. Named targets work on every platform; the native sheet is kept as an
 * extra entry where the browser supports it, since on a phone it reaches apps
 * this list cannot.
 */
export function ShareMenu({
  url,
  title,
  lecturer,
  contentId,
  contentType = "lecture",
  count,
  variant = "pill",
  className,
}: {
  /**
   * In-app path or absolute URL, resolved against the origin at click time.
   * Omit when the caller has no canonical route — the current path is used, so
   * the visitor still shares the page they are looking at.
   */
  url?: string;
  title: string;
  lecturer?: string;
  contentId: string;
  contentType?: string;
  count?: number;
  /** "pill" is the detail-page chip; "icon" is the bare glyph used in rows. */
  variant?: "pill" | "icon";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // navigator is absent during SSR, so the server snapshot is false and the
  // client re-reads after hydration. useSyncExternalStore rather than an effect
  // because the value never changes — there is nothing to subscribe to.
  const canNativeShare = useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 2000);
    return () => window.clearTimeout(id);
  }, [feedback]);

  const shareText = lecturer ? `${title} — ${lecturer}` : title;

  function absoluteUrl() {
    return new URL(url ?? window.location.pathname, window.location.origin).toString();
  }

  function openNetwork(network: Network) {
    const target = network.href(absoluteUrl(), shareText);
    // noopener/noreferrer: the share windows are third-party origins.
    window.open(target, "_blank", "noopener,noreferrer,width=600,height=640");
    trackShare({ id: contentId, title, type: contentType }, network.key);
    setOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl());
      setFeedback("Link copied");
      trackShare({ id: contentId, title, type: contentType }, "copy");
    } catch {
      setFeedback("Couldn't copy link");
    }
    setOpen(false);
  }

  async function nativeShare() {
    setOpen(false);
    try {
      await navigator.share({ title, text: shareText, url: absoluteUrl() });
      trackShare({ id: contentId, title, type: contentType }, "native");
    } catch (err) {
      // A dismissed sheet is not a share — no feedback, no event.
      if ((err as Error)?.name !== "AbortError") setFeedback("Couldn't share");
    }
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
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

      {open && (
        <ul
          role="menu"
          aria-label={`Share ${title}`}
          // Anchored to the right and opening upward: every caller sits either
          // in the player bar at the bottom of the viewport or in a table row
          // near the right edge.
          className="absolute bottom-full right-0 z-[100] mb-2 min-w-[11rem] overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg"
        >
          {NETWORKS.map((network) => (
            <li key={network.key} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => openNetwork(network)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-foreground hover:bg-hover"
              >
                <network.Icon className="h-4 w-4 shrink-0" aria-hidden />
                {network.label}
              </button>
            </li>
          ))}
          <li role="none" className="my-1 border-t border-border" />
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={copyLink}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-foreground hover:bg-hover"
            >
              <FaLink className="h-4 w-4 shrink-0" aria-hidden />
              Copy link
            </button>
          </li>
          {canNativeShare && (
            <li role="none">
              <button
                type="button"
                role="menuitem"
                onClick={nativeShare}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-foreground hover:bg-hover"
              >
                <FaEllipsis className="h-4 w-4 shrink-0" aria-hidden />
                More…
              </button>
            </li>
          )}
        </ul>
      )}

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
