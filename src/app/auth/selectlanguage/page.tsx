import type { Metadata } from "next";
import { connection } from "next/server";
import { getLanguages } from "@/features/dawahcast/server/languages";
import { LanguageSelect } from "@/features/auth/LanguageSelect";

export const metadata: Metadata = {
  title: "Select language | Dawah Nigeria",
  description: "Choose your preferred language for Dawah Nigeria.",
  robots: { index: false },
};

export default async function SelectLanguagePage() {
  // Opt out of build-time prerendering only. The language list comes from the
  // upstream PHP API, and a build container that cannot reach
  // api.dawahnigeria.com must not be able to fail the deploy.
  await connection();
  const languages = await getLanguages();

  // Heading lives inside the component so it can reflect whether a social
  // signup is mid-flight.
  return <LanguageSelect languages={languages} />;
}
