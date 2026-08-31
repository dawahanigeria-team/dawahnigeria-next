"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { FiGrid, FiList } from "react-icons/fi";
import { LecturerCard } from "./LecturerCard";
import { LecturerRow } from "./LecturerRow";
import { InfiniteFooter } from "./InfiniteFooter";
import { useInfiniteItems } from "../useInfiniteItems";
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

type ViewMode = "list" | "grid";

/**
 * The chosen view, persisted per device.
 *
 * Default is the list: this page is a directory of 300+ scholars and the usual
 * job is to find one, which needs the whole name rather than a picture.
 */
const VIEW_STORAGE_KEY = "dn:lecturers:view";
const viewListeners = new Set<() => void>();

function subscribeView(onChange: () => void) {
  viewListeners.add(onChange);
  // `storage` keeps other tabs in step; same-tab writes notify directly.
  window.addEventListener("storage", onChange);
  return () => {
    viewListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStoredView(): ViewMode {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === "grid"
      ? "grid"
      : "list";
  } catch {
    // Private mode or blocked storage: the default is fine.
    return "list";
  }
}

function readServerView(): ViewMode {
  return "list";
}

function writeStoredView(next: ViewMode) {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
  } catch {
    // The preference just will not persist.
  }
  viewListeners.forEach((listener) => listener());
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  const option = (mode: ViewMode, Icon: typeof FiList, label: string) => (
    <button
      type="button"
      onClick={() => onChange(mode)}
      aria-pressed={view === mode}
      aria-label={`${label} view`}
      title={`${label} view`}
      className={[
        "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ddff2b]",
        view === mode
          ? "bg-[#ddff2b] text-[#101010]"
          : "text-muted-foreground hover:bg-hover hover:text-foreground",
      ].join(" ")}
    >
      <Icon size={17} />
    </button>
  );

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1">
      {option("list", FiList, "List")}
      {option("grid", FiGrid, "Grid")}
    </div>
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
  initialTotal,
  states,
}: {
  initialLecturers: LecturerListItem[];
  initialTotal: number;
  states: string[];
}) {
  const [lecturerId, setLecturerId] = useState<number | null>(null);
  const [state, setState] = useState<string>(ALL_STATES);
  const [lecturers, setLecturers] = useState(initialLecturers);
  // How many scholars match the current filter, straight from the API. Without
  // it the header could only report how many rows had been loaded, which reads
  // as though the catalogue were 10 people deep.
  const [total, setTotal] = useState(initialTotal);
  const [pending, setPending] = useState(false);

  // Read through useSyncExternalStore rather than setting state in an effect:
  // it gives the server a defined snapshot ("list"), so there is no hydration
  // mismatch and no post-mount flash from list to grid.
  const view = useSyncExternalStore(
    subscribeView,
    readStoredView,
    readServerView,
  );
  const chooseView = useCallback((next: ViewMode) => writeStoredView(next), []);

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
      setLecturers(next.items);
      setTotal(next.total);
      setPending(false);
    });
  }, [lecturerId, state]);

  // `lecturers` is page 1 for the current filter; the hook appends from there
  // and resets whenever a chip swaps that array out.
  const loadPage = useCallback(
    async (page: number) => {
      // The featured-scholar view is a single lookup by id — that endpoint
      // ignores `page` and would hand back the same record forever, appending
      // duplicates on every scroll. Report "no more" instead.
      if (lecturerId !== null) return [];
      const next = await fetchLecturers({ state, page });
      return next.items;
    },
    [lecturerId, state],
  );

  const {
    items,
    sentinelRef,
    loading,
    done,
    failed,
    retry,
  } = useInfiniteItems({ initialItems: lecturers, loadPage });

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
        className="mb-8 flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {total > items.length
            ? `Showing ${items.length} of ${total} scholars`
            : total > 0
              ? `${total} ${total === 1 ? "scholar" : "scholars"}`
              : ""}
        </p>
        <ViewToggle view={view} onChange={chooseView} />
      </div>

      {pending ? (
        view === "grid" ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <li key={i} className="flex flex-col gap-2">
                <span className="aspect-[5/3] w-full animate-pulse rounded-xl bg-hover" />
                <span className="h-3 w-3/4 animate-pulse rounded bg-hover" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 p-2">
                <span className="aspect-[5/3] w-24 animate-pulse rounded-xl bg-hover sm:w-28" />
                <span className="h-3 w-1/2 animate-pulse rounded bg-hover" />
              </li>
            ))}
          </ul>
        )
      ) : items.length > 0 ? (
        <>
          {view === "grid" ? (
            // Two columns on a phone, not three: at three the name is clipped to
            // roughly its first two words, so scholars who share a title and a
            // first name become indistinguishable.
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((l, i) => (
                <li key={`${l.id}-${i}`}>
                  <LecturerCard lecturer={l} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((l, i) => (
                <li key={`${l.id}-${i}`}>
                  <LecturerRow lecturer={l} />
                </li>
              ))}
            </ul>
          )}
          <InfiniteFooter
            sentinelRef={sentinelRef}
            loading={loading}
            done={done}
            failed={failed}
            onRetry={retry}
            loadedCount={items.length}
            itemNoun="lecturers"
          />
        </>
      ) : (
        <p className="py-12 text-center text-sm text-color" aria-live="polite">
          No lecturers match this filter.
        </p>
      )}
    </>
  );
}
