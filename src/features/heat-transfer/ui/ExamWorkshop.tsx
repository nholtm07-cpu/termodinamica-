import React, { useState } from 'react';
import { BookOpen, CheckCircle2, HelpCircle, Play, Sparkles, X } from 'lucide-react';
import { BOOK_CASE_DEFINITIONS } from '../data/book-presets';
import type { HeatCaseId, HeatEvaluation, LearningMode, Parameter } from '../domain/models';
import { formatHT } from '../domain/units';
import type { HeatExchangerFlowMode } from '../domain/cases/C05';
import { MetricTile, PedagogicBlock } from '../../../components/ui/LabPrimitives';
import { HeatCoursePage } from './HeatCoursePage';
import { ParameterPanel } from './ParameterPanel';
import { ProfessorBoard } from './ProfessorBoard';
import { TechnicalDiagram } from './TechnicalDiagram';

interface ExamWorkshopProps {
  activeCaseId: HeatCaseId;
  onSelectCase: (caseId: HeatCaseId) => void;
  mode: LearningMode;
  onChangeMode: (mode: LearningMode) => void;
  inputs: Record<string, Parameter>;
  evaluation: HeatEvaluation;
  flowMode: HeatExchangerFlowMode;
  onChangeFlowMode: (m: HeatExchangerFlowMode) => void;
  onChangeParam: (id: string, value: number) => void;
  onRestoreBook: () => void;
  onOpenLabForCase: (caseId: HeatCaseId) => void;
  onMarkCaseSolved: (caseId: HeatCaseId) => void;
  solvedCases: string[];
}

const CASE_ORDER: HeatCaseId[] = ['TC-C01', 'TC-C02', 'TC-C03', 'TC-C04', 'TC-C05'];

const CASE_DURATION: Record<HeatCaseId, string> = {
  'TC-C01': '~10 min',
  'TC-C02': '~12 min',
  'TC-C03': '~18 min',
  'TC-C04': '~15 min',
  'TC-C05': '~20 min',
};

const ONE_CHANGE_CHALLENGES: Record<
  HeatCaseId,
  { label: string; field: string; value: number; prompt: string }
> = {
  'TC-C01': {
    label: 'Probar variación L = 0,30 m',
    field: 'L',
    value: 0.3,
    prompt: 'Si aumentamos el espesor del hormigón de 0,25 m a 0,30 m, Q̇ cae a 1.408 W y el costo a 1,1264 USD.',
  },
  'TC-C02': {
    label: 'Probar variación h = 10 W/(m²·K)',
    field: 'h',
    value: 10,
    prompt: 'Al subir h de 6 a 10 W/(m²·K), Q̇_conv sube a 144 W pero Q̇_rad permanece inalterada (≈ 81,84 W).',
  },
  'TC-C03': {
    label: 'Probar variación L_aire = 20 mm',
    field: 'Lairmm',
    value: 20,
    prompt: 'Ampliar la cámara a 20 mm reduce Q̇ a ≈ 39,80 W en conducción pura, pero activa alerta de convección natural.',
  },
  'TC-C04': {
    label: 'Probar variación D = 2 mm',
    field: 'Dmm',
    value: 2,
    prompt: 'Duplicar el diámetro a 2 mm duplica Bi (0,002) y el tiempo t₉₉ (≈ 19,88 s). Prueba luego D = 120 mm para ver el bloqueo Bi ≥ 0,1.',
  },
  'TC-C05': {
    label: 'Probar variación U = 800 W/(m²·K)',
    field: 'U',
    value: 800,
    prompt: 'Subir U a 800 W/(m²·K) mantiene idénticos Q̇ = 300,96 kW y T_h,sal, pero reduce L de 108,50 m a ≈ 86,80 m.',
  },
};

export const ExamWorkshop: React.FC<ExamWorkshopProps> = ({
  activeCaseId,
  onSelectCase,
  mode,
  onChangeMode,
  inputs,
  evaluation,
  flowMode,
  onChangeFlowMode,
  onChangeParam,
  onRestoreBook,
  onOpenLabForCase,
  onMarkCaseSolved,
  solvedCases,
}) => {
  const [theoryDrawerOpen, setTheoryDrawerOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(
    BOOK_CASE_DEFINITIONS[activeCaseId].relatedLessonIds[0] ?? 'HT-01'
  );
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [checkResults, setCheckResults] = useState<
    Record<string, { correct: boolean; message: string; showHint?: boolean }>
  >({});

  const def = BOOK_CASE_DEFINITIONS[activeCaseId];
  const challenge = ONE_CHANGE_CHALLENGES[activeCaseId];

  const handleCheckQuestion = (
    qId: string,
    expected: number,
    tolRel: number,
    unit: string,
    hint: string,
    explanation: string
  ) => {
    const raw = (studentAnswers[qId] ?? '').trim().replace(',', '.');
    const parsed = Number(raw);
    if (!raw || !Number.isFinite(parsed)) {
      setCheckResults((prev) => ({
        ...prev,
        [qId]: {
          correct: false,
          showHint: true,
          message: `Ingresa un número válido en ${unit}. Pista: ${hint}`,
        },
      }));
      return;
    }
    const tol = Math.max(1e-4, Math.abs(expected) * tolRel);
    const ok = Math.abs(parsed - expected) <= tol;
    if (ok) {
      setCheckResults((prev) => ({
        ...prev,
        [qId]: {
          correct: true,
          message: `Correcto (${unit}). ${explanation}`,
        },
      }));
      const allOthersOk = evaluation.workshopQuestions.every(
        (q) => q.id === qId || checkResults[q.id]?.correct
      );
      if (allOthersOk) onMarkCaseSolved(activeCaseId);
    } else {
      const ratio = expected !== 0 ? parsed / expected : 0;
      let diag = 'Revisa el despeje o la sustitución numérica.';
      if (Math.abs(ratio - 1000) < 5 || Math.abs(ratio - 0.001) < 0.0005) {
        diag = 'Posible error de prefijo SI (factor 1000: mm↔m, kW↔W o kJ↔J).';
      } else if (parsed * expected < 0) {
        diag = 'Posible error de signo en ΔT = T_caliente − T_fría.';
      }
      setCheckResults((prev) => ({
        ...prev,
        [qId]: {
          correct: false,
          showHint: true,
          message: `Valor fuera de tolerancia (${diag}) Pista: ${hint}`,
        },
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector progresivo de los 5 casos */}
      <section aria-label="Cinco casos progresivos de certamen" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {CASE_ORDER.map((cid, idx) => {
          const cDef = BOOK_CASE_DEFINITIONS[cid];
          const active = cid === activeCaseId;
          const solved = solvedCases.includes(cid);
          return (
            <button
              key={cid}
              type="button"
              onClick={() => {
                onSelectCase(cid);
                setSelectedLessonId(cDef.relatedLessonIds[0] ?? 'HT-01');
              }}
              aria-current={active ? 'step' : undefined}
              className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                active
                  ? 'bg-[#14223B] border-[#38BDF8]/80 text-[#F1F5F9]'
                  : 'bg-[#0F1A2E] border-[#1E314A] text-[#94A3B8] hover:border-[#2C4668] hover:text-[#F1F5F9]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-mono-num font-bold text-[#F59E0B]">
                  {idx + 1}. {cid} · Dif. {cDef.difficulty}/5
                </span>
                {solved && <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" aria-label="Caso aprobado" />}
              </div>
              <div className="text-xs font-semibold text-[#F1F5F9] leading-snug">
                {cDef.shortName}
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                {cDef.source.exampleId} ({cDef.source.printedPages}) · {CASE_DURATION[cid]}
              </div>
            </button>
          );
        })}
      </section>

      {/* Barra de modos pedagógicos + botón de teoría lateral */}
      <section className="ft-panel p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-[#2DD4BF]">
            {def.source.author}, <em>{def.source.title}</em> ({def.source.edition} ed.), Cap. {def.source.chapter}, {def.source.exampleId} · {def.source.printedPages} / {def.source.pdfPages} · {CASE_DURATION[activeCaseId]}
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#F1F5F9]">
            {activeCaseId}: {def.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Modo de estudio del taller" className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#091120] border border-[#1E314A] rounded-lg">
            {(
              [
                { id: 'desde-cero', label: 'Desde cero' },
                { id: 'guiado', label: 'Guiado' },
                { id: 'certamen', label: 'Certamen' },
              ] as Array<{ id: LearningMode; label: string }>
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => onChangeMode(m.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === m.id
                    ? 'bg-[#38BDF8] text-[#070D18]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onOpenLabForCase(activeCaseId)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#2DD4BF]/60 bg-[#091120] text-[#2DD4BF] hover:bg-[#2DD4BF] hover:text-[#070D18] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            Explorar simulador
          </button>

          <button
            type="button"
            onClick={() => setTheoryDrawerOpen((o) => !o)}
            aria-expanded={theoryDrawerOpen}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#091120] text-[#F1F5F9] hover:border-[#38BDF8] transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            {theoryDrawerOpen ? 'Cerrar teoría lateral' : 'Teoría al costado'}
          </button>
        </div>
      </section>

      {/* Layout principal con panel lateral opcional de teoría */}
      <div className={`grid grid-cols-1 ${theoryDrawerOpen ? 'xl:grid-cols-12' : ''} gap-6 items-start`}>
        <div className={theoryDrawerOpen ? 'xl:col-span-8 space-y-6' : 'space-y-6'}>
          {/* Enunciado y supuestos */}
          <section className="ft-panel p-5 sm:p-6 space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#F59E0B]">
                Enunciado de elaboración propia (con datos base del libro)
              </div>
              <p className="text-sm text-[#F1F5F9] leading-relaxed">{def.premise}</p>
            </div>

            {mode === 'desde-cero' && (
              <PedagogicBlock kind="concept" title="Guía para empezar desde cero">
                1) Identifica en el esquema inferior qué temperaturas y dimensiones conocemos. 2) Convierte mm, cm o °C a unidades SI antes de sustituir. 3) Verifica el resultado físico y comprueba qué ocurre al modificar un parámetro.
              </PedagogicBlock>
            )}

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#94A3B8]">Hipótesis declaradas del modelo</div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#CBD5E1]">
                {def.assumptions.map((a, idx) => (
                  <li key={idx} className="ft-well px-3.5 py-2.5">
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            {/* Desafío rápido de un solo cambio */}
            <div className="ft-well p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#CBD5E1] max-w-2xl">
                <strong className="text-[#2DD4BF]">Práctica de variación controlada:</strong> {challenge.prompt}
              </div>
              <button
                type="button"
                onClick={() => onChangeParam(challenge.field, challenge.value)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14223B] border border-[#2DD4BF]/55 text-[#2DD4BF] hover:bg-[#2DD4BF] hover:text-[#070D18] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                {challenge.label}
              </button>
            </div>
          </section>

          {/* Esquema + Parámetros editables */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <TechnicalDiagram evaluation={evaluation} />

              {mode !== 'certamen' && evaluation.primaryMetrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {evaluation.primaryMetrics.map((m) => (
                    <MetricTile
                      key={m.id}
                      label={m.label}
                      value={m.value}
                      unit={m.unit}
                      baseline={m.bookReference && evaluation.isModifiedFromBook ? m.bookReference : undefined}
                      tone="cyan"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <ParameterPanel
                caseId={activeCaseId}
                inputs={inputs}
                modifiedFields={evaluation.modifiedFields}
                onChangeParam={onChangeParam}
                onRestoreBook={onRestoreBook}
                extraControls={
                  activeCaseId === 'TC-C05' ? (
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#F1F5F9]">Arreglo de flujo:</span>
                      <div className="flex gap-1">
                        {(['counterflow', 'parallel'] as HeatExchangerFlowMode[]).map((fm) => (
                          <button
                            key={fm}
                            type="button"
                            onClick={() => onChangeFlowMode(fm)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer ${
                              flowMode === fm
                                ? 'bg-[#38BDF8] text-[#070D18] border-[#38BDF8]'
                                : 'bg-[#0F1A2E] text-[#94A3B8] border-[#1E314A]'
                            }`}
                          >
                            {fm === 'counterflow' ? 'Contraflujo (libro)' : 'Paralelo'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : undefined
                }
              />
            </div>
          </div>

          {/* Comprobador de pasos para el estudiante */}
          {evaluation.workshopQuestions.length > 0 && (
            <section
              aria-label="Comprobador de pasos del estudiante"
              className="ft-panel p-5 sm:p-6 space-y-4"
            >
              <div>
                <h3 className="font-display text-base font-bold text-[#F1F5F9]">
                  Comprobar tus propios cálculos antes de mirar la pizarra
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Evalúa tus subresultados con tolerancia numérica y diagnóstico de unidades SI (los valores esperados acompañan dinámicamente cualquier parámetro que modifiques).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {evaluation.workshopQuestions.map((q, idx) => {
                  const res = checkResults[q.id];
                  return (
                    <div key={q.id} className="ft-well p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <label htmlFor={`wq-${q.id}`} className="font-semibold text-[#F1F5F9] leading-snug">
                          {idx + 1}. {q.prompt}
                        </label>
                        <span className="font-mono-num text-[#2DD4BF] shrink-0">{q.targetUnit}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id={`wq-${q.id}`}
                          type="text"
                          inputMode="decimal"
                          placeholder={`Valor en ${q.targetUnit}`}
                          value={studentAnswers[q.id] ?? ''}
                          onChange={(e) =>
                            setStudentAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="flex-1 px-3 py-1.5 text-xs font-mono-num bg-[#0F1A2E] border border-[#1E314A] rounded-lg text-[#F1F5F9] focus:border-[#38BDF8]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleCheckQuestion(
                              q.id,
                              q.expectedValue,
                              q.toleranceRel,
                              q.targetUnit,
                              q.hint,
                              q.explanation
                            )
                          }
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#38BDF8] text-[#070D18] hover:bg-[#67D2FB] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Comprobar este paso
                        </button>
                      </div>

                      {res ? (
                        <div
                          role="status"
                          className={`text-xs leading-relaxed ${
                            res.correct ? 'text-[#2DD4BF]' : 'text-[#F59E0B]'
                          }`}
                        >
                          {res.message}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setCheckResults((prev) => ({
                              ...prev,
                              [q.id]: {
                                correct: false,
                                showHint: true,
                                message: `Pista: ${q.hint} (Ejemplo base ≈ ${formatHT(q.expectedValue, 3)} solo si usas datos del libro — ¡inténtalo primero!).`,
                              },
                            }))
                          }
                          className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#38BDF8] cursor-pointer"
                        >
                          <HelpCircle className="w-3 h-3" aria-hidden="true" />
                          Pedir pista gradual
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Pizarra del Profesor */}
          <ProfessorBoard
            key={`${activeCaseId}-${mode}`}
            evaluation={evaluation}
            revealAllInitially={mode !== 'certamen'}
            certamenMode={mode === 'certamen'}
          />
        </div>

        {/* Panel lateral contextual de teoría */}
        {theoryDrawerOpen && (
          <aside
            aria-label="Teoría contextual al costado"
            className="xl:col-span-4 ft-panel border-[#38BDF8]/45 p-4 space-y-3 xl:sticky xl:top-20 max-h-[82vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#1E314A] pb-2.5">
              <h3 className="font-display text-sm font-bold text-[#F1F5F9]">
                Teoría de apoyo contextual
              </h3>
              <button
                type="button"
                aria-label="Cerrar panel de teoría"
                onClick={() => setTheoryDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#14223B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <HeatCoursePage
              selectedLessonId={selectedLessonId}
              onSelectLesson={setSelectedLessonId}
              completedLessons={[]}
              onToggleComplete={() => {}}
              onOpenCaseInWorkshop={() => {}}
              compactDrawer
            />
          </aside>
        )}
      </div>
    </div>
  );
};
