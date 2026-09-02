"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { BrandBlock } from "@/components/brand/brand-block";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";
import { ROLE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Role, SessionUser } from "@/lib/schemas";

const NAV_BY_ROLE: Record<Role, { href: string; label: string }[]> = {
  job_seeker: [
    { href: "/offres", label: "Carte" },
    { href: "/profil", label: "Mon profil" },
  ],
  employer: [
    { href: "/offres", label: "Carte" },
    { href: "/employeur", label: "Mes offres" },
    { href: "/employeur/profil", label: "Entreprise" },
  ],
  admin: [
    { href: "/offres", label: "Carte" },
    { href: "/admin", label: "Administration" },
  ],
};

const PUBLIC_NAV = [{ href: "/offres", label: "Carte des offres" }];

/**
 * `user` vient du layout serveur : l'en-tête ne devine pas la session côté
 * client, il affiche celle que le serveur a vérifiée. Pas de clignotement
 * « déconnecté puis connecté » au premier rendu.
 */
export function SiteHeader({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const links = user ? NAV_BY_ROLE[user.role] : PUBLIC_NAV;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      {/* Filet tricolore de la charte, repris du bloc-marque. */}
      <div aria-hidden className="flex h-1">
        <span className="flex-1 bg-tricolore-bleu" />
        <span className="flex-1 bg-tricolore-blanc" />
        <span className="flex-1 bg-tricolore-rouge" />
      </div>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        {/* Bloc-marque en haut à gauche, zone de protection comprise. */}
        <Link href="/" aria-label="GéoEmploi — accueil" className="-ml-1">
          <BrandBlock size="sm" />
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 font-sans transition-colors hover:bg-muted",
                pathname === link.href
                  ? "font-medium text-primary underline decoration-2 underline-offset-8"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name} · {ROLE_LABELS[user.role]}
              </span>
              {/* La déconnexion est une mutation : un formulaire POST vers une
                  Server Action, pas un onClick qui vide un localStorage. */}
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  <LogOut data-icon="inline-start" />
                  Déconnexion
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/connexion" />}
              >
                Connexion
              </Button>
              <Button size="sm" render={<Link href="/inscription" />}>
                Créer un compte
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          aria-controls="site-menu-mobile"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {menuOpen ? (
        <div
          id="site-menu-mobile"
          className="border-t border-border bg-background md:hidden"
        >
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "rounded-md px-2.5 py-2 font-sans transition-colors hover:bg-muted",
                  pathname === link.href
                    ? "bg-primary-surface text-primary-surface-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-border px-4 py-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.name} · {ROLE_LABELS[user.role]}
                </span>
                <form action={signOut} onSubmit={() => setMenuOpen(false)}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <LogOut data-icon="inline-start" />
                    Déconnexion
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  render={<Link href="/connexion" />}
                >
                  Connexion
                </Button>
                <Button
                  size="sm"
                  className="w-full"
                  render={<Link href="/inscription" />}
                >
                  Créer un compte
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
