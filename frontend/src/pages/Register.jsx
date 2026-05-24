import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roles } from '../lib/copy';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', nickname: '', country: 'RU', primary_role: 'Flex' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/profile/edit');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-wrap flex min-h-[70dvh] max-w-md flex-col justify-center py-8">
      <p className="label-caps">Регистрация</p>
      <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Создать профиль</h1>
      <form onSubmit={submit} className="panel panel-body mt-6 space-y-4 sm:mt-8">
        {error && <p className="alert-error">{error}</p>}
        <input className="input-field" placeholder="Nickname" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} required />
        <input className="input-field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input-field" type="password" placeholder="Пароль (мин. 6 символов)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <select className="input-field" value={form.primary_role} onChange={(e) => setForm({ ...form, primary_role: e.target.value })}>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input className="input-field" placeholder="Страна (RU, KZ…)" maxLength={4} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <button type="submit" className="btn-accent w-full" disabled={loading}>
          {loading ? 'Создание…' : 'Создать профиль'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-nx-muted">
        Уже есть аккаунт? <Link to="/login" className="text-nx-accentHi hover:underline">Вход</Link>
      </p>
    </section>
  );
}
