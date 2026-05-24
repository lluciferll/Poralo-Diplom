from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import Achievement, Game, Match, MatchParticipant, PlayerRating, User
from app.portfolio import (
    get_pulse_dna_for_user,
    log_manual_match,
    profile_completeness,
    refresh_trust,
    upsert_rating,
)
from app.schemas import AchievementOut, GameOut, PulseDNAOut, RatingOut, UserOut, UserUpdate
from app.services import rating_out

router = APIRouter(prefix="/my", tags=["portfolio"])


class RatingUpsert(BaseModel):
    game_id: int
    elo: int = Field(ge=0, le=5000)
    wins: int = Field(ge=0)
    losses: int = Field(ge=0)


class PulseDNAUpdate(BaseModel):
    entry: int = Field(ge=0, le=100)
    trade: int = Field(ge=0, le=100)
    clutch: int = Field(ge=0, le=100)
    anchor: int = Field(ge=0, le=100)
    igl: int = Field(ge=0, le=100)


class ManualMatchCreate(BaseModel):
    game_id: int
    map_name: str = ""
    kills: int = Field(ge=0, default=0)
    deaths: int = Field(ge=0, default=0)
    assists: int = Field(ge=0, default=0)
    won: bool = True
    score_for: int = Field(ge=0, default=13)
    score_against: int = Field(ge=0, default=10)
    elo_delta: int = Field(default=15, ge=-200, le=200)
    opponent_nickname: str | None = None


class AchievementCreate(BaseModel):
    title: str = Field(min_length=2, max_length=128)
    description: str | None = None
    game_id: int | None = None
    event_date: datetime | None = None


class ProfileLinksUpdate(BaseModel):
    steam_url: str | None = None
    faceit_url: str | None = None


class PortfolioOut(BaseModel):
    user: UserOut
    ratings: list[RatingOut]
    pulse_dna: PulseDNAOut
    achievements: list[AchievementOut]
    completeness: dict


@router.get("/portfolio", response_model=PortfolioOut)
def get_portfolio(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ratings = (
        db.query(PlayerRating)
        .options(joinedload(PlayerRating.game))
        .filter(PlayerRating.user_id == user.id)
        .all()
    )
    achievements = (
        db.query(Achievement)
        .options(joinedload(Achievement.game))
        .filter(Achievement.user_id == user.id)
        .order_by(Achievement.event_date.desc().nullslast())
        .all()
    )
    primary_game = ratings[0].game_id if ratings else None
    return PortfolioOut(
        user=UserOut.model_validate(user),
        ratings=[rating_out(r) for r in ratings],
        pulse_dna=PulseDNAOut(**get_pulse_dna_for_user(db, user, primary_game)),
        achievements=[AchievementOut.model_validate(a) for a in achievements],
        completeness=profile_completeness(user, db),
    )


@router.patch("/profile", response_model=UserOut)
def update_profile(data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    refresh_trust(user, db)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/links", response_model=UserOut)
def update_links(data: ProfileLinksUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.steam_url = data.steam_url
    user.faceit_url = data.faceit_url
    refresh_trust(user, db)
    db.commit()
    db.refresh(user)
    return user


@router.put("/ratings", response_model=RatingOut)
def save_rating(data: RatingUpsert, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(Game, data.game_id):
        raise HTTPException(404, "Игра не найдена")
    r = upsert_rating(db, user.id, data.game_id, data.elo, data.wins, data.losses)
    refresh_trust(user, db)
    db.commit()
    db.refresh(r)
    r = db.query(PlayerRating).options(joinedload(PlayerRating.game)).filter(PlayerRating.id == r.id).one()
    return rating_out(r)


@router.put("/pulse-dna", response_model=PulseDNAOut)
def save_pulse_dna(data: PulseDNAUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.dna_entry = data.entry
    user.dna_trade = data.trade
    user.dna_clutch = data.clutch
    user.dna_anchor = data.anchor
    user.dna_igl = data.igl
    user.dna_manual = True
    refresh_trust(user, db)
    db.commit()
    db.refresh(user)
    return PulseDNAOut(**get_pulse_dna_for_user(db, user))


@router.post("/matches")
def add_match(data: ManualMatchCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(Game, data.game_id):
        raise HTTPException(404, "Игра не найдена")
    match = log_manual_match(
        db,
        user,
        data.game_id,
        data.map_name,
        data.kills,
        data.deaths,
        data.assists,
        data.won,
        data.score_for,
        data.score_against,
        data.elo_delta,
        data.opponent_nickname,
    )
    return {"ok": True, "match_id": match.id}


@router.post("/achievements", response_model=AchievementOut)
def add_achievement(data: AchievementCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = Achievement(
        user_id=user.id,
        title=data.title,
        description=data.description,
        game_id=data.game_id,
        event_date=data.event_date or datetime.utcnow(),
    )
    db.add(a)
    refresh_trust(user, db)
    db.commit()
    db.refresh(a)
    a = db.query(Achievement).options(joinedload(Achievement.game)).filter(Achievement.id == a.id).one()
    return AchievementOut.model_validate(a)


@router.delete("/achievements/{achievement_id}")
def delete_achievement(achievement_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(Achievement).filter(Achievement.id == achievement_id, Achievement.user_id == user.id).first()
    if not a:
        raise HTTPException(404, "Достижение не найдено")
    db.delete(a)
    refresh_trust(user, db)
    db.commit()
    return {"ok": True}
