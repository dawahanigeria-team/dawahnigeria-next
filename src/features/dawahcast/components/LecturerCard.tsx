import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import type { LecturerListItem } from "../server/listings";

export function LecturerCard({ lecturer }: { lecturer: LecturerListItem }) {
  return (
    <Link
      href={ROUTES.resourcePerson(lecturer.id)}
      className="group flex flex-col items-center gap-2 text-center"
    >
      <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted transition-transform group-hover:scale-105 sm:h-32 sm:w-32">
        {lecturer.image ? (
          <Image
            src={lecturer.image}
            alt={lecturer.name}
            fill
            sizes="(min-width: 640px) 128px, 96px"
            className="object-cover"
          />
        ) : null}
      </div>
      <p className="line-clamp-2 text-sm font-medium text-foreground">
        {lecturer.name}
      </p>
    </Link>
  );
}
