/**
 * Branded 1200x630 card used whenever a page has no artwork of its own.
 *
 * Next merges metadata shallowly, so a page that declares `openGraph` replaces
 * the root layout's block outright — it does NOT inherit the default image.
 * Every page that sets its own `openGraph` therefore has to fall back to this
 * explicitly, or it ships with no share image at all.
 */
export const OG_FALLBACK_IMAGE = "/brand/og-default.png";

/**
 * Upgrade a catalogue image URL to the largest version the media server holds.
 *
 * The API hands back `/dc_images/thumbnails/<id>.jpg`, which is **100x80** for
 * every row — below the minimum every social platform requires, so WhatsApp and
 * Facebook silently rendered link previews with no image at all. The same id
 * without the `thumbnails/` segment is 250x200, which clears Facebook's 200x200
 * floor.
 *
 * 250x200 is still small: it earns a thumbnail-sized preview rather than a
 * large card, and the media library has nothing bigger. Fixing that properly
 * means generating composed 1200x630 cards or re-encoding the source artwork.
 */
export function socialImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace("/dc_images/thumbnails/", "/dc_images/");
}

/**
 * Share text for a single lecture.
 *
 * The API's own `description` is technical metadata — "Language: Yoruba.\nSize:
 * 24.95 MB [MP3] | 3.12 MB [AMR]" — which is what WhatsApp and Facebook were
 * showing under the title. Prefer a sentence naming the lecturer and album, and
 * keep the upstream text only as a last resort.
 */
export function lectureShareDescription({
  title,
  lecturer,
  albumName,
}: {
  title: string;
  lecturer?: string;
  albumName?: string;
}): string {
  const by = lecturer ? ` by ${lecturer}` : "";
  const from = albumName ? ` from the album ${albumName}` : "";
  return `Listen to ${title}${by}${from} on DawahCast — Islamic lectures, recitations and podcasts.`;
}

/**
 * Budget for the `<title>` text a page supplies, in characters.
 *
 * The root layout appends " · DawahCast" (12 chars) via its title template, and
 * Google truncates the whole string around 60 — so anything past this is spent
 * rendering an ellipsis in the result. Catalogue titles arrive far longer than
 * that: upstream lecture names run past 110 characters on their own.
 */
const TITLE_BUDGET = 48;

/**
 * Trim a catalogue title down to something a search result can actually show.
 *
 * Upstream lecture names usually already end with the lecturer — "…Kafin
 * Mutuwar (07-08-26) (Hausa) - Shaykh Musa Yusuf Assadussunnah (Hausa)" — and
 * the page then had the same name a second time in `og:title`. Dropping the
 * duplicated tail first means the truncation that follows spends its budget on
 * the part of the title that identifies the lecture.
 *
 * Cuts on a word boundary; a mid-word cut reads like a broken string rather
 * than an abbreviation.
 */
export function seoTitle(
  title: string,
  lecturer?: string,
  budget = TITLE_BUDGET,
): string {
  let text = title.replace(/\s+/g, " ").trim();

  if (lecturer) {
    const name = lecturer.replace(/\s+/g, " ").trim();
    // " - Shaykh X" / " — Shaykh X", optionally followed by a parenthetical
    // language tag the upstream repeats: "(Hausa)".
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text
      .replace(new RegExp(`\\s*[-—–]\\s*${escaped}\\s*(\\([^)]*\\))?\\s*$`, "i"), "")
      .trim();
  }

  if (text.length <= budget) return text;

  const clipped = text.slice(0, budget);
  const lastSpace = clipped.lastIndexOf(" ");
  // Only honour the word boundary when it isn't throwing away most of the
  // budget — a single very long token should still be cut.
  const cut = lastSpace > budget * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${cut.replace(/[\s,;:–—-]+$/, "")}…`;
}

/** True when the upstream description is real prose rather than file metadata. */
export function isUsableDescription(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 40) return false;
  // Upstream rows lead with these generated fields rather than a summary.
  return !/^(language|size|duration|format)\s*:/i.test(trimmed);
}
