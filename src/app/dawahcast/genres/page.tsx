import { permanentRedirect } from "next/navigation";

/** "Genres" is the CRA's legacy alias for Categories. */
export default function GenresPage() {
  permanentRedirect("/dawahcast/categories");
}
