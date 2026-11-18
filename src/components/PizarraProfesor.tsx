import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ListOrdered } from 'lucide-react';
import type { SolvedStep } from '../core/contracts';
import { MathBlock } from './MathBlock';

interface PizarraProfesorProps {
  title: string;
  steps: SolvedStep[];
  onExportJson?: () => void;
}

export const PizarraProfesor: React.FC<PizarraProfesorProps> = ({
  title,
  steps,
  onExportJson,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const safeIndex = Math.min(activeIndex, Math.max(0, steps.length - 1));
  const current = steps[safeIndex];

  if (!steps.length) {
    return (
      <section className="rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-5">
        <h3 className="font-display text-base font-semibold text-[#F1F5F9]">
          Pizarra del Profesor
        </h3>
        <p className="mt-2 text-sm text-[#94A3B8]">
          Ajusta un parámetro dentro del dominio físico válido para generar la secuencia de cálculo paso a paso.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Pizarra del Profesor"
      className="rounded-2xl border border-[#1E314A] bg-[#0F1A2E] overflow-hidden shadow-[0_12px_32px_-16px_rgba(2,6,16,0.8)]"
    >
      {/* Encabezado de instrumento docente */}
      <div className="px-5 py-4 border-b border-[#1E314A] bg-[#0B1322] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium text-[#2DD4BF]">
            Desarrollo matemático guiado · {steps.length} etapas sincronizadas
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-[#F1F5F9] mt-0.5">
            Pizarra del Profesor — {title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#14223B] text-[#F1F5F9] hover:border-[#38BDF8] transition-colors whitespace-nowrap cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            {showAll ? 'Modo paso a paso' : `Ver todo (${steps.length} pasos)`}
          </button>
          {onExportJson && (
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#14223B] text-[#F1F5F9] hover:border-[#2DD4BF] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#2DD4BF]" aria-hidden="true" />
              Exportar memoria
            </button>
          )}
        </div>
      </div>

      {/* Selector de etapas + barra de progreso */}
      {!showAll && (
        <div className="px-5 py-3 border-b border-[#1E314A] bg-[#091120] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Etapas de cálculo">
              {steps.map((st, idx) => {
                const active = idx === safeIndex;
                return (
                  <button
                    key={st.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveIndex(idx)}
                    className={`min-w-[2.1rem] h-8 px-2.5 text-xs font-mono-num font-semibold rounded-md border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#38BDF8] text-[#070D18] border-[#38BDF8] shadow-[0_0_12px_-3px_rgba(56,189,248,0.6)]'
                        : idx < safeIndex
                          ? 'bg-[#14223B] text-[#2DD4BF] border-[#2DD4BF]/30 hover:border-[#38BDF8]'
                          : 'bg-[#0F1A2E] text-[#94A3B8] border-[#1E314A] hover:text-[#F1F5F9] hover:border-[#2C4668]'
                    }`}
                  >
                    {st.stepNumber}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono-num text-[#94A3B8] mr-1">
                Paso {safeIndex + 1}/{steps.length}
              </span>
              <button
                type="button"
                disabled={safeIndex === 0}
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                aria-label="Paso anterior"
                className="p-1.5 rounded-md border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] disabled:opacity-40 hover:border-[#38BDF8] cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safeIndex === steps.length - 1}
                onClick={() => setActiveIndex((i) => Math.min(steps.length - 1, i + 1))}
                aria-label="Paso siguiente"
                className="p-1.5 rounded-md border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] disabled:opacity-40 hover:border-[#38BDF8] cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-1 w-full rounded-full bg-[#14223B] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] transition-all duration-200"
              style={{ width: `${((safeIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Desarrollo del paso */}
      <div className="p-5 sm:p-6 space-y-6">
        {(showAll ? steps : [current]).map((step) => (
          <article
            key={step.id}
            className="border-b border-[#1E314A] last:border-b-0 pb-6 last:pb-0 space-y-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h4 className="font-display text-sm sm:text-base font-bold text-[#F1F5F9]">
                <span className="font-mono-num text-[#38BDF8] mr-1.5">0{step.stepNumber}.</span>
                {step.title}
              </h4>
              <span className="font-mono-num text-sm sm:text-base font-bold text-[#2DD4BF]">
                {step.resultValue}{' '}
                <span className="text-xs text-[#94A3B8] font-normal">{step.unit}</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">{step.purpose}</p>

            <div className="rounded-xl border border-[#1E314A] bg-[#070D18] px-4 py-3 text-[#F1F5F9]">
              <MathBlock latex={step.equationLatex} display />
            </div>

            {step.substitutions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {step.substitutions.map((sub, idx) => (
                  <div
                    key={`${step.id}-sub-${idx}`}
                    className="rounded-lg border border-[#1E314A] bg-[#0B1322] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-[#94A3B8]">
                      <MathBlock latex={sub.symbol} />
                    </span>
                    <span className="font-mono-num text-[#F1F5F9] font-semibold">
                      {sub.value}{' '}
                      <span className="text-[#94A3B8] font-normal">{sub.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="rounded-xl border border-[#2DD4BF]/20 bg-[#0A1924] p-3.5">
                <div className="text-[11px] font-semibold text-[#2DD4BF] mb-1">
                  Interpretación física
                </div>
                <p className="text-[#CBD5E1] leading-relaxed text-xs">{step.interpretation}</p>
              </div>

              {step.assumptions.length > 0 && (
                <div className="rounded-xl border border-[#1E314A] bg-[#0B1322] p-3.5">
                  <div className="text-[11px] font-semibold text-[#94A3B8] mb-1">
                    Supuestos aplicados
                  </div>
                  <p className="text-[#CBD5E1] leading-relaxed text-xs">
                    {step.assumptions.join(' · ')}
                  </p>
                </div>
              )}
            </div>

            {step.warning && (
              <div
                role="alert"
                className="rounded-xl border border-[#F87171]/40 bg-[#1F1219] px-4 py-2.5 text-xs text-[#FCA5A5]"
              >
                ▲ Advertencia física: {step.warning}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
