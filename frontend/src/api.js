const API = import.meta.env.VITE_API_URL || '';

function headers(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.detail;
    const msg = Array.isArray(detail) ? detail[0]?.msg : detail;
    throw new Error(msg || 'Ошибка запроса');
  }
  return data;
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
  login: async (email, password) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Ошибка входа');
    return data;
  },
  me: (token) => request('/api/auth/me', { headers: headers(token) }),
  games: () => request('/api/games'),
  dashboard: (token) => request('/api/dashboard', { headers: headers(token) }),
  portfolio: (token) => request('/api/my/portfolio', { headers: headers(token) }),
  updateProfile: (token, body) => request('/api/my/profile', { method: 'PATCH', headers: headers(token), body: JSON.stringify(body) }),
  updateLinks: (token, body) => request('/api/my/links', { method: 'PATCH', headers: headers(token), body: JSON.stringify(body) }),
  saveRating: (token, body) => request('/api/my/ratings', { method: 'PUT', headers: headers(token), body: JSON.stringify(body) }),
  savePulseDna: (token, body) => request('/api/my/pulse-dna', { method: 'PUT', headers: headers(token), body: JSON.stringify(body) }),
  addMatch: (token, body) => request('/api/my/matches', { method: 'POST', headers: headers(token), body: JSON.stringify(body) }),
  addAchievement: (token, body) => request('/api/my/achievements', { method: 'POST', headers: headers(token), body: JSON.stringify(body) }),
  deleteAchievement: (token, id) => request(`/api/my/achievements/${id}`, { method: 'DELETE', headers: headers(token) }),
  leaderboard: (gameId) => request(`/api/leaderboard/${gameId}`),
  scout: (gameId) => request(`/api/scout${gameId ? `?game_id=${gameId}` : ''}`),
  profile: (nickname) => request(`/api/players/${nickname}`),
  matches: (gameId) => request(`/api/matches${gameId ? `?game_id=${gameId}` : ''}`),
  tournaments: () => request('/api/tournaments'),
  registerTournament: (token, id) => request(`/api/tournaments/${id}/register`, { method: 'POST', headers: headers(token) }),
  teams: (gameId) => request(`/api/teams${gameId ? `?game_id=${gameId}` : ''}`),
  createTeam: (token, body) => request('/api/teams', { method: 'POST', headers: headers(token), body: JSON.stringify(body) }),
  hubs: () => request('/api/hubs'),
  joinHub: (token, id) => request(`/api/hubs/${id}/join`, { method: 'POST', headers: headers(token) }),
  ladders: () => request('/api/ladders'),
  missions: (token) => request('/api/missions', { headers: headers(token) }),
};
