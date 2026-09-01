import { BrandMark } from "@/components/brand/brand-block";

export function MapSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full w-full flex-col items-center justify-center gap-3 bg-primary-surface/60"
    >
      <BrandMark size="md" className="animate-pulse" />
      <p className="font-sans text-sm text-primary-surface-foreground">
        Chargement de la carte des offres…
      </p>
      <div aria-hidden className="flex h-1 w-24 overflow-hidden rounded-full">
        <span className="flex-1 bg-tricolore-bleu" />
        <span className="flex-1 bg-tricolore-blanc" />
        <span className="flex-1 bg-tricolore-rouge" />
      </div>
    </div>
  );
}
