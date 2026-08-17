import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes the site installable and gives Android's "Add to
 * home screen" a real name, icon and splash colour instead of a bookmark.
 *
 * Every comparable platform ships one (Audiomack and Apple Podcasts both serve
 * /manifest.json); DawahCast had none, so a returning listener on a phone had no
 * way to keep it on the home screen the way they keep the native app there.
 *
 * `start_url` points at the catalogue rather than `/`, which only redirects.
 * `display: standalone` is what removes the browser chrome — for an audio app
 * that mostly means the player keeps its full height.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DawahCast — Islamic lectures, recitations & podcasts",
    short_name: "DawahCast",
    description:
      "Discover Islamic lectures, Quranic recitations, podcasts and videos from scholars across Nigeria.",
    start_url: "/dawahcast",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Matches the dark shell the app actually paints, so the splash screen does
    // not flash white before the first frame.
    background_color: "#030303",
    theme_color: "#030303",
    categories: ["education", "music", "news"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        // Lets Android mask the icon to the launcher's shape instead of
        // dropping it inside a white rounded square.
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Trending", url: "/dawahcast/trending" },
      { name: "New releases", url: "/dawahcast/new" },
      { name: "Quran recitations", url: "/dawahcast/recitations" },
    ],
  };
}
