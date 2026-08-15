import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "More",
  description: "Browse more lectures on DawahCast.",
  alternates: { canonical: ROUTES.more },
};

const SECTIONS = [
  { href: ROUTES.moreRecent, title: "Recently Posted", copy: "Every lecture, newest first." },
  { href: ROUTES.moreRecentlyViewed, title: "Recently Viewed", copy: "What the community is listening to." },
  { href: ROUTES.moreTrending, title: "Trending", copy: "Lectures gaining momentum." },
  { href: ROUTES.moreRecommended, title: "Recommended", copy: "Handpicked for you." },
];

export default function MorePage() {
  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="text-2xl font-semibold text-foreground">More</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Explore more lectures across DawahCast.
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="block rounded-lg border border-border p-5 transition-colors hover:bg-hover"
            >
              <p className="text-lg font-semibold text-foreground">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.copy}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
