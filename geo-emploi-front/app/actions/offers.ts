"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, ApiError, json } from "@/lib/api/client";
import { requireRole } from "@/lib/dal";
import type { FormState } from "@/app/actions/auth";
import type { Listing } from "@/lib/schemas";

function number(formData: FormData, key: string, fallback: number): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

/** Publier une offre — employeur authentifié uniquement. */
export async function publishListing(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Une Server Action est un endpoint POST public : on revérifie le rôle ici,
  // et le backend le revérifie à son tour.
  await requireRole("employer", "/employeur/offres/nouvelle");

  let created: Listing;
  try {
    created = await api<Listing>("/api/v1/offers", {
      method: "POST",
      ...json({
        title: String(formData.get("title") ?? ""),
        contract: String(formData.get("contract") ?? ""),
        salary: String(formData.get("salary") ?? ""),
        description: String(formData.get("description") ?? ""),
        address: String(formData.get("address") ?? ""),
        city: String(formData.get("city") ?? ""),
        postalCode: String(formData.get("postalCode") ?? ""),
        radiusKm: number(formData, "radiusKm", 15),
        lat: number(formData, "lat", 0),
        lng: number(formData, "lng", 0),
        skills: String(formData.get("skills") ?? "")
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      }),
    });
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Publication impossible, réessayez.",
    };
  }

  revalidatePath("/employeur");
  revalidatePath("/offres");
  redirect(`/offres/${created.id}`);
}

/** Postuler — réservé aux chercheurs d'emploi connectés (§2.2). */
export async function applyToListing(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const listingId = String(formData.get("listingId") ?? "");
  await requireRole("job_seeker", `/offres/${listingId}`);

  try {
    await api(`/api/v1/offers/${encodeURIComponent(listingId)}/apply`, {
      method: "POST",
      ...json({ message: String(formData.get("message") ?? "") }),
    });
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Candidature impossible, réessayez.",
    };
  }

  revalidatePath("/profil");
  return { ok: true };
}

/** §5 : signalement d'une offre frauduleuse, ouvert aux visiteurs anonymes. */
export async function reportListing(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const listingId = String(formData.get("listingId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Indiquez le motif du signalement." };

  try {
    await api(`/api/v1/offers/${encodeURIComponent(listingId)}/report`, {
      method: "POST",
      ...json({ reason }),
    });
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Signalement impossible, réessayez.",
    };
  }

  return { ok: true };
}
