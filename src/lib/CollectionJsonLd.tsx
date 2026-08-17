import { env } from "@/lib/env";
import { absoluteUrl, JsonLd } from "@/lib/JsonLd";

export type CollectionItem = {
  name: string;
  /** Site-relative path, e.g. `/dawahcast/l/331449`. */
  path: string;
  image?: string;
};

type Props = {
  /** Page title as it should appear in the graph, e.g. "Trending Lectures". */
  name: string;
  description: string;
  /** Site-relative path of the listing page itself. */
  path: string;
  items: CollectionItem[];
  /** Caps the emitted list; the rest are still linked in the markup. */
  limit?: number;
};

/**
 * `CollectionPage` + `ItemList` for a browse surface.
 *
 * The detail pages already describe themselves well (AudioObject, MusicAlbum,
 * Person), but the listing pages above them carried only the sitewide
 * Organization/WebSite graph — so nothing told a crawler that /trending *is* a
 * ranked list of specific lectures. `ItemList` supplies both that meaning and an
 * explicit ordered set of URLs into the catalogue.
 *
 * Kept to a leading slice: a list of several hundred entries adds page weight
 * far faster than it adds signal, and the anchors in the markup remain the
 * authoritative crawl path either way.
 */
export function CollectionJsonLd({
  name,
  description,
  path,
  items,
  limit = 50,
}: Props) {
  const listed = items.filter((item) => item.name && item.path).slice(0, limit);
  if (listed.length === 0) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name,
        description,
        url: absoluteUrl(env.siteUrl, path),
        isPartOf: { "@id": `${env.siteUrl}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: listed.length,
          itemListElement: listed.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            url: absoluteUrl(env.siteUrl, item.path),
            ...(item.image ? { image: item.image } : {}),
          })),
        },
      }}
    />
  );
}
