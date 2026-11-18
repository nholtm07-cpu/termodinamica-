import React, { useMemo, useState } from 'react';
import { BookMarked, Calculator, CheckCircle2, Layers, Scale } from 'lucide-react';
import {
  GLOSSARY_TERMS,
  SEVEN_STEP_METHOD,
  SYMBOL_DICTIONARY,
  SYSTEM_CLASSIFICATION_ITEMS,
} from '../../../content/mec110/glossary';
import { iapwsIF97Provider } from '../../../core/thermo/if97';
import { linearInterpolate } from '../../../core/thermo/idealGas';
import {
  checkFormulaDimensions,
  cToK,
  formatCL,
  fromJoules,
  fromKgPerS,
  fromPa,
  fromWatts,
  toJoules,
  toKgPerS,
  toPa,
  toWatts,
  type EnergyUnit,
  type MassFlowUnit,
  type PowerUnit,
  type PressureUnit,
} from '../../../core/thermo/units';
import { MathBlock } from '../../../components/MathBlock';
import { MetricTile, ModuleHero, PedagogicBlock } from '../../../components/ui/LabPrimitives';

type ToolTab = 'if97' | 'units' | 'glossary' | 'method';

export const SteamTablesAndTools: React.FC = () => {
  const [tab, setTab] = useState<ToolTab>('if97');

  // Subtab 1: IF97 + Interpolación lineal
  const [lookupMode, setLookupMode] = useState<'PT' | 'PX' | 'PS' | 'PH'>('PT');
  const [pKPa, setPKPa] = useState<number>(10000);
  const [TC, setTC] = useState<number>(500);
  const [quality, setQuality] = useState<number>(0.9);
  const [sInput, setSInput] = useState<number>(6.5966);
  const [hInput, setHInput] = useState<number>(3373.7);

  // Interpolación lineal visible
  const [ix0, setIx0] = useState<number>(2.0);
  const [iy0, setIy0] = useState<number>(6.7664);
  const [ix1, setIx1] = useState<number>(2.5);
  const [iy1, setIy1] = useState<number>(6.6796);
  const [ixTarget, setIxTarget] = useState<number>(2.337);

  // Subtab 2: Conversor & analizador dimensional
  const [pVal, setPVal] = useState<number>(10);
  const [pFrom, setPFrom] = useState<PressureUnit>('MPa');
  const [pTo, setPTo] = useState<PressureUnit>('kPa');
  const [tValC, setTValC] = useState<number>(500);
  const [powVal, setPowVal] = useState<number>(300);
  const [powFrom, setPowFrom] = useState<PowerUnit>('MW');
  const [powTo, setPowTo] = useState<PowerUnit>('kW');
  const [eVal, setEVal] = useState<number>(1200);
  const [eFrom, setEFrom] = useState<EnergyUnit>('kJ');
  const [eTo, setETo] = useState<EnergyUnit>('kWh');
  const [mVal, setMVal] = useState<number>(3600);
  const [mFrom, setMFrom] = useState<MassFlowUnit>('kg/h');
  const [mTo, setMTo] = useState<MassFlowUnit>('kg/s');

  const [dimFormula, setDimFormula] = useState<
    'Q=mcDT' | 'w=vDp' | 'PV=mRT' | 'Wdot=mdot*w' | 'Carnot=1-TL/TH'
  >('w=vDp');
  const [dimSelections, setDimSelections] = useState<Record<string, string>>({
    v: 'm3/kg',
    dp: 'kPa',
    m: 'kg',
    c: 'kJ/(kg*K)',
    dT: 'K',
    p: 'kPa_abs',
    V: 'm3',
    T: 'K',
    mdot: 'kg/s',
    w: 'kJ/kg',
    TL: 'K',
    TH: 'K',
  });

  // Subtab 4: Clasificador abierto vs cerrado vs aislado
  const [sysAnswers, setSysAnswers] = useState<Record<string, 'abierto' | 'cerrado' | 'aislado'>>({});

  const if97State = useMemo(() => {
    const pPa = pKPa * 1e3;
    if (lookupMode === 'PT') return iapwsIF97Provider.solvePT('water', pPa, cToK(TC));
    if (lookupMode === 'PX') return iapwsIF97Provider.solvePX('water', pPa, quality);
    if (lookupMode === 'PS') return iapwsIF97Provider.solvePS('water', pPa, sInput * 1e3);
    return iapwsIF97Provider.solvePH('water', pPa, hInput * 1e3);
  }, [lookupMode, pKPa, TC, quality, sInput, hInput]);

  const interpRes = useMemo(
    () => linearInterpolate(ix0, iy0, ix1, iy1, ixTarget),
    [ix0, iy0, ix1, iy1, ixTarget]
  );

  const dimCheck = useMemo(
    () => checkFormulaDimensions(dimFormula, dimSelections),
    [dimFormula, dimSelections]
  );

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Herramientas Transversales MEC110 · Propiedades Reales y Análisis Dimensional"
        title="Tablas de Vapor IAPWS-IF97, Conversor SI, Glosario y Método de 7 Pasos"
        subtitle="Consulta estados termodinámicos reales del agua/vapor, verifica la consistencia dimensional de cada ecuación y clasifica sistemas cerrados frente a volúmenes de control."
        accent="teal"
      >
        <div
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#091120] border border-[#1E314A]"
          role="tablist"
          aria-label="Herramientas transversales"
        >
          {[
            { id: 'if97' as const, label: 'Tablas IF97 e interpolación', icon: Layers },
            { id: 'units' as const, label: 'Unidades y dimensiones', icon: Scale },
            { id: 'glossary' as const, label: 'Símbolos y glosario', icon: BookMarked },
            { id: 'method' as const, label: 'Método 7 pasos y sistemas', icon: Calculator },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#38BDF8] text-[#070D18]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#14223B]/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>
      </ModuleHero>

      {/* TAB 1: IF97 + Interpolación */}
      {tab === 'if97' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 ft-panel p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-[#F1F5F9]">
                Consulta interactiva de Agua/Vapor (IAPWS-IF97)
              </h2>
              <p className="text-xs text-[#94A3B8] font-mono-num">
                Proveedor: {iapwsIF97Provider.id} · {iapwsIF97Provider.version} · {iapwsIF97Provider.license}
              </p>
            </div>

            <div className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-[#091120] border border-[#1E314A] text-xs">
              {(
                [
                  { id: 'PT', label: '(p, T)' },
                  { id: 'PX', label: '(p, x) Saturación' },
                  { id: 'PS', label: '(p, s)' },
                  { id: 'PH', label: '(p, h)' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLookupMode(m.id)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    lookupMode === m.id
                      ? 'bg-[#2DD4BF] text-[#070D18] font-semibold'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1.5">
                <span className="text-[#94A3B8] font-medium block">Presión p [kPa]</span>
                <input
                  type="number"
                  value={pKPa}
                  onChange={(e) => setPKPa(Number(e.target.value))}
                  className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 font-mono-num text-[#F1F5F9] focus:border-[#38BDF8]"
                />
              </label>

              {lookupMode === 'PT' && (
                <label className="space-y-1.5">
                  <span className="text-[#94A3B8] font-medium block">Temperatura T [°C]</span>
                  <input
                    type="number"
                    value={TC}
                    onChange={(e) => setTC(Number(e.target.value))}
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 font-mono-num text-[#F1F5F9] focus:border-[#38BDF8]"
                  />
                </label>
              )}
              {lookupMode === 'PX' && (
                <label className="space-y-1.5">
                  <span className="text-[#94A3B8] font-medium block">Calidad x [0..1]</span>
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 font-mono-num text-[#F1F5F9] focus:border-[#38BDF8]"
                  />
                </label>
              )}
              {lookupMode === 'PS' && (
                <label className="space-y-1.5">
                  <span className="text-[#94A3B8] font-medium block">Entropía s [kJ/(kg·K)]</span>
                  <input
                    type="number"
                    step={0.01}
                    value={sInput}
                    onChange={(e) => setSInput(Number(e.target.value))}
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 font-mono-num text-[#F1F5F9] focus:border-[#38BDF8]"
                  />
                </label>
              )}
              {lookupMode === 'PH' && (
                <label className="space-y-1.5">
                  <span className="text-[#94A3B8] font-medium block">Entalpía h [kJ/kg]</span>
                  <input
                    type="number"
                    step={1}
                    value={hInput}
                    onChange={(e) => setHInput(Number(e.target.value))}
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 font-mono-num text-[#F1F5F9] focus:border-[#38BDF8]"
                  />
                </label>
              )}
            </div>

            {if97State.ok ? (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg bg-[#091120] border border-[#2DD4BF]/35">
                  <span className="font-semibold text-[#2DD4BF]">
                    Fase detectada: {if97State.value.phase}
                  </span>
                  {if97State.value.quality !== null && (
                    <span className="font-mono-num font-semibold text-[#F59E0B]">
                      Título x = {formatCL(if97State.value.quality, 4)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <MetricTile
                    label="Temperatura"
                    value={formatCL(if97State.value.TK - 273.15, 3)}
                    unit="°C"
                    caption={`${formatCL(if97State.value.TK, 3)} K`}
                    tone="amber"
                  />
                  <MetricTile
                    label="Presión"
                    value={formatCL(if97State.value.pPa / 1e3, 2)}
                    unit="kPa"
                    tone="cyan"
                  />
                  <MetricTile
                    label="Entalpía h"
                    value={formatCL(if97State.value.hJkg / 1e3, 3)}
                    unit="kJ/kg"
                    tone="teal"
                  />
                  <MetricTile
                    label="Energía int. u"
                    value={formatCL(if97State.value.uJkg / 1e3, 3)}
                    unit="kJ/kg"
                    tone="neutral"
                  />
                  <MetricTile
                    label="Entropía s"
                    value={formatCL(if97State.value.sJkgK / 1e3, 5)}
                    unit="kJ/(kg·K)"
                    tone="cyan"
                  />
                  <MetricTile
                    label="Volumen esp. v"
                    value={formatCL(if97State.value.vM3kg, 6)}
                    unit="m³/kg"
                    tone="neutral"
                  />
                </div>
              </div>
            ) : (
              <div role="alert" className="bg-[#1D1219] border border-[#F87171]/50 rounded-xl p-3.5 text-xs text-[#F87171] space-y-1">
                <div className="font-semibold">Error de dominio: {if97State.error.message}</div>
                <p className="text-[#CBD5E1]">{if97State.error.physicalExplanation}</p>
              </div>
            )}
          </div>

          {/* Calculadora de interpolación lineal visible */}
          <div className="lg:col-span-6 ft-panel p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-[#F1F5F9]">
                Interpolación lineal paso a paso (estilo tablas impresas / Caso 4B)
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Introduce dos filas vecinas (x₀, y₀) y (x₁, y₁) junto al valor objetivo x para obtener la fracción α y el valor interpolado y.
              </p>
            </div>

            <div className="ft-well px-3.5 py-2.5 text-[#F1F5F9]">
              <MathBlock latex={String.raw`y = y_0 + \frac{x - x_0}{x_1 - x_0}(y_1 - y_0)`} display />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              {[
                { label: 'x₀', val: ix0, set: setIx0 },
                { label: 'y₀', val: iy0, set: setIy0 },
                { label: 'x₁', val: ix1, set: setIx1 },
                { label: 'y₁', val: iy1, set: setIy1 },
                { label: 'x objetivo', val: ixTarget, set: setIxTarget },
              ].map((f) => (
                <label key={f.label} className="space-y-1">
                  <span className="text-[#94A3B8] font-medium block">{f.label}</span>
                  <input
                    type="number"
                    step="any"
                    value={f.val}
                    onChange={(e) => f.set(Number(e.target.value))}
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-2.5 py-1.5 font-mono-num text-[#F1F5F9] focus:border-[#38BDF8]"
                  />
                </label>
              ))}
            </div>

            {interpRes.ok ? (
              <div className="bg-[#091120] border border-[#38BDF8]/35 rounded-xl p-4 space-y-2 text-xs font-mono-num text-[#F1F5F9]">
                {interpRes.value.steps.map((s, idx) => (
                  <p key={idx} className={idx === 2 ? 'text-[#F59E0B] font-semibold' : 'text-[#CBD5E1]'}>
                    {s}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#F87171]">{interpRes.error.message}</p>
            )}

            <PedagogicBlock kind="concept" title="Cuándo interpolar vs usar IF97 directo">
              En certamen impreso interpolas linealmente entre filas contiguas de presión o temperatura. En este laboratorio puedes comparar la interpolación manual del Caso 4B contra la evaluación continua IAPWS-IF97.
            </PedagogicBlock>
          </div>
        </div>
      )}

      {/* TAB 2: Conversor de Unidades y Analizador Dimensional */}
      {tab === 'units' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ft-panel p-5 sm:p-6 space-y-4 text-xs">
            <h2 className="font-display text-base font-bold text-[#F1F5F9]">
              Conversor SI de Termodinámica
            </h2>

            {/* Presión */}
            <div className="ft-well p-3.5 space-y-2">
              <div className="text-[#38BDF8] font-semibold">Presión</div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  aria-label="Valor de presión"
                  value={pVal}
                  onChange={(e) => setPVal(Number(e.target.value))}
                  className="w-28 bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 font-mono-num text-[#F1F5F9]"
                />
                <select
                  aria-label="Unidad origen de presión"
                  value={pFrom}
                  onChange={(e) => setPFrom(e.target.value as PressureUnit)}
                  className="bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 text-[#F1F5F9]"
                >
                  {['Pa', 'kPa', 'MPa', 'bar', 'atm'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <span className="text-[#94A3B8]">→</span>
                <select
                  aria-label="Unidad destino de presión"
                  value={pTo}
                  onChange={(e) => setPTo(e.target.value as PressureUnit)}
                  className="bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 text-[#F1F5F9]"
                >
                  {['Pa', 'kPa', 'MPa', 'bar', 'atm'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <span className="font-mono-num text-sm font-bold text-[#2DD4BF]">
                  = {formatCL(fromPa(toPa(pVal, pFrom), pTo), 4)} {pTo}
                </span>
              </div>
            </div>

            {/* Temperatura */}
            <div className="ft-well p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[#38BDF8] font-semibold mb-1.5">Temperatura absoluta (°C → K)</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    aria-label="Temperatura en grados Celsius"
                    value={tValC}
                    onChange={(e) => setTValC(Number(e.target.value))}
                    className="w-28 bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 font-mono-num text-[#F1F5F9]"
                  />
                  <span className="text-[#94A3B8]">°C</span>
                </div>
              </div>
              <div className="font-mono-num text-sm font-bold text-[#2DD4BF]">
                = {formatCL(cToK(tValC), 2)} K
              </div>
            </div>

            {/* Potencia */}
            <div className="ft-well p-3.5 space-y-2">
              <div className="text-[#38BDF8] font-semibold">Potencia</div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  aria-label="Valor de potencia"
                  value={powVal}
                  onChange={(e) => setPowVal(Number(e.target.value))}
                  className="w-28 bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 font-mono-num text-[#F1F5F9]"
                />
                <select
                  aria-label="Unidad origen de potencia"
                  value={powFrom}
                  onChange={(e) => setPowFrom(e.target.value as PowerUnit)}
                  className="bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 text-[#F1F5F9]"
                >
                  {['W', 'kW', 'MW', 'HP'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <span className="text-[#94A3B8]">→</span>
                <select
                  aria-label="Unidad destino de potencia"
                  value={powTo}
                  onChange={(e) => setPowTo(e.target.value as PowerUnit)}
                  className="bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 text-[#F1F5F9]"
                >
                  {['W', 'kW', 'MW', 'HP'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <span className="font-mono-num text-sm font-bold text-[#2DD4BF]">
                  = {formatCL(fromWatts(toWatts(powVal, powFrom), powTo), 3)} {powTo}
                </span>
              </div>
            </div>

            {/* Energía y Caudal másico */}
            <div className="ft-well p-3.5 space-y-2.5">
              <div className="text-[#38BDF8] font-semibold">Energía y Caudal másico</div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  aria-label="Valor de energía"
                  value={eVal}
                  onChange={(e) => setEVal(Number(e.target.value))}
                  className="w-24 bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 font-mono-num text-[#F1F5F9]"
                />
                <select
                  aria-label="Unidad origen de energía"
                  value={eFrom}
                  onChange={(e) => setEFrom(e.target.value as EnergyUnit)}
                  className="bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 text-[#F1F5F9]"
                >
                  {['J', 'kJ', 'MJ', 'kWh'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <span className="text-[#94A3B8]">→</span>
                <select
                  aria-label="Unidad destino de energía"
                  value={eTo}
                  onChange={(e) => setETo(e.target.value as EnergyUnit)}
                  className="bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 text-[#F1F5F9]"
                >
                  {['J', 'kJ', 'MJ', 'kWh'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <span className="font-mono-num font-bold text-[#2DD4BF]">
                  = {formatCL(fromJoules(toJoules(eVal, eFrom), eTo), 4)} {eTo}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1E314A]">
                <input
                  type="number"
                  aria-label="Valor de caudal másico"
                  value={mVal}
                  onChange={(e) => setMVal(Number(e.target.value))}
                  className="w-24 bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 font-mono-num text-[#F1F5F9]"
                />
                <select
                  aria-label="Unidad origen de caudal másico"
                  value={mFrom}
                  onChange={(e) => setMFrom(e.target.value as MassFlowUnit)}
                  className="bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 text-[#F1F5F9]"
                >
                  {['kg/s', 'kg/min', 'kg/h'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <span className="text-[#94A3B8]">→</span>
                <select
                  aria-label="Unidad destino de caudal másico"
                  value={mTo}
                  onChange={(e) => setMTo(e.target.value as MassFlowUnit)}
                  className="bg-[#0F1A2E] border border-[#1E314A] rounded-lg px-2.5 py-1.5 text-[#F1F5F9]"
                >
                  {['kg/s', 'kg/min', 'kg/h'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <span className="font-mono-num font-bold text-[#2DD4BF]">
                  = {formatCL(fromKgPerS(toKgPerS(mVal, mFrom), mTo), 4)} {mTo}
                </span>
              </div>
            </div>
          </div>

          {/* Verificador dimensional */}
          <div className="ft-panel p-5 sm:p-6 space-y-4 text-xs">
            <h2 className="font-display text-base font-bold text-[#F1F5F9]">
              Verificador dimensional de fórmulas típicas
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {(['w=vDp', 'PV=mRT', 'Q=mcDT', 'Wdot=mdot*w', 'Carnot=1-TL/TH'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDimFormula(f)}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer font-mono-num transition-colors ${
                    dimFormula === f
                      ? 'bg-[#38BDF8] text-[#070D18] border-[#38BDF8] font-semibold'
                      : 'bg-[#091120] text-[#94A3B8] border-[#1E314A] hover:text-[#F1F5F9]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {dimFormula === 'w=vDp' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[#94A3B8] font-medium block">Unidad de Δp</span>
                  <select
                    value={dimSelections.dp}
                    onChange={(e) => setDimSelections((s) => ({ ...s, dp: e.target.value }))}
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 text-[#F1F5F9]"
                  >
                    <option value="kPa">kPa (directo kJ/kg)</option>
                    <option value="Pa">Pa (entrega J/kg)</option>
                    <option value="MPa">MPa (entrega MJ/kg)</option>
                  </select>
                </label>
              </div>
            )}

            {dimFormula === 'PV=mRT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[#94A3B8] font-medium block">Presión p</span>
                  <select
                    value={dimSelections.p}
                    onChange={(e) => setDimSelections((s) => ({ ...s, p: e.target.value }))}
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 text-[#F1F5F9]"
                  >
                    <option value="kPa_abs">kPa absoluta</option>
                    <option value="kPa_man">kPa manométrica</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[#94A3B8] font-medium block">Temperatura T</span>
                  <select
                    value={dimSelections.T}
                    onChange={(e) => setDimSelections((s) => ({ ...s, T: e.target.value }))}
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 text-[#F1F5F9]"
                  >
                    <option value="K">Kelvin (K)</option>
                    <option value="degC">Grados Celsius (°C)</option>
                  </select>
                </label>
              </div>
            )}

            {dimFormula === 'Carnot=1-TL/TH' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[#94A3B8] font-medium block">Escala de T_L y T_H</span>
                  <select
                    value={dimSelections.TL}
                    onChange={(e) =>
                      setDimSelections((s) => ({ ...s, TL: e.target.value, TH: e.target.value }))
                    }
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 text-[#F1F5F9]"
                  >
                    <option value="K">Kelvin (K)</option>
                    <option value="degC">Celsius (°C)</option>
                  </select>
                </label>
              </div>
            )}

            {dimFormula === 'Wdot=mdot*w' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[#94A3B8] font-medium block">Caudal ṁ</span>
                  <select
                    value={dimSelections.mdot}
                    onChange={(e) => setDimSelections((s) => ({ ...s, mdot: e.target.value }))}
                    className="w-full bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2 text-[#F1F5F9]"
                  >
                    <option value="kg/s">kg/s</option>
                    <option value="kg/h">kg/h</option>
                  </select>
                </label>
              </div>
            )}

            <div
              className={`rounded-xl p-4 border space-y-1.5 ${
                dimCheck.valid
                  ? 'bg-[#0A1A26] border-[#2DD4BF]/45 text-[#2DD4BF]'
                  : 'bg-[#1A1611] border-[#F59E0B]/45 text-[#F59E0B]'
              }`}
            >
              <div className="font-semibold">
                {dimCheck.valid ? 'Consistente: ' : 'Atención dimensional: '}
                {dimCheck.resultingUnit}
              </div>
              <p className="text-[#CBD5E1] leading-relaxed">{dimCheck.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Diccionario de símbolos y glosario */}
      {tab === 'glossary' && (
        <div className="space-y-6">
          <div className="ft-panel p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-[#F1F5F9]">
              Diccionario de símbolos de Termodinámica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {SYMBOL_DICTIONARY.map((sym) => (
                <div key={sym.symbol} className="ft-well p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#38BDF8] font-semibold">
                      <MathBlock latex={sym.latex} />
                    </span>
                    <span className="font-mono-num text-[#2DD4BF]">{sym.practicalUnit}</span>
                  </div>
                  <div className="font-semibold text-[#F1F5F9]">{sym.name}</div>
                  <div className="text-[11px] text-[#94A3B8]">
                    {sym.category} · SI: {sym.unitSI}
                  </div>
                  <p className="text-[#CBD5E1] leading-relaxed">{sym.meaning}</p>
                  <p className="text-[#F59E0B] leading-relaxed">Trampa típica: {sym.typicalTrap}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ft-panel p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-[#F1F5F9]">
              Glosario contextual de conceptos clave
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {GLOSSARY_TERMS.map((g) => (
                <div key={g.id} className="ft-well p-4 space-y-1.5">
                  <div className="font-semibold text-[#2DD4BF]">{g.term}</div>
                  <p className="text-[#F1F5F9] leading-relaxed">{g.shortDef}</p>
                  <p className="text-[#94A3B8] leading-relaxed">{g.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Método 7 pasos y clasificador de sistemas */}
      {tab === 'method' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ft-panel p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-[#F1F5F9]">
              Método estándar de resolución en 7 pasos
            </h2>
            <ol className="space-y-2.5 text-xs">
              {SEVEN_STEP_METHOD.map((st) => (
                <li key={st.step} className="ft-well p-3.5 space-y-1">
                  <div className="font-semibold text-[#38BDF8]">
                    {String(st.step).padStart(2, '0')}. {st.title}
                  </div>
                  <p className="text-[#94A3B8] leading-relaxed">{st.question}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="ft-panel p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-[#F1F5F9]">
              Clasificador guiado: Sistema Cerrado vs Volumen de Control
            </h2>
            <div className="space-y-3 text-xs">
              {SYSTEM_CLASSIFICATION_ITEMS.map((item) => {
                const picked = sysAnswers[item.id];
                const ok = picked === item.correctType;
                return (
                  <div key={item.id} className="ft-well p-3.5 space-y-2.5">
                    <div className="font-medium text-[#F1F5F9] leading-relaxed">{item.scenario}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(['cerrado', 'abierto', 'aislado'] as const).map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => setSysAnswers((prev) => ({ ...prev, [item.id]: choice }))}
                          className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                            picked === choice
                              ? ok
                                ? 'bg-[#0A1A26] border-[#2DD4BF] text-[#2DD4BF] font-semibold'
                                : 'bg-[#1D1219] border-[#F87171] text-[#F87171] font-semibold'
                              : 'bg-[#0F1A2E] border-[#1E314A] text-[#94A3B8] hover:text-[#F1F5F9]'
                          }`}
                        >
                          Sistema {choice}
                        </button>
                      ))}
                      {picked && ok && <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" aria-label="Correcto" />}
                    </div>
                    {picked && (
                      <p className={ok ? 'text-[#2DD4BF] leading-relaxed' : 'text-[#F59E0B] leading-relaxed'}>
                        {item.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
