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
      zoom={6}
      className="h-full w-full"
    >
      <TileLayer
        url="https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM_0_19&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
        attribution='&copy; <a href="https://www.ign.fr">IGN-F/Géoportail</a>'
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
