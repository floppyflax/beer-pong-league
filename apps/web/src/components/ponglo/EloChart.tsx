/**
 * EloChart — Everything ELO DS (§5.1)
 *
 * Full ELO evolution chart with grid + area fill. SVG custom — no recharts.
 * Default: 330×80px. Used in Profile ELO evolution section.
 *
 * Visual spec: dashed grid lime alpha 0.12, polygon area lime alpha 0.15,
 * final point + glow halo, no axes labels (clean visual).
 */

export interface EloChartPoint {
  date: string;
  elo: number;
}

export interface EloChartProps {
  /** Data points — sorted chronologically */
  points: EloChartPoint[];
  width?: number;
  height?: number;
  /** Highlight the most recent point with a halo */
  highlightCurrent?: boolean;
  className?: string;
}

const LIME = '#B7FF3B'; // lime token

function buildPaths(
  points: EloChartPoint[],
  w: number,
  h: number,
): { line: string; area: string; lastX: number; lastY: number } {
  const pad = { x: 8, y: 8 };
  const elos = points.map((p) => p.elo);
  const min = Math.min(...elos);
  const max = Math.max(...elos);
  const range = max - min || 1;

  const xs = (i: number) =>
    pad.x + (i / (points.length - 1)) * (w - pad.x * 2);
  const ys = (v: number) =>
    pad.y + (1 - (v - min) / range) * (h - pad.y * 2);

  const segments = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(p.elo).toFixed(1)}`).join(' ');
  const lastX = xs(points.length - 1);
  const lastY = ys(points[points.length - 1].elo);
  const firstX = xs(0).toFixed(1);
  const bottomY = (h - pad.y).toFixed(1);

  return {
    line: segments,
    area: `${segments} L${lastX.toFixed(1)},${bottomY} L${firstX},${bottomY} Z`,
    lastX,
    lastY,
  };
}

function GridLines({ w, h }: { w: number; h: number }) {
  const rows = 3;
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => {
        const y = 8 + (i / (rows - 1)) * (h - 16);
        return (
          <line
            key={i}
            x1={8}
            y1={y.toFixed(1)}
            x2={w - 8}
            y2={y.toFixed(1)}
            stroke={LIME}
            strokeOpacity={0.12}
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        );
      })}
    </>
  );
}

export function EloChart({
  points,
  width = 330,
  height = 80,
  highlightCurrent = true,
  className,
}: EloChartProps) {
  if (points.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-cool-gray ${className}`}
        data-testid="elo-chart-empty"
        style={{ width, height }}
      >
        Pas assez de données
      </div>
    );
  }

  const { line, area, lastX, lastY } = buildPaths(points, width, height);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      data-testid="elo-chart"
      aria-hidden="true"
    >
      <GridLines w={width} h={height} />

      {/* Area fill */}
      <path d={area} fill={LIME} fillOpacity={0.15} />

      {/* Line */}
      <path
        d={line}
        stroke={LIME}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Final point halo */}
      {highlightCurrent && (
        <>
          <circle cx={lastX} cy={lastY} r={6} fill={LIME} fillOpacity={0.2} />
          <circle cx={lastX} cy={lastY} r={3} fill={LIME} />
        </>
      )}
    </svg>
  );
}
