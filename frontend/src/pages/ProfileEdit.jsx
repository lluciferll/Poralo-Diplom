import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import GameBadge from '../components/GameBadge';
import PulseDNA from '../components/PulseDNA';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

import { dnaAxes, roles, terms } from '../lib/copy';
import ProfileProgress from '../components/ProfileProgress';
import TabBar from '../components/TabBar';

const DNA_KEYS = Object.keys(dnaAxes);

export default function ProfileEdit() {
  const { token, user } = useAuth();
  const [games, setGames] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [tab, setTab] = useState('profile');
  const [msg, setMsg] = useState('');

  const [profileForm, setProfileForm] = useState({});
  const [linksForm, setLinksForm] = useState({ steam_url: '', faceit_url: '' });
  const [ratingForm, setRatingForm] = useState({ game_id: 1, elo: 1000, wins: 0, losses: 0 });
  const [matchForm, setMatchForm] = useState({
    game_id: 1,
    map_name: '',
    kills: 15,
    deaths: 12,
    assists: 4,
    won: true,
    score_for: 13,
    score_against: 10,
    elo_delta: 15,
    opponent_nickname: '',
  });
  const [dnaForm, setDnaForm] = useState({ entry: 50, trade: 50, clutch: 50, anchor: 50, igl: 50 });
  const [achForm, setAchForm] = useState({ title: '', description: '', game_id: '' });

  const load = () => {
    if (!token) return;
    api.portfolio(token).then((p) => {
      setPortfolio(p);
      setProfileForm({
        nickname: p.user.nickname,
        bio: p.user.bio || '',
        country: p.user.country || '',
        primary_role: p.user.primary_role || 'Flex',
        looking_for_team: p.user.looking_for_team,
        avatar_url: p.user.avatar_url || '',
      });
      setLinksForm({ steam_url: p.user.steam_url || '', faceit_url: p.user.faceit_url || '' });
      if (p.pulse_dna?.axes) setDnaForm(p.pulse_dna.axes);
    });
  };

  useEffect(() => {
    api.games().then((g) => {
      setGames(g);
      if (g.length) {
        setRatingForm((f) => ({ ...f, game_id: g[0].id }));
        setMatchForm((f) => ({ ...f, game_id: g[0].id }));
      }
    });
  }, []);

  useEffect(load, [token]);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    await api.updateProfile(token, profileForm);
    await api.updateLinks(token, linksForm);
    flash('Профиль сохранён');
    load();
  };

  const saveRating = async (e) => {
    e.preventDefault();
    await api.saveRating(token, ratingForm);
    flash('Рейтинг сохранён');
    load();
  };

  const saveDna = async (e) => {
    e.preventDefault();
    await api.savePulseDna(token, dnaForm);
    flash('Pulse DNA сохранён');
    load();
  };

  const addMatch = async (e) => {
    e.preventDefault();
    await api.addMatch(token, { ...matchForm, opponent_nickname: matchForm.opponent_nickname || null });
    flash('Матч добавлен');
    load();
  };

  const addAchievement = async (e) => {
    e.preventDefault();
    await api.addAchievement(token, {
      title: achForm.title,
      description: achForm.description || null,
      game_id: achForm.game_id ? Number(achForm.game_id) : null,
    });
    setAchForm({ title: '', description: '', game_id: '' });
    flash('Достижение добавлено');
    load();
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <PageHeader title="Мой профиль" description="Войдите для редактирования." />
        <Link to="/login" className="btn-accent">Войти</Link>
      </div>
    );
  }

  if (!portfolio) return <p className="p-24 text-center text-nx-muted">Загрузка...</p>;

  const tabs = [
    { id: 'profile', label: 'Основное' },
    { id: 'ratings', label: 'Дисциплины' },
    { id: 'matches', label: 'Match History' },
    { id: 'dna', label: terms.pulseDna },
    { id: 'achievements', label: 'Достижения' },
  ];

  return (
    <section className="page-wrap max-w-4xl">
      <PageHeader
        label="Портфолио"
        title="Мой профиль"
        description="Вы сами ведёте статистику — без интеграции с играми."
        action={<Link to={`/player/${user.nickname}`} className="btn-outline text-sm">Публичная страница</Link>}
      />

      <ProfileProgress
        percent={portfolio.completeness.percent}
        hint="Заполните все вкладки — так выше Trust Index и заметнее профиль для скаутов."
      />

      {msg && <p className="alert-success mb-4">{msg}</p>}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="panel panel-body space-y-4">
          <input className="input-field" placeholder="Никнейм" value={profileForm.nickname || ''} onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })} />
          <textarea className="input-field min-h-[100px]" placeholder="О себе" value={profileForm.bio || ''} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
          <input className="input-field" placeholder="Страна" value={profileForm.country || ''} onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })} />
          <select className="input-field" value={profileForm.primary_role || 'Flex'} onChange={(e) => setProfileForm({ ...profileForm, primary_role: e.target.value })}>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input className="input-field" placeholder="URL аватара" value={profileForm.avatar_url || ''} onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!profileForm.looking_for_team} onChange={(e) => setProfileForm({ ...profileForm, looking_for_team: e.target.checked })} />
            Ищу команду ({terms.lft})
          </label>
          <input className="input-field" placeholder="Steam URL" value={linksForm.steam_url} onChange={(e) => setLinksForm({ ...linksForm, steam_url: e.target.value })} />
          <input className="input-field" placeholder="Ссылка на FACEIT / другое" value={linksForm.faceit_url} onChange={(e) => setLinksForm({ ...linksForm, faceit_url: e.target.value })} />
          <button type="submit" className="btn-accent">Сохранить</button>
        </form>
      )}

      {tab === 'ratings' && (
        <form onSubmit={saveRating} className="panel panel-body space-y-4">
          <select className="input-field" value={ratingForm.game_id} onChange={(e) => setRatingForm({ ...ratingForm, game_id: Number(e.target.value) })}>
            {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input className="input-field" type="number" placeholder="Match Rating" value={ratingForm.elo} onChange={(e) => setRatingForm({ ...ratingForm, elo: Number(e.target.value) })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" type="number" placeholder="Победы" value={ratingForm.wins} onChange={(e) => setRatingForm({ ...ratingForm, wins: Number(e.target.value) })} />
            <input className="input-field" type="number" placeholder="Поражения" value={ratingForm.losses} onChange={(e) => setRatingForm({ ...ratingForm, losses: Number(e.target.value) })} />
          </div>
          <button type="submit" className="btn-accent">Сохранить рейтинг</button>
        </form>
      )}

      {tab === 'matches' && (
        <form onSubmit={addMatch} className="panel panel-body space-y-4">
          <select className="input-field" value={matchForm.game_id} onChange={(e) => setMatchForm({ ...matchForm, game_id: Number(e.target.value) })}>
            {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input className="input-field" placeholder="Карта" value={matchForm.map_name} onChange={(e) => setMatchForm({ ...matchForm, map_name: e.target.value })} />
          <p className="text-sm text-nx-muted">K / D / A</p>
          <div className="grid grid-cols-3 gap-3">
            <input className="input-field" type="number" value={matchForm.kills} onChange={(e) => setMatchForm({ ...matchForm, kills: Number(e.target.value) })} />
            <input className="input-field" type="number" value={matchForm.deaths} onChange={(e) => setMatchForm({ ...matchForm, deaths: Number(e.target.value) })} />
            <input className="input-field" type="number" value={matchForm.assists} onChange={(e) => setMatchForm({ ...matchForm, assists: Number(e.target.value) })} />
          </div>
          <input className="input-field" type="number" placeholder="Изменение MR" value={matchForm.elo_delta} onChange={(e) => setMatchForm({ ...matchForm, elo_delta: Number(e.target.value) })} />
          <input className="input-field" placeholder="Ник соперника" value={matchForm.opponent_nickname} onChange={(e) => setMatchForm({ ...matchForm, opponent_nickname: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={matchForm.won} onChange={(e) => setMatchForm({ ...matchForm, won: e.target.checked })} />
            Победа
          </label>
          <button type="submit" className="btn-accent">Добавить матч</button>
        </form>
      )}

      {tab === 'dna' && (
        <form onSubmit={saveDna} className="panel panel-body space-y-6">
          {DNA_KEYS.map((k) => (
            <label key={k} className="block">
              <span className="text-sm">{dnaAxes[k]}: {dnaForm[k]}</span>
              <input type="range" min={0} max={100} value={dnaForm[k]} onChange={(e) => setDnaForm({ ...dnaForm, [k]: Number(e.target.value) })} className="mt-1 w-full accent-nx-accent" />
            </label>
          ))}
          <PulseDNA data={{ ...portfolio.pulse_dna, axes: dnaForm }} />
          <button type="submit" className="btn-accent">Сохранить DNA</button>
        </form>
      )}

      {tab === 'achievements' && (
        <div className="space-y-6">
          <form onSubmit={addAchievement} className="panel panel-body space-y-4">
            <input className="input-field" placeholder="Название достижения" value={achForm.title} onChange={(e) => setAchForm({ ...achForm, title: e.target.value })} required />
            <textarea className="input-field" placeholder="Описание" value={achForm.description} onChange={(e) => setAchForm({ ...achForm, description: e.target.value })} />
            <button type="submit" className="btn-accent">Добавить</button>
          </form>
          <ul className="space-y-3">
            {portfolio.achievements.map((a) => (
              <li key={a.id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{a.title}</p>
                  {a.description && <p className="text-sm text-nx-muted">{a.description}</p>}
                </div>
                <button type="button" className="text-sm text-nx-danger" onClick={async () => { await api.deleteAchievement(token, a.id); load(); }}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
