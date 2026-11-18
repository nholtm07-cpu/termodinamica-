import React from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import type { HeatEvaluation } from '../domain/models';
import { formatHT } from '../domain/units';

interface TechnicalDiagramProps {
  evaluation: HeatEvaluation;
  playbackTimeSec?: number;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onResetPlayback?: () => void;
  onScrubTime?: (t: number) => void;
}

/** Mapeo determinista de temperatura a escala térmica azul -> ámbar -> rojo (siempre acompañado de cifra + unidad). */
function tempToColor(tempC: number, minC: number, maxC: number): string {
  const span = Math.max(1e-6, maxC - minC);
  const t = Math.max(0, Math.min(1, (tempC - minC) / span));
  if (t < 0.5) {
    const k = t * 2;
    const r = Math.round(56 + (245 - 56) * k);
    const g = Math.round(189 + (158 - 189) * k);
    const b = Math.round(248 + (11 - 248) * k);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const k = (t - 0.5) * 2;
  const r = Math.round(245 + (248 - 245) * k);
  const g = Math.round(158 + (113 - 158) * k);
  const b = Math.round(11 + (113 - 11) * k);
  return `rgb(${r}, ${g}, ${b})`;
}

export const TechnicalDiagram: React.FC<TechnicalDiagramProps> = ({
  evaluation,
  playbackTimeSec,
  isPlaying,
  onTogglePlay,
  onResetPlayback,
  onScrubTime,
}) => {
  const { caseId, diagramSnapshot } = evaluation;
  const d = diagramSnapshot.data;

  if (evaluation.blockingIssue && caseId !== 'TC-C04') {
    return (
      <div className="ft-panel border-[#F87171]/60 p-6 text-center space-y-2">
        <div className="text-sm font-semibold text-[#F87171]">
          Esquema detenido por parámetro fuera de dominio
        </div>
        <p className="text-xs text-[#CBD5E1]">{evaluation.blockingIssue.message}</p>
      </div>
    );
  }

  return (
    <section
      aria-label={`Esquema técnico interactivo ${caseId}`}
      className="ft-panel p-4 sm:p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-bold text-[#F1F5F9]">
            Esquema físico cutaway — {caseId}
          </h3>
          <p className="text-[11px] text-[#94A3B8]">
            Representación analítica vinculada al motor SI (esquema 1D/concentrado, no es simulación CFD Navier–Stokes)
          </p>
        </div>

        {/* Leyenda térmica cuantitativa */}
        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
          <span>Frío</span>
          <span
            className="w-20 h-2.5 rounded-sm border border-[#1E314A]"
            style={{
              background: 'linear-gradient(90deg, #38BDF8 0%, #F59E0B 50%, #F87171 100%)',
            }}
            aria-hidden="true"
          />
          <span>Caliente (°C)</span>
        </div>
      </div>

      {caseId === 'TC-C01' && <DiagramC01 data={d} />}
      {caseId === 'TC-C02' && <DiagramC02 data={d} />}
      {caseId === 'TC-C03' && <DiagramC03 data={d} />}
      {caseId === 'TC-C04' && (
        <DiagramC04
          data={d}
          evaluation={evaluation}
          playbackTimeSec={playbackTimeSec}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onResetPlayback={onResetPlayback}
          onScrubTime={onScrubTime}
        />
      )}
      {caseId === 'TC-C05' && <DiagramC05 data={d} />}
    </section>
  );
};

const DiagramC01: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const Tsi = Number(data.Tsi ?? 15);
  const Tse = Number(data.Tse ?? 4);
  const L = Number(data.L ?? 0.25);
  const k = Number(data.k ?? 0.8);
  const area = Number(data.area ?? 48);
  const Qdot = Number(data.Qdot ?? 1689.6);
  const qFlux = Number(data.qFlux ?? 35.2);
  const costUsd = Number(data.costUsd ?? 1.35168);

  const minT = Math.min(Tsi, Tse);
  const maxT = Math.max(Tsi, Tse);
  const cTop = tempToColor(Tse, minT - 1, maxT + 1);
  const cBot = tempToColor(Tsi, minT - 1, maxT + 1);
  const slabH = Math.min(130, Math.max(48, 48 + L * 180));
  const slabY = 145 - slabH / 2;
  const upward = Tsi >= Tse;

  return (
    <svg
      viewBox="0 0 640 290"
      role="img"
      aria-label={`Corte transversal del techo de espesor ${formatHT(L, 2)} m, cara interior ${formatHT(Tsi, 1)} °C, cara exterior ${formatHT(Tse, 1)} °C, flujo ${formatHT(Qdot, 1)} W`}
      className="w-full h-auto bg-[#070D18] rounded-xl border border-[#1E314A]"
    >
      <defs>
        <linearGradient id="c01-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={cBot} stopOpacity="0.82" />
          <stop offset="100%" stopColor={cTop} stopOpacity="0.82" />
        </linearGradient>
        <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
        </marker>
      </defs>

      <text x="270" y="32" textAnchor="middle" fill="#94A3B8" fontSize="12" fontWeight="600">
        Cara superficial exterior: T_se = {formatHT(Tse, 1)} °C
      </text>

      <rect
        x="95"
        y={slabY}
        width="350"
        height={slabH}
        fill="url(#c01-grad)"
        stroke="#F1F5F9"
        strokeWidth="1.5"
        rx="4"
      />

      {Math.abs(Tsi - Tse) > 1e-6 &&
        [155, 270, 385].map((xPos) => (
          <line
            key={xPos}
            x1={xPos}
            y1={upward ? slabY + slabH + 26 : slabY - 26}
            x2={xPos}
            y2={upward ? slabY - 24 : slabY + slabH + 24}
            stroke="#F59E0B"
            strokeWidth="2.4"
            className="ft-flow-dash"
            markerEnd="url(#arrow-amber)"
          />
        ))}

      {/* Etiqueta de losa legible con respaldo oscuro */}
      <rect
        x="118"
        y={slabY + slabH / 2 - 13}
        width="304"
        height="24"
        rx="4"
        fill="#070D18"
        fillOpacity="0.88"
        stroke="#1E314A"
      />
      <text x="270" y={slabY + slabH / 2 + 3} textAnchor="middle" fill="#F1F5F9" fontSize="11.5" fontWeight="600">
        Hormigón · k = {formatHT(k, 2)} W/(m·K) · A = {formatHT(area, 1)} m²
      </text>

      <text x="270" y="266" textAnchor="middle" fill="#F1F5F9" fontSize="12" fontWeight="600">
        Cara superficial interior: T_si = {formatHT(Tsi, 1)} °C
      </text>

      <line x1="65" y1={slabY} x2="65" y2={slabY + slabH} stroke="#38BDF8" strokeWidth="1.8" />
      <line x1="58" y1={slabY} x2="72" y2={slabY} stroke="#38BDF8" strokeWidth="1.8" />
      <line x1="58" y1={slabY + slabH} x2="72" y2={slabY + slabH} stroke="#38BDF8" strokeWidth="1.8" />
      <text x="52" y={slabY + slabH / 2 + 4} textAnchor="end" fill="#38BDF8" fontSize="11" fontWeight="700" className="font-mono-num">
        L={formatHT(L, 2)}m
      </text>

      <rect x="468" y="45" width="154" height="198" rx="8" fill="#0F1A2E" stroke="#1E314A" />
      <text x="480" y="68" fill="#2DD4BF" fontSize="11" fontWeight="700">
        FLUJO FOURIER 1D
      </text>
      <text x="480" y="92" fill="#94A3B8" fontSize="11">
        Potencia Q̇:
      </text>
      <text x="480" y="110" fill="#F59E0B" fontSize="15" fontWeight="700" className="font-mono-num">
        {formatHT(Qdot, 1)} W
      </text>
      <text x="480" y="136" fill="#94A3B8" fontSize="11">
        Flujo superficial q″:
      </text>
      <text x="480" y="154" fill="#F1F5F9" fontSize="13" fontWeight="600" className="font-mono-num">
        {formatHT(qFlux, 2)} W/m²
      </text>
      <text x="480" y="180" fill="#94A3B8" fontSize="11">
        ΔT = {formatHT(Tsi - Tse, 1)} K
      </text>
      <text x="480" y="206" fill="#94A3B8" fontSize="11">
        Costo equivalente:
      </text>
      <text x="480" y="224" fill="#2DD4BF" fontSize="13" fontWeight="700" className="font-mono-num">
        {formatHT(costUsd, 3)} USD
      </text>
    </svg>
  );
};

const DiagramC02: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const A = Number(data.A ?? 1.6);
  const Ts = Number(data.Ts ?? 29);
  const Tair = Number(data.Tair ?? 20);
  const Tsur = Number(data.Tsur ?? 20);
  const TsK = Number(data.TsK ?? 302.15);
  const TsurK = Number(data.TsurK ?? 293.15);
  const h = Number(data.h ?? 6);
  const epsilon = Number(data.epsilon ?? 0.95);
  const Qconv = Number(data.Qconv ?? 86.4);
  const Qrad = Number(data.Qrad ?? 81.84);
  const Qtotal = Number(data.Qtotal ?? 168.24);
  const shareConvPct = Number(data.shareConvPct ?? 51.35);
  const shareRadPct = Number(data.shareRadPct ?? 48.65);

  const minT = Math.min(Ts, Tair, Tsur) - 2;
  const maxT = Math.max(Ts, Tair, Tsur) + 2;
  const surfColor = tempToColor(Ts, minT, maxT);

  return (
    <svg
      viewBox="0 0 640 290"
      role="img"
      aria-label={`Superficie a ${formatHT(Ts, 1)} °C (${formatHT(TsK, 2)} K) intercambiando ${formatHT(Qconv, 1)} W por convección y ${formatHT(Qrad, 1)} W por radiación`}
      className="w-full h-auto bg-[#070D18] rounded-xl border border-[#1E314A]"
    >
      <rect x="20" y="20" width="430" height="250" rx="8" fill="none" stroke="#2C4668" strokeWidth="2" strokeDasharray="6 4" />
      <text x="36" y="42" fill="#94A3B8" fontSize="11" fontWeight="600">
        Paredes del recinto: T_alr = {formatHT(Tsur, 1)} °C ({formatHT(TsurK, 2)} K)
      </text>
      <text x="36" y="60" fill="#38BDF8" fontSize="11" fontWeight="600">
        Aire circundante: T_aire = {formatHT(Tair, 1)} °C · h = {formatHT(h, 1)} W/(m²·K)
      </text>

      <rect x="70" y="102" width="135" height="125" rx="10" fill={surfColor} stroke="#F1F5F9" strokeWidth="1.5" />
      <text x="137" y="150" textAnchor="middle" fill="#070D18" fontSize="13" fontWeight="700">
        T_s = {formatHT(Ts, 1)} °C
      </text>
      <text x="137" y="170" textAnchor="middle" fill="#070D18" fontSize="11" fontWeight="600" className="font-mono-num">
        ({formatHT(TsK, 2)} K)
      </text>
      <text x="137" y="192" textAnchor="middle" fill="#070D18" fontSize="11" fontWeight="600">
        A = {formatHT(A, 2)} m² · ε = {formatHT(epsilon, 2)}
      </text>

      <path d="M 215 130 C 260 112, 300 148, 355 128" fill="none" stroke="#38BDF8" strokeWidth="2.6" />
      <polygon points="355,128 345,123 347,134" fill="#38BDF8" />
      <text x="235" y="112" fill="#38BDF8" fontSize="11" fontWeight="700">
        Convección: {formatHT(Qconv, 2)} W ({formatHT(shareConvPct, 1)} %)
      </text>

      <path d="M 215 190 Q 235 176 255 190 T 295 190 T 335 190 L 365 190" fill="none" stroke="#F59E0B" strokeWidth="2.6" />
      <polygon points="365,190 355,184 355,196" fill="#F59E0B" />
      <text x="235" y="216" fill="#F59E0B" fontSize="11" fontWeight="700">
        Radiación T⁴: {formatHT(Qrad, 2)} W ({formatHT(shareRadPct, 1)} %)
      </text>

      <rect x="468" y="36" width="154" height="218" rx="8" fill="#0F1A2E" stroke="#1E314A" />
      <text x="480" y="60" fill="#2DD4BF" fontSize="11" fontWeight="700">
        RUTAS PARALELAS
      </text>
      <text x="480" y="84" fill="#94A3B8" fontSize="11">
        Q̇_conv (h·A·ΔT):
      </text>
      <text x="480" y="102" fill="#38BDF8" fontSize="14" fontWeight="700" className="font-mono-num">
        {formatHT(Qconv, 2)} W
      </text>
      <text x="480" y="130" fill="#94A3B8" fontSize="11">
        Q̇_rad (ε·σ·A·ΔT⁴):
      </text>
      <text x="480" y="148" fill="#F59E0B" fontSize="14" fontWeight="700" className="font-mono-num">
        {formatHT(Qrad, 2)} W
      </text>
      <line x1="480" y1="166" x2="610" y2="166" stroke="#1E314A" />
      <text x="480" y="188" fill="#94A3B8" fontSize="11">
        {Qtotal >= 0 ? 'Total cedido:' : 'Ganancia neta:'}
      </text>
      <text x="480" y="210" fill="#2DD4BF" fontSize="16" fontWeight="700" className="font-mono-num">
        {formatHT(Qtotal, 2)} W
      </text>
      <text x="480" y="236" fill="#94A3B8" fontSize="10">
        Cálculo interno en K
      </text>
    </svg>
  );
};

const DiagramC03: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const Ti = Number(data.Ti ?? 20);
  const Tsi = Number(data.Tsi ?? 14.23);
  const Tmid1 = Number(data.Tmid1 ?? 13.93);
  const Tmid2 = Number(data.Tmid2 ?? -8.26);
  const Tso = Number(data.Tso ?? -8.56);
  const To = Number(data.To ?? -10);
  const Qdot = Number(data.Qdot ?? 69.25);
  const Rtotal = Number(data.Rtotal ?? 0.43323);
  const Lg1mm = Number(data.Lg1mm ?? 4);
  const Lairmm = Number(data.Lairmm ?? 10);
  const Lg2mm = Number(data.Lg2mm ?? 4);
  const resistances = (data.resistances as Array<{ id: string; label: string; R: number; share: number }>) ?? [];

  const minT = Math.min(Ti, To) - 1;
  const maxT = Math.max(Ti, To) + 1;

  return (
    <svg
      viewBox="0 0 640 315"
      role="img"
      aria-label={`Ventana doble vidrio de 5 resistencias en serie entre ${formatHT(Ti, 1)} °C y ${formatHT(To, 1)} °C con potencia ${formatHT(Qdot, 2)} W`}
      className="w-full h-auto bg-[#070D18] rounded-xl border border-[#1E314A]"
    >
      {/* Capas de izquierda a derecha centradas en 640px (x=36..604) */}
      <rect x="36" y="48" width="100" height="120" fill={tempToColor(Ti, minT, maxT)} fillOpacity="0.22" stroke="#1E314A" />
      <text x="86" y="70" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">
        Aire int.
      </text>
      <text x="86" y="88" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="700" className="font-mono-num">
        {formatHT(Ti, 1)} °C
      </text>
      <text x="86" y="156" textAnchor="middle" fill="#94A3B8" fontSize="10">
        R_i ({formatHT(resistances[0]?.share ?? 19.2, 1)}%)
      </text>

      <rect x="136" y="48" width="64" height="120" fill="#38BDF8" fillOpacity="0.32" stroke="#38BDF8" strokeWidth="1.5" />
      <text x="168" y="102" textAnchor="middle" fill="#F1F5F9" fontSize="10" fontWeight="600">
        Vidrio 1
      </text>
      <text x="168" y="118" textAnchor="middle" fill="#CBD5E1" fontSize="10" className="font-mono-num">
        {formatHT(Lg1mm, 1)} mm
      </text>

      <rect x="200" y="48" width="240" height="120" fill="#14223B" stroke="#2DD4BF" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="320" y="88" textAnchor="middle" fill="#2DD4BF" fontSize="11" fontWeight="700">
        Cámara de aire estancado
      </text>
      <text x="320" y="132" textAnchor="middle" fill="#F1F5F9" fontSize="11" className="font-mono-num">
        L = {formatHT(Lairmm, 1)} mm · {formatHT(resistances[2]?.share ?? 74, 1)} % de R_t
      </text>

      <rect x="440" y="48" width="64" height="120" fill="#38BDF8" fillOpacity="0.22" stroke="#38BDF8" strokeWidth="1.5" />
      <text x="472" y="102" textAnchor="middle" fill="#F1F5F9" fontSize="10" fontWeight="600">
        Vidrio 2
      </text>
      <text x="472" y="118" textAnchor="middle" fill="#CBD5E1" fontSize="10" className="font-mono-num">
        {formatHT(Lg2mm, 1)} mm
      </text>

      <rect x="504" y="48" width="100" height="120" fill={tempToColor(To, minT, maxT)} fillOpacity="0.22" stroke="#1E314A" />
      <text x="554" y="70" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">
        Aire ext.
      </text>
      <text x="554" y="88" textAnchor="middle" fill="#38BDF8" fontSize="12" fontWeight="700" className="font-mono-num">
        {formatHT(To, 1)} °C
      </text>
      <text x="554" y="156" textAnchor="middle" fill="#94A3B8" fontSize="10">
        R_o ({formatHT(resistances[4]?.share ?? 4.8, 1)}%)
      </text>

      {[
        { x: 136, label: 'T_s,i', val: Tsi, yOff: 32 },
        { x: 200, label: 'T_1', val: Tmid1, yOff: 188 },
        { x: 440, label: 'T_2', val: Tmid2, yOff: 32 },
        { x: 504, label: 'T_s,o', val: Tso, yOff: 188 },
      ].map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy="108" r="4.5" fill="#F59E0B" stroke="#070D18" strokeWidth="1.5" />
          <text x={n.x} y={n.yOff} textAnchor="middle" fill="#F1F5F9" fontSize="10" fontWeight="700" className="font-mono-num">
            {n.label}={formatHT(n.val, 2)}°C
          </text>
        </g>
      ))}

      <text x="36" y="220" fill="#2DD4BF" fontSize="11" fontWeight="700">
        CIRCUITO DE 5 RESISTENCIAS EN SERIE (R_total = {formatHT(Rtotal, 4)} K/W · Q̇ = {formatHT(Qdot, 2)} W)
      </text>
      {resistances.map((r, i) => {
        const bx = 36 + i * 115;
        const barW = Math.max(8, (r.share / 100) * 96);
        return (
          <g key={r.id}>
            <rect x={bx} y="234" width="108" height="62" rx="6" fill="#0F1A2E" stroke="#1E314A" />
            <text x={bx + 8} y="252" fill="#F1F5F9" fontSize="11" fontWeight="700">
              {r.id}
            </text>
            <text x={bx + 100} y="252" textAnchor="end" fill="#2DD4BF" fontSize="10" className="font-mono-num">
              {formatHT(r.share, 1)}%
            </text>
            <text x={bx + 8} y="270" fill="#94A3B8" fontSize="10" className="font-mono-num">
              {formatHT(r.R, 4)} K/W
            </text>
            <rect x={bx + 8} y="280" width="92" height="6" rx="2" fill="#070D18" />
            <rect x={bx + 8} y="280" width={barW} height="6" rx="2" fill={r.id === 'Rair' ? '#2DD4BF' : '#38BDF8'} />
          </g>
        );
      })}
    </svg>
  );
};

const DiagramC04: React.FC<{
  data: Record<string, unknown>;
  evaluation: HeatEvaluation;
  playbackTimeSec?: number;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onResetPlayback?: () => void;
  onScrubTime?: (t: number) => void;
}> = ({
  data,
  playbackTimeSec = 0,
  isPlaying = false,
  onTogglePlay,
  onResetPlayback,
  onScrubTime,
}) => {
  const invalidLumped = Boolean(data.invalidLumped);
  const Dmm = Number(data.Dmm ?? 1);
  const Bi = Number(data.Bi ?? 0.001);
  const tau = Number(data.tau ?? 2.159);
  const targetTime = Number(data.targetTime ?? 9.94132);
  const targetPct = Number(data.targetPct ?? 99);
  const Ti = Number(data.Ti ?? 0);
  const Tgas = Number(data.Tgas ?? 100);
  const TAtInspect = Number(data.TAtInspect ?? Tgas);
  const pctInspect = Number(data.responseFractionAtInspect ?? targetPct);
  const tInspect = Number(data.tInspect ?? targetTime);

  const rPx = Math.min(48, Math.max(18, 18 + Math.log10(Math.max(0.2, Dmm)) * 16));
  const minT = Math.min(Ti, Tgas) - 1;
  const maxT = Math.max(Ti, Tgas) + 1;
  const beadColor = invalidLumped ? '#F87171' : tempToColor(TAtInspect, minT, maxT);

  return (
    <div className="space-y-3">
      <svg
        viewBox="0 0 640 250"
        role="img"
        aria-label={`Termopar esférico de diámetro ${formatHT(Dmm, 2)} mm en gas a ${formatHT(Tgas, 1)} °C, Bi = ${formatHT(Bi, 4)}`}
        className="w-full h-auto bg-[#070D18] rounded-xl border border-[#1E314A]"
      >
        {[55, 125, 195].map((yPos) => (
          <g key={yPos}>
            <line x1="25" y1={yPos} x2="415" y2={yPos} stroke="#38BDF8" strokeOpacity="0.32" strokeWidth="1.5" className="ft-flow-dash" />
            <polygon points={`415,${yPos} 405,${yPos - 4} 405,${yPos + 4}`} fill="#38BDF8" fillOpacity="0.6" />
          </g>
        ))}
        <text x="32" y="34" fill="#38BDF8" fontSize="11" fontWeight="700">
          Corriente de gas: T_∞ = {formatHT(Tgas, 1)} °C
        </text>

        <rect x="215" y="18" width="10" height={107 - rPx} fill="#64748B" />
        <circle cx="220" cy="125" r={rPx} fill={beadColor} stroke="#F1F5F9" strokeWidth="2" />
        <text x="220" y={125 + rPx + 20} textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="700" className="font-mono-num">
          D = {formatHT(Dmm, 2)} mm · {invalidLumped ? 'Bi ≥ 0,1 BLOQUEADO' : `T(t) = ${formatHT(TAtInspect, 1)} °C`}
        </text>

        <rect x="442" y="24" width="180" height="202" rx="8" fill="#0F1A2E" stroke={invalidLumped ? '#F87171' : '#1E314A'} />
        <text x="454" y="48" fill={invalidLumped ? '#F87171' : '#2DD4BF'} fontSize="11" fontWeight="700">
          {invalidLumped ? 'MODELO BLOQUEADO' : 'CAPACIDAD CONCENTRADA'}
        </text>
        <text x="454" y="72" fill="#94A3B8" fontSize="11">
          Biot = h·L_c / k:
        </text>
        <text x="454" y="90" fill={invalidLumped ? '#F87171' : '#2DD4BF'} fontSize="14" fontWeight="700" className="font-mono-num">
          {formatHT(Bi, 5)} {invalidLumped ? '≥ 0,10' : '< 0,10'}
        </text>

        {!invalidLumped ? (
          <>
            <text x="454" y="118" fill="#94A3B8" fontSize="11">
              Constante τ = 1/b:
            </text>
            <text x="454" y="136" fill="#F1F5F9" fontSize="13" fontWeight="700" className="font-mono-num">
              {formatHT(tau, 3)} s
            </text>
            <text x="454" y="162" fill="#94A3B8" fontSize="11">
              Tiempo meta ({formatHT(targetPct, 1)} %):
            </text>
            <text x="454" y="180" fill="#F59E0B" fontSize="14" fontWeight="700" className="font-mono-num">
              {formatHT(targetTime, 3)} s
            </text>
            <text x="454" y="206" fill="#94A3B8" fontSize="10" className="font-mono-num">
              Instante t={formatHT(tInspect, 2)} s ({formatHT(pctInspect, 1)} %)
            </text>
          </>
        ) : (
          <text x="454" y="126" fill="#94A3B8" fontSize="11">
            Gradientes internos altos. Reduce D o h.
          </text>
        )}
      </svg>

      {!invalidLumped && onTogglePlay && onScrubTime && onResetPlayback && (
        <div className="ft-well px-3.5 py-2.5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#38BDF8] text-[#070D18] hover:bg-[#67D2FB] transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" aria-hidden="true" /> : <Play className="w-3.5 h-3.5" aria-hidden="true" />}
            {isPlaying ? 'Pausar' : 'Reproducir respuesta'}
          </button>
          <button
            type="button"
            onClick={onResetPlayback}
            aria-label="Reiniciar tiempo de respuesta"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            t = 0
          </button>
          <div className="flex-1 min-w-[180px] flex items-center gap-2">
            <label htmlFor="c04-time-scrub" className="text-xs text-[#94A3B8] whitespace-nowrap">
              Tiempo t:
            </label>
            <input
              id="c04-time-scrub"
              type="range"
              min={0}
              max={Math.max(1, targetTime * 1.4)}
              step={Math.max(0.05, targetTime / 100)}
              value={playbackTimeSec}
              onChange={(e) => onScrubTime(parseFloat(e.target.value))}
              className="ft-slider flex-1"
            />
            <span className="font-mono-num text-xs text-[#2DD4BF] min-w-[4.5rem] text-right">
              {formatHT(tInspect, 2)} s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const DiagramC05: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const flowMode = (data.flowMode as string) === 'parallel' ? 'parallel' : 'counterflow';
  const Tcin = Number(data.Tcin ?? 20);
  const Tcout = Number(data.Tcout ?? 80);
  const Thin = Number(data.Thin ?? 160);
  const Thout = Number(data.Thout ?? 125.09);
  const mc = Number(data.mc ?? 1.2);
  const mh = Number(data.mh ?? 2);
  const Qkw = Number(data.Qkw ?? 300.96);
  const lmtd = Number(data.lmtd ?? 91.97);
  const A = Number(data.A ?? 5.113);
  const L = Number(data.L ?? 108.5);
  const Dcm = Number(data.Dcm ?? 1.5);
  const effectiveness = Number(data.effectiveness ?? 0.42857);

  return (
    <svg
      viewBox="0 0 640 300"
      role="img"
      aria-label={`Intercambiador doble tubo ${flowMode === 'counterflow' ? 'a contraflujo' : 'en flujo paralelo'}: caliente ${formatHT(Thin, 1)} a ${formatHT(Thout, 1)} °C, fría ${formatHT(Tcin, 1)} a ${formatHT(Tcout, 1)} °C, longitud ${formatHT(L, 1)} m`}
      className="w-full h-auto bg-[#070D18] rounded-xl border border-[#1E314A]"
    >
      <defs>
        <linearGradient id="hot-pipe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F87171" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id="cold-pipe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={flowMode === 'counterflow' ? '#2DD4BF' : '#38BDF8'} stopOpacity="0.75" />
          <stop offset="100%" stopColor={flowMode === 'counterflow' ? '#38BDF8' : '#2DD4BF'} stopOpacity="0.75" />
        </linearGradient>
      </defs>

      <rect x="42" y="64" width="388" height="148" rx="10" fill="url(#hot-pipe)" fillOpacity="0.32" stroke="#F87171" strokeWidth="1.8" />
      <rect x="42" y="114" width="388" height="48" fill="url(#cold-pipe)" stroke="#38BDF8" strokeWidth="2" />

      <line x1="65" y1="88" x2="175" y2="88" stroke="#F87171" strokeWidth="2.4" className="ft-flow-dash" />
      <polygon points="175,88 165,83 165,93" fill="#F87171" />
      <line x1="275" y1="88" x2="395" y2="88" stroke="#F59E0B" strokeWidth="2.4" className="ft-flow-dash" />
      <polygon points="395,88 385,83 385,93" fill="#F59E0B" />

      {flowMode === 'counterflow' ? (
        <>
          <line x1="395" y1="138" x2="275" y2="138" stroke="#F1F5F9" strokeWidth="2.4" className="ft-flow-dash" />
          <polygon points="275,138 285,133 285,143" fill="#F1F5F9" />
          <line x1="185" y1="138" x2="65" y2="138" stroke="#F1F5F9" strokeWidth="2.4" className="ft-flow-dash" />
          <polygon points="65,138 75,133 75,143" fill="#F1F5F9" />
        </>
      ) : (
        <>
          <line x1="65" y1="138" x2="185" y2="138" stroke="#F1F5F9" strokeWidth="2.4" className="ft-flow-dash" />
          <polygon points="185,138 175,133 175,143" fill="#F1F5F9" />
          <line x1="275" y1="138" x2="395" y2="138" stroke="#F1F5F9" strokeWidth="2.4" className="ft-flow-dash" />
          <polygon points="395,138 385,133 385,143" fill="#F1F5F9" />
        </>
      )}

      <text x="42" y="48" fill="#F87171" fontSize="11" fontWeight="700" className="font-mono-num">
        T_h,ent = {formatHT(Thin, 1)} °C (ṁ_h={formatHT(mh, 2)} kg/s)
      </text>
      <text x="42" y="236" fill="#2DD4BF" fontSize="11" fontWeight="700" className="font-mono-num">
        {flowMode === 'counterflow'
          ? `T_c,sal = ${formatHT(Tcout, 1)} °C`
          : `T_c,ent = ${formatHT(Tcin, 1)} °C`}
      </text>

      <text x="430" y="48" textAnchor="end" fill="#F59E0B" fontSize="11" fontWeight="700" className="font-mono-num">
        T_h,sal = {formatHT(Thout, 2)} °C
      </text>
      <text x="430" y="236" textAnchor="end" fill="#38BDF8" fontSize="11" fontWeight="700" className="font-mono-num">
        {flowMode === 'counterflow'
          ? `T_c,ent = ${formatHT(Tcin, 1)} °C (ṁ_c=${formatHT(mc, 2)} kg/s)`
          : `T_c,sal = ${formatHT(Tcout, 1)} °C (ṁ_c=${formatHT(mc, 2)} kg/s)`}
      </text>

      <text x="236" y="196" textAnchor="middle" fill="#CBD5E1" fontSize="11">
        Tubo interior D = {formatHT(Dcm, 2)} cm · {flowMode === 'counterflow' ? 'Contraflujo' : 'Flujo paralelo'}
      </text>

      <rect x="454" y="28" width="168" height="240" rx="8" fill="#0F1A2E" stroke="#1E314A" />
      <text x="466" y="52" fill="#2DD4BF" fontSize="11" fontWeight="700">
        DIMENSIONAMIENTO
      </text>
      <text x="466" y="76" fill="#94A3B8" fontSize="11">
        Potencia Q̇:
      </text>
      <text x="466" y="94" fill="#38BDF8" fontSize="14" fontWeight="700" className="font-mono-num">
        {formatHT(Qkw, 2)} kW
      </text>
      <text x="466" y="120" fill="#94A3B8" fontSize="11">
        LMTD (ΔT_lm):
      </text>
      <text x="466" y="138" fill="#F1F5F9" fontSize="13" fontWeight="700" className="font-mono-num">
        {formatHT(lmtd, 2)} K
      </text>
      <text x="466" y="164" fill="#94A3B8" fontSize="11">
        Área A = π·D·L:
      </text>
      <text x="466" y="182" fill="#F1F5F9" fontSize="13" fontWeight="700" className="font-mono-num">
        {formatHT(A, 3)} m²
      </text>
      <text x="466" y="208" fill="#94A3B8" fontSize="11">
        Longitud L:
      </text>
      <text x="466" y="226" fill="#F59E0B" fontSize="15" fontWeight="700" className="font-mono-num">
        {formatHT(L, 2)} m
      </text>
      <text x="466" y="252" fill="#94A3B8" fontSize="10" className="font-mono-num">
        Efectividad ε = {formatHT(effectiveness * 100, 2)} %
      </text>
    </svg>
  );
};
