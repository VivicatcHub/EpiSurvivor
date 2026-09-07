"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, json, readSessionToken } from "@/lib/api/client";
import { createSession, destroySession } from "@/lib/session";
import { requireUser } from "@/lib/dal";
import { ROLE_HOME } from "@/lib/labels";
import type { Role, SessionUser } from "@/lib/schemas";

export type FormState = { error?: string; ok?: boolean };

const ROLES: Role[] = ["job_seeker", "employer"];

/** N'accepte qu'un chemin interne : `?next=https://evil.tld` est ignoré. */
function safeNext(value: FormDataEntryValue | null): string | null {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

async function openSession(
  path: string,
  payload: unknown,
): Promise<{ error: string } | { user: SessionUser }> {
  const response = await apiFetch(path, { method: "POST", ...json(payload) });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return { error: body?.detail ?? "Connexion impossible, réessayez." };
  }
  const token = readSessionToken(response);
  if (!token) return { error: "Réponse inattendue du serveur." };
  await createSession(token);
  return { user: (await response.json()) as SessionUser };
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await openSession("/api/v1/login", {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if ("error" in result) return { error: result.error };

  // redirect() lève une exception de contrôle : jamais dans un try/catch.
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")) ?? ROLE_HOME[result.user.role]);
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const role = String(formData.get("role") ?? "");
  if (!ROLES.includes(role as Role)) return { error: "Rôle invalide." };

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Le mot de passe doit faire au moins 8 caractères." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const [firstname, ...rest] = name.split(/\s+/);
  const result = await openSession("/api/v1/register", {
    email: String(formData.get("email") ?? ""),
    password,
    role,
    // Une personne saisit « Prénom Nom », une entreprise sa raison sociale.
    firstname: firstname || name,
    lastname: rest.join(" ") || "—",
    company: role === "employer" ? name : null,
    siret: String(formData.get("siret") ?? "") || null,
  });
  if ("error" in result) return { error: result.error };

  revalidatePath("/", "layout");
  redirect(
    safeNext(formData.get("next")) ??
      (role === "employer" ? "/employeur/abonnement" : ROLE_HOME.job_seeker),
  );
}

export async function signOut() {
  await apiFetch("/api/v1/logout", { method: "POST" }).catch(() => null);
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

/** RGPD §3.3 : suppression du compte, depuis le profil. */
export async function deleteAccount(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  // Confirmation par saisie de l'email : un clic seul ne suffit pas.
  if (String(formData.get("confirm") ?? "").trim() !== user.email) {
    return { error: "Saisissez votre adresse e-mail pour confirmer." };
  }

  const response = await apiFetch("/api/v1/deleteaccount", { method: "DELETE" });
  if (!response.ok) return { error: "Suppression impossible, réessayez." };

  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
