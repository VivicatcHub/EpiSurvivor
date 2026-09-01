import { MapShell } from "@/components/map/map-shell";
import { getPublicListings } from "@/lib/mock-data";
import type { ContractType } from "@/lib/schemas";

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

  const listings = getPublicListings({ q, contract });

  return (
    <main className="h-[calc(100dvh-3.75rem)] overflow-hidden lg:p-4">
      <MapShell
        key={`${q ?? ""}-${contract ?? ""}`}
        initialListings={listings}
      />
    </main>
  );
}
