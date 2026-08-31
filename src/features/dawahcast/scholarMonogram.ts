/**
 * Initials and a stable colour for a scholar's avatar.
 *
 * The catalogue has no photographs of scholars — the stored images are wide
 * branded name cards, which cannot survive being cropped into a circle (the
 * name comes out as "sheed Buwa"), and the name is already printed under the
 * avatar anyway. A monogram is the honest thing to draw instead.
 */

/**
 * Titles that precede a name in this catalogue. Taking `name.charAt(0)` gives
 * "S" for every one of the many scholars called "Shaykh …", so the honorific has
 * to come off before the initials mean anything.
 *
 * `Abu`/`Ibn`/`Bn` are deliberately absent: they are part of the name itself
 * (Abu Naasir), not titles.
 */
const HONORIFICS = new Set([
  "shaykh", "sheikh", "shaikh", "sh",
  "dr", "prof", "professor",
  "imam", "ustadh", "ustaadh", "ustaz", "ustadha",
  "mallam", "malam", "mall",
  "alhaji", "alhaja", "barrister", "engr", "engineer",
  "mr", "mrs", "ms",
]);

function stripTrailingQualifiers(name: string): string {
  // Drops "(Iwo)", "[RahimahuLlah]" and similar, which are location or
  // supplication suffixes rather than part of the name.
  return name.replace(/[([{][^)\]}]*[)\]}]/g, " ");
}

function meaningfulWords(name: string): string[] {
  const words = stripTrailingQualifiers(name)
    .split(/[\s,]+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);

  const withoutTitles = words.filter(
    (w) => !HONORIFICS.has(w.toLowerCase().replace(/\.$/, "")),
  );
  // A name made only of titles is not plausible, but fall back rather than
  // render an empty circle.
  return withoutTitles.length > 0 ? withoutTitles : words;
}

/** Up to two initials, e.g. "Shaykh Rasheed Buwayb (Iwo)" -> "RB". */
export function scholarInitials(name: string): string {
  const words = meaningfulWords(name ?? "");
  if (words.length === 0) return "?";
  const first = [...words[0]][0] ?? "";
  const second = words.length > 1 ? ([...words[1]][0] ?? "") : "";
  return (first + second).toUpperCase();
}

/**
 * Deep, saturated backgrounds that clear 4.5:1 against white in either theme,
 * so the monogram does not need a light/dark variant.
 */
const MONOGRAM_COLORS = [
  "#0f5132", "#14532d", "#155e75", "#1e3a8a",
  "#4c1d95", "#831843", "#7c2d12", "#78350f",
];

/**
 * Picks a colour from the name so a given scholar always renders the same one,
 * across pages and across server and client.
 */
export function scholarMonogramColor(name: string): string {
  let hash = 0;
  for (const ch of name ?? "") {
    hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  }
  return MONOGRAM_COLORS[hash % MONOGRAM_COLORS.length];
}
