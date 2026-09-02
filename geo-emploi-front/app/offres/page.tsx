import { MapShell } from "@/components/map/map-shell";
import { searchListings } from "@/lib/api/offers";
import type { ContractType, Listing } from "@/lib/schemas";

export const metadata = { title: "Carte des offres" };

export default async function OffresPage({
  searchParams,
}: PageProps<"/offres">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const contract =
    typeof params.contract === "string"
      ? (params.contract as ContractType | "toutes")
      : undefined;

  // Premier lot rendu côté serveur : la liste et le chrome s'affichent sans
  // attendre le bundle Leaflet, qui arrive derrière un squelette (§3.4).
  let listings: Listing[] = [];
  let unavailable = false;
  try {
    listings = await searchListings({ q, contract });
  } catch {
    // La carte est publique et sans compte : elle doit rester affichable même
    // API éteinte, avec un message clair plutôt qu'un écran d'erreur.
    unavailable = true;
  }

  return (
    <main className="h-[calc(100dvh-3.75rem)] overflow-hidden lg:p-4">
      <MapShell
        key={`${q ?? ""}-${contract ?? ""}`}
        initialListings={listings}
        unavailable={unavailable}
      />
    </main>
  );
}
