"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp, type FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/schemas";

const ROLES: Role[] = ["job_seeker", "employer"];

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? "Envoi…" : label}
    </Button>
  );
}

export function AuthForm({ mode }: { mode: "connexion" | "inscription" }) {
  const searchParams = useSearchParams();
  const isSignUp = mode === "inscription";
  const [role, setRole] = useState<Role>("job_seeker");

  const [state, action] = useActionState<FormState, FormData>(
    isSignUp ? signUp : signIn,
    {},
  );

  // Redirection post-connexion. `signIn` refuse toute valeur qui ne soit pas
  // un chemin interne : le champ n'est pas un vecteur d'open redirect.
  const next = searchParams.get("next");

  return (
    <form action={action} className="space-y-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <input type="hidden" name="role" value={role} />

      {isSignUp && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Je suis</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                aria-pressed={role === value}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm ring-1 ring-foreground/10 transition-colors",
                  role === value
                    ? "bg-primary-surface font-medium text-primary-surface-foreground ring-primary/30"
                    : "hover:bg-muted",
                )}
              >
                {ROLE_LABELS[value]}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {isSignUp ? (
        <div className="space-y-2">
          <Label htmlFor="name">
            {role === "employer" ? "Raison sociale" : "Nom complet"}
          </Label>
          <Input
            id="name"
            name="name"
            required
            placeholder={
              role === "employer" ? "Rhône Numérique" : "Camille Aubert"
            }
          />
        </div>
      ) : null}

      {isSignUp && role === "employer" ? (
        <div className="space-y-2">
          <Label htmlFor="siret">SIRET (facultatif)</Label>
          <Input
            id="siret"
            name="siret"
            inputMode="numeric"
            maxLength={14}
            placeholder="81234567800021"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="camille.aubert@example.fr"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={isSignUp ? 8 : undefined}
        />
        {isSignUp ? (
          <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
        ) : null}
      </div>

      {isSignUp && role === "employer" ? (
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          La publication d&apos;offres nécessite un abonnement à 400 € / mois.
          Vous choisirez votre formule à l&apos;étape suivante.
        </p>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Submit label={isSignUp ? "Créer mon compte" : "Se connecter"} />

      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "Déjà un compte ? " : "Pas encore de compte ? "}
        <Link
          href={isSignUp ? "/connexion" : "/inscription"}
          className="underline underline-offset-4"
        >
          {isSignUp ? "Se connecter" : "Créer un compte"}
        </Link>
      </p>
    </form>
  );
}
