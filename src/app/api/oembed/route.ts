import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getLecture, getAlbum } from "@/features/dawahcast/server/audioDetail";
import { getPlaylist } from "@/features/dawahcast/server/playlist";
import { getLecturerById } from "@/features/dawahcast/server/listings";
import { socialImageUrl, OG_FALLBACK_IMAGE } from "@/lib/socialMeta";

/**
 * oEmbed provider endpoint.
 *
 * Spotify and Apple Podcasts both expose one, and it is what turns a pasted
 * link into a titled card with artwork on Slack, Discord, WordPress, Reddit and
 * anything else that speaks oEmbed rather than reading Open Graph. For an
 * audience that shares lectures through chat apps this is the cheapest reach
 * DawahCast is not already getting.
 *
 * Only public catalogue URLs on this origin resolve — anything else 404s, so the
 * route can't be used to probe private pages or to have the site vouch for a
 * third-party URL.
 */

type Resolved = { title: string; image?: string; author?: string };

async function resolve(pathname: string): Promise<Resolved | null> {
  const lecture = /^\/dawahcast\/l\/([^/]+)$/.exec(pathname);
  if (lecture) {
    const item = await getLecture(lecture[1]).catch(() => null);
    return item && { title: item.title, image: item.image, author: item.lecturer };
  }

  const album = /^\/dawahcast\/a\/([^/]+)$/.exec(pathname);
  if (album) {
    const item = await getAlbum(album[1]).catch(() => null);
    return item && { title: item.title, image: item.image, author: item.lecturer };
  }

  const playlist = /^\/dawahcast\/pl\/([^/]+)$/.exec(pathname);
  if (playlist) {
    const item = await getPlaylist(playlist[1]).catch(() => null);
    return item && { title: item.title, image: item.image, author: item.owner };
  }

  const lecturer = /^\/dawahcast\/rp\/([^/]+)$/.exec(pathname);
  if (lecturer) {
    // Returns a list even for a single id — the endpoint is the multi-nid one.
    const [item] = (await getLecturerById(lecturer[1]).catch(() => [])) ?? [];
    return item ? { title: item.name, image: item.image } : null;
  }

  return null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const target = params.get("url");
  const format = params.get("format") ?? "json";

  if (!target) {
    return NextResponse.json({ error: "Missing `url` parameter" }, { status: 400 });
  }
  // The spec allows providers to answer only for their own URLs, and XML is
  // optional — declining it is preferable to emitting a second serialisation
  // that nothing here consumes.
  if (format !== "json") {
    return NextResponse.json({ error: "Only format=json is supported" }, { status: 501 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Malformed `url` parameter" }, { status: 400 });
  }

  const site = new URL(env.siteUrl);
  if (parsed.hostname !== site.hostname) {
    return NextResponse.json({ error: "Unsupported URL" }, { status: 404 });
  }

  const item = await resolve(parsed.pathname.replace(/\/+$/, ""));
  if (!item) {
    return NextResponse.json({ error: "Unsupported URL" }, { status: 404 });
  }

  const canonical = `${env.siteUrl}${parsed.pathname}`;
  const thumbnail = socialImageUrl(item.image) || OG_FALLBACK_IMAGE;

  return NextResponse.json(
    {
      version: "1.0",
      type: "link",
      provider_name: "DawahCast",
      provider_url: env.siteUrl,
      title: item.title,
      author_name: item.author,
      url: canonical,
      // `thumbnail_width`/`thumbnail_height` are deliberately omitted. The spec
      // treats them as the image's real dimensions, and catalogue artwork is
      // 250x200 (see `socialImageUrl`) — not the 1200x630 of the branded
      // fallback. Publishing one pair for both would have consumers letterbox or
      // stretch whichever guess was wrong, and omitting them just makes the
      // consumer measure the image itself.
      thumbnail_url: thumbnail.startsWith("http")
        ? thumbnail
        : `${env.siteUrl}${thumbnail}`,
    },
    {
      headers: {
        // Consumers cache aggressively anyway; say so explicitly rather than
        // inheriting the app's no-store default.
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
