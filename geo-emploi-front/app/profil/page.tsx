import Link from "next/link";
import { DeleteAccountForm } from "@/components/profile/delete-account-form";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { BadgeGrid } from "@/components/profile/badge-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSeekerApplications, getSeekerProfile } from "@/lib/api/account";
import { requireRole } from "@/lib/dal";
import {
  APPLICATION_STATUS_LABELS,
  BADGES,
  WORK_PERMIT_GOAL,
  formatDate,
} from "@/lib/labels";

export const metadata = { title: "Mon profil" };

export default async function ProfilPage() {
  const user = await requireRole("job_seeker", "/profil");
  const [seeker, applications] = await Promise.all([
    getSeekerProfile(),
    getSeekerApplications(),
  ]);
  const remaining = Math.max(0, WORK_PERMIT_GOAL - seeker.caught);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10">
      <PageHeader
        title={seeker.name}
        description={[seeker.headline, seeker.city, seeker.availability]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Button variant="outline" render={<Link href="/offres" />}>
            Attraper des offres
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offres attrapées
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {seeker.caught}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Candidatures en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {applications.length}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Permis de Travailler JEB
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Progress value={(seeker.caught / WORK_PERMIT_GOAL) * 100} />
            <p>
              {remaining === 0
                ? "Débloqué 🎉"
                : `Encore ${remaining} offre${remaining > 1 ? "s" : ""} à attraper`}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Badges</h2>
        <BadgeGrid badges={BADGES} caught={seeker.caught} />
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Compétences</h2>
          {seeker.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune compétence renseignée pour l&apos;instant.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {seeker.skills.map((skill) => (
                <li key={skill}>
                  <Badge variant="outline">{skill}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-medium">Disponibilité</h2>
          <p className="text-sm text-muted-foreground">{seeker.availability}</p>
          {seeker.city ? (
            <p className="text-sm text-muted-foreground">
              Zone de recherche : {seeker.city} et alentours
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Expériences</h2>
        {seeker.experiences.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune expérience enregistrée.
          </p>
        ) : (
          <ul className="space-y-3">
            {seeker.experiences.map((experience) => (
              <li
                key={experience.id}
                className="rounded-xl p-4 ring-1 ring-foreground/10"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {experience.role} — {experience.company}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {experience.period}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {experience.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Suivi des candidatures</h2>
        {applications.length === 0 ? (
          <EmptyState
            title="Aucune candidature envoyée"
            description="Repérez une offre sur la carte et postulez : vous suivrez ici chaque étape, de l'envoi à l'entretien."
            action={
              <Button size="sm" render={<Link href="/offres" />}>
                Ouvrir la carte
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offre</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Envoyée le</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/offres/${application.listingId}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {application.listingTitle}
                    </Link>
                  </TableCell>
                  <TableCell>{application.listingCompany}</TableCell>
                  <TableCell>{formatDate(application.sentAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        application.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {APPLICATION_STATUS_LABELS[application.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <DeleteAccountForm email={user.email} />
    </main>
  );
}
