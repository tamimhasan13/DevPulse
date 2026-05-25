export interface JwtPayload {
  id: number;
  name: string;
  role: "contributor" | "maintainer";
}
