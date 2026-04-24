/**
 * Sparkline — Everything ELO DS (§5.1)
 *
 * Mini inline ELO trend chart. SVG custom — no external deps.
 * Default: 44×18px. Used in LeaderRow, Home hero, Profile compact.
 */

export interface SparklineProps {
  /** Array of numeric values to plot */
  points: number[];
  width?: number;
  height?: number;
  /** Tailwind-compatible hex color for the line (default: lime) */
  color?: string;
  /** Fill the area under the line */
  fill?: boolean;
  className?: string;
}

function normalize(points: number[], w: number, h: number): string {
  if (points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 2;
  const xs = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const ys = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);
  return points.map((v, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
}

export function Sparkline({
  points,
  width = 44,
  height = 18,
  color = '#B7FF3B', // lime token
  fill = false,
  className,
}: SparklineProps) {
  if (points.length < 2) return null;

  const linePath = normalize(points, width, height);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 2;
  const xs = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2);
  const ys = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2);
  const firstX = xs(0).toFixed(1);
  const lastX = xs(points.length - 1).toFixed(1);
  const fillPath = `${linePath} L${lastX},${height - pad} L${firstX},${height - pad} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      data-testid="sparkline"
      aria-hidden="true"
    >
      {fill && (
        <path
          d={fillPath}
          fill={color}
          fillOpacity={0.15}
        />
      )}
      <path
        d={linePath}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Final point */}
      <circle
        cx={xs(points.length - 1)}
        cy={ys(points[points.length - 1])}
        r={2}
        fill={color}
      />
    </svg>
  );
}
