import type { Metadata } from "next";
import { getLecturers, getStates } from "@/features/dawahcast/server/listings";
import { LecturerBrowser } from "@/features/dawahcast/components/LecturerBrowser";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Lecturers - Get islamic resources on Dawah Nigeria",
  description: "Browse Islamic scholars and lecturers on DawahCast.",
  alternates: { canonical: ROUTES.lecturers },
};

export default async function LecturersPage() {
  // Independent loads — run them together rather than in series.
  const [lecturers, states] = await Promise.all([getLecturers(1), getStates()]);

  return (
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="sr-only">Lecturers</h1>
      <LecturerBrowser initialLecturers={lecturers} states={states} />
    </div>
  );
}
