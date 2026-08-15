/**
 * One control in a detail-page action row: a bordered icon box with its caption
 * underneath ("Play", "Like", "Share", "Comment", "Download"), matching live.
 *
 * `count` renders inside the box beside the icon, as the live site does.
 */
export function LabelledAction({
  label,
  count,
  children,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-10 min-w-[3.5rem] items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-foreground transition-colors hover:bg-hover">
        {children}
        {count !== undefined && (
          <span className="text-sm tabular-nums text-color">{count}</span>
        )}
      </div>
      <span className="text-xs text-color">{label}</span>
    </div>
  );
}
