"use server";

import { getRecitationAlbums, getTrending } from "./listings";
import { getVideos } from "./video";
import { pickResolverFields } from "../lectureFields";
import type { LectureSummary } from "./landing";
import type { Video } from "./video";

/**
 * Page loaders for the infinite-scrolling listings (trending, recitations,
 * videos). Page 1 is server-rendered by the route itself; these serve page 2
 * onward as the sentinel comes into view.
 *
 * Server Actions rather than route handlers so the upstream endpoints and their
 * query shapes stay off the public API surface, matching the rest of the app.
 *
 * Each rethrows on failure instead of returning `[]`: an empty array is
 * indistinguishable from "last page" to the caller, which would silently end
 * the list at the first blip. `useInfiniteItems` catches and offers a retry.
 */

// The returned rows are serialized straight into a Server Action response and
// accumulated in client state, so they are projected down to the columns the
// resolvers actually read. Raw catalogue rows carry ~64% dead weight.

export async function fetchTrendingPage(page: number): Promise<LectureSummary[]> {
  return pickResolverFields(await getTrending(page));
}

export async function fetchRecitationsPage(
  page: number,
  limit: number,
): Promise<LectureSummary[]> {
  return pickResolverFields(await getRecitationAlbums(page, limit));
}

export async function fetchVideosPage(page: number): Promise<Video[]> {
  return getVideos(page);
}
