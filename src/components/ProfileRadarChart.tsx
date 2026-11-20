import type { ProfileAnswers } from '../types';
import { getDimensionScores } from '../utils/pausaLogic';

interface ProfileRadarChartProps {
  answers: ProfileAnswers;
}

export function ProfileRadarChart({ answers }: ProfileRadarChartProps) {
  const dimensions = getDimensionScores(answers);

  // Build 6-axis radar geometry (SVG viewBox 0 0 340 240 for generous label clearance)
  const cx = 170;
  const cy = 120;
  const maxRadius = 72;
  const levels = [1, 2, 3, 4, 5];

  const getPoint = (index: number, value: number, radiusScale = 1) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
    const r = (value / 5) * maxRadius * radiusScale;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const dataPolygonPoints = dimensions
    .map((dim, idx) => {
      const pt = getPoint(idx, dim.score);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      {/* Subtle 6-axis SVG Radar */}
      <div className="md:col-span-5 flex justify-center">
        <svg
          viewBox="0 0 340 240"
          className="w-full max-w-[310px] h-auto overflow-visible"
          role="img"
          aria-label="Gráfico radar das seis dimensões do seu perfil digital"
        >
          {/* Concentric rings */}
          {levels.map((level) => {
            const ringPoints = dimensions
              .map((_, idx) => {
                const pt = getPoint(idx, level);
                return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
              })
              .join(' ');
            return (
              <polygon
                key={level}
                points={ringPoints}
                fill="none"
                stroke="#E5E2DC"
                strokeWidth={level === 5 ? 1.2 : 0.9}
              />
            );
          })}

          {/* Axis spokes */}
          {dimensions.map((dim, idx) => {
            const end = getPoint(idx, 5);
            return (
              <line
                key={dim.key}
                x1={cx}
                y1={cy}
                x2={end.x}
                y2={end.y}
                stroke="#E5E2DC"
                strokeWidth={0.9}
              />
            );
          })}

          {/* Data polygon */}
          <polygon
            points={dataPolygonPoints}
            fill="#6A8D73"
            fillOpacity={0.22}
            stroke="#6A8D73"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Data vertices */}
          {dimensions.map((dim, idx) => {
            const pt = getPoint(idx, dim.score);
            return (
              <circle
                key={dim.key}
                cx={pt.x}
                cy={pt.y}
                r={3.5}
                fill="#6A8D73"
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Axis labels */}
          {dimensions.map((dim, idx) => {
            const labelPt = getPoint(idx, 5, 1.26);
            const textAnchor =
              Math.abs(labelPt.x - cx) < 10
                ? 'middle'
                : labelPt.x > cx
                  ? 'start'
                  : 'end';
            return (
              <text
                key={dim.key}
                x={labelPt.x}
                y={labelPt.y + 3}
                textAnchor={textAnchor}
                className="fill-[#6B6F6C] text-[11px] font-medium"
              >
                {dim.shortLabel}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Horizontal Dimension Bars */}
      <div className="md:col-span-7 space-y-3.5">
        {dimensions.map((dim) => (
          <div key={dim.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-[#2B2D2B]">{dim.label}</span>
              <span className="text-xs text-[#6B6F6C] tabular-nums shrink-0">
                {dim.score} / 5
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#F0EDE6] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6A8D73] transition-all duration-300"
                style={{ width: `${dim.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
