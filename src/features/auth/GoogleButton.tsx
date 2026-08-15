"use client";

import { useState } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { googleLoginAction } from "./actions";

// Same OAuth client as the CRA app, so existing consent carries over. Public by
// design — a client id is not a secret.
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "498332584921-nghgkmqicq5ijukvrhjljfilsl8mg4n8.apps.googleusercontent.com";

type Mode = "login" | "signup";

function GoogleButtonInner({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setPending(true);
      setError(null);
      try {
        // Implicit flow gives an access token, not a profile — exchange it for
        // the user's email/name, exactly as CRA's googleCustomButton does.
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!res.ok) throw new Error("userinfo failed");
        const profile = (await res.json()) as { email?: string; name?: string };

        if (mode === "signup") {
          // CRA sends new social users to pick a language before creating the
          // account; carry the payload across in sessionStorage rather than the
          // URL so the token never lands in history or a referrer header.
          sessionStorage.setItem(
            "dn_social_signup",
            JSON.stringify({
              accessToken: tokenResponse.access_token,
              email: profile.email ?? "",
              name: profile.name ?? "",
            }),
          );
          router.push("/auth/selectlanguage");
          return;
        }

        const result = await googleLoginAction({
          accessToken: tokenResponse.access_token,
          email: profile.email ?? "",
          name: profile.name ?? "",
          next,
        });
        // A successful action redirects and never returns.
        if (result?.error) setError(result.error);
      } catch {
        setError("Google sign-in failed. Please try again.");
      } finally {
        setPending(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => login()}
        disabled={pending}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.12] text-[16px] text-[#f5f5f5] transition-colors hover:bg-white/20 disabled:opacity-60"
      >
        <FcGoogle className="text-xl" aria-hidden />
        <span>{pending ? "Signing in…" : "Continue with Google"}</span>
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function GoogleButton({ mode, next }: { mode: Mode; next?: string }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleButtonInner mode={mode} next={next} />
    </GoogleOAuthProvider>
  );
}
