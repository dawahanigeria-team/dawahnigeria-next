"use server";

import { getLecturerById, getLecturers, type LecturerListItem } from "./listings";

/**
 * Re-fetches the lecturer grid for a chip selection.
 *
 * Two different upstream endpoints back the two chip rows: picking a featured
 * scholar looks them up by id, while picking a state re-queries the paged list.
 * The caller shouldn't have to know which.
 */
export async function fetchLecturers({
  lecturerId,
  state,
  page = 1,
}: {
  lecturerId?: number | null;
  state?: string;
  page?: number;
}): Promise<LecturerListItem[]> {
  try {
    if (lecturerId !== null && lecturerId !== undefined) {
      return await getLecturerById(lecturerId);
    }
    return await getLecturers(page, state || undefined);
  } catch {
    return [];
  }
}
