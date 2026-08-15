export type User = {
  id: string;
  email: string | undefined;
  username: string | undefined;
  name: string | undefined;
  raw: Record<string, unknown>;
};

export type Session = {
  user: User;
  accessToken: string;
  refreshToken: string | undefined;
};

export type AuthErrorCode =
  | "validation"
  | "credentials"
  | "duplicate"
  | "network"
  | "unknown";

export type AuthResult =
  | { ok: true; session: Session }
  | { ok: false; code: AuthErrorCode; message: string };
