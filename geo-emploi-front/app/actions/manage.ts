"use server";

import { revalidatePath } from "next/cache";
import { api, ApiError, json } from "@/lib/api/client";
import { requireRole } from "@/lib/dal";
import type { FormState } from "@/app/actions/auth";

function failure(error: unknown, fallback: string): FormState {
  return { error: error instanceof ApiError ? error.message : fallback };
}

// ------------------------------------------------------------------ employeur
export async function setApplicationStatus(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("employer", "/employeur");
  const id = String(formData.get("applicationId") ?? "");
  try {
    await api(`/api/v1/employer/applications/${encodeURIComponent(id)}`, {
      method: "PATCH",
      ...json({ status: String(formData.get("status") ?? "") }),
    });
  } catch (error) {
    return failure(error, "Mise à jour impossible.");
  }
  revalidatePath("/employeur");
  return { ok: true };
}

export async function setSubscription(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("employer", "/employeur/abonnement");
  try {
    await api("/api/v1/employer/subscription", {
      method: "PUT",
      ...json({ plan: String(formData.get("plan") ?? "") }),
    });
  } catch (error) {
    return failure(error, "Changement de formule impossible.");
  }
  revalidatePath("/employeur/profil");
  revalidatePath("/employeur/abonnement");
  return { ok: true };
}

// ---------------------------------------------------------------------- admin
export async function moderateListing(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin", "/admin");
  const id = String(formData.get("listingId") ?? "");
  try {
    await api(`/api/v1/admin/offers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      ...json({ status: String(formData.get("status") ?? "") }),
    });
  } catch (error) {
    return failure(error, "Modération impossible.");
  }
  revalidatePath("/admin");
  revalidatePath("/offres");
  return { ok: true };
}

export async function setAccountStatus(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin", "/admin");
  const id = String(formData.get("accountId") ?? "");
  try {
    await api(`/api/v1/admin/users/${encodeURIComponent(id)}`, {
      method: "PATCH",
      ...json({ status: String(formData.get("status") ?? "") }),
    });
  } catch (error) {
    return failure(error, "Changement de statut impossible.");
  }
  revalidatePath("/admin");
  return { ok: true };
}
