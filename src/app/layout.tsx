import type { Metadata, Viewport } from "next";
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
import { PlayerProvider } from "@/features/player/PlayerProvider";
import { OG_FALLBACK_IMAGE } from "@/lib/socialMeta";
import { JsonLd, absoluteUrl } from "@/lib/JsonLd";
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
    // Deliberately no `url`: every page that does not declare its own
    // `openGraph` inherits this block verbatim, and a hardcoded site root made
    // each listing page claim og:url = the homepage. Facebook then attributed
    // the share to the homepage instead of the shared page. With it absent,
    // crawlers use the URL actually shared, and `alternates.canonical` on each
    // page still emits the canonical link.
    images: [
      {
        url: OG_FALLBACK_IMAGE,
        width: 1200,
        height: 630,
        alt: "DawahCast — Islamic lectures, recitations & podcasts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_FALLBACK_IMAGE],
  },
  // Renders the iOS Smart App Banner. The native app already claims
  // `applinks:dawahnigeria.com`, so a visitor who has it installed gets a real
  // "Open" rather than a trip through the App Store.
  itunes: { appId: "6759193375" },
};

/**
 * `theme_color` in the manifest only covers the installed app; this is what
 * tints the browser chrome on a normal visit. Two entries so the bar follows the
 * theme the user actually picked rather than being pinned to the dark shell.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030303" },
  ],
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
        {/* Site-wide identity. Organization is what a search engine attaches
            brand results to; WebSite + SearchAction is what makes a sitelinks
            search box possible. Both belong on every page, so they live here
            rather than being repeated per route. */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": `${env.siteUrl}/#organization`,
                name: "Dawah Nigeria",
                alternateName: "DawahCast",
                url: env.siteUrl,
                logo: absoluteUrl(env.siteUrl, "/brand/og-default.png"),
                description:
                  "Dawah Nigeria is a library of Islamic lectures, Quranic recitations, podcasts and videos from scholars across Nigeria.",
              },
              {
                "@type": "WebSite",
                "@id": `${env.siteUrl}/#website`,
                url: env.siteUrl,
                name: "DawahCast",
                publisher: { "@id": `${env.siteUrl}/#organization` },
                inLanguage: "en",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${env.siteUrl}/dawahcast/search?query={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }}
        />
        {/* Hosts the single <audio> element. It lives at the root, not in the
            dawahcast layout, so that no route change can unmount it and stop
            playback. The player's own chrome stays scoped to the app shell. */}
        <PlayerProvider>{children}</PlayerProvider>
        {/* Client-only; renders nothing. Covers auth pages as well as the app. */}
        <AnalyticsProvider />
        <WebVitals />
      </body>
    </html>
  );
}
