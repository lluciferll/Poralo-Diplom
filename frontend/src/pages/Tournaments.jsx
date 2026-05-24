import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import GameBadge from '../components/GameBadge';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Tournaments() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.tournaments().then(setItems);
  }, []);

  const register = async (id) => {
    if (!token) return alert('Требуется авторизация');
    try {
      await api.registerTournament(token, id);
      setItems(await api.tournaments());
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section className="page-wrap max-w-6xl">
      <PageHeader label="Tournaments" title="Турниры" description="Регистрация команды на чемпионаты — дополнение к портфолио игрока." />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((t) => (
          <article key={t.id} className="panel-hover overflow-hidden">
            <header className="border-b border-nx-border bg-nx-surface px-6 py-4">
              <GameBadge game={t.game} />
              <h3 className="mt-3 font-display text-xl font-semibold">{t.name}</h3>
            </header>
            <section className="space-y-3 p-6">
              <p className="font-display text-2xl font-bold text-nx-gold">{t.prize_pool}</p>
              <p className="font-mono text-xs text-nx-dim">{new Date(t.starts_at).toLocaleString('ru-RU')}</p>
              <p className="text-sm text-nx-muted">
                {t.registered}/{t.max_teams} teams · {t.status}
              </p>
              <button type="button" className="btn-accent w-full" onClick={() => register(t.id)}>
                Зарегистрировать команду
              </button>
            </section>
          </article>
        ))}
      </section>
    </section>
  );
}
