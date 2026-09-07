import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/schemas";

export function ListingCard({
  listing,
  distance,
  className,
}: {
  listing: Listing;
  distance?: string;
  className?: string;
}) {
  return (
    <Link
      href={`/offres/${listing.id}`}
      className={cn(
        "block rounded-xl p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium">{listing.title}</span>
        <Badge variant="outline">{CONTRACT_LABELS[listing.contract]}</Badge>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Building2 className="size-3.5" aria-hidden />
        {listing.company}
        <MapPin className="ml-1.5 size-3.5" aria-hidden />
        {listing.city}
      </p>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        {listing.salary}
        {distance ? (
          <span className="font-sans text-xs font-medium text-primary">
            {distance}
          </span>
        ) : null}
      </p>
    </Link>
  );
}
