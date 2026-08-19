import "server-only";
import { cache } from "react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/features/auth/session";

export type ListeningPreferences = {
  languageIds: number[];
  lecturerIds: number[];
  configured: boolean;
  updatedAt?: string | null;
};

const EMPTY_PREFERENCES: ListeningPreferences = {
  languageIds: [],
  lecturerIds: [],
  configured: false,
  updatedAt: null,
};

type PreferencesEnvelope = {
  success?: boolean;
  data?: Partial<ListeningPreferences>;
};

function ids(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map(Number)
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  );
}

function normalize(value?: Partial<ListeningPreferences>): ListeningPreferences {
  const languageIds = ids(value?.languageIds);
  const lecturerIds = ids(value?.lecturerIds);
  return {
    languageIds,
    lecturerIds,
    configured: Boolean(value?.configured && (languageIds.length || lecturerIds.length)),
    updatedAt: value?.updatedAt ?? null,
  };
}

export const getListeningPreferences = cache(
  async function getListeningPreferences(): Promise<ListeningPreferences> {
    const token = await getAccessToken();
    if (!token) return EMPTY_PREFERENCES;
    try {
      const response = await api.post<PreferencesEnvelope>(
        "/listening_preferences.php",
        { action: "get" },
        { token, cache: { revalidate: false } },
      );
      return normalize(response.data);
    } catch {
      return EMPTY_PREFERENCES;
    }
  },
);

export async function saveListeningPreferences(
  languageIds: number[],
  lecturerIds: number[],
): Promise<ListeningPreferences> {
  const token = await getAccessToken();
  if (!token) throw new Error("Sign in to save listening preferences.");
  const response = await api.post<PreferencesEnvelope>(
    "/listening_preferences.php",
    { action: "update", languageIds: ids(languageIds), lecturerIds: ids(lecturerIds) },
    { token, cache: { revalidate: false } },
  );
  return normalize(response.data);
}

export function preferenceQuery(preferences: ListeningPreferences): string {
  if (!preferences.configured) return "";
  const query = new URLSearchParams();
  if (preferences.languageIds.length) {
    query.set("language_ids", preferences.languageIds.join(","));
  }
  if (preferences.lecturerIds.length) {
    query.set("lecturer_ids", preferences.lecturerIds.join(","));
  }
  const value = query.toString();
  return value ? `&${value}` : "";
}

export function matchesListeningPreferences(
  lecture: Record<string, unknown>,
  preferences: ListeningPreferences,
): boolean {
  if (!preferences.configured) return true;
  const languageId = Number(lecture.lang_id ?? lecture.langid ?? lecture.language_id);
  const lecturerId = Number(lecture.rp_id ?? lecture.lecturer_id ?? lecture.ResourcePersonId);
  return preferences.languageIds.includes(languageId) || preferences.lecturerIds.includes(lecturerId);
}
