import random
from datetime import datetime

from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.elo import elo_change, level_from_elo, level_label, tier_from_elo
from app.models import (
    Game,
    Match,
    MatchParticipant,
    MatchStatus,
    PlayerRating,
    QueueEntry,
    Rivalry,
    User,
)
from app.schemas import (
    GameOut,
    MatchOut,
    MatchParticipantOut,
    QueueStatus,
    RatingOut,
)


def rating_out(r: PlayerRating) -> RatingOut:
    wr = r.wins / max(1, r.wins + r.losses) * 100
    tier = tier_from_elo(r.elo)
    return RatingOut(
        game=GameOut.model_validate(r.game),
        elo=r.elo,
        level=level_from_elo(r.elo),
        level_label=tier["label"],
        tier_code=tier["code"],
        tier_color=tier["color"],
        tier_progress=tier["progress"],
        wins=r.wins,
        losses=r.losses,
        matches_played=r.matches_played,
        peak_elo=r.peak_elo,
        win_rate=round(wr, 1),
    )


def match_out(m: Match) -> MatchOut:
    parts = []
    for p in m.participants:
        parts.append(
            MatchParticipantOut(
                nickname=p.user.nickname,
                team=p.team,
                kills=p.kills,
                deaths=p.deaths,
                assists=p.assists,
                elo_before=p.elo_before,
                elo_after=p.elo_after,
                elo_delta=p.elo_after - p.elo_before,
                won=p.won,
            )
        )
    return MatchOut(
        id=m.id,
        game=GameOut.model_validate(m.game),
        status=m.status.value,
        map_name=m.map_name,
        score_team_a=m.score_team_a,
        score_team_b=m.score_team_b,
        is_manual=getattr(m, "is_manual", True),
        created_at=m.created_at,
        finished_at=m.finished_at,
        participants=parts,
    )


def get_or_create_rating(db: Session, user_id: int, game_id: int) -> PlayerRating:
    r = (
        db.query(PlayerRating)
        .filter(PlayerRating.user_id == user_id, PlayerRating.game_id == game_id)
        .first()
    )
    if r:
        return r
    r = PlayerRating(user_id=user_id, game_id=game_id)
    db.add(r)
    db.flush()
    return r


MAPS = {
    "cs2": ["de_mirage", "de_inferno", "de_ancient", "de_anubis"],
    "dota2": ["Ranked All Pick"],
    "valorant": ["Ascent", "Bind", "Haven"],
    "lol": ["Summoner's Rift"],
}


def try_matchmaking(db: Session, game_id: int) -> Match | None:
    entries = (
        db.query(QueueEntry)
        .filter(QueueEntry.game_id == game_id)
        .order_by(QueueEntry.joined_at)
        .limit(10)
        .all()
    )
    game = db.get(Game, game_id)
    if not game or len(entries) < 2:
        return None

    needed = min(4, len(entries))
    selected = entries[:needed]
    for e in selected:
        db.delete(e)

    match = Match(
        game_id=game_id,
        status=MatchStatus.FINISHED,
        map_name=random.choice(MAPS.get(game.slug, ["Ranked"])),
        score_team_a=random.randint(10, 16),
        score_team_b=random.randint(5, 14),
        finished_at=datetime.utcnow(),
    )
    db.add(match)
    db.flush()

    half = len(selected) // 2
    team_a_wins = match.score_team_a > match.score_team_b
    team_a_ids = [e.user_id for i, e in enumerate(selected) if i < half]
    team_b_ids = [e.user_id for i, e in enumerate(selected) if i >= half]

    for a in team_a_ids:
        for b in team_b_ids:
            _update_rivalry(db, a, b, team_a_wins)

    for i, entry in enumerate(selected):
        team = "A" if i < half else "B"
        won = (team == "A" and team_a_wins) or (team == "B" and not team_a_wins)
        rating = get_or_create_rating(db, entry.user_id, game_id)
        opp_elo = 1200
        if won:
            delta = elo_change(rating.elo, opp_elo)
            rating.elo += delta
            rating.wins += 1
        else:
            delta = elo_change(opp_elo, rating.elo)
            rating.elo = max(100, rating.elo - delta)
            rating.losses += 1
        rating.matches_played += 1
        rating.peak_elo = max(rating.peak_elo, rating.elo)
        eb = rating.elo - delta if won else rating.elo + delta
        db.add(
            MatchParticipant(
                match_id=match.id,
                user_id=entry.user_id,
                team=team,
                kills=random.randint(8, 28),
                deaths=random.randint(6, 24),
                assists=random.randint(2, 12),
                elo_before=eb,
                elo_after=rating.elo,
                won=won,
            )
        )

    db.commit()
    db.refresh(match)
    return (
        db.query(Match)
        .options(joinedload(Match.game), joinedload(Match.participants).joinedload(MatchParticipant.user))
        .filter(Match.id == match.id)
        .first()
    )


def queue_status(db: Session, user: User) -> QueueStatus:
    entry = db.query(QueueEntry).filter(QueueEntry.user_id == user.id).first()
    count = db.query(QueueEntry).count()
    if entry:
        game = db.get(Game, entry.game_id)
        return QueueStatus(
            in_queue=True,
            game=GameOut.model_validate(game) if game else None,
            players_in_queue=count,
            estimated_wait_sec=max(15, 90 - count * 12),
        )
    return QueueStatus(in_queue=False, game=None, players_in_queue=count, estimated_wait_sec=0)


def _update_rivalry(db: Session, user_id: int, rival_id: int, user_won: bool) -> None:
    if user_id == rival_id:
        return
    now = datetime.utcnow()
    row = db.query(Rivalry).filter(Rivalry.user_id == user_id, Rivalry.rival_id == rival_id).first()
    if not row:
        row = Rivalry(user_id=user_id, rival_id=rival_id)
        db.add(row)
    if user_won:
        row.wins += 1
    else:
        row.losses += 1
    row.last_met_at = now
