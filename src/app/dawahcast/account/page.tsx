import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { getProfile } from "@/features/account/server";
import {
  ProfileForm,
  ChangePasswordForm,
  DeleteAccountForm,
} from "@/features/account/AccountForms";
import { ROUTES } from "@/lib/routes";
import { PageHeaderRouter } from "@/features/dawahcast/components/PageHeaderRouter";
import { ListeningPreferencesForm } from "@/features/account/ListeningPreferencesForm";
import { getListeningPreferences } from "@/features/preferences/server";
import { getLanguages } from "@/features/dawahcast/server/languages";
import { getPreferenceLecturers } from "@/features/dawahcast/server/listings";

export const metadata: Metadata = {
  title: "Account settings",
  description: "Manage your DawahCast account.",
  alternates: { canonical: ROUTES.account },
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(ROUTES.account)}`);
  }

  // Best-effort: if the profile fetch fails we fall back to whatever the
  // session cookie carries, so the page still renders something useful.
  const [profileResult, preferences, languages, lecturers] = await Promise.all([
    getProfile(session.user.id),
    getListeningPreferences(),
    getLanguages(),
    getPreferenceLecturers(),
  ]);
  const profile = profileResult ?? {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    name: session.user.name,
    raw: {},
  };

  return (
    <div className="mx-auto max-w-screen-md px-4 py-4 sm:py-6">
      <PageHeaderRouter title="Account" />
      <h1 className="text-2xl font-semibold text-foreground">Account settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your profile and listening experience.
      </p>

      <section aria-labelledby="profile-heading" className="mt-8">
        <h2 id="profile-heading" className="mb-3 text-base font-semibold text-foreground">
          Profile
        </h2>
        <ProfileForm profile={profile} />
      </section>

      <section
        aria-labelledby="listening-heading"
        className="mt-10 border-t border-border pt-6"
      >
        <h2 id="listening-heading" className="mb-1 text-base font-semibold text-foreground">
          Listening preferences
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose what appears in your Home recommendations. Search and the full library stay open.
        </p>
        <ListeningPreferencesForm
          initialPreferences={preferences}
          languages={languages}
          lecturers={lecturers}
        />
      </section>

      <section
        aria-labelledby="password-heading"
        className="mt-10 border-t border-border pt-6"
      >
        <h2 id="password-heading" className="mb-3 text-base font-semibold text-foreground">
          Password
        </h2>
        <ChangePasswordForm />
      </section>

      <section
        aria-labelledby="danger-heading"
        className="mt-10 border-t border-border pt-6"
      >
        <h2 id="danger-heading" className="mb-3 text-base font-semibold text-destructive">
          Danger zone
        </h2>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
