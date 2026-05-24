import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Shield, UserCircle, Trophy } from 'lucide-react';

export default function Home() {
  return (
    <article>
      <section className="border-b border-nx-border">
        <header className="page-wrap-wide py-12 sm:py-16 md:py-24">
          <p className="text-xs uppercase tracking-widest text-nx-accent">ArenaPulse · player portfolio</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">
            Портфолио киберспортсмена — вы сами ведёте карьеру
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-nx-muted sm:mt-6 sm:text-lg">
            Без интеграции с CS2, Dota и другими клиентами. Игрок заполняет профиль, Match Rating, Match History,
            Achievements и Pulse DNA — и получает публичную страницу для команд, турниров и Scout.
          </p>
          <nav className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link to="/register" className="btn-accent w-full px-6 py-3 sm:w-auto sm:px-8">
              Создать профиль
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/leaderboard" className="btn-outline w-full px-6 py-3 sm:w-auto sm:px-8">Leaderboard</Link>
          </nav>
        </header>
      </section>

      <section className="page-wrap-wide py-10 sm:py-16">
        <h2 className="font-display text-xl font-bold sm:text-2xl">Что входит в портфолио</h2>
        <ul className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: UserCircle, title: 'Профиль', desc: 'Bio, role, LFT, ссылки Steam / FACEIT' },
            { icon: BarChart3, title: 'Stats', desc: 'Match Rating, W/L, Match History' },
            { icon: Shield, title: 'Trust Index', desc: 'Растёт от заполненности профиля' },
            { icon: Trophy, title: 'Achievements', desc: 'Турниры, топы, MVP — добавляет игрок' },
          ].map(({ icon: Icon, title, desc }) => (
            <li key={title} className="panel p-4 sm:p-5">
              <Icon className="h-7 w-7 text-nx-accent sm:h-8 sm:w-8" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-nx-muted">{desc}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-nx-border bg-nx-surface/40 px-3 py-12 text-center sm:py-16">
        <p className="mx-auto max-w-md text-sm text-nx-muted sm:text-base">Заполните раздел «Профиль» — это основной сценарий платформы.</p>
        <Link to="/profile/edit" className="btn-accent mt-5 inline-flex w-full max-w-xs sm:mt-6 sm:w-auto">Перейти к редактированию</Link>
      </section>
    </article>
  );
}
