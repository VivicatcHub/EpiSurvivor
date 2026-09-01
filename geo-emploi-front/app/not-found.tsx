import Link from "next/link";
import { StatusPage } from "@/components/layout/status-page";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Cette page n'existe pas ou n'existe plus."
      description="L'offre a peut-être été archivée : les annonces sont retirées automatiquement au bout de 30 jours. La carte, elle, reste ouverte à tous, sans compte."
      actions={
        <>
          <Button size="lg" render={<Link href="/offres" />}>
            Ouvrir la carte des offres
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/" />}>
            Retour à l&apos;accueil
          </Button>
        </>
      }
    />
  );
}
