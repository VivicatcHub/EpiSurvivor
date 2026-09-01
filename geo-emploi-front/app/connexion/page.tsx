import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { BrandBlock } from "@/components/brand/brand-block";

export const metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      {/* Bloc-marque en haut à gauche du bloc de contenu, zone de protection
          comprise : la page de connexion est chartée comme le reste du service. */}
      <BrandBlock size="md" className="mb-8 self-start" />
      <h1 className="text-2xl font-semibold tracking-tight text-primary">
        Connexion à GéoEmploi
      </h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        Prototype : aucun mot de passe n&apos;est vérifié, choisissez simplement
        le rôle à démontrer.
      </p>
      <Suspense>
        <AuthForm mode="connexion" />
      </Suspense>
    </main>
  );
}
