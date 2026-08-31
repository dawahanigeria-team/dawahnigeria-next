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
  /** What the API actually sends for the author's display name. */
  user?: string;
  username?: string;
  user_name?: string;
  name?: string;
  display_name?: string;
  user_image?: string;
  avatar?: string;
  /** What the API actually sends for the comment text. */
  content?: string;
  comment?: string;
  body?: string;
  text?: string;
  created_at?: string;
  created?: string;
  date?: string;
};

/**
 * The upstream sends `{ type, date, content, audio_id, user }` — the author is
 * `user` and the text is `content`, neither of which the older field list here
 * covered, and until recently there was no id at all. Requiring an id meant
 * every comment was dropped, so pages advertised a comment count and then
 * rendered "Be the first to share your thoughts".
 *
 * An id is no longer required: a comment with text is worth showing even if the
 * upstream omits one, so the caller falls back to positional keys.
 */
function normalize(raw: CommentRaw, index: number): Comment | null {
  const body =
    (raw.content as string | undefined) ??
    (raw.comment as string | undefined) ??
    (raw.body as string | undefined) ??
    (raw.text as string | undefined) ??
    "";
  if (!body.trim()) return null;

  const id = raw.id ?? raw.comment_id;
  return {
    id: id === undefined || id === null ? `idx-${index}` : String(id),
    authorId:
      raw.user_id !== undefined ? String(raw.user_id) : raw.uid !== undefined ? String(raw.uid) : undefined,
    authorName:
      (raw.user as string | undefined) ??
      (raw.username as string | undefined) ??
      (raw.user_name as string | undefined) ??
      (raw.name as string | undefined) ??
      (raw.display_name as string | undefined),
    authorImage: (raw.user_image as string | undefined) ?? (raw.avatar as string | undefined),
    body,
    createdAt:
      (raw.created_at as string | undefined) ??
      (raw.created as string | undefined) ??
      (raw.date as string | undefined),
    raw,
  };
}

/**
 * GET /commentApi.php?item_id={target}&type={type}
 *
 * Reading is public. `user_id` used to be mandatory here, which hid every
 * comment from signed-out visitors and from search-engine crawlers even though
 * the upstream filters on item and type alone and served everyone the same
 * list. It is still sent when we have a viewer, so the upstream can attribute
 * the read, but it is no longer required.
 */
export async function getComments(
  viewerUserId: string | undefined,
  itemId: string | number,
  type: CommentType,
): Promise<Comment[]> {
  const params = new URLSearchParams({
    item_id: String(itemId),
    type,
  });
  if (viewerUserId) params.set("user_id", viewerUserId);

  let result: unknown;
  try {
    result = await api.get<unknown>(`/commentApi.php?${params.toString()}`, {
      // Comments are public content now, so they can be cached and revalidated
      // rather than fetched fresh on every render. Keep it short: a new comment
      // should appear quickly for the person who just posted it, and posting
      // revalidates the page path anyway.
      cache: { revalidate: 60, tags: [`comments:${type}:${itemId}`] },
    });
  } catch {
    return [];
  }
  if (!Array.isArray(result)) return [];
  const out: Comment[] = [];
  result.forEach((raw, i) => {
    const c = normalize(raw as CommentRaw, i);
    if (c) out.push(c);
  });
  return out;
}
