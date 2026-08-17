import type { Metadata } from "next";
import { getCategories } from "@/features/dawahcast/server/category";
import { CategoryTile } from "@/features/dawahcast/components/CategoryTile";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";
import { CollectionJsonLd } from "@/lib/CollectionJsonLd";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse by Category",
  description: "Browse DawahCast by topic.",
  alternates: { canonical: ROUTES.categories },
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Categories</h1>
      <CollectionJsonLd
        name="Islamic Lecture Categories"
        description="Browse DawahCast's Islamic lecture catalogue by topic."
        path={ROUTES.categories}
        items={categories.map((category) => ({
          name: category.name,
          path: ROUTES.category(category.id),
          image: category.image,
        }))}
      />
      <PageHeaderRouter title="Categories" />
      {categories.length > 0 ? (
        // CRA: 5 columns, dropping to 4 at ≤1100px and 2 on mobile.
        <ul className="grid grid-cols-2 justify-center gap-2 mobile-up:grid-cols-4 mobile-up:gap-4 xl:grid-cols-5">
          {categories.map((c, i) => (
            <li key={`${c.id}-${i}`}>
              <CategoryTile id={c.id} name={c.name} image={c.image} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-sm text-color">
          No categories available.
        </p>
      )}
    </div>
  );
}
