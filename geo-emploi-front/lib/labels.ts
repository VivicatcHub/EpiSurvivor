/**
 * Traduction des valeurs de l'API en libellés d'interface.
 *
 * C'est le seul endroit où « permanent » devient « CDI ». Les composants
 * manipulent les valeurs de l'API et n'affichent que par ici : renommer un
 * libellé ne demande jamais de toucher à une requête.
 */

import type {
  ApplicationStatus,
  ContractType,
  ListingStatus,
  Role,
  AccountStatus,
  SubscriptionPlan,
} from "@/lib/schemas";

export const CONTRACT_TYPES: ContractType[] = [
  "permanent",
  "fixed_term",
  "temp_agency",
  "internship",
  "apprenticeship",
  "freelance",
];

export const CONTRACT_LABELS: Record<ContractType, string> = {
  permanent: "CDI",
  fixed_term: "CDD",
  temp_agency: "Intérim",
  internship: "Stage",
  apprenticeship: "Alternance",
  freelance: "Freelance",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  publiee: "Publiée",
  en_attente: "En attente",
  signalee: "Signalée",
  archivee: "Archivée",
  refusee: "Retirée",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: "Envoyée",
  viewed: "Vue par l'employeur",
  in_review: "Entretien",
  accepted: "Acceptée",
  rejected: "Refusée",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
};

export const ROLE_LABELS: Record<Role, string> = {
  job_seeker: "Chercheur d'emploi",
  employer: "Employeur",
  admin: "Administration",
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  none: "Aucun",
  standard: "Standard",
  premium: "Premium",
};

/** Page d'accueil de chaque rôle après connexion. */
export const ROLE_HOME: Record<Role, string> = {
  job_seeker: "/offres",
  employer: "/employeur",
  admin: "/admin",
};

/** Objectif du « Permis de Travailler JEB » (§ gamification du sujet). */
export const WORK_PERMIT_GOAL = 10;

export const BADGES = [
  {
    id: "b1",
    label: "Première prise",
    description: "Attrapez votre première offre sur la carte.",
    goal: 1,
  },
  {
    id: "b2",
    label: "Chasseur régulier",
    description: "Trois offres attrapées.",
    goal: 3,
  },
  {
    id: "b3",
    label: "Arpenteur",
    description: "Cinq offres attrapées dans deux villes différentes.",
    goal: 5,
  },
  {
    id: "b4",
    label: "Permis de Travailler JEB",
    description: "Dix offres attrapées : le sésame du Ministère.",
    goal: WORK_PERMIT_GOAL,
  },
];

/** Dates de l'API : ISO en entrée, format français en sortie. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}
