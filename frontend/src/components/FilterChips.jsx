export default function FilterChips({ children, className = '' }) {
  return (
    <nav className={`filter-scroll mb-6 sm:mb-8 ${className}`} aria-label="Фильтр">
      <ul className="flex w-max min-w-full gap-2 pb-1">{children}</ul>
    </nav>
  );
}

export function FilterChip({ active, onClick, children }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
          active
            ? 'bg-nx-elevated ring-1 ring-nx-accent/40 text-nx-text'
            : 'border border-nx-border text-nx-muted hover:border-nx-borderHi hover:text-nx-text'
        }`}
      >
        {children}
      </button>
    </li>
  );
}
