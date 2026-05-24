import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import GameBadge from '../components/GameBadge';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Syndicates() {
  const { token } = useAuth();
  const [hubs, setHubs] = useState([]);
  const [ladders, setLadders] = useState([]);

  useEffect(() => {
    api.hubs().then(setHubs);
    api.ladders().then(setLadders);
  }, []);

  const join = async (id) => {
    if (!token) return alert('Требуется авторизация');
    await api.joinHub(token, id);
    setHubs(await api.hubs());
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
      <PageHeader
        label="Syndicates"
        title="Оперативные синдикаты"
        description="Закрытые объединения для scrim-серий, внутренних ладдеров и командной подготовки."
      />

      <section>
        <h2 className="label-caps">Active syndicates</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {hubs.map((h) => (
            <article key={h.id} className="panel-hover p-6">
              <div className="flex items-center gap-3">
                <GameBadge game={h.game} />
                <h3 className="font-display text-xl font-semibold">{h.name}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-nx-muted">{h.description}</p>
              <p className="mt-3 font-mono text-xs text-nx-dim">{h.member_count} operators enrolled</p>
              <button type="button" className="btn-accent mt-5" onClick={() => join(h.id)}>
                Request access
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="label-caps">Grid ladders</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ladders.map((l) => (
            <article key={l.id} className="panel p-6">
              <p className="font-mono text-xs text-nx-dim">{l.season}</p>
              <h3 className="mt-1 font-display text-xl font-semibold">{l.name}</h3>
              <p className="mt-2 text-sm text-nx-gold">{l.prize}</p>
              <ul className="mt-4 space-y-2 border-t border-nx-border pt-4 font-mono text-sm">
                {l.top_players.map((p) => (
                  <li key={p.nickname} className="flex justify-between">
                    <span>#{p.rank} {p.nickname}</span>
                    <span className="text-nx-muted">{p.points} pts</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
