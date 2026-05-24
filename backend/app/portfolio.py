"""Портфолио игрока: ручной ввод данных без интеграции с играми."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.elo import tier_from_elo
from app.models import Achievement, Match, MatchParticipant, MatchStatus, Mission, MissionProgress, PlayerRating, Rivalry, User
from app.skill_dna import AXES, compute_pulse_dna

ARCHETYPE_LABELS = {
    "entry": "Entry Fragger",
    "trade": "Trade Specialist",
    "clutch": "Closer",
    "anchor": "Anchor",
    "igl": "Shot Caller",
}

ARCHETYPE_SUMMARIES = {
    "entry": "Aggressive opening duels and first contact.",
    "trade": "Stable trades and mid-round impact.",
    "clutch": "High conversion in decisive rounds.",
    "anchor": "Site holding with low risk profile.",
    "igl": "In-game leadership and team coordination.",
}


def calc_trust_index(user: User, db: Session) -> int:
    ratings = db.query(PlayerRating).filter(PlayerRating.user_id == user.id).count()
    matches = (
        db.query(MatchParticipant)
        .filter(MatchParticipant.user_id == user.id)
        .count()
    )
    achievements = db.query(Achievement).filter(Achievement.user_id == user.id).count()
    score = 35
    score += min(25, ratings * 8)
    score += min(20, matches * 3)
    score += min(12, achievements * 4)
    if user.bio and len(user.bio.strip()) > 10:
        score += 8
    if user.avatar_url:
        score += 5
    if user.primary_role:
        score += 5
    if user.is_verified:
        score += 10
    return min(100, score)


def refresh_trust(user: User, db: Session) -> int:
    user.trust_index = calc_trust_index(user, db)
    return user.trust_index


def get_pulse_dna_for_user(db: Session, user: User, game_id: int | None = None) -> dict:
    if user.dna_manual and all(getattr(user, f"dna_{a}", None) is not None for a in AXES):
        axes = {a: getattr(user, f"dna_{a}") for a in AXES}
        dominant = max(axes, key=axes.get)
        return {
            "axes": axes,
            "archetype": ARCHETYPE_LABELS[dominant],
            "summary": f"Задано вручную в профиле. {ARCHETYPE_SUMMARIES[dominant]}",
            "matches_analyzed": 0,
            "dominant_axis": dominant,
            "is_manual": True,
        }
    data = compute_pulse_dna(db, user.id, game_id)
    if data["matches_analyzed"] > 0:
        dominant = data.get("dominant_axis")
        if dominant:
            data["archetype"] = ARCHETYPE_LABELS.get(dominant, data["archetype"])
        data["is_manual"] = False
        return data
    axes = {a: 50 for a in AXES}
    return {
        "axes": axes,
        "archetype": "Unassigned",
        "summary": "Заполните Pulse DNA вручную или добавьте матчи в журнал.",
        "matches_analyzed": 0,
        "dominant_axis": None,
        "is_manual": False,
    }


def upsert_rating(db: Session, user_id: int, game_id: int, elo: int, wins: int, losses: int) -> PlayerRating:
    r = db.query(PlayerRating).filter(PlayerRating.user_id == user_id, PlayerRating.game_id == game_id).first()
    if not r:
        r = PlayerRating(user_id=user_id, game_id=game_id)
        db.add(r)
    r.elo = max(0, elo)
    r.wins = max(0, wins)
    r.losses = max(0, losses)
    r.matches_played = r.wins + r.losses
    r.peak_elo = max(r.peak_elo, r.elo)
    return r


def log_manual_match(
    db: Session,
    user: User,
    game_id: int,
    map_name: str,
    kills: int,
    deaths: int,
    assists: int,
    won: bool,
    score_for: int,
    score_against: int,
    elo_delta: int,
    opponent_nickname: str | None,
) -> Match:
    rating = db.query(PlayerRating).filter(PlayerRating.user_id == user.id, PlayerRating.game_id == game_id).first()
    if not rating:
        rating = PlayerRating(user_id=user.id, game_id=game_id, elo=1000, peak_elo=1000)
        db.add(rating)
        db.flush()
    elo_before = rating.elo
    rating.elo = max(0, rating.elo + elo_delta)
    if won:
        rating.wins += 1
    else:
        rating.losses += 1
    rating.matches_played = rating.wins + rating.losses
    rating.peak_elo = max(rating.peak_elo, rating.elo)

    match = Match(
        game_id=game_id,
        status=MatchStatus.FINISHED,
        map_name=map_name or "Не указана",
        score_team_a=score_for if won else score_against,
        score_team_b=score_against if won else score_for,
        is_manual=True,
        finished_at=datetime.utcnow(),
    )
    db.add(match)
    db.flush()
    db.add(
        MatchParticipant(
            match_id=match.id,
            user_id=user.id,
            team="A",
            kills=kills,
            deaths=deaths,
            assists=assists,
            elo_before=elo_before,
            elo_after=rating.elo,
            won=won,
            opponent_nickname=opponent_nickname,
        )
    )

    if opponent_nickname:
        rival = db.query(User).filter(User.nickname == opponent_nickname).first()
        if rival and rival.id != user.id:
            row = db.query(Rivalry).filter(Rivalry.user_id == user.id, Rivalry.rival_id == rival.id).first()
            if not row:
                row = Rivalry(user_id=user.id, rival_id=rival.id)
                db.add(row)
            if won:
                row.wins += 1
            else:
                row.losses += 1
            row.last_met_at = datetime.utcnow()

    _bump_missions(db, user.id, won)
    refresh_trust(user, db)
    db.commit()
    db.refresh(match)
    return match


def _bump_missions(db: Session, user_id: int, won: bool) -> None:
    for m in db.query(Mission).all():
        prog = (
            db.query(MissionProgress)
            .filter(MissionProgress.user_id == user_id, MissionProgress.mission_id == m.id)
            .first()
        )
        if not prog:
            prog = MissionProgress(user_id=user_id, mission_id=m.id)
            db.add(prog)
        if m.code == "play_10" and prog.progress < m.target:
            prog.progress += 1
        if m.code == "win_3" and won and prog.progress < m.target:
            prog.progress += 1
        prog.completed = prog.progress >= m.target


def profile_completeness(user: User, db: Session) -> dict:
    ratings = db.query(PlayerRating).filter(PlayerRating.user_id == user.id).count()
    matches = db.query(MatchParticipant).filter(MatchParticipant.user_id == user.id).count()
    achievements = db.query(Achievement).filter(Achievement.user_id == user.id).count()
    checks = [
        bool(user.bio),
        bool(user.avatar_url),
        bool(user.primary_role),
        ratings > 0,
        matches > 0,
        user.dna_manual or matches > 0,
        achievements > 0,
    ]
    done = sum(1 for c in checks if c)
    return {
        "percent": int(done / len(checks) * 100),
        "done": done,
        "total": len(checks),
        "ratings": ratings,
        "matches": matches,
        "achievements": achievements,
    }
