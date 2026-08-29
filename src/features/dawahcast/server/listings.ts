import { api } from "@/lib/api";
import { ALL_LANGUAGES_ID, type LanguageId } from "@/lib/languages";
import type { LectureSummary } from "./landing";

/**
 * GET /popular_lec_api.php?langid=6&page={page}
 */
export async function getTrending(page = 1): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/popular_lec_api.php?langid=6&page=${page}`,
    { cache: { revalidate: 300, tags: [`trending:p${page}`] } },
  );
}

/**
 * Same endpoint, but language-aware — backs the home feed's chip row.
 * `langid` is omitted entirely for "All", which is how the upstream signals
 * "every language" (passing an empty value returns nothing).
 */
export async function getTrendingByLanguage(
  languageId: LanguageId,
  page = 1,
): Promise<LectureSummary[]> {
  const query =
    languageId === ALL_LANGUAGES_ID
      ? `page=${page}`
      : `langid=${languageId}&page=${page}`;
  return api.get<LectureSummary[]>(`/popular_lec_api.php?${query}`, {
    cache: {
      revalidate: 300,
      tags: [`trending:lang${languageId ?? "all"}:p${page}`],
    },
  });
}

/**
 * GET /leclisting_recent.php?action=get_recent_audio&page={page}
 * Same upstream as landing's "recently posted"; the New page paginates it.
 */
export async function getNewLectures(page = 1): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/leclisting_recent.php?action=get_recent_audio&page=${page}`,
    { cache: { revalidate: 60, tags: [`new:p${page}`] } },
  );
}

export type LecturerListItem = {
  id: string | number;
  name: string;
  image: string | undefined;
  raw: Record<string, unknown>;
};

type LecturerListRaw = Record<string, unknown> & {
  nid?: string | number;
  id?: string | number;
  rpname?: string;
  name?: string;
  img?: string;
  image?: string;
};

function toLecturerItems(list: LecturerListRaw[] | null): LecturerListItem[] {
  return (list ?? []).map((raw) => ({
    id: (raw.nid ?? raw.id) as string | number,
    name: (raw.rpname || raw.name || "Unknown lecturer") as string,
    image: (raw.img || raw.image) as string | undefined,
    raw,
  }));
}

/**
 * GET /all_rps_api.php?offset=30&lim=10&page={page}[&state=…]
 */
export async function getLecturers(
  page = 1,
  state?: string,
): Promise<LecturerListItem[]> {
  const query = state
    ? `offset=30&lim=10&page=${page}&state=${encodeURIComponent(state)}`
    : `offset=30&lim=10&page=${page}`;
  const list = await api.get<LecturerListRaw[]>(`/all_rps_api.php?${query}`, {
    cache: {
      revalidate: 600,
      tags: [`lecturers:${state ?? "all"}:p${page}`],
    },
  });
  return toLecturerItems(list);
}

/** Lightweight catalogue used only by the account preference picker. */
export async function getPreferenceLecturers(): Promise<LecturerListItem[]> {
  const list = await api.get<LecturerListRaw[]>(
    `/all_rps_api.php?offset=0&lim=400&page=1`,
    { cache: { revalidate: 3600, tags: ["lecturers:preferences"] } },
  );
  return toLecturerItems(list);
}

/**
 * GET /rplisting_multi_nid_api.php?id={id} — a single featured lecturer.
 * Backs the top chip row, which filters to one scholar rather than a region.
 */
export async function getLecturerById(id: string | number) {
  const list = await api.get<LecturerListRaw[]>(
    `/rplisting_multi_nid_api.php?id=${id}`,
    { cache: { revalidate: 600, tags: [`lecturer:${id}`] } },
  );
  return toLecturerItems(list);
}

/**
 * GET /all_states_api.php — Nigerian states with content.
 *
 * CRA drops any "all"/"all states" the upstream sends, dedupes and sorts, then
 * prepends its own "All states" sentinel; mirrored here so the chip row can't
 * end up with two "All" entries.
 */
export async function getStates(): Promise<string[]> {
  try {
    const res = await api.get<{ states?: string[] }>(`/all_states_api.php`, {
      cache: { revalidate: 86400, tags: ["states"] },
    });
    const names = (res?.states ?? [])
      .filter(
        (n) =>
          typeof n === "string" &&
          n.trim().length > 0 &&
          n.toLowerCase() !== "all" &&
          n.toLowerCase() !== "all states",
      )
      .map((n) => n.trim());
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/**
 * GET /playlistApi.php?action=all_public_playlist_data
 */
export type PlaylistListItem = {
  id: string | number;
  title: string;
  image: string | undefined;
  owner: string | undefined;
  /** Number of lectures — CRA's `lec_no`, else the length of `audio[]`. */
  trackCount: number;
  raw: Record<string, unknown>;
};

type PlaylistListRaw = Record<string, unknown> & {
  playlist_id?: string | number;
  id?: string | number;
  nid?: string | number;
  playlist_name?: string;
  name?: string;
  title?: string;
  playlist_image?: string;
  playlist_thumbnail?: string;
  img?: string;
  image?: string;
  username?: string;
  audio?: unknown[];
  lec_no?: string | number;
};

export async function getPlaylists(): Promise<PlaylistListItem[]> {
  // This endpoint wraps its payload: { success, message, data: [...] }.
  // CRA never unwraps it, so its `Array.isArray()` guard is always false and
  // the live playlists grid renders empty — see the page for the fix note.
  const res = await api.get<{ data?: PlaylistListRaw[] } | PlaylistListRaw[]>(
    `/playlistApi.php?action=all_public_playlist_data`,
    { cache: { revalidate: 600, tags: ["playlists:all"] } },
  );
  const list = Array.isArray(res) ? res : (res?.data ?? []);

  return list.map((raw) => ({
    id: (raw.playlist_id ?? raw.id ?? raw.nid) as string | number,
    title: (raw.playlist_name || raw.name || raw.title || "Untitled") as string,
    image: (raw.playlist_thumbnail ||
      raw.playlist_image ||
      raw.img ||
      raw.image) as string | undefined,
    owner: raw.username as string | undefined,
    trackCount: Array.isArray(raw.audio)
      ? raw.audio.length
      : Number(raw.lec_no ?? 0) || 0,
    raw,
  }));
}

/**
 * GET /dn_quran_api.php?action=get_quran_album&page={page}&limit={limit}
 */
export async function getRecitationAlbums(
  page = 1,
  limit = 20,
): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/dn_quran_api.php?action=get_quran_album&page=${page}&limit=${limit}`,
    { cache: { revalidate: 3600, tags: [`recitations:p${page}`] } },
  );
}

/**
 * GET /popular_lec_api.php?langid=6&page={page}
 *
 * CRA points this view at `/trending_new.php`, which returns HTTP 500 — that
 * file has never existed in the backend repo on any branch, so it is an
 * untracked orphan sitting on the production server (the deploy uses scp, which
 * never deletes). The live site's own /more/trending is broken for the same
 * reason. `popular_lec_api.php` is the endpoint the rest of the app already
 * uses for trending and returns the same shape, so this view uses it too rather
 * than depending on a file no one can maintain.
 */
export async function getMoreTrending(page = 1): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/popular_lec_api.php?langid=6&page=${page}`,
    { cache: { revalidate: 300, tags: [`more:trending:p${page}`] } },
  );
}

/**
 * GET /leclisting_new.php?langid=6&page={page}
 */
export async function getMoreRecent(page = 1): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/leclisting_new.php?langid=6&page=${page}`,
    { cache: { revalidate: 60, tags: [`more:recent:p${page}`] } },
  );
}

/**
 * GET /leclisting_lang.php?langid=6&page={page}
 * Same anonymous-fallback used on the landing "recently viewed" row.
 */
export async function getMoreRecentlyViewed(
  page = 1,
): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/leclisting_lang.php?langid=6&page=${page}`,
    { cache: { revalidate: 60, tags: [`more:viewed:p${page}`] } },
  );
}

/**
 * GET /leclisting_rec.php?langid=6&page={page}
 */
export async function getMoreRecommended(page = 1): Promise<LectureSummary[]> {
  return api.get<LectureSummary[]>(
    `/leclisting_rec.php?langid=6&page=${page}`,
    { cache: { revalidate: 300, tags: [`more:recommended:p${page}`] } },
  );
}

export type DownloadLinks = {
  mp3_title?: string;
  mp3_url?: string;
  amr_url?: string;
  mp3_size?: string;
  amr_size?: string;
  /** Free downloads spent this calendar month. Absent for premium. */
  download_count?: number;
  free_download_limit?: number;
  /** Downloads left this month; null when the plan is unlimited. */
  downloads_remaining?: number | null;
};

/**
 * POST /download_api.php — resolves the downloadable files for a lecture.
 *
 * The upstream returns a bare `"https:"` for formats it has no file for, so
 * callers must treat anything without a path as unavailable.
 *
 * Requires a signed-in user's bearer token: the endpoint refuses anonymous
 * callers with 401 so the media URLs are never handed to a visitor we cannot
 * attribute a download to. Resolving a lecture *is* the metered event upstream
 * — it claims one of the caller's free monthly slots — so this is deliberately
 * uncached: the response is per-user and per-call, and a shared cache entry
 * would both leak one user's remaining count to another and let a second user
 * download on the first user's claim.
 *
 * Throws `ApiError` rather than swallowing, so callers can tell 401
 * (sign in) from 403 (allowance spent) from a genuine upstream failure.
 */
export async function getDownloadLinks(
  lecid: string | number,
  token: string,
): Promise<DownloadLinks> {
  return api.post<DownloadLinks>(
    "/download_api.php",
    { lecid: Number(lecid) },
    { token, cache: { revalidate: false } },
  );
}

export type NamedOption = { id: string | number; name: string };

/**
 * GET /allcateg_api.php — content categories, used by the playlist chip row.
 *
 * `limit` defaults to 15 because CRA's `useCategoriesHook` does
 * `data.slice(0, 15)`; the endpoint returns ~38, and showing them all would
 * give the chip row three extra lines the live site doesn't have.
 */
export async function getCategories(limit = 15): Promise<NamedOption[]> {
  try {
    const list = await api.get<Array<{ id: string | number; name: string }>>(
      `/allcateg_api.php`,
      { cache: { revalidate: 86400, tags: ["categories"] } },
    );
    if (!Array.isArray(list)) return [];
    return list.slice(0, limit).map(({ id, name }) => ({ id, name }));
  } catch {
    return [];
  }
}
