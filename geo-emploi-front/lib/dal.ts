/**
 * Data Access Layer — l'autorisation vit ici, au contact de la donnée.
 *
 * `proxy.ts` ne fait qu'un contrôle optimiste sur la présence du cookie (il
 * tourne aussi sur les préchargements). La vraie décision se prend dans les
 * pages et les Server Actions, en appelant `requireUser` / `requireRole` :
 * une Server Action est un endpoint POST public, cacher un bouton
 * n'autorise rien.
 */

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { hasSessionCookie } from "@/lib/session";
import type { Role, SessionUser } from "@/lib/schemas";

/**
 * `cache` : une seule requête `/me` par rendu, même si le layout, la page et
 * trois composants la demandent.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (!(await hasSessionCookie())) return null;
  try {
    return await api<SessionUser>("/api/v1/me");
  } catch (error) {
    // Jeton expiré, compte supprimé ou suspendu : on retombe en visiteur.
    if (error instanceof ApiError) return null;
    throw error;
  }
});

export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    redirect(next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion");
  }
  return user;
}

export async function requireRole(
  role: Role,
  next?: string,
): Promise<SessionUser> {
  const user = await requireUser(next);
  if (user.role !== role) redirect("/");
  return user;
}
