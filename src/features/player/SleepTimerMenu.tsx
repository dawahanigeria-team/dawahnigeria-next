"use client";

import { useEffect, useState } from "react";
import { BsClock, BsClockHistory } from "react-icons/bs";
import { usePlayer, type SleepDurationMinutes } from "./store";

const OPTIONS: SleepDurationMinutes[] = [5, 15, 30];

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(totalSec / 60);
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function SleepTimerMenu() {
  const endsAt = usePlayer((s) => s.sleepTimerEndsAt);
  const setSleepTimer = usePlayer((s) => s.setSleepTimer);
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  // Tick the visible countdown while the timer is active. Nothing is written
  // when `endsAt` is null — a stale `remaining` is unreachable because every
  // read below is gated on `endsAt !== null`. Sub-second interval so a freshly
  // set timer shows the right value without seeding state from the effect body.
  useEffect(() => {
    if (endsAt === null) return;
    const id = window.setInterval(
      () => setRemaining(Math.max(0, endsAt - Date.now())),
      250,
    );
    return () => window.clearInterval(id);
  }, [endsAt]);

  const active = endsAt !== null && remaining !== null && remaining > 0;
  const Icon = active ? BsClockHistory : BsClock;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          active
            ? `Sleep timer: ${formatRemaining(remaining!)} remaining`
            : "Set sleep timer"
        }
        className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs text-foreground hover:bg-hover"
      >
        <Icon className="h-4 w-4" aria-hidden />
        {active && (
          <span className="tabular-nums">{formatRemaining(remaining!)}</span>
        )}
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute right-0 bottom-full mb-2 min-w-[8rem] rounded-md border border-border bg-background py-1 shadow-md"
        >
          {OPTIONS.map((m) => (
            <li key={m} role="none">
              <button
                role="menuitem"
                onClick={() => {
                  setSleepTimer(m);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-hover"
              >
                {m} minutes
              </button>
            </li>
          ))}
          {active && (
            <li role="none">
              <button
                role="menuitem"
                onClick={() => {
                  setSleepTimer(null);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-destructive hover:bg-hover"
              >
                Cancel timer
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
