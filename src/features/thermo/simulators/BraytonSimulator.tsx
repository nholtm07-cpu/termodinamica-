import React, { useMemo, useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { solveBrayton, type BraytonMode } from '../../../core/thermo/brayton';
import { formatCL } from '../../../core/thermo/units';
import { AuditPanel } from '../../../components/AuditPanel';
import { PizarraProfesor } from '../../../components/PizarraProfesor';
import { SciChart } from '../../../components/charts/ThermoCharts';
import {
  BaselineComparator,
  InstrumentSlider,
  MetricTile,
  ModuleHero,
} from '../../../components/ui/LabPrimitives';

const MODE_OPTIONS: Array<{ id: BraytonMode; label: string; desc: string }> = [
  { id: 'simple', label: 'Brayton simple', desc: 'Compresor + cámara + turbina (4 estados)' },
  { id: 'regenerative', label: 'Regenerativo', desc: 'Recupera calor de escape (T4 > T2)' },
  {
    id: 'intercooling-reheat-regen',
    label: 'Ciclo 10 estados',
    desc: 'Interenfriamiento + recalentamiento + regeneración',
  },
  {
    id: 'two-stage-compression',
    label: 'Compresión 2 etapas',
    desc: 'Optimización de p_i* = √(p1·p2)',
  },
];

export const BraytonSimulator: React.FC = () => {
  const [mode, setMode] = useState<BraytonMode>('simple');
  const [p1KPa, setP1KPa] = useState<number>(100);
  const [p2KPa, setP2KPa] = useState<number>(480);
  const [T1C, setT1C] = useState<number>(20);
  const [T3C, setT3C] = useState<number>(880);
  const [etaC, setEtaC] = useState<number>(1.0);
  const [etaT, setEtaT] = useState<number>(1.0);
  const [epsRegen, setEpsRegen] = useState<number>(0.8);
  const [pIntManual, setPIntManual] = useState<number>(Math.round(Math.sqrt(100 * 480)));
  const [useOptPi, setUseOptPi] = useState<boolean>(true);
  const [massFlowKgS, setMassFlowKgS] = useState<number>(20);
  const [selectedStateId, setSelectedStateId] = useState<string>('3');

  const restoreLectureDefaults = () => {
    setMode('simple');
    setP1KPa(100);
    setP2KPa(480);
    setT1C(20);
    setT3C(880);
    setEtaC(1.0);
    setEtaT(1.0);
    setEpsRegen(0.8);
    setUseOptPi(true);
    setPIntManual(219);
    setMassFlowKgS(20);
  };

  const loadPreset = (preset: 'real-80' | 'opt-rp' | 'full-10' | 'two-stage') => {
    if (preset === 'real-80') {
      setMode('simple');
      setP1KPa(100);
      setP2KPa(480);
      setT1C(20);
      setT3C(880);
      setEtaC(0.8);
      setEtaT(0.8);
    } else if (preset === 'opt-rp') {
      setMode('simple');
      setP1KPa(100);
      setP2KPa(945);
      setT1C(200);
      setT3C(1426.85);
      setEtaC(1.0);
      setEtaT(1.0);
    } else if (preset === 'full-10') {
      setMode('intercooling-reheat-regen');
      setP1KPa(100);
      setP2KPa(1000);
      setT1C(25);
      setT3C(1100);
      setEtaC(0.85);
      setEtaT(0.88);
      setEpsRegen(0.82);
      setUseOptPi(true);
    } else {
      setMode('two-stage-compression');
      setP1KPa(100);
      setP2KPa(900);
      setT1C(20);
      setT3C(880);
      setEtaC(0.85);
      setUseOptPi(true);
      setPIntManual(300);
    }
  };

  const result = useMemo(
    () =>
      solveBrayton({
        mode,
        p1KPa,
        p2KPa,
        T1C,
        T3C,
        etaC,
        etaT,
        epsRegen,
        pIntermediateKPa: useOptPi ? undefined : pIntManual,
        massFlowKgS,
      }),
    [mode, p1KPa, p2KPa, T1C, T3C, etaC, etaT, epsRegen, useOptPi, pIntManual, massFlowKgS]
  );

  const exportCsv = () => {
    if (!result.ok) return;
    const header = 'Estado,Descripcion,p[kPa],T[C],T[K],v[m3/kg],h[kJ/kg],s_rel[kJ/(kg*K)]\n';
    const rows = result.value.states
      .map(
        (s) =>
          `${s.id},"${s.label}",${s.pKPa.toFixed(2)},${s.TC.toFixed(2)},${s.TK.toFixed(2)},${s.vM3kg.toFixed(5)},${s.hRelKJkg.toFixed(2)},${s.sRelKJkgK.toFixed(5)}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brayton_${mode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeData = result.ok ? result.value : null;
  const inspectedState =
    activeData?.states.find((s) => s.id === selectedStateId) ?? activeData?.states[0] ?? null;

  const modifiedCount =
    (mode !== 'simple' ? 1 : 0) +
    (p1KPa !== 100 ? 1 : 0) +
    (p2KPa !== 480 ? 1 : 0) +
    (T1C !== 20 ? 1 : 0) +
    (T3C !== 880 ? 1 : 0) +
    (Math.abs(etaC - 1.0) > 1e-6 ? 1 : 0) +
    (Math.abs(etaT - 1.0) > 1e-6 ? 1 : 0) +
    (massFlowKgS !== 20 ? 1 : 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Simulador 3 · MEC110_8 · Modelo Aire-Estándar"
        title="Planta de Turbina de Gas Brayton y Compresión Multietapa"
        subtitle="Evalúa r_p*, irreversibilidades independientes η_c y η_t, regeneración con guardia T4 > T2 y topología completa de 10 estados."
        accent="cyan"
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={restoreLectureDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#091120] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              Restaurar valores de cátedra
            </button>
            <button
              type="button"
              disabled={!activeData}
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#091120] text-[#2DD4BF] hover:border-[#2DD4BF] disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Exportar estados CSV
            </button>
          </div>
        }
      />

      {/* Selector de modo + casos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5" role="tablist" aria-label="Modos de Brayton">
        {MODE_OPTIONS.map((opt) => {
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(opt.id)}
              className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#14223B] border-[#38BDF8]/80 text-[#F1F5F9]'
                  : 'bg-[#0F1A2E] border-[#1E314A] text-[#94A3B8] hover:border-[#2C4668] hover:text-[#F1F5F9]'
              }`}
            >
              <div className="font-display text-sm font-semibold">{opt.label}</div>
              <div className="text-xs opacity-85 mt-0.5">{opt.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[#94A3B8] font-medium">Escenarios rápidos:</span>
        <button
          type="button"
          onClick={restoreLectureDefaults}
          className="px-3 py-1.5 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
        >
          Cátedra ideal (100→480 kPa, 880 °C)
        </button>
        <button
          type="button"
          onClick={() => loadPreset('real-80')}
          className="px-3 py-1.5 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
        >
          Real η_c=η_t=80 %
        </button>
        <button
          type="button"
          onClick={() => loadPreset('opt-rp')}
          className="px-3 py-1.5 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
        >
          Óptimo r_p* (T1=473 K, T3=1700 K)
        </button>
        <button
          type="button"
          onClick={() => loadPreset('full-10')}
          className="px-3 py-1.5 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
        >
          Planta 10 estados (1 MPa)
        </button>
        <button
          type="button"
          onClick={() => loadPreset('two-stage')}
          className="px-3 py-1.5 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
        >
          Compresión 2 etapas (100→900 kPa)
        </button>
      </div>

      <BaselineComparator
        isModified={modifiedCount > 0}
        modifiedCount={modifiedCount}
        sourceLabel="Brayton ideal de cátedra"
        onRestore={restoreLectureDefaults}
      />

      {/* Cuerpo principal: controles a la izquierda + esquema e indicadores */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-4 ft-panel p-5 space-y-3.5">
          <h3 className="font-display text-sm font-bold text-[#F1F5F9] border-b border-[#1E314A] pb-2.5">
            Parámetros de operación
          </h3>

          <InstrumentSlider id="br-p1" label="Presión admisión p1" value={p1KPa} min={50} max={200} step={5} unit="kPa" defaultValue={100} onChange={setP1KPa} />
          <InstrumentSlider id="br-p2" label="Presión alta p2" value={p2KPa} min={200} max={2500} step={10} unit="kPa" defaultValue={480} onChange={setP2KPa} />
          <InstrumentSlider id="br-t1" label="Temperatura entrada T1" value={T1C} min={-10} max={250} step={5} unit="°C" defaultValue={20} onChange={setT1C} />
          {mode !== 'two-stage-compression' && (
            <InstrumentSlider id="br-t3" label="Temperatura máx. turbina T3" value={T3C} min={500} max={1500} step={10} unit="°C" defaultValue={880} onChange={setT3C} />
          )}
          <InstrumentSlider
            id="br-etac"
            label="Eficiencia compresor η_c"
            value={Math.round(etaC * 100)}
            min={50}
            max={100}
            step={1}
            unit="%"
            defaultValue={100}
            onChange={(v) => setEtaC(v / 100)}
          />
          {mode !== 'two-stage-compression' && (
            <InstrumentSlider
              id="br-etat"
              label="Eficiencia turbina η_t"
              value={Math.round(etaT * 100)}
              min={50}
              max={100}
              step={1}
              unit="%"
              defaultValue={100}
              onChange={(v) => setEtaT(v / 100)}
            />
          )}
          {(mode === 'regenerative' || mode === 'intercooling-reheat-regen') && (
            <InstrumentSlider
              id="br-eps"
              label="Efectividad regenerador ε_reg"
              value={Math.round(epsRegen * 100)}
              min={0}
              max={98}
              step={2}
              unit="%"
              defaultValue={80}
              onChange={(v) => setEpsRegen(v / 100)}
            />
          )}
          {(mode === 'two-stage-compression' || mode === 'intercooling-reheat-regen') && (
            <div className="space-y-2.5 pt-2 border-t border-[#1E314A]">
              <label className="flex items-center gap-2 text-xs text-[#F1F5F9] cursor-pointer">
                <input
                  type="checkbox"
                  checked={useOptPi}
                  onChange={(e) => setUseOptPi(e.target.checked)}
                  className="accent-[#38BDF8]"
                />
                Usar presión intermedia óptima √(p1·p2)
              </label>
              {!useOptPi && (
                <InstrumentSlider
                  id="br-pi"
                  label="Presión intermedia p_i manual"
                  value={pIntManual}
                  min={p1KPa + 10}
                  max={Math.max(p1KPa + 20, p2KPa - 10)}
                  step={5}
                  unit="kPa"
                  onChange={setPIntManual}
                />
              )}
            </div>
          )}
          <InstrumentSlider id="br-mdot" label="Flujo másico de aire ṁ" value={massFlowKgS} min={1} max={120} step={1} unit="kg/s" defaultValue={20} onChange={setMassFlowKgS} />
        </div>

        {/* Esquema industrial cutaway + métricas */}
        <div className="xl:col-span-8 space-y-4">
          {!result.ok ? (
            <div
              role="alert"
              className="bg-[#1D1219] border border-[#F87171]/60 rounded-xl p-5 text-sm text-[#F87171] space-y-1.5"
            >
              <div className="font-semibold">{result.error.message}</div>
              <p className="text-xs text-[#CBD5E1]">{result.error.physicalExplanation}</p>
              <p className="text-xs text-[#94A3B8]">Sugerencia: {result.error.suggestedFix}</p>
            </div>
          ) : activeData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricTile
                  label="Relación presiones r_p"
                  value={formatCL(activeData.rp, 2)}
                  caption={`r_p* máx: ${formatCL(activeData.rpOptWork, 2)}`}
                  tone="cyan"
                />
                <MetricTile
                  label={mode === 'two-stage-compression' ? 'Trabajo compresor w_c' : 'Trabajo neto w_neto'}
                  value={formatCL(mode === 'two-stage-compression' ? activeData.wcKJkg : activeData.wNetKJkg, 2)}
                  unit="kJ/kg"
                  caption={`Potencia: ${formatCL(Math.abs(activeData.powerNetKW) / 1000, 2)} MW`}
                  tone="teal"
                />
                <MetricTile
                  label={mode === 'two-stage-compression' ? 'p_i óptima teórica' : 'Eficiencia térmica η_th'}
                  value={
                    mode === 'two-stage-compression'
                      ? formatCL(activeData.piOptKPa, 1)
                      : formatCL(activeData.etaThermal * 100, 2)
                  }
                  unit={mode === 'two-stage-compression' ? 'kPa' : '%'}
                  caption={
                    mode === 'two-stage-compression'
                      ? `q_inter = ${formatCL(activeData.qOutKJkg, 1)} kJ/kg`
                      : `Ideal simple: ${formatCL(activeData.etaIdealSimple * 100, 2)} %`
                  }
                  tone="amber"
                />
                <MetricTile
                  label="Razón retroceso (bwr)"
                  value={formatCL(activeData.backWorkRatio * 100, 1)}
                  unit="%"
                  caption={`w_c = ${formatCL(activeData.wcKJkg, 1)} kJ/kg`}
                  tone={activeData.backWorkRatio > 0.75 ? 'crimson' : 'cyan'}
                />
              </div>

              {/* Esquema interactivo cutaway SVG */}
              <div className="ft-panel p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-bold text-[#F1F5F9]">
                    Esquema de planta e inspección de estados
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" aria-hidden="true" /> Baja T
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" aria-hidden="true" /> Media T
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#F87171]" aria-hidden="true" /> Alta T (combustión)
                    </span>
                  </div>
                </div>

                <BraytonPlantSVG
                  mode={mode}
                  states={activeData.states}
                  regenUseful={activeData.regenUseful}
                  selectedId={inspectedState?.id ?? '1'}
                  onSelectState={setSelectedStateId}
                />

                {inspectedState && (
                  <div className="ft-well px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono-num font-bold text-[#38BDF8]">
                        Estado {inspectedState.id}
                      </span>{' '}
                      <span className="text-[#F1F5F9] font-medium">· {inspectedState.label}</span>
                    </div>
                    <div className="font-mono-num text-[#2DD4BF] flex flex-wrap gap-4">
                      <span>p = {formatCL(inspectedState.pKPa, 1)} kPa</span>
                      <span>T = {formatCL(inspectedState.TC, 1)} °C ({formatCL(inspectedState.TK, 1)} K)</span>
                      <span>v = {formatCL(inspectedState.vM3kg, 4)} m³/kg</span>
                      <span>h = {formatCL(inspectedState.hRelKJkg, 1)} kJ/kg</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Diagramas sincronizados T-s, P-v y Barrido / Sensibilidad */}
      {activeData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mode !== 'two-stage-compression' ? (
              <SciChart
                title="Diagrama T–s (Aire Estándar)"
                subtitle="Compara trayectoria ideal isentrópica (punteada) frente a expansión/compresión real"
                xLabel="Entropía relativa s − s1 [kJ/(kg·K)]"
                yLabel="Temperatura T [K]"
                xDecimals={3}
                yDecimals={0}
                series={[
                  {
                    id: 'br-ideal',
                    name: 'Ciclo ideal',
                    color: '#38BDF8',
                    dashed: true,
                    showNodes: false,
                    points: activeData.tsCurve
                      .filter((p) => p.branch === 'ideal')
                      .map((p) => ({ x: p.s, y: p.T })),
                  },
                  {
                    id: 'br-real',
                    name: 'Ciclo activo (real)',
                    color: '#F59E0B',
                    showNodes: false,
                    points: activeData.tsCurve
                      .filter((p) => p.branch === 'real')
                      .map((p) => ({ x: p.s, y: p.T })),
                  },
                  {
                    id: 'br-nodes',
                    name: 'Estados numerados',
                    color: '#2DD4BF',
                    showNodes: true,
                    points: activeData.states.map((st) => ({
                      id: st.id,
                      label: `${st.id} · ${st.label}`,
                      x: st.sRelKJkgK,
                      y: st.TK,
                      extra: `${formatCL(st.pKPa, 0)} kPa`,
                    })),
                  },
                ]}
              />
            ) : (
              <SciChart
                title="Optimización de presión intermedia p_i"
                subtitle="Mínimo trabajo específico en p_i* = √(p1·p2)"
                xLabel="Presión intermedia p_i [kPa]"
                yLabel="Trabajo total w_c [kJ/kg]"
                xDecimals={0}
                yDecimals={1}
                verticalMarkerX={{
                  x: activeData.piOptKPa,
                  label: `p_i* = ${formatCL(activeData.piOptKPa, 0)} kPa`,
                  color: '#2DD4BF',
                }}
                series={[
                  {
                    id: 'pi-sweep',
                    name: 'Trabajo compresión 2 etapas',
                    color: '#38BDF8',
                    showNodes: true,
                    points: activeData.rpSweep.map((pt) => ({
                      x: pt.rp,
                      y: pt.wNetKJkg,
                      label: `p_i=${formatCL(pt.rp, 0)} kPa`,
                    })),
                  },
                ]}
              />
            )}

            <SciChart
              title="Diagrama P–v sincronizado"
              subtitle="El volumen específico cae en el interenfriamiento y crece al calentar"
              xLabel="Volumen específico v [m³/kg]"
              yLabel="Presión absoluta p [kPa]"
              xDecimals={3}
              yDecimals={0}
              series={[
                {
                  id: 'pv-real',
                  name: 'Trayectoria activa',
                  color: '#2DD4BF',
                  showNodes: false,
                  points: activeData.pvCurve
                    .filter((p) => p.branch === 'real')
                    .map((p) => ({ x: p.v, y: p.p })),
                },
                {
                  id: 'pv-pts',
                  name: 'Estados del ciclo',
                  color: '#F59E0B',
                  showNodes: true,
                  points: activeData.states.map((st) => ({
                    id: st.id,
                    label: `${st.id} · ${st.label}`,
                    x: st.vM3kg,
                    y: st.pKPa,
                    extra: `${formatCL(st.TC, 0)} °C`,
                  })),
                },
              ]}
            />
          </div>

          {mode !== 'two-stage-compression' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <SciChart
                  title="Optimización de razón de presiones r_p"
                  subtitle={`Máximo trabajo neto en r_p* = ${formatCL(activeData.rpOptWork, 2)} (ideal); η crece monotónicamente`}
                  xLabel="Relación de presiones r_p = p2/p1"
                  yLabel="Trabajo neto w_neto [kJ/kg]"
                  xDecimals={1}
                  yDecimals={1}
                  verticalMarkerX={{
                    x: activeData.rp,
                    label: `r_p actual = ${formatCL(activeData.rp, 2)}`,
                    color: '#38BDF8',
                  }}
                  series={[
                    {
                      id: 'rp-wnet',
                      name: 'w_neto(r_p) [kJ/kg]',
                      color: '#2DD4BF',
                      showNodes: false,
                      points: activeData.rpSweep.map((p) => ({
                        x: p.rp,
                        y: p.wNetKJkg,
                        extra: `η=${formatCL(p.etaPct, 1)}%`,
                      })),
                    },
                  ]}
                />
              </div>

              <div className="lg:col-span-6 ft-panel p-5 flex flex-col gap-3">
                <div>
                  <h4 className="font-display text-sm font-bold text-[#F1F5F9]">
                    Sensibilidad dinámica a eficiencias isentrópicas (η_c = η_t)
                  </h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5 font-mono-num">
                    p1={formatCL(p1KPa, 0)} kPa, p2={formatCL(p2KPa, 0)} kPa, T1={formatCL(T1C, 0)} °C, T3={formatCL(T3C, 0)} °C
                  </p>
                </div>
                <div className="overflow-x-auto border border-[#1E314A] rounded-xl bg-[#091120]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0B1322] border-b border-[#1E314A] text-[#94A3B8]">
                        <th className="py-2 px-3 font-medium">η_c = η_t</th>
                        <th className="py-2 px-3 font-medium">w_c [kJ/kg]</th>
                        <th className="py-2 px-3 font-medium">w_t [kJ/kg]</th>
                        <th className="py-2 px-3 font-medium">w_neto [kJ/kg]</th>
                        <th className="py-2 px-3 font-medium">η_th [%]</th>
                        <th className="py-2 px-3 font-medium">bwr [%]</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono-num text-[#F1F5F9]">
                      {activeData.sensitivityTable.map((row) => {
                        const negative = row.wNetKJkg <= 0;
                        return (
                          <tr
                            key={row.etaPct}
                            className={`border-t border-[#1E314A]/60 ${negative ? 'text-[#F87171]' : ''}`}
                          >
                            <td className="py-2 px-3 font-semibold">{row.etaPct} %</td>
                            <td className="py-2 px-3">{formatCL(row.wcKJkg, 1)}</td>
                            <td className="py-2 px-3">{formatCL(row.wtKJkg, 1)}</td>
                            <td className="py-2 px-3 font-semibold">{formatCL(row.wNetKJkg, 1)}</td>
                            <td className="py-2 px-3">{formatCL(row.etaThPct, 2)} %</td>
                            <td className="py-2 px-3">{formatCL(row.backWorkRatioPct, 1)} %</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tabla completa de estados */}
          <div className="ft-panel p-5 space-y-3">
            <h4 className="font-display text-sm font-bold text-[#F1F5F9]">
              Tabla de estados termodinámicos ({activeData.states.length} estados)
            </h4>
            <div className="overflow-x-auto border border-[#1E314A] rounded-xl bg-[#091120]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B1322] border-b border-[#1E314A] text-[#94A3B8]">
                    <th className="py-2 px-3 font-medium">Estado</th>
                    <th className="py-2 px-3 font-medium">Descripción</th>
                    <th className="py-2 px-3 font-medium">p [kPa]</th>
                    <th className="py-2 px-3 font-medium">T [°C]</th>
                    <th className="py-2 px-3 font-medium">T [K]</th>
                    <th className="py-2 px-3 font-medium">v [m³/kg]</th>
                    <th className="py-2 px-3 font-medium">h [kJ/kg]</th>
                    <th className="py-2 px-3 font-medium">s−s1 [kJ/(kg·K)]</th>
                  </tr>
                </thead>
                <tbody className="font-mono-num text-[#F1F5F9]">
                  {activeData.states.map((st) => (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStateId(st.id)}
                      className={`border-t border-[#1E314A]/60 cursor-pointer hover:bg-[#14223B]/60 ${
                        inspectedState?.id === st.id ? 'bg-[#14223B]' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-[#38BDF8]">{st.id}</td>
                      <td className="py-2 px-3 font-sans">{st.label}</td>
                      <td className="py-2 px-3">{formatCL(st.pKPa, 1)}</td>
                      <td className="py-2 px-3">{formatCL(st.TC, 1)}</td>
                      <td className="py-2 px-3">{formatCL(st.TK, 1)}</td>
                      <td className="py-2 px-3">{formatCL(st.vM3kg, 4)}</td>
                      <td className="py-2 px-3">{formatCL(st.hRelKJkg, 1)}</td>
                      <td className="py-2 px-3">{formatCL(st.sRelKJkgK, 4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PizarraProfesor title="Ciclo Brayton" steps={activeData.steps} />
          <AuditPanel audit={activeData.audit} />
        </>
      )}
    </div>
  );
};

const BraytonPlantSVG: React.FC<{
  mode: BraytonMode;
  states: Array<{ id: string; TK: number; TC: number; pKPa: number }>;
  regenUseful: boolean;
  selectedId: string;
  onSelectState: (id: string) => void;
}> = ({ mode, states, regenUseful, selectedId, onSelectState }) => {
  const tempColor = (TC: number) =>
    TC > 600 ? '#F87171' : TC > 240 ? '#F59E0B' : '#38BDF8';

  return (
    <svg
      viewBox="0 0 640 230"
      role="img"
      aria-label="Esquema esquemático de turbina de gas Brayton"
      className="w-full h-auto bg-[#070D18] rounded-xl border border-[#1E314A]"
    >
      <line x1="90" y1="120" x2="550" y2="120" stroke="#475569" strokeWidth="4" />

      {mode === 'two-stage-compression' ? (
        <>
          <polygon points="105,90 175,100 175,140 105,150" fill="#14223B" stroke="#38BDF8" strokeWidth="2" />
          <text x="140" y="124" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">C1</text>

          <rect x="240" y="92" width="120" height="56" rx="6" fill="#0F1A2E" stroke="#2DD4BF" strokeWidth="2" />
          <text x="300" y="117" textAnchor="middle" fill="#2DD4BF" fontSize="11" fontWeight="600">Interenfriador</text>
          <text x="300" y="133" textAnchor="middle" fill="#94A3B8" fontSize="9">Enfriamiento isobárico p_i</text>

          <polygon points="425,95 495,105 495,135 425,145" fill="#14223B" stroke="#38BDF8" strokeWidth="2" />
          <text x="460" y="124" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">C2</text>

          <line x1="55" y1="120" x2="105" y2="120" stroke="#38BDF8" strokeWidth="2" />
          <line x1="175" y1="120" x2="240" y2="120" stroke="#F59E0B" strokeWidth="2" />
          <line x1="360" y1="120" x2="425" y2="120" stroke="#38BDF8" strokeWidth="2" />
          <line x1="495" y1="120" x2="585" y2="120" stroke="#F59E0B" strokeWidth="2" />
        </>
      ) : (
        <>
          <polygon points="110,90 190,100 190,140 110,150" fill="#14223B" stroke="#38BDF8" strokeWidth="2" />
          <text x="150" y="124" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">
            {mode === 'intercooling-reheat-regen' ? 'C1 + IC + C2' : 'Compresor'}
          </text>

          {(mode === 'regenerative' || mode === 'intercooling-reheat-regen') && (
            <g>
              <rect
                x="230"
                y="42"
                width="105"
                height="42"
                rx="4"
                fill="#0F1A2E"
                stroke={regenUseful ? '#2DD4BF' : '#F87171'}
                strokeWidth="1.8"
                strokeDasharray={regenUseful ? undefined : '4 3'}
              />
              <text x="282" y="61" textAnchor="middle" fill="#F1F5F9" fontSize="10" fontWeight="600">
                Regenerador
              </text>
              <text x="282" y="75" textAnchor="middle" fill={regenUseful ? '#2DD4BF' : '#F87171'} fontSize="9">
                {regenUseful ? 'Recuperación útil' : 'Desactivado (T4<=T2)'}
              </text>
            </g>
          )}

          <rect x="355" y="40" width="110" height="44" rx="6" fill="#14223B" stroke="#F87171" strokeWidth="2" />
          <text x="410" y="60" textAnchor="middle" fill="#F1F5F9" fontSize="10" fontWeight="600">
            Combustión
          </text>
          <text x="410" y="74" textAnchor="middle" fill="#F59E0B" fontSize="9">
            Q_in isobárico
          </text>

          <polygon points="480,100 560,90 560,150 480,140" fill="#14223B" stroke="#F59E0B" strokeWidth="2" />
          <text x="520" y="124" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">
            {mode === 'intercooling-reheat-regen' ? 'T1 + RH + T2' : 'Turbina'}
          </text>

          <path d="M 60 120 L 110 120" stroke="#38BDF8" strokeWidth="2" fill="none" />
          <path d="M 150 94 L 150 62 L 355 62" stroke="#F59E0B" strokeWidth="2" fill="none" />
          <path d="M 465 62 L 520 62 L 520 94" stroke="#F87171" strokeWidth="2.5" fill="none" />
          <path d="M 520 146 L 520 185 L 95 185 L 95 120" stroke="#2DD4BF" strokeWidth="1.8" strokeDasharray="4 3" fill="none" />
        </>
      )}

      {states.slice(0, 10).map((st, idx) => {
        const xPos = 64 + idx * (510 / Math.max(1, Math.min(10, states.length) - 1));
        const yPos = 205;
        const active = selectedId === st.id;
        return (
          <g
            key={st.id}
            tabIndex={0}
            role="button"
            aria-label={`Inspeccionar estado ${st.id}: ${formatCL(st.TC, 0)} °C`}
            className="cursor-pointer focus:outline-none"
            onClick={() => onSelectState(st.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectState(st.id);
              }
            }}
          >
            <circle
              cx={xPos}
              cy={yPos}
              r={active ? 11 : 9}
              fill={active ? tempColor(st.TC) : '#14223B'}
              stroke={tempColor(st.TC)}
              strokeWidth="2"
            />
            <text
              x={xPos}
              y={yPos + 3.5}
              textAnchor="middle"
              fill={active ? '#070D18' : '#F1F5F9'}
              fontSize="9.5"
              fontWeight="700"
              className="font-mono-num"
            >
              {st.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
