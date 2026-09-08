"""DTO d'entrée/sortie de l'API.

Les réponses sortent en camelCase (`alias_generator`) pour coller au contrat
TypeScript du front (`geo-emploi-front/lib/schemas.ts`) : pas de couche de
transformation des noms de champs entre les deux projets, un seul endroit où
le contrat est décrit.

Les valeurs, elles, sont celles de la base (`job_seeker`, `permanent`,
`in_review`…) : le français reste un problème d'affichage, côté front.
"""

from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

ROLES = ("job_seeker", "employer", "admin")
CONTRACT_TYPES = (
    "permanent", "fixed_term", "temp_agency",
    "internship", "apprenticeship", "freelance",
)
LISTING_STATUSES = ("publiee", "en_attente", "signalee", "archivee", "refusee")
# Au-delà, une offre est archivée automatiquement (§2.2 du sujet).
OFFER_MAX_AGE_DAYS = 30
# Rayon de diffusion maximal d'une offre. La publication est gratuite et ne
# dépend plus d'une formule payante (instruction du 7 septembre 2026).
MAX_RADIUS_KM = 50

class Payload(BaseModel):
    """Base des DTO : camelCase en sortie, snake_case toléré en entrée."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

# --------------------------------------------------------------------- auth
class RegisterIn(Payload):
    email: str
    password: str = Field(min_length=8)
    firstname: str
    lastname: str
    role: str
    # Employeur : la raison sociale prime sur firstname/lastname.
    company: str | None = None
    siret: str | None = None

class LoginIn(Payload):
    email: str
    password: str

class SessionUser(Payload):
    id: str
    name: str
    email: str
    role: str
    status: str
    created_at: datetime

# ----------------------------------------------------------------- listings
class ListingOut(Payload):
    id: str
    title: str
    company_id: str
    company: str
    contract: str
    salary: str
    description: str
    skills: list[str]
    address: str
    city: str
    postal_code: str
    radius_km: int
    published_at: date
    status: str
    views: int
    lat: float
    lng: float

class ListingIn(Payload):
    title: str
    contract: str
    salary: str
    description: str
    address: str
    city: str
    postal_code: str
    radius_km: int = 15
    skills: list[str] = []
    insee_code: str | None = None

class ApplyIn(Payload):
    message: str = ""

class ReportIn(Payload):
    reason: str

# ------------------------------------------------------------- applications
class ApplicationOut(Payload):
    id: str
    listing_id: str
    listing_title: str
    listing_company: str
    seeker_id: str
    seeker_name: str
    message: str
    status: str
    sent_at: date

class ApplicationStatusIn(Payload):
    status: str

# ------------------------------------------------------------------ profils
class ExperienceOut(Payload):
    id: str
    role: str
    company: str
    period: str
    description: str

class SeekerProfileOut(Payload):
    id: str
    name: str
    email: str
    headline: str
    city: str
    availability: str
    skills: list[str]
    experiences: list[ExperienceOut]

class SeekerProfileIn(Payload):
    headline: str | None = None
    city: str | None = None
    available_from: date | None = None
    skills: list[str] | None = None

class CompanyOut(Payload):
    id: str
    name: str
    siret: str
    sector: str
    city: str
    contact_email: str
    radius_km: int

# -------------------------------------------------------------------- admin
class UserAccountOut(Payload):
    id: str
    name: str
    email: str
    role: str
    status: str
    created_at: date

class AccountStatusIn(Payload):
    status: str

class ModerationIn(Payload):
    status: str

class ReportOut(Payload):
    id: str
    listing_id: str
    listing_title: str
    reason: str
    status: str
    created_at: date

class MetricsOut(Payload):
    published_listings: int
    pending_listings: int
    reported_listings: int
    accounts: int
    applications: int
