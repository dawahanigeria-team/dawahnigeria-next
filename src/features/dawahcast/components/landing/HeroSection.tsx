import { getSliderImages } from "../../server/landing";
import { HeroCarousel } from "../HeroCarousel";

export async function HeroSection() {
  const slides = await getSliderImages();
  if (!slides?.length) return null;
  return <HeroCarousel slides={slides} />;
}
