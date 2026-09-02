import Link from "next/link";
import { Plus } from "lucide-react";
import { ApplicationStatusForm } from "@/components/employer/application-status-form";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCompany,
  getCompanyListings,
  getReceivedApplications,
} from "@/lib/api/account";
import { requireRole } from "@/lib/dal";
import { LISTING_STATUS_LABELS, formatDate } from "@/lib/labels";

export const metadata = { title: "Espace employeur" };

export default async function EmployeurPage() {
  await requireRole("employer", "/employeur");
  const [company, listings, applications] = await Promise.all([
    getCompany(),
    getCompanyListings(),
    getReceivedApplications(),
  ]);
  const views = listings.reduce((total, listing) => total + listing.views, 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10">
      <PageHeader
        title={company.name}
        description="Ajoutez, modifiez et suivez vos offres géolocalisées."
        actions={
          <Button render={<Link href="/employeur/offres/nouvelle" />}>
            <Plus data-icon="inline-start" />
            Nouvelle offre
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offres en ligne
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {listings.filter((listing) => listing.status === "publiee").length}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vues cumulées
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{views}</CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Candidatures reçues
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {applications.length}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Mes offres</h2>
        {listings.length === 0 ? (
          <EmptyState
            title="Aucune offre publiée"
            description="Publiez votre première offre géolocalisée : elle apparaîtra sur la carte publique dès sa validation."
            action={
              <Button
                size="sm"
                render={<Link href="/employeur/offres/nouvelle" />}
              >
                Publier une offre
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intitulé</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Rayon</TableHead>
                <TableHead>Vues</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{listing.title}</TableCell>
                  <TableCell>{listing.city}</TableCell>
                  <TableCell>{listing.radiusKm} km</TableCell>
                  <TableCell>{listing.views}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        listing.status === "publiee"
                          ? "secondary"
                          : listing.status === "signalee" ||
                              listing.status === "refusee"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {LISTING_STATUS_LABELS[listing.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/offres/${listing.id}`} />}
                    >
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Candidatures reçues</h2>
        {applications.length === 0 ? (
          <EmptyState
            title="Aucune candidature reçue"
            description="Vous serez notifié dès qu'un chercheur d'emploi postulera à l'une de vos offres."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidat</TableHead>
                <TableHead>Offre</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Reçue le</TableHead>
                <TableHead className="text-right">Suivi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    {application.seekerName}
                  </TableCell>
                  <TableCell>{application.listingTitle}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {application.message}
                  </TableCell>
                  <TableCell>{formatDate(application.sentAt)}</TableCell>
                  <TableCell className="text-right">
                    <ApplicationStatusForm
                      applicationId={application.id}
                      status={application.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </main>
  );
}
