import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('pro@arena.dev');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-wrap flex min-h-[70dvh] max-w-md flex-col justify-center py-8">
      <p className="label-caps">Access</p>
      <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Вход в систему</h1>
      <p className="mt-2 text-sm text-nx-muted">Demo: pro@arena.dev / demo123</p>
      <form onSubmit={submit} className="panel panel-body mt-6 space-y-4 sm:mt-8">
        {error && <p className="alert-error">{error}</p>}
        <label className="block">
          <span className="label-caps">Email</span>
          <input className="input-field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="block">
          <span className="label-caps">Password</span>
          <input className="input-field mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <button type="submit" className="btn-accent w-full" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-nx-muted">
        Нет аккаунта? <Link to="/register" className="text-nx-accentHi hover:underline">Регистрация</Link>
      </p>
    </section>
  );
}
