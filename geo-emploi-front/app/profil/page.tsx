import Link from "next/link";
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
import {
  BADGES,
  SEEKER,
  WORK_PERMIT_GOAL,
  getApplicationsForSeeker,
  getListing,
} from "@/lib/mock-data";
import type { ApplicationStatus } from "@/lib/schemas";

export const metadata = { title: "Mon profil" };

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  envoyee: "Envoyée",
  vue: "Vue par l'employeur",
  entretien: "Entretien",
  refusee: "Refusée",
};

export default function ProfilPage() {
  const applications = getApplicationsForSeeker(SEEKER.id);
  const remaining = Math.max(0, WORK_PERMIT_GOAL - SEEKER.caught);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10">
      <PageHeader
        title={SEEKER.name}
        description={`${SEEKER.headline} · ${SEEKER.city} · ${SEEKER.availability}`}
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
            {SEEKER.caught}
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
            <Progress value={(SEEKER.caught / WORK_PERMIT_GOAL) * 100} />
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
        <BadgeGrid badges={BADGES} caught={SEEKER.caught} />
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Compétences</h2>
          <ul className="flex flex-wrap gap-1.5">
            {SEEKER.skills.map((skill) => (
              <li key={skill}>
                <Badge variant="outline">{skill}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-medium">Disponibilité</h2>
          <p className="text-sm text-muted-foreground">{SEEKER.availability}</p>
          <p className="text-sm text-muted-foreground">
            Zone de recherche : {SEEKER.city} et alentours
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Expériences</h2>
        <ul className="space-y-3">
          {SEEKER.experiences.map((experience) => (
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
            {applications.map((application) => {
              const listing = getListing(application.listingId);
              return (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    {listing ? (
                      <Link
                        href={`/offres/${listing.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {listing.title}
                      </Link>
                    ) : (
                      "Offre archivée"
                    )}
                  </TableCell>
                  <TableCell>{listing?.company ?? "—"}</TableCell>
                  <TableCell>{application.sentAt}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        application.status === "refusee"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {STATUS_LABELS[application.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          </Table>
        )}
      </section>
    </main>
  );
}
