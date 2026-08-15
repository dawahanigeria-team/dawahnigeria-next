import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/**
 * Legacy CRA route (/dawahcast/ramadan/:id → RamadanDetail). The landing only
 * ever linked to /ramadan/year/:year, and the detail's upstream endpoint is
 * empty, so we redirect the id to the canonical year archive.
 */
export default async function RamadanIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(ROUTES.ramadanYear(id));
}
