import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
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

export const metadata = { title: "Abonnement employeur" };

const STANDARD_FEATURES = [
  "Publication illimitée d'offres géolocalisées",
  "Rayon de diffusion jusqu'à 15 km",
  "Réception et gestion des candidatures",
  "Tableau de bord vues / candidatures",
];

const PREMIUM_FEATURES = [
  "Rayon de diffusion étendu",
  "Mise en avant sur la carte",
  "Statistiques avancées",
];

export default function AbonnementPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-10 px-4 py-10">
      <PageHeader
        title="Choisissez votre formule"
        description="La publication d'offres sur GéoEmploi est un service payant, facturé mensuellement."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Standard</CardTitle>
            <CardDescription>
              La formule de référence pour recruter sur votre bassin
              d&apos;emploi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold">
              400 €
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / mois
              </span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {STANDARD_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full" render={<Link href="/employeur" />}>
              Souscrire et publier
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Premium
              <Badge variant="secondary">
                <Sparkles aria-hidden />
                Bientôt
              </Badge>
            </CardTitle>
            <CardDescription>
              Pour couvrir plusieurs départements et sortir du lot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold">
              Tarif
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                à définir
              </span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full" variant="outline" disabled>
              Arrive bientôt…
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Plus la zone de diffusion est large, plus l&apos;abonnement est élevé.
        Le paiement n&apos;est pas encore branché : « Souscrire » ouvre
        directement l&apos;espace employeur.
      </p>
    </main>
  );
}
