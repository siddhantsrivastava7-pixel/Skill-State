import "server-only";

import type { User } from "@supabase/supabase-js";
import { createServerAuthClient } from "@/lib/supabase/server";

export class AuthenticationError extends Error {
  constructor(message = "A valid SkillState session is required.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export function readBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AuthenticationError();
  }
  return token;
}

export async function requireAuthenticatedUser(request: Request): Promise<User> {
  const token = readBearerToken(request);
  const { data, error } = await createServerAuthClient().auth.getUser(token);
  if (error || !data.user) throw new AuthenticationError();
  return data.user;
}
