import React from 'react';
import { RotateCcw } from 'lucide-react';
import { BOOK_CASE_DEFINITIONS } from '../data/book-presets';
import type { HeatCaseId, Parameter } from '../domain/models';
import { formatHT } from '../domain/units';
import { InfoTooltip } from '../../../components/ui/LabPrimitives';

interface ParameterPanelProps {
  caseId: HeatCaseId;
  inputs: Record<string, Parameter>;
  modifiedFields: string[];
  onChangeParam: (id: string, value: number) => void;
  onRestoreBook: () => void;
  extraControls?: React.ReactNode;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  caseId,
  inputs,
  modifiedFields,
  onChangeParam,
  onRestoreBook,
  extraControls,
}) => {
  const baseDefaults = BOOK_CASE_DEFINITIONS[caseId].defaultInputs;
  const params = Object.values(inputs);
  const modifiedSet = new Set(modifiedFields);

  return (
    <aside
      aria-label="Parámetros editables de entrada"
      className="ft-panel p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E314A] pb-3.5">
        <div>
          <h3 className="font-display text-sm font-bold text-[#F1F5F9]">
            Controles de entrada SI / laboratorio
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {modifiedFields.length === 0
              ? 'Estado nominal: coincide con los datos de referencia'
              : `Modificado por estudiante (${modifiedFields.length} parámetro${modifiedFields.length > 1 ? 's' : ''})`}
          </p>
        </div>

        <button
          type="button"
          onClick={onRestoreBook}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#38BDF8]/55 bg-[#091120] text-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#070D18] transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Restaurar datos del libro
        </button>
      </div>

      {extraControls && (
        <div className="ft-well p-3">
          {extraControls}
        </div>
      )}

      <div className="space-y-3">
        {params.map((p) => {
          const isModified = modifiedSet.has(p.id);
          const bookVal = baseDefaults[p.id]?.value;
          const sliderMin = p.domain.min ?? 0;
          const sliderMax =
            p.id === 'targetPct' ? 99.9 : p.domain.max ?? Math.max(10, p.value * 2);
          const clampedSlider = Math.min(sliderMax, Math.max(sliderMin, p.value));

          return (
            <div
              key={p.id}
              className={`rounded-xl border p-3.5 space-y-2.5 transition-colors duration-200 ${
                isModified
                  ? 'bg-[#132038] border-[#F59E0B]/55'
                  : 'bg-[#091120] border-[#1E314A] hover:border-[#2C4668]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor={`param-${caseId}-${p.id}`}
                    className="text-xs font-semibold text-[#F1F5F9]"
                  >
                    {p.label}
                  </label>
                  <InfoTooltip
                    label={`Información física de ${p.label}`}
                    content={`${p.explanation}. Rango recomendado del deslizador: ${sliderMin} a ${sliderMax} ${p.unit}.`}
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    id={`param-${caseId}-${p.id}`}
                    type="number"
                    value={Number.isFinite(p.value) ? p.value : ''}
                    step={p.step}
                    onChange={(e) => {
                      const raw = parseFloat(e.target.value);
                      if (Number.isFinite(raw)) onChangeParam(p.id, raw);
                    }}
                    className="w-24 px-2.5 py-1 text-right font-mono-num text-xs bg-[#0F1A2E] border border-[#1E314A] rounded-md text-[#F1F5F9] focus:border-[#38BDF8] transition-colors"
                  />
                  <span className="text-[11px] font-mono-num text-[#94A3B8] min-w-[3.2rem]">
                    {p.unit}
                  </span>
                </div>
              </div>

              <input
                type="range"
                aria-label={`Deslizador de ${p.label}`}
                min={sliderMin}
                max={sliderMax}
                step={p.step}
                value={clampedSlider}
                onChange={(e) => onChangeParam(p.id, parseFloat(e.target.value))}
                className="ft-slider"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
                <span>{p.explanation}</span>
                <span className={isModified ? 'text-[#F59E0B] font-medium font-mono-num' : 'font-mono-num'}>
                  {isModified && bookVal !== undefined
                    ? `Modificado (libro: ${formatHT(bookVal, 2)} ${p.unit})`
                    : 'Dato del ejemplo'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
