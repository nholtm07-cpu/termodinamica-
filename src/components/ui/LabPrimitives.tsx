import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Compass,
  Info,
  Lightbulb,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
} from 'lucide-react';

/**
 * Cabecera arquitectónica unificada para cada módulo o laboratorio.
 * Mantiene jerarquía clara: contexto de disciplina, título editorial, descripción concisa y acciones.
 */
interface ModuleHeroProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent?: 'cyan' | 'teal' | 'amber';
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
}

const EYEBROW_COLOR: Record<NonNullable<ModuleHeroProps['accent']>, string> = {
  cyan: 'text-[#38BDF8]',
  teal: 'text-[#2DD4BF]',
  amber: 'text-[#F59E0B]',
};

export const ModuleHero: React.FC<ModuleHeroProps> = ({
  eyebrow,
  title,
  subtitle,
  accent = 'cyan',
  rightSlot,
  children,
}) => {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-[#1E314A] bg-gradient-to-br from-[#0F1A2E] via-[#0C1627] to-[#09111F] p-5 sm:p-6 shadow-[0_12px_32px_-16px_rgba(2,6,16,0.85)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 ft-blueprint-bg opacity-60"
      />
      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className={`text-xs font-medium tracking-wide ${EYEBROW_COLOR[accent]}`}>
              {eyebrow}
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F1F5F9] leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </div>
        {children && <div className="pt-1">{children}</div>}
      </div>
    </header>
  );
};

/**
 * Tarjeta numérica de instrumento científico con cifras tabulares y comparador opcional de cátedra.
 */
interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  baseline?: string;
  deltaText?: string;
  tone?: 'neutral' | 'cyan' | 'teal' | 'amber' | 'crimson';
  caption?: string;
}

const VALUE_TONE: Record<NonNullable<MetricTileProps['tone']>, string> = {
  neutral: 'text-[#F1F5F9]',
  cyan: 'text-[#38BDF8]',
  teal: 'text-[#2DD4BF]',
  amber: 'text-[#F59E0B]',
  crimson: 'text-[#F87171]',
};

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  unit,
  baseline,
  deltaText,
  tone = 'neutral',
  caption,
}) => {
  return (
    <div className="rounded-xl border border-[#1E314A] bg-[#0B1322] px-4 py-3.5 transition-colors hover:border-[#2C4668]">
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#94A3B8]">
        <span className="truncate">{label}</span>
        {deltaText && (
          <span className="font-mono-num text-[10px] font-semibold text-[#F59E0B] shrink-0">
            {deltaText}
          </span>
        )}
      </div>
      <div className={`font-mono-num text-lg sm:text-xl font-bold mt-1 ${VALUE_TONE[tone]}`}>
        {value}
        {unit && <span className="text-xs font-medium text-[#94A3B8] ml-1.5">{unit}</span>}
      </div>
      {(baseline || caption) && (
        <div className="text-[11px] text-[#94A3B8] mt-1 font-mono-num truncate">
          {baseline ? `Ref. base: ${baseline}` : caption}
        </div>
      )}
    </div>
  );
};

/**
 * Control de laboratorio con deslizador calibrado, entrada numérica directa y comparación vs. valor de cátedra.
 */
interface InstrumentSliderProps {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  defaultValue?: number;
  hint?: string;
  modified?: boolean;
  formatRef?: (n: number) => string;
}

export const InstrumentSlider: React.FC<InstrumentSliderProps> = ({
  id,
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  defaultValue,
  hint,
  modified,
  formatRef,
}) => {
  const isModified =
    modified ?? (defaultValue !== undefined && Math.abs(value - defaultValue) > 1e-9);
  const clamped = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

  return (
    <div
      className={`rounded-xl border p-3.5 space-y-2.5 transition-colors duration-200 ${
        isModified
          ? 'bg-[#132038] border-[#F59E0B]/55'
          : 'bg-[#091120] border-[#1E314A] hover:border-[#2C4668]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-[#F1F5F9] leading-snug">
          {label}
        </label>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            id={id}
            type="number"
            value={Number.isFinite(value) ? value : ''}
            step={step}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              if (Number.isFinite(parsed)) onChange(parsed);
            }}
            className="w-24 px-2.5 py-1 text-right font-mono-num text-xs bg-[#0F1A2E] border border-[#1E314A] rounded-md text-[#F1F5F9] focus:border-[#38BDF8] transition-colors"
          />
          <span className="text-[11px] font-mono-num text-[#94A3B8] min-w-[3rem]">
            {unit}
          </span>
        </div>
      </div>

      <input
        type="range"
        aria-label={`Control deslizante de ${label}`}
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="ft-slider"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
        <span>{hint}</span>
        {defaultValue !== undefined && (
          <span className={isModified ? 'text-[#F59E0B] font-medium font-mono-num' : 'font-mono-num'}>
            {isModified
              ? `Base: ${formatRef ? formatRef(defaultValue) : defaultValue} ${unit}`
              : 'Valor nominal'}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Bloque pedagógico estructurado sin bordes gruesos a la izquierda ni cajas redundantes.
 */
type PedagogicKind = 'concept' | 'mistake' | 'interpretation' | 'dimensional' | 'experiment' | 'formula';

interface PedagogicBlockProps {
  kind: PedagogicKind;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const PEDAGOGIC_META: Record<
  PedagogicKind,
  { defaultTitle: string; icon: React.ComponentType<{ className?: string }>; accent: string; border: string; bg: string }
> = {
  concept: {
    defaultTitle: 'Concepto clave',
    icon: Lightbulb,
    accent: 'text-[#38BDF8]',
    border: 'border-[#38BDF8]/25',
    bg: 'bg-[#0B172B]',
  },
  mistake: {
    defaultTitle: 'Error común en certamen',
    icon: AlertTriangle,
    accent: 'text-[#F87171]',
    border: 'border-[#F87171]/30',
    bg: 'bg-[#1D1219]',
  },
  interpretation: {
    defaultTitle: 'Interpretación física',
    icon: Compass,
    accent: 'text-[#2DD4BF]',
    border: 'border-[#2DD4BF]/25',
    bg: 'bg-[#0A1A26]',
  },
  dimensional: {
    defaultTitle: 'Chequeo dimensional',
    icon: Ruler,
    accent: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]/25',
    bg: 'bg-[#1A1611]',
  },
  experiment: {
    defaultTitle: 'Prueba cambiando parámetros',
    icon: SlidersHorizontal,
    accent: 'text-[#2DD4BF]',
    border: 'border-[#2DD4BF]/25',
    bg: 'bg-[#091625]',
  },
  formula: {
    defaultTitle: 'Modelo matemático',
    icon: BookOpen,
    accent: 'text-[#38BDF8]',
    border: 'border-[#1E314A]',
    bg: 'bg-[#091120]',
  },
};

export const PedagogicBlock: React.FC<PedagogicBlockProps> = ({
  kind,
  title,
  children,
  className = '',
}) => {
  const meta = PEDAGOGIC_META[kind];
  const Icon = meta.icon;
  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-4 space-y-2 ${className}`}>
      <div className={`inline-flex items-center gap-2 text-xs font-semibold ${meta.accent}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{title ?? meta.defaultTitle}</span>
      </div>
      <div className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">{children}</div>
    </div>
  );
};

/**
 * Tooltip técnico accesible para definiciones de variables y criterios físicos.
 */
interface InfoTooltipProps {
  label: string;
  content: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ label, content }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#14223B] transition-colors cursor-pointer"
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-64 rounded-lg border border-[#2C4668] bg-[#0B1322] p-2.5 text-[11px] text-[#CBD5E1] leading-relaxed shadow-xl pointer-events-none"
        >
          {content}
        </span>
      )}
    </span>
  );
};

/**
 * Comparador explícito entre valor base de cátedra/libro y estado actual del simulador.
 */
interface BaselineComparatorProps {
  isModified: boolean;
  modifiedCount: number;
  sourceLabel?: string;
  onRestore: () => void;
}

export const BaselineComparator: React.FC<BaselineComparatorProps> = ({
  isModified,
  modifiedCount,
  sourceLabel = 'cátedra',
  onRestore,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#1E314A] bg-[#091120] px-3.5 py-2 text-xs">
      <div className="flex items-center gap-2 text-[#94A3B8]">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isModified ? 'bg-[#F59E0B]' : 'bg-[#2DD4BF]'
          }`}
          aria-hidden="true"
        />
        <span>
          {isModified
            ? `Estado alterado: ${modifiedCount} parámetro${modifiedCount > 1 ? 's' : ''} distinto${modifiedCount > 1 ? 's' : ''} al caso de ${sourceLabel}`
            : `Estado nominal: coincide con los datos de ${sourceLabel}`}
        </span>
      </div>
      {isModified && (
        <button
          type="button"
          onClick={onRestore}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8] hover:text-[#F1F5F9] transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Restaurar base
        </button>
      )}
    </div>
  );
};

/**
 * Recurso visual temático interactivo para la portada:
 * integra flujo hidráulico (MEC120), campana T-s IAPWS-IF97 (MEC110) y gradiente térmico (Transferencia de Calor).
 */
interface ThermoHeroVisualProps {
  onSelectArea: (area: 'mec120' | 'sim-rankine' | 'heat-labs') => void;
}

export const ThermoHeroVisual: React.FC<ThermoHeroVisualProps> = ({ onSelectArea }) => {
  const [hoveredZone, setHoveredZone] = useState<'fluid' | 'ts' | 'heat' | null>(null);

  return (
    <div className="rounded-xl border border-[#1E314A] bg-[#08101E] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
        <span className="font-semibold text-[#F1F5F9]">Esquema acoplado de procesos térmicos</span>
        <span className="font-mono-num">SI · Kelvin · IAPWS-IF97</span>
      </div>

      <svg
        viewBox="0 0 460 225"
        role="img"
        aria-label="Diagrama acoplado de mecánica de fluidos, campana T-s de vapor y gradiente de transferencia de calor"
        className="w-full h-auto rounded-lg bg-[#060B15] border border-[#1E314A]/80"
      >
        <defs>
          <linearGradient id="heroThermalGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.88" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="heroDomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.03" />
          </linearGradient>
          <pattern id="heroGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E314A" strokeWidth="0.6" strokeOpacity="0.45" />
          </pattern>
        </defs>

        <rect width="460" height="225" fill="url(#heroGrid)" />

        {/* Zona 1: Flujo en conducto MEC120 */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectArea('mec120')}
          onMouseEnter={() => setHoveredZone('fluid')}
          onMouseLeave={() => setHoveredZone(null)}
        >
          <rect
            x="14"
            y="18"
            width="132"
            height="186"
            rx="8"
            fill="#0D192D"
            stroke={hoveredZone === 'fluid' ? '#38BDF8' : '#1E314A'}
            strokeWidth={hoveredZone === 'fluid' ? '1.6' : '1'}
          />
          <text x="26" y="38" fill="#38BDF8" fontSize="10" fontWeight="700">
            MEC120 · FLUIDOS
          </text>
          {/* Tubería con perfil parabólico y flujo animado */}
          <rect x="26" y="64" width="108" height="44" rx="4" fill="#070E1A" stroke="#2C4668" />
          <line x1="34" y1="76" x2="124" y2="76" stroke="#38BDF8" strokeWidth="1.8" className="ft-flow-dash" />
          <line x1="34" y1="86" x2="126" y2="86" stroke="#2DD4BF" strokeWidth="2.2" className="ft-flow-dash" />
          <line x1="34" y1="96" x2="124" y2="96" stroke="#38BDF8" strokeWidth="1.8" className="ft-flow-dash" />
          <text x="26" y="132" fill="#CBD5E1" fontSize="10" className="font-mono-num">
            Re · f (Darcy)
          </text>
          <text x="26" y="148" fill="#94A3B8" fontSize="9.5" className="font-mono-num">
            p = p₀ + ρ·g·h
          </text>
          <text x="26" y="186" fill="#38BDF8" fontSize="9.5" fontWeight="600">
            Abrir hidráulica →
          </text>
        </g>

        {/* Zona 2: Campana T-s y Ciclo Rankine MEC110 */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectArea('sim-rankine')}
          onMouseEnter={() => setHoveredZone('ts')}
          onMouseLeave={() => setHoveredZone(null)}
        >
          <rect
            x="160"
            y="18"
            width="144"
            height="186"
            rx="8"
            fill="#0D192D"
            stroke={hoveredZone === 'ts' ? '#2DD4BF' : '#1E314A'}
            strokeWidth={hoveredZone === 'ts' ? '1.6' : '1'}
          />
          <text x="172" y="38" fill="#2DD4BF" fontSize="10" fontWeight="700">
            MEC110 · CICLO T–s
          </text>
          {/* Ejes T-s */}
          <line x1="176" y1="54" x2="176" y2="152" stroke="#475569" strokeWidth="1.2" />
          <line x1="176" y1="152" x2="290" y2="152" stroke="#475569" strokeWidth="1.2" />
          <text x="168" y="60" fill="#94A3B8" fontSize="8.5" className="font-mono-num">T</text>
          <text x="284" y="162" fill="#94A3B8" fontSize="8.5" className="font-mono-num">s</text>
          {/* Campana de saturación */}
          <path
            d="M 184 148 Q 222 62 246 78 Q 264 92 284 148 Z"
            fill="url(#heroDomeFill)"
            stroke="#2DD4BF"
            strokeWidth="1.3"
            strokeOpacity="0.65"
          />
          {/* Trazado de ciclo Rankine 1-2-3-4 */}
          <polyline
            points="192,140 194,104 228,104 260,68 260,140 192,140"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <circle cx="192" cy="140" r="2.8" fill="#38BDF8" />
          <circle cx="194" cy="104" r="2.8" fill="#38BDF8" />
          <circle cx="260" cy="68" r="3" fill="#F97316" />
          <circle cx="260" cy="140" r="2.8" fill="#2DD4BF" />
          <text x="172" y="186" fill="#2DD4BF" fontSize="9.5" fontWeight="600">
            Abrir planta IF97 →
          </text>
        </g>

        {/* Zona 3: Gradiente térmico de Transferencia de Calor */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectArea('heat-labs')}
          onMouseEnter={() => setHoveredZone('heat')}
          onMouseLeave={() => setHoveredZone(null)}
        >
          <rect
            x="318"
            y="18"
            width="128"
            height="186"
            rx="8"
            fill="#0D192D"
            stroke={hoveredZone === 'heat' ? '#F59E0B' : '#1E314A'}
            strokeWidth={hoveredZone === 'heat' ? '1.6' : '1'}
          />
          <text x="330" y="38" fill="#F59E0B" fontSize="10" fontWeight="700">
            CALOR · FOURIER
          </text>
          {/* Pared multicapa con perfil térmico */}
          <rect x="332" y="62" width="100" height="52" rx="4" fill="url(#heroThermalGrad)" stroke="#2C4668" />
          <line x1="338" y1="88" x2="424" y2="88" stroke="#F1F5F9" strokeWidth="1.8" className="ft-flow-dash" />
          <polygon points="428,88 419,83 419,93" fill="#F1F5F9" />
          <text x="332" y="132" fill="#F59E0B" fontSize="10" className="font-mono-num">
            T₁ → q̇ → T₂
          </text>
          <text x="332" y="148" fill="#94A3B8" fontSize="9.5" className="font-mono-num">
            Bi · LMTD · T⁴(K)
          </text>
          <text x="332" y="186" fill="#F59E0B" fontSize="9.5" fontWeight="600">
            Abrir 5 labs →
          </text>
        </g>
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
        <span>Haz clic en cualquier bloque del esquema para abrir su laboratorio interactivo.</span>
      </div>
    </div>
  );
};
