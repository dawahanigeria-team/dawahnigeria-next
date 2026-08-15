import "server-only";
import { api } from "@/lib/api";

export type CommentType = "audio" | "album" | "rp" | "playlist" | "video";

export type Comment = {
  id: string;
  authorId: string | undefined;
  authorName: string | undefined;
  authorImage: string | undefined;
  body: string;
  createdAt: string | undefined;
  raw: Record<string, unknown>;
};

type CommentRaw = Record<string, unknown> & {
  id?: string | number;
  comment_id?: string | number;
  user_id?: string | number;
  uid?: string | number;
  username?: string;
  user_name?: string;
  name?: string;
  display_name?: string;
  user_image?: string;
  avatar?: string;
  comment?: string;
  body?: string;
  text?: string;
  created_at?: string;
  created?: string;
  date?: string;
};

function normalize(raw: CommentRaw): Comment | null {
  const id = raw.id ?? raw.comment_id;
  if (id === undefined || id === null) return null;
  return {
    id: String(id),
    authorId:
      raw.user_id !== undefined ? String(raw.user_id) : raw.uid !== undefined ? String(raw.uid) : undefined,
    authorName:
      (raw.username as string | undefined) ??
      (raw.user_name as string | undefined) ??
      (raw.name as string | undefined) ??
      (raw.display_name as string | undefined),
    authorImage: (raw.user_image as string | undefined) ?? (raw.avatar as string | undefined),
    body: (raw.comment as string | undefined) ??
      (raw.body as string | undefined) ??
      (raw.text as string | undefined) ??
      "",
    createdAt:
      (raw.created_at as string | undefined) ??
      (raw.created as string | undefined) ??
      (raw.date as string | undefined),
    raw,
  };
}

/**
 * GET /commentApi.php?user_id={viewer}&item_id={target}&type={type}
 *
 * The upstream requires a `user_id` query param even for reads. Anonymous
 * visitors can't fetch comments — surface an empty list and let the caller
 * render a "sign in to view" CTA.
 */
export async function getComments(
  viewerUserId: string,
  itemId: string | number,
  type: CommentType,
): Promise<Comment[]> {
  let result: unknown;
  try {
    result = await api.get<unknown>(
      `/commentApi.php?user_id=${encodeURIComponent(viewerUserId)}&item_id=${encodeURIComponent(String(itemId))}&type=${type}`,
      { cache: { revalidate: false } },
    );
  } catch {
    return [];
  }
  if (!Array.isArray(result)) return [];
  const out: Comment[] = [];
  for (const raw of result) {
    const c = normalize(raw as CommentRaw);
    if (c) out.push(c);
  }
  return out;
}
