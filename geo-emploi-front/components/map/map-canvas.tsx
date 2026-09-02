"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Fragment, useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { CHARTE_BLEU, markerIcon } from "./marker-icon";
import type { BoundsBox, Listing } from "@/lib/schemas";

export type MapCanvasProps = {
  listings: Listing[];
  onBoundsChange: (bounds: BoundsBox) => void;
  showRadius?: boolean;
  focus?: { lat: number; lng: number } | null;
};

function BoundsWatcher({
  onChange,
}: {
  onChange: (bounds: BoundsBox) => void;
}) {
  useMapEvents({
    moveend: (event) => {
      const bound = event.target.getBounds();
      onChange({
        minLat: bound.getSouth(),
        maxLat: bound.getNorth(),
        minLng: bound.getWest(),
        maxLng: bound.getEast(),
      });
    },
  });
  return null;
}

function Recenter({ focus }: { focus?: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], 18, { duration: 4.2 });
  }, [focus, map]);
  return null;
}

export default function MapCanvas({
  listings,
  onBoundsChange,
  showRadius = false,
  focus,
}: MapCanvasProps) {
  return (
    <MapContainer center={[46.6, 2.4]} zoom={6} className="h-full w-full">
      <TileLayer
        url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM_0_19&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
        attribution='&copy; <a href="https://www.ign.fr">IGN-F/Géoportail</a>'
      />
      <BoundsWatcher onChange={onBoundsChange} />
      <Recenter focus={focus} />
      {focus ? (
        <Circle
          center={[focus.lat, focus.lng]}
          radius={10}
          pathOptions={{
            color: CHARTE_BLEU,
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.12,
          }}
        />
      ) : null}
      {listings.map((listing) => (
        <Fragment key={listing.id}>
          {showRadius ? (
            <Circle
              center={[listing.lat, listing.lng]}
              radius={listing.radiusKm * 1000}
              pathOptions={{
                color: CHARTE_BLEU,
                weight: 1,
                opacity: 0.4,
                fillOpacity: 0.06,
              }}
            />
          ) : null}
          <Marker position={[listing.lat, listing.lng]} icon={markerIcon}>
            <Popup>
              <span className="font-medium">{listing.title}</span>
              <br />
              {listing.company} — {listing.city}
              <br />
              {listing.contract} · {listing.salary}
              <br />
              <Link href={`/offres/${listing.id}`}>
                Voir l&apos;offre et postuler
              </Link>
            </Popup>
          </Marker>
        </Fragment>
      ))}
    </MapContainer>
  );
}
