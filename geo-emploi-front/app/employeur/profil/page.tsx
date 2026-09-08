import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { getCompany } from "@/lib/api/account";
import { requireRole } from "@/lib/dal";

export const metadata = { title: "Profil entreprise" };

export default async function EmployeurProfilPage() {
  await requireRole("employer", "/employeur/profil");
  const company = await getCompany();

  const infoRows: [string, string][] = [
    ["Raison sociale", company.name],
    ["SIRET", company.siret || "Non renseigné"],
    ["Secteur", company.sector || "Non renseigné"],
    ["Ville", company.city || "Non renseignée"],
    ["Contact", company.contactEmail],
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-10">
      <PageHeader
        title="Profil entreprise"
        description="Informations de l'entreprise et publication d'offres."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              Visibles par les chercheurs d&apos;emploi sur vos offres.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {infoRows.map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publication d&apos;offres</CardTitle>
            <CardDescription>
              Gratuite, sans abonnement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Rayon de diffusion : jusqu&apos;à {company.radiusKm} km autour de
              vos établissements.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
