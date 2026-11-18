import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, RotateCcw, Shuffle } from 'lucide-react';
import {
  createSeededRng,
  solveBoltzmannBox,
  solveTwoSystemEquilibrium,
} from '../../../core/thermo/boltzmann';
import { formatCL } from '../../../core/thermo/units';
import { AuditPanel } from '../../../components/AuditPanel';
import { PizarraProfesor } from '../../../components/PizarraProfesor';
import { SciChart } from '../../../components/charts/ThermoCharts';
import {
  BaselineComparator,
  InstrumentSlider,
  MetricTile,
  ModuleHero,
  PedagogicBlock,
} from '../../../components/ui/LabPrimitives';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
}

type MolecularSubmode = 'box' | 'thermal-equilibrium';

export const MolecularSimulator: React.FC = () => {
  const [submode, setSubmode] = useState<MolecularSubmode>('box');
  const [N, setN] = useState<number>(40);
  const [nSelected, setNSelected] = useState<number>(20);
  const [dividerRemoved, setDividerRemoved] = useState<boolean>(false);
  const [tempFactor, setTempFactor] = useState<number>(1.0);
  const [seed, setSeed] = useState<number>(2026);
  const [running, setRunning] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return true;
  });
  const [liveLeftCount, setLiveLeftCount] = useState<number>(40);
  const [sampledCounts, setSampledCounts] = useState<number[] | null>(null);

  // Parámetros de equilibrio térmico M1-C
  const [totalEnergy, setTotalEnergy] = useState<number>(13);
  const [oscA, setOscA] = useState<number>(4);
  const [oscB, setOscB] = useState<number>(6);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const dividerRef = useRef(dividerRemoved);
  const runningRef = useRef(running);
  const tempRef = useRef(tempFactor);

  dividerRef.current = dividerRemoved;
  runningRef.current = running;
  tempRef.current = tempFactor;

  const resetParticles = (count: number, currentSeed: number) => {
    const rng = createSeededRng(currentSeed);
    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const speed = 1.1 + rng() * 1.3;
      list.push({
        x: 20 + rng() * 210,
        y: 20 + rng() * 200,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        label: `M${i + 1}`,
      });
    }
    particlesRef.current = list;
    setLiveLeftCount(count);
    setDividerRemoved(false);
    setSampledCounts(null);
  };

  useEffect(() => {
    resetParticles(N, seed);
    setNSelected(Math.floor(N / 2));
  }, [N, seed]);

  // Loop Canvas 2D ligero sin setState a 60Hz (actualiza conteo cada 12 frames)
  useEffect(() => {
    if (submode !== 'box') return;
    let rafId = 0;
    let frameCount = 0;
    const width = 520;
    const height = 240;
    const midX = width / 2;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pts = particlesRef.current;
      const speedScale = tempRef.current;
      let leftCount = 0;

      if (runningRef.current) {
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          p.x += p.vx * speedScale;
          p.y += p.vy * speedScale;

          if (p.x < 10) {
            p.x = 10;
            p.vx = Math.abs(p.vx);
          } else if (p.x > width - 10) {
            p.x = width - 10;
            p.vx = -Math.abs(p.vx);
          }

          if (!dividerRef.current) {
            if (p.x > midX - 8 && p.x < midX + 8) {
              if (p.vx > 0 && p.x <= midX) {
                p.x = midX - 8;
                p.vx = -Math.abs(p.vx);
              } else if (p.vx < 0 && p.x >= midX) {
                p.x = midX + 8;
                p.vx = Math.abs(p.vx);
              }
            }
          }

          if (p.y < 10) {
            p.y = 10;
            p.vy = Math.abs(p.vy);
          } else if (p.y > height - 10) {
            p.y = height - 10;
            p.vy = -Math.abs(p.vy);
          }

          if (p.x < midX) leftCount++;
        }
      } else {
        for (let i = 0; i < pts.length; i++) {
          if (pts[i].x < midX) leftCount++;
        }
      }

      frameCount++;
      if (frameCount % 12 === 0) {
        setLiveLeftCount(leftCount);
      }

      ctx.fillStyle = '#070D18';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.fillRect(0, 0, midX, height);

      ctx.strokeStyle = '#1E314A';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('IZQUIERDA (L)', 14, 20);
      ctx.fillText('DERECHA (R)', midX + 14, 20);

      ctx.beginPath();
      if (!dividerRef.current) {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = '#1E314A';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
      }
      ctx.moveTo(midX, 8);
      ctx.lineTo(midX, height - 8);
      ctx.stroke();
      ctx.setLineDash([]);

      const radius = N <= 4 ? 8 : N <= 40 ? 4.5 : 2.8;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const inLeft = p.x < midX;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = inLeft ? '#38BDF8' : '#2DD4BF';
        ctx.fill();

        if (N <= 4) {
          ctx.fillStyle = '#070D18';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText(p.label, p.x - 6, p.y + 3);
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [submode, N]);

  const boltzRes = useMemo(() => solveBoltzmannBox(N, nSelected), [N, nSelected]);
  const eqRes = useMemo(
    () => solveTwoSystemEquilibrium(totalEnergy, oscA, oscB),
    [totalEnergy, oscA, oscB]
  );

  const runMonteCarloSampling = () => {
    const rng = createSeededRng(seed + 77);
    const trials = 400;
    const hist = new Array<number>(N + 1).fill(0);
    for (let t = 0; t < trials; t++) {
      let left = 0;
      for (let i = 0; i < N; i++) {
        if (rng() < 0.5) left++;
      }
      hist[left] += 1 / trials;
    }
    setSampledCounts(hist);
  };

  const exportCsv = () => {
    if (!boltzRes.ok) return;
    const header = 'n_izq,n_der,ln_Omega,P_teorica,S_Boltzmann_JK\n';
    const body = boltzRes.value.rows
      .map(
        (r) =>
          `${r.nLeft},${r.nRight},${r.logOmega.toFixed(6)},${r.probability.toExponential(6)},${r.entropyBoltzmannJK.toExponential(6)}`
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boltzmann_N${N}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreDefaults = () => {
    setN(40);
    setNSelected(20);
    setTempFactor(1.0);
    setTotalEnergy(13);
    setOscA(4);
    setOscB(6);
    resetParticles(40, 2026);
  };

  const modifiedCount =
    (N !== 40 ? 1 : 0) +
    (nSelected !== Math.floor(N / 2) ? 1 : 0) +
    (Math.abs(tempFactor - 1.0) > 1e-6 ? 1 : 0) +
    (totalEnergy !== 13 ? 1 : 0) +
    (oscA !== 4 ? 1 : 0) +
    (oscB !== 6 ? 1 : 0);

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Simulador 1 · MEC110_6 · Termodinámica Estadística"
        title="Laboratorio Estadístico de Boltzmann y Multiplicidad"
        subtitle="Combinatoria sin desbordamiento (logGamma), difusión molecular irreversible en caja de dos mitades y equilibrio térmico E + E' = 13."
        accent="cyan"
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-[#091120] border border-[#1E314A]">
              <button
                type="button"
                onClick={() => setSubmode('box')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  submode === 'box'
                    ? 'bg-[#38BDF8] text-[#070D18]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                Caja Molecular (M1-A/B)
              </button>
              <button
                type="button"
                onClick={() => setSubmode('thermal-equilibrium')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  submode === 'thermal-equilibrium'
                    ? 'bg-[#38BDF8] text-[#070D18]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                Equilibrio E + E&apos; = 13 (M1-C)
              </button>
            </div>

            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#091120] text-[#F1F5F9] hover:border-[#38BDF8] transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              Restaurar valores de cátedra
            </button>
          </div>
        }
      />

      <BaselineComparator
        isModified={modifiedCount > 0}
        modifiedCount={modifiedCount}
        sourceLabel="cátedra MEC110_6"
        onRestore={handleRestoreDefaults}
      />

      {submode === 'box' && boltzRes.ok && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Escena Canvas 2D */}
            <div className="lg:col-span-7 ft-panel p-5 flex flex-col justify-between gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#94A3B8]">
                  Conteo actual en lienzo:{' '}
                  <strong className="font-mono-num text-[#38BDF8]">{liveLeftCount} L</strong> /{' '}
                  <strong className="font-mono-num text-[#2DD4BF]">{N - liveLeftCount} R</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDividerRemoved((d) => !d)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      dividerRemoved
                        ? 'bg-[#1A1611] text-[#F59E0B] border-[#F59E0B]/60'
                        : 'bg-[#2DD4BF] text-[#070D18] border-[#2DD4BF]'
                    }`}
                  >
                    {dividerRemoved ? 'Reponer tabique' : 'Retirar tabique'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRunning((r) => !r)}
                    aria-label={running ? 'Pausar animación molecular' : 'Reanudar animación molecular'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#1E314A] bg-[#091120] text-[#F1F5F9] hover:border-[#38BDF8] cursor-pointer"
                  >
                    {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {running ? 'Pausar' : 'Reanudar'}
                  </button>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={520}
                height={240}
                data-testid="boltzmann-canvas"
                aria-label={`Caja molecular con ${N} partículas, ${liveLeftCount} en mitad izquierda y ${N - liveLeftCount} en derecha`}
                className="w-full h-auto rounded-xl border border-[#1E314A] bg-[#070D18]"
              />

              <PedagogicBlock kind="interpretation" title="Alcance del modelo cinético 2D">
                Trayectorias 2D ilustrativas de difusión libre. La curva teórica y el muestreo estadístico emplean la distribución binomial idealizada independiente (sin potencial molecular Lennard-Jones).
              </PedagogicBlock>
            </div>

            {/* Panel de controles y métricas */}
            <div className="lg:col-span-5 ft-panel p-5 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-[#94A3B8] mb-2">
                    Número de moléculas N (casos de cátedra)
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 40, 200].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setN(val)}
                        className={`py-2 text-xs font-mono-num font-semibold rounded-lg border transition-colors cursor-pointer ${
                          N === val
                            ? 'bg-[#38BDF8] text-[#070D18] border-[#38BDF8]'
                            : 'bg-[#091120] text-[#F1F5F9] border-[#1E314A] hover:border-[#38BDF8]'
                        }`}
                      >
                        N = {val}
                      </button>
                    ))}
                  </div>
                </div>

                <InstrumentSlider
                  id="boltz-n-slider"
                  label="Macroestado inspeccionado n (mitad izq.)"
                  value={nSelected}
                  unit={`/${N}`}
                  min={0}
                  max={N}
                  step={1}
                  defaultValue={Math.floor(N / 2)}
                  onChange={(v) => setNSelected(Math.max(0, Math.min(N, Math.round(v))))}
                  hint="Partículas en compartimento izquierdo"
                />

                <InstrumentSlider
                  id="boltz-temp-slider"
                  label="Escala de agitación térmica visual"
                  value={tempFactor}
                  unit="×"
                  min={0.4}
                  max={2.4}
                  step={0.2}
                  defaultValue={1.0}
                  onChange={setTempFactor}
                  hint="Multiplicador visual de rapidez"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={runMonteCarloSampling}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#2DD4BF]/50 bg-[#091120] text-[#2DD4BF] hover:bg-[#2DD4BF] hover:text-[#070D18] transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" aria-hidden="true" />
                    Simular distribución estadística (400 ensayos, semilla {seed})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeed((s) => s + 1)}
                    className="px-3 py-2 text-xs rounded-lg border border-[#1E314A] bg-[#091120] text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer"
                  >
                    Nueva semilla
                  </button>
                </div>
              </div>

              {/* KPIs tabulares */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1E314A]">
                <MetricTile
                  label={`P(n = ${nSelected})`}
                  value={formatCL(boltzRes.value.selectedRow.probability * 100, 3)}
                  unit="%"
                  tone="cyan"
                />
                <MetricTile
                  label="Fluctuación σ/N"
                  value={formatCL(boltzRes.value.relativeFluctuation * 100, 2)}
                  unit="%"
                  tone="teal"
                />
                <MetricTile
                  label={`ln Ω(n=${nSelected})`}
                  value={formatCL(boltzRes.value.selectedRow.logOmega, 4)}
                  tone="neutral"
                />
                <MetricTile
                  label="S = k_B ln Ω"
                  value={boltzRes.value.selectedRow.entropyBoltzmannJK.toExponential(3)}
                  unit="J/K"
                  tone="amber"
                />
              </div>
            </div>
          </div>

          {/* Gráfico binomial teórico vs muestreo + Descarga CSV */}
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#1E314A] bg-[#0F1A2E] text-[#F1F5F9] hover:border-[#2DD4BF] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#2DD4BF]" aria-hidden="true" />
                Descargar tabla C(N,n) (CSV)
              </button>
            </div>
            <SciChart
              title={`Distribución combinatoria P(n) para N = ${N}`}
              subtitle="Probabilidad exacta binomial C(N,n)/2^N (y comparación muestreada si se ejecuta el experimento)"
              xLabel="Moléculas en mitad izquierda n [1]"
              yLabel="Probabilidad P(n) [%]"
              xDecimals={0}
              yDecimals={2}
              verticalMarkerX={{ x: nSelected, label: `n=${nSelected}`, color: '#F59E0B' }}
              series={[
                {
                  id: 'binom-theo',
                  name: 'Teórica exacta C(N,n)/2^N',
                  color: '#38BDF8',
                  showNodes: N <= 40,
                  points: boltzRes.value.rows.map((r) => ({
                    x: r.nLeft,
                    y: r.probability * 100,
                    label: `n=${r.nLeft}`,
                    extra: `lnΩ=${formatCL(r.logOmega, 2)}`,
                  })),
                },
                ...(sampledCounts
                  ? [
                      {
                        id: 'binom-sample',
                        name: 'Muestreo 400 ensayos',
                        color: '#2DD4BF',
                        dashed: true,
                        showNodes: N <= 40,
                        points: sampledCounts.map((p, idx) => ({
                          x: idx,
                          y: p * 100,
                          label: `Muestra n=${idx}`,
                        })),
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          <PizarraProfesor title={`Caja Molecular N = ${N}`} steps={boltzRes.value.steps} />
          <AuditPanel audit={boltzRes.value.audit} />
        </>
      )}

      {submode === 'thermal-equilibrium' && (
        <div className="space-y-6">
          <div className="ft-panel p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-[#F1F5F9]">
                  Equilibrio térmico de dos sistemas en contacto (E + E&apos; = {totalEnergy})
                </h3>
                <p className="text-xs text-[#F59E0B]">
                  {eqRes.provenanceNote}
                </p>
              </div>
              <div className="font-mono-num text-sm font-semibold text-[#2DD4BF] bg-[#091120] border border-[#1E314A] rounded-lg px-3.5 py-2">
                Máximo en E* = {eqRes.maxRow.EA}, E&apos;* = {eqRes.maxRow.EB} (P ={' '}
                {formatCL(eqRes.maxRow.probability * 100, 2)} %)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InstrumentSlider
                id="eq-etot"
                label="Energía total E + E'"
                value={totalEnergy}
                unit="cuantos"
                min={6}
                max={20}
                step={1}
                defaultValue={13}
                onChange={(v) => setTotalEnergy(Math.round(v))}
              />
              <InstrumentSlider
                id="eq-na"
                label="Grados libertad sistema A"
                value={oscA}
                unit="osc."
                min={2}
                max={8}
                step={1}
                defaultValue={4}
                onChange={(v) => setOscA(Math.round(v))}
              />
              <InstrumentSlider
                id="eq-nb"
                label="Grados libertad sistema B"
                value={oscB}
                unit="osc."
                min={2}
                max={10}
                step={1}
                defaultValue={6}
                onChange={(v) => setOscB(Math.round(v))}
              />
            </div>

            <div className="overflow-x-auto border border-[#1E314A] rounded-xl bg-[#091120]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B1322] text-[#94A3B8] border-b border-[#1E314A]">
                    <th className="py-2.5 px-3">E (A)</th>
                    <th className="py-2.5 px-3">E&apos; (B)</th>
                    <th className="py-2.5 px-3">Ω_A(E)</th>
                    <th className="py-2.5 px-3">Ω_B(E&apos;)</th>
                    <th className="py-2.5 px-3">Ω_tot = Ω_A·Ω_B</th>
                    <th className="py-2.5 px-3">ln Ω_tot</th>
                    <th className="py-2.5 px-3">P(E) [%]</th>
                  </tr>
                </thead>
                <tbody className="font-mono-num text-[#F1F5F9]">
                  {eqRes.rows.map((r) => {
                    const isMax = r.EA === eqRes.maxRow.EA;
                    return (
                      <tr
                        key={r.EA}
                        className={`border-t border-[#1E314A]/60 ${
                          isMax ? 'bg-[#0A1A26] text-[#2DD4BF] font-semibold' : 'hover:bg-[#14223B]/40'
                        }`}
                      >
                        <td className="py-2 px-3">{r.EA}</td>
                        <td className="py-2 px-3">{r.EB}</td>
                        <td className="py-2 px-3">{r.omegaA.toLocaleString('es-CL')}</td>
                        <td className="py-2 px-3">{r.omegaB.toLocaleString('es-CL')}</td>
                        <td className="py-2 px-3">{r.omegaTotal.toLocaleString('es-CL')}</td>
                        <td className="py-2 px-3">{formatCL(r.lnOmegaTotal, 3)}</td>
                        <td className="py-2 px-3">{formatCL(r.probability * 100, 2)} %</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <SciChart
            title="Multiplicidad conjunta P(E) en contacto térmico"
            subtitle="El equilibrio térmico coincide con la partición de máxima multiplicidad Ω_A·Ω_B"
            xLabel="Energía en sistema A (E) [cuantos]"
            yLabel="Probabilidad conjunta P(E) [%]"
            xDecimals={0}
            yDecimals={2}
            verticalMarkerX={{ x: eqRes.maxRow.EA, label: `Máximo E*=${eqRes.maxRow.EA}`, color: '#2DD4BF' }}
            series={[
              {
                id: 'eq-prob',
                name: 'P(E) conjunto',
                color: '#38BDF8',
                points: eqRes.rows.map((r) => ({
                  x: r.EA,
                  y: r.probability * 100,
                  label: `E=${r.EA}, E'=${r.EB}`,
                  extra: `Ω_tot=${r.omegaTotal}`,
                })),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};
