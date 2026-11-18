import React, { useMemo, useState } from 'react';
import { AlertTriangle, Download, RotateCcw } from 'lucide-react';
import {
  solveRankine,
  type RankineMode,
  type RegenerativeSubmode,
} from '../../../core/thermo/rankine';
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

const MODE_OPTIONS: Array<{ id: RankineMode; label: string; desc: string }> = [
  { id: 'simple', label: '4A · Rankine simple', desc: '300 MW, ideal (100 %) o real (85 %)' },
  { id: 'reheat', label: '4B · Recalentamiento', desc: 'Restricción humedad x_salida >= 0,90' },
  { id: 'regenerative-4c', label: '4C · Regenerativo 11 est.', desc: '250 MW, CAA + CAC, sistema lineal 4×4' },
  { id: 'cogeneration-binary', label: '4F · Cogeneración', desc: 'Factor ε_u y binario conceptual' },
];

export const RankineSimulator: React.FC = () => {
  const [mode, setMode] = useState<RankineMode>('simple');
  const [pBoilerMPa, setPBoilerMPa] = useState<number>(10);
  const [TBoilerC, setTBoilerC] = useState<number>(500);
  const [pCondKPa, setPCondKPa] = useState<number>(10);
  const [etaTurbine, setEtaTurbine] = useState<number>(1.0);
  const [etaPump, setEtaPump] = useState<number>(1.0);
  const [netPowerMW, setNetPowerMW] = useState<number>(300);

  // 4B
  const [TReheatC, setTReheatC] = useState<number>(500);
  const [targetMinQuality, setTargetMinQuality] = useState<number>(0.9);
  const [massFlowFixedKgS, setMassFlowFixedKgS] = useState<number>(25);

  // 4C
  const [pCacMPa, setPCacMPa] = useState<number>(0.8);
  const [pCaaMPa, setPCaaMPa] = useState<number>(0.3);
  const [regenSubmode, setRegenSubmode] = useState<RegenerativeSubmode>('if97-consistent');

  // 4F
  const [processHeatMW, setProcessHeatMW] = useState<number>(45);
  const [fuelInputMW, setFuelInputMW] = useState<number>(110);

  // Visualización
  const [secondaryChart, setSecondaryChart] = useState<'hs' | 'pv' | 'sankey'>('hs');
  const [pvLogScale, setPvLogScale] = useState<boolean>(true);
  const [selectedStateId, setSelectedStateId] = useState<string>('3');

  const applyPreset = (preset: '4a-ideal' | '4a-real' | '4b' | '4c' | '4f') => {
    if (preset === '4a-ideal') {
      setMode('simple');
      setPBoilerMPa(10);
      setTBoilerC(500);
      setPCondKPa(10);
      setEtaTurbine(1.0);
      setEtaPump(1.0);
      setNetPowerMW(300);
      setSelectedStateId('3');
    } else if (preset === '4a-real') {
      setMode('simple');
      setPBoilerMPa(10);
      setTBoilerC(500);
      setPCondKPa(10);
      setEtaTurbine(0.85);
      setEtaPump(0.85);
      setNetPowerMW(300);
      setSelectedStateId('4');
    } else if (preset === '4b') {
      setMode('reheat');
      setPBoilerMPa(9);
      setTBoilerC(500);
      setTReheatC(500);
      setPCondKPa(10);
      setEtaTurbine(1.0);
      setEtaPump(1.0);
      setTargetMinQuality(0.9);
      setMassFlowFixedKgS(25);
      setSelectedStateId('5');
    } else if (preset === '4c') {
      setMode('regenerative-4c');
      setPBoilerMPa(12.5);
      setTBoilerC(550);
      setPCacMPa(0.8);
      setPCaaMPa(0.3);
      setPCondKPa(10);
      setEtaTurbine(1.0);
      setEtaPump(1.0);
      setNetPowerMW(250);
      setRegenSubmode('if97-consistent');
      setSelectedStateId('8');
    } else {
      setMode('cogeneration-binary');
      setPBoilerMPa(7);
      setTBoilerC(450);
      setPCondKPa(15);
      setEtaTurbine(0.88);
      setEtaPump(0.85);
      setNetPowerMW(35);
      setProcessHeatMW(50);
      setFuelInputMW(105);
      setSelectedStateId('3');
    }
  };

  const restoreDefaults = () => {
    if (mode === 'reheat') applyPreset('4b');
    else if (mode === 'regenerative-4c') applyPreset('4c');
    else if (mode === 'cogeneration-binary') applyPreset('4f');
    else applyPreset('4a-ideal');
  };

  const result = useMemo(
    () =>
      solveRankine({
        mode,
        pBoilerMPa,
        TBoilerC,
        pCondKPa,
        etaTurbine,
        etaPump,
        netPowerMW,
        TReheatC,
        targetMinQuality,
        massFlowFixedKgS,
        pCacMPa,
        pCaaMPa,
        regenSubmode,
        processHeatMW,
        fuelInputMW,
      }),
    [
      mode,
      pBoilerMPa,
      TBoilerC,
      pCondKPa,
      etaTurbine,
      etaPump,
      netPowerMW,
      TReheatC,
      targetMinQuality,
      massFlowFixedKgS,
      pCacMPa,
      pCaaMPa,
      regenSubmode,
      processHeatMW,
      fuelInputMW,
    ]
  );

  const activeData = result.ok ? result.value : null;
  const inspectedState =
    activeData?.states.find((s) => s.id === selectedStateId) ?? activeData?.states[0] ?? null;

  const exportCsv = () => {
    if (!activeData) return;
    const header =
      'Estado,Descripcion,p[kPa],T[C],h[kJ/kg],s[kJ/(kg*K)],v[m3/kg],Fase,Calidad_x,m_dot[kg/s],Fraccion_1kg,Fuente\n';
    const rows = activeData.states
      .map(
        (s) =>
          `${s.id},"${s.label}",${s.pKPa.toFixed(2)},${s.TC.toFixed(2)},${s.hKJkg.toFixed(3)},${s.sKJkgK.toFixed(5)},${s.vM3kg.toFixed(6)},"${s.phaseLabel}",${s.quality === null ? 'N/A' : s.quality.toFixed(4)},${s.massFlowKgS.toFixed(3)},${s.massFraction.toFixed(4)},"${s.sourceNote}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rankine_${mode}_if97.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const modifiedCount =
    (mode === 'simple' && (pBoilerMPa !== 10 || TBoilerC !== 500 || pCondKPa !== 10 || etaTurbine !== 1 || etaPump !== 1 || netPowerMW !== 300)
      ? 1
      : 0) +
    (mode === 'reheat' && (pBoilerMPa !== 9 || TBoilerC !== 500 || TReheatC !== 500 || pCondKPa !== 10 || targetMinQuality !== 0.9 || massFlowFixedKgS !== 25)
      ? 1
      : 0) +
    (mode === 'regenerative-4c' && (pBoilerMPa !== 12.5 || TBoilerC !== 550 || pCacMPa !== 0.8 || pCaaMPa !== 0.3 || pCondKPa !== 10 || netPowerMW !== 250)
      ? 1
      : 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Simulador 4 · MEC110_9 · Agua/Vapor IAPWS-IF97 Real (Regiones 1, 2 y 4)"
        title="Planta de Vapor Rankine, Recalentamiento y Regeneración 4×4"
        subtitle="Campana real IAPWS-IF97, trazado de 1 kg de vapor en extracciones CAA/CAC y auditoría de matriz 4×4 en Caso 4C."
        accent="teal"
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={restoreDefaults}
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

      {/* Selector de modo + Presets de cátedra */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5" role="tablist" aria-label="Modos de Rankine">
        {MODE_OPTIONS.map((opt) => {
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                if (opt.id === 'simple') applyPreset('4a-ideal');
                else if (opt.id === 'reheat') applyPreset('4b');
                else if (opt.id === 'regenerative-4c') applyPreset('4c');
                else applyPreset('4f');
              }}
              className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#14223B] border-[#2DD4BF]/80 text-[#F1F5F9]'
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
        <span className="text-[#94A3B8] font-medium">Casos de cátedra precargados:</span>
        <button
          type="button"
          onClick={() => applyPreset('4a-ideal')}
          className="px-3 py-1.5 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
        >
          4A Ideal (300 MW, 10 MPa, 500 °C)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('4a-real')}
          className="px-3 py-1.5 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
        >
          4A Real (η_T = η_B = 85 %)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('4b')}
          className="px-3 py-1.5 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
        >
          4B Recalentamiento (9 MPa, x≥0,90)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('4c')}
          className="px-3 py-1.5 rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
        >
          4C Regenerativo 250 MW (11 est.)
        </button>
      </div>

      <BaselineComparator
        isModified={modifiedCount > 0}
        modifiedCount={modifiedCount}
        sourceLabel="caso nominal del submodo"
        onRestore={restoreDefaults}
      />

      {/* Submodo dual obligatorio para Caso 4C */}
      {mode === 'regenerative-4c' && (
        <div className="ft-panel border-[#F59E0B]/45 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="text-xs font-semibold text-[#F59E0B] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Auditoría científica Caso 4C · Modo dual transparente</span>
            </div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Alterna entre la transcripción literal previa (<strong className="text-[#F1F5F9]">w_B2 = 0,5365 kJ/kg</strong>) y el cálculo físico consistente con IAPWS-IF97 (<strong className="text-[#2DD4BF]">w_B2 = v3·(p4−p3) ≈ 13,09 kJ/kg</strong>).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setRegenSubmode('if97-consistent')}
              aria-pressed={regenSubmode === 'if97-consistent'}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                regenSubmode === 'if97-consistent'
                  ? 'bg-[#2DD4BF] text-[#070D18] border-[#2DD4BF]'
                  : 'bg-[#091120] text-[#94A3B8] border-[#1E314A] hover:text-[#F1F5F9]'
              }`}
            >
              Modo Consistencia Física IF97
            </button>
            <button
              type="button"
              onClick={() => setRegenSubmode('lecture-reference')}
              aria-pressed={regenSubmode === 'lecture-reference'}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                regenSubmode === 'lecture-reference'
                  ? 'bg-[#F59E0B] text-[#070D18] border-[#F59E0B]'
                  : 'bg-[#091120] text-[#94A3B8] border-[#1E314A] hover:text-[#F1F5F9]'
              }`}
            >
              Modo Referencia de Cátedra
            </button>
          </div>
        </div>
      )}

      {/* Controles + KPIs + Esquema */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-4 ft-panel p-5 space-y-3.5">
          <h3 className="font-display text-sm font-bold text-[#F1F5F9] border-b border-[#1E314A] pb-2.5">
            Controles de planta de vapor
          </h3>

          <InstrumentSlider id="rk-pboiler" label="Presión caldera p_alta" value={pBoilerMPa} min={1} max={18} step={0.5} unit="MPa" onChange={setPBoilerMPa} />
          <InstrumentSlider id="rk-tboiler" label="Temperatura entrada turbina T_alta" value={TBoilerC} min={250} max={650} step={10} unit="°C" onChange={setTBoilerC} />
          <InstrumentSlider id="rk-pcond" label="Presión condensador p_baja" value={pCondKPa} min={4} max={100} step={2} unit="kPa" onChange={setPCondKPa} />
          <InstrumentSlider
            id="rk-etat"
            label="Eficiencia turbina η_T"
            value={Math.round(etaTurbine * 100)}
            min={60}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => setEtaTurbine(v / 100)}
          />
          <InstrumentSlider
            id="rk-etap"
            label="Eficiencia bomba η_B"
            value={Math.round(etaPump * 100)}
            min={55}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => setEtaPump(v / 100)}
          />

          {mode === 'reheat' ? (
            <>
              <InstrumentSlider id="rk-treheat" label="Temperatura recalentamiento T_recal" value={TReheatC} min={320} max={620} step={10} unit="°C" onChange={setTReheatC} />
              <InstrumentSlider
                id="rk-xmin"
                label="Calidad mínima en salida TBP x_5"
                value={Math.round(targetMinQuality * 100)}
                min={84}
                max={98}
                step={1}
                unit="%"
                onChange={(v) => setTargetMinQuality(v / 100)}
              />
              <InstrumentSlider id="rk-mdot" label="Caudal fijo de caldera ṁ" value={massFlowFixedKgS} min={5} max={150} step={1} unit="kg/s" onChange={setMassFlowFixedKgS} />
            </>
          ) : (
            <InstrumentSlider id="rk-power" label="Potencia eléctrica neta Ẇ_neta" value={netPowerMW} min={10} max={600} step={10} unit="MW" onChange={setNetPowerMW} />
          )}

          {mode === 'regenerative-4c' && (
            <div className="space-y-3 pt-2 border-t border-[#1E314A]">
              <InstrumentSlider id="rk-pcac" label="Presión extracción CAC" value={pCacMPa} min={0.4} max={4.0} step={0.1} unit="MPa" onChange={setPCacMPa} />
              <InstrumentSlider id="rk-pcaa" label="Presión extracción CAA" value={pCaaMPa} min={0.05} max={1.5} step={0.05} unit="MPa" onChange={setPCaaMPa} />
            </div>
          )}

          {mode === 'cogeneration-binary' && (
            <div className="space-y-3 pt-2 border-t border-[#1E314A]">
              <InstrumentSlider id="rk-qproc" label="Calor útil de proceso Q̇_útil" value={processHeatMW} min={10} max={200} step={5} unit="MW" onChange={setProcessHeatMW} />
              <InstrumentSlider id="rk-qfuel" label="Aporte combustible Q̇_comb" value={fuelInputMW} min={50} max={400} step={5} unit="MW" onChange={setFuelInputMW} />
            </div>
          )}
        </div>

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
                  label="Eficiencia térmica η_th"
                  value={formatCL(activeData.etaThermal * 100, 2)}
                  unit="%"
                  caption={`w_neto = ${formatCL(activeData.wNetKJkg, 1)} kJ/kg`}
                  tone="teal"
                />
                <MetricTile
                  label="Caudal caldera ṁ"
                  value={formatCL(activeData.massFlowBoilerKgS, 2)}
                  unit="kg/s"
                  caption={`Ẇ_neta = ${formatCL((activeData.wNetKJkg * activeData.massFlowBoilerKgS) / 1e3, 1)} MW`}
                  tone="cyan"
                />
                <MetricTile
                  label="Trabajo turbina / bomba"
                  value={`${formatCL(activeData.wTurbineKJkg, 1)} / ${formatCL(activeData.wPumpKJkg, 2)}`}
                  caption="kJ/kg (BWR < 2 %)"
                  tone="amber"
                />
                <MetricTile
                  label={mode === 'reheat' ? 'p_recalentamiento' : 'Calidad escape x_out'}
                  value={
                    mode === 'reheat'
                      ? formatCL(activeData.pReheatMPa ?? 0, 3)
                      : activeData.exitQuality !== null
                        ? formatCL(activeData.exitQuality * 100, 2)
                        : 'Seco'
                  }
                  unit={mode === 'reheat' ? 'MPa' : activeData.exitQuality !== null ? '%' : undefined}
                  caption={
                    mode === 'reheat'
                      ? `x_5 = ${activeData.exitQuality !== null ? formatCL(activeData.exitQuality * 100, 1) + ' %' : 'Seco'}`
                      : `q_in = ${formatCL(activeData.qInKJkg, 1)} kJ/kg`
                  }
                  tone={activeData.exitQuality !== null && activeData.exitQuality < 0.88 ? 'crimson' : 'teal'}
                />
              </div>

              {/* Esquema interactivo planta de vapor */}
              <div className="ft-panel p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-bold text-[#F1F5F9]">
                    Esquema de planta de vapor e inspección de estados
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" aria-hidden="true" /> Líquido / condensado
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#2DD4BF]" aria-hidden="true" /> Mezcla bifásica
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#F87171]" aria-hidden="true" /> Vapor sobrecalentado
                    </span>
                  </div>
                </div>

                <RankinePlantSVG
                  mode={mode}
                  states={activeData.states}
                  selectedId={inspectedState?.id ?? '1'}
                  onSelectState={setSelectedStateId}
                />

                {inspectedState && (
                  <div className="ft-well px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-mono-num font-bold text-[#2DD4BF]">
                        Estado {inspectedState.id}
                      </span>{' '}
                      <span className="text-[#F1F5F9] font-medium">· {inspectedState.label}</span>
                      <span className="text-[#94A3B8] ml-2">({inspectedState.phaseLabel})</span>
                    </div>
                    <div className="font-mono-num text-[#F1F5F9] flex flex-wrap gap-3">
                      <span>p={formatCL(inspectedState.pKPa, 1)} kPa</span>
                      <span>T={formatCL(inspectedState.TC, 2)} °C</span>
                      <span>h={formatCL(inspectedState.hKJkg, 2)} kJ/kg</span>
                      <span>s={formatCL(inspectedState.sKJkgK, 4)} kJ/(kg·K)</span>
                      {inspectedState.quality !== null && (
                        <span className="text-[#2DD4BF]">
                          x={formatCL(inspectedState.quality * 100, 2)} %
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {activeData.reheatInterpTrace && activeData.reheatInterpTrace.length > 0 && (
                  <div className="bg-[#091120] border border-[#38BDF8]/35 rounded-xl p-3.5 text-xs space-y-1">
                    <div className="font-semibold text-[#38BDF8]">
                      Traza de interpolación lineal e inversión IF97 (Caso 4B)
                    </div>
                    {activeData.reheatInterpTrace.map((line, i) => (
                      <p key={i} className="font-mono-num text-[#CBD5E1]">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Gráficos: Campana T-s real IF97 + Secundario switchable */}
      {activeData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SciChart
              title="Diagrama T–s con campana real IAPWS-IF97"
              subtitle="Estados y trayectoria sobre la envolvente de saturación del agua (273,16 K a 623 K)"
              xLabel="Entropía específica s [kJ/(kg·K)]"
              yLabel="Temperatura T [K]"
              xDecimals={2}
              yDecimals={0}
              domePolygon={[
                ...activeData.saturationDome.map((pt) => ({
                  x: pt.sfKJkgK,
                  y: pt.TK,
                })),
                ...[...activeData.saturationDome].reverse().map((pt) => ({
                  x: pt.sgKJkgK,
                  y: pt.TK,
                })),
              ]}
              series={[
                {
                  id: 'rk-cycle',
                  name: 'Estados del ciclo Rankine',
                  color: '#F59E0B',
                  showNodes: true,
                  points: activeData.states.map((st) => ({
                    id: st.id,
                    label: `${st.id} · ${st.label}`,
                    x: st.sKJkgK,
                    y: st.TC + 273.15,
                    extra: `h=${formatCL(st.hKJkg, 1)} kJ/kg`,
                  })),
                },
              ]}
            />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 ft-panel px-4 py-2.5">
                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#091120] border border-[#1E314A] text-xs">
                  <button
                    type="button"
                    onClick={() => setSecondaryChart('hs')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                      secondaryChart === 'hs'
                        ? 'bg-[#38BDF8] text-[#070D18] font-semibold'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    h–s (Mollier)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondaryChart('pv')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                      secondaryChart === 'pv'
                        ? 'bg-[#38BDF8] text-[#070D18] font-semibold'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    P–v
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondaryChart('sankey')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                      secondaryChart === 'sankey'
                        ? 'bg-[#38BDF8] text-[#070D18] font-semibold'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    Flujo energético
                  </button>
                </div>

                {secondaryChart === 'pv' && (
                  <label className="flex items-center gap-1.5 text-xs text-[#94A3B8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pvLogScale}
                      onChange={(e) => setPvLogScale(e.target.checked)}
                      className="accent-[#2DD4BF]"
                    />
                    Eje p logarítmico
                  </label>
                )}
              </div>

              {secondaryChart === 'hs' && (
                <SciChart
                  title="Diagrama h–s (Mollier)"
                  subtitle="Saltos entálpicos verticales en turbina y condensación"
                  xLabel="Entropía s [kJ/(kg·K)]"
                  yLabel="Entalpía h [kJ/kg]"
                  xDecimals={2}
                  yDecimals={0}
                  series={[
                    {
                      id: 'rk-hs',
                      name: 'Estados (h, s)',
                      color: '#38BDF8',
                      showNodes: true,
                      points: activeData.states.map((st) => ({
                        id: st.id,
                        label: `${st.id} · ${st.label}`,
                        x: st.sKJkgK,
                        y: st.hKJkg,
                        extra: `${formatCL(st.pKPa, 0)} kPa`,
                      })),
                    },
                  ]}
                />
              )}

              {secondaryChart === 'pv' && (
                <SciChart
                  title="Diagrama P–v"
                  subtitle="Expansión volumétrica enorme entre líquido (0,001 m³/kg) y vapor a baja presión"
                  xLabel="Volumen específico v [m³/kg]"
                  yLabel="Presión p [kPa]"
                  xDecimals={3}
                  yDecimals={1}
                  yLogScale={pvLogScale}
                  series={[
                    {
                      id: 'rk-pv',
                      name: 'Estados (v, p)',
                      color: '#2DD4BF',
                      showNodes: true,
                      points: activeData.states.map((st) => ({
                        id: st.id,
                        label: `${st.id} · ${st.label}`,
                        x: st.vM3kg,
                        y: st.pKPa,
                      })),
                    },
                  ]}
                />
              )}

              {secondaryChart === 'sankey' && (
                <SankeyEnergyDiagram
                  title={
                    mode === 'cogeneration-binary'
                      ? 'Balance energético de cogeneración'
                      : 'Balance energético específico (por kg en caldera)'
                  }
                  qInLabel={mode === 'cogeneration-binary' ? 'Combustible Q̇_comb' : 'Calor caldera q_in'}
                  qInVal={
                    mode === 'cogeneration-binary'
                      ? activeData.cogenerationSummary?.fuelMW ?? 100
                      : activeData.qInKJkg
                  }
                  wNetLabel={mode === 'cogeneration-binary' ? 'Potencia eléctrica Ẇ' : 'Trabajo neto w_neto'}
                  wNetVal={
                    mode === 'cogeneration-binary'
                      ? activeData.cogenerationSummary?.electricMW ?? 35
                      : activeData.wNetKJkg
                  }
                  qUsefulLabel={mode === 'cogeneration-binary' ? 'Calor útil Q̇_útil' : undefined}
                  qUsefulVal={
                    mode === 'cogeneration-binary'
                      ? activeData.cogenerationSummary?.processHeatMW ?? 0
                      : 0
                  }
                  qOutLabel={mode === 'cogeneration-binary' ? 'Pérdidas y condensador' : 'Calor cedido q_out'}
                  qOutVal={
                    mode === 'cogeneration-binary'
                      ? Math.max(
                          0,
                          (activeData.cogenerationSummary?.fuelMW ?? 100) -
                            (activeData.cogenerationSummary?.electricMW ?? 35) -
                            (activeData.cogenerationSummary?.processHeatMW ?? 0)
                        )
                      : activeData.qOutKJkg
                  }
                  unit={mode === 'cogeneration-binary' ? 'MW' : 'kJ/kg'}
                />
              )}
            </div>
          </div>

          {/* Panel especial 4C: Auditoría 4×4 y Rastreo de 1 kg de vapor */}
          {mode === 'regenerative-4c' && activeData.matrixAudit4C && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 ft-panel p-5 space-y-3">
                <h4 className="font-display text-sm font-bold text-[#F1F5F9]">
                  Sistema lineal 4×4 (Eliminación Gaussiana con pivoteo parcial escalado)
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Incógnitas [ṁ_8, ṁ_9, ṁ_10, ṁ_11] en kg/s. Comparación entre formulación física IF97 y transcripción previa de cátedra:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#091120] border border-[#2DD4BF]/45 rounded-xl p-3.5 space-y-1.5">
                    <div className="font-semibold text-[#2DD4BF]">Consistencia Física IF97</div>
                    <div className="font-mono-num text-[#F1F5F9] space-y-0.5">
                      <div>w_B2 = {formatCL(activeData.matrixAudit4C.physicalWB2, 4)} kJ/kg</div>
                      <div>η_th = {formatCL(activeData.matrixAudit4C.physicalEtaPct, 2)} %</div>
                      <div>ṁ_8 = {formatCL(activeData.matrixAudit4C.physicalFlows[0], 3)} kg/s</div>
                      <div>ṁ_9 = {formatCL(activeData.matrixAudit4C.physicalFlows[1], 3)} kg/s</div>
                      <div>ṁ_10 = {formatCL(activeData.matrixAudit4C.physicalFlows[2], 3)} kg/s</div>
                      <div>ṁ_11 = {formatCL(activeData.matrixAudit4C.physicalFlows[3], 3)} kg/s</div>
                      <div className="text-[#2DD4BF]">
                        ||Ax−b||∞ = {activeData.matrixAudit4C.physicalResidualMax.toExponential(2)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#091120] border border-[#F59E0B]/45 rounded-xl p-3.5 space-y-1.5">
                    <div className="font-semibold text-[#F59E0B]">Referencia Previa (§11.8)</div>
                    <div className="font-mono-num text-[#F1F5F9] space-y-0.5">
                      <div>w_B2 = {formatCL(activeData.matrixAudit4C.lectureWB2, 4)} kJ/kg</div>
                      <div>η_th = {formatCL(activeData.matrixAudit4C.lectureEtaPct, 2)} %</div>
                      <div>ṁ_8 = {formatCL(activeData.matrixAudit4C.lectureFlows[0], 3)} kg/s</div>
                      <div>ṁ_9 = {formatCL(activeData.matrixAudit4C.lectureFlows[1], 3)} kg/s</div>
                      <div>ṁ_10 = {formatCL(activeData.matrixAudit4C.lectureFlows[2], 3)} kg/s</div>
                      <div>ṁ_11 = {formatCL(activeData.matrixAudit4C.lectureFlows[3], 3)} kg/s</div>
                      <div className="text-[#F59E0B]">
                        ||Ax−b||∞ = {activeData.matrixAudit4C.lectureResidualMax.toExponential(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#F59E0B] leading-relaxed">
                  {activeData.matrixAudit4C.discrepancyNote}
                </p>
              </div>

              <div className="lg:col-span-5 ft-panel p-5 space-y-3">
                <h4 className="font-display text-sm font-bold text-[#F1F5F9]">
                  Rastrea 1 kg de vapor que sale de la caldera
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Fracción másica por rama en el circuito regenerativo (suma exacta = 1,000 kg):
                </p>
                <div className="space-y-3 text-xs pt-1">
                  {[
                    {
                      label: 'Extracción y1 hacia CAC (estado 9 → 6 → 7)',
                      frac: activeData.states[8]?.massFraction ?? 0,
                      color: '#F59E0B',
                    },
                    {
                      label: 'Extracción y2 hacia CAA (estado 10)',
                      frac: activeData.states[9]?.massFraction ?? 0,
                      color: '#38BDF8',
                    },
                    {
                      label: 'Flujo remanente 1 − y1 − y2 al condensador (estado 11)',
                      frac: activeData.states[10]?.massFraction ?? 0,
                      color: '#2DD4BF',
                    },
                  ].map((branch, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="text-[#F1F5F9]">{branch.label}</span>
                        <span className="font-mono-num font-semibold shrink-0" style={{ color: branch.color }}>
                          {formatCL(branch.frac * 100, 2)} % ({formatCL(branch.frac, 4)} kg)
                        </span>
                      </div>
                      <div className="h-2.5 bg-[#091120] rounded-full border border-[#1E314A] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, branch.frac * 100)}%`, backgroundColor: branch.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Panel especial 4F */}
          {mode === 'cogeneration-binary' && activeData.cogenerationSummary && (
            <div className="ft-panel p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <h4 className="font-display text-sm font-bold text-[#F1F5F9]">
                  Factor de utilización de cogeneración ε_u
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  En cogeneración se aprovecha electricidad y calor de proceso: ε_u = (Ẇ + Q̇_útil) / Q̇_comb.
                </p>
                <div className="font-mono-num text-2xl font-bold text-[#2DD4BF]">
                  ε_u = {formatCL(activeData.cogenerationSummary.utilizationFactorPct, 2)} %
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Distinto de η_eléctrica pura ={' '}
                  <span className="font-mono-num text-[#F1F5F9]">
                    {formatCL(
                      (activeData.cogenerationSummary.electricMW /
                        activeData.cogenerationSummary.fuelMW) *
                        100,
                      2
                    )}{' '}
                    %
                  </span>
                </p>
              </div>
              <div className="space-y-2 border-t md:border-t-0 md:border-l border-[#1E314A] pt-3 md:pt-0 md:pl-5">
                <h4 className="font-display text-sm font-bold text-[#F59E0B]">
                  Ciclo binario conceptual (mercurio–agua histórico)
                </h4>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  Ejemplo energético de acople: el ciclo superior rechaza{' '}
                  <strong className="font-mono-num text-[#F1F5F9]">
                    {activeData.cogenerationSummary.binaryUpperRejectMW} MW
                  </strong>{' '}
                  (con {activeData.cogenerationSummary.binaryLossMW} MW de pérdidas térmicas) para alimentar un ciclo de vapor inferior que entrega{' '}
                  <strong className="font-mono-num text-[#2DD4BF]">
                    {formatCL(activeData.cogenerationSummary.binaryLowerNetMW, 2)} MW
                  </strong>
                  . Solo con valor conceptual histórico: hoy el mercurio no se usa por toxicidad y se prefiere ciclo combinado gas–vapor.
                </p>
              </div>
            </div>
          )}

          {/* Tabla de estados */}
          <div className="ft-panel p-5 space-y-3">
            <h4 className="font-display text-sm font-bold text-[#F1F5F9]">
              Tabla de estados termodinámicos IAPWS-IF97 ({activeData.states.length} estados)
            </h4>
            <div className="overflow-x-auto border border-[#1E314A] rounded-xl bg-[#091120]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B1322] border-b border-[#1E314A] text-[#94A3B8]">
                    <th className="py-2 px-3 font-medium">Est.</th>
                    <th className="py-2 px-3 font-medium">Ubicación</th>
                    <th className="py-2 px-3 font-medium">p [kPa]</th>
                    <th className="py-2 px-3 font-medium">T [°C]</th>
                    <th className="py-2 px-3 font-medium">h [kJ/kg]</th>
                    <th className="py-2 px-3 font-medium">s [kJ/(kg·K)]</th>
                    <th className="py-2 px-3 font-medium">Fase / Calidad</th>
                    <th className="py-2 px-3 font-medium">ṁ [kg/s]</th>
                    <th className="py-2 px-3 font-medium">Origen</th>
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
                      <td className="py-2 px-3 font-semibold text-[#2DD4BF]">{st.id}</td>
                      <td className="py-2 px-3 font-sans">{st.label}</td>
                      <td className="py-2 px-3">{formatCL(st.pKPa, 1)}</td>
                      <td className="py-2 px-3">{formatCL(st.TC, 2)}</td>
                      <td className="py-2 px-3">{formatCL(st.hKJkg, 2)}</td>
                      <td className="py-2 px-3">{formatCL(st.sKJkgK, 4)}</td>
                      <td className="py-2 px-3 font-sans text-[#94A3B8]">
                        {st.phaseLabel}
                        {st.quality !== null ? ` (x=${formatCL(st.quality * 100, 1)} %)` : ''}
                      </td>
                      <td className="py-2 px-3">{formatCL(st.massFlowKgS, 2)}</td>
                      <td className="py-2 px-3 font-sans text-[#94A3B8]">{st.sourceNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PizarraProfesor title="Ciclo Rankine" steps={activeData.steps} />
          <AuditPanel audit={activeData.audit} />
        </>
      )}
    </div>
  );
};

const RankinePlantSVG: React.FC<{
  mode: RankineMode;
  states: Array<{ id: string; TC: number; quality: number | null }>;
  selectedId: string;
  onSelectState: (id: string) => void;
}> = ({ mode, states, selectedId, onSelectState }) => {
  const stateColor = (st: { TC: number; quality: number | null }) =>
    st.quality !== null && st.quality > 0 && st.quality < 1
      ? '#2DD4BF'
      : st.TC > 260
        ? '#F87171'
        : '#38BDF8';

  return (
    <svg
      viewBox="0 0 640 230"
      role="img"
      aria-label="Esquema de central térmica Rankine"
      className="w-full h-auto bg-[#070D18] rounded-xl border border-[#1E314A]"
    >
      {/* Caldera */}
      <rect x="65" y="42" width="125" height="62" rx="6" fill="#14223B" stroke="#F87171" strokeWidth="2" />
      <text x="127" y="69" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">
        Caldera
      </text>
      <text x="127" y="85" textAnchor="middle" fill="#F59E0B" fontSize="9.5">
        {mode === 'reheat' ? 'Caldera + Recalentador' : 'Vapor sobrecalentado'}
      </text>

      {/* Turbina */}
      <polygon points="335,54 445,38 445,108 335,92" fill="#14223B" stroke="#F59E0B" strokeWidth="2" />
      <text x="390" y="76" textAnchor="middle" fill="#F1F5F9" fontSize="11" fontWeight="600">
        {mode === 'reheat' ? 'TAP + TBP' : mode === 'regenerative-4c' ? 'Turbina (2 extr.)' : 'Turbina'}
      </text>

      {/* Condensador */}
      <rect x="325" y="138" width="130" height="44" rx="5" fill="#0F1A2E" stroke="#38BDF8" strokeWidth="2" />
      <text x="390" y="164" textAnchor="middle" fill="#F1F5F9" fontSize="10.5" fontWeight="600">
        Condensador
      </text>

      {/* Bomba / Tren regenerativo */}
      {mode === 'regenerative-4c' ? (
        <>
          <rect x="150" y="138" width="70" height="44" rx="5" fill="#0F1A2E" stroke="#2DD4BF" strokeWidth="1.8" />
          <text x="185" y="163" textAnchor="middle" fill="#2DD4BF" fontSize="10" fontWeight="600">
            CAA + P2
          </text>
          <rect x="60" y="138" width="65" height="44" rx="5" fill="#0F1A2E" stroke="#2DD4BF" strokeWidth="1.8" />
          <text x="92" y="163" textAnchor="middle" fill="#2DD4BF" fontSize="10" fontWeight="600">
            CAC
          </text>
          <line x1="390" y1="98" x2="185" y2="138" stroke="#F59E0B" strokeWidth="1.3" strokeDasharray="3 3" />
          <line x1="365" y1="95" x2="92" y2="138" stroke="#F87171" strokeWidth="1.3" strokeDasharray="3 3" />
        </>
      ) : (
        <>
          <circle cx="130" cy="160" r="20" fill="#14223B" stroke="#38BDF8" strokeWidth="2" />
          <text x="130" y="164" textAnchor="middle" fill="#F1F5F9" fontSize="10" fontWeight="600">
            Bomba
          </text>
        </>
      )}

      {/* Tuberías principales */}
      <line x1="190" y1="73" x2="335" y2="73" stroke="#F87171" strokeWidth="2.5" className="ft-flow-dash" />
      <line x1="390" y1="100" x2="390" y2="138" stroke="#2DD4BF" strokeWidth="2.2" />
      <line x1="325" y1="160" x2="150" y2="160" stroke="#38BDF8" strokeWidth="2" />
      <path d="M 105 138 L 105 104" stroke="#38BDF8" strokeWidth="2" fill="none" />

      {/* Selectores interactivos de estados */}
      {states.map((st, idx) => {
        const xPos = 45 + idx * (550 / Math.max(1, states.length - 1));
        const yPos = 208;
        const active = selectedId === st.id;
        const c = stateColor(st);
        return (
          <g
            key={st.id}
            tabIndex={0}
            role="button"
            aria-label={`Inspeccionar estado ${st.id}`}
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
              fill={active ? c : '#14223B'}
              stroke={c}
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
