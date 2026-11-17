/**
 * Charts and the "Plays" count rank lectures by these events, so a play is
 * real listening: 30 seconds of audio heard, counted from playback ticks
 * rather than from the position, so seeking around a lecture is not listening
 * to it. Same rules as the mobile app's tracker.
 */
export const PLAY_THRESHOLD_MS = 30_000;
// `timeupdate` fires several times a second while playing; a bigger gap is a
// suspended tab or a stalled clock, not time spent listening.
const MAX_TICK_GAP_MS = 5_000;
const DEVICE_ID_KEY = "dn:play-events-device-id";

export type PlayEventEndpoint = { url: string; projectId: string };

type Tick = { lectureId: string; isPlaying: boolean; nowMs: number };

export function createPlayTracker(report: (lectureId: string) => void) {
  let lectureId: string | null = null;
  let heardMs = 0;
  let reported = false;
  let lastPlayingAt: number | null = null;

  const startNewListen = () => {
    heardMs = 0;
    reported = false;
    lastPlayingAt = null;
  };

  return {
    /** A finished track (including a repeat-one restart) ends the listen. */
    startNewListen,
    tick({ lectureId: id, isPlaying, nowMs }: Tick) {
      if (id !== lectureId) {
        lectureId = id;
        startNewListen();
      }
      if (!isPlaying) {
        lastPlayingAt = null;
        return;
      }
      if (lastPlayingAt !== null) {
        const gap = nowMs - lastPlayingAt;
        if (gap > 0 && gap <= MAX_TICK_GAP_MS) heardMs += gap;
      }
      lastPlayingAt = nowMs;

      if (!reported && heardMs >= PLAY_THRESHOLD_MS && /^\d+$/.test(id)) {
        reported = true;
        report(id);
      }
    },
  };
}

let memoryDeviceId: string | null = null;

// A random id that only lets the server ignore the same browser replaying a
// lecture within minutes; it is not tied to the account.
function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    memoryDeviceId ??= crypto.randomUUID();
    return memoryDeviceId;
  }
}

// Sent from the browser, not through the Worker: the backend dedups and
// rate-caps per source IP, and Worker egress would put every listener behind a
// handful of Cloudflare addresses.
export function sendPlayEvent(lectureId: string, endpoint: PlayEventEndpoint) {
  try {
    fetch(endpoint.url, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        "x-project": endpoint.projectId,
      },
      body: JSON.stringify({
        lecture_id: Number(lectureId),
        platform: "web",
        device_id: getDeviceId(),
      }),
    }).catch(() => {});
  } catch {
    // A missed play only leaves a count slightly low; never worth an error.
  }
}
