"""Espace chercheur d'emploi : profil, compétences, suivi des candidatures."""

from fastapi import APIRouter, Depends
from sqlmodel import Session, col, select

from app.auth.user import Account, CheckSeeker, seeker_of
from app.database import get_db
from app.models import (
    Application,
    Employer,
    Experience,
    JobOffer,
    JobSeekerSkill,
    JobTitle,
)
from app.schemas import ApplicationOut, SeekerProfileIn, SeekerProfileOut
from app.serializers import (
    application_out,
    experience_out,
    get_or_create_skill,
    seeker_profile_out,
    seeker_skills,
)

router = APIRouter(prefix="/api/v1/seeker", tags=["seeker"])


def _profile(db: Session, account: Account) -> SeekerProfileOut:
    seeker = seeker_of(db, account)

    experiences = db.exec(
        select(Experience, JobTitle)
        .join(JobTitle, col(JobTitle.id) == col(Experience.job_title_id))
        .where(Experience.job_seeker_id == seeker.id)
        .order_by(col(Experience.start_date).desc())
    ).all()

    # « Offres attrapées » : le compteur de gamification du sujet, adossé aux
    # candidatures réelles plutôt qu'à un score stocké à part.
    caught = len(
        db.exec(
            select(Application.id).where(Application.job_seeker_id == seeker.id)
        ).all()
    )

    return seeker_profile_out(
        seeker,
        account,
        seeker_skills(db, seeker.id),
        [experience_out(exp, title.label) for exp, title in experiences],
        caught,
    )


@router.get("/profile", response_model=SeekerProfileOut)
def get_profile(account: Account = Depends(CheckSeeker), db: Session = Depends(get_db)):
    return _profile(db, account)


@router.patch("/profile", response_model=SeekerProfileOut)
def update_profile(
    data: SeekerProfileIn,
    account: Account = Depends(CheckSeeker),
    db: Session = Depends(get_db),
):
    seeker = seeker_of(db, account)
    if data.headline is not None:
        seeker.headline = data.headline
    if data.city is not None:
        seeker.city = data.city
    if data.available_from is not None:
        seeker.available_from = data.available_from
    db.add(seeker)

    if data.skills is not None:
        # Remplacement complet : le formulaire envoie la liste voulue.
        for link in db.exec(
            select(JobSeekerSkill).where(JobSeekerSkill.job_seeker_id == seeker.id)
        ).all():
            db.delete(link)
        db.flush()
        for label in data.skills:
            if not label.strip():
                continue
            skill = get_or_create_skill(db, label)
            db.add(JobSeekerSkill(job_seeker_id=seeker.id, skill_id=skill.id))

    db.commit()
    return _profile(db, account)


@router.get("/applications", response_model=list[ApplicationOut])
def my_applications(
    account: Account = Depends(CheckSeeker), db: Session = Depends(get_db)
):
    seeker = seeker_of(db, account)
    rows = db.exec(
        select(Application, JobTitle, Employer)
        .join(JobOffer, col(JobOffer.id) == col(Application.job_offer_id))
        .join(JobTitle, col(JobTitle.id) == col(JobOffer.job_title_id))
        .join(Employer, col(Employer.id) == col(JobOffer.employer_id))
        .where(Application.job_seeker_id == seeker.id)
        .order_by(col(Application.created_at).desc())
    ).all()
    return [
        application_out(application, title.label, employer.name, seeker)
        for application, title, employer in rows
    ]
