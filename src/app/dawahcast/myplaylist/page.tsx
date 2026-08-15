import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/**
 * In the CRA, "My Playlist" listed the user's created playlists with an inline
 * track view. The next-app consolidates that into the Library page (playlists
 * grid → playlist detail), so the legacy route redirects there.
 */
export default function MyPlaylistPage() {
  redirect(ROUTES.library);
}
