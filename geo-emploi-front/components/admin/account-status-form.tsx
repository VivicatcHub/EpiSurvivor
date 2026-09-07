"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setAccountStatus } from "@/app/actions/manage";
import type { FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { AccountStatus } from "@/lib/schemas";

function Submit({ suspended }: { suspended: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="xs" variant="outline" disabled={pending}>
      {pending ? "…" : suspended ? "Réactiver" : "Suspendre"}
    </Button>
  );
}

/** Suspendre ou réactiver un compte : l'action bascule le statut courant. */
export function AccountStatusForm({
  accountId,
  status,
}: {
  accountId: string;
  status: AccountStatus;
}) {
  const suspended = status === "suspended";
  const [state, action] = useActionState<FormState, FormData>(
    setAccountStatus,
    {},
  );

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="accountId" value={accountId} />
      <input
        type="hidden"
        name="status"
        value={suspended ? "active" : "suspended"}
      />
      <Submit suspended={suspended} />
      {state.error ? (
        <span role="alert" className="text-xs text-destructive">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
