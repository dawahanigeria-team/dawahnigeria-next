"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MdEmail, MdLock, MdPin } from "react-icons/md";
import {
  requestResetAction,
  resetPasswordAction,
  type RequestResetState,
  type ResetPasswordState,
} from "./actions";
import { AuthField, AuthHeading, AuthSubmitButton } from "./AuthFields";

const initialReq: RequestResetState = {};
const initialReset: ResetPasswordState = {};

export function ForgotPasswordFlow() {
  const [email, setEmail] = useState("");

  if (!email) return <RequestStep onSent={setEmail} />;
  return <ResetStep email={email} />;
}

function RequestStep({ onSent }: { onSent: (email: string) => void }) {
  const [state, formAction, isPending] = useActionState(
    requestResetAction,
    initialReq,
  );
  const [handled, setHandled] = useState<string | null>(null);

  // Promote the confirmed address to the parent by adjusting during render —
  // an effect would show the first step for one extra painted frame.
  if (state.sentToEmail && handled !== state.sentToEmail) {
    setHandled(state.sentToEmail);
    onSent(state.sentToEmail);
  }

  return (
    <form action={formAction} className="flex w-full flex-col" noValidate>
      <AuthHeading
        title="Forgot password?"
        subtitle="No worries, we'll send you a verification code"
      />

      <AuthField
        id="email"
        name="email"
        type="email"
        placeholder="Enter your email address"
        icon={MdEmail}
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />

      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <AuthSubmitButton pending={isPending} pendingLabel="Sending code…">
        Send reset code
      </AuthSubmitButton>

      <p className="mt-6 text-center text-[14px] text-color">
        Remembered it?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-[#8faa00] hover:text-[#d6ff00] hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}

function ResetStep({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialReset,
  );

  if (state.success) {
    return (
      <div className="flex w-full flex-col">
        <AuthHeading
          title="Password reset successful!"
          subtitle="Your password has been updated."
        />
        <Link
          href="/auth/login"
          className="flex h-14 w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-[#d6ff00] to-[#b8e000] text-[17px] font-semibold text-[#070707] shadow-[0_4px_15px_rgba(214,255,0,0.3)] transition-all hover:-translate-y-0.5 md-auth:rounded-xl"
        >
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col" noValidate>
      <input type="hidden" name="email" value={email} />

      <div className="mb-8">
        <h1 className="m-0 mb-2.5 font-serif text-[34px] font-normal leading-[1.15] text-foreground md-auth:mb-2 md-auth:text-[38px]">
          Reset your password
        </h1>
        <p className="m-0 text-[15px] leading-[1.5] text-color opacity-70 md-auth:text-[14px]">
          Enter the 6-digit code sent to{" "}
          <strong className="text-foreground">{email}</strong>
        </p>
      </div>

      <AuthField
        id="code"
        name="code"
        placeholder="Enter 6-digit code"
        icon={MdPin}
        autoComplete="one-time-code"
        required
        error={state.fieldErrors?.code}
      />

      <AuthField
        id="password"
        name="password"
        type="password"
        placeholder="New password (min 6 characters)"
        icon={MdLock}
        autoComplete="new-password"
        required
        minLength={6}
        error={state.fieldErrors?.password}
      />

      <AuthField
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        placeholder="Confirm new password"
        icon={MdLock}
        autoComplete="new-password"
        required
        minLength={6}
        error={state.fieldErrors?.confirmPassword}
      />

      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <AuthSubmitButton pending={isPending} pendingLabel="Resetting…">
        Reset password
      </AuthSubmitButton>
    </form>
  );
}
