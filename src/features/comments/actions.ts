"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError } from "@/lib/api";
import { getSession } from "@/features/auth/session";
import type { CommentType } from "./server";

export type AddCommentState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * POST /commentApi.php { user_id, item_id, type, comment }
 *
 * The page path is carried in the form so we can revalidate it precisely
 * (otherwise we'd have to bust every comment-bearing route).
 */
export async function addCommentAction(
  _prev: AddCommentState,
  formData: FormData,
): Promise<AddCommentState> {
  const session = await getSession();
  if (!session) return { error: "Sign in to comment." };

  const itemId = asString(formData.get("itemId"));
  const type = asString(formData.get("type")) as CommentType;
  const body = asString(formData.get("comment"));
  const revalidate = asString(formData.get("revalidate"));

  const fieldErrors: Record<string, string> = {};
  if (!body) fieldErrors.comment = "Required";
  else if (body.length > 500) fieldErrors.comment = "Keep it under 500 characters";
  if (!itemId || !type) return { error: "Missing context. Please reload." };
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    await api.post(
      "/commentApi.php",
      {
        user_id: Number(session.user.id) || session.user.id,
        item_id: Number(itemId) || itemId,
        type,
        comment: body,
      },
      { cache: { revalidate: false } },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: "Couldn't post your comment. Please try again." };
    }
    return { error: "Network error. Please try again." };
  }

  if (revalidate && revalidate.startsWith("/")) {
    revalidatePath(revalidate);
  }
  return { success: true };
}
