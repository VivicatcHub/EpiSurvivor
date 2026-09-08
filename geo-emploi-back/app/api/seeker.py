"""Espace chercheur d'emploi : profil, compétences, suivi des candidatures."""

from fastapi import APIRouter, Depends
from sqlmodel import Session, col, select
from app.auth.user import CheckSeeker, seeker_of
from app.database import get_db
from app.models import Candidature, Employer, Experience, JobSeekerCompetence, Offre, TitrePoste, User
from app.schemas import ApplicationOut, SeekerProfileIn, SeekerProfileOut
from app.serializers import application_out, experience_out, get_or_create_competence, seeker_profile_out, seeker_skills

router = APIRouter(prefix="/api/v1/seeker", tags=["seeker"])

def _profile(db: Session, account: User) -> SeekerProfileOut:
    seeker = seeker_of(db, account)
    experiences = db.exec(select(Experience, TitrePoste)
        .join(TitrePoste, col(TitrePoste.id) == col(Experience.titre_poste_id))
        .where(Experience.job_seeker_id == seeker.id)
        .order_by(col(Experience.date_debut).desc())
    ).all()
    return seeker_profile_out(seeker, account, seeker_skills(db, seeker.id), [experience_out(exp, titre.libelle) for exp, titre in experiences])

@router.get("/profile", response_model=SeekerProfileOut)
def get_profile(account: User = Depends(CheckSeeker), db: Session = Depends(get_db)):
    return _profile(db, account)

@router.patch("/profile", response_model=SeekerProfileOut)
def update_profile(data: SeekerProfileIn, account: User = Depends(CheckSeeker), db: Session = Depends(get_db)):
    seeker = seeker_of(db, account)
    if data.headline is not None:
        seeker.titre_pro = data.headline
    if data.city is not None:
        seeker.ville = data.city
    if data.available_from is not None:
        seeker.disponibilite = data.available_from
    db.add(seeker)
    if data.skills is not None:
        # Remplacement complet : le formulaire envoie la liste voulue.
        for link in db.exec(
            select(JobSeekerCompetence).where(JobSeekerCompetence.job_seeker_id == seeker.id)).all():
            db.delete(link)
        db.flush()
        for label in data.skills:
            if not label.strip():
                continue
            competence = get_or_create_competence(db, label)
            db.add(JobSeekerCompetence(job_seeker_id=seeker.id, competence_id=competence.id))
    db.commit()
    return _profile(db, account)

@router.get("/applications", response_model=list[ApplicationOut])
def my_applications(account: User = Depends(CheckSeeker), db: Session = Depends(get_db)):
    seeker = seeker_of(db, account)
    rows = db.exec(select(Candidature, TitrePoste, Employer)
    .join(Offre, col(Offre.id) == col(Candidature.offre_id))
    .join(TitrePoste, col(TitrePoste.id) == col(Offre.titre_poste_id))
    .join(Employer, col(Employer.id) == col(Offre.employer_id))
    .where(Candidature.job_seeker_id == seeker.id)
    .order_by(col(Candidature.date_creation).desc())
    ).all()
    return [application_out(application, titre.libelle, employer.nom, seeker) for application, titre, employer in rows]
