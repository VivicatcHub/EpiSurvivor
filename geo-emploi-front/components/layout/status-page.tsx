import { BrandBlock } from "@/components/brand/brand-block";

export function StatusPage({
  code,
  title,
  description,
  actions,
}: {
  code: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-20">
      <BrandBlock size="md" className="self-start" />
      <p className="font-sans text-sm tracking-[0.18em] text-muted-foreground uppercase">
        Erreur {code}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-primary text-balance sm:text-4xl">
        {title}
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground text-pretty">
        {description}
      </p>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      <div aria-hidden className="mt-4 flex h-1 w-40">
        <span className="flex-1 bg-tricolore-bleu" />
        <span className="flex-1 bg-tricolore-blanc" />
        <span className="flex-1 bg-tricolore-rouge" />
      </div>
    </main>
  );
}
