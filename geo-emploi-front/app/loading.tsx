import { BrandMark } from "@/components/brand/brand-block";

export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20"
    >
      <BrandMark size="md" className="animate-pulse" />
      <p className="font-sans text-sm text-muted-foreground">
        Chargement en cours…
      </p>
      <div aria-hidden className="flex h-1 w-24 overflow-hidden rounded-full">
        <span className="flex-1 bg-tricolore-bleu" />
        <span className="flex-1 bg-tricolore-blanc" />
        <span className="flex-1 bg-tricolore-rouge" />
      </div>
    </main>
  );
}
