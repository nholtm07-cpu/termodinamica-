import React, { useMemo, useState } from 'react';
import { Table } from 'lucide-react';
import { formatCL } from '../../core/thermo/units';

export interface ChartPoint {
  x: number;
  y: number;
  id?: string;
  label?: string;
  extra?: string;
}

export interface ChartSeries {
  id: string;
  name: string;
  points: ChartPoint[];
  color: string;
  dashed?: boolean;
  fillBelow?: boolean;
  showNodes?: boolean;
}

interface SciChartProps {
  title: string;
  subtitle?: string;
  xLabel: string;
  yLabel: string;
  series: ChartSeries[];
  domePolygon?: ChartPoint[]; // Campana real IAPWS-IF97
  verticalMarkerX?: { x: number; label: string; color?: string };
  yLogScale?: boolean;
  height?: number;
  xDecimals?: number;
  yDecimals?: number;
}

export const SciChart: React.FC<SciChartProps> = ({
  title,
  subtitle,
  xLabel,
  yLabel,
  series,
  domePolygon,
  verticalMarkerX,
  yLogScale = false,
  height = 280,
  xDecimals = 2,
  yDecimals = 1,
}) => {
  const [showTable, setShowTable] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{
    seriesName: string;
    pt: ChartPoint;
    svgX: number;
    svgY: number;
  } | null>(null);

  const width = 560;
  const pad = { top: 22, right: 24, bottom: 44, left: 64 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    const allPts: ChartPoint[] = [];
    for (const s of series) allPts.push(...s.points);
    if (domePolygon) allPts.push(...domePolygon);

    if (allPts.length === 0) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of allPts) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
      if (yLogScale && p.y <= 0) continue;
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      const yVal = yLogScale ? Math.log10(p.y) : p.y;
      minY = Math.min(minY, yVal);
      maxY = Math.max(maxY, yVal);
    }

    if (!Number.isFinite(minX)) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    const dx = Math.max(1e-6, maxX - minX);
    const dy = Math.max(1e-6, maxY - minY);
    return {
      xMin: minX - dx * 0.08,
      xMax: maxX + dx * 0.08,
      yMin: minY - dy * 0.1,
      yMax: maxY + dy * 0.1,
    };
  }, [series, domePolygon, yLogScale]);

  const toSvgX = (x: number) => pad.left + ((x - xMin) / Math.max(1e-9, xMax - xMin)) * plotW;
  const toSvgY = (y: number) => {
    const val = yLogScale ? Math.log10(Math.max(1e-6, y)) : y;
    return pad.top + plotH - ((val - yMin) / Math.max(1e-9, yMax - yMin)) * plotH;
  };

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => xMin + t * (xMax - xMin));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const raw = yMin + t * (yMax - yMin);
    return yLogScale ? Math.pow(10, raw) : raw;
  });

  const buildPath = (pts: ChartPoint[]) =>
    pts
      .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && (!yLogScale || p.y > 0))
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(p.x).toFixed(2)} ${toSvgY(p.y).toFixed(2)}`)
      .join(' ');

  const tableRows = useMemo(() => {
    const rows: Array<{ serie: string; label: string; x: number; y: number; extra?: string }> = [];
    for (const s of series) {
      if (!s.showNodes && s.points.length > 16) continue;
      for (const p of s.points) {
        rows.push({
          serie: s.name,
          label: p.label || p.id || '—',
          x: p.x,
          y: p.y,
          extra: p.extra,
        });
      }
    }
    return rows;
  }, [series]);

  return (
    <div className="rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-4 sm:p-5 flex flex-col gap-3 shadow-[0_10px_28px_-14px_rgba(2,6,16,0.75)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-display text-sm sm:text-base font-bold text-[#F1F5F9]">{title}</h4>
          {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          aria-pressed={showTable}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#1E314A] bg-[#14223B] text-[#CBD5E1] hover:text-[#F1F5F9] hover:border-[#38BDF8] transition-colors cursor-pointer whitespace-nowrap"
        >
          <Table className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          {showTable ? 'Ver gráfico' : 'Tabla equivalente'}
        </button>
      </div>

      {/* Leyenda de series */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#94A3B8]">
        {domePolygon && domePolygon.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#2DD4BF]/70 inline-block" aria-hidden="true" />
            Campana saturación IAPWS-IF97
          </span>
        )}
        {series.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 inline-block"
              style={{
                backgroundColor: s.color,
                borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
              }}
              aria-hidden="true"
            />
            {s.name}
          </span>
        ))}
      </div>

      {showTable ? (
        <div className="max-h-64 overflow-auto border border-[#1E314A] rounded-xl bg-[#070D18]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#14223B] text-[#94A3B8]">
              <tr>
                <th className="py-2 px-3 font-semibold">Serie / Estado</th>
                <th className="py-2 px-3 font-semibold">{xLabel}</th>
                <th className="py-2 px-3 font-semibold">{yLabel}</th>
                <th className="py-2 px-3 font-semibold">Detalle</th>
              </tr>
            </thead>
            <tbody className="font-mono-num text-[#F1F5F9]">
              {(tableRows.length > 0
                ? tableRows
                : series[0]?.points.slice(0, 20).map((p, i) => ({
                    serie: series[0].name,
                    label: p.label || `P${i + 1}`,
                    x: p.x,
                    y: p.y,
                    extra: p.extra,
                  })) ?? []
              ).map((r, idx) => (
                <tr key={idx} className="border-t border-[#1E314A]/60 hover:bg-[#0F1A2E]/60">
                  <td className="py-2 px-3 font-sans">{r.label}</td>
                  <td className="py-2 px-3">{formatCL(r.x, xDecimals)}</td>
                  <td className="py-2 px-3">{formatCL(r.y, yDecimals)}</td>
                  <td className="py-2 px-3 font-sans text-[#94A3B8]">{r.extra || r.serie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${title}: eje X ${xLabel}, eje Y ${yLabel}`}
            className="w-full h-auto bg-[#070D18] rounded-xl border border-[#1E314A]"
          >
            {/* Grilla horizontal y ticks Y */}
            {yTicks.map((yt, idx) => {
              const py = toSvgY(yt);
              return (
                <g key={`y-${idx}`}>
                  <line
                    x1={pad.left}
                    y1={py}
                    x2={width - pad.right}
                    y2={py}
                    stroke="#1E314A"
                    strokeOpacity="0.8"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={pad.left - 8}
                    y={py + 4}
                    textAnchor="end"
                    fill="#94A3B8"
                    fontSize="10"
                    className="font-mono-num"
                  >
                    {yLogScale && yt >= 1000 ? `${(yt / 1000).toFixed(1)}k` : formatCL(yt, yDecimals)}
                  </text>
                </g>
              );
            })}

            {/* Grilla vertical y ticks X */}
            {xTicks.map((xt, idx) => {
              const px = toSvgX(xt);
              return (
                <g key={`x-${idx}`}>
                  <line
                    x1={px}
                    y1={pad.top}
                    x2={px}
                    y2={pad.top + plotH}
                    stroke="#1E314A"
                    strokeOpacity="0.8"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={px}
                    y={pad.top + plotH + 16}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="10"
                    className="font-mono-num"
                  >
                    {formatCL(xt, xDecimals)}
                  </text>
                </g>
              );
            })}

            {/* Ejes principales */}
            <line
              x1={pad.left}
              y1={pad.top}
              x2={pad.left}
              y2={pad.top + plotH}
              stroke="#475569"
              strokeWidth="1.25"
            />
            <line
              x1={pad.left}
              y1={pad.top + plotH}
              x2={width - pad.right}
              y2={pad.top + plotH}
              stroke="#475569"
              strokeWidth="1.25"
            />

            {/* Etiquetas de ejes con unidades */}
            <text
              x={pad.left + plotW / 2}
              y={height - 6}
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
              fontWeight="600"
            >
              {xLabel}
            </text>
            <text
              x={16}
              y={pad.top + plotH / 2}
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
              fontWeight="600"
              transform={`rotate(-90 16 ${pad.top + plotH / 2})`}
            >
              {yLabel}
            </text>

            {/* Campana de saturación IF97 real */}
            {domePolygon && domePolygon.length > 2 && (
              <path
                d={`${buildPath(domePolygon)} Z`}
                fill="#2DD4BF"
                fillOpacity="0.07"
                stroke="#2DD4BF"
                strokeOpacity="0.7"
                strokeWidth="1.6"
              />
            )}

            {/* Marcador vertical */}
            {verticalMarkerX && (
              <g>
                <line
                  x1={toSvgX(verticalMarkerX.x)}
                  y1={pad.top}
                  x2={toSvgX(verticalMarkerX.x)}
                  y2={pad.top + plotH}
                  stroke={verticalMarkerX.color ?? '#F59E0B'}
                  strokeDasharray="4 3"
                  strokeWidth="1.6"
                />
                <text
                  x={Math.min(width - pad.right - 4, toSvgX(verticalMarkerX.x) + 5)}
                  y={pad.top + 14}
                  fill={verticalMarkerX.color ?? '#F59E0B'}
                  fontSize="10"
                  fontWeight="600"
                >
                  {verticalMarkerX.label}
                </text>
              </g>
            )}

            {/* Curvas */}
            {series.map((s) => {
              const pathD = buildPath(s.points);
              return (
                <g key={s.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.dashed ? 1.8 : 2.4}
                    strokeDasharray={s.dashed ? '5 4' : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {(s.showNodes ?? true) &&
                    s.points.map((pt, pIdx) => {
                      if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return null;
                      if (yLogScale && pt.y <= 0) return null;
                      const cx = toSvgX(pt.x);
                      const cy = toSvgY(pt.y);
                      return (
                        <g key={`${s.id}-pt-${pIdx}`}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={pt.id ? 4.5 : 3}
                            fill={s.color}
                            stroke="#070D18"
                            strokeWidth="1.5"
                            tabIndex={0}
                            aria-label={`${s.name} ${pt.label ?? pt.id ?? ''}: x=${formatCL(pt.x, xDecimals)}, y=${formatCL(pt.y, yDecimals)}`}
                            className="cursor-pointer focus:outline-none"
                            onMouseEnter={() =>
                              setHoveredNode({ seriesName: s.name, pt, svgX: cx, svgY: cy })
                            }
                            onFocus={() =>
                              setHoveredNode({ seriesName: s.name, pt, svgX: cx, svgY: cy })
                            }
                            onMouseLeave={() => setHoveredNode(null)}
                            onBlur={() => setHoveredNode(null)}
                          />
                          {pt.id && (
                            <text
                              x={cx + 7}
                              y={cy - 6}
                              fill="#F1F5F9"
                              fontSize="10"
                              fontWeight="600"
                              className="font-mono-num pointer-events-none"
                            >
                              {pt.id}
                            </text>
                          )}
                        </g>
                      );
                    })}
                </g>
              );
            })}
          </svg>

          {/* Tooltip accesible flotante */}
          {hoveredNode && (
            <div
              role="status"
              className="mt-2 px-3.5 py-2 rounded-lg bg-[#14223B] border border-[#38BDF8]/50 text-xs text-[#F1F5F9] flex flex-wrap items-center justify-between gap-2"
            >
              <span className="font-medium">
                {hoveredNode.pt.label || hoveredNode.pt.id || hoveredNode.seriesName}
              </span>
              <span className="font-mono-num text-[#2DD4BF]">
                ({formatCL(hoveredNode.pt.x, xDecimals)}, {formatCL(hoveredNode.pt.y, yDecimals)})
                {hoveredNode.pt.extra ? ` · ${hoveredNode.pt.extra}` : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SankeyProps {
  title: string;
  qInLabel: string;
  qInVal: number;
  wNetLabel: string;
  wNetVal: number;
  qOutLabel: string;
  qOutVal: number;
  qUsefulLabel?: string;
  qUsefulVal?: number;
  unit: string;
}

export const SankeyEnergyDiagram: React.FC<SankeyProps> = ({
  title,
  qInLabel,
  qInVal,
  wNetLabel,
  wNetVal,
  qOutLabel,
  qOutVal,
  qUsefulLabel,
  qUsefulVal = 0,
  unit,
}) => {
  const total = Math.max(1e-6, qInVal);
  const wPct = Math.max(0, Math.min(100, (wNetVal / total) * 100));
  const uPct = Math.max(0, Math.min(100, (qUsefulVal / total) * 100));
  const outPct = Math.max(0, 100 - wPct - uPct);

  return (
    <div className="rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-4 sm:p-5 space-y-3 shadow-[0_10px_28px_-14px_rgba(2,6,16,0.75)]">
      <h4 className="font-display text-sm sm:text-base font-bold text-[#F1F5F9]">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center text-xs">
        <div className="rounded-xl bg-[#070D18] border border-[#F59E0B]/40 p-3.5">
          <div className="text-[#94A3B8]">{qInLabel}</div>
          <div className="font-mono-num text-base font-bold text-[#F59E0B] mt-1">
            {formatCL(qInVal, 1)} <span className="text-xs font-normal">{unit}</span>
          </div>
          <div className="text-[#94A3B8] mt-0.5">100,0 % entrada térmica</div>
        </div>

        <div className="sm:col-span-3 space-y-2.5">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[#F1F5F9] font-medium">{wNetLabel}</span>
              <span className="font-mono-num text-[#2DD4BF] font-semibold">
                {formatCL(wNetVal, 1)} {unit} ({formatCL(wPct, 1)} %)
              </span>
            </div>
            <div className="h-3 rounded-full bg-[#070D18] overflow-hidden border border-[#1E314A]">
              <div className="h-full bg-gradient-to-r from-[#2DD4BF] to-[#38BDF8]" style={{ width: `${wPct}%` }} />
            </div>
          </div>

          {qUsefulLabel && qUsefulVal > 0 && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#F1F5F9] font-medium">{qUsefulLabel}</span>
                <span className="font-mono-num text-[#38BDF8] font-semibold">
                  {formatCL(qUsefulVal, 1)} {unit} ({formatCL(uPct, 1)} %)
                </span>
              </div>
              <div className="h-3 rounded-full bg-[#070D18] overflow-hidden border border-[#1E314A]">
                <div className="h-full bg-[#38BDF8]" style={{ width: `${uPct}%` }} />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[#94A3B8]">{qOutLabel}</span>
              <span className="font-mono-num text-[#CBD5E1]">
                {formatCL(qOutVal, 1)} {unit} ({formatCL(outPct, 1)} %)
              </span>
            </div>
            <div className="h-3 rounded-full bg-[#070D18] overflow-hidden border border-[#1E314A]">
              <div className="h-full bg-[#F59E0B]/70" style={{ width: `${outPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
