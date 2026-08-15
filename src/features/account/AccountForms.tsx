"use client";

import { useActionState, useState } from "react";
import {
  updateProfileAction,
  changePasswordAction,
  deleteAccountAction,
  type ProfileState,
  type ChangePasswordState,
  type DeleteAccountState,
} from "./actions";
import type { Profile } from "./server";

const initialProfile: ProfileState = {};
const initialPassword: ChangePasswordState = {};
const initialDelete: DeleteAccountState = {};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialProfile,
  );
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field
        id="username"
        label="Username"
        name="username"
        defaultValue={profile.username ?? ""}
        error={state.fieldErrors?.username}
        autoComplete="username"
      />
      <Field
        id="email"
        label="Email"
        name="email"
        type="email"
        defaultValue={profile.email ?? ""}
        error={state.fieldErrors?.email}
        autoComplete="email"
      />
      <Field
        id="name"
        label="Display name"
        name="name"
        defaultValue={profile.name ?? ""}
        error={state.fieldErrors?.name}
        autoComplete="name"
      />
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-md bg-hover px-3 py-2 text-sm text-foreground">
          Profile updated.
        </p>
      )}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-dncolor-500 px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialPassword,
  );
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <Field
        id="currentPassword"
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.currentPassword}
        key={state.success ? "ok" : "form"}
      />
      <Field
        id="newPassword"
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        minLength={6}
        error={state.fieldErrors?.newPassword}
      />
      <Field
        id="confirmPassword"
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={6}
        error={state.fieldErrors?.confirmPassword}
      />
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-md bg-hover px-3 py-2 text-sm text-foreground">
          Password changed.
        </p>
      )}
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-dncolor-500 px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Updating…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    initialDelete,
  );
  const [requestedOpen, setRequestedOpen] = useState(false);

  // Derived, not synced: an errored action must keep the form open so the user
  // can see why it failed.
  const confirmingOpen =
    requestedOpen || Boolean(state.error) || Boolean(state.fieldErrors);

  if (!confirmingOpen) {
    return (
      <button
        type="button"
        onClick={() => setRequestedOpen(true)}
        className="rounded-md border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        This will permanently delete your account and remove your playlists and
        favorites. This action cannot be undone.
      </p>
      <Field
        id="del-password"
        label="Confirm with your password"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />
      <Field
        id="del-confirm"
        label="Type DELETE to confirm"
        name="confirm"
        error={state.fieldErrors?.confirm}
      />
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setRequestedOpen(false)}
          disabled={isPending}
          className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-hover disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Deleting…" : "Delete account"}
        </button>
      </div>
    </form>
  );
}

// ─── Shared input ────────────────────────────────────────────────────────────
type FieldProps = {
  id: string;
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
  minLength?: number;
  error?: string;
};

function Field({
  id,
  label,
  name,
  type = "text",
  defaultValue,
  autoComplete,
  minLength,
  error,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        minLength={minLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `err-${id}` : undefined}
        className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error && (
        <p id={`err-${id}`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
