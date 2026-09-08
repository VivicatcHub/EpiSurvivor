"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteAccount, type FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      {pending ? "Suppression…" : "Supprimer définitivement mon compte"}
    </Button>
  );
}

export function DeleteAccountForm({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(
    deleteAccount,
    {},
  );

  return (
    <section className="space-y-3 rounded-xl border border-destructive/30 p-4">
      <h2 className="text-lg font-medium">Supprimer mon compte</h2>
      <p className="text-sm text-muted-foreground">
        Vos données personnelles, vos candidatures et votre historique sont
        effacés immédiatement et définitivement.
      </p>

      {open ? (
        <form action={action} className="space-y-3">
          <Label htmlFor="confirm">
            Saisissez <span className="font-mono">{email}</span> pour confirmer
          </Label>
          <Input
            id="confirm"
            name="confirm"
            autoComplete="off"
            required
            placeholder={email}
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
      ) : (
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          <Trash2 data-icon="inline-start" />
          Supprimer mon compte
        </Button>
      )}
    </section>
  );
}
