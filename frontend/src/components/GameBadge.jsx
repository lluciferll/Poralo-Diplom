export default function GameBadge({ game, size = 'md' }) {
  if (!game) return null;
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-12 w-12 text-sm' };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg font-mono font-bold ${sizes[size]}`}
      style={{ backgroundColor: `${game.accent_color}22`, color: game.accent_color, border: `1px solid ${game.accent_color}44` }}
      title={game.name}
    >
      {game.code}
    </div>
  );
}
