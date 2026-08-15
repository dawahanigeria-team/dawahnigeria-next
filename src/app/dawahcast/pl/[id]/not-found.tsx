import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function PlaylistNotFound() {
  return (
    <div className="mx-auto max-w-screen-md px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Playlist not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This playlist is private or no longer exists.
      </p>
      <Link
        href={ROUTES.playlists}
        className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Browse playlists
      </Link>
    </div>
  );
}
