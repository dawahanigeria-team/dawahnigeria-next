import type { Metadata } from "next";
import { ComingSoon } from "@/features/dawahcast/components/ComingSoon";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";

export const metadata: Metadata = {
  title: "Buzz is coming soon on Dawah Nigeria",
  // Placeholder page with no content yet — thin content hurts the whole site if
  // indexed. Drop this once Buzz actually ships.
  robots: { index: false },
};

export default function BuzzPage() {
  return (
    <div className="px-4 py-4 sm:py-6">
      <PageHeaderRouter title="Buzz" />
      <ComingSoon tall />
    </div>
  );
}
