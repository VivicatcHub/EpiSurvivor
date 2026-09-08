import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Transparence" };

const SECTIONS = [
  {
    title: "Publication gratuite",
    description:
      "Publier une offre sur GéoEmploi est gratuit pour tout employeur, sans abonnement ni formule payante.",
  },
  {
    title: "Précision de la localisation",
    description:
      "Une offre s'affiche au centre de sa commune (ou de son arrondissement pour Paris, Lyon et Marseille), jamais à l'adresse exacte. L'adresse saisie par l'employeur sert uniquement à déterminer la commune et n'apparaît nulle part à une précision plus fine sur la carte.",
  },
  {
    title: "Durée de conservation",
    description:
      "Les offres sont archivées automatiquement 30 jours après publication et disparaissent alors de la carte. La géolocalisation d'un visiteur ou d'un candidat n'est jamais transmise ni enregistrée par le serveur : elle reste sur son navigateur, le temps de la session, pour calculer les distances affichées.",
  },
  {
    title: "Délégué à la protection des données",
    description:
      "Pour toute question sur vos données personnelles : dpo@job-et-bonheur.fr.",
  },
];

export default function TransparencePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10">
      <PageHeader
        title="Transparence"
        description="Ce que GéoEmploi fait de vos données, et ce qu'il ne fait pas."
      />
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription className="text-sm text-foreground/80">
                {section.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  );
}
