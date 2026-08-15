"use client";

import { useSyncExternalStore } from "react";
import { BsMoonStarsFill, BsSun } from "react-icons/bs";
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeTheme,
} from "./theme-store";

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-hover transition-colors"
    >
      {theme === "dark" ? (
        <BsSun className="h-4 w-4" aria-hidden />
      ) : (
        <BsMoonStarsFill className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
