import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/api/client";

const MAX_AGE_SECONDS = 60 * 60;

export async function createSession(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function hasSessionCookie() {
  return Boolean((await cookies()).get(SESSION_COOKIE)?.value);
}
