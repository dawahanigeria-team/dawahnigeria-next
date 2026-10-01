"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdDownload, MdClose, MdCheckCircle, MdLock } from "react-icons/md";
import { fetchDownloadLinks } from "../server/downloadActions";
import { isPlayableUrl } from "@/features/player/playableUrl";
import { capture, EVENTS } from "@/features/analytics/posthog";

/**
 * The upstream returns a bare `"https:"` when it has no file for a format, and
 * an example.com placeholder for records with no real media — see
 * `isPlayableUrl`. The old check here passed the placeholder through, so the
 * button handed the browser a URL that 404s.
 */
const isUsable = isPlayableUrl;

/** Strip characters that break filenames across platforms. */
function safeFileName(title: string) {
  return `${title.replace(/[\\/:*?"<>|]+/g, " ").trim()}.mp3`;
}

/** What the modal is showing instead of the download prompt, if anything. */
type Outcome =
  /** `next` is captured at press time — see the `usePathname` note below. */
  | { kind: "signin"; next: string }
  | { kind: "limit"; message: string }
  | { kind: "done"; remaining: number | null };

/**
 * Lecture download, ported from CRA's `audioDownloadModal`. Fires the
 * `lecture_downloaded` PostHog event CRA also sends.
 *
 * MP3 only. CRA also offered AMR, but the AMR copies are not carried over when
 * media moves to Backblaze B2, so `amr_url` would stop resolving.
 *
 * Downloads are sign-in only. The button still renders for everyone — it is
 * how a signed-out visitor discovers the feature, and the pages that render it
 * are static, so they cannot read the session to hide it — but pressing
 * Download resolves through a Server Action that refuses anonymous callers.
 *
 * Links are resolved on the press rather than on open because resolving *is*
 * the charge: the upstream hands out the media URL and spends one of the
 * user's free monthly slots in the same call, so fetching on open would bill
 * people for lectures they only looked at.
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  function onOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setOutcome(null);
    setOpen(true);
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

  async function onDownload() {
    setBusy(true);
    setError(null);
    let result: Awaited<ReturnType<typeof fetchDownloadLinks>>;
    try {
      result = await fetchDownloadLinks(lectureId);
    } catch {
      // The action itself failed to run (offline, or a tab left open across a
      // deploy). Without this the button stayed disabled until a reload.
      setError("Couldn't reach the server. Check your connection and try again.");
      return;
    } finally {
      setBusy(false);
    }

    if (!result.ok) {
      if (result.code === "unauthenticated") {
        // Read from `location` here rather than calling `usePathname()` at the
        // top of this component. A listing page renders one of these per row,
        // so the hook would put twenty-odd router-context subscribers on the
        // page, all re-rendering on every client navigation, to serve a string
        // that is only ever needed after a press that failed.
        return setOutcome({
          kind: "signin",
          next: window.location.pathname + window.location.search,
        });
      }
      if (result.code === "limit_reached")
        return setOutcome({ kind: "limit", message: result.message });
      return setError(result.message);
    }

    const { links } = result;
    const url = links.mp3_url;
    if (!isUsable(url)) {
      setError("This lecture has no downloadable file yet.");
      return;
    }

    capture(EVENTS.LECTURE_DOWNLOADED, {
      lecture_id: lectureId,
      lecture_title: title,
      download_format: "mp3",
      file_size: links.mp3_size,
    });

    const a = document.createElement("a");
    a.href = url;
    a.download = safeFileName(links.mp3_title || title);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setOutcome({ kind: "done", remaining: links.downloads_remaining ?? null });
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

            {outcome?.kind === "signin" ? (
              <div className="text-center">
                <MdLock className="mx-auto mb-3 text-3xl text-dncolor-500" aria-hidden />
                <p className="mb-1 text-sm font-semibold text-foreground">
                  Sign in to download
                </p>
                <p className="mb-5 text-xs text-color">
                  Downloads are saved to your account. Listening stays free — no
                  account needed.
                </p>
                {/* prefetch={false}: /auth/login is force-dynamic with no
                    loading.tsx in its segment chain, so a prefetch is a full
                    Worker render that gets discarded. Same reason the other
                    auth links in the app opt out. */}
                <Link
                  href={`/auth/login?next=${encodeURIComponent(outcome.next)}`}
                  prefetch={false}
                  className="block w-full rounded-lg bg-dncolor-500 px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  Sign in
                </Link>
              </div>
            ) : outcome?.kind === "limit" ? (
              <div className="text-center">
                <p className="mb-1 text-sm font-semibold text-foreground">
                  Monthly downloads used
                </p>
                <p className="mb-5 text-xs text-color">
                  {outcome.message} Your allowance resets at the start of next
                  month.
                </p>
                {/* No upgrade link: the web app has no premium page yet — only
                    the payment callback — so the upsell lives in the mobile
                    app. Point people at a route that exists instead of a 404. */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-hover"
                >
                  Close
                </button>
              </div>
            ) : outcome?.kind === "done" ? (
              <div className="text-center">
                <MdCheckCircle
                  className="mx-auto mb-3 text-3xl text-dncolor-500"
                  aria-hidden
                />
                <p className="mb-1 text-sm font-semibold text-foreground">
                  Download started
                </p>
                {outcome.remaining !== null && (
                  <p className="mb-5 text-xs text-color">
                    {outcome.remaining} free download
                    {outcome.remaining === 1 ? "" : "s"} left this month.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-hover"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <p role="alert" className="mb-3 text-xs text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={onDownload}
                  disabled={busy}
                  className="w-full rounded-lg bg-dncolor-500 px-4 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Preparing…" : "Download"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
