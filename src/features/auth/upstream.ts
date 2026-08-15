import { api } from "@/lib/api";
import type { Session, User } from "./types";

/**
 * The upstream returns tokens under many possible keys depending on which
 * action and which response wrapping was used. Mirror the resolution chain
 * from the CRA's tokenRefresh.js / resolveAuthPayload.
 */
function pickToken(payload: unknown, keys: string[]): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

function findToken(payload: unknown, kind: "access" | "refresh"): string | undefined {
  const accessKeys = ["accessToken", "access_token", "token", "auth_token"];
  const refreshKeys = ["refreshToken", "refresh_token"];
  const keys = kind === "access" ? accessKeys : refreshKeys;

  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;

  const direct = pickToken(obj, keys);
  if (direct) return direct;

  for (const nested of ["tokens", "data", "user"]) {
    const inner = obj[nested];
    if (inner) {
      const found = findToken(inner, kind);
      if (found) return found;
    }
  }
  return undefined;
}

function findUser(payload: unknown): User | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;

  // Heuristic: a user object has an id-like field.
  const idFields = ["id", "user_id", "uid"];
  for (const key of idFields) {
    const v = obj[key];
    if ((typeof v === "string" || typeof v === "number") && String(v)) {
      return {
        id: String(v),
        email: (obj.email as string | undefined) ?? undefined,
        username:
          (obj.username as string | undefined) ??
          (obj.user_name as string | undefined),
        name:
          (obj.name as string | undefined) ??
          (obj.display_name as string | undefined),
        raw: obj,
      };
    }
  }

  for (const nested of ["user", "data", "profile"]) {
    const inner = obj[nested];
    if (inner) {
      const u = findUser(inner);
      if (u) return u;
    }
  }
  return undefined;
}

function parseSession(payload: unknown): Session | null {
  const accessToken = findToken(payload, "access");
  if (!accessToken) return null;
  const user = findUser(payload);
  if (!user) return null;
  const refreshToken = findToken(payload, "refresh");
  return { user, accessToken, refreshToken };
}

export type LoginInput = { emailOrUsername: string; password: string };
export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  /** Content language chosen at signup; the upstream stores it on the account. */
  languageId?: number;
};

export async function upstreamLogin(input: LoginInput): Promise<Session | null> {
  const payload = await api.post<unknown>("/user_auth.php", {
    action: "login_user",
    email_or_username: input.emailOrUsername,
    password: input.password,
  }, { cache: { revalidate: false } });
  return parseSession(payload);
}

export async function upstreamRegister(input: RegisterInput): Promise<Session | null> {
  const payload = await api.post<unknown>("/user_auth.php", {
    action: "register_user",
    username: input.username,
    email: input.email,
    password: input.password,
    languageId: input.languageId,
  }, { cache: { revalidate: false } });
  return parseSession(payload);
}

export type SocialLoginInput = {
  accessToken: string;
  email: string;
  name: string;
  /** Chosen on /auth/selectlanguage during social signup; CRA defaults to 6 (English). */
  languageId?: number;
};

/**
 * Google sign-in. The upstream uses the *register* action for social auth in
 * both directions — it upserts, returning an existing account's session rather
 * than erroring on a repeat sign-in. Mirrors CRA's `googleCustomButton.jsx`.
 */
export async function upstreamSocialLogin(
  input: SocialLoginInput,
): Promise<Session | null> {
  const payload = await api.post<unknown>("/user_auth.php", {
    action: "register_user",
    is_social: true,
    type: "google",
    google_access_token: input.accessToken,
    name: input.name,
    email: input.email,
    languageId: input.languageId ?? 6,
  }, { cache: { revalidate: false } });
  return parseSession(payload);
}

export async function upstreamRefresh(refreshToken: string): Promise<Session | null> {
  const payload = await api.post<unknown>("/user_auth.php", {
    action: "refresh_token",
    refresh_token: refreshToken,
  }, { cache: { revalidate: false } });
  return parseSession(payload);
}
