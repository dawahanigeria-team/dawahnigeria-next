export function LectureRowSkeleton() {
  return (
    <section className="my-3 sm:my-5" aria-busy="true" aria-label="Loading">
      <div className="mb-2 h-5 w-40 animate-pulse rounded bg-muted" />
      <ul className="flex gap-3 overflow-hidden pb-2 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="w-[150px] shrink-0 sm:w-[220px]">
            <div className="h-[115px] w-full animate-pulse rounded-md bg-muted sm:h-[165px]" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    </section>
  );
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
