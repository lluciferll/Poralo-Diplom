# Система рангов ArenaPulse — собственная, не копия FACEIT Levels

TIER_THRESHOLDS = [
    (0, "WIRE", "Wire", "#64748b"),
    (900, "CIRCUIT", "Circuit", "#38bdf8"),
    (1200, "FORGE", "Forge", "#a78bfa"),
    (1500, "OBSIDIAN", "Obsidian", "#f472b6"),
    (1900, "APEX", "Apex", "#fbbf24"),
]


def tier_from_elo(elo: int) -> dict:
    current = TIER_THRESHOLDS[0]
    for threshold, code, label, color in TIER_THRESHOLDS:
        if elo >= threshold:
            current = (threshold, code, label, color)
    _, code, label, color = current
    next_idx = next((i for i, t in enumerate(TIER_THRESHOLDS) if t[0] > elo), len(TIER_THRESHOLDS) - 1)
    next_threshold = TIER_THRESHOLDS[next_idx][0] if next_idx < len(TIER_THRESHOLDS) else elo + 200
    prev_threshold = current[0]
    span = max(1, next_threshold - prev_threshold)
    progress = min(100, int((elo - prev_threshold) / span * 100))
    return {
        "code": code,
        "label": label,
        "color": color,
        "progress": progress,
        "elo": elo,
    }


# Обратная совместимость API
def level_from_elo(elo: int) -> int:
    tier = tier_from_elo(elo)
    mapping = {"WIRE": 1, "CIRCUIT": 3, "FORGE": 5, "OBSIDIAN": 8, "APEX": 10}
    return mapping.get(tier["code"], 1)


def level_label(elo: int) -> str:
    return tier_from_elo(elo)["label"]


def expected_score(elo_a: int, elo_b: int) -> float:
    return 1 / (1 + 10 ** ((elo_b - elo_a) / 400))


def elo_change(winner_elo: int, loser_elo: int, k: int = 32, performance: float = 1.0) -> int:
    exp = expected_score(winner_elo, loser_elo)
    delta = round(k * (1 - exp) * performance)
    return max(8, min(45, delta))
