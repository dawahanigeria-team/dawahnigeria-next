import "server-only";
import { api } from "@/lib/api";
import { getAccessToken } from "@/features/auth/session";

export type LeaderboardEntry = {
  userId: string | number;
  username?: string;
  rank?: number;
  totalSeconds?: number;
  sessionsCount?: number;
  lastActivityAt?: string;
  isCurrentUser?: boolean;
};

export type LeaderboardMyStats = {
  rank?: number;
  isRanked?: boolean;
  totalSeconds?: number;
  sessionsCount?: number;
};

export type LeaderboardData = {
  entries: LeaderboardEntry[];
  myStats: LeaderboardMyStats | null;
  totalParticipants: number;
  day: string;
};

/** YYYY-MM-DD in the site's primary timezone (matches the CRA en-CA day key). */
export function leaderboardDay(timeZone = "Africa/Lagos"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

type RawResponse = {
  data?: {
    entries?: LeaderboardEntry[];
    myStats?: LeaderboardMyStats | null;
    totalParticipants?: number;
  };
  entries?: LeaderboardEntry[];
  myStats?: LeaderboardMyStats | null;
  totalParticipants?: number;
};

/**
 * POST /leaderboardApi.php { action: "get_daily_leaderboard" } — Bearer auth,
 * per-user, never cached. Returns null when the visitor has no access token.
 */
export async function getDailyLeaderboard(
  userId: string | number | null,
  limit = 20,
  offset = 0,
): Promise<LeaderboardData | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const day = leaderboardDay();
  const numericUserId = Number(userId);
  const res = await api.post<RawResponse>(
    "/leaderboardApi.php",
    {
      action: "get_daily_leaderboard",
      limit,
      offset,
      day,
      ...(Number.isFinite(numericUserId) ? { userId: Math.trunc(numericUserId) } : {}),
    },
    { token, cache: { revalidate: false } },
  );

  const inner = res?.data ?? res ?? {};
  return {
    entries: Array.isArray(inner.entries) ? inner.entries : [],
    myStats: inner.myStats ?? null,
    totalParticipants: Number(inner.totalParticipants ?? 0),
    day,
  };
}
