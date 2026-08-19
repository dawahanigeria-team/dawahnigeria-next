"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FilterChips } from "../FilterChips";
import { LectureRow } from "../LectureRow";
import { LectureRowSkeleton } from "../Skeletons";
import { fetchTrendingForLanguage } from "../../server/trendingActions";
import type { LectureSummary } from "../../server/landing";
import {
  ALL_LANGUAGES_ID,
  HOME_LANGUAGES,
  languageName,
  readStoredLanguage,
  storeLanguage,
  type LanguageId,
} from "@/lib/languages";
import { ROUTES } from "@/lib/routes";

// The stored preference is read through useSyncExternalStore so the first
// client render can differ from the server's without a hydration mismatch —
// and without a setState-in-effect to "correct" it afterwards.
const subscribeNever = () => () => {};

/**
 * The home feed's language chips + trending row.
 *
 * The server renders the default (English) feed so the row is populated on
 * first paint; if the visitor has a stored preference, this refetches for it on
 * mount. Selection is kept in localStorage rather than the URL, matching live.
 */
export function HomeTrending({
  initialLectures,
  initialLanguageId,
}: {
  initialLectures: LectureSummary[];
  /**
   * The language the server already rendered `initialLectures` in. Seeding from
   * it rather than a hardcoded default is what removes the refetch-on-mount:
   * the server reads the same cookie this component writes, so for a visitor
   * who has chosen, both halves already agree and there is nothing to swap.
   */
  initialLanguageId: LanguageId;
}) {
  const storedLanguage = useSyncExternalStore(
    subscribeNever,
    () => readStoredLanguage() ?? initialLanguageId,
    () => initialLanguageId,
  );

  const [languageId, setLanguageId] = useState<LanguageId>(storedLanguage);
  const [lectures, setLectures] = useState(initialLectures);
  const [pending, setPending] = useState(false);
  // Which language `lectures` currently holds, so we only refetch on a change.
  const loadedFor = useRef<LanguageId>(initialLanguageId);
  const requestId = useRef(0);

  useEffect(() => {
    if (loadedFor.current === languageId) return;
    const id = ++requestId.current;
    setPending(true);
    fetchTrendingForLanguage(languageId).then((next) => {
      // Ignore a slow response for a chip the user has already moved off.
      if (id !== requestId.current) return;
      loadedFor.current = languageId;
      setLectures(next);
      setPending(false);
    });
  }, [languageId]);

  const activeName = languageName(languageId);

  function onChange(id: LanguageId) {
    setLanguageId(id);
    storeLanguage(id);
  }

  return (
    <>
      <div className="my-1 mobile-up:my-3">
        <FilterChips
          options={HOME_LANGUAGES}
          value={languageId}
          onChange={onChange}
          label="Filter lectures by language"
        />
      </div>

      {pending ? (
        <LectureRowSkeleton />
      ) : lectures.length > 0 ? (
        <div className="my-1 mobile-up:my-3">
          <LectureRow
            heading={
              languageId === ALL_LANGUAGES_ID
                ? "Trending Now"
                : `Trending in ${activeName}`
            }
            lectures={lectures}
            moreHref={ROUTES.trending}
            limit={6}
          />
        </div>
      ) : (
        // A language with nothing trending would otherwise make the whole
        // section disappear, which reads as a broken page right after the user
        // taps a chip. Say what happened and offer the way back.
        <div className="my-1 mobile-up:my-3">
          <p className="text-[14px] text-color" aria-live="polite">
            No lectures trending in {activeName} right now.{" "}
            <button
              type="button"
              onClick={() => onChange(ALL_LANGUAGES_ID)}
              className="underline hover:text-color-foreground dark:hover:text-[#ddff00]"
            >
              Show all languages
            </button>
          </p>
        </div>
      )}
    </>
  );
}
