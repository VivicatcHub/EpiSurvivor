"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import type { Listing, BoundsBox } from "@/lib/schemas";

export type MapCanvasProps = {
  listings: Listing[];
  onBoundsChange: (bounds: BoundsBox) => void;
};

const icon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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

export default function MapCanvas({
  listings,
  onBoundsChange,
}: MapCanvasProps) {
  return (
    <MapContainer center={[46.6, 2.4]} zoom={6} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <BoundsWatcher onChange={onBoundsChange} />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={icon}
        >
          <Popup>
            <span className="font-medium">{listing.title}</span>
            <br />
            {listing.company} - {listing.city}
            <br />
            <a href={listing.url}>Plus...</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
