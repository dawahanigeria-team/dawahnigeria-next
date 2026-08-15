"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { Language } from "@/features/dawahcast/server/languages";
import { googleLoginAction } from "./actions";
import { AuthHeading, AuthSubmitButton } from "./AuthFields";

const STORAGE_KEY = "dn:langid";
const SOCIAL_KEY = "dn_social_signup";

type SocialPayload = { accessToken: string; email: string; name: string };

function readSocialPayload(): SocialPayload | null {
  try {
    const raw = sessionStorage.getItem(SOCIAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SocialPayload;
    return parsed.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

// Read through useSyncExternalStore so the first client render reflects
// sessionStorage without a setState-in-effect to correct it afterwards.
const subscribeNever = () => () => {};
const hasPendingSocial = () => readSocialPayload() !== null;
const noPendingOnServer = () => false;

/**
 * Language picker shown after a Google *signup*.
 *
 * CRA sends new social users here to choose a content language before the
 * account is created, carrying the OAuth payload in router state. Here it rides
 * in sessionStorage instead, so the access token never lands in the URL, in
 * history, or in a referrer header.
 *
 * Reached without a pending social signup (e.g. opened directly), it degrades
 * to storing the choice as a local preference.
 */
export function LanguageSelect({ languages }: { languages: Language[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSocialSignup = useSyncExternalStore(
    subscribeNever,
    hasPendingSocial,
    noPendingOnServer,
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected === null) return;

    const payload = readSocialPayload();
    if (!payload) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(selected));
      } catch {
        /* storage unavailable — proceed anyway */
      }
      router.push("/dawahcast");
      return;
    }

    setPending(true);
    setError(null);
    const result = await googleLoginAction({ ...payload, languageId: selected });
    // Clear the token whatever the outcome — it is single-use and short-lived.
    sessionStorage.removeItem(SOCIAL_KEY);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
    // On success the action redirects and never returns.
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col">
      <AuthHeading
        title="Choose your language"
        subtitle={
          isSocialSignup
            ? "We'll tailor your feed to the language you listen in"
            : "Pick the language you'd like your feed in"
        }
      />

      <ul className="mb-6 flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
        {languages.map((lang) => {
          const isActive = selected === lang.id;
          return (
            <li key={lang.id}>
              <button
                type="button"
                onClick={() => setSelected(lang.id)}
                aria-pressed={isActive}
                className={[
                  "w-full rounded-xl border px-4 py-3 text-left text-[15px] transition-colors",
                  isActive
                    ? "border-[#d6ff00] bg-[#d6ff00]/10 font-semibold text-foreground"
                    : "border-white/15 text-foreground hover:bg-white/5",
                ].join(" ")}
              >
                {lang.name}
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <AuthSubmitButton
        pending={pending}
        disabled={selected === null}
        pendingLabel="Finishing…"
      >
        Continue
      </AuthSubmitButton>
    </form>
  );
}
