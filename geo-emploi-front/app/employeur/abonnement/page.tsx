import { Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PlanForm } from "@/components/employer/plan-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCompany } from "@/lib/api/account";
import { requireRole } from "@/lib/dal";

export const metadata = { title: "Abonnement employeur" };

// Doit rester aligné sur PLANS dans geo-emploi-back/app/api/employer.py :
// c'est le backend qui applique le tarif et le rayon, ceci n'est que la
// vitrine.
const PLANS = [
  {
    plan: "standard" as const,
    title: "Standard",
    price: 400,
    description:
      "La formule de référence pour recruter sur votre bassin d'emploi.",
    features: [
      "Publication illimitée d'offres géolocalisées",
      "Rayon de diffusion jusqu'à 15 km",
      "Réception et gestion des candidatures",
      "Tableau de bord vues / candidatures",
    ],
  },
  {
    plan: "premium" as const,
    title: "Premium",
    price: 900,
    description: "Pour couvrir plusieurs départements et sortir du lot.",
    features: [
      "Rayon de diffusion jusqu'à 50 km",
      "Mise en avant sur la carte",
      "Statistiques avancées",
    ],
  },
];

export default async function AbonnementPage() {
  await requireRole("employer", "/employeur/abonnement");
  const company = await getCompany();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-10 px-4 py-10">
      <PageHeader
        title="Choisissez votre formule"
        description="La publication d'offres sur GéoEmploi est un service payant, facturé mensuellement."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((offer) => {
          const current = company.plan === offer.plan;
          return (
            <Card key={offer.plan}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {offer.title}
                  {current ? <Badge variant="secondary">Formule actuelle</Badge> : null}
                </CardTitle>
                <CardDescription>{offer.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-semibold">
                  {offer.price} €
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / mois
                  </span>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {offer.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <PlanForm
                  plan={offer.plan}
                  label={current ? "Formule active" : "Souscrire et publier"}
                  pendingLabel="Souscription…"
                  variant={current ? "outline" : "default"}
                  className="w-full"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        Plus la zone de diffusion est large, plus l&apos;abonnement est élevé.
        Le paiement n&apos;est pas encore branché : la souscription est
        enregistrée directement sur votre compte.
      </p>
    </main>
  );
}
