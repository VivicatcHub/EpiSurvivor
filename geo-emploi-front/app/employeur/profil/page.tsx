import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PlanForm } from "@/components/employer/plan-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCompany } from "@/lib/api/account";
import { requireRole } from "@/lib/dal";
import { PLAN_LABELS, formatDate } from "@/lib/labels";

export const metadata = { title: "Profil entreprise" };

export default async function EmployeurProfilPage() {
  await requireRole("employer", "/employeur/profil");
  const company = await getCompany();

  const infoRows: [string, string][] = [
    ["Raison sociale", company.name],
    ["SIRET", company.siret || "Non renseigné"],
    ["Secteur", company.sector || "Non renseigné"],
    ["Ville", company.city || "Non renseignée"],
    ["Contact", company.contactEmail],
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-10">
      <PageHeader
        title="Profil entreprise"
        description="Informations de l'entreprise et gestion de l'abonnement."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              Visibles par les chercheurs d&apos;emploi sur vos offres.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {infoRows.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Abonnement
              <Badge variant="secondary">{PLAN_LABELS[company.plan]}</Badge>
            </CardTitle>
            <CardDescription>
              {company.subscribedSince
                ? `Actif depuis le ${formatDate(company.subscribedSince)}.`
                : "Aucun abonnement en cours."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold">
              {company.planPrice} €
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / mois
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Rayon de diffusion inclus : {company.radiusKm} km autour de vos
              établissements.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" render={<Link href="/employeur/abonnement" />}>
                Changer de formule
              </Button>
              {company.plan === "none" ? null : (
                <PlanForm
                  plan="none"
                  label="Résilier"
                  variant="destructive"
                  pendingLabel="Résiliation…"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
