import Link from "next/link";
import { Building2, Map, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AUDIENCES = [
  {
    icon: Map,
    title: "Chercheur d'emploi",
    description:
      "Explorez la carte, attrapez les offres autour de vous, collectez des badges et débloquez le Permis de Travailler JEB.",
    href: "/offres",
    cta: "Ouvrir la carte",
  },
  {
    icon: Building2,
    title: "Employeur",
    description:
      "Publiez vos offres géolocalisées, choisissez votre rayon de diffusion et suivez les candidatures reçues.",
    href: "/employeur/abonnement",
    cta: "Voir les abonnements",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <section className="max-w-2xl space-y-5">
        <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground ring-1 ring-foreground/10">
          <Trophy className="size-3.5 text-primary" aria-hidden />
          Ministère du Job et Bonheur — service public GéoEmploi
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-primary text-balance sm:text-5xl">
          Les offres d&apos;emploi apparaissent autour de vous.
        </h1>
        <p className="text-lg text-muted-foreground text-pretty">
          GéoEmploi affiche les offres géolocalisées sur une carte ouverte à
          tous. Approchez-vous, attrapez l&apos;offre, postulez en un geste.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" render={<Link href="/offres" />}>
            Voir la carte
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/inscription" />}
          >
            Créer un compte
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Aucun compte n&apos;est nécessaire pour consulter la carte.
        </p>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-2">
        {AUDIENCES.map((audience) => (
          <Card key={audience.title}>
            <CardHeader>
              <audience.icon className="size-5 text-primary" aria-hidden />
              <CardTitle>{audience.title}</CardTitle>
              <CardDescription>{audience.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={audience.href} />}
              >
                {audience.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
