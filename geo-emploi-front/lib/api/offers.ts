import "server-only";
import { api } from "@/lib/api/client";
import type { BoundsBox, Listing, ListingFilters } from "@/lib/schemas";

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function searchListings(
  filters: ListingFilters & Partial<BoundsBox> = {},
): Promise<Listing[]> {
  return api<Listing[]>(
    `/api/v1/offers${query({
      q: filters.q,
      contract: filters.contract === "toutes" ? undefined : filters.contract,
      minLat: filters.minLat,
      maxLat: filters.maxLat,
      minLng: filters.minLng,
      maxLng: filters.maxLng,
    })}`,
  );
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    return await api<Listing>(`/api/v1/offers/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}
