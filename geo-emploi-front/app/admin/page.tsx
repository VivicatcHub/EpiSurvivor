import Link from "next/link";
import { AccountStatusForm } from "@/components/admin/account-status-form";
import { ModerationForm } from "@/components/admin/moderation-form";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
import {
  getAllListings,
  getAllReports,
  getAllUsers,
  getMetrics,
} from "@/lib/api/account";
import { requireRole } from "@/lib/dal";
import {
  ACCOUNT_STATUS_LABELS,
  LISTING_STATUS_LABELS,
  ROLE_LABELS,
  formatDate,
} from "@/lib/labels";

export const metadata = { title: "Administration" };

export default async function AdminPage() {
  const admin = await requireRole("admin", "/admin");
  const [metrics, listings, users, reports] = await Promise.all([
    getMetrics(),
    getAllListings(),
    getAllUsers(),
    getAllReports(),
  ]);

  const tiles = [
    { label: "Offres publiées", value: metrics.publishedListings },
    { label: "En attente", value: metrics.pendingListings },
    { label: "Offres signalées", value: metrics.reportedListings },
    { label: "Comptes", value: metrics.accounts },
    { label: "Candidatures", value: metrics.applications },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10">
      <PageHeader
        title="Administration"
        description="Gestion des offres et des utilisateurs, métriques nationales."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Card key={tile.label} size="sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tile.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {tile.value}
            </CardContent>
          </Card>
        ))}
      </section>

      <Tabs defaultValue="offres" className="space-y-4">
        <TabsList>
          <TabsTrigger value="offres">Offres</TabsTrigger>
          <TabsTrigger value="signalements">
            Signalements ({reports.filter((r) => r.status === "open").length})
          </TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="offres">
          {listings.length === 0 ? (
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
                {listings.map((listing) => (
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
                          listing.status === "signalee" ||
                          listing.status === "refusee"
                            ? "destructive"
                            : listing.status === "publiee"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {LISTING_STATUS_LABELS[listing.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ModerationForm
                        listingId={listing.id}
                        status={listing.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="signalements">
          {reports.length === 0 ? (
            <EmptyState
              title="Aucun signalement"
              description="Les offres signalées par les visiteurs apparaîtront ici, avec leur motif."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offre</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Reçu le</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">Modération</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/offres/${report.listingId}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {report.listingTitle}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-sm text-muted-foreground">
                      {report.reason}
                    </TableCell>
                    <TableCell>{formatDate(report.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === "open" ? "destructive" : "outline"
                        }
                      >
                        {report.status === "open" ? "À traiter" : "Traité"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {report.status === "open" ? (
                        <ModerationForm listingId={report.listingId} />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="utilisateurs">
          {users.length === 0 ? (
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
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "suspended"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {ACCOUNT_STATUS_LABELS[user.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Un administrateur ne peut pas se suspendre lui-même :
                          le backend le refuse, on n'offre pas le geste. */}
                      {user.id === admin.id ? (
                        <span className="text-xs text-muted-foreground">
                          Vous
                        </span>
                      ) : (
                        <AccountStatusForm
                          accountId={user.id}
                          status={user.status}
                        />
                      )}
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
