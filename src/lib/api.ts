import { env } from "./env";

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

  return res.json() as Promise<T>;
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
