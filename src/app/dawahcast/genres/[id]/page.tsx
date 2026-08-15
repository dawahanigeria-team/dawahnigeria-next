import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** "Genres" is the CRA's legacy alias for Categories. */
export default async function GenreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(ROUTES.category(id));
}
