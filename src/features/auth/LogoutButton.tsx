import { logoutAction } from "./actions";

export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className}>
        {children ?? "Log out"}
      </button>
    </form>
  );
}
