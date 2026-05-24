import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import GameBadge from '../components/GameBadge';
import EmptyState from '../components/EmptyState';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { terms } from '../lib/copy';

export default function Teams() {
  const { token } = useAuth();
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [form, setForm] = useState({ name: '', tag: '', game_id: 1 });

  useEffect(() => {
    api.games().then((g) => {
      setGames(g);
      if (g.length) setForm((f) => ({ ...f, game_id: g[0].id }));
    });
    api.teams().then(setTeams);
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!token) return alert('Требуется авторизация');
    try {
      await api.createTeam(token, form);
      setTeams(await api.teams());
      setForm({ name: '', tag: '', game_id: games[0]?.id || 1 });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section className="page-wrap max-w-6xl">
      <PageHeader
        label={terms.roster}
        title="Команды"
        description="Создайте команду и укажите дисциплину — для портфолио и регистрации на турниры."
      />

      {token && (
        <form onSubmit={create} className="panel panel-body mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap">
          <input className="input-field sm:max-w-xs" placeholder="Название команды" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="input-field sm:max-w-[100px] font-mono uppercase" placeholder="TAG" maxLength={8} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} required />
          <select className="input-field sm:max-w-xs" value={form.game_id} onChange={(e) => setForm({ ...form, game_id: Number(e.target.value) })}>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <button type="submit" className="btn-accent">Создать команду</button>
        </form>
      )}

      {teams.length === 0 ? (
        <EmptyState title="Команд пока нет" description="Создайте первую команду или зайдите под demo-аккаунтом." />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <article key={t.id} className="panel p-6">
              <header className="flex items-center justify-between">
                <span className="rounded-md border border-nx-accent/40 bg-nx-accent/10 px-2 py-1 font-mono text-sm font-bold text-nx-accentHi">{t.tag}</span>
                <span className="font-mono text-xs text-nx-dim">{t.member_count} players</span>
              </header>
              <h3 className="mt-4 font-display text-xl font-semibold">{t.name}</h3>
              <p className="mt-3 flex items-center gap-2">
                <GameBadge game={t.game} size="sm" />
                <span className="text-sm text-nx-muted">{t.game.name}</span>
              </p>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
