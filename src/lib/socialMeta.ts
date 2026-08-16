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

/** True when the upstream description is real prose rather than file metadata. */
export function isUsableDescription(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 40) return false;
  // Upstream rows lead with these generated fields rather than a summary.
  return !/^(language|size|duration|format)\s*:/i.test(trimmed);
}
