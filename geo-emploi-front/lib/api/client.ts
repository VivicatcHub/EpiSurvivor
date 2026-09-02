/**
 * Client HTTP vers l'API GéoEmploi — **serveur uniquement**.
 *
 * Le navigateur ne parle jamais au backend directement : les Server
 * Components, Server Actions et Route Handlers appellent l'API, et relaient
 * le cookie de session. Conséquences voulues :
 *
 *  - `API_URL` (sans préfixe NEXT_PUBLIC_) n'est pas inlinée dans le bundle ;
 *  - le JWT reste dans un cookie httpOnly, illisible par un script injecté ;
 *  - aucune requête cross-origin depuis le navigateur, donc pas de CORS ni de
 *    cookie tiers à négocier avec le navigateur.
 */

import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "geosession";

const BASE = (process.env.API_URL ?? "http://localhost:1234").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function sessionHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? { cookie: `${SESSION_COOKIE}=${token}` } : {};
}

async function detail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    // FastAPI renvoie {detail}, parfois une liste (erreurs de validation).
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) {
      return body.detail.map((e: { msg?: string }) => e.msg).join(", ");
    }
  } catch {
    /* réponse non-JSON : on retombe sur le message générique */
  }
  return `Erreur ${response.status}`;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(await sessionHeader()),
      ...(init.headers ?? {}),
    },
    // Données par utilisateur et carte qui bouge : rien n'est mis en cache
    // par défaut. Les pages publiques cachables le déclarent explicitement.
    cache: "no-store",
  });
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) throw new ApiError(response.status, await detail(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function json(body: unknown): RequestInit {
  return { body: JSON.stringify(body) };
}

/** Jeton de session posé par le backend dans son `Set-Cookie`. */
export function readSessionToken(response: Response): string | null {
  for (const raw of response.headers.getSetCookie()) {
    const match = raw.match(new RegExp(`^${SESSION_COOKIE}=([^;]*)`));
    if (match) return match[1];
  }
  return null;
}
