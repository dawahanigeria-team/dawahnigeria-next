import type { Metadata } from "next";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Privacy Policy | Dawah Nigeria",
  description:
    "Read how Dawah Nigeria (DN) collects, uses, and protects information on dawahnigeria.com.",
  alternates: { canonical: ROUTES.privacy },
};

export default function PrivacyPage() {
  return (
    <div className="w-full px-6 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            DN Privacy
          </p>
          <h1 className="text-3xl font-semibold text-foreground mobile-up:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: January 20, 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Who we are</h2>
          <p className="text-muted-foreground">
            Dawahnigeria.com, shortened to DN, is &quot;an online platform for the
            Ummah, providing rich Islamic content, the Nigerian way&quot;. It was
            launched in 2009 and has grown steadily since then to become
            Nigeria&apos;s biggest online Islamic project (alhamdulillaah!).
          </p>
          <p className="text-muted-foreground">
            This Privacy Policy explains how we collect, use, and protect
            information when you use our website, apps, and related services
            (together, the &quot;Services&quot;).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Information we collect
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              Information you provide, such as name, email address, login
              credentials, and profile preferences.
            </li>
            <li>
              Activity data, including searches, playlists, favorites,
              listening or viewing history, and interactions with content.
            </li>
            <li>
              Communications you send to us, such as feedback or support
              requests.
            </li>
            <li>
              Device and log data, including IP address, browser type,
              operating system, device identifiers, and approximate location
              derived from IP address.
            </li>
            <li>
              Cookies and similar technologies used to remember preferences
              and analyze usage.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            How we use information
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Provide, maintain, and improve the Services.</li>
            <li>Personalize content and recommendations.</li>
            <li>Communicate with you about updates or support.</li>
            <li>Monitor usage trends, performance, and security.</li>
            <li>Comply with legal obligations and protect our community.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            How we share information
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              With service providers that help us operate the Services (such
              as hosting, analytics, and customer support).
            </li>
            <li>
              When required by law or to protect the rights, safety, and
              security of DN and its users.
            </li>
            <li>
              In connection with a merger, acquisition, or asset transfer (we
              will notify users if required).
            </li>
            <li>With your consent or at your direction.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Cookies and analytics
          </h2>
          <p className="text-muted-foreground">
            We use cookies and similar technologies to keep you signed in,
            remember preferences, and understand how our Services are used. You
            can control cookies through your browser settings, but disabling
            some cookies may affect functionality.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Data retention</h2>
          <p className="text-muted-foreground">
            We keep personal information for as long as needed to provide the
            Services, comply with legal obligations, resolve disputes, and
            enforce our agreements.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Your choices and rights
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              You can update your account information and preferences in your
              profile.
            </li>
            <li>You may opt out of non-essential communications at any time.</li>
            <li>
              Depending on your location, you may have rights to access,
              correct, or delete your personal information.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            International transfers
          </h2>
          <p className="text-muted-foreground">
            Your information may be processed in countries where our service
            providers operate. We take steps to protect your information in
            accordance with this policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Children&apos;s privacy
          </h2>
          <p className="text-muted-foreground">
            Our Services are not directed at children under 13. If you believe
            a child has provided personal information, please contact us so we
            can take appropriate action.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Changes</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. The &quot;Last
            updated&quot; date above indicates when it was most recently revised.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy or your information,
            please email admin@dawahnigeria.com.
          </p>
        </section>
      </div>
    </div>
  );
}
