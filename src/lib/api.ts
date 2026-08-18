import { env } from "./env";

/**
 * Artwork lives behind img.dawahnigeria.com, a Cloudflare-proxied host that
 * serves only the two image trees. The lecture audio stays on media.* because
 * large files hosted outside Cloudflare are not permitted on their CDN, so the
 * split has to hold here too: rewrite the artwork trees and nothing else.
 * `/dnlectures*` must never be pointed at img.* -- the origin returns 403 there
 * anyway, but the rule is easier to keep if this list stays explicit.
 *
 * Applied to the raw response text rather than per field: one upstream record
 * carries artwork under `mp3_thumbnail`, `img`, `lec_img` and `lec_thumbnail`,
 * and each PHP endpoint invents its own names. Matching on the URL catches
 * every field, including ones added later.
 *
 * PHP's json_encode escapes forward slashes, so the payload really contains
 * `https:\/\/media.dawahnigeria.com\/dc_images\/...`. Both forms are handled
 * so this keeps working if the backend ever sets JSON_UNESCAPED_SLASHES.
 */
const ARTWORK_TREES = ["dc_images", "dnimages"];

function rewriteArtworkHost(body: string): string {
  let out = body;
  for (const tree of ARTWORK_TREES) {
    out = out
      .replaceAll(
        `https:\\/\\/media.dawahnigeria.com\\/${tree}\\/`,
        `https:\\/\\/img.dawahnigeria.com\\/${tree}\\/`,
      )
      .replaceAll(
        `https://media.dawahnigeria.com/${tree}/`,
        `https://img.dawahnigeria.com/${tree}/`,
      );
  }
  return out;
}

export type ApiCache = {
  /** Seconds to revalidate. Pass 0 to disable caching. */
  revalidate?: number | false;
  /** Cache tags for on-demand revalidation. */
  tags?: string[];
};

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type Init = {
  baseUrl?: string;
  method?: Method;
  body?: unknown;
  cache?: ApiCache;
  /** Bearer token for authenticated calls (server-side only). */
  token?: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: Init = {}): Promise<T> {
  const {
    baseUrl = env.apiBaseUrl,
    method = "GET",
    body,
    cache,
    token,
  } = init;

  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Origin: "https://dawahnigeria.com",
    Referer: "https://dawahnigeria.com/",
    "User-Agent": "DawahNigeria-SSR/1.0",
    "x-project": env.apiProjectId,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-Authorization"] = `Bearer ${token}`;
  }

  const next: { revalidate?: number; tags?: string[] } = {};
  if (cache?.revalidate !== undefined && cache.revalidate !== false) {
    next.revalidate = cache.revalidate;
  }
  if (cache?.tags) next.tags = cache.tags;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...(cache?.revalidate === false
      ? { cache: "no-store" as const }
      : { next }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      payload,
      `API ${method} ${path} failed: ${res.status}`,
    );
  }

  return JSON.parse(rewriteArtworkHost(await res.text())) as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<Init, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<Init, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<Init, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<Init, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  delete: <T>(path: string, body?: unknown, opts?: Omit<Init, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE", body }),
};

export const apiAdminister = {
  post: <T>(path: string, body?: unknown, opts?: Omit<Init, "method" | "body" | "baseUrl">) =>
    request<T>(path, {
      ...opts,
      method: "POST",
      body,
      baseUrl: env.apiAdministerBaseUrl,
    }),
};
