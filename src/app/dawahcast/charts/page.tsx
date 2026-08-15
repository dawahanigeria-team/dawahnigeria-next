import type { Metadata } from "next";
import {
  getChartLectures,
  getChartAlbums,
  getChartRps,
  getChartPlaylists,
  type ChartPeriod,
} from "@/features/dawahcast/server/charts";
import { ChartRow } from "@/features/dawahcast/components/charts/ChartRow";
import type { ChartKind } from "@/features/dawahcast/server/charts";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Charts - Get islamic resources on Dawah Nigeria",
  description: "Top lectures, albums, lecturers, and playlists on Dawah Nigeria.",
  alternates: { canonical: ROUTES.charts },
};

// Charts read fresh ranking data each request.
export const revalidate = 1800;

type Section = {
  heading: string;
  kind: ChartKind;
  load: (action: ChartPeriod) => ReturnType<typeof getChartLectures>;
  action: ChartPeriod;
};

// Order mirrors the CRA Charts page.
const SECTIONS: Section[] = [
  { heading: "Top Daily Lectures", kind: "lectures", load: getChartLectures, action: "daily" },
  { heading: "Top Weekly Lectures", kind: "lectures", load: getChartLectures, action: "weekly" },
  { heading: "Top Monthly Lectures", kind: "lectures", load: getChartLectures, action: "monthly" },
  { heading: "Top Daily Albums", kind: "album", load: getChartAlbums, action: "daily" },
  { heading: "Top Weekly Albums", kind: "album", load: getChartAlbums, action: "weekly" },
  { heading: "Top Monthly Albums", kind: "album", load: getChartAlbums, action: "monthly" },
  { heading: "Top Daily Lecturers", kind: "lecturer", load: getChartRps, action: "daily" },
  { heading: "Top Weekly Lecturers", kind: "lecturer", load: getChartRps, action: "weekly" },
  { heading: "Top Monthly Lecturers", kind: "lecturer", load: getChartRps, action: "monthly" },
  { heading: "Top Daily Playlists", kind: "playlist", load: getChartPlaylists, action: "daily" },
  { heading: "Top Weekly Playlists", kind: "playlist", load: getChartPlaylists, action: "weekly" },
  { heading: "Top Monthly Playlists", kind: "playlist", load: getChartPlaylists, action: "monthly" },
];

export default async function ChartsPage() {
  const results = await Promise.all(
    SECTIONS.map((s) => s.load(s.action).catch(() => [])),
  );

  return (
    // NOTE: the live charts page renders nothing at all — no sections, no rows.
    // There is no live design to match here, so this keeps the working
    // implementation, laid out with the shell's standard page padding.
    <div className="flex w-full flex-col px-[3%] pb-16 pt-8">
      <h1 className="text-2xl font-semibold text-foreground">Charts</h1>
      <p className="mt-1 text-sm text-color">
        The most popular content on Dawah Nigeria.
      </p>
      <div className="mt-4">
        {SECTIONS.map((s, i) => (
          <ChartRow
            key={s.heading}
            heading={s.heading}
            kind={s.kind}
            items={results[i]}
          />
        ))}
      </div>
    </div>
  );
}
