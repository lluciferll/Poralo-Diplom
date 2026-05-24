import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MatchStatus(str, enum.Enum):
    PENDING = "pending"
    LIVE = "live"
    FINISHED = "finished"
    CANCELLED = "cancelled"


class TournamentStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    REGISTRATION = "registration"
    LIVE = "live"
    FINISHED = "finished"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    nickname: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    country: Mapped[str | None] = mapped_column(String(4), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False)
    trust_index: Mapped[int] = mapped_column(Integer, default=72)
    looking_for_team: Mapped[bool] = mapped_column(Boolean, default=False)
    primary_role: Mapped[str | None] = mapped_column(String(32), nullable=True)
    dna_manual: Mapped[bool] = mapped_column(Boolean, default=False)
    dna_entry: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dna_trade: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dna_clutch: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dna_anchor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dna_igl: Mapped[int | None] = mapped_column(Integer, nullable=True)
    steam_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    faceit_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ratings: Mapped[list["PlayerRating"]] = relationship(back_populates="user")
    team_memberships: Mapped[list["TeamMember"]] = relationship(back_populates="user")
    hub_memberships: Mapped[list["HubMember"]] = relationship(back_populates="user")
    mission_progress: Mapped[list["MissionProgress"]] = relationship(back_populates="user")
    achievements: Mapped[list["Achievement"]] = relationship(back_populates="user")


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(32), unique=True)
    name: Mapped[str] = mapped_column(String(64))
    code: Mapped[str] = mapped_column(String(8), default="GAME")
    accent_color: Mapped[str] = mapped_column(String(7), default="#6366f1")
    icon: Mapped[str] = mapped_column(String(8), default="")  # legacy, unused
    team_size: Mapped[int] = mapped_column(Integer, default=5)

    ratings: Mapped[list["PlayerRating"]] = relationship(back_populates="game")
    matches: Mapped[list["Match"]] = relationship(back_populates="game")
    tournaments: Mapped[list["Tournament"]] = relationship(back_populates="game")
    ladders: Mapped[list["Ladder"]] = relationship(back_populates="game")


class PlayerRating(Base):
    __tablename__ = "player_ratings"
    __table_args__ = (UniqueConstraint("user_id", "game_id", name="uq_user_game"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    elo: Mapped[int] = mapped_column(Integer, default=1000)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    matches_played: Mapped[int] = mapped_column(Integer, default=0)
    peak_elo: Mapped[int] = mapped_column(Integer, default=1000)

    user: Mapped["User"] = relationship(back_populates="ratings")
    game: Mapped["Game"] = relationship(back_populates="ratings")


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    tag: Mapped[str] = mapped_column(String(8))
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    captain_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    game: Mapped["Game"] = relationship()
    members: Mapped[list["TeamMember"]] = relationship(back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="uq_team_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String(16), default="player")

    team: Mapped["Team"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="team_memberships")


class Hub(Base):
    __tablename__ = "hubs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    member_count: Mapped[int] = mapped_column(Integer, default=0)

    game: Mapped["Game"] = relationship()
    members: Mapped[list["HubMember"]] = relationship(back_populates="hub")


class HubMember(Base):
    __tablename__ = "hub_members"
    __table_args__ = (UniqueConstraint("hub_id", "user_id", name="uq_hub_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    hub_id: Mapped[int] = mapped_column(ForeignKey("hubs.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    hub: Mapped["Hub"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="hub_memberships")


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    status: Mapped[MatchStatus] = mapped_column(Enum(MatchStatus), default=MatchStatus.PENDING)
    map_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    score_team_a: Mapped[int] = mapped_column(Integer, default=0)
    score_team_b: Mapped[int] = mapped_column(Integer, default=0)
    elo_stake: Mapped[int] = mapped_column(Integer, default=25)
    is_manual: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    game: Mapped["Game"] = relationship(back_populates="matches")
    participants: Mapped[list["MatchParticipant"]] = relationship(back_populates="match")


class MatchParticipant(Base):
    __tablename__ = "match_participants"

    id: Mapped[int] = mapped_column(primary_key=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    team: Mapped[str] = mapped_column(String(1))  # A or B
    kills: Mapped[int] = mapped_column(Integer, default=0)
    deaths: Mapped[int] = mapped_column(Integer, default=0)
    assists: Mapped[int] = mapped_column(Integer, default=0)
    elo_before: Mapped[int] = mapped_column(Integer, default=1000)
    elo_after: Mapped[int] = mapped_column(Integer, default=1000)
    won: Mapped[bool] = mapped_column(Boolean, default=False)
    opponent_nickname: Mapped[str | None] = mapped_column(String(64), nullable=True)

    match: Mapped["Match"] = relationship(back_populates="participants")
    user: Mapped["User"] = relationship()


class Tournament(Base):
    __tablename__ = "tournaments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    status: Mapped[TournamentStatus] = mapped_column(
        Enum(TournamentStatus), default=TournamentStatus.REGISTRATION
    )
    prize_pool: Mapped[str] = mapped_column(String(64), default="10 000 ₽")
    max_teams: Mapped[int] = mapped_column(Integer, default=16)
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    game: Mapped["Game"] = relationship(back_populates="tournaments")
    registrations: Mapped[list["TournamentRegistration"]] = relationship(
        back_populates="tournament"
    )


class TournamentRegistration(Base):
    __tablename__ = "tournament_registrations"
    __table_args__ = (UniqueConstraint("tournament_id", "user_id", name="uq_tourn_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    team_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    seed: Mapped[int | None] = mapped_column(Integer, nullable=True)

    tournament: Mapped["Tournament"] = relationship(back_populates="registrations")
    user: Mapped["User"] = relationship()


class Ladder(Base):
    __tablename__ = "ladders"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    season: Mapped[str] = mapped_column(String(32))
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    prize: Mapped[str] = mapped_column(String(64), default="Скины + ELO буст")

    game: Mapped["Game"] = relationship(back_populates="ladders")
    entries: Mapped[list["LadderEntry"]] = relationship(back_populates="ladder")


class LadderEntry(Base):
    __tablename__ = "ladder_entries"
    __table_args__ = (UniqueConstraint("ladder_id", "user_id", name="uq_ladder_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ladder_id: Mapped[int] = mapped_column(ForeignKey("ladders.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    points: Mapped[int] = mapped_column(Integer, default=0)
    rank: Mapped[int] = mapped_column(Integer, default=0)

    ladder: Mapped["Ladder"] = relationship(back_populates="entries")
    user: Mapped["User"] = relationship()


class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    party_size: Mapped[int] = mapped_column(Integer, default=1)
    min_elo: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_elo: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verified_only: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship()


class Rivalry(Base):
    __tablename__ = "rivalries"
    __table_args__ = (UniqueConstraint("user_id", "rival_id", name="uq_rivalry"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    rival_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    last_met_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    rival: Mapped["User"] = relationship(foreign_keys=[rival_id])


class Mission(Base):
    __tablename__ = "missions"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    title: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text)
    target: Mapped[int] = mapped_column(Integer, default=1)
    reward_label: Mapped[str] = mapped_column(String(64))
    game_id: Mapped[int | None] = mapped_column(ForeignKey("games.id"), nullable=True)

    game: Mapped["Game | None"] = relationship()
    progress_rows: Mapped[list["MissionProgress"]] = relationship(back_populates="mission")


class MissionProgress(Base):
    __tablename__ = "mission_progress"
    __table_args__ = (UniqueConstraint("user_id", "mission_id", name="uq_mission_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    mission_id: Mapped[int] = mapped_column(ForeignKey("missions.id"))
    progress: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="mission_progress")
    mission: Mapped["Mission"] = relationship(back_populates="progress_rows")


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    game_id: Mapped[int | None] = mapped_column(ForeignKey("games.id"), nullable=True)

    user: Mapped["User"] = relationship(back_populates="achievements")
    game: Mapped["Game | None"] = relationship()
