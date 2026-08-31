import type { Metadata } from "next";
import { getLecturers, getStates } from "@/features/dawahcast/server/listings";
import { LecturerBrowser } from "@/features/dawahcast/components/LecturerBrowser";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";
import { CollectionJsonLd } from "@/lib/CollectionJsonLd";

export const metadata: Metadata = {
  title: "Islamic Lecturers & Scholars",
  description: "Browse Islamic scholars and lecturers on DawahCast.",
  alternates: { canonical: ROUTES.lecturers },
};

export default async function LecturersPage() {
  // Independent loads — run them together rather than in series.
  const [lecturerPage, states] = await Promise.all([getLecturers(1), getStates()]);
  const lecturers = lecturerPage.items;

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Lecturers</h1>
      <CollectionJsonLd
        name="Islamic Lecturers and Scholars"
        description="Islamic scholars and lecturers with recordings on DawahCast."
        path={ROUTES.lecturers}
        items={lecturers.map((lecturer) => ({
          name: lecturer.name,
          path: ROUTES.resourcePerson(lecturer.id),
          image: lecturer.image,
        }))}
      />
      <PageHeaderRouter title="Lecturer" />
      <LecturerBrowser
        initialLecturers={lecturers}
        initialTotal={lecturerPage.total}
        states={states}
      />
    </div>
  );
}
