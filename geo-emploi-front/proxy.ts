import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/schemas";

const ROLE_BY_PREFIX: { prefix: string; role: Role }[] = [
  { prefix: "/profil", role: "job_seeker" },
  { prefix: "/employeur", role: "employer" },
  { prefix: "/admin", role: "admin" },
];

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
  const guard = ROLE_BY_PREFIX.find((entry) =>
    pathname.startsWith(entry.prefix),
  );
  if (!guard) return NextResponse.next();

  const token = request.cookies.get("geosession")?.value;
  if (!token) {
    const login = new URL("/connexion", request.nextUrl);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const role = roleFromToken(token);
  if (role && role !== guard.role) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/profil/:path*", "/employeur/:path*", "/admin/:path*"],
};
