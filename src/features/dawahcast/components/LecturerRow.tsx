import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { formatNumber } from "@/lib/formatNumber";
import type { LecturerListItem } from "../server/listings";
import { ScholarAvatar } from "./ScholarAvatar";

/**
 * One scholar as a row.
 *
 * The list exists because this page is a directory of 300+ people and the task
 * is usually to find one. A grid has to truncate: at three columns on a phone
 * "Prof. Ibrahim Danjuma" and "Prof. Ibrahim Adewale" both render as "Prof.
 * Ibrahim…", which is not a distinction. A row gives the name the full width.
 */
export function LecturerRow({ lecturer }: { lecturer: LecturerListItem }) {
  const raw = lecturer.raw as Record<string, unknown>;
  const state = typeof raw.state === "string" ? raw.state.trim() : "";
  const language = typeof raw.language === "string" ? raw.language.trim() : "";
  const views = Number(raw.views ?? 0);

  // Location and language say something about whether this is the scholar you
  // are looking for; a play count says how much there is to listen to.
  const meta = [
    state || null,
    language && language !== "Unknown" ? language : null,
    views > 0 ? `${formatNumber(views)} plays` : null,
  ].filter(Boolean);

  return (
    <Link
      href={ROUTES.resourcePerson(lecturer.id)}
      className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-hover sm:gap-4"
    >
      <ScholarAvatar
        name={lecturer.name}
        image={lecturer.card}
        sizeClass="aspect-[5/3] w-24 sm:w-28"
        textClass="text-base"
        sizes="120px"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground group-hover:text-dncolor-500 sm:text-base">
          {lecturer.name}
        </p>
        {meta.length > 0 && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {meta.join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
