"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoSession } from "@/lib/demo-session";

export function ApplyButton({
  listingId,
  className,
}: {
  listingId: string;
  className?: string;
}) {
  const { session } = useDemoSession();
  const [applied, setApplied] = useState(false);

  if (!session) {
    return (
      <Button
        className={className}
        render={<Link href={`/connexion?next=/offres/${listingId}`} />}
      >
        Se connecter pour postuler
      </Button>
    );
  }

  if (session.role !== "chercheur") {
    return (
      <Button className={className} disabled>
        Réservé aux chercheurs d&apos;emploi
      </Button>
    );
  }

  return (
    <Button
      className={className}
      disabled={applied}
      onClick={() => setApplied(true)}
    >
      {applied ? (
        <Check data-icon="inline-start" />
      ) : (
        <Zap data-icon="inline-start" />
      )}
      {applied ? "Offre attrapée !" : "Postuler"}
    </Button>
  );
}
