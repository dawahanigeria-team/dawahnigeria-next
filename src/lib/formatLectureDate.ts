const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Convert the API's `updated_date` string ("Wed, 2023/03/08 - 14:15") into a
 * short display label ("8 Mar 2023"). Display only — never use for sorting.
 * Returns "" when there is no parseable date.
 */
export function formatLectureDate(updatedDate: string | undefined): string {
  if (!updatedDate || typeof updatedDate !== "string") return "";
  const match = updatedDate.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!match) return "";
  const [, year, month, day] = match;
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return "";
  return `${Number(day)} ${MONTHS[monthIndex]} ${year}`;
}

/**
 * "Date of Release" as the live detail pages show it: the upstream string with
 * its trailing time stripped — "Sat, 2026/08/08 - 14:15" → "Sat, 2026/08/08".
 *
 * Deliberately separate from `formatLectureDate`, which produces the short
 * "8 Aug 2026" form used in listings and search results.
 */
export function formatReleaseDate(updatedDate: string | undefined): string {
  if (!updatedDate || typeof updatedDate !== "string") return "";
  return updatedDate.split(" - ")[0].trim();
}
