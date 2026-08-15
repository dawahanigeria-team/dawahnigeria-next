import { redirect } from "next/navigation";

/** CRA exposes the landing feed at both /dawahcast and /dawahcast/home.
 *  Redirect the alias to the canonical home to avoid duplicate content. */
export default function HomeAliasPage() {
  redirect("/dawahcast");
}
