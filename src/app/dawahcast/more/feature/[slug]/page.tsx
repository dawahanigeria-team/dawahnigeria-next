import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getVisibleSpecialFeatureGroups,
  type SpecialFeatureGroup,
} from "@/features/dawahcast/server/landing";
import { MoreListing } from "@/features/dawahcast/components/MoreListing";
import { parsePage } from "@/features/dawahcast/components/PageNav";
import { ROUTES } from "@/lib/routes";

const PAGE_SIZE = 10;

// A hand-edited URL with a malformed escape must 404, not 500.
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const normalize = (name: string) => name.trim().toLowerCase();

async function findGroup(slug: string): Promise<SpecialFeatureGroup | null> {
  // Same request-cached load the landing rows use, so this page costs no
  // extra upstream traffic and always agrees with the row it was linked from.
  const groups = await getVisibleSpecialFeatureGroups().catch(
    () => [] as SpecialFeatureGroup[],
  );
  const target = normalize(safeDecode(slug));
  return groups.find((group) => normalize(group.name) === target) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = await findGroup(slug);
  if (!group) return { title: "Section not found" };
  return {
    title: group.name,
    description:
      group.desc?.trim() ||
      `All lectures in the ${group.name} collection on DawahCast.`,
    alternates: { canonical: ROUTES.moreFeature(group.name) },
  };
}

export default async function MoreFeaturePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ slug }, { page: pageParam }] = await Promise.all([
    params,
    searchParams,
  ]);
  const group = await findGroup(slug);
  if (!group) notFound();

  // The group carries its full curated list inline (~30 items max), so
  // pagination is a slice rather than an upstream page parameter.
  const lectures = group.more ?? [];
  const page = parsePage(pageParam);
  const pageItems = lectures.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <MoreListing
      title={group.name}
      lectures={pageItems}
      basePath={ROUTES.moreFeature(group.name)}
      page={page}
      hasNext={page * PAGE_SIZE < lectures.length}
    />
  );
}
