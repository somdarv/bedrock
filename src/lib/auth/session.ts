import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, type SessionUser } from "@/lib/api";

export const SESSION_COOKIE = "bedrock_token";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

/** The raw Sanctum token from the httpOnly cookie, if present. */
export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/** Resolve the current admin, or null if unauthenticated / token invalid. */
export async function getSession(): Promise<SessionUser | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    return await api.auth.me(token);
  } catch {
    return null;
  }
}

/** Guard for server components: returns the user or redirects to /login. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}
