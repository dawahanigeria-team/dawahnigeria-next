"use client";

import { useEffect, useState } from "react";
import { MdDownload, MdClose, MdCheckCircle } from "react-icons/md";
import { fetchDownloadLinks } from "../server/downloadActions";
import { isPlayableUrl } from "@/features/player/playableUrl";
import { capture, EVENTS } from "@/features/analytics/posthog";
import type { DownloadLinks } from "../server/listings";

type Format = "mp3" | "amr";

/**
 * The upstream returns a bare `"https:"` when it has no file for a format, and
 * an example.com placeholder for records with no real media — see
 * `isPlayableUrl`. The old check here passed the placeholder through, so the
 * button handed the browser a URL that 404s.
 */
const isUsable = isPlayableUrl;

/** Strip characters that break filenames across platforms. */
function safeFileName(title: string, format: Format) {
  return `${title.replace(/[\\/:*?"<>|]+/g, " ").trim()}.${format}`;
}

/**
 * Lecture download, ported from CRA's `audioDownloadModal`. Offers MP3/AMR,
 * reports the size when the upstream provides one, and fires the
 * `lecture_downloaded` PostHog event CRA also sends.
 *
 * Links are fetched lazily on open — a listing page would otherwise issue one
 * upstream POST per row on render.
 */
export function DownloadButton({
  lectureId,
  title,
  className,
}: {
  lectureId: string;
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<DownloadLinks | null>(null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<Format>("mp3");
  const [error, setError] = useState<string | null>(null);

  // Fetched from the click handler rather than an effect: opening *is* the
  // trigger, so there is no state to synchronise.
  async function onOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    if (links || loading) return;
    setLoading(true);
    const result = await fetchDownloadLinks(lectureId);
    setLinks(result);
    setLoading(false);
    if (!result) setError("Unable to load lecture file.");
  }

  // Close on Escape, matching the rest of the app's overlays.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const url = format === "mp3" ? links?.mp3_url : links?.amr_url;
  const size = format === "mp3" ? links?.mp3_size : links?.amr_size;
  const available = isUsable(url);

  function onDownload() {
    if (!available) {
      setError("Download link is not available for this format yet.");
      return;
    }
    capture(EVENTS.LECTURE_DOWNLOADED, {
      lecture_id: lectureId,
      lecture_title: title,
      download_format: format,
      file_size: size,
    });

    const a = document.createElement("a");
    a.href = url;
    a.download = safeFileName(links?.mp3_title || title, format);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Download ${title}`}
        className={className ?? "text-color transition-colors hover:text-foreground"}
      >
        <MdDownload aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Download lecture"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="line-clamp-2 text-sm font-semibold text-foreground">
                {title}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="shrink-0 text-color hover:text-foreground"
              >
                <MdClose className="text-xl" aria-hidden />
              </button>
            </div>

            {loading ? (
              <p className="py-6 text-center text-sm text-color">Loading…</p>
            ) : (
              <>
                <fieldset className="mb-5">
                  <legend className="mb-2 text-xs uppercase tracking-wide text-color">
                    Format
                  </legend>
                  <div className="flex gap-2">
                    {(["mp3", "amr"] as Format[]).map((f) => {
                      const fUrl = f === "mp3" ? links?.mp3_url : links?.amr_url;
                      const fSize = f === "mp3" ? links?.mp3_size : links?.amr_size;
                      const ok = isUsable(fUrl);
                      return (
                        <button
                          key={f}
                          type="button"
                          disabled={!ok}
                          onClick={() => {
                            setFormat(f);
                            setError(null);
                          }}
                          className={[
                            "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                            format === f
                              ? "border-dncolor-500 bg-dncolor-500/10 text-foreground"
                              : "border-border text-color hover:bg-hover",
                            !ok ? "cursor-not-allowed opacity-40" : "",
                          ].join(" ")}
                        >
                          {format === f && ok && (
                            <MdCheckCircle className="text-dncolor-500" aria-hidden />
                          )}
                          <span className="uppercase">{f}</span>
                          {fSize && <span className="text-xs">({fSize})</span>}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {error && (
                  <p role="alert" className="mb-3 text-xs text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={onDownload}
                  disabled={!available}
                  className="w-full rounded-lg bg-dncolor-500 px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
