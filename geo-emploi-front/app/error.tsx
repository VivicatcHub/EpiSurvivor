"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StatusPage } from "@/components/layout/status-page";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="500"
      title="Le service rencontre une difficulté."
      description="L'incident a été enregistré. Vous pouvez réessayer immédiatement : la carte des offres reste consultable sans compte."
      actions={
        <>
          <Button size="lg" onClick={() => retry()}>
            Réessayer
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/offres" />}>
            Ouvrir la carte des offres
          </Button>
        </>
      }
    />
  );
}
