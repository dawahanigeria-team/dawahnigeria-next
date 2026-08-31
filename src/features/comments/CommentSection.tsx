import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/features/auth/session";
import { getComments, type CommentType } from "./server";
import { CommentForm } from "./CommentForm";

type Props = {
  itemId: string | number;
  type: CommentType;
  /** Path to revalidate after a comment is posted. */
  pathname: string;
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function CommentSection({ itemId, type, pathname }: Props) {
  const session = await getSession();

  // Comments render for everyone, signed in or not. They used to be hidden
  // behind the sign-in wall, which meant search engines indexed none of this
  // page's discussion — the part most likely to contain the words a person
  // actually searches for.
  const comments = await getComments(session?.user.id, itemId, type);

  return (
    <section id="comments" aria-label="Comments" className="mt-10 border-t border-border pt-6">
      <h2 className="text-base font-semibold text-foreground sm:text-lg">
        Comments
        {comments.length > 0 && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        )}
      </h2>
      <div className="mt-3">
        {session ? (
          <CommentForm itemId={itemId} type={type} revalidatePath={pathname} />
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/auth/login?next=${encodeURIComponent(pathname)}`}
              prefetch={false}
              className="font-medium text-foreground hover:underline"
            >
              Sign in
            </Link>{" "}
            to share what you took away from this.
          </p>
        )}
      </div>
      {comments.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {session
            ? "Be the first to share your thoughts."
            : "No comments yet."}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                {c.authorImage ? (
                  <Image
                    src={c.authorImage}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {c.authorName ?? "Anonymous"}
                  </p>
                  {c.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </p>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
