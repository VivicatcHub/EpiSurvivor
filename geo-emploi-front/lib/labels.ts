import type {
  ApplicationStatus,
  ContractType,
  ListingStatus,
  Role,
  AccountStatus,
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

export const ROLE_HOME: Record<Role, string> = {
  job_seeker: "/offres",
  employer: "/employeur",
  admin: "/admin",
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}
