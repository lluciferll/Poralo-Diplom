from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    nickname: str = Field(min_length=3, max_length=64)
    country: str | None = Field(default=None, max_length=4)
    primary_role: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    nickname: str
    avatar_url: str | None
    country: str | None
    bio: str | None
    is_verified: bool
    is_premium: bool
    trust_index: int = 72
    looking_for_team: bool = False
    primary_role: str | None = None
    steam_url: str | None = None
    faceit_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    nickname: str | None = None
    avatar_url: str | None = None
    country: str | None = None
    bio: str | None = None
    primary_role: str | None = None
    looking_for_team: bool | None = None


class GameOut(BaseModel):
    id: int
    slug: str
    name: str
    code: str
    accent_color: str
    team_size: int

    model_config = {"from_attributes": True}


class RatingOut(BaseModel):
    game: GameOut
    elo: int
    level: int
    level_label: str
    tier_code: str
    tier_color: str
    tier_progress: int
    wins: int
    losses: int
    matches_played: int
    peak_elo: int
    win_rate: float


class PulseDNAOut(BaseModel):
    axes: dict[str, int]
    archetype: str
    summary: str
    matches_analyzed: int
    dominant_axis: str | None = None
    is_manual: bool = False


class AchievementOut(BaseModel):
    id: int
    title: str
    description: str | None
    event_date: datetime | None
    game: GameOut | None = None

    model_config = {"from_attributes": True}


class RivalryOut(BaseModel):
    rival_id: int
    nickname: str
    avatar_url: str | None
    wins: int
    losses: int
    last_met_at: datetime | None


class ProfileOut(UserOut):
    ratings: list[RatingOut]
    pulse_dna: PulseDNAOut
    rivalries: list[RivalryOut]
    achievements: list[AchievementOut] = []


class TeamCreate(BaseModel):
    name: str
    tag: str = Field(max_length=8)
    game_id: int


class TeamOut(BaseModel):
    id: int
    name: str
    tag: str
    logo_url: str | None
    game: GameOut
    member_count: int

    model_config = {"from_attributes": True}


class HubOut(BaseModel):
    id: int
    name: str
    description: str | None
    game: GameOut
    member_count: int

    model_config = {"from_attributes": True}


class MatchParticipantOut(BaseModel):
    nickname: str
    team: str
    kills: int
    deaths: int
    assists: int
    elo_before: int
    elo_after: int
    elo_delta: int
    won: bool


class MatchOut(BaseModel):
    id: int
    game: GameOut
    status: str
    map_name: str | None
    score_team_a: int
    score_team_b: int
    is_manual: bool = True
    created_at: datetime
    finished_at: datetime | None
    participants: list[MatchParticipantOut]


class TournamentOut(BaseModel):
    id: int
    name: str
    game: GameOut
    status: str
    prize_pool: str
    max_teams: int
    registered: int
    starts_at: datetime

    model_config = {"from_attributes": True}


class LadderOut(BaseModel):
    id: int
    name: str
    game: GameOut
    season: str
    ends_at: datetime
    prize: str
    top_players: list[dict]

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    nickname: str
    avatar_url: str | None
    country: str | None
    elo: int
    tier_code: str
    tier_label: str
    tier_color: str
    wins: int
    losses: int
    trust_index: int
    looking_for_team: bool


class QueueJoin(BaseModel):
    game_id: int
    party_size: int = Field(default=1, ge=1, le=5)
    high_trust_only: bool = False


class QueueStatus(BaseModel):
    in_queue: bool
    game: GameOut | None = None
    players_in_queue: int
    estimated_wait_sec: int


class MissionOut(BaseModel):
    id: int
    code: str
    title: str
    description: str
    target: int
    progress: int
    completed: bool
    reward_label: str
    game: GameOut | None = None


class ScoutEntry(BaseModel):
    user_id: int
    nickname: str
    avatar_url: str | None
    country: str | None
    game: GameOut
    elo: int
    tier_code: str
    elo_gain_7d: int
    trust_index: int
    archetype: str


class DashboardOut(BaseModel):
    user: UserOut
    primary_rating: RatingOut | None
    pulse_dna: PulseDNAOut
    rivalries: list[RivalryOut]
    missions: list[MissionOut]
    recent_matches: list[MatchOut]
    completeness: dict
    stats: dict
