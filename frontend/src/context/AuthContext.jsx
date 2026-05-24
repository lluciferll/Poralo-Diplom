import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('arena_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('arena_token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const { access_token } = await api.login(email, password);
    localStorage.setItem('arena_token', access_token);
    setToken(access_token);
    const u = await api.me(access_token);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const { access_token } = await api.register(data);
    localStorage.setItem('arena_token', access_token);
    setToken(access_token);
    const u = await api.me(access_token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('arena_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
