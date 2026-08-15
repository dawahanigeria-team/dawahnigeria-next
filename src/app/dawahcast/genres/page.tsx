import { redirect } from "next/navigation";

/** "Genres" is the CRA's legacy alias for Categories. */
export default function GenresPage() {
  redirect("/dawahcast/categories");
}
