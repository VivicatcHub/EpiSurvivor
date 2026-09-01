"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandBlock } from "@/components/brand/brand-block";

const LINKS = [
  { href: "/offres", label: "Carte des offres" },
  { href: "/inscription", label: "Créer un compte" },
  { href: "/connexion", label: "Connexion" },
];

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/offres") return null;

  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div aria-hidden className="flex h-1">
        <span className="flex-1 bg-tricolore-bleu" />
        <span className="flex-1 bg-tricolore-blanc" />
        <span className="flex-1 bg-tricolore-rouge" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <BrandBlock size="md" plate={false} />
          <p className="max-w-sm text-sm text-muted-foreground">
            GéoEmploi est un service public du Ministère du Job et Bonheur. Les
            offres sont géolocalisées à la commune et consultables sans compte.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-primary underline-offset-4 hover:underline"
            >
              {link.label}
            </Link>
          ))}
          <span className="text-muted-foreground">
            Mentions légales et données personnelles — en cours de rédaction
          </span>
        </nav>
      </div>
    </footer>
  );
}
