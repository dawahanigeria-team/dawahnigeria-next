type Props = {
  youtubeId: string;
  title: string;
};

/**
 * Privacy-enhanced iframe embed. Renders only when youtubeId is known —
 * no script loads, no client component needed.
 */
export function YouTubeEmbed({ youtubeId, title }: Props) {
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0`;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
