"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/features/auth/session";
import {
  clearSessionCookies,
  readAccessToken,
  readRefreshToken,
  writeSessionCookies,
} from "@/features/auth/cookies";

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export type ProfileState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

/**
 * POST /user_profile.php { action: "update_profile", user_id, ...fields }
 */
export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await getSession();
  if (!session) return { error: "Sign in to update your profile." };

  const username = asString(formData.get("username"));
  const email = asString(formData.get("email"));
  const name = asString(formData.get("name"));

  const fieldErrors: Record<string, string> = {};
  if (!username) fieldErrors.username = "Required";
  if (!email) fieldErrors.email = "Required";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  let result: { success?: boolean; message?: string } | null = null;
  try {
    result = await api.post<{ success?: boolean; message?: string }>(
      "/user_profile.php",
      {
        action: "update_profile",
        user_id: Number(session.user.id) || session.user.id,
        username,
        email,
        name,
      },
      { cache: { revalidate: false } },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: "Couldn't save changes. Please try again." };
    }
    return { error: "Network error. Please try again." };
  }

  if (result?.success === false) {
    return { error: result.message || "Couldn't save changes." };
  }

  // Refresh the user cookie so the header shows the new username immediately.
  // Tokens stay unchanged; we re-write the existing values alongside the new
  // identity fields.
  const [accessToken, refreshToken] = await Promise.all([
    readAccessToken(),
    readRefreshToken(),
  ]);
  if (accessToken) {
    await writeSessionCookies({
      user: {
        id: session.user.id,
        email,
        username,
        name,
        raw: { ...session.user },
      },
      accessToken,
      refreshToken: refreshToken ?? undefined,
    });
  }

  revalidatePath("/dawahcast/account");
  return { success: true };
}

export type ChangePasswordState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) return { error: "Sign in to change your password." };

  const currentPassword = asString(formData.get("currentPassword"));
  const newPassword = asString(formData.get("newPassword"));
  const confirmPassword = asString(formData.get("confirmPassword"));

  const fieldErrors: Record<string, string> = {};
  if (!currentPassword) fieldErrors.currentPassword = "Required";
  if (!newPassword) fieldErrors.newPassword = "Required";
  else if (newPassword.length < 6) fieldErrors.newPassword = "Must be at least 6 characters";
  if (newPassword !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords don't match";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    const result = await api.post<{ success?: boolean; message?: string }>(
      "/user_profile.php",
      {
        action: "change_password",
        user_id: Number(session.user.id) || session.user.id,
        current_password: currentPassword,
        new_password: newPassword,
      },
      { cache: { revalidate: false } },
    );
    if (result?.success === false) {
      return { error: result.message || "Couldn't change your password." };
    }
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: "Couldn't change your password. Check the current password." };
    }
    return { error: "Network error. Please try again." };
  }

  return { success: true };
}

export type DeleteAccountState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function deleteAccountAction(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const session = await getSession();
  if (!session) return { error: "Sign in to delete your account." };

  const password = asString(formData.get("password"));
  const confirm = asString(formData.get("confirm"));

  const fieldErrors: Record<string, string> = {};
  if (!password) fieldErrors.password = "Required";
  if (confirm !== "DELETE") {
    fieldErrors.confirm = "Type DELETE to confirm";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    const result = await api.post<{ success?: boolean; message?: string }>(
      "/user_profile.php",
      {
        action: "delete_account",
        user_id: Number(session.user.id) || session.user.id,
        password,
      },
      { cache: { revalidate: false } },
    );
    if (result?.success === false) {
      return { error: result.message || "Couldn't delete the account." };
    }
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: "Couldn't delete the account. Check the password." };
    }
    return { error: "Network error. Please try again." };
  }

  await clearSessionCookies();
  revalidatePath("/dawahcast");
  redirect("/dawahcast");
}
