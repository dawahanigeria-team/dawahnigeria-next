"use client";

import { useRouter } from "next/navigation";
import { FaLightbulb } from "react-icons/fa";

/**
 * Mirrors the CRA "Coming soon" placeholder used by Buzz/Podcast (recommend1/2).
 * The Go Back button steps back in history, falling back to the home feed.
 */
export function ComingSoon({ tall = false }: { tall?: boolean }) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dawahcast");
    }
  };

  return (
    <div className={`relative w-full ${tall ? "h-[100vw] mobile-up:h-[70vw]" : "h-[80vh] mobile-up:h-[70vh]"}`}>
      <div className="absolute inset-0 m-auto flex h-fit w-[80%] flex-col items-center justify-center space-y-6 rounded-md bg-background py-6 text-foreground shadow-lg mobile-up:w-[350px]">
        <div className="text-2xl mobile-up:text-3xl">Coming soon</div>
        <FaLightbulb className="text-4xl text-[#ddff2b] mobile-up:text-5xl" />
        <button
          onClick={goBack}
          className="transform rounded-md border border-foreground p-2 text-sm text-foreground transition-colors ease-in-out hover:bg-gray-200 hover:text-zinc-700"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
