import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/features/auth/session";
import { getDailyLeaderboard, leaderboardDay } from "@/features/leaderboard/server";
import {
  formatLeaderboardDuration,
  formatLastActivity,
} from "@/features/leaderboard/format";
import { ShareLeaderboard } from "@/features/leaderboard/ShareLeaderboard";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Ramadan Leaderboard",
  description: "Daily usage leaderboard for the Dawah Nigeria Ramadan challenge.",
  alternates: { canonical: ROUTES.leaderboard },
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getSession();
  const day = leaderboardDay();

  return (
    <div className="mx-auto max-w-screen-md px-4 py-4 sm:py-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Ramadan Challenge
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Daily Usage Leaderboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Today ({day}). Stay consistent and climb higher.
          </p>
        </div>
      </header>

      {!session ? (
        <SignInPrompt />
      ) : (
        <AuthenticatedLeaderboard userId={session.user.id} day={day} />
      )}
    </div>
  );
}

function SignInPrompt() {
  return (
    <section
      aria-live="polite"
      className="mt-8 rounded-lg border border-border p-6 text-center"
    >
      <h2 className="text-lg font-semibold text-foreground">
        Sign in to join the leaderboard
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We track listening sessions only for authenticated users.
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Link
          href={`/auth/login?next=${encodeURIComponent(ROUTES.leaderboard)}`}
          prefetch={false}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Login to participate
        </Link>
        <Link href={ROUTES.home} className="text-sm text-muted-foreground hover:text-foreground">
          Back home
        </Link>
      </div>
    </section>
  );
}

async function AuthenticatedLeaderboard({
  userId,
  day,
}: {
  userId: string;
  day: string;
}) {
  const board = await getDailyLeaderboard(userId).catch(() => null);

  if (!board) {
    return (
      <section role="alert" className="mt-8 rounded-lg border border-border p-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Couldn&apos;t load the leaderboard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your session may have expired. Please sign in again.
        </p>
        <div className="mt-4">
          <Link
            href={`/auth/login?next=${encodeURIComponent(ROUTES.leaderboard)}`}
            prefetch={false}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Login again
          </Link>
        </div>
      </section>
    );
  }

  const { entries, myStats, totalParticipants } = board;

  return (
    <>
      <section
        aria-label="My leaderboard stats"
        className="mt-6 grid grid-cols-3 gap-3"
      >
        <StatCard label="My Rank" value={myStats?.isRanked ? `#${myStats.rank}` : "Unranked"} />
        <StatCard label="My Total" value={formatLeaderboardDuration(myStats?.totalSeconds)} />
        <StatCard label="Sessions" value={String(myStats?.sessionsCount ?? 0)} />
      </section>

      <ShareLeaderboard
        day={day}
        rank={myStats?.rank}
        isRanked={myStats?.isRanked}
        totalSeconds={myStats?.totalSeconds}
        totalParticipants={totalParticipants}
        durationLabel={
          myStats?.totalSeconds
            ? formatLeaderboardDuration(myStats.totalSeconds)
            : undefined
        }
      />

      <section aria-label="Leaderboard ranking list" className="mt-6">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <p className="text-sm text-muted-foreground">{totalParticipants} participants</p>
          <Link href={ROUTES.ramadan} className="text-sm text-muted-foreground hover:text-foreground">
            Ramadan page
          </Link>
        </div>

        {entries.length === 0 ? (
          <p aria-live="polite" className="mt-8 text-center text-sm text-muted-foreground">
            No leaderboard entries yet for this day.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {entries.map((entry) => {
              const rank = entry.rank ?? "-";
              const username = entry.username || `User ${entry.userId ?? ""}`;
              return (
                <li
                  key={`${entry.userId}-${rank}`}
                  className={[
                    "flex items-center gap-4 py-3",
                    entry.isCurrentUser ? "rounded-md bg-hover px-2" : "",
                  ].join(" ")}
                >
                  <div className="w-10 shrink-0 text-sm font-semibold text-foreground">
                    #{rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{username}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.sessionsCount ?? 0} sessions
                      {entry.lastActivityAt
                        ? ` · Last active ${formatLastActivity(entry.lastActivityAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-sm text-foreground">
                    {formatLeaderboardDuration(entry.totalSeconds)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-border p-3 text-center">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <strong className="mt-1 block text-lg text-foreground">{value}</strong>
    </article>
  );
}
