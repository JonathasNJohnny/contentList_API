export type RegisterInput = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
};

export type VerifyEmailInput = {
  email?: unknown;
  code?: unknown;
};

export type LoginInput = {
  email?: unknown;
  password?: unknown;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
};
