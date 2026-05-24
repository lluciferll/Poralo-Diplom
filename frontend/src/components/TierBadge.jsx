export default function TierBadge({ tierCode, tierLabel, tierColor, elo, progress, compact }) {
  return (
    <div className={compact ? 'flex items-center gap-2' : 'space-y-2'}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-md font-mono text-[10px] font-bold tracking-wider"
          style={{ backgroundColor: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}55` }}
        >
          {tierCode}
        </div>
        <div>
          <div className="font-display text-lg font-semibold leading-none">{tierLabel}</div>
          {elo != null && <div className="mt-0.5 font-mono text-xs text-nx-muted">{elo} MR</div>}
        </div>
      </div>
      {progress != null && !compact && (
        <div className="h-1 overflow-hidden rounded-full bg-nx-border">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: tierColor }} />
        </div>
      )}
    </div>
  );
}
