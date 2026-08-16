"use client";

import { useRouter } from "next/navigation";

/**
 * Mobile-only page header: back chevron, centred title, spacer for symmetry.
 *
 * Ported from CRA's `headerRouter/HeaderRouter.jsx`. It is invisible on the
 * desktop site — `hroute_title_res_wrap` carries
 * `@media (min-width: 600px) { display: none }` — so it only shows below 600px,
 * which is why it is easy to miss when comparing the two apps at desktop width.
 * CRA renders it on 14 listing pages; detail pages use `BackLink` instead.
 *
 * `href` mirrors CRA's `link` prop: when omitted the control goes back in
 * history, matching `navigate(-1)`.
 */
export function PageHeaderRouter({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  const router = useRouter();

  return (
    <div
      className={[
        // CRA hides this at ≥600px. `mobile` (max-615) is close but not equal,
        // so the cutoff is expressed directly to keep the two apps in step.
        "relative mb-6 flex w-full items-center justify-between rounded-xl border border-[#3f3f46]/20 px-4 py-5 hroute-up:hidden",
        "bg-[linear-gradient(135deg,rgba(24,24,27,0.4)_0%,rgba(18,18,20,0.6)_100%)] backdrop-blur-lg",
        "motion-safe:animate-[fadeInDown_0.5s_ease-out]",
        // Decorative accent line along the top edge.
        "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-xl",
        "before:bg-[linear-gradient(90deg,transparent_0%,rgba(221,255,43,0.5)_50%,transparent_100%)]",
      ].join(" ")}
    >
      <button
        type="button"
        aria-label={href ? `Back to ${title}` : "Go back"}
        onClick={() => (href ? router.push(href) : router.back())}
        className="shrink-0 cursor-pointer rounded-lg p-1 text-[32px] leading-none text-[#e4e4e7] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#ddff2b]/10 hover:text-[#ddff2b] motion-safe:hover:-translate-x-0.5 motion-safe:active:-translate-x-1 motion-safe:active:scale-95"
      >
        {/* Matches CRA's MdOutlineKeyboardArrowLeft. */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="h-8 w-8"
        >
          <path d="M14.71 15.88 10.83 12l3.88-3.88a.996.996 0 1 0-1.41-1.41L8.71 11.3a.996.996 0 0 0 0 1.41l4.59 4.59a.996.996 0 0 0 1.41 0c.38-.39.39-1.03 0-1.42" />
        </svg>
      </button>

      <p className="m-0 flex-1 text-center text-xl font-semibold leading-[1.4] tracking-[-0.01em] text-[#f4f4f5] xs:text-lg">
        {title}
      </p>

      {/* Balances the back button so the title stays optically centred. */}
      <div className="h-10 w-10 shrink-0" />
    </div>
  );
}
