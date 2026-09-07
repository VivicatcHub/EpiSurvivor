"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CONTRACT_LABELS, CONTRACT_TYPES } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { ContractType } from "@/lib/schemas";

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contract = searchParams.get("contract") ?? "toutes";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "toutes") next.delete(key);
    else next.set(key, value);
    router.replace(`/offres?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setParam("q", String(data.get("q") ?? ""));
        }}
        className="flex gap-2"
      >
        <Input
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Métier, entreprise, ville…"
          aria-label="Rechercher une offre"
        />
        <Button type="submit" size="sm" aria-label="Rechercher">
          <Search />
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {["toutes", ...CONTRACT_TYPES].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setParam("contract", value)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs ring-1 ring-foreground/10 transition-colors",
              contract === value
                ? "bg-primary-surface font-medium text-primary-surface-foreground ring-primary/30"
                : "hover:bg-muted",
            )}
          >
            {value === "toutes"
              ? "Tous contrats"
              : CONTRACT_LABELS[value as ContractType]}
          </button>
        ))}
      </div>
    </div>
  );
}
