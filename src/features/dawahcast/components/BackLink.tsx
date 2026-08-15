"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

/**
 * "Back" control shown above detail pages.
 *
 * Steps back through history so it returns to whichever listing the visitor
 * arrived from, falling back to the home feed on a cold entry (a shared link,
 * or a search result opened directly).
 *
 * `variant="button"` is the bordered pill used on album/lecture pages;
 * `"inline"` is the plain text form the lecturer page uses in its
 * "Back/ <name>" breadcrumb.
 */
export function BackLink({
  fallback = "/dawahcast",
  variant = "button",
}: {
  fallback?: string;
  variant?: "button" | "inline";
}) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(fallback);
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={goBack}
        className="text-color transition-colors hover:text-foreground"
      >
        Back
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="mb-5 inline-flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-hover"
    >
      <FiArrowLeft aria-hidden />
      <span>Back</span>
    </button>
  );
}
