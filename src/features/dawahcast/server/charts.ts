import { api } from "@/lib/api";

export type ChartPeriod = "daily" | "weekly" | "monthly";
export type ChartKind = "lectures" | "album" | "lecturer" | "playlist";

export type ChartItem = {
  id: string | number;
  title: string;
  image: string | undefined;
  lecturer: string | undefined;
  views: number | undefined;
  raw: Record<string, unknown>;
};

type ChartResponse = { status?: string; data?: Record<string, unknown>[] };

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
}

function normalize(kind: ChartKind, raw: Record<string, unknown>): ChartItem {
  const id = (raw.nid ?? raw.id) as string | number;
  const title =
    str(raw.mp3_title) ||
    str(raw.name) ||
    str(raw.title) ||
    str(raw.Title) ||
    "Untitled";
  const image =
    str(raw.mp3_thumbnail) ||
    str(raw.alb_thumbnail) ||
    str(raw.rp_thumbnail) ||
    str(raw.img) ||
    str(raw.lec_img) ||
    str(raw.playlist_img);
  const lecturer =
    kind === "lectures" || kind === "album"
      ? str(raw.rpname) || str(raw.rp)
      : undefined;
  return { id, title, image, lecturer, views: num(raw.views), raw };
}

async function fetchChart(
  path: string,
  kind: ChartKind,
  action: ChartPeriod,
  tag: string,
): Promise<ChartItem[]> {
  const res = await api.get<ChartResponse | Record<string, unknown>[]>(
    `${path}?action=${action}`,
    { cache: { revalidate: 1800, tags: [tag] } },
  );
  const list = Array.isArray(res) ? res : res?.data;
  if (!Array.isArray(list)) return [];
  return list.map((raw) => normalize(kind, raw));
}

export const getChartLectures = (action: ChartPeriod) =>
  fetchChart("/leclisting_charts_api.php", "lectures", action, `charts:lectures:${action}`);

export const getChartAlbums = (action: ChartPeriod) =>
  fetchChart("/albumlisting_charts_api.php", "album", action, `charts:albums:${action}`);

export const getChartRps = (action: ChartPeriod) =>
  fetchChart("/rplisting_charts_api.php", "lecturer", action, `charts:rps:${action}`);

export const getChartPlaylists = (action: ChartPeriod) =>
  fetchChart("/playlist_charts_api.php", "playlist", action, `charts:playlists:${action}`);
