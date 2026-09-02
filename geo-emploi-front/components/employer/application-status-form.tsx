"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setApplicationStatus } from "@/app/actions/manage";
import type { FormState } from "@/app/actions/auth";
import { APPLICATION_STATUS_LABELS } from "@/lib/labels";
import type { ApplicationStatus } from "@/lib/schemas";

const STATUSES = Object.keys(
  APPLICATION_STATUS_LABELS,
) as ApplicationStatus[];

function Select({ status }: { status: ApplicationStatus }) {
  const { pending } = useFormStatus();
  return (
    <select
      name="status"
      defaultValue={status}
      disabled={pending}
      aria-label="Statut de la candidature"
      // `requestSubmit` : le suivi se change en un geste, sans bouton
      // « Enregistrer » à côté de chaque ligne du tableau.
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
    >
      {STATUSES.map((value) => (
        <option key={value} value={value}>
          {APPLICATION_STATUS_LABELS[value]}
        </option>
      ))}
    </select>
  );
}

export function ApplicationStatusForm({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const [state, action] = useActionState<FormState, FormData>(
    setApplicationStatus,
    {},
  );

  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <Select status={status} />
      {state.error ? (
        <span role="alert" className="text-xs text-destructive">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
