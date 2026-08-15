"use client";

import { useActionState, useState } from "react";
import { MdEmail, MdLock, MdPerson, MdCheck, MdLanguage } from "react-icons/md";
import { registerAction, type FormState } from "./actions";
import {
  AuthDivider,
  AuthField,
  AuthHeading,
  AuthSubmitButton,
} from "./AuthFields";
import { GoogleButton } from "./GoogleButton";
import type { Language } from "@/features/dawahcast/server/languages";

const initial: FormState = {};

export function SignupForm({ languages }: { languages: Language[] }) {
  const [state, formAction, isPending] = useActionState(registerAction, initial);
  const [terms, setTerms] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col" noValidate>
      <AuthHeading
        title="Create account"
        subtitle="Join the Dawah Nigeria community"
      />

      <AuthField
        id="username"
        name="username"
        placeholder="Username"
        icon={MdPerson}
        autoComplete="username"
        required
        error={state.fieldErrors?.username}
      />

      <AuthField
        id="email"
        name="email"
        type="email"
        placeholder="Email Address"
        icon={MdEmail}
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />

      <AuthField
        id="password"
        name="password"
        type="password"
        placeholder="Password"
        icon={MdLock}
        autoComplete="new-password"
        required
        minLength={6}
        error={state.fieldErrors?.password}
      />

      <AuthField
        id="confirm_password"
        name="confirm_password"
        type="password"
        placeholder="Confirm Password"
        icon={MdLock}
        autoComplete="new-password"
        required
        minLength={6}
        error={state.fieldErrors?.confirm_password}
      />

      {/* Language. CRA portals a bespoke dropdown to <body>; a native <select>
          styled to match gets the same look plus working keyboard handling and
          the OS picker on mobile. */}
      <div className="auth-fade-up relative mb-7 md-auth:mb-6">
        <span className="pointer-events-none absolute left-0 top-1/2 z-[2] -translate-y-1/2 text-[22px] text-color md-auth:text-[20px]">
          <MdLanguage aria-hidden />
        </span>
        <select
          id="languageId"
          name="languageId"
          defaultValue=""
          required
          aria-invalid={Boolean(state.fieldErrors?.languageId)}
          aria-describedby={
            state.fieldErrors?.languageId ? "err-languageId" : undefined
          }
          className="w-full cursor-pointer appearance-none border-none bg-transparent py-[1.125rem] pl-11 pr-6 text-[16px] text-foreground outline-none md-auth:py-[0.875rem] md-auth:pl-10"
        >
          <option value="" disabled className="bg-background text-color">
            Select a language
          </option>
          {languages.map((lang) => (
            <option
              key={lang.id}
              value={lang.id}
              className="bg-background text-foreground"
            >
              {lang.name}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-color"
          aria-hidden
        >
          ▾
        </span>
        <span className="absolute inset-x-0 bottom-0 h-px bg-white/10" aria-hidden />
        {state.fieldErrors?.languageId && (
          <p id="err-languageId" className="mt-1 text-xs text-destructive">
            {state.fieldErrors.languageId}
          </p>
        )}
      </div>

      {/* Terms. A real checkbox sits visually hidden behind the custom box so
          the value posts with the form and stays keyboard reachable. */}
      <div className="auth-fade-up mb-6 flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          name="terms"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="peer sr-only"
        />
        <label
          htmlFor="terms"
          className={[
            "mt-0.5 flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#d6ff00]",
            terms
              ? "border-[#d6ff00] bg-[#d6ff00] text-black"
              : "border-white/30 bg-transparent",
          ].join(" ")}
        >
          {terms && <MdCheck className="text-[14px]" aria-hidden />}
        </label>
        <label htmlFor="terms" className="cursor-pointer text-[13px] text-color">
          I have read and accept the{" "}
          <span className="font-semibold text-foreground">
            Terms and Conditions
          </span>
        </label>
      </div>
      {state.fieldErrors?.terms && (
        <p className="mb-3 text-xs text-destructive">{state.fieldErrors.terms}</p>
      )}

      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <AuthSubmitButton pending={isPending} pendingLabel="Creating account…">
        Create account
      </AuthSubmitButton>

      <AuthDivider label="or continue with" />

      <GoogleButton mode="signup" />
    </form>
  );
}
