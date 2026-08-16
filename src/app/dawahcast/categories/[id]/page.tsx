import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getCategory,
  getCategoryLectures,
} from "@/features/dawahcast/server/category";
import { LectureCard } from "@/features/dawahcast/components/LectureCard";
import { ROUTES } from "@/lib/routes";
import { OG_FALLBACK_IMAGE } from "@/lib/socialMeta";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const category = await getCategory(id);
  if (!category) return { title: "Category not found" };

  const description = `${category.name} lectures on DawahCast.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: ROUTES.category(id) },
    openGraph: {
      type: "website",
      title: category.name,
      description,
      images: [{ url: category.image || OG_FALLBACK_IMAGE }],
      url: ROUTES.category(id),
    },
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const [category, lectures] = await Promise.all([
    getCategory(id),
    getCategoryLectures(id, 1),
  ]);
  if (!category) notFound();

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <header className="flex items-center gap-4">
        {category.image && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={category.image}
              alt={category.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Category
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            {category.name}
          </h1>
        </div>
      </header>

      {lectures.length > 0 ? (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {lectures.map((lecture, i) => (
            <li key={`${lecture.nid ?? lecture.id}-${i}`}>
              <LectureCard lecture={lecture} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          No lectures in this category yet.
        </p>
      )}
    </div>
  );
}
