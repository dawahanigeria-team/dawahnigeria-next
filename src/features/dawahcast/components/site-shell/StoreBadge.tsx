type StoreBadgeProps = {
  href: string;
  store: "App Store" | "Google Play";
};

/**
 * A lightweight store link. The previous badge SVGs transferred more than
 * 220KB together, so this keeps the familiar two-line shape without putting
 * decorative assets on every page's critical path.
 */
export function StoreBadge({ href, store }: StoreBadgeProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Download the Dawah Nigeria app on ${store}`}
      className="inline-flex h-10 min-w-[132px] flex-col justify-center rounded-lg border border-white/15 bg-[#111] px-3 text-left text-white transition-colors hover:border-[#ddff00]/60 hover:bg-[#1a1a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dncolor-500"
    >
      <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.14em] text-white/65">
        {store === "App Store" ? "Download on the" : "Get it on"}
      </span>
      <span className="mt-1 text-[14px] font-semibold leading-none">{store}</span>
    </a>
  );
}
