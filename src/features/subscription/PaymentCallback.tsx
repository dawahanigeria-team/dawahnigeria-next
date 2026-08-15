"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiX, FiLoader } from "react-icons/fi";
import type { VerifyResult } from "./actions";

type Status = "verifying" | "success" | "error";

const MISSING_REFERENCE = "Missing payment reference. Please try again.";
const VERIFYING = "Verifying your payment...";
const REDIRECT_DELAY_MS = 2000;

/**
 * Shared payment-callback UI for Paystack/Flutterwave. The parent passes a
 * server action bound to the gateway + reference read from the URL.
 *
 * Status and message are derived from the settled result rather than mirrored
 * into state, so there is exactly one source of truth for what the user sees
 * and no window where the spinner and the outcome disagree.
 */
export function PaymentCallback({
  verify,
  hasReference,
}: {
  verify: () => Promise<VerifyResult>;
  hasReference: boolean;
}) {
  const router = useRouter();
  // Bumping this re-runs verification; the outcome carries the attempt it
  // belongs to so a late response from a previous attempt can't overwrite it.
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<{
    attempt: number;
    result: VerifyResult;
  } | null>(null);

  const settled = outcome?.attempt === attempt ? outcome.result : null;
  const busy = hasReference && settled === null;

  const status: Status = !hasReference
    ? "error"
    : settled === null
      ? "verifying"
      : settled.ok
        ? "success"
        : "error";

  const message = !hasReference
    ? MISSING_REFERENCE
    : (settled?.message ?? VERIFYING);

  useEffect(() => {
    if (!hasReference) return;
    let cancelled = false;
    // `verify` resolves its own failures into a VerifyResult and never rejects.
    verify().then((result) => {
      if (!cancelled) setOutcome({ attempt, result });
    });
    return () => {
      cancelled = true;
    };
  }, [verify, hasReference, attempt]);

  useEffect(() => {
    if (status !== "success") return;
    const id = window.setTimeout(
      () => router.push("/dawahcast"),
      REDIRECT_DELAY_MS,
    );
    return () => window.clearTimeout(id);
  }, [status, router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-8 text-center shadow-xl">
        <div className="mb-6 flex justify-center">
          {status === "verifying" && (
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <FiLoader className="h-8 w-8 animate-spin text-blue-500" />
            </span>
          )}
          {status === "success" && (
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <FiCheck className="h-8 w-8 text-green-500" />
            </span>
          )}
          {status === "error" && (
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <FiX className="h-8 w-8 text-red-500" />
            </span>
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {status === "verifying" && "Processing Payment"}
          {status === "success" && "Payment Successful!"}
          {status === "error" && "Payment Failed"}
        </h1>
        <p className="mb-6 text-muted-foreground">{message}</p>

        <div className="flex flex-col gap-3">
          {status === "error" && (
            <>
              <button
                onClick={() => setAttempt((a) => a + 1)}
                disabled={busy || !hasReference}
                className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Retrying..." : "Try Again"}
              </button>
              <button
                onClick={() => router.push("/dawahcast")}
                className="w-full rounded-lg border border-border px-4 py-3 font-medium text-foreground transition-colors hover:bg-hover"
              >
                Go to Home
              </button>
            </>
          )}
          {status === "success" && (
            <button
              onClick={() => router.push("/dawahcast")}
              className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Continue to App
            </button>
          )}
        </div>

        {status === "error" && (
          <p className="mt-6 text-sm text-muted-foreground">
            Need help?{" "}
            <a href="mailto:support@dawahnigeria.com" className="text-primary hover:underline">
              Contact Support
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
