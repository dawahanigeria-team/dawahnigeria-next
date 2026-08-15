import "server-only";
import { api } from "@/lib/api";

export type Profile = {
  id: string;
  username: string | undefined;
  email: string | undefined;
  name: string | undefined;
  raw: Record<string, unknown>;
};

type ProfileRaw = Record<string, unknown> & {
  id?: string | number;
  user_id?: string | number;
  username?: string;
  user_name?: string;
  email?: string;
  name?: string;
  display_name?: string;
};

function normalize(raw: ProfileRaw, fallbackId: string): Profile {
  return {
    id: String(raw.id ?? raw.user_id ?? fallbackId),
    username: (raw.username ?? raw.user_name) as string | undefined,
    email: raw.email as string | undefined,
    name: (raw.name ?? raw.display_name) as string | undefined,
    raw,
  };
}

/**
 * POST /user_profile.php  { action: "get_profile", user_id }
 * Wrapped as POST with action body per the legacy convention.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  let result: unknown;
  try {
    result = await api.post(
      "/user_profile.php",
      { action: "get_profile", user_id: Number(userId) || userId },
      { cache: { revalidate: false } },
    );
  } catch {
    return null;
  }
  if (!result || typeof result !== "object") return null;
  const obj = result as Record<string, unknown>;
  // Some envelopes wrap profile in `data`.
  const inner = (obj.data && typeof obj.data === "object" ? obj.data : obj) as ProfileRaw;
  return normalize(inner, userId);
}
