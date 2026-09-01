"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Role } from "@/lib/schemas";

export type DemoSession = { role: Role; name: string; email: string };

const STORAGE_KEY = "geoemploi.demo-session";

const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedSession: DemoSession | null = null;

function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): DemoSession | null {
  const raw = read();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSession = raw ? (JSON.parse(raw) as DemoSession) : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

function getServerSnapshot(): DemoSession | null {
  return null;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

export function useDemoSession() {
  const session = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const signIn = useCallback((next: DemoSession) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    emit();
  }, []);

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    emit();
  }, []);

  return { session, signIn, signOut };
}

export const ROLE_LABELS: Record<Role, string> = {
  chercheur: "Chercheur d'emploi",
  employeur: "Employeur",
  admin: "Administration",
};

export const ROLE_HOME: Record<Role, string> = {
  chercheur: "/offres",
  employeur: "/employeur",
  admin: "/admin",
};
