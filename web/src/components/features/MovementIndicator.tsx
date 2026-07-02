import type { RecentMovement } from '../../utils';

export const MovementIndicator = ({
  movement,
  className = '',
}: {
  movement?: RecentMovement;
  className?: string;
}) => {
  if (!movement) return null;
  const { deltaPositions, points } = movement;
  if (deltaPositions === 0 && points === 0) return null;

  const up = deltaPositions > 0;
  const absDelta = Math.abs(deltaPositions);

  return (
    <span className={`flex items-center gap-0.5 tabular-nums shrink-0 ${className}`}>
      {deltaPositions !== 0 && (
        <span
          className={`text-xs font-bold leading-none ${up ? 'text-green-400' : 'text-red-400'}`}
          title={
            up
              ? `Subió ${absDelta} puesto${absDelta > 1 ? 's' : ''} en las últimas 24h`
              : `Bajó ${absDelta} puesto${absDelta > 1 ? 's' : ''} en las últimas 24h`
          }
        >
          {up ? '▲' : '▼'}
          {up
            ? <sup className="text-[8px] font-bold">{absDelta}</sup>
            : <sub className="text-[8px] font-bold">{absDelta}</sub>
          }
        </span>
      )}
      {points > 0 && (
        <span
          className="text-[11px] text-white/35 font-medium"
          title={`Sumó ${points} puntos en las últimas 24h`}
        >
          +{points}
        </span>
      )}
    </span>
  );
};
