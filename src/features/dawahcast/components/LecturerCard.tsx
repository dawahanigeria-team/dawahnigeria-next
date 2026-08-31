import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import type { LecturerListItem } from "../server/listings";
import { ScholarAvatar } from "./ScholarAvatar";

export function LecturerCard({ lecturer }: { lecturer: LecturerListItem }) {
  return (
    <Link
      href={ROUTES.resourcePerson(lecturer.id)}
      className="group flex flex-col items-center gap-2 text-center"
    >
      <ScholarAvatar
        name={lecturer.name}
        sizeClass="h-24 w-24 sm:h-32 sm:w-32"
        textClass="text-2xl sm:text-3xl"
        className="transition-transform group-hover:scale-105"
      />
      <p className="line-clamp-2 text-sm font-medium text-foreground">
        {lecturer.name}
      </p>
    </Link>
  );
}
