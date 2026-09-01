"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportDialog({ listingTitle }: { listingTitle: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
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
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
          className="mt-3 space-y-3 rounded-xl p-4 ring-1 ring-foreground/10"
        >
          <Label htmlFor="reason">
            Pourquoi signalez-vous « {listingTitle} » ?
          </Label>
          <Textarea
            id="reason"
            name="reason"
            required
            placeholder="Offre frauduleuse, contenu inapproprié, entreprise inexistante…"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Envoyer le signalement
            </Button>
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
