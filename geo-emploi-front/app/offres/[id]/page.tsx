import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Eye,
  MapPin,
  Radius,
} from "lucide-react";
import { ApplyButton } from "@/components/listings/apply-button";
import { ReportDialog } from "@/components/listings/report-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getListing, searchListings } from "@/lib/api/offers";
import { getUser } from "@/lib/dal";
import { CONTRACT_LABELS, LISTING_STATUS_LABELS, formatDate } from "@/lib/labels";

export async function generateMetadata({ params }: PageProps<"/offres/[id]">) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Offre introuvable" };
  return { title: `${listing.title} — ${listing.city}` };
}

export default async function ListingPage({
  params,
}: PageProps<"/offres/[id]">) {
  const { id } = await params;
  const [listing, user] = await Promise.all([getListing(id), getUser()]);
  if (!listing) notFound();

  // Offres similaires : même type de contrat, demandées au backend plutôt que
  // filtrées après coup sur un lot complet.
  const similar = (await searchListings({ contract: listing.contract }))
    .filter((other) => other.id !== listing.id)
    .slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-10">
      <Link
        href="/offres"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à la carte
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{CONTRACT_LABELS[listing.contract]}</Badge>
          <Badge variant="secondary">{listing.salary}</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          {listing.title}
        </h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-4" aria-hidden />
            {listing.company}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {listing.address}, {listing.postalCode} {listing.city}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            Publiée le {formatDate(listing.publishedAt)}
          </span>
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <ApplyButton listingId={listing.id} role={user?.role ?? null} />
          <ReportDialog listingId={listing.id} listingTitle={listing.title} />
        </div>
      </header>

      {listing.status !== "publiee" ? (
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          Statut de cette offre : {LISTING_STATUS_LABELS[listing.status]}.
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Informations</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {listing.description}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {listing.skills.map((skill) => (
            <li key={skill}>
              <Badge variant="outline">{skill}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Radius className="size-4" aria-hidden />
              Rayon de diffusion
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {listing.radiusKm} km
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="size-4" aria-hidden />
              Vues
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {listing.views}
          </CardContent>
        </Card>
      </section>

      {similar.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Offres similaires</h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {similar.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/offres/${other.id}`}
                  className="block rounded-xl p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted"
                >
                  <span className="text-sm font-medium">{other.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {other.company} — {other.city}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
