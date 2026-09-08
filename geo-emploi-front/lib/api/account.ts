import "server-only";
import { api } from "@/lib/api/client";
import type {
  Application,
  Company,
  Listing,
  Metrics,
  OfferReport,
  SeekerProfile,
  UserAccount,
} from "@/lib/schemas";

export async function getSeekerProfile(): Promise<SeekerProfile> {
  return api<SeekerProfile>("/api/v1/seeker/profile");
}

export async function getSeekerApplications(): Promise<Application[]> {
  return api<Application[]>("/api/v1/seeker/applications");
}

export async function getCompany(): Promise<Company> {
  return api<Company>("/api/v1/employer/company");
}

export async function getCompanyListings(): Promise<Listing[]> {
  return api<Listing[]>("/api/v1/employer/offers");
}

export async function getReceivedApplications(): Promise<Application[]> {
  return api<Application[]>("/api/v1/employer/applications");
}

export async function getAllListings(): Promise<Listing[]> {
  return api<Listing[]>("/api/v1/admin/offers");
}

export async function getAllUsers(): Promise<UserAccount[]> {
  return api<UserAccount[]>("/api/v1/admin/users");
}

export async function getAllReports(): Promise<OfferReport[]> {
  return api<OfferReport[]>("/api/v1/admin/reports");
}

export async function getMetrics(): Promise<Metrics> {
  return api<Metrics>("/api/v1/admin/metrics");
}
