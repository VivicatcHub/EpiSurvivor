export type Role = "job_seeker" | "employer" | "admin";

export type ContractType =
  | "permanent"
  | "fixed_term"
  | "temp_agency"
  | "internship"
  | "apprenticeship"
  | "freelance";

export type ListingStatus =
  | "publiee"
  | "en_attente"
  | "signalee"
  | "archivee"
  | "refusee";

export type AccountStatus = "active" | "suspended";

export type ApplicationStatus =
  | "sent"
  | "viewed"
  | "in_review"
  | "accepted"
  | "rejected";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
};

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

export type Application = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingCompany: string;
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

export type SeekerProfile = {
  id: string;
  name: string;
  email: string;
  headline: string;
  city: string;
  availability: string;
  skills: string[];
  experiences: Experience[];
};

export type Company = {
  id: string;
  name: string;
  siret: string;
  sector: string;
  city: string;
  contactEmail: string;
  radiusKm: number;
};

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
};

export type OfferReport = {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: string;
  status: "open" | "reviewed" | "dismissed";
  createdAt: string;
};

export type Metrics = {
  publishedListings: number;
  pendingListings: number;
  reportedListings: number;
  accounts: number;
  applications: number;
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
