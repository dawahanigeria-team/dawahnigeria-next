"use client";

import { useEffect, useRef, useState } from "react";
import { LecturerCard } from "./LecturerCard";
import { fetchLecturers } from "../server/lecturerActions";
import { FEATURED_LECTURERS, ALL_STATES } from "../featuredLecturers";
import type { LecturerListItem } from "../server/listings";

/** Shared chip styling — matches the home feed's language chips. */
function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={[
        "flex-none cursor-pointer touch-manipulation whitespace-nowrap rounded-full border px-4 py-[7px] text-[13px] leading-[1.2]",
        "transition-[background-color,border-color,color] duration-150 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ddff2b]",
        selected
          ? "border-[#ddff2b] bg-[#ddff2b] font-semibold text-[#101010]"
          : "border-white/[0.16] bg-white/[0.06] font-medium text-[#e6e6e6] hover:border-white/[0.28] hover:bg-white/[0.12]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/**
 * Lecturers directory with the live site's two filter rows: an editorial pick
 * of featured scholars, then Nigerian states.
 *
 * The two are mutually exclusive, as in CRA — choosing a scholar clears the
 * state filter and vice versa, because they hit different upstream endpoints
 * and can't be combined.
 */
export function LecturerBrowser({
  initialLecturers,
  states,
}: {
  initialLecturers: LecturerListItem[];
  states: string[];
}) {
  const [lecturerId, setLecturerId] = useState<number | null>(null);
  const [state, setState] = useState<string>(ALL_STATES);
  const [lecturers, setLecturers] = useState(initialLecturers);
  const [pending, setPending] = useState(false);

  // What the current `lecturers` correspond to, so the first render doesn't
  // refetch the data the server already sent.
  const loadedFor = useRef<string>("all|");
  const requestId = useRef(0);

  useEffect(() => {
    const key = `${lecturerId ?? "all"}|${state}`;
    if (loadedFor.current === key) return;

    const id = ++requestId.current;
    setPending(true);
    fetchLecturers({ lecturerId, state }).then((next) => {
      // Drop a slow response for a filter the user has already moved off.
      if (id !== requestId.current) return;
      loadedFor.current = key;
      setLecturers(next);
      setPending(false);
    });
  }, [lecturerId, state]);

  function pickLecturer(id: number | null) {
    setLecturerId(id);
    setState(ALL_STATES);
  }

  function pickState(next: string) {
    setState(next);
    setLecturerId(null);
  }

  return (
    <>
      <div
        className="mb-3 flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="radiogroup"
        aria-label="Filter by lecturer"
      >
        {FEATURED_LECTURERS.map((l) => (
          <Chip
            key={String(l.id)}
            selected={lecturerId === l.id}
            onClick={() => pickLecturer(l.id)}
          >
            {l.name}
          </Chip>
        ))}
      </div>

      <div
        className="mb-8 flex flex-wrap items-center gap-2"
        role="radiogroup"
        aria-label="Filter by state"
      >
        <Chip
          selected={state === ALL_STATES && lecturerId === null}
          onClick={() => pickState(ALL_STATES)}
        >
          All states
        </Chip>
        {states.map((name) => (
          <Chip
            key={name}
            selected={state === name}
            onClick={() => pickState(name)}
          >
            {name}
          </Chip>
        ))}
      </div>

      {pending ? (
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <li key={i} className="flex flex-col items-center gap-2">
              <span className="aspect-square w-full animate-pulse rounded-full bg-hover" />
              <span className="h-3 w-3/4 animate-pulse rounded bg-hover" />
            </li>
          ))}
        </ul>
      ) : lecturers.length > 0 ? (
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {lecturers.map((l, i) => (
            <li key={`${l.id}-${i}`}>
              <LecturerCard lecturer={l} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-sm text-color" aria-live="polite">
          No lecturers match this filter.
        </p>
      )}
    </>
  );
}
