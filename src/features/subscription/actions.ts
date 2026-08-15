"use server";

import { api, ApiError } from "@/lib/api";
import { getSession, getAccessToken } from "@/features/auth/session";

export type VerifyResult =
  | { ok: true; message: string; plan?: string }
  | { ok: false; code: "unauthenticated" | "missing-reference" | "upstream" | "network"; message: string };

type SubscriptionResponse = {
  success?: boolean;
  message?: string;
  data?: { plan?: string } & Record<string, unknown>;
};

async function refreshFeatures(userId: string, token: string): Promise<string | undefined> {
  try {
    const res = await api.post<SubscriptionResponse>(
      "/user_features.php",
      { user_id: userId },
      { token, cache: { revalidate: false } },
    );
    return (res?.data?.plan as string | undefined) ?? undefined;
  } catch {
    return undefined;
  }
}

async function verify(
  payload: Record<string, unknown>,
): Promise<VerifyResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      code: "unauthenticated",
      message: "Please log in to complete your subscription.",
    };
  }
  const token = await getAccessToken();
  if (!token) {
    return {
      ok: false,
      code: "unauthenticated",
      message: "Your session expired. Please log in again.",
    };
  }

  try {
    const res = await api.post<SubscriptionResponse>(
      "/subscription_api.php",
      { ...payload, user_id: session.user.id },
      { token, cache: { revalidate: false } },
    );
    if (!res?.success) {
      return {
        ok: false,
        code: "upstream",
        message: res?.message || "Payment verification failed. Please contact support.",
      };
    }
    const plan = await refreshFeatures(session.user.id, token);
    return {
      ok: true,
      message: "Subscription activated successfully!",
      plan,
    };
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, code: "upstream", message: "Payment verification failed. Please contact support." };
    }
    return { ok: false, code: "network", message: "Something went wrong. Please try again." };
  }
}

export async function verifyPaystackAction(reference: string): Promise<VerifyResult> {
  if (!reference) {
    return { ok: false, code: "missing-reference", message: "Missing payment reference. Please try again." };
  }
  return verify({ action: "verify_web_checkout", reference });
}

export async function verifyFlutterwaveAction(transactionId: string): Promise<VerifyResult> {
  if (!transactionId) {
    return { ok: false, code: "missing-reference", message: "Missing transaction reference. Please try again." };
  }
  return verify({ action: "verify_web_checkout_flutterwave", transaction_id: Number(transactionId) });
}
