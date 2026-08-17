"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import type { SliderImage } from "../server/landing";

const ROTATE_MS = 5000;

type SlideState = "active" | "preactive" | "third" | "hidden";

/**
 * Position of a slide relative to the current one, which drives its layer in
 * the desktop deck (see `.hero-slide` in globals.css). Mirrors CRA's
 * `currentIndex % n === i` / `(currentIndex + 1) % n === i` / `+ 2` checks.
 */
function stateFor(i: number, index: number, total: number): SlideState {
  const offset = (i - index + total) % total;
  if (offset === 0) return "active";
  if (offset === 1) return "preactive";
  if (offset === 2) return "third";
  return "hidden";
}

/**
 * Home hero carousel. CRA renders two different components either side of
 * 615px; both are reproduced here through `data-state` on stacked slides, with
 * the layout switch living in CSS so the images are only requested once.
 *
 * Desktop also gets the prev/next arrows CRA reveals on hover — black at 70%
 * opacity, 60×30, hugging the frame edges.
 */
export function HeroCarousel({ slides }: { slides: SliderImage[] }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [total]);

  if (!total) return null;

  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  return (
    // The slides arrive as bare URLs with no captions, so there is no honest
    // per-image alt text to write — inventing one would be worse than none.
    // Naming the region instead is what gives a screen-reader user something:
    // they learn a featured carousel is here and that the dots below control it,
    // rather than walking past a run of unlabelled images.
    <div
      className="hero-frame group"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured lectures"
    >
      {slides.map((src, i) => (
        <div
          key={src}
          data-state={stateFor(i, index, total)}
          className="hero-slide"
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${total}`}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 615px) 73vw, 100vw"
            className="object-cover"
            // Only the first slide is above the fold on load.
            priority={i === 0}
          />
        </div>
      ))}

      {/* Hover arrows, desktop only — CRA hides them under 615px. */}
      {total > 1 && (
        <div className="absolute inset-x-0 top-1/2 z-[30] m-auto hidden -translate-y-1/2 items-center justify-between mobile-up:group-hover:flex">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="flex h-[60px] w-[30px] items-center justify-center bg-black/70 text-white"
          >
            <MdNavigateBefore className="text-[40px]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="flex h-[60px] w-[30px] items-center justify-center bg-black/70 text-white"
          >
            <MdNavigateNext className="text-[40px]" aria-hidden />
          </button>
        </div>
      )}

      {/* 4px dots, as CRA draws them — but a 4x4 button is unhittable on a
          phone, so each gets a ::before overlay as its real target.

          The overlay grows *vertically* (44px) and only to the 8px pitch
          horizontally. There are up to 20 slides: at ~412px of viewport a 24px
          square target per dot needs 480px, so widening either overlaps
          neighbours — making the wrong slide easy to select — or, as an earlier
          attempt did, overflows the row and lets flex shrink every dot to zero
          width, hiding them outright. 8px wide tiles the row exactly, with no
          overlap, while the 44px height does the real work for a thumb.

          `shrink-0` is what guarantees the dots keep their 4px even if the slide
          count grows again. */}
      <div className="absolute inset-x-0 bottom-7 z-[12] flex items-center justify-center space-x-1">
        {slides.map((url, i) => (
          <button
            key={url}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`relative h-[4px] w-[4px] shrink-0 rounded-full before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-2 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] ${
              i === index ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
