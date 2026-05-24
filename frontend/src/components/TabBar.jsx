export default function TabBar({ tabs, active, onChange }) {
  return (
    <nav className="tab-scroll -mx-1 mb-6" aria-label="Вкладки">
      <ul className="flex w-max min-w-full gap-2 px-1 pb-1">
        {tabs.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onChange(t.id)}
              className={`whitespace-nowrap ${active === t.id ? 'tab-btn-active' : 'tab-btn-idle'}`}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
