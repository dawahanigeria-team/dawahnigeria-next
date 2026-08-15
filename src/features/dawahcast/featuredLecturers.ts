/**
 * Featured lecturers for the top chip row, copied verbatim from CRA's
 * `pages/lecturers/data.jsx`.
 *
 * Hardcoded there and here: these are an editorial pick, not an API response,
 * so the ids must stay in step with the live site rather than be re-derived.
 * `id: null` is the "All" sentinel — no filter.
 */
export type FeaturedLecturer = { id: number | null; name: string };

export const FEATURED_LECTURERS: FeaturedLecturer[] = [
  { id: null, name: "All" },
  { id: 10, name: "Prof. Abdur-Razzaaq Abdul Majeed Alaro (Ilorin)" },
  { id: 11, name: "Dr Muhammad Ahmad Ibrahim BUK (Kano)" },
  { id: 54, name: "Ustadh Isa Christian Okonkwo (Enugu)" },
  { id: 5, name: "Shaykh Rasheed Buwayb (Iwo)" },
  { id: 12, name: "Dr Aliyu Bashir Umar (Kano)" },
];

/** Prepended to the API's state list; CRA uses "" to mean "no state filter". */
export const ALL_STATES = "";
