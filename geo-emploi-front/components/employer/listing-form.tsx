"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { publishListing } from "@/app/actions/offers";
import type { FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/map/location-picker";
import { CONTRACT_LABELS, CONTRACT_TYPES } from "@/lib/labels";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Publication…" : "Publier l'offre"}
    </Button>
  );
}

export function ListingForm({ maxRadiusKm }: { maxRadiusKm: number }) {
  const [position, setPosition] = useState({ lat: 45.74634, lng: 4.835144 });
  const [radiusKm, setRadiusKm] = useState(Math.min(15, maxRadiusKm));
  const [state, action] = useActionState<FormState, FormData>(
    publishListing,
    {},
  );

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-2">
      {/* La position vient de la carte, pas d'une saisie : on la transporte
          en champs cachés pour que l'action reçoive un FormData complet. */}
      <input type="hidden" name="lat" value={position.lat} />
      <input type="hidden" name="lng" value={position.lng} />
      <input type="hidden" name="radiusKm" value={radiusKm} />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Intitulé du poste</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Développeur·se front-end"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contract">Type de contrat</Label>
            <select
              id="contract"
              name="contract"
              defaultValue="permanent"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {CONTRACT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {CONTRACT_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Rémunération</Label>
            <Input
              id="salary"
              name="salary"
              required
              placeholder="42 000 € / an"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              name="address"
              required
              placeholder="196 Rue Garibaldi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              name="postalCode"
              required
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              placeholder="69003"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" name="city" required placeholder="Lyon" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Compétences attendues</Label>
          <Input
            id="skills"
            name="skills"
            placeholder="React, TypeScript, Tailwind"
          />
          <p className="text-xs text-muted-foreground">
            Séparées par des virgules.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" required rows={5} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="radius">Rayon de diffusion : {radiusKm} km</Label>
          <input
            id="radius"
            type="range"
            min={5}
            max={maxRadiusKm}
            step={5}
            value={radiusKm}
            onChange={(event) => setRadiusKm(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            Votre formule couvre jusqu&apos;à {maxRadiusKm} km. Au-delà, il faut
            changer d&apos;abonnement.
          </p>
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <Submit />
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Emplacement de l&apos;offre</Label>
          <p className="text-xs text-muted-foreground">
            Cliquez sur la carte ou déplacez le marqueur — la précision attendue
            est celle de la rue.
          </p>
        </div>
        <div className="h-80 overflow-hidden rounded-2xl ring-1 ring-foreground/10">
          <LocationPicker
            value={position}
            radiusKm={radiusKm}
            onChange={setPosition}
          />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          lat {position.lat.toFixed(5)} · lng {position.lng.toFixed(5)}
        </p>
      </div>
    </form>
  );
}
