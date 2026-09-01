import { MapSkeleton } from "@/components/map/map-skeleton";

export default function LoadingOffres() {
  return (
    <main className="h-[calc(100dvh-3.75rem)] overflow-hidden lg:p-4">
      <div className="h-full overflow-hidden lg:rounded-2xl lg:ring-1 lg:ring-foreground/10">
        <MapSkeleton />
      </div>
    </main>
  );
}
