"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BsSun } from "react-icons/bs";
import { FaMoon } from "react-icons/fa";
import {
  getPreferenceServerSnapshot,
  getPreferenceSnapshot,
  getThemeServerSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from "./theme-store";

/** Order matches CRA's dropdown (`UI/themedropdown/themeDropDown.jsx`). */
const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

/**
 * Theme control in the sidebar. Live renders a dropdown, not a two-state
 * toggle: the trigger shows the *resolved* theme's icon and opens a
 * System / Dark / Light menu.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const preference = useSyncExternalStore(
    subscribeTheme,
    getPreferenceSnapshot,
    getPreferenceServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative text-[13px] sm:text-[15px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change theme"
        className="group rounded-md border border-border p-1 transition-colors hover:border-muted"
      >
        {theme === "dark" ? (
          <FaMoon className="text-xl text-foreground transition-all duration-300 dark:text-[#ddff2b]" aria-hidden />
        ) : (
          <BsSun className="text-xl text-color transition-all duration-300" aria-hidden />
        )}
      </button>

      {open && (
        <>
          {/* Click-away layer, matching CRA's fixed inset overlay. */}
          <div
            className="fixed inset-0 z-[70]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            aria-label="Theme"
            className="absolute right-0 top-9 z-[90] h-fit w-[110px] rounded-md border border-border bg-background py-2 shadow-lg"
          >
            <div className="flex w-[110px] flex-col space-y-1">
              {OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={preference === option.value}
                  onClick={() => {
                    setThemePreference(option.value);
                    setOpen(false);
                  }}
                  className={[
                    "cursor-pointer py-2 pl-2 pr-4 text-left transition-colors hover:bg-hover",
                    preference === option.value
                      ? "font-semibold text-foreground"
                      : "text-color",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
