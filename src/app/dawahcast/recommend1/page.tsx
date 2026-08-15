import type { Metadata } from "next";
import { ComingSoon } from "@/features/dawahcast/components/ComingSoon";

export const metadata: Metadata = {
  title: "Buzz is coming soon on Dawah Nigeria",
};

export default function BuzzPage() {
  return (
    <div className="px-4 py-4 sm:py-6">
      <ComingSoon tall />
    </div>
  );
}
