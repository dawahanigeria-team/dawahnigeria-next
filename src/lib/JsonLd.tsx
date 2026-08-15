type JsonLdProps = {
  data: Record<string, unknown>;
};

/** Render crawlable schema data without allowing a title to close the script. */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export function absoluteUrl(base: string, path: string) {
  return new URL(path, base).toString();
}

export function durationToIso8601(value: string | number | undefined) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds > 0 ? `PT${Math.round(seconds)}S` : undefined;
  }

  const parts = String(value).split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return undefined;
  const seconds = parts.pop() ?? 0;
  const minutes = parts.pop() ?? 0;
  const hours = parts.pop() ?? 0;
  if (hours + minutes + seconds <= 0) return undefined;
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds ? `${seconds}S` : ""}`;
}
