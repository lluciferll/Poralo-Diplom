import { Link, NavLink, Outlet } from 'react-router-dom';
import { Hexagon, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TrustMeter from './TrustMeter';
import { useBodyScrollLock } from '../hooks/useMobile';

const nav = [
  { to: '/profile/edit', label: 'Профиль' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/scout', label: 'Scout' },
  { to: '/teams', label: 'Teams' },
  { to: '/tournaments', label: 'Турниры' },
  { to: '/matches', label: 'Match History' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  useBodyScrollLock(open);

  const close = () => setOpen(false);

  return (
    <section className="relative flex min-h-[100dvh] flex-col">
      <span className="pointer-events-none fixed inset-0 bg-mesh" aria-hidden />
      <span className="pointer-events-none fixed inset-0 bg-scanline opacity-20" aria-hidden />

      <header className="sticky top-0 z-50 border-b border-nx-border/80 bg-nx-bg/95 backdrop-blur-xl safe-bottom">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3 lg:px-6">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:flex-none" onClick={close}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nx-accent/40 bg-nx-accent/10">
              <Hexagon className="h-5 w-5 text-nx-accent" strokeWidth={2} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-base font-bold tracking-tight sm:text-lg">ArenaPulse</span>
              <span className="hidden text-[11px] text-nx-dim sm:block">player portfolio</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-nx-elevated text-nx-accentHi' : 'text-nx-muted hover:text-nx-text'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <span className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-3 rounded-xl border border-nx-border bg-nx-surface px-3 py-2 transition hover:border-nx-borderHi">
                  <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-nx-border" />
                  <span className="hidden min-w-[88px] lg:block">
                    <span className="block truncate text-sm font-semibold">{user.nickname}</span>
                    <TrustMeter value={user.trust_index ?? 72} showLabel={false} />
                  </span>
                </Link>
                <button type="button" onClick={logout} className="btn-outline px-3 py-2" aria-label="Выход">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline text-sm">Вход</Link>
                <Link to="/register" className="btn-accent text-sm">Регистрация</Link>
              </>
            )}
          </span>

          {user && (
            <Link to="/dashboard" className="btn-outline p-2 md:hidden" aria-label="Кабинет" onClick={close}>
              <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-md object-cover" />
            </Link>
          )}

          <button
            type="button"
            className="btn-outline shrink-0 p-2.5 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <>
            <button type="button" className="mobile-drawer-backdrop" aria-label="Закрыть меню" onClick={close} />
            <nav className="mobile-drawer px-3 pt-2 sm:px-4" aria-label="Мобильная навигация">
              <ul className="space-y-1">
                {nav.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={close}
                      className={({ isActive }) =>
                        `flex min-h-[48px] items-center rounded-xl px-4 text-sm font-medium transition ${
                          isActive ? 'bg-nx-accent/15 text-nx-accentHi' : 'text-nx-text hover:bg-nx-elevated'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <footer className="mt-4 border-t border-nx-border pt-4">
                {user ? (
                  <span className="flex flex-col gap-2 sm:flex-row">
                    <Link to="/dashboard" className="btn-outline w-full text-center text-sm" onClick={close}>Личный кабинет</Link>
                    <button type="button" className="btn-outline w-full text-sm" onClick={() => { logout(); close(); }}>Выход</button>
                  </span>
                ) : (
                  <span className="flex flex-col gap-2 sm:flex-row">
                    <Link to="/login" className="btn-outline w-full text-center text-sm" onClick={close}>Вход</Link>
                    <Link to="/register" className="btn-accent w-full text-center text-sm" onClick={close}>Регистрация</Link>
                  </span>
                )}
              </footer>
            </nav>
          </>
        )}
      </header>

      <main className="relative flex-1 pb-[env(safe-area-inset-bottom)]">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-nx-border py-6 sm:py-8">
        <p className="mx-auto max-w-7xl px-3 text-center text-[11px] leading-relaxed text-nx-dim sm:px-4 sm:text-left sm:text-xs lg:px-6">
          ArenaPulse — портфолио киберспортсмена · stats by player
        </p>
      </footer>
    </section>
  );
}
