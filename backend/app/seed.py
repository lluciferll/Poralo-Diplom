from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import (
    Achievement,
    Game,
    Hub,
    HubMember,
    Ladder,
    LadderEntry,
    Match,
    MatchParticipant,
    MatchStatus,
    Mission,
    MissionProgress,
    PlayerRating,
    Rivalry,
    Team,
    TeamMember,
    Tournament,
    TournamentRegistration,
    TournamentStatus,
    User,
)


def seed_database(db: Session) -> None:
    if db.query(User).first():
        return

    games_data = [
        ("cs2", "Counter-Strike 2", "CS2", "#e85d04", 5),
        ("dota2", "Dota 2", "DOTA", "#7c3aed", 5),
        ("valorant", "Valorant", "VAL", "#ef4444", 5),
        ("lol", "League of Legends", "LOL", "#0ea5e9", 5),
    ]
    games = []
    for slug, name, code, color, size in games_data:
        g = Game(slug=slug, name=name, code=code, accent_color=color, team_size=size)
        db.add(g)
        games.append(g)
    db.flush()

    users_data = [
        ("pro@arena.dev", "demo123", "NeonStrike", "RU", 94, True, "Entry"),
        ("player@arena.dev", "demo123", "ShadowFox", "UA", 68, False, "Anchor"),
        ("ace@arena.dev", "demo123", "VortexAce", "KZ", 88, True, "IGL"),
        ("nova@arena.dev", "demo123", "CyberNova", "BY", 71, True, "Trade"),
    ]
    users = []
    for email, pwd, nick, country, trust, lft, role in users_data:
        u = User(
            email=email,
            password_hash=hash_password(pwd),
            nickname=nick,
            country=country,
            is_verified=trust >= 85,
            is_premium=trust >= 90,
            trust_index=trust,
            looking_for_team=lft,
            primary_role=role,
            bio=f"Competitive operator · {role} specialist",
            avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={nick}&backgroundColor=1a1d29&textColor=6366f1",
        )
        db.add(u)
        users.append(u)
    db.flush()

    elos = [2150, 1420, 1680, 980, 1240, 890, 2010, 1100]
    idx = 0
    for u in users:
        for g in games[:2]:
            elo = elos[idx % len(elos)]
            idx += 1
            db.add(
                PlayerRating(
                    user_id=u.id,
                    game_id=g.id,
                    elo=elo,
                    wins=elo // 40,
                    losses=elo // 55,
                    matches_played=elo // 25,
                    peak_elo=elo + 120,
                )
            )

    missions_data = [
        ("win_3", "Серия побед", "Добавьте 3 победы в журнал матчей", 3, "+Trust", games[0].id),
        ("play_10", "Активность", "Запишите 10 матчей в журнал", 10, "Бонус к профилю", None),
    ]
    for code, title, desc, target, reward, gid in missions_data:
        db.add(Mission(code=code, title=title, description=desc, target=target, reward_label=reward, game_id=gid))
    db.flush()

    for u in users:
        for m in db.query(Mission).all():
            prog = 2 if m.code == "win_3" else 7 if m.code == "play_10" else 1
            db.add(
                MissionProgress(
                    user_id=u.id,
                    mission_id=m.id,
                    progress=min(prog, m.target),
                    completed=prog >= m.target,
                )
            )

    cs2 = games[0]
    team = Team(name="Phoenix Unit", tag="PHX", game_id=cs2.id, captain_id=users[0].id)
    db.add(team)
    db.flush()
    for u in users[:3]:
        db.add(TeamMember(team_id=team.id, user_id=u.id, role="captain" if u.id == users[0].id else "player"))

    hub = Hub(
        name="Syndicate: Northern Grid",
        description="Закрытое оперативное объединение для ranked-серии и scrim-блоков",
        game_id=cs2.id,
        owner_id=users[0].id,
        member_count=4,
    )
    db.add(hub)
    db.flush()
    for u in users:
        db.add(HubMember(hub_id=hub.id, user_id=u.id))

    now = datetime.utcnow()
    tournaments = [
        ("Pulse Championship S1", cs2.id, "150 000 ₽", 32),
        ("Circuit Open: Dota", games[1].id, "80 000 ₽", 16),
        ("VAL Protocol Cup", games[2].id, "60 000 ₽", 8),
    ]
    for i, (name, gid, prize, max_t) in enumerate(tournaments):
        t = Tournament(
            name=name,
            game_id=gid,
            status=TournamentStatus.REGISTRATION,
            prize_pool=prize,
            max_teams=max_t,
            starts_at=now + timedelta(days=5 + i * 2),
        )
        db.add(t)
        db.flush()
        for u in users[:3]:
            db.add(TournamentRegistration(tournament_id=t.id, user_id=u.id, team_name=f"Unit {u.nickname}"))

    ladder = Ladder(
        name="Grid Ladder — CS2",
        game_id=cs2.id,
        season="Protocol 2026-Q2",
        ends_at=now + timedelta(days=30),
        prize="Contract slot + hardware bundle",
    )
    db.add(ladder)
    db.flush()
    points = [420, 380, 310, 250]
    for i, u in enumerate(users):
        db.add(LadderEntry(ladder_id=ladder.id, user_id=u.id, points=points[i], rank=i + 1))

    users[0].dna_manual = True
    users[0].dna_entry = 78
    users[0].dna_trade = 55
    users[0].dna_clutch = 62
    users[0].dna_anchor = 48
    users[0].dna_igl = 70
    db.add(Achievement(user_id=users[0].id, title="Топ-8 регионального LAN", description="CS2, Spring 2025", game_id=cs2.id))
    db.add(Achievement(user_id=users[0].id, title="MVP финала", description="Лучший игрок серии", game_id=cs2.id))

    m = Match(
        game_id=cs2.id,
        status=MatchStatus.FINISHED,
        map_name="de_mirage",
        score_team_a=13,
        score_team_b=9,
        is_manual=True,
        finished_at=now - timedelta(hours=2),
    )
    db.add(m)
    db.flush()
    sample = [
        (users[0], "A", 24, 18, 5, 2150, 2168, True),
        (users[1], "B", 19, 22, 3, 1420, 1402, False),
        (users[2], "A", 18, 15, 8, 1680, 1695, True),
        (users[3], "B", 15, 20, 4, 980, 965, False),
    ]
    for u, team_side, k, d, a, eb, ea, won in sample:
        db.add(
            MatchParticipant(
                match_id=m.id,
                user_id=u.id,
                team=team_side,
                kills=k,
                deaths=d,
                assists=a,
                elo_before=eb,
                elo_after=ea,
                won=won,
            )
        )

    db.add(Rivalry(user_id=users[0].id, rival_id=users[1].id, wins=3, losses=1, last_met_at=now))
    db.add(Rivalry(user_id=users[1].id, rival_id=users[0].id, wins=1, losses=3, last_met_at=now))
    db.add(Rivalry(user_id=users[0].id, rival_id=users[2].id, wins=2, losses=2, last_met_at=now - timedelta(days=1)))

    db.commit()
