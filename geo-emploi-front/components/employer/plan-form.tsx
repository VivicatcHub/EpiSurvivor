"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setSubscription } from "@/app/actions/manage";
import type { FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { SubscriptionPlan } from "@/lib/schemas";

type Variant = "default" | "outline" | "destructive";

function Submit({
  label,
  pendingLabel,
  variant,
  className,
}: {
  label: string;
  pendingLabel: string;
  variant: Variant;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant}
      className={className}
      disabled={pending}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}

/** Souscrire, changer de formule ou résilier : une seule Server Action. */
export function PlanForm({
  plan,
  label,
  pendingLabel = "Envoi…",
  variant = "default",
  className,
}: {
  plan: SubscriptionPlan;
  label: string;
  pendingLabel?: string;
  variant?: Variant;
  className?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(
    setSubscription,
    {},
  );

  return (
    <form action={action} className={className}>
      <input type="hidden" name="plan" value={plan} />
      <Submit
        label={label}
        pendingLabel={pendingLabel}
        variant={variant}
        className={className}
      />
      {state.error ? (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
