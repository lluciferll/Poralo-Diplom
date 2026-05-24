import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import GameBadge from '../components/GameBadge';
import TierBadge from '../components/TierBadge';
import TrustMeter from '../components/TrustMeter';
import FilterChips, { FilterChip } from '../components/FilterChips';
import { terms } from '../lib/copy';
import { api } from '../api';

function LeaderboardCard({ row }) {
  return (
    <article className="mobile-card">
      <header className="flex items-start justify-between gap-3">
        <span className="font-mono text-lg font-bold text-nx-dim">#{String(row.rank).padStart(2, '0')}</span>
        {row.looking_for_team && <span className="badge-lft">{terms.lft}</span>}
      </header>
      <Link to={`/player/${row.nickname}`} className="mt-3 flex items-center gap-3">
        <img src={row.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
        <span className="min-w-0">
          <span className="block truncate font-display text-lg font-semibold">{row.nickname}</span>
          <span className="mt-1 block">
            <TierBadge tierCode={row.tier_code} tierLabel={row.tier_label} tierColor={row.tier_color} compact />
          </span>
        </span>
      </Link>
      <footer className="mt-4 grid grid-cols-3 gap-2 border-t border-nx-border pt-3 font-mono text-xs">
        <span>
          <span className="block text-nx-dim">MR</span>
          <span className="font-semibold text-nx-text">{row.elo}</span>
        </span>
        <span>
          <span className="block text-nx-dim">W/L</span>
          <span>{row.wins}/{row.losses}</span>
        </span>
        <span>
          <span className="block text-nx-dim">Trust</span>
          <TrustMeter value={row.trust_index} showLabel={false} />
        </span>
      </footer>
    </article>
  );
}

export default function Leaderboard() {
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
    if (gameId) api.leaderboard(gameId).then(setRows);
  }, [gameId]);

  return (
    <section className="page-wrap max-w-5xl">
      <PageHeader label={terms.leaderboard} title="Глобальный рейтинг" description="Match Rating и Tier по дисциплине." />

      <FilterChips>
        {games.map((g) => (
          <FilterChip key={g.id} active={gameId === g.id} onClick={() => setGameId(g.id)}>
            <GameBadge game={g} size="sm" />
            <span>{g.name}</span>
          </FilterChip>
        ))}
      </FilterChips>

      <section className="space-y-3 md:hidden">
        {rows.map((r) => (
          <LeaderboardCard key={r.user_id} row={r} />
        ))}
      </section>

      <section className="panel hidden overflow-hidden md:block">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Tier</th>
                <th>MR</th>
                <th>W/L</th>
                <th>Trust</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="font-mono text-nx-dim">{String(r.rank).padStart(2, '0')}</td>
                  <td>
                    <Link to={`/player/${r.nickname}`} className="flex items-center gap-3 hover:text-nx-accentHi">
                      <img src={r.avatar_url} alt="" className="h-9 w-9 rounded-md object-cover" />
                      <span className="font-medium">{r.nickname}</span>
                      {r.looking_for_team && <span className="badge-lft">LFT</span>}
                    </Link>
                  </td>
                  <td>
                    <TierBadge tierCode={r.tier_code} tierLabel={r.tier_label} tierColor={r.tier_color} compact />
                  </td>
                  <td className="font-mono font-semibold">{r.elo}</td>
                  <td className="font-mono text-nx-muted">{r.wins}/{r.losses}</td>
                  <td className="w-28">
                    <TrustMeter value={r.trust_index} showLabel={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
