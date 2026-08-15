import { HiFire } from "react-icons/hi";
import { FiTrendingUp } from "react-icons/fi";
import { formatNumber } from "@/lib/formatNumber";

/**
 * Trending overview banner, ported from CRA's `trending.scss`
 * `.trending_hero_section`. Amber-tinted card, gradient-filled title, and three
 * glass stat cards. Hidden below 615px, as on the live site.
 */
export function TrendingHero({
  totalItems,
  totalViews,
  totalFavorites,
}: {
  totalItems: number;
  totalViews: number;
  totalFavorites: number;
}) {
  const stats = [
    { icon: <FiTrendingUp />, value: totalItems, label: "Trending Items" },
    { icon: <HiFire />, value: totalViews, label: "Total Views" },
    { icon: <HiFire />, value: totalFavorites, label: "Total Favorites" },
  ];

  return (
    <section
      aria-label="Trending Overview"
      className="relative z-[1] mb-12 mt-4 hidden w-full rounded-2xl border border-[rgba(255,167,54,0.2)] bg-[linear-gradient(135deg,rgba(255,167,54,0.1)_0%,rgba(150,115,74,0.1)_100%)] p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,167,54,0.15)] mobile-up:block"
    >
      <div className="mb-8 flex items-center gap-6">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ffa736_0%,#96734a_100%)]"
          aria-hidden
        >
          <HiFire className="text-[32px] text-white" />
        </span>
        <div className="flex-1">
          <h2 className="m-0 mb-2 bg-[linear-gradient(135deg,#ffa736_0%,#96734a_100%)] bg-clip-text text-[28px] font-bold text-transparent">
            Trending Now
          </h2>
          <p className="m-0 text-[16px] text-color">
            Discover what&apos;s capturing hearts and minds
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-3 gap-6">
        {stats.map((stat) => (
          <li
            key={stat.label}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(255,167,54,0.3)] hover:bg-white/[0.08] hover:shadow-[0_4px_12px_rgba(255,167,54,0.2)]"
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(255,167,54,0.2)_0%,rgba(150,115,74,0.2)_100%)] text-[24px] text-[#ffa736]"
              aria-hidden
            >
              {stat.icon}
            </span>
            <div className="flex-1">
              <p className="m-0 text-[24px] font-bold text-foreground">
                {formatNumber(stat.value)}
              </p>
              <p className="m-0 text-[14px] text-color">{stat.label}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
