import type { Metadata } from "next";
import { getLanguages } from "@/features/dawahcast/server/languages";
import { LanguageSelect } from "@/features/auth/LanguageSelect";

export const metadata: Metadata = {
  title: "Select language | Dawah Nigeria",
  description: "Choose your preferred language for Dawah Nigeria.",
  robots: { index: false },
};

export default async function SelectLanguagePage() {
  const languages = await getLanguages();

  // Heading lives inside the component so it can reflect whether a social
  // signup is mid-flight.
  return <LanguageSelect languages={languages} />;
}
