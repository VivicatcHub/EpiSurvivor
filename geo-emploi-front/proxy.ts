import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/schemas";

/**
 * Garde optimiste des routes privées (Next 16 : `proxy`, ex-`middleware`).
 *
 * Ce code tourne aussi sur les préchargements : il ne fait donc aucun appel à
 * l'API ni à la base, il se contente de lire le cookie. Son rôle est
 * d'éviter un rendu inutile et d'obtenir une vraie redirection HTTP — une
 * page qui a commencé à streamer ne peut plus changer de statut.
 *
 * ⚠️ La signature du jeton n'est **pas** vérifiée ici : un rôle falsifié
 * ferait au pire passer la garde, et `lib/dal.ts` puis le backend la
 * refuseraient. L'autorisation réelle vit là-bas, au contact de la donnée.
 *
 * La carte (`/offres`) reste volontairement hors de cette liste : le sujet
 * exige qu'elle soit consultable sans compte (§2.2).
 */
const ROLE_BY_PREFIX: { prefix: string; role: Role }[] = [
  { prefix: "/profil", role: "job_seeker" },
  { prefix: "/employeur", role: "employer" },
  { prefix: "/admin", role: "admin" },
];

/** Lit le champ `role` du JWT sans le valider. Optimiste, par construction. */
function roleFromToken(token: string): Role | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return (JSON.parse(json).role as Role) ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const guard = ROLE_BY_PREFIX.find((entry) => pathname.startsWith(entry.prefix));
  if (!guard) return NextResponse.next();

  const token = request.cookies.get("geosession")?.value;
  if (!token) {
    const login = new URL("/connexion", request.nextUrl);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Rôle connu et incompatible : on renvoie à l'accueil sans rendre la page.
  // Rôle illisible (jeton corrompu) : on laisse le DAL trancher.
  const role = roleFromToken(token);
  if (role && role !== guard.role) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/profil/:path*", "/employeur/:path*", "/admin/:path*"],
};
