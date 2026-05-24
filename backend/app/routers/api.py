from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.elo import tier_from_elo
from app.models import (
    Achievement,
    Game,
    Hub,
    HubMember,
    Ladder,
    LadderEntry,
    Match,
    MatchParticipant,
    Mission,
    MissionProgress,
    PlayerRating,
    QueueEntry,
    Rivalry,
    Team,
    TeamMember,
    Tournament,
    TournamentRegistration,
    User,
)
from app.schemas import (
    DashboardOut,
    GameOut,
    HubOut,
    LadderOut,
    LeaderboardEntry,
    MatchOut,
    MissionOut,
    AchievementOut,
    ProfileOut,
    PulseDNAOut,
    QueueJoin,
    QueueStatus,
    RivalryOut,
    ScoutEntry,
    TeamCreate,
    TeamOut,
    TournamentOut,
    UserOut,
    UserUpdate,
)
from app.portfolio import get_pulse_dna_for_user, profile_completeness
from app.services import match_out, rating_out

router = APIRouter(tags=["api"])


def rivalries_out(db: Session, user_id: int) -> list[RivalryOut]:
    rows = (
        db.query(Rivalry)
        .options(joinedload(Rivalry.rival))
        .filter(Rivalry.user_id == user_id)
        .order_by(desc(Rivalry.last_met_at))
        .limit(8)
        .all()
    )
    return [
        RivalryOut(
            rival_id=r.rival_id,
            nickname=r.rival.nickname,
            avatar_url=r.rival.avatar_url,
            wins=r.wins,
            losses=r.losses,
            last_met_at=r.last_met_at,
        )
        for r in rows
    ]


def missions_out(db: Session, user_id: int) -> list[MissionOut]:
    missions = db.query(Mission).options(joinedload(Mission.game)).all()
    result = []
    for m in missions:
        prog = (
            db.query(MissionProgress)
            .filter(MissionProgress.user_id == user_id, MissionProgress.mission_id == m.id)
            .first()
        )
        result.append(
            MissionOut(
                id=m.id,
                code=m.code,
                title=m.title,
                description=m.description,
                target=m.target,
                progress=prog.progress if prog else 0,
                completed=prog.completed if prog else False,
                reward_label=m.reward_label,
                game=GameOut.model_validate(m.game) if m.game else None,
            )
        )
    return result


@router.get("/games", response_model=list[GameOut])
def list_games(db: Session = Depends(get_db)):
    return db.query(Game).all()


@router.get("/leaderboard/{game_id}", response_model=list[LeaderboardEntry])
def leaderboard(game_id: int, limit: int = 50, db: Session = Depends(get_db)):
    rows = (
        db.query(PlayerRating)
        .options(joinedload(PlayerRating.user))
        .filter(PlayerRating.game_id == game_id)
        .order_by(desc(PlayerRating.elo))
        .limit(limit)
        .all()
    )
    out = []
    for i, r in enumerate(rows):
        tier = tier_from_elo(r.elo)
        out.append(
            LeaderboardEntry(
                rank=i + 1,
                user_id=r.user_id,
                nickname=r.user.nickname,
                avatar_url=r.user.avatar_url,
                country=r.user.country,
                elo=r.elo,
                tier_code=tier["code"],
                tier_label=tier["label"],
                tier_color=tier["color"],
                wins=r.wins,
                losses=r.losses,
                trust_index=r.user.trust_index,
                looking_for_team=r.user.looking_for_team,
            )
        )
    return out


@router.get("/scout", response_model=list[ScoutEntry])
def scout_radar(game_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(PlayerRating).options(joinedload(PlayerRating.user), joinedload(PlayerRating.game))
    if game_id:
        q = q.filter(PlayerRating.game_id == game_id)
    rows = q.order_by(desc(PlayerRating.peak_elo - PlayerRating.elo + PlayerRating.wins)).limit(12).all()
    result = []
    for r in rows:
        tier = tier_from_elo(r.elo)
        dna = get_pulse_dna_for_user(db, r.user, r.game_id)
        gain = max(12, (r.peak_elo - r.elo) + r.wins * 3)
        result.append(
            ScoutEntry(
                user_id=r.user_id,
                nickname=r.user.nickname,
                avatar_url=r.user.avatar_url,
                country=r.user.country,
                game=GameOut.model_validate(r.game),
                elo=r.elo,
                tier_code=tier["code"],
                elo_gain_7d=gain,
                trust_index=r.user.trust_index,
                archetype=dna["archetype"],
            )
        )
    return sorted(result, key=lambda x: x.elo_gain_7d, reverse=True)


@router.get("/players/{nickname}/pulse-dna", response_model=PulseDNAOut)
def player_pulse_dna(nickname: str, game_id: int | None = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.nickname == nickname).first()
    if not user:
        raise HTTPException(404, "Игрок не найден")
    return PulseDNAOut(**get_pulse_dna_for_user(db, user, game_id))


@router.get("/players/{nickname}", response_model=ProfileOut)
def get_profile(nickname: str, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .options(joinedload(User.ratings).joinedload(PlayerRating.game))
        .filter(User.nickname == nickname)
        .first()
    )
    if not user:
        raise HTTPException(404, "Игрок не найден")
    primary_game = user.ratings[0].game_id if user.ratings else None
    achievements = (
        db.query(Achievement)
        .options(joinedload(Achievement.game))
        .filter(Achievement.user_id == user.id)
        .order_by(Achievement.event_date.desc().nullslast())
        .all()
    )
    return ProfileOut(
        **UserOut.model_validate(user).model_dump(),
        ratings=[rating_out(r) for r in user.ratings],
        pulse_dna=PulseDNAOut(**get_pulse_dna_for_user(db, user, primary_game)),
        rivalries=rivalries_out(db, user.id),
        achievements=[AchievementOut.model_validate(a) for a in achievements],
    )


@router.patch("/players/me", response_model=UserOut)
def update_profile(data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/matches", response_model=list[MatchOut])
def list_matches(game_id: int | None = None, limit: int = 20, db: Session = Depends(get_db)):
    q = (
        db.query(Match)
        .options(joinedload(Match.game), joinedload(Match.participants).joinedload(MatchParticipant.user))
        .order_by(desc(Match.created_at))
    )
    if game_id:
        q = q.filter(Match.game_id == game_id)
    return [match_out(m) for m in q.limit(limit).all()]


@router.get("/tournaments", response_model=list[TournamentOut])
def list_tournaments(db: Session = Depends(get_db)):
    items = db.query(Tournament).options(joinedload(Tournament.game)).all()
    result = []
    for t in items:
        reg = db.query(TournamentRegistration).filter(TournamentRegistration.tournament_id == t.id).count()
        result.append(
            TournamentOut(
                id=t.id,
                name=t.name,
                game=GameOut.model_validate(t.game),
                status=t.status.value,
                prize_pool=t.prize_pool,
                max_teams=t.max_teams,
                registered=reg,
                starts_at=t.starts_at,
            )
        )
    return result


@router.post("/tournaments/{tournament_id}/register")
def register_tournament(
    tournament_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    t = db.get(Tournament, tournament_id)
    if not t:
        raise HTTPException(404, "Турнир не найден")
    existing = (
        db.query(TournamentRegistration)
        .filter(
            TournamentRegistration.tournament_id == tournament_id,
            TournamentRegistration.user_id == user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "Уже зарегистрированы")
    count = db.query(TournamentRegistration).filter(TournamentRegistration.tournament_id == tournament_id).count()
    if count >= t.max_teams:
        raise HTTPException(400, "Мест нет")
    db.add(TournamentRegistration(tournament_id=tournament_id, user_id=user.id, team_name=f"Unit {user.nickname}"))
    db.commit()
    return {"ok": True}


@router.get("/teams", response_model=list[TeamOut])
def list_teams(game_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Team).options(joinedload(Team.game))
    if game_id:
        q = q.filter(Team.game_id == game_id)
    teams = q.all()
    out = []
    for t in teams:
        cnt = db.query(TeamMember).filter(TeamMember.team_id == t.id).count()
        out.append(
            TeamOut(
                id=t.id,
                name=t.name,
                tag=t.tag,
                logo_url=t.logo_url,
                game=GameOut.model_validate(t.game),
                member_count=cnt,
            )
        )
    return out


@router.post("/teams", response_model=TeamOut)
def create_team(data: TeamCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if db.query(Team).filter(Team.name == data.name).first():
        raise HTTPException(400, "Команда с таким именем уже есть")
    team = Team(name=data.name, tag=data.tag.upper(), game_id=data.game_id, captain_id=user.id)
    db.add(team)
    db.flush()
    db.add(TeamMember(team_id=team.id, user_id=user.id, role="captain"))
    db.commit()
    game = db.get(Game, data.game_id)
    return TeamOut(
        id=team.id,
        name=team.name,
        tag=team.tag,
        logo_url=team.logo_url,
        game=GameOut.model_validate(game),
        member_count=1,
    )


@router.get("/hubs", response_model=list[HubOut])
def list_hubs(db: Session = Depends(get_db)):
    hubs = db.query(Hub).options(joinedload(Hub.game)).all()
    return [
        HubOut(
            id=h.id,
            name=h.name,
            description=h.description,
            game=GameOut.model_validate(h.game),
            member_count=h.member_count,
        )
        for h in hubs
    ]


@router.post("/hubs/{hub_id}/join")
def join_hub(hub_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    hub = db.get(Hub, hub_id)
    if not hub:
        raise HTTPException(404, "Синдикат не найден")
    if db.query(HubMember).filter(HubMember.hub_id == hub_id, HubMember.user_id == user.id).first():
        return {"ok": True}
    db.add(HubMember(hub_id=hub_id, user_id=user.id))
    hub.member_count += 1
    db.commit()
    return {"ok": True}


@router.get("/ladders", response_model=list[LadderOut])
def list_ladders(db: Session = Depends(get_db)):
    ladders = db.query(Ladder).options(joinedload(Ladder.game)).all()
    result = []
    for lad in ladders:
        entries = (
            db.query(LadderEntry)
            .options(joinedload(LadderEntry.user))
            .filter(LadderEntry.ladder_id == lad.id)
            .order_by(desc(LadderEntry.points))
            .limit(5)
            .all()
        )
        top = [{"nickname": e.user.nickname, "points": e.points, "rank": e.rank} for e in entries]
        result.append(
            LadderOut(
                id=lad.id,
                name=lad.name,
                game=GameOut.model_validate(lad.game),
                season=lad.season,
                ends_at=lad.ends_at,
                prize=lad.prize,
                top_players=top,
            )
        )
    return result


@router.get("/missions", response_model=list[MissionOut])
def list_missions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return missions_out(db, user.id)


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ratings = (
        db.query(PlayerRating)
        .options(joinedload(PlayerRating.game))
        .filter(PlayerRating.user_id == user.id)
        .order_by(desc(PlayerRating.elo))
        .all()
    )
    primary = rating_out(ratings[0]) if ratings else None
    primary_game = ratings[0].game_id if ratings else None
    matches_q = (
        db.query(Match)
        .join(MatchParticipant)
        .options(joinedload(Match.game), joinedload(Match.participants).joinedload(MatchParticipant.user))
        .filter(MatchParticipant.user_id == user.id)
        .order_by(desc(Match.created_at))
        .limit(5)
    )
    recent = [match_out(m) for m in matches_q.all()]
    total_wins = sum(r.wins for r in ratings)
    total_losses = sum(r.losses for r in ratings)
    return DashboardOut(
        user=UserOut.model_validate(user),
        primary_rating=primary,
        pulse_dna=PulseDNAOut(**get_pulse_dna_for_user(db, user, primary_game)),
        rivalries=rivalries_out(db, user.id),
        missions=missions_out(db, user.id),
        recent_matches=recent,
        completeness=profile_completeness(user, db),
        stats={
            "total_wins": total_wins,
            "total_losses": total_losses,
            "win_rate": round(total_wins / max(1, total_wins + total_losses) * 100, 1),
            "games_played": len(ratings),
            "trust_index": user.trust_index,
        },
    )
