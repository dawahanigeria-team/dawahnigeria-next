/**
 * Whether an upstream media URL can actually be fetched.
 *
 * Two shapes of junk come back from the lecture endpoints, and both reach the
 * `audio` field on listings and `mp3_url`/`amr_url` on `download_api.php`
 * identically — they are the same records:
 *
 *   - `"https:"` — a bare scheme, sent when the record has no file for that
 *     format at all.
 *   - `"https://example.com/audio/lecture-002.mp3"` — placeholder rows. Roughly
 *     3 in 10 trending lectures carry one (all recent ids). example.com and
 *     example.org are reserved by RFC 2606 and can never serve real content,
 *     so treating them as unplayable is safe rather than a guess about this API.
 */
const PLACEHOLDER_HOSTS = new Set([
  "example.com",
  "www.example.com",
  "example.org",
  "www.example.org",
]);

export function isPlayableUrl(url: string | undefined | null): url is string {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false; // covers the bare "https:" case
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  if (!parsed.hostname) return false;
  if (PLACEHOLDER_HOSTS.has(parsed.hostname.toLowerCase())) return false;
  return true;
}
