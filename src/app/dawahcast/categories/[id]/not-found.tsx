import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function CategoryNotFound() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Category not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        That category isn&apos;t available.
      </p>
      <Link
        href={ROUTES.categories}
        className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Browse categories
      </Link>
    </div>
  );
}
