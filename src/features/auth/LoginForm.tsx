"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MdEmail, MdLock } from "react-icons/md";
import { loginAction, type FormState } from "./actions";
import {
  AuthDivider,
  AuthField,
  AuthHeading,
  AuthSubmitButton,
} from "./AuthFields";
import { GoogleButton } from "./GoogleButton";

const initial: FormState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex w-full flex-col" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <AuthHeading
        title="Welcome back"
        subtitle="Continue your journey with Dawah Nigeria"
      />

      <AuthField
        id="emailOrUsername"
        name="emailOrUsername"
        type="email"
        placeholder="Email Address"
        icon={MdEmail}
        autoComplete="email"
        required
        error={state.fieldErrors?.emailOrUsername}
      />

      <AuthField
        id="password"
        name="password"
        type="password"
        placeholder="Password"
        icon={MdLock}
        autoComplete="current-password"
        required
        minLength={6}
        error={state.fieldErrors?.password}
      />

      <div className="auth-fade-up -mt-2 mb-8 flex justify-end">
        <Link
          href="/auth/forgot-password"
          className="py-2 text-[14px] font-medium text-[#8faa00] transition-colors hover:text-[#d6ff00] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <AuthSubmitButton pending={isPending} pendingLabel="Signing in…">
        Log in
      </AuthSubmitButton>

      <AuthDivider label="or continue with" />

      <GoogleButton mode="login" next={next} />
    </form>
  );
}
