import type { Metadata } from "next";
import {
  Nunito_Sans,
  Manrope,
  DM_Serif_Display,
  Fraunces,
  Public_Sans,
  Cormorant,
  IBM_Plex_Sans,
} from "next/font/google";
import { env } from "@/lib/env";
import { ThemeScript } from "@/features/dawahcast/components/site-shell/ThemeScript";
import { AnalyticsProvider } from "@/features/analytics/AnalyticsProvider";
import { WebVitals } from "@/features/analytics/WebVitals";
import "./globals.css";

// The live site renders its shell in Nunito Sans; self-hosting it through
// next/font avoids the render-blocking Google Fonts request CRA pays for.
const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

// The auth pages use a different pair: Manrope for UI text, DM Serif Display
// for the headings and the active tab.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif",
  display: "swap",
});

// The New Releases page has its own editorial palette and typeface pair.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-fraunces",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-public-sans",
  display: "swap",
});

// The Ramadan page has its own pairing again: Cormorant for the Hijri year,
// IBM Plex Sans for everything around it.
const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-cormorant",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "DawahCast — Islamic lectures, recitations & podcasts",
    template: "%s · DawahCast",
  },
  description:
    "Discover Islamic lectures, Quranic recitations, podcasts and videos on DawahCast.",
  openGraph: {
    type: "website",
    siteName: "DawahCast",
    url: env.siteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${manrope.variable} ${dmSerif.variable} ${fraunces.variable} ${publicSans.variable} ${cormorant.variable} ${plexSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
        {/* Client-only; renders nothing. Covers auth pages as well as the app. */}
        <AnalyticsProvider />
        <WebVitals />
      </body>
    </html>
  );
}
