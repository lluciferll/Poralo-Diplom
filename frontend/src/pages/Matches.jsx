import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import GameBadge from '../components/GameBadge';
import EmptyState from '../components/EmptyState';
import { api } from '../api';
import { hints, terms } from '../lib/copy';

export default function Matches() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    api.matches().then(setMatches);
  }, []);

  return (
    <section className="page-wrap max-w-5xl">
      <PageHeader
        label={terms.matchHistory}
        title="История матчей"
        description="K/D/A, MR delta и карта — данные добавляет игрок в профиле."
      />

      {matches.length === 0 ? (
        <EmptyState
          title="Нет матчей"
          description={hints.matchesEmpty}
          action={<Link to="/profile/edit" className="btn-accent">Добавить матч</Link>}
        />
      ) : (
        <section className="space-y-4">
          {matches.map((m) => (
            <article key={m.id} className="panel p-4 sm:p-6">
              <header className="flex flex-col gap-3 border-b border-nx-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="flex items-center gap-3">
                  <GameBadge game={m.game} />
                  <span className="min-w-0">
                    <span className="block font-mono text-xs uppercase text-nx-dim">{m.map_name || '—'}</span>
                    <span className="font-display text-base font-semibold sm:text-lg">{m.game.name}</span>
                  </span>
                </p>
                <p className="font-mono text-2xl font-bold sm:text-3xl">
                  <span className="text-nx-accentHi">{m.score_team_a}</span>
                  <span className="text-nx-dim"> : </span>
                  {m.score_team_b}
                </p>
              </header>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {m.participants.map((p) => (
                  <li
                    key={p.nickname + p.team}
                    className={`flex flex-col gap-1 rounded-md border px-3 py-2.5 font-mono text-xs sm:flex-row sm:items-center sm:justify-between ${
                      p.won ? 'border-nx-success/30 bg-nx-success/5' : 'border-nx-border bg-nx-surface'
                    }`}
                  >
                    <span>
                      [{p.team}] {p.nickname} · {p.kills}/{p.deaths}/{p.assists}
                    </span>
                    <span className={p.elo_delta >= 0 ? 'text-nx-success' : 'text-nx-danger'}>
                      {p.elo_delta >= 0 ? '+' : ''}
                      {p.elo_delta} {terms.mr}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
