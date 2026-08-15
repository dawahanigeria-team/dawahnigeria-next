/** "0m" / "12m" / "1h 05m" — mirrors the CRA formatLeaderboardDuration. */
export function formatLeaderboardDuration(seconds: number | undefined = 0): string {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return "0m";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatLastActivity(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
