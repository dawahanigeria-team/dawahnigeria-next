import { api } from "@/lib/api";
import type { LectureSummary } from "./landing";

export type Category = {
  id: string | number;
  name: string;
  image: string | undefined;
  raw: Record<string, unknown>;
};

type CategoryRaw = Record<string, unknown> & {
  cat_id?: string | number;
  id?: string | number;
  cat_name?: string;
  name?: string;
  cat_image?: string;
  image?: string;
  img?: string;
};

function pickCategory(raw: CategoryRaw): Category {
  return {
    id: (raw.cat_id ?? raw.id) as string | number,
    name: (raw.cat_name || raw.name || "Category") as string,
    // `/allcateg_api.php` returns `img`; the cat_image/image spellings are
    // other endpoints' shapes. Omitting `img` left every tile blank.
    image: (raw.cat_image || raw.image || raw.img) as string | undefined,
    raw,
  };
}

/**
 * GET /allcateg_api.php
 */
export async function getCategories(): Promise<Category[]> {
  const list = await api.get<CategoryRaw[]>(`/allcateg_api.php`, {
    cache: { revalidate: 3600, tags: ["categories:list"] },
  });
  return (list ?? []).map(pickCategory);
}

/**
 * Resolve a single category by id from the full list.
 */
export async function getCategory(id: string): Promise<Category | null> {
  const list = await getCategories();
  return list.find((c) => String(c.id) === String(id)) ?? null;
}

/**
 * GET /genre_api.php?cat_id={id}&page={page}&sort={sort?}
 *
 * The upstream returns an object `{ audio, rp, album, category_details }`,
 * NOT a flat array — the lectures live under `.audio`.
 */
export async function getCategoryLectures(
  id: string,
  page = 1,
  sort?: string,
): Promise<LectureSummary[]> {
  const res = await api.get<
    { audio?: LectureSummary[] } | LectureSummary[]
  >(
    `/genre_api.php?cat_id=${encodeURIComponent(id)}&page=${page}${
      sort ? `&sort=${encodeURIComponent(sort)}` : ""
    }`,
    { cache: { revalidate: 300, tags: [`category:${id}`] } },
  );
  if (Array.isArray(res)) return res;
  return Array.isArray(res?.audio) ? res.audio : [];
}
