"""Pulse DNA — уникальный профиль стиля игры по статистике матчей."""

from sqlalchemy.orm import Session

from app.models import Match, MatchParticipant


AXES = ("entry", "trade", "clutch", "anchor", "igl")


def compute_pulse_dna(db: Session, user_id: int, game_id: int | None = None) -> dict:
    q = db.query(MatchParticipant).filter(MatchParticipant.user_id == user_id)
    if game_id:
        q = q.join(Match).filter(Match.game_id == game_id)
    rows = q.limit(80).all()

    if not rows:
        return {
            "axes": {k: 50 for k in AXES},
            "archetype": "Unranked",
            "summary": "Недостаточно матчей для анализа стиля.",
            "matches_analyzed": 0,
        }

    total_k = sum(r.kills for r in rows)
    total_d = sum(r.deaths for r in rows) or 1
    total_a = sum(r.assists for r in rows)
    wins = sum(1 for r in rows if r.won)
    kd = total_k / total_d
    ka = (total_k + total_a) / len(rows)

    entry = min(99, int(kd * 28 + (total_k / len(rows)) * 1.2))
    trade = min(99, int(55 + kd * 12 - abs(total_k - total_a) * 0.3))
    clutch = min(99, int(40 + (wins / len(rows)) * 55 + kd * 8))
    anchor = min(99, int(70 - (total_d / len(rows)) * 2.5 + total_a * 0.4))
    igl = min(99, int(35 + total_a * 0.9 + (wins / len(rows)) * 25))

    axes = {"entry": entry, "trade": trade, "clutch": clutch, "anchor": anchor, "igl": igl}
    dominant = max(axes, key=axes.get)
    archetypes = {
        "entry": "Entry Fragger",
        "trade": "Trade Specialist",
        "clutch": "Closer",
        "anchor": "Anchor",
        "igl": "Shot Caller",
    }
    summaries = {
        "entry": "Агрессивное открытие раундов, высокий impact в первых контактах.",
        "trade": "Стабильный размен и контроль дуэлей в пачке.",
        "clutch": "Решающие раунды и высокая конверсия в концовках.",
        "anchor": "Удержание позиций и минимизация смертей.",
        "igl": "Тактическое лидерство и поддержка команды.",
    }

    return {
        "axes": axes,
        "archetype": archetypes[dominant],
        "summary": summaries[dominant],
        "matches_analyzed": len(rows),
        "dominant_axis": dominant,
    }
