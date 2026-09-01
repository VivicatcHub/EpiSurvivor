"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/map/location-picker";
import { CONTRACT_TYPES } from "@/lib/mock-data";

export function ListingForm() {
  const [position, setPosition] = useState({ lat: 45.74634, lng: 4.835144 });
  const [radiusKm, setRadiusKm] = useState(15);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setPayload({ ...data, radiusKm, lat: position.lat, lng: position.lng });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
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
              defaultValue="CDI"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {CONTRACT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
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
              placeholder="69003"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" name="city" required placeholder="Lyon" />
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
            max={50}
            step={5}
            value={radiusKm}
            onChange={(event) => setRadiusKm(Number(event.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            Formule Standard : jusqu&apos;à 15 km inclus. Au-delà, un supplément
            sera facturé.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Publier l&apos;offre
        </Button>
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

        {payload ? (
          <div className="space-y-2 rounded-xl bg-muted p-4">
            <p className="text-sm font-medium">
              Offre prête à être envoyée à l&apos;API
            </p>
            <pre className="overflow-x-auto font-mono text-xs text-muted-foreground">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </form>
  );
}
