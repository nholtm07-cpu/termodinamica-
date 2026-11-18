import React, { useMemo, useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import {
  solveCarnotEngine,
  solveIceMaker,
  solveIntermittentFridge,
  solveWatermelonCooling,
} from '../../../core/thermo/carnotRefrig';
import { formatCL } from '../../../core/thermo/units';
import { AuditPanel } from '../../../components/AuditPanel';
import { PizarraProfesor } from '../../../components/PizarraProfesor';
import { SankeyEnergyDiagram, SciChart } from '../../../components/charts/ThermoCharts';
import {
  BaselineComparator,
  InstrumentSlider,
  MetricTile,
  ModuleHero,
} from '../../../components/ui/LabPrimitives';

type CarnotSubmode = 'carnot-500' | 'carnot-sources' | 'fridge' | 'watermelons' | 'ice-maker';

export const CarnotRefrigSimulator: React.FC = () => {
  const [submode, setSubmode] = useState<CarnotSubmode>('carnot-500');

  // M2-A Carnot 500/200 y general
  const [carnotEngineMode, setCarnotEngineMode] = useState<'carnot-ideal' | 'general-engine'>('carnot-ideal');
  const [solveTHRatio, setSolveTHRatio] = useState<boolean>(true);
  const [QH, setQH] = useState<number>(500);
  const [QL, setQL] = useState<number>(200);
  const [TH_C, setTH_C] = useState<number>(452.23);
  const [TL_C, setTL_C] = useState<number>(17);

  // M2-B Frigorífico intermitente
  const [qLAvgKJH, setQLAvgKJH] = useState<number>(1200);
  const [activeFrac, setActiveFrac] = useState<number>(0.25);
  const [fridgeCop, setFridgeCop] = useState<number>(2.5);

  // M2-C Sandías
  const [fruitCount, setFruitCount] = useState<number>(5);
  const [fruitMass, setFruitMass] = useState<number>(10);
  const [wmTiC, setWmTiC] = useState<number>(20);
  const [wmTfC, setWmTfC] = useState<number>(8);
  const [wmPowerW, setWmPowerW] = useState<number>(450);
  const [wmCop, setWmCop] = useState<number>(4.5);
  const [wmLeakW, setWmLeakW] = useState<number>(0);

  // M2-D Hielo
  const [iceKgH, setIceKgH] = useState<number>(12);
  const [iceTinC, setIceTinC] = useState<number>(15);
  const [iceToutC, setIceToutC] = useState<number>(-5);
  const [iceCop, setIceCop] = useState<number>(2.4);

  const restoreDefaults = () => {
    setCarnotEngineMode('carnot-ideal');
    setSolveTHRatio(true);
    setQH(500);
    setQL(200);
    setTH_C(452.23);
    setTL_C(17);
    setQLAvgKJH(1200);
    setActiveFrac(0.25);
    setFridgeCop(2.5);
    setFruitCount(5);
    setFruitMass(10);
    setWmTiC(20);
    setWmTfC(8);
    setWmPowerW(450);
    setWmCop(4.5);
    setWmLeakW(0);
    setIceKgH(12);
    setIceTinC(15);
    setIceToutC(-5);
    setIceCop(2.4);
  };

  const carnotRes = useMemo(
    () =>
      solveCarnotEngine({
        mode: carnotEngineMode,
        QHKJ: QH,
        QLKJ: QL,
        TH_C,
        TL_C,
        solveTHFromQRatio: solveTHRatio && carnotEngineMode === 'carnot-ideal',
      }),
    [carnotEngineMode, QH, QL, TH_C, TL_C, solveTHRatio]
  );

  const threeSources = useMemo(() => {
    const TLow = 20;
    const sources = [
      { name: 'Carbón (llama ref.)', TH_C: 1200 },
      { name: 'Geotermia', TH_C: 140 },
      { name: 'Estanque solar', TH_C: 80 },
    ];
    return sources.map((s) => {
      const res = solveCarnotEngine({
        mode: 'carnot-ideal',
        QHKJ: 1000,
        TH_C: s.TH_C,
        TL_C: TLow,
      });
      return {
        ...s,
        etaPct: res.ok ? res.value.etaCarnotMax * 100 : 0,
        TH_K: s.TH_C + 273.15,
      };
    });
  }, []);

  const fridgeRes = useMemo(
    () => solveIntermittentFridge({ qLAvgKJH, activeFraction: activeFrac, copR: fridgeCop }),
    [qLAvgKJH, activeFrac, fridgeCop]
  );

  const wmRes = useMemo(
    () =>
      solveWatermelonCooling({
        count: fruitCount,
        massEachKg: fruitMass,
        TInitialC: wmTiC,
        TFinalC: wmTfC,
        cpKJkgK: 4.184,
        electricPowerW: wmPowerW,
        copR: wmCop,
        heatLeakW: wmLeakW,
      }),
    [fruitCount, fruitMass, wmTiC, wmTfC, wmPowerW, wmCop, wmLeakW]
  );

  const iceRes = useMemo(
    () =>
      solveIceMaker({
        massFlowKgH: iceKgH,
        TWaterInC: iceTinC,
        TIceOutC: iceToutC,
        copR: iceCop,
      }),
    [iceKgH, iceTinC, iceToutC, iceCop]
  );

  const exportCurrentCsv = () => {
    let csv = '';
    if (submode === 'ice-maker' && iceRes.ok) {
      csv =
        'Punto,q_acumulado_kJkg,T_C,Regimen\n' +
        iceRes.value.curve.map((c) => `${c.label},${c.qAccumKJkg.toFixed(2)},${c.TC},${c.regime}`).join('\n');
    } else if (submode === 'watermelons' && wmRes.ok) {
      csv =
        'Tiempo_min,T_ideal_C,T_con_resistencia_C\n' +
        wmRes.value.curve.map((c) => `${c.tMin.toFixed(2)},${c.TIdealC.toFixed(2)},${c.TRealisticC.toFixed(2)}`).join('\n');
    } else if (carnotRes.ok) {
      csv = `TH_K,TL_K,QH_kJ,QL_kJ,W_neto_kJ,eta_pct\n${carnotRes.value.TH_K.toFixed(3)},${carnotRes.value.TL_K.toFixed(3)},${carnotRes.value.QHKJ},${carnotRes.value.QLKJ.toFixed(3)},${carnotRes.value.WNetKJ.toFixed(3)},${(carnotRes.value.etaThermal * 100).toFixed(3)}`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulador2_${submode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const modifiedCount =
    (carnotEngineMode !== 'carnot-ideal' ? 1 : 0) +
    (!solveTHRatio ? 1 : 0) +
    (QH !== 500 ? 1 : 0) +
    (QL !== 200 ? 1 : 0) +
    (TL_C !== 17 ? 1 : 0) +
    (qLAvgKJH !== 1200 ? 1 : 0) +
    (Math.abs(activeFrac - 0.25) > 1e-6 ? 1 : 0) +
    (Math.abs(fridgeCop - 2.5) > 1e-6 ? 1 : 0) +
    (fruitCount !== 5 ? 1 : 0) +
    (fruitMass !== 10 ? 1 : 0) +
    (wmTiC !== 20 ? 1 : 0) +
    (wmTfC !== 8 ? 1 : 0) +
    (wmPowerW !== 450 ? 1 : 0) +
    (Math.abs(wmCop - 4.5) > 1e-6 ? 1 : 0) +
    (wmLeakW !== 0 ? 1 : 0) +
    (iceKgH !== 12 ? 1 : 0) +
    (iceTinC !== 15 ? 1 : 0) +
    (iceToutC !== -5 ? 1 : 0) +
    (Math.abs(iceCop - 2.4) > 1e-6 ? 1 : 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Simulador 2 · MEC110_7 · Segunda Ley y Refrigeración"
        title="Máquinas de Carnot, Refrigeración y Cambio de Fase"
        subtitle="Depósitos isotérmicos, enunciados de Kelvin–Planck y Clausius, carga frigorífica intermitente y meseta latente de solidificación."
        accent="amber"
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportCurrentCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#091120] text-[#2DD4BF] hover:border-[#2DD4BF] cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={restoreDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#091120] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              Restaurar valores de cátedra
            </button>
          </div>
        }
      >
        <div
          className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-[#091120] border border-[#1E314A]"
          role="tablist"
          aria-label="Casos de Carnot y refrigeración"
        >
          {[
            { id: 'carnot-500' as const, label: 'M2-A · Carnot 500/200 kJ' },
            { id: 'carnot-sources' as const, label: 'M2-A · 3 Fuentes Térmicas' },
            { id: 'fridge' as const, label: 'M2-B · Frigorífico 1/4' },
            { id: 'watermelons' as const, label: 'M2-C · 5 Sandías' },
            { id: 'ice-maker' as const, label: 'M2-D · Máquina de Hielo' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={submode === tab.id}
              onClick={() => setSubmode(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                submode === tab.id
                  ? 'bg-[#38BDF8] text-[#070D18]'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </ModuleHero>

      <BaselineComparator
        isModified={modifiedCount > 0}
        modifiedCount={modifiedCount}
        sourceLabel="cátedra MEC110_7"
        onRestore={restoreDefaults}
      />

      {/* ================= M2-A: Carnot 500/200 ================= */}
      {submode === 'carnot-500' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 ft-panel p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
                <span className="font-semibold text-[#F1F5F9]">Esquema de flujos entre depósitos isotérmicos</span>
                <span>Ámbar = Calor · Turquesa = Trabajo neto</span>
              </div>

              <svg
                viewBox="0 0 460 270"
                role="img"
                aria-label="Esquema de máquina térmica entre foco caliente TH y foco frío TL"
                className="w-full h-auto bg-[#070D18] rounded-xl border border-[#1E314A]"
              >
                <rect x="120" y="14" width="220" height="44" rx="8" fill="#1F160E" stroke="#F59E0B" strokeWidth="1.8" />
                <text x="230" y="34" textAnchor="middle" fill="#F59E0B" fontSize="12" fontWeight="600">
                  Foco Caliente T_H = {carnotRes.ok ? `${formatCL(carnotRes.value.TH_K, 2)} K` : '—'}
                </text>
                <text x="230" y="49" textAnchor="middle" fill="#94A3B8" fontSize="10" className="font-mono-num">
                  ({carnotRes.ok ? `${formatCL(carnotRes.value.TH_K - 273.15, 1)} °C` : '—'})
                </text>

                <line x1="230" y1="58" x2="230" y2="104" stroke="#F59E0B" strokeWidth="2.8" className="ft-flow-dash" />
                <polygon points="224,98 236,98 230,108" fill="#F59E0B" />
                <text x="245" y="86" fill="#F59E0B" fontSize="12" className="font-mono-num">
                  Q_H = {formatCL(QH, 0)} kJ
                </text>

                <circle cx="230" cy="138" r="32" fill="#0F1A2E" stroke="#38BDF8" strokeWidth="2.2" />
                <text x="230" y="135" textAnchor="middle" fill="#F1F5F9" fontSize="12" fontWeight="700">
                  M.T.
                </text>
                <text x="230" y="150" textAnchor="middle" fill="#2DD4BF" fontSize="11" className="font-mono-num">
                  η = {carnotRes.ok ? `${formatCL(carnotRes.value.etaThermal * 100, 1)}%` : 'Err'}
                </text>

                <line x1="262" y1="138" x2="355" y2="138" stroke="#2DD4BF" strokeWidth="2.8" className="ft-flow-dash" />
                <polygon points="348,132 348,144 360,138" fill="#2DD4BF" />
                <text x="366" y="134" fill="#2DD4BF" fontSize="12" fontWeight="600" className="font-mono-num">
                  W = {carnotRes.ok ? formatCL(carnotRes.value.WNetKJ, 1) : '—'} kJ
                </text>
                <text x="366" y="149" fill="#94A3B8" fontSize="10">
                  Trabajo neto
                </text>

                <line x1="230" y1="170" x2="230" y2="208" stroke="#38BDF8" strokeWidth="2.6" className="ft-flow-dash" />
                <polygon points="224,202 236,202 230,212" fill="#38BDF8" />
                <text x="245" y="194" fill="#38BDF8" fontSize="12" className="font-mono-num">
                  Q_L = {carnotRes.ok ? formatCL(carnotRes.value.QLKJ, 1) : '—'} kJ
                </text>

                <rect x="120" y="214" width="220" height="44" rx="8" fill="#0B192E" stroke="#38BDF8" strokeWidth="1.8" />
                <text x="230" y="234" textAnchor="middle" fill="#38BDF8" fontSize="12" fontWeight="600">
                  Sumidero T_L = {formatCL(TL_C + 273.15, 2)} K
                </text>
                <text x="230" y="249" textAnchor="middle" fill="#94A3B8" fontSize="10" className="font-mono-num">
                  ({formatCL(TL_C, 1)} °C)
                </text>
              </svg>

              {!carnotRes.ok && (
                <div role="alert" className="bg-[#1D1219] border border-[#F87171]/60 rounded-xl p-3.5 text-xs text-[#F87171] space-y-1">
                  <div className="font-semibold">{carnotRes.error.message}</div>
                  <p className="text-[#CBD5E1]">{carnotRes.error.physicalExplanation}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 ft-panel p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#94A3B8]">Modo de máquina</span>
                <div className="inline-flex p-1 rounded-lg bg-[#091120] border border-[#1E314A]">
                  <button
                    type="button"
                    onClick={() => setCarnotEngineMode('carnot-ideal')}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer ${
                      carnotEngineMode === 'carnot-ideal' ? 'bg-[#38BDF8] text-[#070D18] font-semibold' : 'text-[#94A3B8]'
                    }`}
                  >
                    Carnot Reversible
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCarnotEngineMode('general-engine');
                      setSolveTHRatio(false);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer ${
                      carnotEngineMode === 'general-engine' ? 'bg-[#38BDF8] text-[#070D18] font-semibold' : 'text-[#94A3B8]'
                    }`}
                  >
                    Máquina General
                  </button>
                </div>
              </div>

              {carnotEngineMode === 'carnot-ideal' && (
                <label className="flex items-center gap-2 text-xs text-[#F1F5F9] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={solveTHRatio}
                    onChange={(e) => setSolveTHRatio(e.target.checked)}
                    className="accent-[#38BDF8]"
                  />
                  Despejar T_H desde Q_H/Q_L (Caso cátedra 500/200 kJ)
                </label>
              )}

              <InstrumentSlider
                id="c-qh"
                label="Calor absorbido Q_H"
                value={QH}
                unit="kJ"
                min={100}
                max={1200}
                step={25}
                defaultValue={500}
                onChange={setQH}
              />

              {(solveTHRatio || carnotEngineMode === 'general-engine') && (
                <InstrumentSlider
                  id="c-ql"
                  label="Calor rechazado Q_L"
                  value={QL}
                  unit="kJ"
                  min={0}
                  max={800}
                  step={20}
                  defaultValue={200}
                  onChange={setQL}
                  hint="Prueba Q_L = 0 para violación Kelvin–Planck"
                />
              )}

              {!(solveTHRatio && carnotEngineMode === 'carnot-ideal') && (
                <InstrumentSlider
                  id="c-th"
                  label="Temperatura foco caliente T_H"
                  value={TH_C}
                  unit="°C"
                  min={50}
                  max={1300}
                  step={10}
                  defaultValue={452.23}
                  onChange={setTH_C}
                />
              )}

              <InstrumentSlider
                id="c-tl"
                label="Temperatura foco frío T_L"
                value={TL_C}
                unit="°C"
                min={-30}
                max={80}
                step={1}
                defaultValue={17}
                onChange={setTL_C}
              />

              {carnotRes.ok && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1E314A]">
                  <MetricTile
                    label="η térmica actual"
                    value={formatCL(carnotRes.value.etaThermal * 100, 2)}
                    unit="%"
                    tone="teal"
                  />
                  <MetricTile
                    label="Límite Carnot"
                    value={formatCL(carnotRes.value.etaCarnotMax * 100, 2)}
                    unit="%"
                    tone="cyan"
                  />
                </div>
              )}
            </div>
          </div>

          {carnotRes.ok && (
            <>
              <SankeyEnergyDiagram
                title="Balance energético del ciclo de Carnot"
                qInLabel="Calor absorbido Q_H"
                qInVal={carnotRes.value.QHKJ}
                wNetLabel="Trabajo neto W_neto"
                wNetVal={carnotRes.value.WNetKJ}
                qOutLabel="Calor rechazado Q_L"
                qOutVal={carnotRes.value.QLKJ}
                unit="kJ"
              />
              <PizarraProfesor title="Ciclo de Carnot" steps={carnotRes.value.steps} />
              <AuditPanel audit={carnotRes.value.audit} />
            </>
          )}
        </>
      )}

      {/* ================= M2-A: 3 Fuentes ================= */}
      {submode === 'carnot-sources' && (
        <div className="ft-panel p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-bold text-[#F1F5F9]">
              Comparación idealizada de Carnot para tres fuentes (sumidero T_L = 20 °C = 293,15 K)
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Caso MEC110_7 diapo 7: compara límites máximos teóricos (no rendimientos de centrales reales completas).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {threeSources.map((src) => (
              <div key={src.name} className="ft-well p-4 space-y-3">
                <div className="text-sm font-semibold text-[#F1F5F9]">{src.name}</div>
                <div className="font-mono-num text-xs text-[#94A3B8]">
                  T_H = {formatCL(src.TH_C, 0)} °C ({formatCL(src.TH_K, 2)} K)
                </div>
                <div className="h-2.5 rounded-full bg-[#14223B] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF]"
                    style={{ width: `${src.etaPct}%` }}
                  />
                </div>
                <div className="font-mono-num text-2xl font-bold text-[#2DD4BF]">
                  {formatCL(src.etaPct, 1)} %
                </div>
                <div className="text-xs text-[#94A3B8]">
                  Con °C incorrecto daría:{' '}
                  <span className="font-mono-num text-[#F87171]">
                    {formatCL((1 - 20 / src.TH_C) * 100, 1)} %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= M2-B: Frigorífico ================= */}
      {submode === 'fridge' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 ft-panel p-5 space-y-4">
              <h3 className="font-display text-base font-bold text-[#F1F5F9]">
                Parámetros del refrigerador intermitente (MEC110_7)
              </h3>
              <InstrumentSlider
                id="fr-ql"
                label="Extracción promedio Q̇_L,prom"
                value={qLAvgKJH}
                unit="kJ/h"
                min={300}
                max={3600}
                step={100}
                defaultValue={1200}
                onChange={setQLAvgKJH}
              />
              <InstrumentSlider
                id="fr-f"
                label="Fracción de tiempo activo f"
                value={activeFrac}
                unit="adim."
                min={0.1}
                max={1.0}
                step={0.05}
                defaultValue={0.25}
                onChange={setActiveFrac}
              />
              <InstrumentSlider
                id="fr-cop"
                label="COP_R del refrigerador"
                value={fridgeCop}
                unit="adim."
                min={1.2}
                max={5.5}
                step={0.1}
                defaultValue={2.5}
                onChange={setFridgeCop}
              />
            </div>

            {fridgeRes.ok && (
              <div className="lg:col-span-6 ft-panel p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 content-center">
                <MetricTile
                  label="Q̇_L promedio"
                  value={formatCL(fridgeRes.value.qLAvgKW, 4)}
                  unit="kW"
                  tone="cyan"
                />
                <MetricTile
                  label="Q̇_L compresor activo"
                  value={formatCL(fridgeRes.value.qLActiveKW, 4)}
                  unit="kW"
                  tone="amber"
                />
                <div className="sm:col-span-2">
                  <MetricTile
                    label="Potencia eléctrica demandada al estar encendido"
                    value={formatCL(fridgeRes.value.wActiveW, 1)}
                    unit={`W (${formatCL(fridgeRes.value.wActiveKW, 4)} kW)`}
                    tone="teal"
                  />
                </div>
              </div>
            )}
          </div>
          {fridgeRes.ok && (
            <>
              <PizarraProfesor title="Refrigerador Doméstico" steps={fridgeRes.value.steps} />
              <AuditPanel audit={fridgeRes.value.audit} />
            </>
          )}
        </>
      )}

      {/* ================= M2-C: Sandías ================= */}
      {submode === 'watermelons' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 ft-panel p-5 space-y-3.5">
              <h3 className="font-display text-base font-bold text-[#F1F5F9]">
                Enfriamiento de 5 sandías (MEC110_7 diapo 16)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="ft-well p-3 space-y-1">
                  <label htmlFor="wm-cnt" className="block text-xs text-[#94A3B8]">Cantidad frutas</label>
                  <input
                    id="wm-cnt"
                    type="number"
                    min={1}
                    max={30}
                    value={fruitCount}
                    onChange={(e) => setFruitCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F1A2E] border border-[#1E314A] font-mono-num text-sm text-[#F1F5F9]"
                  />
                </div>
                <div className="ft-well p-3 space-y-1">
                  <label htmlFor="wm-m" className="block text-xs text-[#94A3B8]">Masa c/u [kg]</label>
                  <input
                    id="wm-m"
                    type="number"
                    min={1}
                    max={30}
                    value={fruitMass}
                    onChange={(e) => setFruitMass(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F1A2E] border border-[#1E314A] font-mono-num text-sm text-[#F1F5F9]"
                  />
                </div>
              </div>
              <InstrumentSlider id="wm-ti" label="T inicial" value={wmTiC} unit="°C" min={10} max={35} step={1} defaultValue={20} onChange={setWmTiC} />
              <InstrumentSlider id="wm-tf" label="T final" value={wmTfC} unit="°C" min={2} max={18} step={1} defaultValue={8} onChange={setWmTfC} />
              <InstrumentSlider id="wm-p" label="Potencia eléctrica" value={wmPowerW} unit="W" min={150} max={1200} step={25} defaultValue={450} onChange={setWmPowerW} />
              <InstrumentSlider id="wm-cop" label="COP_R" value={wmCop} unit="adim." min={1.5} max={6.5} step={0.1} defaultValue={4.5} onChange={setWmCop} />
              <InstrumentSlider id="wm-leak" label="Pérdidas térmicas gabinete" value={wmLeakW} unit="W" min={0} max={800} step={25} defaultValue={0} onChange={setWmLeakW} />
            </div>

            <div className="lg:col-span-7 space-y-4">
              {wmRes.ok ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <MetricTile
                      label="Calor a retirar |Q|"
                      value={formatCL(wmRes.value.heatRemovedKJ, 1)}
                      unit="kJ"
                      tone="amber"
                    />
                    <MetricTile
                      label="Capacidad Q̇_L neta"
                      value={formatCL(wmRes.value.netCoolingPowerKW, 3)}
                      unit="kW"
                      tone="cyan"
                    />
                    <MetricTile
                      label="Tiempo mínimo ideal"
                      value={formatCL(wmRes.value.elapsedMinutes, 2)}
                      unit="min"
                      tone="teal"
                    />
                  </div>

                  <SciChart
                    title="Evolución de temperatura T(t): modelo ideal vs resistencia interna"
                    subtitle="El tiempo idealizado supone capacidad frigorífica constante y sin gradiente térmico interno"
                    xLabel="Tiempo [min]"
                    yLabel="Temperatura [°C]"
                    xDecimals={1}
                    yDecimals={1}
                    verticalMarkerX={{
                      x: wmRes.value.elapsedMinutes,
                      label: `t*=${formatCL(wmRes.value.elapsedMinutes, 1)} min`,
                      color: '#2DD4BF',
                    }}
                    series={[
                      {
                        id: 'wm-ideal',
                        name: 'Ideal (carga constante)',
                        color: '#2DD4BF',
                        showNodes: false,
                        points: wmRes.value.curve.map((c) => ({ x: c.tMin, y: c.TIdealC })),
                      },
                      {
                        id: 'wm-real',
                        name: 'Con resistencia interna (ref. exponencial)',
                        color: '#F59E0B',
                        dashed: true,
                        showNodes: false,
                        points: wmRes.value.curve.map((c) => ({ x: c.tMin, y: c.TRealisticC })),
                      },
                    ]}
                  />
                </>
              ) : (
                <div role="alert" className="bg-[#1D1219] border border-[#F87171]/60 rounded-xl p-4 text-xs text-[#F87171] space-y-1">
                  <div className="font-semibold">{wmRes.error.message}</div>
                  <p className="text-[#CBD5E1]">{wmRes.error.physicalExplanation}</p>
                </div>
              )}
            </div>
          </div>

          {wmRes.ok && (
            <>
              <PizarraProfesor title="Enfriamiento de Sandías" steps={wmRes.value.steps} />
              <AuditPanel audit={wmRes.value.audit} />
            </>
          )}
        </>
      )}

      {/* ================= M2-D: Máquina de hielo ================= */}
      {submode === 'ice-maker' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 ft-panel p-5 space-y-4">
              <h3 className="font-display text-base font-bold text-[#F1F5F9]">
                Máquina productora de hielo (MEC110_7 diapos 17–18)
              </h3>
              <InstrumentSlider id="ice-m" label="Producción de hielo ṁ" value={iceKgH} unit="kg/h" min={2} max={40} step={1} defaultValue={12} onChange={setIceKgH} />
              <InstrumentSlider id="ice-tin" label="Temperatura agua entrada" value={iceTinC} unit="°C" min={2} max={35} step={1} defaultValue={15} onChange={setIceTinC} />
              <InstrumentSlider id="ice-tout" label="Temperatura hielo salida" value={iceToutC} unit="°C" min={-20} max={-1} step={1} defaultValue={-5} onChange={setIceToutC} />
              <InstrumentSlider id="ice-cop" label="COP_R" value={iceCop} unit="adim." min={1.2} max={4.5} step={0.1} defaultValue={2.4} onChange={setIceCop} />

              {iceRes.ok && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1E314A]">
                  <MetricTile
                    label="Calor específico total"
                    value={formatCL(iceRes.value.qTotalKJkg, 2)}
                    unit="kJ/kg"
                    tone="cyan"
                  />
                  <MetricTile
                    label="Potencia eléctrica Ẇ_in"
                    value={formatCL(iceRes.value.wDotInW, 1)}
                    unit="W"
                    tone="teal"
                  />
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              {iceRes.ok ? (
                <SciChart
                  title="Temperatura vs calor extraído acumulado (meseta de solidificación a 0 °C)"
                  subtitle="A→B sensible agua · B→C calor latente de fusión (333,7 kJ/kg) · C→D sensible hielo"
                  xLabel="Calor extraído acumulado q [kJ/kg]"
                  yLabel="Temperatura [°C]"
                  xDecimals={1}
                  yDecimals={1}
                  series={[
                    {
                      id: 'ice-curve',
                      name: 'Curva de enfriamiento y cambio de fase',
                      color: '#38BDF8',
                      points: iceRes.value.curve.map((c, idx) => ({
                        id: ['A', 'B', 'C', 'D'][idx],
                        x: c.qAccumKJkg,
                        y: c.TC,
                        label: c.label,
                        extra: c.regime,
                      })),
                    },
                  ]}
                />
              ) : (
                <div role="alert" className="bg-[#1D1219] border border-[#F87171]/60 rounded-xl p-4 text-xs text-[#F87171]">
                  {iceRes.error.message}
                </div>
              )}
            </div>
          </div>

          {iceRes.ok && (
            <>
              <PizarraProfesor title="Máquina Productora de Hielo" steps={iceRes.value.steps} />
              <AuditPanel audit={iceRes.value.audit} />
            </>
          )}
        </>
      )}
    </div>
  );
};
