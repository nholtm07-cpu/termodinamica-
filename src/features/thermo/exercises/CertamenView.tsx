import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, HelpCircle, SlidersHorizontal, Trash2 } from 'lucide-react';
import { EXERCISE_BANK, type ExerciseItem } from '../../../content/mec110/exercises';
import type { LocalProgressSnapshot } from '../../../core/contracts';
import { formatCL } from '../../../core/thermo/units';
import { ModuleHero, PedagogicBlock } from '../../../components/ui/LabPrimitives';

interface CertamenViewProps {
  progress: LocalProgressSnapshot;
  onRecordAttempt: (
    ex: ExerciseItem,
    correct: boolean,
    mistakeDetail?: { type: string; detail: string }
  ) => void;
  onClearNotebook: () => void;
  onOpenSimulatorTab: (tab: 'sim-boltzmann' | 'sim-carnot' | 'sim-brayton' | 'sim-rankine') => void;
}

const COMPETENCY_NAMES: Record<'A' | 'B' | 'C' | 'D' | 'E', string> = {
  A: 'Sistema y frontera',
  B: 'Unidades SI / K',
  C: 'Estados e IF97',
  D: 'Balances 1ª y 2ª Ley',
  E: 'Auditoría de supuestos',
};

export const CertamenView: React.FC<CertamenViewProps> = ({
  progress,
  onRecordAttempt,
  onClearNotebook,
  onOpenSimulatorTab,
}) => {
  const [mode, setMode] = useState<'learning' | 'exam'>('learning');
  const [originFilter, setOriginFilter] = useState<'ALL' | ExerciseItem['originType']>('ALL');
  const [selectedId, setSelectedId] = useState<string>(EXERCISE_BANK[0].id);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
    remedy?: string;
  } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(15 * 60);

  useEffect(() => {
    if (mode !== 'exam') return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode]);

  const filtered = useMemo(
    () =>
      originFilter === 'ALL'
        ? EXERCISE_BANK
        : EXERCISE_BANK.filter((e) => e.originType === originFilter),
    [originFilter]
  );

  const exercise = useMemo(
    () => filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? EXERCISE_BANK[0],
    [filtered, selectedId]
  );

  const selectExercise = (id: string) => {
    setSelectedId(id);
    setAnswerInput('');
    setHintsRevealed(0);
    setFeedback(null);
  };

  const evaluateAnswer = () => {
    const normalized = Number(answerInput.trim().replace(',', '.'));
    if (!Number.isFinite(normalized)) {
      setFeedback({
        correct: false,
        message: 'Ingresa un número válido (puedes usar coma o punto decimal).',
      });
      return;
    }

    const expected = exercise.expectedValue;
    const relErr =
      Math.abs(expected) > 1e-9
        ? Math.abs(normalized - expected) / Math.abs(expected)
        : Math.abs(normalized - expected);

    const pctVariantOk =
      exercise.acceptedPercentageVariant &&
      Math.abs(normalized / 100 - expected) / Math.max(1e-6, Math.abs(expected)) <=
        exercise.toleranceRelative;

    if (relErr <= exercise.toleranceRelative || pctVariantOk) {
      setFeedback({
        correct: true,
        message: `● Respuesta correcta (${formatCL(normalized, 4)} ${exercise.targetUnit}). Tolerancia ±${formatCL(exercise.toleranceRelative * 100, 1)} % cumplida.`,
      });
      onRecordAttempt(exercise, true);
      return;
    }

    const matchedMistake = exercise.commonMistakeChecks.find(
      (chk) => normalized >= chk.detectRange[0] && normalized <= chk.detectRange[1]
    );

    const msg = matchedMistake
      ? matchedMistake.diagnosis
      : `Tu valor (${formatCL(normalized, 4)} ${exercise.targetUnit}) difiere del esperado (${formatCL(expected, 4)} ${exercise.targetUnit}). Revisa unidades, escala Kelvin e hipótesis.`;
    const rem = matchedMistake
      ? matchedMistake.remedy
      : `Pista clave: ${exercise.hints[Math.min(2, hintsRevealed)]}`;

    setFeedback({ correct: false, message: msg, remedy: rem });
    onRecordAttempt(exercise, false, {
      type: matchedMistake ? 'Error conceptual / unidades' : 'Desvío numérico',
      detail: `${exercise.id}: ingresaste ${formatCL(normalized, 3)} ${exercise.targetUnit}. ${msg}`,
    });
  };

  const solvedCount = Object.values(progress.solvedExercises).filter((s) => s.correct).length;
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const progressPct = Math.round((solvedCount / EXERCISE_BANK.length) * 100);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="MEC110 · Centro de Entrenamiento para Certámenes"
        title="Banco de Problemas, Diagnóstico Dimensional y Cuaderno de Errores"
        subtitle={`Avance guardado localmente: ${solvedCount} de ${EXERCISE_BANK.length} problemas aprobados (${progressPct} %).`}
        accent="amber"
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('learning')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'learning'
                  ? 'bg-[#2DD4BF] text-[#070D18] border-[#2DD4BF]'
                  : 'bg-[#091120] text-[#94A3B8] border-[#1E314A] hover:text-[#F1F5F9]'
              }`}
            >
              Modo aprendizaje
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('exam');
                setSecondsLeft(15 * 60);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'exam'
                  ? 'bg-[#F59E0B] text-[#070D18] border-[#F59E0B]'
                  : 'bg-[#091120] text-[#94A3B8] border-[#1E314A] hover:text-[#F1F5F9]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Modo certamen {mode === 'exam' ? `(${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')})` : ''}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="h-1.5 w-full rounded-full bg-[#14223B] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Filtros de origen */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#94A3B8]">Origen:</span>
            {(
              [
                { id: 'ALL', label: `Todos (${EXERCISE_BANK.length})` },
                { id: 'lecture', label: 'Casos de cátedra' },
                { id: 'original', label: 'Originales FluidoTermo' },
                { id: 'book-inspired', label: 'Basados en temas Çengel' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setOriginFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  originFilter === f.id
                    ? 'bg-[#14223B] border-[#38BDF8] text-[#F1F5F9] font-semibold'
                    : 'bg-[#091120] border-[#1E314A] text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </ModuleHero>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista de problemas */}
        <aside className="lg:col-span-4 rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-3.5 space-y-1.5 max-h-[680px] overflow-y-auto">
          {filtered.map((item) => {
            const st = progress.solvedExercises[item.id];
            const active = item.id === exercise.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectExercise(item.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                  active
                    ? 'bg-[#14223B] border-[#38BDF8] text-[#F1F5F9]'
                    : 'bg-[#091120] border-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#1E314A]'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-mono-num text-[11px] text-[#38BDF8]">
                    {item.id} · {item.level} · ~15 min
                  </div>
                  <div className="text-xs font-semibold leading-snug">{item.title}</div>
                  <div className="text-[11px] text-[#64748B]">{item.originLabel}</div>
                </div>
                {st?.correct && (
                  <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" aria-label="Resuelto" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Área de resolución */}
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-5 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1E314A] pb-4">
              <div>
                <div className="text-xs text-[#94A3B8] font-mono-num">
                  {exercise.unit} · {exercise.originLabel} · Lección {exercise.lessonId} · Tiempo est. 15 min
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#F1F5F9] mt-1">
                  {exercise.id}: {exercise.title}
                </h2>
              </div>
              {exercise.simulatorLink && (
                <button
                  type="button"
                  onClick={() => onOpenSimulatorTab(exercise.simulatorLink!.tab)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#2DD4BF]/40 bg-[#0A1924] text-[#2DD4BF] hover:bg-[#2DD4BF] hover:text-[#070D18] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  Probar con parámetros nuevos
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <p className="text-sm sm:text-base text-[#F1F5F9] leading-relaxed">{exercise.question}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-[#091120] border border-[#1E314A] p-4 space-y-1.5">
                <div className="font-semibold text-[#38BDF8]">Sistema y datos entregados</div>
                <p className="text-[#94A3B8]">{exercise.physicalSystem}</p>
                <ul className="list-disc list-inside text-[#CBD5E1] space-y-1 pt-1">
                  {exercise.givens.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-[#091120] border border-[#1E314A] p-4 space-y-1.5">
                <div className="font-semibold text-[#2DD4BF]">Hipótesis del modelo</div>
                <ul className="list-disc list-inside text-[#94A3B8] space-y-1">
                  {exercise.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-[#1E314A] text-[11px] text-[#94A3B8]">
                  Conceptos: {exercise.competencies.map((c) => COMPETENCY_NAMES[c]).join(' · ')}
                </div>
              </div>
            </div>

            {/* Ingreso numérico */}
            <div className="rounded-xl bg-[#070D18] border border-[#1E314A] p-4 sm:p-5 space-y-3">
              <label htmlFor="ex-answer" className="block text-xs font-semibold text-[#F1F5F9]">
                Ingresa tu resultado para <span className="font-mono-num text-[#38BDF8]">{exercise.targetVariable}</span> [{exercise.targetUnit}]
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  id="ex-answer"
                  type="text"
                  inputMode="decimal"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') evaluateAnswer();
                  }}
                  placeholder={`Ej. ${formatCL(exercise.expectedValue, 2)}`}
                  className="flex-1 min-w-[180px] bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-3.5 py-2 text-sm font-mono-num text-[#F1F5F9] focus:border-[#38BDF8]"
                />
                <span className="text-xs font-mono-num text-[#94A3B8]">{exercise.targetUnit}</span>
                <button
                  type="button"
                  onClick={evaluateAnswer}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#38BDF8] text-[#070D18] hover:bg-[#60CEFA] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Verificar respuesta
                </button>
              </div>

              {feedback && (
                <div
                  role="status"
                  className={`rounded-lg px-4 py-3 text-xs border space-y-1 ${
                    feedback.correct
                      ? 'bg-[#2DD4BF]/10 border-[#2DD4BF]/40 text-[#2DD4BF]'
                      : 'bg-[#F87171]/10 border-[#F87171]/40 text-[#FCA5A5]'
                  }`}
                >
                  <div className="font-semibold">{feedback.message}</div>
                  {feedback.remedy && <div className="text-[#F1F5F9]">{feedback.remedy}</div>}
                </div>
              )}
            </div>

            {/* Pistas graduales */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#F59E0B] flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  Resolver paso a paso — Pistas ({hintsRevealed} / {exercise.hints.length})
                </span>
                {hintsRevealed < exercise.hints.length && (
                  <button
                    type="button"
                    onClick={() => setHintsRevealed((h) => Math.min(exercise.hints.length, h + 1))}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[#F59E0B]/40 bg-[#1E170F] text-[#FCD34D] hover:bg-[#F59E0B]/20 transition-colors cursor-pointer"
                  >
                    {hintsRevealed === 0 ? 'Resolver paso a paso (Pista 1)' : `Mostrar pista ${hintsRevealed + 1}`}
                  </button>
                )}
              </div>

              {hintsRevealed > 0 && (
                <ol className="space-y-1.5 text-xs list-decimal list-inside bg-[#091120] border border-[#1E314A] rounded-xl p-4 text-[#CBD5E1] leading-relaxed">
                  {exercise.hints.slice(0, hintsRevealed).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Cuaderno de errores */}
          <div className="rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#F1F5F9]">
                Cuaderno de errores ({progress.errorNotebook.length})
              </h3>
              {progress.errorNotebook.length > 0 && (
                <button
                  type="button"
                  onClick={onClearNotebook}
                  className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#F87171] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar historial
                </button>
              )}
            </div>
            {progress.errorNotebook.length === 0 ? (
              <PedagogicBlock kind="dimensional" title="Sin errores registrados">
                Cada intento con error conceptual o de unidades se archiva aquí con su corrección para repasar antes de una evaluación.
              </PedagogicBlock>
            ) : (
              <ul className="space-y-2 text-xs max-h-48 overflow-y-auto">
                {progress.errorNotebook.slice(0, 12).map((err) => (
                  <li
                    key={err.id}
                    className="bg-[#091120] border border-[#F87171]/30 rounded-lg px-3.5 py-2.5 space-y-0.5"
                  >
                    <div className="font-semibold text-[#F59E0B]">{err.mistakeType}</div>
                    <div className="text-[#CBD5E1]">{err.detail}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
