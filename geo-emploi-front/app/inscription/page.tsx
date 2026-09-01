import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { BrandBlock } from "@/components/brand/brand-block";

export const metadata = { title: "Créer un compte" };

export default function InscriptionPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <BrandBlock size="md" className="mb-8 self-start" />
      <h1 className="text-2xl font-semibold tracking-tight text-primary">
        Créer un compte GéoEmploi
      </h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">
        Chercheur d&apos;emploi ou employeur : le parcours s&apos;adapte à votre
        profil.
      </p>
      <Suspense>
        <AuthForm mode="inscription" />
      </Suspense>
    </main>
  );
}
