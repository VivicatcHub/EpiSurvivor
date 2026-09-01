export type Role = "chercheur" | "employeur" | "admin";

export type ContractType = "CDI" | "CDD" | "Alternance" | "Stage" | "Freelance";

export type ListingStatus = "publiee" | "en_attente" | "signalee" | "archivee";

export type Listing = {
  id: string;
  title: string;
  companyId: string;
  company: string;
  contract: ContractType;
  salary: string;
  description: string;
  skills: string[];
  address: string;
  city: string;
  postalCode: string;
  radiusKm: number;
  publishedAt: string;
  status: ListingStatus;
  views: number;
  lat: number;
  lng: number;
};

export type ApplicationStatus = "envoyee" | "vue" | "entretien" | "refusee";

export type Application = {
  id: string;
  listingId: string;
  seekerId: string;
  seekerName: string;
  message: string;
  status: ApplicationStatus;
  sentAt: string;
};

export type Experience = {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  goal: number;
};

export type SeekerProfile = {
  id: string;
  name: string;
  email: string;
  headline: string;
  city: string;
  availability: string;
  skills: string[];
  experiences: Experience[];
  caught: number;
};

export type SubscriptionPlan = "aucun" | "standard" | "premium";

export type Company = {
  id: string;
  name: string;
  siret: string;
  sector: string;
  city: string;
  contactEmail: string;
  plan: SubscriptionPlan;
  planPrice: number;
  radiusKm: number;
  subscribedSince: string;
};

export type AccountStatus = "actif" | "suspendu" | "en_attente";

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
};

export type BoundsBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type ListingFilters = {
  q?: string;
  contract?: ContractType | "toutes";
};
