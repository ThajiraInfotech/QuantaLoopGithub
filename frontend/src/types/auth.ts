import type { User } from "./user";

export type AuthResponse = {
  user: User;
  accessToken: string;
  needsOnboarding?: boolean;
  needsAccountSetup?: boolean;
  needsEmailVerification?: boolean;
  expiresIn?: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  message?: string;
  data?: null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};
