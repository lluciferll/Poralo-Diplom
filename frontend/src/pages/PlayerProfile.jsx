import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Trophy } from 'lucide-react';
import PulseDNA from '../components/PulseDNA';
import TierBadge from '../components/TierBadge';
import TrustMeter from '../components/TrustMeter';
import GameBadge from '../components/GameBadge';
import EmptyState from '../components/EmptyState';
import { api } from '../api';
import { hints, terms } from '../lib/copy';

export default function PlayerProfile() {
  const { nickname } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.profile(nickname).then(setProfile).catch(() => setProfile(null));
  }, [nickname]);

  if (!profile) {
    return <p className="page-wrap py-16 text-center text-nx-muted">Загрузка или игрок не найден</p>;
  }

  const links = [
    profile.steam_url && { label: 'Steam', href: profile.steam_url },
    profile.faceit_url && { label: 'FACEIT', href: profile.faceit_url },
  ].filter(Boolean);

  return (
    <section className="page-wrap max-w-5xl">
      <header className="panel panel-body flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
        <img
          src={profile.avatar_url}
          alt=""
          className="h-20 w-20 shrink-0 rounded-xl border border-nx-border bg-nx-surface object-cover sm:h-24 sm:w-24"
        />
        <article className="min-w-0 w-full flex-1">
          <p className="label-caps">Player profile</p>
          <h1 className="break-words font-display text-2xl font-bold sm:text-3xl md:text-4xl">{profile.nickname}</h1>
          <p className="mt-2 text-sm text-nx-muted sm:text-base">
            {profile.country || '—'} · {profile.primary_role || 'Flex'}
          </p>
          {profile.bio && <p className="mt-2 text-sm leading-relaxed text-nx-muted">{profile.bio}</p>}
          {profile.looking_for_team && <span className="badge-lft mt-3">{terms.lft}</span>}
          {links.length > 0 && (
            <nav className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="btn-outline px-3 py-2 text-xs">
                  {l.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </nav>
          )}
        </article>
        <aside className="w-full max-w-xs sm:w-44">
          <TrustMeter value={profile.trust_index ?? 72} />
        </aside>
      </header>

      <section className="panel panel-body mt-4 sm:mt-8">
        <PulseDNA data={profile.pulse_dna} />
      </section>

      <section className="mt-4 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2">
        <article className="panel p-4 sm:p-6">
          <p className="label-caps">Discipline ratings</p>
          {profile.ratings.length === 0 ? (
            <EmptyState title="Нет рейтингов" description="Игрок ещё не добавил дисциплины в портфолио." />
          ) : (
            <ul className="mt-4 space-y-3 sm:space-y-4">
              {profile.ratings.map((r) => (
                <li key={r.game.id} className="panel-inset p-3 sm:p-4">
                  <p className="flex items-center gap-3">
                    <GameBadge game={r.game} size="sm" />
                    <span className="font-medium">{r.game.name}</span>
                  </p>
                  <p className="mt-3">
                    <TierBadge tierCode={r.tier_code} tierLabel={r.level_label} tierColor={r.tier_color} elo={r.elo} progress={r.tier_progress} />
                  </p>
                  <p className="mt-3 break-words font-mono text-[11px] text-nx-dim sm:text-xs">
                    {r.wins}W / {r.losses}L · {r.win_rate}% {terms.winRate} · {terms.peak} {r.peak_elo} {terms.mr}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel p-4 sm:p-6">
          <p className="label-caps">{terms.rivalLedger}</p>
          {profile.rivalries.length === 0 ? (
            <EmptyState title="Пусто" description={hints.rivalEmpty} />
          ) : (
            <ul className="mt-4 space-y-2">
              {profile.rivalries.map((r) => (
                <li key={r.rival_id} className="flex items-center justify-between gap-3 rounded-lg border border-nx-border px-3 py-3 font-mono text-sm sm:px-4">
                  <Link to={`/player/${r.nickname}`} className="truncate hover:text-nx-accentHi">{r.nickname}</Link>
                  <span className="shrink-0">
                    <span className="text-nx-success">{r.wins}W</span>
                    <span className="text-nx-dim"> / </span>
                    <span className="text-nx-danger">{r.losses}L</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="panel mt-4 p-4 sm:mt-8 sm:p-6">
        <p className="label-caps flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5" />
          Achievements
        </p>
        {!profile.achievements?.length ? (
          <p className="mt-4">
            <EmptyState title="Нет достижений" description={hints.achievementsEmpty} />
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {profile.achievements.map((a) => (
              <li key={a.id} className="panel-inset p-3 sm:p-4">
                <p className="font-semibold">{a.title}</p>
                {a.description && <p className="mt-1 text-sm text-nx-muted">{a.description}</p>}
                {a.game && (
                  <p className="mt-2 flex items-center gap-2">
                    <GameBadge game={a.game} size="sm" />
                    <span className="text-xs text-nx-dim">{a.game.name}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
