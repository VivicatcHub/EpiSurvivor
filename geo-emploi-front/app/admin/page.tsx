import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APPLICATIONS, LISTINGS, USERS } from "@/lib/mock-data";
import type { AccountStatus, ListingStatus, Role } from "@/lib/schemas";

export const metadata = { title: "Administration" };

const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  publiee: "Publiée",
  en_attente: "En attente",
  signalee: "Signalée",
  archivee: "Archivée",
};

const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  actif: "Actif",
  suspendu: "Suspendu",
  en_attente: "En attente",
};

const ROLE_LABELS: Record<Role, string> = {
  chercheur: "Chercheur",
  employeur: "Employeur",
  admin: "Admin",
};

export default function AdminPage() {
  const metrics = [
    {
      label: "Offres publiées",
      value: LISTINGS.filter((l) => l.status === "publiee").length,
    },
    {
      label: "À modérer",
      value: LISTINGS.filter((l) => l.status !== "publiee").length,
    },
    { label: "Comptes", value: USERS.length },
    { label: "Candidatures", value: APPLICATIONS.length },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10">
      <PageHeader
        title="Administration"
        description="Gestion des offres et des utilisateurs, métriques nationales."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} size="sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {metric.value}
            </CardContent>
          </Card>
        ))}
      </section>

      <Tabs defaultValue="offres" className="space-y-4">
        <TabsList>
          <TabsTrigger value="offres">Offres</TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="offres">
          {LISTINGS.length === 0 ? (
            <EmptyState
              title="Aucune offre à modérer"
              description="Les offres publiées et les signalements remonteront ici."
            />
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intitulé</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Modération</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LISTINGS.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/offres/${listing.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {listing.title}
                    </Link>
                  </TableCell>
                  <TableCell>{listing.company}</TableCell>
                  <TableCell>{listing.city}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        listing.status === "signalee"
                          ? "destructive"
                          : listing.status === "publiee"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {LISTING_STATUS_LABELS[listing.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button size="xs" variant="outline">
                      Valider
                    </Button>
                    <Button size="xs" variant="destructive">
                      Retirer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="utilisateurs">
          {USERS.length === 0 ? (
            <EmptyState
              title="Aucun compte enregistré"
              description="Les inscriptions de chercheurs d'emploi et d'employeurs apparaîtront ici."
            />
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {USERS.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "suspendu"
                          ? "destructive"
                          : user.status === "actif"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {ACCOUNT_STATUS_LABELS[user.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="xs" variant="outline">
                      {user.status === "suspendu" ? "Réactiver" : "Suspendre"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
