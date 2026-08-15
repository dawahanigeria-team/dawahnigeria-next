"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import {
  upstreamLogin,
  upstreamRegister,
  upstreamSocialLogin,
} from "./upstream";
import {
  writeSessionCookies,
  clearSessionCookies,
  writeAuthEventCookie,
} from "./cookies";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Only follow `next` if it's a same-site path. Prevents an open redirect —
 * `?next=https://evil.com` would otherwise let an attacker hand a victim
 * a login link that bounces them off-site after sign-in.
 */
function safeRedirect(next: string | undefined): string {
  if (!next) return "/dawahcast";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dawahcast";
  return next;
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const emailOrUsername = asString(formData.get("emailOrUsername"));
  const password = asString(formData.get("password"));
  const next = safeRedirect(asString(formData.get("next")) || undefined);

  const fieldErrors: Record<string, string> = {};
  if (!emailOrUsername) fieldErrors.emailOrUsername = "Required";
  if (!password) fieldErrors.password = "Required";
  if (password && password.length < 6) {
    fieldErrors.password = "Must be at least 6 characters";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const session = await upstreamLogin({ emailOrUsername, password });
    if (!session) {
      return { error: "Invalid credentials. Please try again." };
    }
    await writeSessionCookies(session);
  } catch (err) {
    if (err instanceof ApiError) {
      const msg = err.status === 401 || err.status === 403
        ? "Invalid credentials. Please try again."
        : "Login failed. Please try again.";
      return { error: msg };
    }
    return { error: "Network error. Please try again." };
  }

  await writeAuthEventCookie("login");
  revalidatePath("/dawahcast");
  redirect(next);
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const username = asString(formData.get("username"));
  const email = asString(formData.get("email"));
  const password = asString(formData.get("password"));
  const confirmPassword = asString(formData.get("confirm_password"));
  const languageId = asString(formData.get("languageId"));
  const acceptedTerms = formData.get("terms") === "on";

  const fieldErrors: Record<string, string> = {};
  if (!username) fieldErrors.username = "Required";
  if (!email) fieldErrors.email = "Required";
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email";
  }
  if (!password) fieldErrors.password = "Required";
  if (password && password.length < 6) {
    fieldErrors.password = "Must be at least 6 characters";
  }
  if (password && confirmPassword && password !== confirmPassword) {
    fieldErrors.confirm_password = "Passwords do not match";
  }
  if (!confirmPassword) fieldErrors.confirm_password = "Required";
  if (!languageId) fieldErrors.languageId = "Select a language";
  // Re-checked server-side: the checkbox is the only record of consent, and a
  // client-only check is trivially bypassed.
  if (!acceptedTerms) fieldErrors.terms = "Accept the terms to continue";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const session = await upstreamRegister({
      username,
      email,
      password,
      languageId: Number(languageId),
    });
    if (!session) {
      return { error: "Could not create account. The email or username may be in use." };
    }
    await writeSessionCookies(session);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: "Registration failed. Please try again." };
    }
    return { error: "Network error. Please try again." };
  }

  await writeAuthEventCookie("signup");
  revalidatePath("/dawahcast");
  redirect("/dawahcast");
}

export type SocialResult = { error: string } | never;

/**
 * Completes a Google sign-in. The client exchanges the OAuth token for the
 * user's profile, then hands both here — the upstream call and the cookie write
 * stay on the server so no token ever reaches client-side JS storage.
 */
export async function googleLoginAction(input: {
  accessToken: string;
  email: string;
  name: string;
  languageId?: number;
  next?: string;
}): Promise<SocialResult> {
  if (!input.accessToken || !input.email) {
    return { error: "Google sign-in failed. Please try again." };
  }

  try {
    const session = await upstreamSocialLogin(input);
    if (!session) {
      return { error: "Google sign-in failed. Please try again." };
    }
    await writeSessionCookies(session);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: "Google sign-in failed. Please try again." };
    }
    return { error: "Network error. Please try again." };
  }

  await writeAuthEventCookie("login");
  revalidatePath("/dawahcast");
  redirect(safeRedirect(input.next));
}

export async function logoutAction() {
  await clearSessionCookies();
  await writeAuthEventCookie("logout");
  revalidatePath("/dawahcast");
  redirect("/dawahcast");
}

// ─── Forgot password ─────────────────────────────────────────────────────────

export type RequestResetState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Set when the upstream confirms a code was sent. */
  sentToEmail?: string;
};

export async function requestResetAction(
  _prev: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const email = asString(formData.get("email"));
  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Required";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    const result = await api.post<{
      success?: boolean;
      message?: string;
    }>(
      "/forgot_passwordApi.php",
      { action: "request_reset", email },
      { cache: { revalidate: false } },
    );
    if (result?.success === false) {
      return { error: result.message || "Couldn't send reset code." };
    }
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: "Couldn't send reset code. Please try again." };
    }
    return { error: "Network error. Please try again." };
  }

  return { sentToEmail: email };
}

export type ResetPasswordState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const email = asString(formData.get("email"));
  const code = asString(formData.get("code"));
  const password = asString(formData.get("password"));
  const confirmPassword = asString(formData.get("confirmPassword"));

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Required";
  if (!code) fieldErrors.code = "Required";
  else if (!/^\d{6}$/.test(code)) fieldErrors.code = "Must be a 6-digit code";
  if (!password) fieldErrors.password = "Required";
  else if (password.length < 6) fieldErrors.password = "Must be at least 6 characters";
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords don't match";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    const result = await api.post<{
      success?: boolean;
      message?: string;
    }>(
      "/forgot_passwordApi.php",
      { action: "reset_password", email, code, password },
      { cache: { revalidate: false } },
    );
    if (result?.success === false) {
      return { error: result.message || "Couldn't reset your password." };
    }
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: "Couldn't reset your password. The code may have expired." };
    }
    return { error: "Network error. Please try again." };
  }

  return { success: true };
}
