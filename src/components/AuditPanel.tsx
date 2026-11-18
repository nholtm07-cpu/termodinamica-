import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { SolverMetadata, ValidationStatus } from '../core/contracts';
import { formatCL } from '../core/thermo/units';

interface AuditPanelProps {
  audit: SolverMetadata;
}

const STATUS_MAP: Record<
  ValidationStatus,
  { label: string; colorClass: string }
> = {
  verificado: {
    label: 'Modelo verificado (conservación de masa y energía cumplida)',
    colorClass: 'text-[#2DD4BF]',
  },
  aproximado: {
    label: 'Aproximación pedagógica (revisar hipótesis activas)',
    colorClass: 'text-[#F59E0B]',
  },
  requiere_fuente: {
    label: 'Requiere contraste con tabla fuente',
    colorClass: 'text-[#F59E0B]',
  },
  inconsistente: {
    label: 'Inconsistencia física o de referencia detectada',
    colorClass: 'text-[#F87171]',
  },
  fuera_de_dominio: {
    label: 'Fuera del dominio válido del modelo',
    colorClass: 'text-[#F87171]',
  },
};

export const AuditPanel: React.FC<AuditPanelProps> = ({ audit }) => {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = STATUS_MAP[audit.validationStatus];

  return (
    <section
      aria-label="Auditoría científica del modelo"
      className="rounded-2xl border border-[#1E314A] bg-[#0F1A2E] overflow-hidden"
    >
      <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className={`font-semibold inline-flex items-center gap-2 ${statusInfo.colorClass}`}>
            {audit.validationStatus === 'verificado' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : audit.validationStatus === 'inconsistente' ||
              audit.validationStatus === 'fuera_de_dominio' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{statusInfo.label}</span>
          </span>
          <span className="text-[#475569] hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-[#94A3B8]">
            Motor: <strong className="text-[#F1F5F9] font-medium">{audit.provider}</strong> ({audit.providerVersion})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8] hover:text-[#F1F5F9] transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>{expanded ? 'Ocultar residuos e hipótesis' : 'Ver hipótesis, licencia y residuos'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {audit.warnings.length > 0 && (
        <div className="px-5 pb-3.5 space-y-1.5">
          {audit.warnings.map((w, i) => (
            <div
              key={i}
              role="alert"
              className="text-xs bg-[#1E170F] border border-[#F59E0B]/35 text-[#FCD34D] rounded-lg px-3.5 py-2"
            >
              ▲ {w}
            </div>
          ))}
        </div>
      )}

      {expanded && (
        <div className="px-5 py-4 border-t border-[#1E314A] bg-[#091120] space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <h4 className="font-display font-semibold text-[#F1F5F9] mb-2">
                Hipótesis activas del modelo
              </h4>
              <ul className="space-y-1.5 text-[#CBD5E1] list-disc list-inside leading-relaxed">
                {audit.hypotheses.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1.5 text-[#94A3B8]">
              <h4 className="font-display font-semibold text-[#F1F5F9] mb-2">
                Trazabilidad y tolerancias numéricas
              </h4>
              <p>
                Identificador: <span className="font-mono-num text-[#F1F5F9]">{audit.modelId}</span>
              </p>
              <p>
                Fluido de trabajo: <span className="text-[#F1F5F9]">{audit.fluid}</span>
              </p>
              <p>
                Formulación: <span className="text-[#F1F5F9]">{audit.providerLicense}</span>
              </p>
              <p>
                Residuo global energía:{' '}
                <span className="font-mono-num text-[#2DD4BF]">
                  {audit.overallEnergyResidualKW.toExponential(2)} kW
                </span>{' '}
                · masa:{' '}
                <span className="font-mono-num text-[#2DD4BF]">
                  {audit.overallMassResidualKgS.toExponential(2)} kg/s
                </span>
              </p>
            </div>
          </div>

          {audit.balances.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-[#1E314A]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0F1A2E] text-[#94A3B8]">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Equipo / Frontera</th>
                    <th className="py-2 px-3 font-semibold">ṁ entra [kg/s]</th>
                    <th className="py-2 px-3 font-semibold">ṁ sale [kg/s]</th>
                    <th className="py-2 px-3 font-semibold">E entra [kW]</th>
                    <th className="py-2 px-3 font-semibold">E sale [kW]</th>
                    <th className="py-2 px-3 font-semibold">Residuo E [kW]</th>
                  </tr>
                </thead>
                <tbody className="font-mono-num text-[#F1F5F9] divide-y divide-[#1E314A]/60 bg-[#070D18]">
                  {audit.balances.map((b, i) => (
                    <tr key={i} className="hover:bg-[#0F1A2E]/60">
                      <td className="py-2 px-3 font-sans font-medium text-[#F1F5F9]">{b.component}</td>
                      <td className="py-2 px-3">{formatCL(b.massInKgS, 3)}</td>
                      <td className="py-2 px-3">{formatCL(b.massOutKgS, 3)}</td>
                      <td className="py-2 px-3">{formatCL(b.energyInKW, 2)}</td>
                      <td className="py-2 px-3">{formatCL(b.energyOutKW, 2)}</td>
                      <td className="py-2 px-3 text-[#2DD4BF]">{b.energyResidualKW.toExponential(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
