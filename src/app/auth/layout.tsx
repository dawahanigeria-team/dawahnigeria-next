import Image from "next/image";
import { AuthGeometricBackground } from "@/features/auth/AuthGeometricBackground";
import { AuthTabs } from "@/features/auth/AuthTabs";
import { AuthCloseButton } from "@/features/auth/AuthCloseButton";

/**
 * Auth shell, ported from CRA's `Authentication/auth/Auth.jsx` + `auth.scss`.
 *
 * Desktop (≥690px): a 45%/55% grid — hero image left, form right — inside a
 * 24px-radius card at 95% width / 90vh, capped at 1200px (1300 from 1024px up).
 *
 * Mobile: the hero becomes a fixed 35vh band behind a rounded sheet that the
 * form scrolls inside (`mt-[30vh]` + `rounded-t-[32px]`).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-row items-center justify-center overflow-hidden bg-background font-manrope">
      <AuthGeometricBackground />

      <div className="auth-fade-up relative z-[1] grid min-h-screen w-full grid-cols-1 overflow-hidden md-auth:min-h-[90vh] md-auth:w-[95%] md-auth:max-w-[1200px] md-auth:grid-cols-[45%_55%] md-auth:rounded-3xl md-auth:shadow-[0_20px_60px_rgba(0,0,0,0.3),0_0_100px_rgba(214,255,0,0.1)] lg:max-w-[1300px]">
        {/* Hero — fixed band on mobile, left column on desktop */}
        <div className="fixed inset-x-0 top-0 z-0 order-2 h-[35vh] md-auth:relative md-auth:order-1 md-auth:h-auto md-auth:overflow-hidden md-auth:rounded-l-3xl">
          <div className="absolute inset-0 h-full w-full md-auth:relative md-auth:h-full">
            <Image
              src="/brand/loginheroimg.png"
              alt=""
              fill
              priority
              sizes="(min-width: 690px) 45vw, 100vw"
              className="object-cover md-auth:rounded-l-3xl"
            />
            {/* Overlay: a vertical dark wash on mobile, swapped for the lime
                diagonal at ≥690px (CRA `.auth_hero_overlay`). */}
            <div
              className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(10,14,26,0.5)_0%,rgba(10,14,26,0.95)_100%)] md-auth:rounded-l-3xl md-auth:bg-[linear-gradient(135deg,rgba(214,255,0,0.15)_0%,rgba(10,14,26,0.7)_100%)]"
              aria-hidden
            />
            {/* Three staggered accent rules — desktop only, 10% in from the
                bottom-right corner. */}
            <div
              className="absolute bottom-[10%] right-[10%] z-[2] hidden md-auth:block"
              aria-hidden
            >
              <span className="mb-3 block h-[2px] w-20 bg-[#d6ff00] shadow-[0_0_20px_rgba(214,255,0,0.5)]" />
              <span className="mb-3 block h-[2px] w-20 bg-[#d6ff00] opacity-70 shadow-[0_0_20px_rgba(214,255,0,0.5)]" />
              <span className="mb-3 block h-[2px] w-20 bg-[#d6ff00] opacity-40 shadow-[0_0_20px_rgba(214,255,0,0.5)]" />
            </div>
          </div>
        </div>

        <AuthCloseButton />

        {/* Form column */}
        <div className="relative z-10 order-1 mt-[30vh] min-h-screen w-full overflow-y-auto rounded-t-[32px] bg-background px-6 pb-12 pt-10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md-auth:order-2 md-auth:mt-0 md-auth:flex md-auth:flex-col md-auth:rounded-none md-auth:px-12 md-auth:pb-8 md-auth:pt-12 md-auth:shadow-none lg:px-16 lg:pb-12 lg:pt-16">
          <AuthTabs />
          <div className="w-full flex-1 text-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}
