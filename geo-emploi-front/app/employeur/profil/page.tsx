import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { COMPANY } from "@/lib/mock-data";

export const metadata = { title: "Profil entreprise" };

const INFO_ROWS: [string, string][] = [
  ["Raison sociale", COMPANY.name],
  ["SIRET", COMPANY.siret],
  ["Secteur", COMPANY.sector],
  ["Ville", COMPANY.city],
  ["Contact", COMPANY.contactEmail],
];

export default function EmployeurProfilPage() {
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
            {INFO_ROWS.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm">{value}</p>
              </div>
            ))}
            <Separator />
            <Button variant="outline" size="sm">
              Modifier les informations
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Abonnement
              <Badge variant="secondary">Standard</Badge>
            </CardTitle>
            <CardDescription>
              Actif depuis le {COMPANY.subscribedSince}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold">
              {COMPANY.planPrice} €
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / mois
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Rayon de diffusion inclus : {COMPANY.radiusKm} km autour de vos
              établissements.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" render={<Link href="/employeur/abonnement" />}>
                Changer de formule
              </Button>
              <Button size="sm" variant="destructive">
                Résilier
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
