import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/LoginForm";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your DawahCast account.",
  // An account form has nothing to rank for, and indexing it competes with the
  // real content for crawl budget.
  robots: { index: false },
};

// Server Actions write cookies; the page itself must be dynamic so the
// post-login redirect target sees the fresh session.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  const { next } = await searchParams;
  if (session) redirect(next && next.startsWith("/") ? next : "/dawahcast");

  // The heading lives inside the form so it shares the fade-in sequence.
  return <LoginForm next={next} />;
}
