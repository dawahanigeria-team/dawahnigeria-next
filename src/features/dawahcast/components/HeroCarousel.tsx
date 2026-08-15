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
    <div className="hero-frame group">
      {slides.map((src, i) => (
        <div key={src} data-state={stateFor(i, index, total)} className="hero-slide">
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

      {/* 4px dots, as CRA draws them. */}
      <div className="absolute inset-x-0 bottom-7 z-[12] flex items-center justify-center space-x-1">
        {slides.map((url, i) => (
          <button
            key={url}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-[4px] w-[4px] rounded-full ${
              i === index ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
