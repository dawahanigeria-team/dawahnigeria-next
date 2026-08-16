import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { ROUTES } from "@/lib/routes";
import {
  getNewLectures,
  getLecturers,
  getPlaylists,
  getRecitationAlbums,
  getCategories,
} from "@/features/dawahcast/server/listings";

/**
 * Static sitemap for the dawahcast surface. Detail pages (album, lecture,
 * lecturer, etc.) aren't enumerated here because there are too many; rely on
 * crawler discovery from the listing pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const paths: string[] = [
    ROUTES.home,
    ROUTES.trending,
    ROUTES.new,
    ROUTES.ramadan,
    ROUTES.lecturers,
    ROUTES.recitations,
    ROUTES.videos,
    ROUTES.playlists,
    ROUTES.categories,
    ROUTES.moreRecent,
    ROUTES.moreRecentlyViewed,
  ];
  const staticEntries: MetadataRoute.Sitemap = paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
  }));

  // Keep crawlers connected to fresh catalogue detail pages. A complete
  // 300k-item sitemap needs a paginated sitemap feed from the catalogue API;
  // until that exists, publish the newest 150 lectures plus current public
  // lecturers/playlists rather than exposing only eleven listing pages.
  const [lecturePages, lecturerPages, playlists, albumPages, categories] =
    await Promise.all([
      Promise.allSettled([1, 2, 3, 4, 5].map((page) => getNewLectures(page))),
      Promise.allSettled([1, 2, 3, 4, 5].map((page) => getLecturers(page))),
      getPlaylists().catch(() => []),
      // Albums were missing entirely, which left the whole recitation catalogue
      // reachable only by crawling the listing pages — every Quran recitation on
      // the site is an album.
      Promise.allSettled([1, 2, 3, 4, 5].map((page) => getRecitationAlbums(page))),
      getCategories(100).catch(() => []),
    ]);

  const lectures = lecturePages.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
  const lecturers = lecturerPages.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
  const albums = albumPages.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  const detailEntries: MetadataRoute.Sitemap = [
    ...lectures.map((lecture) => ({
      url: `${base}${ROUTES.lecture(lecture.nid ?? lecture.id)}`,
      lastModified: lecture.postedOn ? new Date(lecture.postedOn) : undefined,
      changeFrequency: "weekly" as const,
    })),
    ...lecturers.map((lecturer) => ({
      url: `${base}${ROUTES.resourcePerson(lecturer.id)}`,
      changeFrequency: "weekly" as const,
    })),
    ...playlists.map((playlist) => ({
      url: `${base}${ROUTES.playlist(playlist.id)}`,
      changeFrequency: "weekly" as const,
    })),
    ...albums.map((album) => ({
      url: `${base}${ROUTES.album(album.nid ?? album.id)}`,
      changeFrequency: "weekly" as const,
    })),
    ...categories.map((category) => ({
      url: `${base}${ROUTES.category(category.id)}`,
      changeFrequency: "weekly" as const,
    })),
  ];

  const seen = new Set<string>();
  return [...staticEntries, ...detailEntries].filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
