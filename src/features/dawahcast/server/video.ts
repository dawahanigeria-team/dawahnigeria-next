import { api } from "@/lib/api";

export type Video = {
  id: string | number;
  title: string;
  description: string | undefined;
  youtubeId: string | undefined;
  thumbnail: string | undefined;
  lecturer: string | undefined;
  views: number;
  favorites: number;
  duration: string | undefined;
  /** Comma/pipe-separated on the upstream; split by `videoCategories()`. */
  categories: string | undefined;
  raw: Record<string, unknown>;
};

type VideoRaw = Record<string, unknown> & {
  nid?: string | number;
  id?: string | number;
  video_title?: string;
  title?: string;
  description?: string;
  video_id?: string;
  youtube_id?: string;
  youtubekey?: string;
  thumbnail?: string;
  images?: string;
  img?: string;
  rpname?: string;
  author?: string;
  views?: number | string;
  favorites?: number | string;
  duration?: string;
  categories?: string;
};

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function pickVideo(raw: VideoRaw): Video {
  return {
    id: (raw.nid ?? raw.id) as string | number,
    title: (raw.video_title || raw.title || "Untitled video") as string,
    description: raw.description as string | undefined,
    // The list endpoint calls it `youtubekey`; other shapes use video_id.
    youtubeId: (raw.video_id || raw.youtube_id || raw.youtubekey) as
      | string
      | undefined,
    // …and the thumbnail arrives as `images`, not `thumbnail`/`img`.
    thumbnail: (raw.thumbnail || raw.images || raw.img) as string | undefined,
    lecturer: (raw.rpname || raw.author) as string | undefined,
    views: toNumber(raw.views),
    favorites: toNumber(raw.favorites),
    duration: raw.duration as string | undefined,
    categories: raw.categories as string | undefined,
    raw,
  };
}


/**
 * GET /video_listingApi.php?page={page}&action=allVideo
 */
export async function getVideos(page = 1): Promise<Video[]> {
  const list = await api.get<VideoRaw[]>(
    `/video_listingApi.php?page=${page}&action=allVideo`,
    { cache: { revalidate: 300, tags: ["videos:list"] } },
  );
  return (list ?? []).map(pickVideo);
}

/**
 * No dedicated single-video endpoint; we filter from the list.
 * This is what the CRA does — preserve until upstream adds one.
 */
export async function getVideo(id: string): Promise<Video | null> {
  // Bounded so the search can't run away. Five pages of 30 covers the whole
  // catalogue as of writing (136 videos, page 5 partial).
  const MAX_PAGES = 5;
  const target = String(id);
  const findOn = (list: Video[]) => list.find((v) => String(v.id) === target);

  // Page 1 is awaited on its own because it is the hot path: the listing shows
  // the newest 30, so that is where most detail links point. Folding it into
  // the parallel batch below would make the common lookup wait on the slowest
  // of five requests instead of just this one (measured +48ms).
  const firstPage = await getVideos(1).catch(() => [] as Video[]);
  const hit = findOn(firstPage);
  if (hit) return hit;
  // Nothing on page 1 means an empty catalogue, not a deep video.
  if (!firstPage.length) return null;

  // Only reached on a miss. These pages don't depend on each other, so they all
  // start before the first await — the old loop awaited inside itself, so a
  // video on page 5 cost five serialised round trips (1604ms -> 680ms).
  //
  // Per-page catch rather than letting Promise.all reject: one failing page
  // left the earlier pages' results intact before, and a rejection here would
  // instead turn a findable video into a 404.
  const restPages = await Promise.all(
    Array.from({ length: MAX_PAGES - 1 }, (_, i) =>
      getVideos(i + 2).catch(() => [] as Video[]),
    ),
  );

  // Page order is preserved by Promise.all, so this returns the same match the
  // sequential scan did. It no longer stops at the first empty page, which only
  // differs if the API ever returns a gap mid-run — and finding the video there
  // is the better answer anyway.
  for (const list of restPages) {
    const match = findOn(list);
    if (match) return match;
  }
  return null;
}

/**
 * GET /video_listingApi.php?action=curatedVideo — the editor's picks.
 *
 * Backs "Featured picks"; when it returns nothing the page falls back to the
 * most-viewed videos, which is what CRA does.
 */
export async function getCuratedVideos(): Promise<Video[]> {
  try {
    const list = await api.get<VideoRaw[]>(
      `/video_listingApi.php?action=curatedVideo`,
      { cache: { revalidate: 600, tags: ["videos:curated"] } },
    );
    return (list ?? []).map(pickVideo);
  } catch {
    return [];
  }
}
