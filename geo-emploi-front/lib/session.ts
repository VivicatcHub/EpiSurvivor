import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/api/client";

// Doit rester aligné sur TOKEN_EXPIRE_MINUTES côté backend.
const MAX_AGE_SECONDS = 60 * 60;

/**
 * Recopie sur le domaine du front le jeton émis par l'API.
 *
 * httpOnly : aucun script de la page ne peut lire le JWT, donc une injection
 * XSS ne suffit pas à voler la session (§3.1 « authentification sécurisée »).
 */
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
