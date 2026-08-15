"use server";

import { getDownloadLinks, type DownloadLinks } from "./listings";

/**
 * Resolves a lecture's downloadable files on demand.
 *
 * A Server Action rather than fetching at render: a listing page would
 * otherwise fire one upstream POST per row just to populate buttons most
 * visitors never press.
 */
export async function fetchDownloadLinks(
  lectureId: string,
): Promise<DownloadLinks | null> {
  return getDownloadLinks(lectureId);
}
