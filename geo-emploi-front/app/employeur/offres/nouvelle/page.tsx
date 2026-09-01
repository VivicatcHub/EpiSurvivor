import { PageHeader } from "@/components/layout/page-header";
import { ListingForm } from "@/components/employer/listing-form";

export const metadata = { title: "Publier une offre" };

export default function NouvelleOffrePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10">
      <PageHeader
        title="Publier une offre géolocalisée"
        description="L'offre apparaîtra sur la carte des chercheurs d'emploi situés dans votre rayon de diffusion."
      />
      <ListingForm />
    </main>
  );
}
