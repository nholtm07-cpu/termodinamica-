import React, { useEffect } from 'react';
import { BOOK_CASE_DEFINITIONS } from '../data/book-presets';
import type { HeatCaseId, HeatEvaluation, Parameter } from '../domain/models';
import type { HeatExchangerFlowMode } from '../domain/cases/C05';
import { MetricTile } from '../../../components/ui/LabPrimitives';
import { ChartPanels } from './ChartPanels';
import { ParameterPanel } from './ParameterPanel';
import { ProfessorBoard } from './ProfessorBoard';
import { TechnicalDiagram } from './TechnicalDiagram';

interface HeatLabPageProps {
  activeCaseId: HeatCaseId;
  onSelectCase: (id: HeatCaseId) => void;
  inputs: Record<string, Parameter>;
  evaluation: HeatEvaluation;
  flowMode: HeatExchangerFlowMode;
  onChangeFlowMode: (m: HeatExchangerFlowMode) => void;
  playbackTimeSec: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetPlayback: () => void;
  onScrubTime: (t: number) => void;
  onChangeParam: (id: string, value: number) => void;
  onRestoreBook: () => void;
}

const LAB_LIST: Array<{ id: HeatCaseId; labCode: string; label: string }> = [
  { id: 'TC-C01', labCode: 'Lab A', label: 'Techo térmico (Fourier)' },
  { id: 'TC-C02', labCode: 'Lab B', label: 'Convección + Radiación' },
  { id: 'TC-C03', labCode: 'Lab C', label: 'Ventana multicapa (5R)' },
  { id: 'TC-C04', labCode: 'Lab D', label: 'Termopar transitorio (Biot)' },
  { id: 'TC-C05', labCode: 'Lab E', label: 'Intercambiador LMTD / NTU' },
];

export const HeatLabPage: React.FC<HeatLabPageProps> = ({
  activeCaseId,
  onSelectCase,
  inputs,
  evaluation,
  flowMode,
  onChangeFlowMode,
  playbackTimeSec,
  isPlaying,
  onTogglePlay,
  onResetPlayback,
  onScrubTime,
  onChangeParam,
  onRestoreBook,
}) => {
  const def = BOOK_CASE_DEFINITIONS[activeCaseId];
  const maxTimeC04 =
    activeCaseId === 'TC-C04' && typeof evaluation.result.targetTime === 'number'
      ? evaluation.result.targetTime * 1.4
      : 15;

  // Bucle de reproducción temporal requestAnimationFrame para TC-C04
  useEffect(() => {
    if (!isPlaying || activeCaseId !== 'TC-C04' || evaluation.status === 'invalid') return;
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;
      const next = playbackTimeSec + dt * (maxTimeC04 / 6);
      if (next >= maxTimeC04) {
        onScrubTime(maxTimeC04);
        onTogglePlay();
        return;
      }
      onScrubTime(next);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying, activeCaseId, evaluation.status, playbackTimeSec, maxTimeC04, onScrubTime, onTogglePlay]);

  return (
    <div className="space-y-6">
      {/* Selector de los 5 simuladores */}
      <div
        role="tablist"
        aria-label="Seleccionar laboratorio interactivo"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5"
      >
        {LAB_LIST.map((lab) => {
          const active = lab.id === activeCaseId;
          return (
            <button
              key={lab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectCase(lab.id)}
              className={`text-left px-3.5 py-3 rounded-xl border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#14223B] border-[#2DD4BF]/80 text-[#F1F5F9]'
                  : 'bg-[#0F1A2E] border-[#1E314A] text-[#94A3B8] hover:border-[#2C4668] hover:text-[#F1F5F9]'
              }`}
            >
              <div className="font-mono-num text-[11px] font-bold text-[#2DD4BF]">
                {lab.labCode} · {lab.id}
              </div>
              <div className="text-xs font-semibold mt-0.5">{lab.label}</div>
            </button>
          );
        })}
      </div>

      {/* Encabezado del laboratorio activo */}
      <div className="ft-panel p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[#F59E0B] font-medium">
            Simulador paramétrico sincronizado · {def.source.exampleId} ({def.source.printedPages})
          </div>
          <h2 className="font-display text-lg font-bold text-[#F1F5F9] mt-0.5">{def.title}</h2>
        </div>
        <div className="text-xs text-[#94A3B8] font-mono-num">
          {evaluation.isModifiedFromBook
            ? 'Variación comparada frente al caso base'
            : 'Estado nominal de referencia'}
        </div>
      </div>

      {/* Layout escritorio: esquema a la izquierda, inputs a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <TechnicalDiagram
            evaluation={evaluation}
            playbackTimeSec={playbackTimeSec}
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
            onResetPlayback={onResetPlayback}
            onScrubTime={onScrubTime}
          />

          {evaluation.primaryMetrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {evaluation.primaryMetrics.map((m) => (
                <MetricTile
                  key={m.id}
                  label={m.label}
                  value={m.value}
                  unit={m.unit}
                  baseline={m.bookReference}
                  tone="teal"
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
                  <span className="font-semibold text-[#F1F5F9]">Configuración del equipo:</span>
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
                        {fm === 'counterflow' ? 'Contraflujo' : 'Flujo paralelo'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Gráficas científicas sincronizadas */}
      <ChartPanels charts={evaluation.charts} />

      {/* Pizarra del profesor en vivo */}
      <ProfessorBoard evaluation={evaluation} revealAllInitially />
    </div>
  );
};
