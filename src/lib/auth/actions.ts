"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { SESSION_COOKIE, getToken, sessionCookieOptions } from "./session";

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let token: string;
  try {
    const session = await api.auth.login(email, password);
    token = session.token;
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Sign in failed. Please try again." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());

  // Outside the try/catch so the redirect signal is never swallowed.
  redirect("/admin");
}

export async function logout() {
  const token = await getToken();
  if (token) {
    try {
      await api.auth.logout();
    } catch {
      // best-effort server-side revocation; clear the cookie regardless
    }
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
