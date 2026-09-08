import { PageHeader } from "@/components/layout/page-header";
import { ListingForm } from "@/components/employer/listing-form";
import { getCompany } from "@/lib/api/account";
import { requireRole } from "@/lib/dal";

export const metadata = { title: "Publier une offre" };

export default async function NouvelleOffrePage() {
  await requireRole("employer", "/employeur/offres/nouvelle");
  const company = await getCompany();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10">
      <PageHeader
        title="Publier une offre géolocalisée"
        description="Gratuit. L'offre apparaîtra sur la carte des chercheurs d'emploi situés dans votre rayon de diffusion."
      />
      <ListingForm maxRadiusKm={company.radiusKm} />
    </main>
  );
}
