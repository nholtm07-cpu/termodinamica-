import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import { MathBlock } from '../../../components/MathBlock';
import { PedagogicBlock } from '../../../components/ui/LabPrimitives';
import { HEAT_LESSONS, type HeatLesson } from '../content/lessons';
import type { HeatCaseId } from '../domain/models';

interface HeatCoursePageProps {
  selectedLessonId: string;
  onSelectLesson: (id: string) => void;
  completedLessons: string[];
  onToggleComplete: (id: string) => void;
  onOpenCaseInWorkshop: (caseId: HeatCaseId) => void;
  compactDrawer?: boolean;
}

export const HeatCoursePage: React.FC<HeatCoursePageProps> = ({
  selectedLessonId,
  onSelectLesson,
  completedLessons,
  onToggleComplete,
  onOpenCaseInWorkshop,
  compactDrawer = false,
}) => {
  const activeLesson: HeatLesson =
    HEAT_LESSONS.find((l) => l.id === selectedLessonId) ?? HEAT_LESSONS[0];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showDerivation, setShowDerivation] = useState(true);

  const chosenIdx = selectedAnswers[activeLesson.id];
  const isCompleted = completedLessons.includes(activeLesson.id);

  return (
    <div className={compactDrawer ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'}>
      {/* Índice de lecciones */}
      <nav
        aria-label="Temario de Transferencia de Calor"
        className={
          compactDrawer
            ? 'flex flex-wrap gap-1.5'
            : 'lg:col-span-4 ft-panel p-4 space-y-2'
        }
      >
        {!compactDrawer && (
          <div className="px-2 pb-2.5 border-b border-[#1E314A]">
            <h2 className="font-display text-sm font-bold text-[#F1F5F9]">
              Ruta «Aprender la materia»
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              De cero hasta intercambiadores, métodos numéricos y cambio de fase
            </p>
          </div>
        )}
        {HEAT_LESSONS.map((lesson) => {
          const active = lesson.id === activeLesson.id;
          const done = completedLessons.includes(lesson.id);
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => onSelectLesson(lesson.id)}
              className={
                compactDrawer
                  ? `px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#38BDF8] text-[#070D18] border-[#38BDF8] font-semibold'
                        : 'bg-[#091120] text-[#94A3B8] border-[#1E314A] hover:text-[#F1F5F9]'
                    }`
                  : `w-full text-left px-3 py-2.5 rounded-xl border transition-colors cursor-pointer space-y-1 ${
                      active
                        ? 'bg-[#14223B] border-[#38BDF8]/70 text-[#F1F5F9]'
                        : 'bg-[#091120] border-[#1E314A] text-[#94A3B8] hover:border-[#2C4668] hover:text-[#F1F5F9]'
                    }`
              }
            >
              {compactDrawer ? (
                <span>{lesson.id}</span>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono-num text-[#2DD4BF]">
                      {lesson.id} · {lesson.difficulty}
                    </span>
                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" aria-label="Completada" />}
                  </div>
                  <div className="text-xs font-semibold leading-snug">{lesson.title}</div>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Contenido de lección */}
      <article
        className={
          compactDrawer
            ? 'space-y-4 text-xs'
            : 'lg:col-span-8 ft-panel p-5 sm:p-6 space-y-5'
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1E314A] pb-4">
          <div className="space-y-1">
            <div className="text-xs text-[#2DD4BF] font-medium">
              {activeLesson.id} · {activeLesson.difficulty} · {activeLesson.cengelRef}
            </div>
            <h2 className="font-display text-xl font-bold text-[#F1F5F9]">
              {activeLesson.title}
            </h2>
            <p className="text-xs text-[#94A3B8]">{activeLesson.linkedNote}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!compactDrawer && (
              <button
                type="button"
                onClick={() => onToggleComplete(activeLesson.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  isCompleted
                    ? 'bg-[#0A1A26] border-[#2DD4BF] text-[#2DD4BF]'
                    : 'bg-[#091120] border-[#1E314A] text-[#F1F5F9] hover:border-[#2DD4BF]'
                }`}
              >
                {isCompleted ? 'Lección completada ✓' : 'Marcar como leída'}
              </button>
            )}
            {activeLesson.linkedCase && !compactDrawer && (
              <button
                type="button"
                onClick={() => onOpenCaseInWorkshop(activeLesson.linkedCase!)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#38BDF8] text-[#070D18] hover:bg-[#67D2FB] transition-colors cursor-pointer whitespace-nowrap"
              >
                Practicar {activeLesson.linkedCase}
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Pregunta física inicial */}
        <div className="ft-well p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#38BDF8]">
            <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Pregunta física inicial</span>
          </div>
          <p className="text-sm text-[#F1F5F9] leading-relaxed">{activeLesson.physicalQuestion}</p>
        </div>

        {/* Analogía y distinción clave */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PedagogicBlock kind="concept" title="Explicación intuitiva y analogía">
            {activeLesson.analogy}
          </PedagogicBlock>
          <PedagogicBlock kind="dimensional" title="Distinción clave que evita errores">
            {activeLesson.keyDistinction}
          </PedagogicBlock>
        </div>

        {/* Diccionario de variables de la lección */}
        <div className="space-y-2">
          <h3 className="font-display text-sm font-bold text-[#F1F5F9]">
            Significado de cada símbolo y unidad SI
          </h3>
          <div className="overflow-x-auto border border-[#1E314A] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0B1322] text-[#94A3B8] border-b border-[#1E314A]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Símbolo</th>
                  <th className="py-2.5 px-3 font-semibold">Significado</th>
                  <th className="py-2.5 px-3 font-semibold">Unidad SI</th>
                  <th className="py-2.5 px-3 font-semibold">Observación</th>
                </tr>
              </thead>
              <tbody className="bg-[#091120] divide-y divide-[#1E314A]/60">
                {activeLesson.variables.map((v, i) => (
                  <tr key={i} className="hover:bg-[#14223B]/40">
                    <td className="py-2 px-3 text-[#2DD4BF]">
                      <MathBlock latex={v.symbol} />
                    </td>
                    <td className="py-2 px-3 text-[#F1F5F9] font-medium">{v.name}</td>
                    <td className="py-2 px-3 font-mono-num text-[#F59E0B]">{v.unit}</td>
                    <td className="py-2 px-3 text-[#94A3B8]">{v.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fórmula simbólica y derivación */}
        <div className="ft-well p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-bold text-[#F1F5F9]">
              Modelo matemático y condiciones de aplicación
            </h3>
            <button
              type="button"
              onClick={() => setShowDerivation((s) => !s)}
              className="text-xs font-medium text-[#38BDF8] hover:text-[#67D2FB] cursor-pointer"
            >
              {showDerivation ? 'Ocultar derivación' : 'Ver de dónde sale la fórmula'}
            </button>
          </div>

          <MathBlock latex={activeLesson.formulaLatex} display className="text-sm text-[#2DD4BF]" />

          <ul className="list-disc list-inside text-xs text-[#94A3B8] space-y-1">
            {activeLesson.assumptions.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>

          {showDerivation && (
            <div className="pt-2.5 border-t border-[#1E314A] text-xs text-[#CBD5E1] leading-relaxed">
              <strong className="text-[#38BDF8]">Derivación física:</strong> {activeLesson.derivation}
            </div>
          )}
        </div>

        {/* Ejemplo miniatura y error típico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PedagogicBlock kind="formula" title="Ejemplo numérico rápido">
            <div className="space-y-2">
              <p className="text-xs text-[#94A3B8]">{activeLesson.miniExample.statement}</p>
              <MathBlock
                latex={activeLesson.miniExample.calculationLatex}
                display
                className="text-xs text-[#2DD4BF]"
              />
              <p className="text-xs text-[#F1F5F9]">{activeLesson.miniExample.interpretation}</p>
            </div>
          </PedagogicBlock>

          <PedagogicBlock kind="mistake" title="Error típico de certamen a evitar">
            {activeLesson.commonMistake}
          </PedagogicBlock>
        </div>

        {/* Comprobación rápida interactiva */}
        <div className="ft-well p-4 space-y-3">
          <h3 className="font-display text-sm font-bold text-[#F1F5F9]">
            Comprobación rápida
          </h3>
          <p className="text-xs text-[#F1F5F9] leading-relaxed">{activeLesson.quickCheck.question}</p>
          <div className="flex flex-wrap gap-2">
            {activeLesson.quickCheck.options.map((opt, idx) => {
              const selected = chosenIdx === idx;
              const isRight = idx === activeLesson.quickCheck.correctIndex;
              let cls = 'bg-[#0F1A2E] border-[#1E314A] text-[#F1F5F9] hover:border-[#38BDF8]';
              if (chosenIdx !== undefined) {
                if (isRight) cls = 'bg-[#0A1A26] border-[#2DD4BF] text-[#2DD4BF]';
                else if (selected) cls = 'bg-[#1D1219] border-[#F87171] text-[#F87171]';
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setSelectedAnswers((prev) => ({ ...prev, [activeLesson.id]: idx }))
                  }
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${cls}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {chosenIdx !== undefined && (
            <p
              role="status"
              className={`text-xs leading-relaxed ${
                chosenIdx === activeLesson.quickCheck.correctIndex
                  ? 'text-[#2DD4BF]'
                  : 'text-[#F59E0B]'
              }`}
            >
              {activeLesson.quickCheck.feedback}
            </p>
          )}
        </div>
      </article>
    </div>
  );
};
