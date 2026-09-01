"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { ComponentType } from "react";
import { MapSkeleton } from "./map-skeleton";
import type { MapCanvasProps } from "./map-canvas";
import type { Listing, BoundsBox } from "@/lib/schemas";

const MapCanvas: ComponentType<MapCanvasProps> = dynamic(
  () => import("./map-canvas"),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

export function MapShell({ initialListings }: { initialListings: Listing[] }) {
  const [listings] = useState(initialListings);
  const [, setBoundsBox] = useState<BoundsBox | null>(null);

  return (
    <div className="flex h-full gap-6 rounded-3xl border border-current/25 p-6">
      <div className="h-full w-[65%] shrink-0 overflow-hidden rounded-2xl border border-current/25">
        <MapCanvas listings={listings} onBoundsChange={setBoundsBox} />
      </div>
      <ul className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {listings.map((listing) => (
          <li key={listing.id}>
            <a
              href={listing.url}
              className="block rounded-xl border border-current/25 px-4 py-3 transition-colors hover:bg-current/10"
            >
              <span className="font-medium">{listing.title}</span>
              <span className="block text-sm opacity-70">
                {listing.company} - {listing.city}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
