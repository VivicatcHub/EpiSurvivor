import { NextResponse, type NextRequest } from "next/server";
import { searchListings } from "@/lib/api/offers";
import type { ContractType } from "@/lib/schemas";

/**
 * BFF de la carte : la seule requête que le navigateur émet pour des offres.
 *
 * Elle existe pour que `API_URL` et le cookie de session restent côté serveur.
 * La carte l'appelle à chaque déplacement (débouncé, avec AbortController) :
 * un cadre de vue produisant une clé de cache différente à chaque pixel, rien
 * n'est mis en cache ici.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const bounds = (["minLat", "maxLat", "minLng", "maxLng"] as const).map((key) =>
    params.has(key) ? Number(params.get(key)) : undefined,
  );
  if (bounds.some((value) => value !== undefined && !Number.isFinite(value))) {
    return NextResponse.json({ error: "Cadre de carte invalide" }, { status: 400 });
  }
  const [minLat, maxLat, minLng, maxLng] = bounds;

  try {
    const listings = await searchListings({
      q: params.get("q") ?? undefined,
      contract: (params.get("contract") as ContractType | null) ?? undefined,
      minLat,
      maxLat,
      minLng,
      maxLng,
    });
    return NextResponse.json(listings);
  } catch {
    // L'API est injoignable : la carte garde les marqueurs qu'elle affiche
    // déjà plutôt que de se vider.
    return NextResponse.json({ error: "API indisponible" }, { status: 502 });
  }
}
