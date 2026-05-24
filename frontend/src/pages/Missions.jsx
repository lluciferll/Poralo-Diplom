import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import GameBadge from '../components/GameBadge';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Missions() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (token) api.missions(token).then(setItems);
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
      <PageHeader
        label="Operative Contracts"
        title="Контракты"
        description="Измеримые цели на неделю. Прогресс обновляется после матчмейкинга и турниров."
      />

      {!token && <p className="text-nx-muted">Войдите, чтобы видеть активные контракты.</p>}

      <div className="space-y-4">
        {items.map((m) => (
          <article key={m.id} className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-nx-dim">{m.code}</p>
                <h3 className="mt-1 font-display text-xl font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm text-nx-muted">{m.description}</p>
              </div>
              {m.game && <GameBadge game={m.game} />}
            </div>
            <p className="mt-4 font-mono text-sm text-nx-gold">Reward: {m.reward_label}</p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between font-mono text-xs text-nx-dim">
                <span>Progress</span>
                <span>
                  {m.progress}/{m.target} {m.completed && '· COMPLETE'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-nx-border">
                <div
                  className={`h-full ${m.completed ? 'bg-nx-success' : 'bg-nx-accent'}`}
                  style={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
