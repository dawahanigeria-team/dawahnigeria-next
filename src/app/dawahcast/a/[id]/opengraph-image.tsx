import { ImageResponse } from "next/og";
import { getAlbum } from "@/features/dawahcast/server/audioDetail";
import { socialImageUrl } from "@/lib/socialMeta";

/**
 * Composed 1200x630 share card for an album.
 *
 * The catalogue's own artwork is 250x200 at best, which every social platform
 * either drops or renders as a small square thumbnail. Painting it onto a
 * branded canvas of the right size gets a full-width card everywhere while
 * still showing the album's real image.
 *
 * Satori (what ImageResponse runs on) supports a flexbox subset of CSS only —
 * no grid, no floats — and every element with more than one child needs an
 * explicit `display: flex`.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Album on DawahCast";

const LIME = "#ddff2b";
const BG = "#050505";

export default async function Image({
  params,
}: {
  // Promise, as everywhere else in the App Router — awaiting it is what makes
  // the id available. Typed as a plain object it silently reads `undefined` and
  // every card falls back to the generic one.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getAlbum(id).catch(() => null);

  const title = album?.title ?? "DawahCast";
  const lecturer = album?.lecturer;
  const trackCount = album?.tracks?.length ?? 0;
  const art = socialImageUrl(album?.image);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BG,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          {art ? (
            // Upscaled deliberately: 250x200 art at 300x300 is soft but still
            // reads as the album's cover, which is the point of the card.
            <img
              src={art}
              alt=""
              width={300}
              height={300}
              style={{
                borderRadius: 24,
                objectFit: "cover",
                border: `1px solid rgba(255,255,255,0.12)`,
              }}
            />
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: art ? 700 : 1050,
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: LIME,
                letterSpacing: 3,
                marginBottom: 18,
              }}
            >
              ALBUM
            </div>
            <div
              style={{
                fontSize: 58,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.15,
                // Satori has no line-clamp; the slice keeps a long album name
                // from pushing the footer off the canvas.
                display: "flex",
              }}
            >
              {title.length > 70 ? `${title.slice(0, 70)}…` : title}
            </div>
            {lecturer ? (
              <div style={{ fontSize: 32, color: "#b5b5b5", marginTop: 20, display: "flex" }}>
                {lecturer.length > 60 ? `${lecturer.slice(0, 60)}…` : lecturer}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: LIME, display: "flex" }}>DN</div>
            <div style={{ fontSize: 26, color: "#ffffff", letterSpacing: 4, display: "flex" }}>
              DAWAHCAST
            </div>
          </div>
          {trackCount > 0 ? (
            <div style={{ fontSize: 26, color: "#9a9a9a", display: "flex" }}>
              {trackCount} {trackCount === 1 ? "lecture" : "lectures"}
            </div>
          ) : null}
        </div>
      </div>
    ),
    size,
  );
}
