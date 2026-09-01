"use client";

import "leaflet/dist/leaflet.css";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { CHARTE_BLEU, markerIcon } from "./marker-icon";

export type LocationPickerCanvasProps = {
  value: { lat: number; lng: number };
  radiusKm: number;
  onChange: (position: { lat: number; lng: number }) => void;
};

function ClickHandler({
  onChange,
}: {
  onChange: (position: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click: (event) =>
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
}

export default function LocationPickerCanvas({
  value,
  radiusKm,
  onChange,
}: LocationPickerCanvasProps) {
  return (
    <MapContainer
      center={[value.lat, value.lng]}
      zoom={12}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <ClickHandler onChange={onChange} />
      <Circle
        center={[value.lat, value.lng]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: CHARTE_BLEU,
          weight: 1,
          opacity: 0.5,
          fillOpacity: 0.08,
        }}
      />
      <Marker
        position={[value.lat, value.lng]}
        icon={markerIcon}
        draggable
        eventHandlers={{
          dragend: (event) => {
            const { lat, lng } = event.target.getLatLng();
            onChange({ lat, lng });
          },
        }}
      />
    </MapContainer>
  );
}
