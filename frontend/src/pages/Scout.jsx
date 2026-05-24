import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import GameBadge from '../components/GameBadge';
import TierBadge from '../components/TierBadge';
import TrustMeter from '../components/TrustMeter';
import FilterChips, { FilterChip } from '../components/FilterChips';
import { terms } from '../lib/copy';
import EmptyState from '../components/EmptyState';
import { api } from '../api';

export default function Scout() {
  const [games, setGames] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.games().then((g) => {
      setGames(g);
      if (g.length) setGameId(g[0].id);
    });
  }, []);

  useEffect(() => {
    api.scout(gameId || undefined).then(setRows);
  }, [gameId]);

  return (
    <section className="page-wrap-wide">
      <PageHeader
        label={terms.scout}
        title="Игроки с ростом рейтинга"
        description="Динамика Match Rating, Trust Index и архетип Pulse DNA за 7 дней."
      />

      <FilterChips>
        <FilterChip active={!gameId} onClick={() => setGameId(null)}>
          <span className="font-mono text-xs uppercase">All</span>
        </FilterChip>
        {games.map((g) => (
          <FilterChip key={g.id} active={gameId === g.id} onClick={() => setGameId(g.id)}>
            <GameBadge game={g} size="sm" />
            <span>{g.name}</span>
          </FilterChip>
        ))}
      </FilterChips>

      {rows.length === 0 ? (
        <EmptyState title="Нет данных" description="Добавьте матчи в профиль — Scout покажет игроков с ростом MR." />
      ) : (
        <section className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r, i) => (
            <article key={`${r.user_id}-${r.game.id}`} className="panel-hover p-4 sm:p-5">
              <header className="flex items-start justify-between gap-2">
                <span className="font-mono text-xl font-bold text-nx-dim sm:text-2xl">#{String(i + 1).padStart(2, '0')}</span>
                <span className="rounded-md bg-nx-success/10 px-2 py-1 font-mono text-[10px] text-nx-success sm:text-xs">
                  +{r.elo_gain_7d} MR / 7d
                </span>
              </header>
              <Link to={`/player/${r.nickname}`} className="mt-4 flex items-center gap-3">
                <img src={r.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover sm:h-12 sm:w-12" />
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-semibold sm:text-lg">{r.nickname}</span>
                  <span className="block truncate text-xs text-nx-muted">{r.country} · {r.archetype}</span>
                </span>
              </Link>
              <p className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <GameBadge game={r.game} size="sm" />
                <TierBadge tierCode={r.tier_code} tierLabel={r.tier_code} tierColor="#6366f1" elo={r.elo} compact />
              </p>
              <p className="mt-4">
                <TrustMeter value={r.trust_index} />
              </p>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
