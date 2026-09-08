"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { moderateListing } from "@/app/actions/manage";
import type { FormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { ListingStatus } from "@/lib/schemas";

function Actions({ status }: { status?: ListingStatus }) {
  const { pending } = useFormStatus();
  return (
    <span className="space-x-1">
      <Button
        type="submit"
        name="status"
        value="approved"
        size="xs"
        variant="outline"
        disabled={pending || status === "publiee"}
      >
        Valider
      </Button>
      <Button
        type="submit"
        name="status"
        value="rejected"
        size="xs"
        variant="destructive"
        disabled={pending || status === "refusee"}
      >
        Retirer
      </Button>
    </span>
  );
}

export function ModerationForm({
  listingId,
  status,
}: {
  listingId: string;
  status?: ListingStatus;
}) {
  const [state, action] = useActionState<FormState, FormData>(
    moderateListing,
    {},
  );

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="listingId" value={listingId} />
      <Actions status={status} />
      {state.error ? (
        <span role="alert" className="text-xs text-destructive">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
