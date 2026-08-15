import { api } from "@/lib/api";

export type Language = { id: number; name: string };

/** GET /all_lang_api.php — site content languages. */
export async function getLanguages(): Promise<Language[]> {
  const list = await api.get<Array<{ id: number; name: string }>>(
    `/all_lang_api.php`,
    { cache: { revalidate: 86400, tags: ["languages"] } },
  );
  return Array.isArray(list) ? list : [];
}
