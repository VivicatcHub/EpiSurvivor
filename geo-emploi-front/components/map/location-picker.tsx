"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { MapSkeleton } from "./map-skeleton";
import type { LocationPickerCanvasProps } from "./location-picker-canvas";

const LocationPickerCanvas: ComponentType<LocationPickerCanvasProps> = dynamic(
  () => import("./location-picker-canvas"),
  { ssr: false, loading: () => <MapSkeleton /> },
);

export function LocationPicker(props: LocationPickerCanvasProps) {
  return <LocationPickerCanvas {...props} />;
}
