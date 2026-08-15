import { api } from "@/lib/api";

export type RamadanYear = {
  /** The Hijri year, used as the route segment (e.g. 1447). */
  id: string;
  year: string;
  /** Full collection name, e.g. "Ramadan Tafseer 1447". */
  name: string;
  albumCount: number;
  image: string | undefined;
  /** The year's albums, used for the featured year's preview row. */
  albums: Array<Record<string, unknown>>;
  raw: Record<string, unknown>;
};

type RamadanYearRaw = Record<string, unknown> & {
  key_id?: string;
  name?: string;
  year?: string | number;
  total_count?: number;
  documents?: Array<Record<string, unknown>>;
};

type RamadanYearsResponse =
  | { data?: RamadanYearRaw[] }
  | RamadanYearRaw[];

/** Pull the trailing Hijri year out of names like "Ramadan Tafseer 1447". */
export function extractRamadanYear(name: string | undefined): string {
  const match = String(name ?? "").match(/(\d{3,4})/);
  return match ? match[1] : String(name ?? "").trim();
}

/**
 * GET /ramadanlisting_api.php?action=getRamadanAlbums
 * Returns one entry per Hijri year, each carrying its album `documents`.
 */
export async function getRamadanYears(): Promise<RamadanYear[]> {
  const res = await api.get<RamadanYearsResponse>(
    `/ramadanlisting_api.php?action=getRamadanAlbums`,
    { cache: { revalidate: 3600, tags: ["ramadan:years"] } },
  );
  const list = Array.isArray(res) ? res : (res?.data ?? []);
  if (!Array.isArray(list)) return [];

  return list.map((raw) => {
    const year = extractRamadanYear(raw.name ?? (raw.year as string));
    const docs = Array.isArray(raw.documents) ? raw.documents : [];
    const firstImg = docs[0]?.img as string | undefined;
    return {
      id: year,
      year,
      albumCount: Number(raw.total_count ?? docs.length ?? 0),
      name: String(raw.name ?? `Ramadan ${year}`),
      image: firstImg,
      albums: docs,
      raw,
    };
  });
}

export type RamadanAlbum = {
  nid: string | number;
  title: string;
  image: string | undefined;
  lectureCount: number | undefined;
  language: string | undefined;
  raw: Record<string, unknown>;
};

type KeywordAlbumsResponse = {
  data?: Array<Record<string, unknown>>;
  total?: number;
  success?: boolean;
};

/**
 * GET /albumlisting_keywords_api.php?key=Ramadan Tafseer {year}&page={page}
 * Mirrors the CRA's useKeywordAlbums hook used by the Ramadan year view.
 */
export async function getRamadanYearAlbums(
  year: string,
  page = 1,
  search = "",
): Promise<{ albums: RamadanAlbum[]; total: number }> {
  const key = `Ramadan Tafseer ${year}`;
  const qs = `key=${encodeURIComponent(key)}&page=${page}${
    search ? `&search=${encodeURIComponent(search)}` : ""
  }`;
  const res = await api.get<KeywordAlbumsResponse>(
    `/albumlisting_keywords_api.php?${qs}`,
    { cache: { revalidate: 1800, tags: [`ramadan:year:${year}:p${page}`] } },
  );
  const list = Array.isArray(res?.data) ? res.data : [];
  const albums = list.map((raw) => ({
    nid: (raw.nid ?? raw.id) as string | number,
    title: String(raw.title ?? raw.name ?? "Untitled Album"),
    image: (raw.img as string | undefined) || (raw.alb_thumbnail as string | undefined),
    lectureCount:
      raw.lec_no !== undefined ? Number(raw.lec_no) : undefined,
    language: raw.lang as string | undefined,
    raw,
  }));
  return { albums, total: Number(res?.total ?? albums.length) };
}
