"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Zap } from "lucide-react";
import { applyToListing } from "@/app/actions/offers";
import type { FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Role } from "@/lib/schemas";

function Submit({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className={className} disabled={pending}>
      <Zap data-icon="inline-start" />
      {pending ? "Envoi…" : "Envoyer ma candidature"}
    </Button>
  );
}

export function ApplyButton({
  listingId,
  role,
  className,
}: {
  listingId: string;
  role: Role | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(
    applyToListing,
    {},
  );

  if (!role) {
    return (
      <Button
        className={className}
        render={<Link href={`/connexion?next=/offres/${listingId}`} />}
      >
        Se connecter pour postuler
      </Button>
    );
  }

  if (role !== "job_seeker") {
    return (
      <Button className={className} disabled>
        Réservé aux chercheurs d&apos;emploi
      </Button>
    );
  }

  if (state.ok) {
    return (
      <p className="flex items-center gap-1.5 self-center text-sm text-primary">
        <Check className="size-4" aria-hidden />
        Candidature envoyée ! Suivez-la depuis votre profil.
      </p>
    );
  }

  if (!open) {
    return (
      <Button className={className} onClick={() => setOpen(true)}>
        <Zap data-icon="inline-start" />
        Postuler
      </Button>
    );
  }

  return (
    <form
      action={action}
      className="w-full space-y-3 rounded-xl p-4 ring-1 ring-foreground/10"
    >
      <input type="hidden" name="listingId" value={listingId} />
      <Label htmlFor="apply-message">Votre message à l&apos;employeur</Label>
      <Textarea
        id="apply-message"
        name="message"
        rows={4}
        required
        placeholder="Présentez-vous en quelques lignes."
      />
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Submit />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
