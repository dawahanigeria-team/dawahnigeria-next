import { api } from "@/lib/api";

export type SearchItem = Record<string, unknown> & {
  id?: string | number;
  type?: string;
  mp3_title?: string;
  title?: string;
  name?: string;
  mp3_description?: string;
  description?: string;
  lecturer_name?: string;
  lecturer_image?: string;
  album_id?: string | number;
  album_name?: string;
  rp_id?: string | number;
  lang_id?: string | number;
  language_name?: string;
  mp3_duration?: string;
  duration?: string;
  views?: number;
  updated_date?: string;
};

export type SearchSort = "relevance" | "newest" | "oldest";

export type SearchResponse = {
  results: SearchItem[];
  total: number;
  totalPages: number;
};

const LIMIT = 20;

/**
 * GET /searchApi.php?type=all&value={query}&page&limit&offset[&lang_id&rp_id&cat_id&album_id&sort]
 * Filter params accept comma-separated id lists (multi-select), mirroring the CRA.
 */
export async function searchAll(opts: {
  query: string;
  page?: number;
  langId?: string;
  rpId?: string;
  catId?: string;
  albumId?: string;
  sort?: SearchSort;
}): Promise<SearchResponse> {
  const { query, page = 1, langId, rpId, catId, albumId, sort = "relevance" } = opts;

  const params = new URLSearchParams({
    type: "all",
    value: query,
    page: String(page),
    limit: String(LIMIT),
    offset: String((page - 1) * LIMIT),
  });
  if (langId) params.set("lang_id", langId);
  if (rpId) params.set("rp_id", rpId);
  if (catId) params.set("cat_id", catId);
  if (albumId) params.set("album_id", albumId);
  if (sort === "newest") params.set("sort", "desc");
  else if (sort === "oldest") params.set("sort", "asc");

  const res = await api.get<{
    success?: boolean;
    status?: string;
    data?: SearchItem[];
    results?: SearchItem[];
    total?: number;
    total_pages?: number;
  }>(`/searchApi.php?${params.toString()}`, { cache: { revalidate: false } });

  const ok = res?.success === true || res?.status === "success";
  if (!ok) return { results: [], total: 0, totalPages: 0 };

  const results = res.data ?? res.results ?? [];
  const total = Number(res.total ?? 0);
  const totalPages = Number(res.total_pages ?? Math.ceil(total / LIMIT));
  return { results, total, totalPages };
}

export type Facet = { id: string; name: string; count: number };

/** Derive filter facets from the current page of results (matches CRA behaviour). */
export function deriveFacets(results: SearchItem[]): {
  lang: Facet[];
  rp: Facet[];
  cat: Facet[];
  alb: Facet[];
} {
  const lang = new Map<string, Facet>();
  const rp = new Map<string, Facet>();
  const cat = new Map<string, Facet>();
  const alb = new Map<string, Facet>();

  const bump = (m: Map<string, Facet>, id: string, name: string) => {
    const existing = m.get(id);
    if (existing) existing.count += 1;
    else m.set(id, { id, name, count: 1 });
  };

  for (const item of results) {
    if (item.language_name && item.lang_id != null) {
      bump(lang, String(item.lang_id), String(item.language_name));
    }
    if (item.lecturer_name && item.rp_id != null) {
      bump(rp, String(item.rp_id), String(item.lecturer_name));
    }
    if (item.type) {
      bump(cat, String(item.type).toLowerCase(), String(item.type));
    }
    if (item.album_id != null) {
      const name =
        (item.album_name as string) ||
        (item.mp3_title as string) ||
        `Album ${item.album_id}`;
      bump(alb, String(item.album_id), name);
    }
  }

  const byCount = (a: Facet, b: Facet) => b.count - a.count;
  return {
    lang: [...lang.values()].sort(byCount),
    rp: [...rp.values()].sort(byCount),
    cat: [...cat.values()].sort(byCount),
    alb: [...alb.values()].sort(byCount).slice(0, 20),
  };
}
