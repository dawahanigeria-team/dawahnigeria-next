// Language ids as returned by /all_lang_api.php. Ported verbatim from the CRA
// app's `src/utils/languages.js`.
//
// The catalogue is multilingual, so language is the strongest relevance signal
// available: a Yoruba listener scrolling past Hausa lectures is the single
// biggest source of noise on the home feed. The id is passed to the listing
// endpoints as `langid`, so filtering happens server-side across the whole
// catalogue rather than the page that happens to be loaded.

/** Sentinel for "don't filter" — the endpoints return every language when
 *  `langid` is omitted entirely. */
export const ALL_LANGUAGES_ID = null;

/** English. The home feed has always requested this; changing it would
 *  silently reshuffle the page for every visitor. */
export const DEFAULT_LANGUAGE_ID = 6;

export type LanguageId = number | null;

/** Ordered for the chip row: the languages most of the catalogue is recorded
 *  in come first, so common choices are reachable without scrolling. */
export const HOME_LANGUAGES: { id: LanguageId; name: string }[] = [
  { id: ALL_LANGUAGES_ID, name: "All" },
  { id: 6, name: "English" },
  { id: 7, name: "Yoruba" },
  { id: 8, name: "Hausa" },
  { id: 157, name: "Arabic" },
  { id: 9, name: "Igbo" },
  { id: 46504, name: "Pidgin English" },
  { id: 50041, name: "Igala" },
  { id: 877, name: "Ebira" },
  { id: 53181, name: "Nupe" },
];

export function languageName(id: LanguageId): string {
  return HOME_LANGUAGES.find((l) => l.id === id)?.name ?? "";
}

const STORAGE_KEY = "dn_home_language";

/**
 * The same choice, mirrored into a cookie.
 *
 * localStorage is unreadable on the server, so the chips could only ever steer
 * the rows the client refetches — the hero and "recently posted" render on the
 * server and carried on ignoring the visitor entirely. A cookie is the only
 * form of this preference both halves can see.
 *
 * Not `HttpOnly`: `storeLanguage` is what writes it, from the browser. Lax is
 * enough — it changes which lectures are listed, nothing security-bearing.
 */
export const LANGUAGE_COOKIE = "dn_langid";
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Parse a stored value (cookie or localStorage) into a known language id. */
export function parseLanguageValue(raw: string | undefined | null): LanguageId | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (raw === "all") return ALL_LANGUAGES_ID;
  const parsed = Number(raw);
  return HOME_LANGUAGES.some((l) => l.id === parsed) ? parsed : undefined;
}

function serialiseLanguage(id: LanguageId): string {
  return id === ALL_LANGUAGES_ID ? "all" : String(id);
}

/**
 * Languages the home page rotates through for a visitor who has not chosen one.
 *
 * "All" is excluded on purpose: the unfiltered feed is what caused the problem
 * this rotation exists to solve — uploads are lopsided enough that asking for
 * every language returns effectively one.
 */
export const ROTATION_LANGUAGES: number[] = HOME_LANGUAGES
  .map((l) => l.id)
  .filter((id): id is number => id !== ALL_LANGUAGES_ID);

/** How long each language holds the front page. Matches the hero's own clock. */
export const LANGUAGE_ROTATION_MS = 5 * 60_000;

/**
 * Which language the front page leads with right now, absent any choice by the
 * visitor. Deterministic within a window so the server, the edge cache and the
 * client all agree on what is being shown.
 */
export function rotatingLanguageId(now: number): number {
  const slot = Math.floor(now / LANGUAGE_ROTATION_MS) % ROTATION_LANGUAGES.length;
  return ROTATION_LANGUAGES[slot];
}

// Remembering the choice matters more here than on a music site: someone who
// listens in Yoruba listens in Yoruba every visit, and making them re-pick each
// time is the whole problem this solves.
export function readStoredLanguage(): LanguageId | undefined {
  try {
    return parseLanguageValue(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private mode / storage disabled — fall back to the default.
    return undefined;
  }
}

export function storeLanguage(id: LanguageId) {
  const value = serialiseLanguage(id);
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Non-fatal: the selection still applies for this session.
  }
  try {
    // Mirrored so the server-rendered half of the page (hero, recently posted)
    // sees the same choice the chips apply to the client-rendered half.
    document.cookie = `${LANGUAGE_COOKIE}=${value}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    // Non-fatal for the same reason.
  }
}
