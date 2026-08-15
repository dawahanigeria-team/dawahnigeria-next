import type { Video } from "./server/video";

/**
 * Videos tag themselves with a delimited string; CRA splits on comma/pipe/slash.
 *
 * Lives outside `server/video.ts` on purpose: client components need this, and
 * importing any *value* from a server module pulls `lib/api` → `lib/env` into
 * the browser bundle, where the server-only `API_BASE_URL` is undefined and
 * throws at module scope. Type-only imports are erased, so the `Video` import
 * above is safe.
 */
export function videoCategories(video: Video): string[] {
  if (!video.categories) return [];
  return video.categories
    .split(/(?:,|\||\/)/)
    .map((c) => c.trim())
    .filter(Boolean);
}
