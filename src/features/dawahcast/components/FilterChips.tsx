"use client";

import type { LanguageId } from "@/lib/languages";

/**
 * Horizontally scrollable row of single-select filter chips.
 * Ported from CRA's `filterChips/FilterChips.jsx` + `filterChips.scss`.
 *
 * Built as a radiogroup rather than a list of links: picking an option re-cuts
 * the feed in place, it does not navigate. Real <button>s keep the row keyboard
 * reachable and announce the selected state, which a styled <div onClick> would
 * not.
 */
export function FilterChips({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: { id: LanguageId; name: string }[];
  value: LanguageId;
  onChange: (id: LanguageId) => void;
  label: string;
  className?: string;
}) {
  if (!options.length) return null;

  return (
    <div className={`w-full ${className}`} role="radiogroup" aria-label={label}>
      {/* Scrollbar hidden: the row is scrolled, not decorated — clipped chips
          already signal the overflow. `overscroll-contain` keeps a horizontal
          swipe inside the row instead of chaining out to the page. */}
      <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-[10px] pt-[2px] [scroll-snap-type:x_proximity] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={String(option.id)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={[
                "flex-none cursor-pointer touch-manipulation whitespace-nowrap rounded-full border px-4 py-[7px] text-[13px] leading-[1.2]",
                "transition-[background-color,border-color,color] duration-150 ease-out [scroll-snap-align:start]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ddff2b]",
                "motion-reduce:transition-none",
                selected
                  ? "border-[#ddff2b] bg-[#ddff2b] font-semibold text-[#101010]"
                  : "border-white/[0.16] bg-white/[0.06] font-medium text-[#e6e6e6] hover:border-white/[0.28] hover:bg-white/[0.12]",
              ].join(" ")}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
