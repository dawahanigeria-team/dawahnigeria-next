"use client";

import { useEffect, useRef, useState } from "react";
import { PLAYBACK_RATES, usePlayer, type PlaybackRate } from "./store";

export function PlaybackRateMenu() {
  const rate = usePlayer((s) => s.playbackRate);
  const setRate = usePlayer((s) => s.setPlaybackRate);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function pick(value: PlaybackRate) {
    setRate(value);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Playback speed ${rate}×`}
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-xs tabular-nums text-foreground hover:bg-hover"
      >
        {rate}×
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 bottom-full mb-2 min-w-[6rem] rounded-md border border-border bg-background py-1 shadow-md"
        >
          {PLAYBACK_RATES.map((r) => (
            <li key={r} role="none">
              <button
                role="menuitemradio"
                aria-checked={r === rate}
                onClick={() => pick(r)}
                className={[
                  "block w-full px-3 py-2 text-right text-sm tabular-nums hover:bg-hover",
                  r === rate ? "font-semibold text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {r}×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
