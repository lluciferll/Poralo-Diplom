export default function ProfileProgress({ percent, hint }) {
  return (
    <section className="panel p-4 sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          <p className="label-caps">Заполненность профиля</p>
          <p className="mt-1 font-display text-2xl font-bold sm:text-3xl">{percent}%</p>
        </span>
        {hint && <p className="text-xs leading-relaxed text-nx-muted sm:max-w-sm sm:text-right">{hint}</p>}
      </header>
      <p className="mt-4 h-2 overflow-hidden rounded-full bg-nx-border" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <span
          className="block h-full rounded-full bg-gradient-to-r from-nx-accent to-nx-violet transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </p>
    </section>
  );
}
