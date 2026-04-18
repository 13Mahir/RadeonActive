import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface DistrictData {
  district: string;
  flagged_count: number;
  avg_risk_score: number;
  max_risk_score: number;
  total_amount_at_risk: number;
}

const DISTRICT_PATHS: Record<string, { path: string; labelX: number; labelY: number; cx: number; cy: number }> = {
  Ahmedabad: {
    path: 'M 300 180 L 380 170 L 400 220 L 390 270 L 330 280 L 290 250 Z',
    labelX: 340, labelY: 225, cx: 345, cy: 228
  },
  Surat: {
    path: 'M 260 380 L 330 370 L 340 420 L 310 450 L 260 440 L 245 410 Z',
    labelX: 292, labelY: 410, cx: 292, cy: 412
  },
  Vadodara: {
    path: 'M 320 290 L 390 280 L 405 330 L 370 360 L 320 355 L 305 320 Z',
    labelX: 355, labelY: 320, cx: 355, cy: 322
  },
  Rajkot: {
    path: 'M 140 210 L 220 200 L 235 250 L 210 290 L 150 285 L 130 255 Z',
    labelX: 183, labelY: 248, cx: 183, cy: 248
  },
  Bhavnagar: {
    path: 'M 220 310 L 295 300 L 305 355 L 270 385 L 220 380 L 205 345 Z',
    labelX: 255, labelY: 345, cx: 255, cy: 345
  },
};

function getRiskColor(score: number, count: number): string {
  if (count === 0) return '#e2e8f0';
  if (score >= 85 || count >= 500) return '#dc2626';
  if (score >= 70 || count >= 200) return '#d97706';
  if (score >= 55 || count >= 100) return '#ca8a04';
  return '#3b82f6';
}

function getRiskLabel(score: number, count: number): string {
  if (count === 0) return 'No Data';
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High Risk';
  if (score >= 55) return 'Med Risk';
  return 'Low Risk';
}

export default function GujaratHeatmap() {
  const [heatmapData, setHeatmapData] = useState<DistrictData[]>([]);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  useEffect(() => {
    api.get('/analytics/district-heatmap').then((data: any) => {
      setHeatmapData(data.heatmap || []);
    }).catch(() => {});
  }, []);

  const getDistrictData = (name: string): DistrictData | null =>
    heatmapData.find(d => d.district === name) || null;

  const hoveredData = hoveredDistrict ? getDistrictData(hoveredDistrict) : null;

  return (
    <div className="flex-1 relative">
      <svg
        viewBox="0 0 550 550"
        className="w-full h-full max-h-[400px]"
        style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.08))' }}
      >
        {/* Gujarat outline */}
        <path
          d="M 80 150 L 120 100 L 200 80 L 320 90 L 440 120 L 480 200 L 460 300 L 420 400 L 360 470 L 280 500 L 200 490 L 140 460 L 100 400 L 70 320 L 60 230 Z"
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="2"
        />

        {/* District polygons */}
        {Object.entries(DISTRICT_PATHS).map(([name, geo]) => {
          const data = getDistrictData(name);
          const fillColor = data
            ? getRiskColor(Number(data.avg_risk_score), data.flagged_count)
            : '#e2e8f0';
          const isHovered = hoveredDistrict === name;

          return (
            <g
              key={name}
              onMouseEnter={() => setHoveredDistrict(name)}
              onMouseLeave={() => setHoveredDistrict(null)}
              style={{ cursor: 'pointer' }}
            >
              <path
                d={geo.path}
                fill={fillColor}
                fillOpacity={isHovered ? 0.95 : 0.75}
                stroke="white"
                strokeWidth={isHovered ? 3 : 2}
                style={{ transition: 'all 0.2s' }}
              />

              {data && data.flagged_count >= 200 && (
                <>
                  <circle cx={geo.cx} cy={geo.cy} r="10" fill={fillColor} opacity="0.3">
                    <animate attributeName="r" from="8" to="18" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={geo.cx} cy={geo.cy} r="6" fill={fillColor} />
                </>
              )}

              <text
                x={geo.labelX}
                y={geo.labelY - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="900"
                fill="white"
                style={{ fontFamily: 'system-ui', pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {name}
              </text>
              {data && (
                <text
                  x={geo.labelX}
                  y={geo.labelY + 8}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="white"
                  fillOpacity="0.85"
                  style={{ fontFamily: 'system-ui', pointerEvents: 'none' }}
                >
                  {data.flagged_count} flags
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredDistrict && hoveredData && (
        <div className="absolute top-4 right-4 bg-white rounded-2xl shadow-2xl p-5 ring-1 ring-black/5 min-w-48 pointer-events-none z-10">
          <p className="font-black text-on-surface text-sm uppercase tracking-wide mb-3">{hoveredDistrict}</p>
          <div className="space-y-2">
            {[
              { label: 'Flagged Cases', value: hoveredData.flagged_count.toLocaleString() },
              { label: 'Avg Risk Score', value: `${Number(hoveredData.avg_risk_score).toFixed(0)}/100` },
              { label: 'Max Risk Score', value: hoveredData.max_risk_score },
              { label: 'Amount at Risk', value: `₹${(hoveredData.total_amount_at_risk / 100000).toFixed(1)}L` },
              { label: 'Risk Level', value: getRiskLabel(Number(hoveredData.avg_risk_score), hoveredData.flagged_count) },
            ].map(row => (
              <div key={row.label} className="flex justify-between gap-4">
                <span className="text-[10px] font-black font-label uppercase tracking-widest text-on-surface-variant">{row.label}</span>
                <span className="text-[11px] font-black text-on-surface">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex justify-between items-center">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">Risk Density</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black font-label text-on-surface-variant">Low</span>
          <div className="w-48 h-2 rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-600 ring-1 ring-black/5" />
          <span className="text-[10px] font-black font-label text-on-surface-variant">Critical</span>
        </div>
      </div>
    </div>
  );
}
