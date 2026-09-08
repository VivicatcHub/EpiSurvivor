"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Crosshair, List, Map as MapIcon } from "lucide-react";
import { MapSkeleton } from "./map-skeleton";
import type { MapCanvasProps } from "./map-canvas";
import { EmptyState } from "@/components/layout/empty-state";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFilters } from "@/components/listings/listing-filters";
import { Button } from "@/components/ui/button";
import { distanceKm, formatDistance } from "@/lib/geo";
import { cn } from "@/lib/utils";
import type { BoundsBox, Listing } from "@/lib/schemas";

const MapCanvas: ComponentType<MapCanvasProps> = dynamic(
  () => import("./map-canvas"),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

const PANES = [
  { label: "Carte", icon: MapIcon },
  { label: "Offres", icon: List },
];

type GeoState = "idle" | "pending" | "refusee" | "indisponible";

export function MapShell({
  initialListings,
  unavailable = false,
}: {
  initialListings: Listing[];
  unavailable?: boolean;
}) {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState(initialListings);
  const [boundsBox, setBoundsBox] = useState<BoundsBox | null>(null);
  const [loading, setLoading] = useState(false);
  const [pane, setPane] = useState(0);
  const [position, setPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const q = searchParams.get("q") ?? "";
  const contract = searchParams.get("contract") ?? "";

  useEffect(() => {
    if (!boundsBox) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const search = new URLSearchParams({
        minLat: String(boundsBox.minLat),
        maxLat: String(boundsBox.maxLat),
        minLng: String(boundsBox.minLng),
        maxLng: String(boundsBox.maxLng),
      });
      if (q) search.set("q", q);
      if (contract) search.set("contract", contract);

      setLoading(true);
      try {
        const response = await fetch(`/api/offres?${search}`, {
          signal: controller.signal,
        });
        if (response.ok) setListings((await response.json()) as Listing[]);
      } catch {
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [boundsBox, q, contract]);

  const sorted = useMemo<{ listing: Listing; km?: number }[]>(() => {
    if (!position) return listings.map((listing) => ({ listing }));
    return listings
      .map((listing) => ({ listing, km: distanceKm(position, listing) }))
      .sort((a, b) => a.km - b.km);
  }, [listings, position]);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeoState("indisponible");
      return;
    }
    setGeoState("pending");
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({
          lat: result.coords.latitude,
          lng: result.coords.longitude,
        });
        setGeoState("idle");
        goToPane(0);
      },
      () => setGeoState("refusee"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    setPane(Math.round(scroller.scrollLeft / scroller.clientWidth));
  }, []);

  function goToPane(index: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({
      left: index * scroller.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative h-full">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain lg:snap-none lg:gap-4 lg:overflow-x-visible"
      >
        <div className="h-full w-full shrink-0 snap-center snap-always overflow-hidden lg:w-[62%] lg:rounded-2xl lg:ring-1 lg:ring-foreground/10">
          <MapCanvas
            listings={listings}
            onBoundsChange={setBoundsBox}
            focus={position}
          />
        </div>

        <div className="flex h-full w-full shrink-0 snap-center snap-always min-h-0 flex-col gap-3 px-4 pb-20 pt-3 lg:w-auto lg:flex-1 lg:p-0">
          <ListingFilters />

          <div className="space-y-1.5">
            <Button
              variant="institutional"
              size="sm"
              onClick={locate}
              disabled={geoState === "pending"}
            >
              <Crosshair data-icon="inline-start" />
              {geoState === "pending"
                ? "Localisation…"
                : position
                  ? "Recentrer sur ma position"
                  : "Voir les offres autour de moi"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {geoState === "refusee"
                ? "Position non partagée : la carte reste consultable dans son entier."
                : geoState === "indisponible"
                  ? "Votre navigateur ne permet pas la géolocalisation."
                  : "Votre position sert uniquement à trier les offres affichées. Elle n'est ni enregistrée ni transmise."}
            </p>
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading
              ? "Mise à jour des offres…"
              : `${listings.length} offre${listings.length > 1 ? "s" : ""}${
                  position ? " triées par distance" : " dans cette zone"
                }`}
          </p>
          <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {sorted.map(({ listing, km }) => (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  distance={km === undefined ? undefined : formatDistance(km)}
                />
              </li>
            ))}
            {listings.length === 0 ? (
              <li>
                {unavailable ? (
                  <EmptyState
                    title="Service momentanément indisponible"
                    description="Les offres ne peuvent pas être chargées pour l'instant. La carte reste consultable, réessayez dans un instant."
                  />
                ) : (
                  <EmptyState
                    title="Aucune offre dans ce secteur"
                    description="Déplacez la carte, élargissez le rayon ou retirez un filtre : de nouvelles offres sont publiées chaque jour."
                  />
                )}
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Affichage des offres"
        className="absolute bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 gap-1 rounded-full border border-border bg-background/90 p-1 shadow-lg backdrop-blur lg:hidden"
      >
        {PANES.map((item, index) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            aria-selected={pane === index}
            onClick={() => goToPane(index)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors",
              pane === index
                ? "bg-primary-surface font-medium text-primary-surface-foreground ring-primary/30"
                : "text-muted-foreground",
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
