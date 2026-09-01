"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_HOME, ROLE_LABELS, useDemoSession } from "@/lib/demo-session";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/schemas";

const ROLES: Role[] = ["chercheur", "employeur"];

export function AuthForm({ mode }: { mode: "connexion" | "inscription" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useDemoSession();
  const [role, setRole] = useState<Role>("chercheur");
  const isSignUp = mode === "inscription";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const name =
      String(data.get("name") ?? "") || email.split("@")[0] || "Invité";

    signIn({ role, name, email });
    router.push(searchParams.get("next") ?? ROLE_HOME[role]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "inscription" && (
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
            {role === "employeur" ? "Raison sociale" : "Nom complet"}
          </Label>
          <Input id="name" name="name" required placeholder="Camille Aubert" />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
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
          required
          minLength={4}
        />
      </div>

      {isSignUp && role === "employeur" ? (
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          La publication d&apos;offres nécessite un abonnement à 400 € / mois.
          Vous choisirez votre formule à l&apos;étape suivante.
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg">
        {isSignUp ? "Créer mon compte" : "Se connecter"}
      </Button>

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
