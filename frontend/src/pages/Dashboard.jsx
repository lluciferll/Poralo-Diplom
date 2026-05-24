import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PulseDNA from '../components/PulseDNA';
import TierBadge from '../components/TierBadge';
import TrustMeter from '../components/TrustMeter';
import GameBadge from '../components/GameBadge';
import ProfileProgress from '../components/ProfileProgress';
import EmptyState from '../components/EmptyState';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { hints, terms } from '../lib/copy';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (token) api.dashboard(token).then(setData).catch(console.error);
  }, [token]);

  if (!user) {
    return (
      <section className="page-wrap max-w-lg text-center">
        <PageHeader title="Личный кабинет" description="Войдите в аккаунт." />
        <Link to="/login" className="btn-accent">Войти</Link>
      </section>
    );
  }

  if (!data) return <p className="page-wrap text-center text-nx-muted">Загрузка...</p>;

  const { primary_rating, pulse_dna, rivalries, recent_matches, stats, completeness } = data;

  return (
    <section className="page-wrap-wide">
      <PageHeader
        label="Личный кабинет"
        title={user.nickname}
        description="Обзор вашего портфолио"
        action={<Link to="/profile/edit" className="btn-accent">Редактировать профиль</Link>}
      />

      <ProfileProgress percent={completeness.percent} hint={hints.profileComplete} />

      <section className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-3">
        <article className="panel panel-body lg:col-span-2">
          <p className="label-caps">{terms.pulseDna}</p>
          <p className="mt-4"><PulseDNA data={pulse_dna} /></p>
        </article>
        <aside className="space-y-6">
          <article className="panel panel-body">
            <p className="label-caps">{terms.trustIndex}</p>
            <p className="mt-3"><TrustMeter value={stats.trust_index ?? user.trust_index} /></p>
          </article>
          {primary_rating && (
            <article className="panel panel-body">
              <GameBadge game={primary_rating.game} />
              <p className="mt-4">
                <TierBadge
                  tierCode={primary_rating.tier_code}
                  tierLabel={primary_rating.level_label}
                  tierColor={primary_rating.tier_color}
                  elo={primary_rating.elo}
                  progress={primary_rating.tier_progress}
                />
              </p>
            </article>
          )}
        </aside>
      </section>

      <section className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4">
        <article className="panel p-3 sm:p-5">
          <p className="label-caps">{terms.winRate}</p>
          <p className="stat-value mt-2">{stats.win_rate}%</p>
        </article>
        <article className="panel p-3 sm:p-5">
          <p className="label-caps">Wins</p>
          <p className="stat-value mt-2">{stats.total_wins}</p>
        </article>
        <article className="panel p-3 sm:p-5">
          <p className="label-caps">Matches</p>
          <p className="stat-value mt-2">{stats.total_wins + stats.total_losses}</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2">
        <article className="panel panel-body">
          <p className="label-caps">{terms.rivalLedger}</p>
          {rivalries.length === 0 ? (
            <p className="mt-4"><EmptyState title="Нет дуэлей" description={hints.rivalEmpty} /></p>
          ) : (
            <ul className="mt-4 space-y-2">
              {rivalries.map((r) => (
                <li key={r.rival_id} className="flex items-center justify-between gap-2 rounded-lg border border-nx-border px-3 py-2.5 text-sm">
                  <Link to={`/player/${r.nickname}`} className="truncate hover:text-nx-accentHi">{r.nickname}</Link>
                  <span className="font-mono">{r.wins}W / {r.losses}L</span>
                </li>
              ))}
            </ul>
          )}
        </article>
        <article className="panel panel-body">
          <p className="label-caps">{terms.matchHistory}</p>
          {recent_matches.length === 0 ? (
            <p className="mt-4"><EmptyState title="Нет матчей" description={hints.matchesEmpty} /></p>
          ) : (
            <ul className="mt-4 space-y-2">
              {recent_matches.map((m) => (
                <li key={m.id} className="flex items-center gap-2 font-mono text-sm">
                  <GameBadge game={m.game} size="sm" />
                  <span>{m.map_name || '—'}</span>
                  <span className="text-nx-dim">·</span>
                  <span>{m.score_team_a}:{m.score_team_b}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/matches" className="btn-ghost mt-4 inline-flex text-xs">Вся история →</Link>
        </article>
      </section>
    </section>
  );
}
