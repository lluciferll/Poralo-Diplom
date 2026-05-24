import { dnaAxes, terms } from '../lib/copy';
import { useBreakpoint } from '../hooks/useMobile';

const AXES = Object.keys(dnaAxes);

export default function PulseDNA({ data, size }) {
  const mobile = useBreakpoint(640);
  const chartSize = size ?? (mobile ? 180 : 220);

  if (!data) return null;
  const values = AXES.map((k) => data.axes[k] ?? 50);
  const cx = chartSize / 2;
  const cy = chartSize / 2;
  const maxR = chartSize * 0.36;
  const labelOffset = mobile ? 18 : 22;

  const point = (i, v) => {
    const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
    const r = (v / 100) * maxR;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((v, i) => point(i, v));
  const path = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';

  return (
    <section className="flex flex-col items-center gap-4 sm:gap-6 lg:flex-row lg:items-start lg:gap-8">
      <svg
        width={chartSize}
        height={chartSize}
        viewBox={`0 0 ${chartSize} ${chartSize}`}
        className="mx-auto w-full max-w-[200px] shrink-0 sm:max-w-[220px]"
        role="img"
        aria-label={terms.pulseDna}
      >
        {gridLevels.map((lvl) => (
          <polygon
            key={lvl}
            fill="none"
            stroke="#232a3d"
            strokeWidth="1"
            points={AXES.map((_, i) => {
              const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
              const r = maxR * lvl;
              return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
            }).join(' ')}
          />
        ))}
        {AXES.map((_, i) => {
          const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(angle) * maxR}
              y2={cy + Math.sin(angle) * maxR}
              stroke="#232a3d"
              strokeWidth="1"
            />
          );
        })}
        <path d={path} fill="rgba(99,102,241,0.25)" stroke="#6366f1" strokeWidth="2" />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#818cf8" />
        ))}
        {AXES.map((key, i) => {
          const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
          const lx = cx + Math.cos(angle) * (maxR + labelOffset);
          const ly = cy + Math.sin(angle) * (maxR + labelOffset);
          return (
            <text key={key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#8b93a7" fontSize={mobile ? 9 : 10} fontFamily="JetBrains Mono">
              {dnaAxes[key]}
            </text>
          );
        })}
      </svg>
      <article className="w-full max-w-none text-center lg:max-w-xs lg:text-left">
        <p className="label-caps">{terms.pulseDna}</p>
        <h3 className="mt-1 break-words font-display text-xl font-semibold text-nx-accentHi sm:text-2xl">{data.archetype}</h3>
        <p className="mt-2 text-sm leading-relaxed text-nx-muted">{data.summary}</p>
        <p className="mt-3 font-mono text-xs text-nx-dim">
          {data.is_manual ? 'Ручная настройка' : `На основе ${data.matches_analyzed} матчей`}
        </p>
      </article>
    </section>
  );
}
