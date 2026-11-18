import React, { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { solveHydrostaticPressure, solvePipeFlowDarcy } from '../../core/mec120/fluidMechanics';
import { formatCL } from '../../core/thermo/units';
import {
  BaselineComparator,
  InstrumentSlider,
  MetricTile,
  ModuleHero,
  PedagogicBlock,
} from '../../components/ui/LabPrimitives';

const BASE_PIPE = {
  diameterM: 0.1,
  lengthM: 50,
  velocityMs: 2.0,
  roughnessMm: 0.045,
};

const BASE_HYDRO = {
  depthM: 12,
  pSurfaceKPa: 101.325,
};

export const Mec120View: React.FC = () => {
  const [diameterM, setDiameterM] = useState(BASE_PIPE.diameterM);
  const [lengthM, setLengthM] = useState(BASE_PIPE.lengthM);
  const [velocityMs, setVelocityMs] = useState(BASE_PIPE.velocityMs);
  const [roughnessMm, setRoughnessMm] = useState(BASE_PIPE.roughnessMm);
  const [depthM, setDepthM] = useState(BASE_HYDRO.depthM);
  const [pSurfaceKPa, setPSurfaceKPa] = useState(BASE_HYDRO.pSurfaceKPa);

  const pipeRes = useMemo(
    () =>
      solvePipeFlowDarcy({
        diameterM,
        lengthM,
        velocityMs,
        roughnessMm,
        densityKgM3: 998.2,
        viscosityPaS: 1.002e-3,
      }),
    [diameterM, lengthM, velocityMs, roughnessMm]
  );

  const hydroRes = useMemo(
    () =>
      solveHydrostaticPressure({
        densityKgM3: 998.2,
        depthM,
        pSurfaceKPa,
      }),
    [depthM, pSurfaceKPa]
  );

  const modifiedCount =
    (diameterM !== BASE_PIPE.diameterM ? 1 : 0) +
    (lengthM !== BASE_PIPE.lengthM ? 1 : 0) +
    (velocityMs !== BASE_PIPE.velocityMs ? 1 : 0) +
    (roughnessMm !== BASE_PIPE.roughnessMm ? 1 : 0) +
    (depthM !== BASE_HYDRO.depthM ? 1 : 0) +
    (pSurfaceKPa !== BASE_HYDRO.pSurfaceKPa ? 1 : 0);

  const restoreDefaults = () => {
    setDiameterM(BASE_PIPE.diameterM);
    setLengthM(BASE_PIPE.lengthM);
    setVelocityMs(BASE_PIPE.velocityMs);
    setRoughnessMm(BASE_PIPE.roughnessMm);
    setDepthM(BASE_HYDRO.depthM);
    setPSurfaceKPa(BASE_HYDRO.pSurfaceKPa);
  };

  const re = pipeRes.ok ? pipeRes.value.reynolds : 0;
  const regimePct = Math.min(100, Math.max(4, (Math.log10(Math.max(100, re)) / 6) * 100));

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="MEC120 · Mecánica de Fluidos"
        title="Laboratorio Hidráulico MEC120 (Darcy-Weisbach e Hidrostática)"
        subtitle="Análisis paramétrico de pérdidas primarias en conductos circulares mediante Swamee–Jain y distribución de presión hidrostática en agua a 20 °C (ρ = 998,2 kg/m³, μ = 1,002×10⁻³ Pa·s)."
        accent="cyan"
        rightSlot={
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#2DD4BF]/35 bg-[#0A1924] px-3 py-2 text-xs font-semibold text-[#2DD4BF]">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Dominio hidráulico activo</span>
          </div>
        }
      />

      <BaselineComparator
        isModified={modifiedCount > 0}
        modifiedCount={modifiedCount}
        sourceLabel="referencia hidráulica"
        onRestore={restoreDefaults}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Flujo interno Darcy-Weisbach */}
        <section className="xl:col-span-7 rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E314A] pb-3">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[#F1F5F9]">
                Flujo interno en tubería circular (Darcy–Weisbach)
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Evaluación continua de Reynolds, rugosidad relativa ε/D y pérdida de carga h_f
              </p>
            </div>
            <button
              type="button"
              onClick={restoreDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#14223B] text-[#38BDF8] hover:border-[#38BDF8] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Restaurar base
            </button>
          </div>

          {/* Esquema técnico de tubería reactivo */}
          <svg
            viewBox="0 0 560 140"
            role="img"
            aria-label={`Tubería circular D=${diameterM} m, L=${lengthM} m, velocidad ${velocityMs} m/s`}
            className="w-full h-auto rounded-xl border border-[#1E314A] bg-[#070D18]"
          >
            {/* Línea de energía piezométrica decreciente */}
            <line
              x1="60"
              y1="26"
              x2="500"
              y2={pipeRes.ok ? Math.min(58, 26 + Math.min(28, pipeRes.value.headLossM * 1.4)) : 40}
              stroke="#F59E0B"
              strokeWidth="1.6"
              strokeDasharray="4 3"
            />
            <text x="64" y="18" fill="#F59E0B" fontSize="10" className="font-mono-num">
              Línea piezométrica · h_f = {pipeRes.ok ? formatCL(pipeRes.value.headLossM, 3) : '—'} m
            </text>

            {/* Cuerpo de tubería */}
            <rect x="60" y="62" width="440" height="46" rx="4" fill="#0F1A2E" stroke="#38BDF8" strokeWidth="1.6" />
            <line x1="76" y1="75" x2="484" y2="75" stroke="#38BDF8" strokeWidth="1.5" className="ft-flow-dash" />
            <line x1="76" y1="85" x2="484" y2="85" stroke="#2DD4BF" strokeWidth="2.2" className="ft-flow-dash" />
            <line x1="76" y1="95" x2="484" y2="95" stroke="#38BDF8" strokeWidth="1.5" className="ft-flow-dash" />

            <text x="280" y="128" textAnchor="middle" fill="#94A3B8" fontSize="10.5" className="font-mono-num">
              D = {formatCL(diameterM, 3)} m · L = {formatCL(lengthM, 1)} m · V = {formatCL(velocityMs, 2)} m/s · ε = {formatCL(roughnessMm, 3)} mm
            </text>
          </svg>

          {/* Barra de régimen Reynolds */}
          {pipeRes.ok && (
            <div className="rounded-xl border border-[#1E314A] bg-[#091120] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#CBD5E1]">Clasificación de régimen (Re)</span>
                <span className="font-mono-num font-bold text-[#38BDF8]">
                  Re = {formatCL(pipeRes.value.reynolds, 0)} · Régimen {pipeRes.value.regime}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#14223B] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2DD4BF] via-[#38BDF8] to-[#F59E0B] transition-all duration-200"
                  style={{ width: `${regimePct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono-num text-[#64748B]">
                <span>10² Laminar (&lt;2300)</span>
                <span>Transición</span>
                <span>Turbulento (&gt;4000) 10⁶</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InstrumentSlider
              id="mec120-d"
              label="Diámetro interno D"
              value={diameterM}
              defaultValue={BASE_PIPE.diameterM}
              unit="m"
              min={0.01}
              max={0.6}
              step={0.01}
              onChange={setDiameterM}
            />
            <InstrumentSlider
              id="mec120-l"
              label="Longitud de tramo L"
              value={lengthM}
              defaultValue={BASE_PIPE.lengthM}
              unit="m"
              min={5}
              max={300}
              step={5}
              onChange={setLengthM}
            />
            <InstrumentSlider
              id="mec120-v"
              label="Velocidad media V"
              value={velocityMs}
              defaultValue={BASE_PIPE.velocityMs}
              unit="m/s"
              min={0.1}
              max={8}
              step={0.1}
              onChange={setVelocityMs}
            />
            <InstrumentSlider
              id="mec120-eps"
              label="Rugosidad absoluta ε"
              value={roughnessMm}
              defaultValue={BASE_PIPE.roughnessMm}
              unit="mm"
              min={0.001}
              max={2}
              step={0.005}
              onChange={setRoughnessMm}
            />
          </div>

          {pipeRes.ok ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricTile
                label="Número de Reynolds"
                value={formatCL(pipeRes.value.reynolds, 0)}
                tone="cyan"
                caption={`Régimen ${pipeRes.value.regime}`}
              />
              <MetricTile
                label="Factor fricción f"
                value={formatCL(pipeRes.value.frictionFactor, 5)}
                tone="teal"
              />
              <MetricTile
                label="Pérdida de carga h_f"
                value={formatCL(pipeRes.value.headLossM, 3)}
                unit="m"
                tone="amber"
              />
              <MetricTile
                label="Caída Δp / Caudal Q"
                value={formatCL(pipeRes.value.pressureDropKPa, 2)}
                unit="kPa"
                caption={`Q = ${formatCL(pipeRes.value.flowRateM3S * 1000, 2)} L/s`}
              />
            </div>
          ) : (
            <p role="alert" className="text-xs text-[#F87171]">
              {pipeRes.error.message}
            </p>
          )}
        </section>

        {/* Hidrostática */}
        <section className="xl:col-span-5 rounded-2xl border border-[#1E314A] bg-[#0F1A2E] p-5 sm:p-6 space-y-5">
          <div className="border-b border-[#1E314A] pb-3">
            <h2 className="font-display text-base sm:text-lg font-bold text-[#F1F5F9]">
              Presión hidrostática en columna líquida
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Relación lineal p_abs = p₀ + ρ·g·h en fluido incompresible en reposo
            </p>
          </div>

          {/* Esquema piezométrico de tanque */}
          <svg
            viewBox="0 0 360 150"
            role="img"
            aria-label={`Columna de agua de profundidad ${depthM} m`}
            className="w-full h-auto rounded-xl border border-[#1E314A] bg-[#070D18]"
          >
            <rect x="65" y="24" width="150" height="106" rx="4" fill="#0D223B" stroke="#38BDF8" strokeWidth="1.5" />
            <line x1="65" y1="36" x2="215" y2="36" stroke="#2DD4BF" strokeWidth="2" />
            <text x="140" y="18" textAnchor="middle" fill="#94A3B8" fontSize="10" className="font-mono-num">
              p₀ = {formatCL(pSurfaceKPa, 2)} kPa
            </text>
            <line x1="235" y1="36" x2="235" y2="122" stroke="#F59E0B" strokeWidth="1.5" />
            <circle cx="140" cy="122" r="4.5" fill="#F59E0B" />
            <text x="245" y="84" fill="#F59E0B" fontSize="10.5" fontWeight="600" className="font-mono-num">
              h = {formatCL(depthM, 1)} m
            </text>
            <text x="140" y="142" textAnchor="middle" fill="#2DD4BF" fontSize="10" className="font-mono-num">
              p_abs = {hydroRes.ok ? formatCL(hydroRes.value.pAbsKPa, 2) : '—'} kPa
            </text>
          </svg>

          <div className="space-y-3">
            <InstrumentSlider
              id="mec120-h"
              label="Profundidad h"
              value={depthM}
              defaultValue={BASE_HYDRO.depthM}
              unit="m"
              min={0}
              max={100}
              step={1}
              onChange={setDepthM}
            />
            <InstrumentSlider
              id="mec120-p0"
              label="Presión superficial p₀"
              value={pSurfaceKPa}
              defaultValue={BASE_HYDRO.pSurfaceKPa}
              unit="kPa"
              min={50}
              max={300}
              step={1}
              onChange={setPSurfaceKPa}
            />
          </div>

          {hydroRes.ok ? (
            <div className="grid grid-cols-2 gap-3">
              <MetricTile
                label="Presión manométrica (ρ·g·h)"
                value={formatCL(hydroRes.value.pGageKPa, 2)}
                unit="kPa"
                tone="teal"
              />
              <MetricTile
                label="Presión absoluta p_abs"
                value={formatCL(hydroRes.value.pAbsKPa, 2)}
                unit="kPa"
                tone="cyan"
              />
            </div>
          ) : (
            <p role="alert" className="text-xs text-[#F87171]">
              {hydroRes.error.message}
            </p>
          )}

          <PedagogicBlock kind="dimensional">
            Verifica que ε y D estén en la misma unidad de longitud al calcular la rugosidad relativa ε/D. En MEC120 convertimos ε de mm a m (÷ 1000) antes de evaluar Swamee–Jain.
          </PedagogicBlock>
        </section>
      </div>
    </div>
  );
};
