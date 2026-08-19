import { LectureRowSkeleton } from "@/features/dawahcast/components/Skeletons";

/**
 * Segment-level Suspense fallback, inherited by every catalogue route that does
 * not define its own.
 *
 * Two jobs. The visible one is feedback: these pages are `force-dynamic` against
 * the upstream PHP API, so a navigation otherwise sits on the previous screen
 * with no acknowledgement until the fetch returns. The structural one is that it
 * lets `error.tsx` work at all — it is the Suspense boundary React needs to have
 * flushed the shell before a page throws, which is what turns a hard 500 into
 * the boundary rendering in place.
 *
 * Deliberately generic: it stands in for a header plus rows, which is the shape
 * most routes here share. Pages with a very different layout (`/dawahcast`, the
 * detail pages) already declare their own inner Suspense fallbacks.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="mb-2 flex h-[42px] items-center px-[2%] mobile:px-0">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      </div>
      <LectureRowSkeleton />
      <LectureRowSkeleton />
    </div>
  );
}
