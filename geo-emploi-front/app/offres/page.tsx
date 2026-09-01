import { MapShell } from "@/components/map/map-shell";
import type { Listing } from "@/lib/schemas";

const SAMPLE_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Viendre !",
    company: "Epitech",
    city: "Lyon",
    url: "#",
    lat: 45.74633950038525,
    lng: 4.835143989757663,
  },
];

export default function Offres() {
  return (
    <main className="h-dvh p-6">
      <MapShell initialListings={SAMPLE_LISTINGS} />
    </main>
  );
}
