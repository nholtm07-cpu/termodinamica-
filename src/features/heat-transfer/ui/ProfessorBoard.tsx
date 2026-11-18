import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { MathBlock } from '../../../components/MathBlock';
import type { CalculationStep, HeatEvaluation } from '../domain/models';

interface ProfessorBoardProps {
  evaluation: HeatEvaluation;
  highlightedStepIds?: string[];
  revealAllInitially?: boolean;
  certamenMode?: boolean;
}

export const ProfessorBoard: React.FC<ProfessorBoardProps> = ({
  evaluation,
  highlightedStepIds,
  revealAllInitially = true,
  certamenMode = false,
}) => {
  const [revealedCount, setRevealedCount] = useState<number>(
    revealAllInitially ? 999 : 0
  );
  const [expandedAlgebra, setExpandedAlgebra] = useState<Record<string, boolean>>({});
  const [onlyAffected, setOnlyAffected] = useState(false);

  const modifiedSet = new Set(evaluation.modifiedFields);
  const isStepAffected = (step: CalculationStep): boolean => {
    if (highlightedStepIds && highlightedStepIds.includes(step.id)) return true;
    if (modifiedSet.size === 0) return false;
    if (step.dependencies.some((d) => modifiedSet.has(d))) return true;
    if (
      step.dependencies.some((d) =>
        ['Qdot', 'Rtotal', 'Thout', 'b', 'lmtd', 'A', 'Cc', 'Ch', 'Qconv', 'Qrad'].includes(d)
      )
    ) {
      return true;
    }
    return false;
  };

  const visibleSteps = evaluation.steps.filter((s, idx) => {
    if (certamenMode && idx >= revealedCount) return false;
    if (onlyAffected && modifiedSet.size > 0) return isStepAffected(s);
    return true;
  });

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      caseId: evaluation.caseId,
      source: evaluation.source,
      status: evaluation.status,
      modifiedFields: evaluation.modifiedFields,
      inputs: Object.fromEntries(
        Object.entries(evaluation.inputs).map(([k, p]) => [
          k,
          { value: p.value, unit: p.unit, source: p.source },
        ])
      ),
      result: evaluation.result,
      steps: evaluation.steps.map((s) => ({
        position: s.position,
        label: s.label,
        law: s.law,
        value: s.value,
        unit: s.unit,
      })),
      checks: evaluation.checks,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluidotermo_${evaluation.caseId.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-label="Pizarra del Profesor paso a paso"
      className="ft-panel p-5 sm:p-6 space-y-5"
    >
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1E314A] pb-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-[#2DD4BF]">
            Pizarra del Profesor · {evaluation.steps.length} pasos recalculables en tiempo real
          </div>
          <h3 className="font-display text-lg font-bold text-[#F1F5F9]">
            Desarrollo matemático completo — {evaluation.caseId}
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Fuente de datos base: {evaluation.source.author}, <em>{evaluation.source.title}</em> ({evaluation.source.edition} ed.), {evaluation.source.exampleId}, {evaluation.source.printedPages} ({evaluation.source.pdfPages}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {evaluation.isModifiedFromBook && (
            <button
              type="button"
              onClick={() => setOnlyAffected((v) => !v)}
              aria-pressed={onlyAffected}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                onlyAffected
                  ? 'bg-[#1A1611] border-[#F59E0B] text-[#F59E0B]'
                  : 'bg-[#091120] border-[#1E314A] text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {onlyAffected ? 'Mostrar todos los pasos' : 'Filtrar pasos recalculados'}
            </button>
          )}
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#1E314A] bg-[#091120] text-[#F1F5F9] hover:border-[#38BDF8] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            Exportar cálculo JSON
          </button>
        </div>
      </div>

      {/* Controles de revelación gradual en modo Certamen */}
      {certamenMode && evaluation.steps.length > 0 && (
        <div className="ft-well p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#94A3B8]">
            Modo Certamen activo: desarrolla primero por tu cuenta o revela paso a paso ({Math.min(revealedCount, evaluation.steps.length)}/{evaluation.steps.length} visibles).
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {revealedCount < evaluation.steps.length && (
              <button
                type="button"
                onClick={() => setRevealedCount((c) => Math.min(evaluation.steps.length, c + 1))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#38BDF8] text-[#070D18] hover:bg-[#67D2FB] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                Revelar siguiente paso
              </button>
            )}
            {revealedCount < evaluation.steps.length ? (
              <button
                type="button"
                onClick={() => setRevealedCount(evaluation.steps.length)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#1E314A] bg-[#14223B] text-[#F1F5F9] hover:border-[#2DD4BF] transition-colors cursor-pointer whitespace-nowrap"
              >
                Ver desarrollo del profesor
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRevealedCount(0)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#1E314A] bg-[#14223B] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors cursor-pointer whitespace-nowrap"
              >
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                Ocultar desarrollo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bloqueo científico explícito */}
      {evaluation.blockingIssue && (
        <div
          role="alert"
          className="bg-[#1D1219] border border-[#F87171]/70 rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F87171]">
            <ShieldAlert className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Evaluación detenida por validez científica ({evaluation.blockingIssue.code})</span>
          </div>
          <p className="text-sm text-[#F1F5F9]">{evaluation.blockingIssue.message}</p>
          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            <strong className="text-[#F1F5F9]">Fundamento físico:</strong> {evaluation.blockingIssue.physicalExplanation}
          </p>
          <p className="text-xs text-[#2DD4BF]">
            <strong>Corrección sugerida:</strong> {evaluation.blockingIssue.suggestedFix}
          </p>
        </div>
      )}

      {/* Advertencias no bloqueantes */}
      {evaluation.warnings.length > 0 && (
        <div className="space-y-2">
          {evaluation.warnings.map((w, idx) => (
            <div
              key={idx}
              role="status"
              className="bg-[#1A1611] border border-[#F59E0B]/45 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-[#F1F5F9]"
            >
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lista de pasos */}
      {visibleSteps.length === 0 ? (
        <div className="ft-well p-6 text-center text-sm text-[#94A3B8]">
          {evaluation.blockingIssue
            ? 'No se generan pasos numéricos posteriores mientras el dominio o modelo permanezca bloqueado.'
            : 'Los pasos de la pizarra están ocultos para que resuelvas primero el certamen. Usa el comprobador superior o pulsa «Revelar siguiente paso».'}
        </div>
      ) : (
        <ol className="space-y-3.5">
          {visibleSteps.map((step) => {
            const affected = isStepAffected(step);
            const algebraOpen = Boolean(expandedAlgebra[step.id]);
            return (
              <li
                key={step.id}
                className={`rounded-xl border p-4 transition-colors space-y-2.5 ${
                  step.validity === 'blocked'
                    ? 'bg-[#1D1219] border-[#F87171]/70'
                    : affected
                    ? 'bg-[#132038] border-[#F59E0B]/55'
                    : 'bg-[#091120] border-[#1E314A]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono-num text-xs font-bold text-[#38BDF8]">
                      {String(step.position).padStart(2, '0')}.
                    </span>
                    <h4 className="font-display text-sm font-semibold text-[#F1F5F9]">
                      {step.label}
                    </h4>
                  </div>
                  <div className="text-xs text-[#94A3B8] flex items-center gap-2">
                    <span>{step.law}</span>
                    {affected && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#F59E0B] font-medium">Recalculado</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#CBD5E1] leading-relaxed">{step.why}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 bg-[#0F1A2E] border border-[#1E314A] rounded-lg p-3.5">
                  <div>
                    <div className="text-[11px] text-[#94A3B8] mb-1">Ecuación simbólica</div>
                    <MathBlock latex={step.formulaLatex} display className="text-xs sm:text-sm text-[#F1F5F9]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#94A3B8] mb-1">Sustitución con valores actuales</div>
                    <MathBlock latex={step.substitutionLatex} display className="text-xs sm:text-sm text-[#2DD4BF]" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
                  <div className="flex flex-wrap items-center gap-3 text-[#94A3B8]">
                    <span>
                      Resultado:{' '}
                      <strong className="font-mono-num text-[#F1F5F9]">
                        {step.displayValue}{' '}
                        {step.unit !== 'arreglo' && step.unit !== 'SI' && step.unit !== 'nodos' ? step.unit : ''}
                      </strong>
                    </span>
                    {step.dependencies.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Depende de: {step.dependencies.join(', ')}</span>
                      </>
                    )}
                  </div>

                  {step.algebraNote && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAlgebra((prev) => ({ ...prev, [step.id]: !prev[step.id] }))
                      }
                      aria-expanded={algebraOpen}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#38BDF8] hover:text-[#67D2FB] cursor-pointer"
                    >
                      {algebraOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      ¿Cómo se despejó?
                    </button>
                  )}
                </div>

                {algebraOpen && step.algebraNote && (
                  <div className="text-xs text-[#F1F5F9] bg-[#14223B] border border-[#1E314A] rounded-lg p-3 leading-relaxed">
                    {step.algebraNote}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Auditoría de invariantes físicos */}
      {evaluation.checks.length > 0 && (
        <div className="pt-3 border-t border-[#1E314A] space-y-2.5">
          <div className="text-xs font-semibold text-[#F1F5F9]">
            Comprobación automática de invariantes y unidades
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            {evaluation.checks.map((chk) => (
              <li
                key={chk.id}
                className="ft-well p-3 flex items-start gap-2"
              >
                {chk.passed && chk.severity === 'info' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      chk.severity === 'error' ? 'text-[#F87171]' : 'text-[#F59E0B]'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="text-[#CBD5E1] leading-snug">{chk.explanation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
