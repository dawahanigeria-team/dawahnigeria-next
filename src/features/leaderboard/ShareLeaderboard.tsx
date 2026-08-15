"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BsTwitterX } from "react-icons/bs";
import { FaFacebookF, FaLink, FaShareAlt, FaWhatsapp } from "react-icons/fa";

// Capability check, not state: the server can't know it, and it never changes
// after hydration — so there is nothing to subscribe to.
const neverChanges = () => () => {};
const hasNativeShare = () => typeof navigator.share === "function";
const noNativeShareOnServer = () => false;

type Props = {
  day: string;
  rank?: number;
  isRanked?: boolean;
  totalSeconds?: number;
  totalParticipants?: number;
  durationLabel?: string;
};

export function ShareLeaderboard({
  day,
  rank,
  isRanked,
  totalParticipants,
  durationLabel,
}: Props) {
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canNativeShare = useSyncExternalStore(
    neverChanges,
    hasNativeShare,
    noNativeShareOnServer,
  );

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const buildPayload = () => {
    const url =
      typeof window !== "undefined" && window.location?.href
        ? window.location.href
        : "https://dawahnigeria.com/dawahcast/ramadan/leaderboard";
    const rankCopy = isRanked
      ? `I am #${rank} on Dawah Nigeria's Ramadan leaderboard for ${day}`
      : `I am taking part in Dawah Nigeria's Ramadan leaderboard for ${day}`;
    const durationCopy = durationLabel ? ` with ${durationLabel} tracked` : "";
    const participantsCopy = totalParticipants
      ? ` among ${totalParticipants} participants`
      : "";
    return {
      title: "Dawah Nigeria Ramadan Leaderboard",
      text: `${rankCopy}${durationCopy}${participantsCopy}.`,
      url,
    };
  };

  const openShareWindow = (url: string) => {
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share(buildPayload());
    } catch {
      /* user dismissed or share failed — no-op */
    }
  };

  const handleWhatsapp = () => {
    const p = buildPayload();
    openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${p.text} ${p.url}`)}`);
  };

  const handleTwitter = () => {
    const p = buildPayload();
    openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${p.text} ${p.url}`)}`);
  };

  const handleFacebook = () => {
    const p = buildPayload();
    openShareWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(p.url)}&quote=${encodeURIComponent(p.text)}`,
    );
  };

  const handleCopy = async () => {
    const p = buildPayload();
    try {
      await navigator.clipboard.writeText(p.url);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Copy failed");
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyLabel("Copy link"), 1800);
  };

  const btn =
    "inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-hover";

  return (
    <section
      aria-label="Share leaderboard"
      className="mt-6 rounded-lg border border-border p-4"
    >
      <h2 className="text-lg font-semibold text-foreground">Share your progress</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite friends to join today&apos;s Ramadan challenge.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {canNativeShare && (
          <button type="button" onClick={handleNativeShare} className={btn} aria-label="Share leaderboard">
            <FaShareAlt aria-hidden /> <span>Share</span>
          </button>
        )}
        <button type="button" onClick={handleWhatsapp} className={btn} aria-label="Share on WhatsApp">
          <FaWhatsapp aria-hidden /> <span>WhatsApp</span>
        </button>
        <button type="button" onClick={handleTwitter} className={btn} aria-label="Share on X">
          <BsTwitterX aria-hidden /> <span>X</span>
        </button>
        <button type="button" onClick={handleFacebook} className={btn} aria-label="Share on Facebook">
          <FaFacebookF aria-hidden /> <span>Facebook</span>
        </button>
        <button type="button" onClick={handleCopy} className={btn} aria-label="Copy leaderboard link">
          <FaLink aria-hidden /> <span>{copyLabel}</span>
        </button>
      </div>
    </section>
  );
}
