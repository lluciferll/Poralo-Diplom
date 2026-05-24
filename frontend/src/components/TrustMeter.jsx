import { terms } from '../lib/copy';

export default function TrustMeter({ value, showLabel = true }) {
  const color = value >= 85 ? '#22c55e' : value >= 70 ? '#6366f1' : value >= 50 ? '#eab308' : '#ef4444';
  return (
    <section className="w-full">
      {showLabel && (
        <header className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-nx-dim">
          <span>{terms.trustIndex}</span>
          <span style={{ color }}>{value}</span>
        </header>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-nx-border">
        <span className="block h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </section>
  );
}
