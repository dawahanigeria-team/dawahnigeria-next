import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordFlow } from "@/features/auth/ForgotPasswordFlow";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your DawahCast password.",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) redirect("/dawahcast");

  // Headings live inside the flow — they change between the request and reset
  // steps and share the form's fade-in.
  return <ForgotPasswordFlow />;
}
