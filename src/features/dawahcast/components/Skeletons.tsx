/**
 * Placeholder for a scroll row. Every measurement here mirrors the real row —
 * `my-4 sm:my-6` section, a 42px-tall heading line, and `w-[160px] sm:w-[190px]`
 * aspect-square tiles laid out on the same `gap-4 pl-4` track. Guessed
 * dimensions are what make a Suspense fallback shift the page when it resolves,
 * so these have to track `LectureRow`/`AlbumRow` and their cards.
 */
function RowSkeleton({ textLines }: { textLines: 1 | 2 }) {
  return (
    <section className="my-4 sm:my-6" aria-busy="true" aria-label="Loading">
      <div className="mb-2 flex h-[42px] items-center px-[2%] mobile:mb-0 mobile:px-0">
        <div className="h-6 w-56 animate-pulse rounded bg-muted" />
      </div>
      <div className="relative w-full overflow-x-hidden">
        <ul className="flex w-[105%] gap-4 overflow-hidden py-1 pl-4 pr-16 mobile:gap-2 mobile:p-2 mobile:pl-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex w-[160px] shrink-0 flex-col gap-2 sm:w-[190px]">
              <div className="aspect-square w-full animate-pulse rounded-md bg-muted" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
              {textLines === 2 ? (
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Fallback for `LectureRow` — cards carry a title plus a lecturer line. */
export function LectureRowSkeleton() {
  return <RowSkeleton textLines={2} />;
}

/** Fallback for `AlbumRow` — `AlbumCard` renders a title and nothing under it. */
export function AlbumRowSkeleton() {
  return <RowSkeleton textLines={1} />;
}

export function HeroSkeleton() {
  return (
    <div
      className="h-[200px] w-full animate-pulse rounded-md bg-muted sm:h-[300px]"
      aria-busy="true"
      aria-label="Loading hero"
    />
  );
}
