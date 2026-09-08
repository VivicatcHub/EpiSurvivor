"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Flag } from "lucide-react";
import { reportListing } from "@/app/actions/offers";
import type { FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Envoi…" : "Envoyer le signalement"}
    </Button>
  );
}

export function ReportDialog({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(
    reportListing,
    {},
  );

  if (state.ok) {
    return (
      <p className="self-center text-sm text-muted-foreground">
        Signalement transmis à la modération. Merci.
      </p>
    );
  }

  return (
    <div className="w-full">
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        <Flag data-icon="inline-start" />
        Signaler cette offre
      </Button>

      {open ? (
        <form
          action={action}
          className="mt-3 space-y-3 rounded-xl p-4 ring-1 ring-foreground/10"
        >
          <input type="hidden" name="listingId" value={listingId} />
          <Label htmlFor="reason">
            Pourquoi signalez-vous « {listingTitle} » ?
          </Label>
          <Textarea
            id="reason"
            name="reason"
            required
            placeholder="Offre frauduleuse, contenu inapproprié, entreprise inexistante…"
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
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
