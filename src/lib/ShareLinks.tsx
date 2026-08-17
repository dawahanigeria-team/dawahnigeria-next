import { env } from "@/lib/env";

/**
 * Discovery `<link>` tags for a catalogue detail page.
 *
 * React 19 hoists `<link>` out of the component tree into `<head>`, so these can
 * be rendered from inside the page body and still land where crawlers look.
 *
 * Two things are declared here:
 *
 *  - **App deep links.** The native app already registers verified Android
 *    intent filters for /dawahcast/l, /a, /p and /rp and claims
 *    `applinks:dawahnigeria.com` on iOS, so these URLs genuinely open in the
 *    app. Declaring them lets a search result open the installed app instead of
 *    the browser. Spotify ships the same `android-app://` alternates.
 *  - **oEmbed discovery.** Points consumers at /api/oembed so a pasted link
 *    unfurls as a titled card with artwork. Spotify and Apple Podcasts both
 *    advertise theirs the same way.
 */
export function ShareLinks({ path }: { path: string }) {
  const canonical = `${env.siteUrl}${path}`;
  const host = new URL(env.siteUrl).host;
  // android-app://<package>/<scheme>/<host><path>
  const androidApp = `android-app://com.dawahnigeria.app/https/${host}${path}`;
  // ios-app://<store id>/<scheme>/<host><path>
  const iosApp = `ios-app://6759193375/https/${host}${path}`;
  const oembed = `${env.siteUrl}/api/oembed?url=${encodeURIComponent(canonical)}&format=json`;

  return (
    <>
      <link rel="alternate" href={androidApp} />
      <link rel="alternate" href={iosApp} />
      <link
        rel="alternate"
        type="application/json+oembed"
        href={oembed}
        title="DawahCast oEmbed"
      />
    </>
  );
}
