import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import { hasSessionCookie } from "@/lib/session";
import type { Role, SessionUser } from "@/lib/schemas";

export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (!(await hasSessionCookie())) return null;
  try {
    return await api<SessionUser>("/api/v1/me");
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
});

export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    redirect(
      next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion",
    );
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
