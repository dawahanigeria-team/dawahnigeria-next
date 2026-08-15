"use client";

import { TbRepeat, TbRepeatOff, TbRepeatOnce } from "react-icons/tb";
import { usePlayer, type RepeatMode } from "./store";

const LABEL: Record<RepeatMode, string> = {
  off: "Repeat off",
  all: "Repeat all",
  one: "Repeat one",
};

export function RepeatButton() {
  const mode = usePlayer((s) => s.repeatMode);
  const cycle = usePlayer((s) => s.cycleRepeatMode);

  const Icon =
    mode === "one" ? TbRepeatOnce : mode === "all" ? TbRepeat : TbRepeatOff;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={LABEL[mode]}
      title={LABEL[mode]}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-hover",
        mode === "off" ? "text-muted-foreground" : "text-foreground",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
