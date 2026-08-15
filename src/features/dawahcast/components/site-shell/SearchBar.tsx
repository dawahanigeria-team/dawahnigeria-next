"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";
import { trackSearch } from "@/features/analytics/posthog";

/**
 * Header search box. Geometry ported from CRA's `search/search.scss`:
 * 24px pill, 3px/4px/3px/14px padding, 16px leading icon, and a brand-yellow
 * submit button that collapses to an icon below 768px.
 */
export function SearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q) trackSearch(q, { source: "header" });
    router.push(q ? `${ROUTES.search}?query=${encodeURIComponent(q)}` : ROUTES.search);
  };

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-[480px]">
      <div className="relative z-50 flex w-full flex-row items-center rounded-3xl bg-white py-[3px] pl-[14px] pr-1">
        <FiSearch
          className="mr-[0.6rem] shrink-0 text-[16px] text-[rgba(212,212,212,1)]"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search lecturers, lectures, albums..."
          aria-label="Search DawahCast"
          className="min-w-0 flex-auto border-none bg-transparent text-[15px] leading-[28px] text-black outline-none placeholder:text-[14px] placeholder:leading-[28px] placeholder:text-[#6b6b6b] [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="ml-1 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[20px] border-0 bg-[#ddff2b] px-[14px] py-1.5 text-[13px] font-semibold text-black transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 tab:px-2"
        >
          <FiSearch className="hidden text-[16px] tab:inline" aria-hidden />
          <span className="inline tab:hidden">Search</span>
        </button>
      </div>
    </form>
  );
}
