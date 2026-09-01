import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import type { LecturerListItem } from "../server/listings";
import { ScholarAvatar } from "./ScholarAvatar";

export function LecturerCard({ lecturer }: { lecturer: LecturerListItem }) {
  return (
    <Link
      href={ROUTES.resourcePerson(lecturer.id)}
      className="group flex flex-col gap-2"
    >
      <ScholarAvatar
        name={lecturer.name}
        image={lecturer.card}
        // 1.67:1, the aspect the artwork was drawn and thumbnailed at.
        sizeClass="aspect-[5/3] w-full"
        textClass="text-2xl"
        className="transition-transform group-hover:scale-[1.03]"
        sizes="(min-width: 640px) 220px, 45vw"
      />
      <p className="line-clamp-2 text-sm font-medium text-foreground">
        {lecturer.name}
      </p>
    </Link>
  );
}
