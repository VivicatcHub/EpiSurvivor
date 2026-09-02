import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ListingForm } from "@/components/employer/listing-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
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
        description="L'offre apparaîtra sur la carte des chercheurs d'emploi situés dans votre rayon de diffusion."
      />
      {company.plan === "none" ? (
        // Le rayon autorisé vient de la formule : sans abonnement, le
        // formulaire n'a pas de bornes à proposer.
        <EmptyState
          title="Un abonnement est nécessaire"
          description="La publication d'offres sur GéoEmploi est un service payant. Choisissez votre formule pour continuer."
          action={
            <Button size="sm" render={<Link href="/employeur/abonnement" />}>
              Voir les formules
            </Button>
          }
        />
      ) : (
        <ListingForm maxRadiusKm={company.radiusKm} />
      )}
    </main>
  );
}
