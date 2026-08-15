import Link from "next/link";
import { ROUTES } from "@/lib/routes";

/**
 * "Community listening" card, mobile only.
 *
 * CRA's `.landing_mobile_leaderboard_cta` is `display: none` until the mobile
 * media query, so it sits between the Browse row and the language chips on
 * phones and nowhere else. Without it the leaderboard has no entry point from
 * home on mobile.
 *
 * Colours are CRA's literals rather than theme tokens: the card keeps its dark
 * treatment in both themes, as it does on the live site.
 */
export function LeaderboardCta() {
  return (
    <section
      aria-label="Listening leaderboard"
      className="mb-5 hidden rounded-[16px] border border-dncolor-500/25 p-4 mobile:block"
      style={{
        backgroundImage:
          "radial-gradient(circle at top right, rgba(221,255,43,0.16), transparent 44%), linear-gradient(135deg, rgba(11,13,16,0.95), rgba(18,22,29,0.95))",
      }}
    >
      <p className="m-0 inline-block text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-dncolor-500">
        Community listening
      </p>
      <h2 className="my-[0.35rem] text-base leading-[1.3] text-[#f8f9fb]">
        Check today&apos;s leaderboard
      </h2>
      <p className="m-0 text-[0.82rem] leading-[1.45] text-[#b9c0cd]">
        Track your listening sessions and climb the daily ranking.
      </p>
      <Link
        href={ROUTES.leaderboard}
        className="mt-[0.8rem] inline-block rounded-full bg-dncolor-500 px-[0.95rem] py-[0.52rem] text-[0.8rem] font-bold text-[#0e1013] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dncolor-500 focus-visible:ring-offset-2"
      >
        View leaderboard
      </Link>
    </section>
  );
}
