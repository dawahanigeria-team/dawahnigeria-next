import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Terms of Service | Dawah Nigeria",
  description:
    "The terms that govern your use of Dawah Nigeria (DN) on dawahnigeria.com, including accounts, acceptable use, content, and subscriptions.",
  alternates: { canonical: ROUTES.terms },
};

export default function TermsPage() {
  return (
    <div className="w-full px-6 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            DN Terms
          </p>
          <h1 className="text-3xl font-semibold text-foreground mobile-up:text-4xl">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: August 9, 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Agreement to these terms</h2>
          <p className="text-muted-foreground">
            Dawahnigeria.com, shortened to DN, is &quot;an online platform for the
            Ummah, providing rich Islamic content, the Nigerian way&quot;. These
            Terms of Service (the &quot;Terms&quot;) govern your use of our website,
            apps, and related services (together, the &quot;Services&quot;).
          </p>
          <p className="text-muted-foreground">
            By accessing or using the Services, you agree to these Terms. If you
            do not agree, please do not use the Services. Your use of the
            Services is also governed by our{" "}
            <Link
              href={ROUTES.privacy}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Eligibility and accounts
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              The Services are not directed at children under 13. If you are
              under the age of majority in your country, you may only use the
              Services with the involvement of a parent or guardian.
            </li>
            <li>
              Some features require an account. You agree to provide accurate
              information and to keep it up to date.
            </li>
            <li>
              You are responsible for keeping your login credentials
              confidential and for all activity that happens under your account.
            </li>
            <li>
              Please tell us at admin@dawahnigeria.com if you believe your
              account has been used without your permission.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Acceptable use</h2>
          <p className="text-muted-foreground">
            DN serves a community of learners and seekers of knowledge. When
            using the Services, you agree not to:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              Break any applicable law, or infringe the rights of anyone else.
            </li>
            <li>
              Copy, download in bulk, scrape, redistribute, resell, or
              rebroadcast content from the Services without our written
              permission.
            </li>
            <li>
              Circumvent, disable, or interfere with security, access controls,
              or usage limits, including any measure that protects paid content.
            </li>
            <li>
              Upload or transmit malware, or attempt to disrupt or overload our
              systems.
            </li>
            <li>
              Post or share content that is unlawful, abusive, defamatory,
              obscene, or that misrepresents Islamic teaching in a way intended
              to mislead.
            </li>
            <li>
              Use the Services to impersonate DN, a lecturer, or any other
              person or organisation.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Content and intellectual property
          </h2>
          <p className="text-muted-foreground">
            Lectures, recitations, videos, artwork, text, and software made
            available through the Services are owned by DN or by the lecturers,
            reciters, and other rights holders we work with, and are protected
            by copyright and other laws.
          </p>
          <p className="text-muted-foreground">
            Subject to these Terms, we grant you a personal, non-exclusive,
            non-transferable, revocable licence to access and enjoy the content
            for your own non-commercial use. No other rights are granted.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Content you submit
          </h2>
          <p className="text-muted-foreground">
            Some features let you contribute content, such as playlists,
            comments, or feedback. You keep ownership of what you submit, and
            you confirm you have the right to submit it. You grant DN a
            worldwide, royalty-free licence to host, store, display, and
            distribute that content in order to operate and improve the
            Services.
          </p>
          <p className="text-muted-foreground">
            We may remove content that breaches these Terms or that we are
            required to remove.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Copyright complaints
          </h2>
          <p className="text-muted-foreground">
            If you believe content on the Services infringes your copyright,
            email admin@dawahnigeria.com with a description of the work, a link
            to the material in question, and your contact details. We will
            review and take appropriate action, which may include removing the
            material.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Subscriptions and payments
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              Parts of the Services are free, and parts require a paid
              subscription. The price, billing period, and what is included are
              shown before you pay.
            </li>
            <li>
              Payments are processed by third-party payment providers. We do not
              store your full card details, and your payment is also subject to
              the provider&apos;s own terms.
            </li>
            <li>
              Unless stated otherwise at checkout, subscriptions run for the
              period you paid for and access ends when that period expires.
            </li>
            <li>
              Except where refunds are required by law, payments are
              non-refundable once the subscription period has started. If a
              payment fails or a charge looks wrong, contact
              admin@dawahnigeria.com and we will look into it.
            </li>
            <li>
              We may change prices. Changes apply to future billing periods, not
              to a period you have already paid for.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Third-party services and links
          </h2>
          <p className="text-muted-foreground">
            The Services may link to or rely on third-party websites, payment
            providers, and platforms. We are not responsible for their content
            or practices, and your use of them is governed by their own terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Availability of the Services
          </h2>
          <p className="text-muted-foreground">
            We work to keep the Services available, but we do not guarantee that
            they will be uninterrupted or error-free. We may add, change, or
            withdraw features, and content may be removed at the request of
            rights holders. The Services are provided &quot;as is&quot; and
            &quot;as available&quot;, without warranties of any kind to the
            extent permitted by law.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Limitation of liability
          </h2>
          <p className="text-muted-foreground">
            To the fullest extent permitted by law, DN will not be liable for
            indirect, incidental, or consequential losses, or for loss of data,
            revenue, or goodwill arising from your use of the Services. Nothing
            in these Terms excludes liability that cannot be excluded by law.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Suspension and termination
          </h2>
          <p className="text-muted-foreground">
            You may stop using the Services at any time and ask us to close your
            account. We may suspend or terminate access if you breach these
            Terms, or where we need to protect the Services or our community.
            Sections that by their nature should survive termination, such as
            intellectual property and limitation of liability, will continue to
            apply.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Governing law</h2>
          <p className="text-muted-foreground">
            These Terms are governed by the laws of the Federal Republic of
            Nigeria, and the courts of Nigeria will have jurisdiction over any
            dispute, without affecting any mandatory consumer rights you have
            where you live.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Changes</h2>
          <p className="text-muted-foreground">
            We may update these Terms from time to time. The &quot;Last
            updated&quot; date above indicates when they were most recently
            revised. Continuing to use the Services after an update means you
            accept the revised Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="text-muted-foreground">
            If you have questions about these Terms, please email
            admin@dawahnigeria.com.
          </p>
        </section>
      </div>
    </div>
  );
}
