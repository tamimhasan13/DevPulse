export type UserRole = "contributor" | "maintainer";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}
