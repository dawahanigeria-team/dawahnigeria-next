import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/features/auth/SignupForm";
import { getSession } from "@/features/auth/session";
import { getLanguages } from "@/features/dawahcast/server/languages";

export const metadata: Metadata = {
  title: "Sign up on Dawah Nigeria | Home of Islamic resources",
  description: "Join DawahCast.",
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/dawahcast");

  // The heading lives inside the form so it can share the fade-in sequence.
  const languages = await getLanguages();

  return <SignupForm languages={languages} />;
}
