/**
 * Compact count formatter, ported from CRA's `components/UI/formatter.jsx`.
 * 1_500 → "1.5k", 792_800 → "792.8k".
 *
 * Guards the CRA version's blind spots: log10 of 0 is -Infinity and of a
 * negative is NaN, either of which produced "NaNundefined" downstream.
 */
export function formatNumber(value: number | string | undefined | null): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === undefined || n === null || Number.isNaN(n)) return "0";
  if (n <= 0) return "0";

  const suffixes = ["", "k", "M", "B", "T"];
  const suffixNum = Math.min(
    Math.floor(Math.log10(n) / 3),
    suffixes.length - 1,
  );
  if (suffixNum === 0) return String(n);

  return (n / Math.pow(1000, suffixNum)).toFixed(1) + suffixes[suffixNum];
}
