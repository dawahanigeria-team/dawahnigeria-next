"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiEye } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";
import { formatNumber } from "@/lib/formatNumber";
import type { LectureSummary } from "../server/landing";
import { resolveAlbum } from "../lectureFields";

/**
 * Album tile used by Recitations (and any album listing).
 *
 * Distinct from `LectureCard` in two ways that matter: it links to
 * `/dawahcast/a/{id}` rather than `/l/{id}`, and album endpoints title their
 * rows with `name` — a key the lecture resolver deliberately doesn't read,
 * since on other shapes `name` is the *lecturer*.
 */
export function AlbumCard({ album }: { album: LectureSummary }) {
  const raw = album as unknown as Record<string, unknown>;
  const { id, title, image } = resolveAlbum(album);
  const initialViews = Number(raw.views ?? 0) || 0;
  const [views, setViews] = useState(initialViews);
  const storedViewKey = `dn:views:album:${id}`;

  // Public album lists are cached for an hour. Keep the authoritative count
  // returned by the mutation locally so Back navigation and a cached listing
  // cannot make a successful click appear to have done nothing.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const stored = Number(window.localStorage.getItem(storedViewKey));
      if (Number.isFinite(stored) && stored > initialViews) {
        setViews(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialViews, storedViewKey]);

  const recordView = () => {
    setViews((current) => current + 1);

    void fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "album", id }),
      cache: "no-store",
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`View request failed: ${response.status}`);
        return response.json() as Promise<{ views?: number }>;
      })
      .then((result) => {
        if (typeof result.views !== "number" || !Number.isFinite(result.views)) return;
        const confirmed = result.views;
        setViews(confirmed);
        window.localStorage.setItem(storedViewKey, String(confirmed));
      })
      .catch(() => {
        setViews((current) => Math.max(initialViews, current - 1));
      });
  };

  return (
    <Link
      href={ROUTES.album(id)}
      onClick={recordView}
      className="group flex w-full flex-col gap-2"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
        {image && (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 1024px) 200px, (min-width: 615px) 30vw, 45vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
        {views > 0 && (
          <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
            <FiEye aria-hidden />
            {formatNumber(views)}
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-sm font-medium text-foreground">{title}</p>
    </Link>
  );
}
