import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, HelpCircle, SlidersHorizontal } from 'lucide-react';
import { LESSONS, MEC110_UNITS, type LessonItem } from '../../../content/mec110/lessons';
import type { DepthLevel } from '../../../core/contracts';
import { solveIdealGasClosedProcess, type ClosedProcessType } from '../../../core/thermo/idealGas';
import { formatCL } from '../../../core/thermo/units';
import { MathBlock } from '../../../components/MathBlock';
import {
  ModuleHero,
  PedagogicBlock,
} from '../../../components/ui/LabPrimitives';

interface CatedraViewProps {
  selectedLessonId: string;
  onSelectLesson: (id: string) => void;
  depthLevel: DepthLevel;
  onChangeDepthLevel: (lvl: DepthLevel) => void;
  completedLessons: string[];
  onToggleLessonComplete: (id: string) => void;
  onOpenSimulatorTab: (tab: 'sim-boltzmann' | 'sim-carnot' | 'sim-brayton' | 'sim-rankine' | 'tools') => void;
}

const DEPTH_LABELS: Array<{ id: DepthLevel; label: string; desc: string }> = [
  { id: 'desde-cero', label: 'Desde cero', desc: 'Lenguaje cotidiano y analogías' },
  { id: 'universitario', label: 'Universitario', desc: 'Rigor y derivación formal' },
  { id: 'certamen', label: 'Certamen', desc: 'Atajos, trampas y verificación' },
];

export const CatedraView: React.FC<CatedraViewProps> = ({
  selectedLessonId,
  onSelectLesson,
  depthLevel,
  onChangeDepthLevel,
  completedLessons,
  onToggleLessonComplete,
  onOpenSimulatorTab,
}) => {
  const [unitFilter, setUnitFilter] = useState<'ALL' | LessonItem['unitId']>('ALL');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Micro-laboratorio interactivo para Unidad I-II (Gas Ideal Sistema Cerrado MEC110_3-4)
  const [showQuickLab, setShowQuickLab] = useState(false);
  const [procType, setProcType] = useState<ClosedProcessType>('polytropic');
  const [mKg, setMKg] = useState(1.2);
  const [p1KPa, setP1KPa] = useState(200);
  const [V1M3, setV1M3] = useState(0.5);
  const [V2M3, setV2M3] = useState(1.0);
  const [T1C, setT1C] = useState(25);
  const [nPoly, setNPoly] = useState(1.3);

  const filteredLessons = useMemo(
    () => (unitFilter === 'ALL' ? LESSONS : LESSONS.filter((l) => l.unitId === unitFilter)),
    [unitFilter]
  );

  const lesson = useMemo(
    () => LESSONS.find((l) => l.id === selectedLessonId) ?? LESSONS[0],
    [selectedLessonId]
  );

  const isCompleted = completedLessons.includes(lesson.id);
  const levelContent = lesson.levels[depthLevel];

  const handleSelectLesson = (id: string) => {
    onSelectLesson(id);
    setSelectedOption(null);
    setShowHint(false);
  };

  const quickLabResult = useMemo(
    () =>
      solveIdealGasClosedProcess({
        process: procType,
        mKg,
        p1KPa,
        V1M3,
        V2M3,
        T1C,
        nPolytropic: nPoly,
      }),
    [procType, mKg, p1KPa, V1M3, V2M3, T1C, nPoly]
  );

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="MEC110 · Cátedra Interactiva de Termodinámica"
        title="El Profesor al Lado: De los fundamentos al ciclo de vapor"
        subtitle="Los tres niveles comparten exactamente el mismo motor de cálculo físico; solo varía el grado de formalidad matemática y la estrategia de examen."
        accent="cyan"
        rightSlot={
          <div
            role="group"
            aria-label="Nivel de profundidad pedagógica"
            className="flex flex-wrap items-center gap-1 bg-[#070D18] p-1 rounded-xl border border-[#1E314A]"
          >
            {DEPTH_LABELS.map((d) => {
              const active = depthLevel === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChangeDepthLevel(d.id)}
                  title={d.desc}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#38BDF8] text-[#070D18] shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        }
      >
        {/* Filtro de unidades */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setUnitFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              unitFilter === 'ALL'
                ? 'bg-[#14223B] border-[#38BDF8] text-[#F1F5F9] font-semibold'
                : 'bg-[#091120] border-[#1E314A] text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            Todas las unidades ({LESSONS.length})
          </button>
          {MEC110_UNITS.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setUnitFilter(u.id)}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                unitFilter === u.id
                  ? 'bg-[#14223B] border-[#38BDF8] text-[#F1F5F9] font-semibold'
                  : 'bg-[#091120] border-[#1E314A] text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {u.code}
            </button>
          ))}
        </div>
      </ModuleHero>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Índice de lecciones */}
        <aside className="lg:col-span-4 rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-3.5 space-y-1.5 max-h-[720px] overflow-y-auto">
          <div className="px-2 pb-2 text-[11px] font-semibold text-[#94A3B8]">
            Programa de lecciones ({completedLessons.length}/{LESSONS.length} completadas)
          </div>
          {filteredLessons.map((item) => {
            const active = item.id === lesson.id;
            const done = completedLessons.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectLesson(item.id)}
                aria-current={active ? 'step' : undefined}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                  active
                    ? 'bg-[#14223B] border-[#38BDF8] text-[#F1F5F9]'
                    : 'bg-[#091120] border-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#1E314A]'
                }`}
              >
                <div>
                  <div className="font-mono-num text-[11px] text-[#38BDF8]">
                    {item.id} · {item.sourceModule}
                  </div>
                  <div className="text-xs font-semibold mt-0.5 leading-snug">{item.title}</div>
                </div>
                {done && (
                  <CheckCircle2
                    className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5"
                    aria-label="Completada"
                  />
                )}
              </button>
            );
          })}
        </aside>

        {/* Lector de los 10 bloques pedagógicos */}
        <article className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-5 sm:p-7 space-y-6">
            {/* Cabecera lección */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1E314A] pb-5">
              <div>
                <div className="text-xs text-[#94A3B8] font-mono-num">
                  {lesson.id} · {lesson.unitTitle} · {lesson.cengelRef}
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F1F5F9] mt-1">
                  {lesson.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleLessonComplete(lesson.id)}
                  aria-pressed={isCompleted}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                    isCompleted
                      ? 'bg-[#2DD4BF] text-[#070D18] border-[#2DD4BF]'
                      : 'bg-[#14223B] text-[#F1F5F9] border-[#1E314A] hover:border-[#2DD4BF]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isCompleted ? 'Lección completada' : 'Marcar completada'}
                </button>

                {lesson.simulatorLink && (
                  <button
                    type="button"
                    onClick={() => onOpenSimulatorTab(lesson.simulatorLink!.tab)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#38BDF8] text-[#070D18] hover:bg-[#60CEFA] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {lesson.simulatorLink.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 1) Pregunta física inicial */}
            <PedagogicBlock kind="concept" title="1. Pregunta física inicial">
              <p className="text-sm sm:text-base text-[#F1F5F9] font-medium leading-relaxed">
                {lesson.initialQuestion}
              </p>
            </PedagogicBlock>

            {/* 2) Explicación graduada */}
            <section className="space-y-3">
              <div className="text-xs font-semibold text-[#2DD4BF]">
                2. Desarrollo conceptual · Enfoque {DEPTH_LABELS.find((d) => d.id === depthLevel)?.label}
              </div>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">{levelContent.explanation}</p>
              <PedagogicBlock kind="interpretation" title="Idea física clave">
                {levelContent.analogyOrInsight}
              </PedagogicBlock>
              {levelContent.extraMathNote && (
                <p className="text-xs font-mono-num text-[#2DD4BF] bg-[#070D18] border border-[#1E314A] rounded-lg px-3.5 py-2.5">
                  {levelContent.extraMathNote}
                </p>
              )}
            </section>

            {/* 3) Esquema del sistema */}
            <section className="space-y-2">
              <div className="text-xs font-semibold text-[#94A3B8]">
                3. Esquema del sistema físico
              </div>
              <LessonDiagramSVG kind={lesson.diagramKind} />
              <p className="text-xs text-[#94A3B8]">{lesson.diagramCaption}</p>
            </section>

            {/* 4) Diccionario de variables */}
            <section className="space-y-2.5">
              <div className="text-xs font-semibold text-[#94A3B8]">
                4. Significado de variables y unidades SI
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lesson.variables.map((v, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-[#091120] border border-[#1E314A] p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#38BDF8] font-semibold">
                        <MathBlock latex={v.symbol} />
                      </span>
                      <span className="font-mono-num text-[#2DD4BF]">{v.unit}</span>
                    </div>
                    <div className="font-semibold text-[#F1F5F9]">{v.name}</div>
                    <div className="text-[#94A3B8]">{v.meaning}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 5 & 6) Hipótesis y Fórmula simbólica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="rounded-xl bg-[#091120] border border-[#1E314A] p-4 space-y-2">
                <div className="text-xs font-semibold text-[#94A3B8]">
                  5. Hipótesis de validez
                </div>
                <ul className="text-xs text-[#CBD5E1] space-y-1.5 list-disc list-inside leading-relaxed">
                  {lesson.hypotheses.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </section>

              <PedagogicBlock kind="formula" title="6. Expresión matemática">
                <div className="text-[#F1F5F9] py-1">
                  <MathBlock latex={lesson.formulaLatex} display />
                </div>
              </PedagogicBlock>
            </div>

            {/* 7 & 8) Ejemplo resuelto e interpretación */}
            <section className="rounded-xl bg-[#091120] border border-[#1E314A] p-5 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-xs font-semibold text-[#2DD4BF]">
                  7. Sustitución paso a paso: {lesson.workedExample.title}
                </div>
                <span className="font-mono-num text-xs font-bold text-[#F59E0B]">
                  Resultado esperado: {lesson.workedExample.result}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">Datos: {lesson.workedExample.givens}</p>
              <ol className="text-xs text-[#F1F5F9] font-mono-num space-y-1.5 list-decimal list-inside">
                {lesson.workedExample.steps.map((st, idx) => (
                  <li key={idx}>{st}</li>
                ))}
              </ol>
              <div className="pt-3 border-t border-[#1E314A] text-xs text-[#CBD5E1] leading-relaxed">
                <strong className="text-[#2DD4BF]">8. Interpretación física: </strong>
                {lesson.workedExample.interpretation}
              </div>
            </section>

            {/* 9) Error típico */}
            <PedagogicBlock kind="mistake" title={`9. Error común: ${lesson.typicalError.mistake}`}>
              <p className="text-xs text-[#CBD5E1]">Por qué falla: {lesson.typicalError.whyWrong}</p>
              <p className="text-xs text-[#2DD4BF] mt-1 font-medium">
                Cómo evitarlo: {lesson.typicalError.correction}
              </p>
            </PedagogicBlock>

            {/* 10) Autoevaluación rápida */}
            <section className="rounded-xl bg-[#0B1322] border border-[#1E314A] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[#38BDF8] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  10. Comprueba lo aprendido
                </div>
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="inline-flex items-center gap-1 text-xs text-[#F59E0B] hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showHint ? 'Ocultar pista' : 'Ver pista'}
                </button>
              </div>

              <p className="text-sm text-[#F1F5F9] font-medium">{lesson.practiceCheck.prompt}</p>

              {showHint && (
                <p className="text-xs text-[#FCD34D] bg-[#1E170F] border border-[#F59E0B]/35 rounded-lg px-3 py-2">
                  Pista: {lesson.practiceCheck.hint}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {lesson.practiceCheck.options.map((opt, idx) => {
                  const picked = selectedOption === idx;
                  const isCorrect = idx === lesson.practiceCheck.correctIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedOption(idx)}
                      className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        picked
                          ? isCorrect
                            ? 'bg-[#2DD4BF]/15 border-[#2DD4BF] text-[#F1F5F9]'
                            : 'bg-[#F87171]/15 border-[#F87171] text-[#F1F5F9]'
                          : 'bg-[#070D18] border-[#1E314A] text-[#CBD5E1] hover:border-[#38BDF8]/60 hover:text-[#F1F5F9]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selectedOption !== null && (
                <div
                  role="status"
                  className={`text-xs rounded-lg px-3.5 py-2.5 border ${
                    selectedOption === lesson.practiceCheck.correctIndex
                      ? 'bg-[#2DD4BF]/10 border-[#2DD4BF]/40 text-[#2DD4BF]'
                      : 'bg-[#F87171]/10 border-[#F87171]/40 text-[#FCA5A5]'
                  }`}
                >
                  {selectedOption === lesson.practiceCheck.correctIndex
                    ? `● Correcto: ${lesson.practiceCheck.feedbackCorrect}`
                    : `✖ Revisa tu análisis: ${lesson.practiceCheck.feedbackIncorrect}`}
                </div>
              )}
            </section>
          </div>

          {/* Laboratorio rápido de Primera Ley en Sistema Cerrado (MEC110_3-4) */}
          <div className="rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F1F5F9]">
                <SlidersHorizontal className="w-4 h-4 text-[#2DD4BF]" aria-hidden="true" />
                Calculadora interactiva MEC110_3–4 · Gas ideal en cilindro-pistón
              </div>
              <button
                type="button"
                onClick={() => setShowQuickLab((s) => !s)}
                className="text-xs font-semibold text-[#38BDF8] hover:text-[#F1F5F9] cursor-pointer"
              >
                {showQuickLab ? 'Ocultar calculadora' : 'Prueba cambiando parámetros'}
              </button>
            </div>

            {showQuickLab && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#1E314A] text-xs">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(['isobaric', 'isochoric', 'isothermal', 'polytropic'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProcType(p)}
                        className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                          procType === p
                            ? 'bg-[#38BDF8] text-[#070D18] border-[#38BDF8] font-semibold'
                            : 'bg-[#091120] text-[#94A3B8] border-[#1E314A]'
                        }`}
                      >
                        {p === 'isobaric'
                          ? 'Isobárico'
                          : p === 'isochoric'
                            ? 'Isocórico'
                            : p === 'isothermal'
                              ? 'Isotérmico'
                              : 'Politrópico'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <NumField label="Masa m [kg]" val={mKg} onChange={setMKg} step={0.1} />
                    <NumField label="p1 [kPa]" val={p1KPa} onChange={setP1KPa} step={10} />
                    <NumField label="V1 [m³]" val={V1M3} onChange={setV1M3} step={0.05} />
                    <NumField label="V2 [m³]" val={V2M3} onChange={setV2M3} step={0.05} />
                    <NumField label="T1 [°C]" val={T1C} onChange={setT1C} step={5} />
                    {procType === 'polytropic' && (
                      <NumField label="Exponente n" val={nPoly} onChange={setNPoly} step={0.05} />
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-[#070D18] border border-[#1E314A] p-4 space-y-2">
                  {quickLabResult.ok ? (
                    <>
                      <div className="font-semibold text-[#2DD4BF]">Balance en vivo (Aire estándar)</div>
                      <div className="font-mono-num text-[#F1F5F9] grid grid-cols-2 gap-2">
                        <span>T₂ = {formatCL(quickLabResult.value.T2K, 2)} K</span>
                        <span>p₂ = {formatCL(quickLabResult.value.p2KPa, 1)} kPa</span>
                        <span>W_b = {formatCL(quickLabResult.value.WbKJ, 2)} kJ</span>
                        <span>ΔU = {formatCL(quickLabResult.value.deltaUKJ, 2)} kJ</span>
                        <span className="text-[#F59E0B] font-semibold">
                          Q = {formatCL(quickLabResult.value.QKJ, 2)} kJ
                        </span>
                        <span>ΔS = {formatCL(quickLabResult.value.deltaSKJK, 4)} kJ/K</span>
                      </div>
                      {quickLabResult.value.audit.warnings[0] && (
                        <p className="text-[#F59E0B] pt-1">{quickLabResult.value.audit.warnings[0]}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-[#F87171]">{quickLabResult.error.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

const NumField: React.FC<{
  label: string;
  val: number;
  step: number;
  onChange: (n: number) => void;
}> = ({ label, val, step, onChange }) => (
  <label className="block space-y-1">
    <span className="text-[#94A3B8]">{label}</span>
    <input
      type="number"
      step={step}
      value={val}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full bg-[#070D18] border border-[#1E314A] rounded-lg px-2.5 py-1.5 font-mono-num text-[#F1F5F9] focus:border-[#38BDF8]"
    />
  </label>
);

const LessonDiagramSVG: React.FC<{ kind: LessonItem['diagramKind'] }> = ({ kind }) => (
  <svg
    viewBox="0 0 560 120"
    role="img"
    aria-label={`Esquema conceptual ${kind}`}
    className="w-full h-28 bg-[#070D18] rounded-xl border border-[#1E314A]"
  >
    {kind === 'system-boundary' && (
      <>
        <rect x="170" y="20" width="220" height="80" rx="8" fill="#14223B" stroke="#38BDF8" strokeDasharray="5 3" strokeWidth="2" />
        <text x="280" y="55" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">Frontera del Volumen de Control</text>
        <text x="280" y="73" textAnchor="middle" fill="#2DD4BF" fontSize="10">Masa entra/sale · Q y W cruzan</text>
        <line x1="70" y1="60" x2="170" y2="60" stroke="#2DD4BF" strokeWidth="2.5" className="ft-flow-dash" />
        <line x1="390" y1="60" x2="490" y2="60" stroke="#2DD4BF" strokeWidth="2.5" className="ft-flow-dash" />
      </>
    )}
    {kind === 'phase-dome' && (
      <>
        <path d="M 130 98 Q 280 8 430 98" fill="none" stroke="#2DD4BF" strokeWidth="2.5" />
        <circle cx="280" cy="30" r="4" fill="#F59E0B" />
        <text x="280" y="20" textAnchor="middle" fill="#F59E0B" fontSize="10">Punto crítico</text>
        <line x1="110" y1="75" x2="460" y2="75" stroke="#38BDF8" strokeDasharray="3 3" strokeWidth="1.5" />
        <text x="280" y="90" textAnchor="middle" fill="#94A3B8" fontSize="10">Zona bifásica (0 ≤ x ≤ 1)</text>
      </>
    )}
    {kind === 'flow-device' && (
      <>
        <polygon points="180,25 380,42 380,78 180,95" fill="#14223B" stroke="#38BDF8" strokeWidth="2" />
        <text x="280" y="64" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">Equipo estacionario (Tobera / Turbina)</text>
        <line x1="90" y1="60" x2="180" y2="60" stroke="#2DD4BF" strokeWidth="2.5" className="ft-flow-dash" />
        <line x1="380" y1="60" x2="470" y2="60" stroke="#F59E0B" strokeWidth="2.5" className="ft-flow-dash" />
      </>
    )}
    {kind !== 'system-boundary' && kind !== 'phase-dome' && kind !== 'flow-device' && (
      <>
        <rect x="90" y="24" width="140" height="72" rx="6" fill="#14223B" stroke="#F59E0B" strokeWidth="2" />
        <text x="160" y="64" textAnchor="middle" fill="#F1F5F9" fontSize="11">Estado 1 / Fuente</text>
        <line x1="230" y1="60" x2="330" y2="60" stroke="#2DD4BF" strokeWidth="2.5" className="ft-flow-dash" />
        <rect x="330" y="24" width="140" height="72" rx="6" fill="#14223B" stroke="#38BDF8" strokeWidth="2" />
        <text x="400" y="64" textAnchor="middle" fill="#F1F5F9" fontSize="11">Estado 2 / Proceso</text>
      </>
    )}
  </svg>
);
