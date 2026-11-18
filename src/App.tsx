/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Atom,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Compass,
  Droplets,
  Flame,
  Gauge,
  Layers,
  Snowflake,
} from 'lucide-react';
import { TopBar, type MainSection } from './components/TopBar';
import { MetricTile, ThermoHeroVisual } from './components/ui/LabPrimitives';
import { EXERCISE_BANK, type ExerciseItem } from './content/mec110/exercises';
import { LESSONS } from './content/mec110/lessons';
import type { DepthLevel, LocalProgressSnapshot } from './core/contracts';
import { Mec120View } from './features/mec120/Mec120View';
import { CertamenView } from './features/thermo/exercises/CertamenView';
import { CatedraView } from './features/thermo/lessons/CatedraView';
import { BraytonSimulator } from './features/thermo/simulators/BraytonSimulator';
import { CarnotRefrigSimulator } from './features/thermo/simulators/CarnotRefrigSimulator';
import { MolecularSimulator } from './features/thermo/simulators/MolecularSimulator';
import { RankineSimulator } from './features/thermo/simulators/RankineSimulator';
import { SteamTablesAndTools } from './features/thermo/tools/SteamTablesAndTools';
import { HeatTransferModule } from './features/heat-transfer/ui/HeatTransferModule';

export type ActiveTab =
  | 'home'
  | 'mec120'
  | 'catedra'
  | 'sim-boltzmann'
  | 'sim-carnot'
  | 'sim-brayton'
  | 'sim-rankine'
  | 'tools'
  | 'certamen'
  | 'heat-course'
  | 'heat-workshop'
  | 'heat-labs';

const STORAGE_KEY = 'fluidotermo.mec110.progress.v1';

const DEFAULT_PROGRESS: LocalProgressSnapshot = {
  completedLessons: [],
  solvedExercises: {},
  errorNotebook: [],
  preferredDepth: 'desde-cero',
  lastLessonId: 'T00.01',
};

function loadProgress(): LocalProgressSnapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<LocalProgressSnapshot>;
    return {
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      solvedExercises: parsed.solvedExercises ?? {},
      errorNotebook: Array.isArray(parsed.errorNotebook) ? parsed.errorNotebook : [],
      preferredDepth: parsed.preferredDepth ?? 'desde-cero',
      lastLessonId: parsed.lastLessonId ?? 'T00.01',
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

interface SidebarLinkItem {
  id: ActiveTab;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarGroup {
  id: 'fluids' | 'thermo' | 'heat';
  title: string;
  accent: string;
  items: SidebarLinkItem[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [progress, setProgress] = useState<LocalProgressSnapshot>(() => loadProgress());
  const [openGroups, setOpenGroups] = useState<Record<'fluids' | 'thermo' | 'heat', boolean>>({
    fluids: true,
    thermo: true,
    heat: true,
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignorar cuota de almacenamiento excedida en modo privado
    }
  }, [progress]);

  const topSection: MainSection = useMemo(() => {
    if (activeTab === 'home') return 'home';
    if (activeTab === 'mec120') return 'mec120';
    if (activeTab.startsWith('heat-')) return 'heat-transfer';
    if (activeTab === 'catedra' || activeTab === 'tools') return 'catedra';
    if (activeTab === 'certamen') return 'certamen';
    return 'simulators';
  }, [activeTab]);

  const handleTopNavigate = (section: MainSection) => {
    setMobileMenuOpen(false);
    if (section === 'home') setActiveTab('home');
    else if (section === 'mec120') setActiveTab('mec120');
    else if (section === 'heat-transfer') setActiveTab('heat-workshop');
    else if (section === 'catedra') setActiveTab('catedra');
    else if (section === 'certamen') setActiveTab('certamen');
    else setActiveTab('sim-rankine');
  };

  const handleStartFromZero = () => {
    setMobileMenuOpen(false);
    setProgress((prev) => ({
      ...prev,
      preferredDepth: 'desde-cero',
      lastLessonId: 'T00.01',
    }));
    setActiveTab('catedra');
  };

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const toggleLessonComplete = (id: string) => {
    setProgress((prev) => {
      const exists = prev.completedLessons.includes(id);
      return {
        ...prev,
        completedLessons: exists
          ? prev.completedLessons.filter((l) => l !== id)
          : [...prev.completedLessons, id],
      };
    });
  };

  const recordExerciseAttempt = (
    ex: ExerciseItem,
    correct: boolean,
    mistakeDetail?: { type: string; detail: string }
  ) => {
    setProgress((prev) => {
      const prevEntry = prev.solvedExercises[ex.id];
      const nextNotebook =
        !correct && mistakeDetail
          ? [
              {
                id: `${ex.id}-${Date.now()}`,
                exerciseId: ex.id,
                mistakeType: mistakeDetail.type,
                detail: mistakeDetail.detail,
                timestampIso: new Date().toISOString(),
              },
              ...prev.errorNotebook,
            ].slice(0, 30)
          : prev.errorNotebook;

      return {
        ...prev,
        solvedExercises: {
          ...prev.solvedExercises,
          [ex.id]: {
            attempts: (prevEntry?.attempts ?? 0) + 1,
            correct: Boolean(prevEntry?.correct || correct),
            competencies: ex.competencies,
            lastUpdatedIso: new Date().toISOString(),
          },
        },
        errorNotebook: nextNotebook,
      };
    });
  };

  const solvedCount = Object.values(progress.solvedExercises).filter((s) => s.correct).length;

  const sidebarGroups: SidebarGroup[] = [
    {
      id: 'fluids',
      title: 'MEC120 · Fluidos',
      accent: 'text-[#38BDF8]',
      items: [
        { id: 'mec120', label: 'MEC120 Fluidos', sub: 'Darcy-Weisbach e hidrostática', icon: Droplets },
      ],
    },
    {
      id: 'thermo',
      title: 'MEC110 · Termodinámica',
      accent: 'text-[#2DD4BF]',
      items: [
        { id: 'catedra', label: 'Cátedra MEC110', sub: 'Teoría guiada en 3 niveles', icon: BookOpen },
        { id: 'sim-boltzmann', label: 'Sim 1 · Molecular', sub: 'Multiplicidad Ω(N,n)', icon: Atom },
        { id: 'sim-carnot', label: 'Sim 2 · Carnot / Hielo', sub: 'COP, fuentes y cambio de fase', icon: Snowflake },
        { id: 'sim-brayton', label: 'Sim 3 · Brayton', sub: 'Gas ideal y ciclo de 10 estados', icon: Flame },
        { id: 'sim-rankine', label: 'Sim 4 · Rankine IF97', sub: 'Agua/vapor 4A, 4B y 4C', icon: Gauge },
        { id: 'tools', label: 'Tablas IF97 y Glosario', sub: 'Propiedades, unidades y 7 pasos', icon: Layers },
        { id: 'certamen', label: 'Certámenes MEC110', sub: `${solvedCount}/${EXERCISE_BANK.length} resueltos`, icon: ClipboardCheck },
      ],
    },
    {
      id: 'heat',
      title: 'Transferencia de Calor',
      accent: 'text-[#F59E0B]',
      items: [
        { id: 'heat-course', label: 'Calor · Aprender', sub: 'Fundamentos Cap. 1–14', icon: BookOpen },
        { id: 'heat-workshop', label: 'Calor · 5 Certámenes', sub: 'TC-C01 a TC-C05 paso a paso', icon: ClipboardCheck },
        { id: 'heat-labs', label: 'Calor · 5 Laboratorios', sub: 'Simuladores paramétricos SI', icon: Flame },
      ],
    },
  ];

  const toggleGroup = (gid: 'fluids' | 'thermo' | 'heat') => {
    setOpenGroups((prev) => ({ ...prev, [gid]: !prev[gid] }));
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-[#F1F5F9] flex flex-col">
      <TopBar
        activeSection={topSection}
        onNavigate={handleTopNavigate}
        onStartFromZero={handleStartFromZero}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((o) => !o)}
      />

      <div className="flex-1 flex relative">
        {/* Sidebar agrupado con acordeones por disciplina */}
        <aside
          aria-label="Navegación de módulos"
          className={`${
            mobileMenuOpen ? 'fixed inset-y-14 left-0 z-30 flex' : 'hidden lg:flex'
          } w-68 shrink-0 flex-col bg-[#0B1322] border-r border-[#1E314A] p-4 justify-between overflow-y-auto`}
        >
          <div className="space-y-4">
            {/* Acceso directo al resumen */}
            <button
              type="button"
              onClick={() => selectTab('home')}
              aria-current={activeTab === 'home' ? 'page' : undefined}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#14223B] border-[#38BDF8]/60 text-[#F1F5F9]'
                  : 'bg-transparent border-transparent text-[#94A3B8] hover:bg-[#14223B]/50 hover:text-[#F1F5F9]'
              }`}
            >
              <Compass
                className={`w-4 h-4 shrink-0 ${activeTab === 'home' ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}`}
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">Resumen general</div>
                <div className="text-[11px] opacity-80 truncate">Mapa de laboratorios</div>
              </div>
            </button>

            {sidebarGroups.map((group) => {
              const isOpen = openGroups[group.id];
              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold tracking-wide text-[#94A3B8] hover:text-[#F1F5F9] transition-colors cursor-pointer"
                  >
                    <span className={group.accent}>{group.title}</span>
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectTab(item.id)}
                            aria-current={active ? 'page' : undefined}
                            className={`w-full text-left px-3 py-2 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                              active
                                ? 'bg-[#14223B] border-[#38BDF8]/65 text-[#F1F5F9] shadow-sm'
                                : 'bg-transparent border-transparent text-[#94A3B8] hover:bg-[#111E33] hover:text-[#F1F5F9]'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 shrink-0 ${active ? 'text-[#38BDF8]' : 'text-[#64748B]'}`}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{item.label}</div>
                              <div className="text-[11px] text-[#64748B] truncate">{item.sub}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-[#1E314A] px-2 space-y-2 text-[11px] text-[#94A3B8]">
            <div className="font-semibold text-[#F1F5F9]">Avance de estudio local</div>
            <div className="flex items-center justify-between font-mono-num">
              <span>Lecciones MEC110</span>
              <span className="text-[#2DD4BF]">
                {progress.completedLessons.length}/{LESSONS.length}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono-num">
              <span>Certámenes MEC110</span>
              <span className="text-[#38BDF8]">
                {solvedCount}/{EXERCISE_BANK.length}
              </span>
            </div>
            <div className="text-[10px] text-[#64748B] pt-1 leading-relaxed">
              Guardado automáticamente en este navegador sin registro previo.
            </div>
          </div>
        </aside>

        {/* Backdrop móvil */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 top-14 z-20 bg-black/70 backdrop-blur-xs lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* Área principal */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
          {activeTab === 'home' && (
            <HomeDashboard
              completedCount={progress.completedLessons.length}
              totalLessons={LESSONS.length}
              solvedCount={solvedCount}
              totalExercises={EXERCISE_BANK.length}
              depthLevel={progress.preferredDepth}
              onSelectTab={selectTab}
              onStartFromZero={handleStartFromZero}
            />
          )}

          {activeTab === 'mec120' && <Mec120View />}

          {activeTab === 'catedra' && (
            <CatedraView
              selectedLessonId={progress.lastLessonId}
              onSelectLesson={(id) =>
                setProgress((prev) => ({ ...prev, lastLessonId: id }))
              }
              depthLevel={progress.preferredDepth}
              onChangeDepthLevel={(lvl: DepthLevel) =>
                setProgress((prev) => ({ ...prev, preferredDepth: lvl }))
              }
              completedLessons={progress.completedLessons}
              onToggleLessonComplete={toggleLessonComplete}
              onOpenSimulatorTab={(tab) => selectTab(tab)}
            />
          )}

          {activeTab === 'sim-boltzmann' && <MolecularSimulator />}
          {activeTab === 'sim-carnot' && <CarnotRefrigSimulator />}
          {activeTab === 'sim-brayton' && <BraytonSimulator />}
          {activeTab === 'sim-rankine' && <RankineSimulator />}
          {activeTab === 'tools' && <SteamTablesAndTools />}

          {activeTab === 'certamen' && (
            <CertamenView
              progress={progress}
              onRecordAttempt={recordExerciseAttempt}
              onClearNotebook={() =>
                setProgress((prev) => ({ ...prev, errorNotebook: [] }))
              }
              onOpenSimulatorTab={(tab) => selectTab(tab)}
            />
          )}

          {activeTab === 'heat-course' && (
            <HeatTransferModule
              initialSubTab="course"
              onChangeSubTab={(t) => {
                if (t === 'course') selectTab('heat-course');
                else if (t === 'workshop') selectTab('heat-workshop');
                else if (t === 'labs') selectTab('heat-labs');
              }}
            />
          )}
          {activeTab === 'heat-workshop' && (
            <HeatTransferModule
              initialSubTab="workshop"
              onChangeSubTab={(t) => {
                if (t === 'course') selectTab('heat-course');
                else if (t === 'workshop') selectTab('heat-workshop');
                else if (t === 'labs') selectTab('heat-labs');
              }}
            />
          )}
          {activeTab === 'heat-labs' && (
            <HeatTransferModule
              initialSubTab="labs"
              onChangeSubTab={(t) => {
                if (t === 'course') selectTab('heat-course');
                else if (t === 'workshop') selectTab('heat-workshop');
                else if (t === 'labs') selectTab('heat-labs');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

interface HomeDashboardProps {
  completedCount: number;
  totalLessons: number;
  solvedCount: number;
  totalExercises: number;
  depthLevel: DepthLevel;
  onSelectTab: (tab: ActiveTab) => void;
  onStartFromZero: () => void;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({
  completedCount,
  totalLessons,
  solvedCount,
  totalExercises,
  depthLevel,
  onSelectTab,
  onStartFromZero,
}) => {
  return (
    <div className="space-y-10">
      {/* Hero dividido con esquema interactivo acoplado */}
      <section className="relative overflow-hidden rounded-2xl border border-[#1E314A] bg-gradient-to-br from-[#0F1A2E] via-[#0B1424] to-[#08101D] p-6 sm:p-8 shadow-[0_18px_44px_-20px_rgba(2,6,16,0.9)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 ft-blueprint-bg opacity-65"
        />
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
          <div className="xl:col-span-7 space-y-4">
            <div className="text-xs font-semibold tracking-wide text-[#2DD4BF]">
              MEC120 Fluidos · MEC110 Termodinámica · Transferencia de Calor
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#F1F5F9] leading-[1.15]">
              Laboratorio Científico de Ingeniería Térmica y Fluidos
            </h1>
            <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed max-w-2xl">
              Explora fenómenos de flujo interno, ciclos de potencia con agua real <strong className="text-[#F1F5F9]">IAPWS-IF97</strong> y redes de transferencia de calor en SI puro, guiado paso a paso desde los fundamentos hasta problemas tipo certamen.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onStartFromZero}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-[#38BDF8] text-[#070D18] hover:bg-[#60CEFA] shadow-[0_0_24px_-6px_rgba(56,189,248,0.6)] transition-all cursor-pointer whitespace-nowrap"
              >
                Comenzar MEC110 Desde Cero
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('heat-workshop')}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-[#F59E0B] text-[#070D18] hover:bg-[#FBBF24] transition-all cursor-pointer whitespace-nowrap"
              >
                Abrir Transferencia de Calor
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('sim-rankine')}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg border border-[#1E314A] bg-[#14223B] text-[#F1F5F9] hover:border-[#2DD4BF] transition-colors cursor-pointer whitespace-nowrap"
              >
                Planta Rankine IF97
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('mec120')}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg border border-[#1E314A] bg-transparent text-[#CBD5E1] hover:text-[#F1F5F9] hover:border-[#38BDF8]/50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Ir a MEC120 Fluidos
              </button>
            </div>
          </div>

          <div className="xl:col-span-5">
            <ThermoHeroVisual onSelectArea={(area) => onSelectTab(area)} />
          </div>
        </div>
      </section>

      {/* Tira KPI de plataforma */}
      <section aria-label="Resumen de capacidades y avance" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Lecciones MEC110"
          value={`${completedCount}/${totalLessons}`}
          tone="teal"
          caption={`Nivel activo: ${depthLevel}`}
        />
        <MetricTile
          label="Certámenes MEC110"
          value={`${solvedCount}/${totalExercises}`}
          tone="cyan"
          caption="Evaluación con diagnóstico SI"
        />
        <MetricTile
          label="Simuladores interactivos"
          value="9"
          unit="labs"
          tone="amber"
          caption="4 MEC110 + 5 Calor + Hidráulica"
        />
        <MetricTile
          label="Motor de propiedades"
          value="IF97"
          unit="R7-97"
          tone="neutral"
          caption="Agua/vapor y aire estándar SI"
        />
      </section>

      {/* Los 4 simuladores de Termodinámica MEC110 */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#1E314A] pb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F1F5F9]">
              Simuladores de Termodinámica MEC110
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Diagramas T–s / h–s / P–v reactivos, pizarra matemática paso a paso y auditoría de conservación
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('tools')}
            className="text-xs font-semibold text-[#38BDF8] hover:text-[#F1F5F9] transition-colors cursor-pointer whitespace-nowrap"
          >
            Abrir tablas IF97 y conversor SI →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              tab: 'sim-boltzmann' as const,
              code: 'Simulador 1 · MEC110_6',
              title: 'Caja Molecular y Boltzmann',
              desc: 'Ensamble de N=2 a 200 partículas con multiplicidad exacta Ω(N,n) y equilibrio térmico de dos sistemas.',
              accent: 'text-[#38BDF8]',
              icon: Atom,
            },
            {
              tab: 'sim-carnot' as const,
              code: 'Simulador 2 · MEC110_7',
              title: 'Carnot, Refrigeración y Hielo',
              desc: 'Máquina térmica reversible, tres fuentes energéticas, frigorífico intermitente y balances con cambio de fase.',
              accent: 'text-[#2DD4BF]',
              icon: Snowflake,
            },
            {
              tab: 'sim-brayton' as const,
              code: 'Simulador 3 · MEC110_8',
              title: 'Turbina de Gas Brayton',
              desc: 'Compresión en dos etapas, sensibilidad de rendimientos, razón óptima r_p* y ciclo completo de 10 estados.',
              accent: 'text-[#F59E0B]',
              icon: Flame,
            },
            {
              tab: 'sim-rankine' as const,
              code: 'Simulador 4 · MEC110_9',
              title: 'Planta de Vapor Rankine IF97',
              desc: 'Campana real de saturación IAPWS-IF97, recalentamiento 4B y ciclo regenerativo 4C con matriz 4×4.',
              accent: 'text-[#2DD4BF]',
              icon: Gauge,
            },
          ].map((sim) => {
            const Icon = sim.icon;
            return (
              <button
                key={sim.tab}
                type="button"
                onClick={() => onSelectTab(sim.tab)}
                className="group text-left rounded-xl border border-[#1E314A] bg-[#0F1A2E] hover:border-[#38BDF8]/70 hover:bg-[#132238] p-5 space-y-3 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono-num font-semibold ${sim.accent}`}>
                      {sim.code}
                    </span>
                    <Icon className={`w-4 h-4 ${sim.accent} transition-transform duration-200 group-hover:scale-110`} />
                  </div>
                  <h3 className="font-display text-base font-bold text-[#F1F5F9]">{sim.title}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{sim.desc}</p>
                </div>
                <div className="text-xs font-semibold text-[#38BDF8] pt-1">
                  Abrir laboratorio →
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Transferencia de Calor — 3 experiencias conectadas */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#1E314A] pb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F1F5F9]">
              Transferencia de Calor — Curso, Taller de Certamen y Laboratorios
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Conducción, convección, radiación T⁴, resistencias en serie, régimen transitorio Bi/Fo e intercambiadores LMTD/NTU
            </p>
          </div>
          <span className="text-xs font-mono-num text-[#F59E0B]">
            5 casos progresivos · SI estricto
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onSelectTab('heat-course')}
            className="text-left rounded-xl border border-[#1E314A] bg-[#0F1A2E] hover:border-[#38BDF8]/70 hover:bg-[#132238] p-5 space-y-2.5 transition-all cursor-pointer"
          >
            <div className="text-xs font-mono-num font-semibold text-[#38BDF8]">
              Experiencia A · Cap. 1–14
            </div>
            <h3 className="font-display text-base font-bold text-[#F1F5F9]">
              Aprender la materia
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Fundamentos desde cero con analogías físicas, diccionario de símbolos SI, leyes de Fourier, Newton y Stefan–Boltzmann, diferencias finitas y cambio de fase.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('heat-workshop')}
            className="text-left rounded-xl border border-[#1E314A] bg-[#0F1A2E] hover:border-[#F59E0B]/70 hover:bg-[#132238] p-5 space-y-2.5 transition-all cursor-pointer"
          >
            <div className="text-xs font-mono-num font-semibold text-[#F59E0B]">
              Experiencia B · TC-C01 a TC-C05
            </div>
            <h3 className="font-display text-base font-bold text-[#F1F5F9]">
              Taller de Certamen (5 casos)
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Techo 1-5, Convección+Radiación 1-10, Doble vidrio 3-3, Termopar 4-1 y Doble tubo 11-4 con comprobador de pasos, pistas graduales y teoría lateral.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('heat-labs')}
            className="text-left rounded-xl border border-[#1E314A] bg-[#0F1A2E] hover:border-[#2DD4BF]/70 hover:bg-[#132238] p-5 space-y-2.5 transition-all cursor-pointer"
          >
            <div className="text-xs font-mono-num font-semibold text-[#2DD4BF]">
              Experiencia C · Simuladores A–E
            </div>
            <h3 className="font-display text-base font-bold text-[#F1F5F9]">
              Laboratorios Interactivos
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Esquemas cutaway con escala térmica, gráficas sincronizadas, bloqueos de validez científica (Bi ≥ 0,1, cruce térmico) y desarrollo en 12+ pasos.
            </p>
          </button>
        </div>
      </section>

      {/* Pie científico: MEC120 + Motor Termodinámico */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#1E314A] bg-[#0B1322] p-5 flex items-start justify-between gap-4">
          <div className="space-y-1.5 text-xs">
            <h3 className="font-display text-sm font-semibold text-[#F1F5F9]">
              Mecánica de Fluidos (MEC120)
            </h3>
            <p className="text-[#94A3B8] leading-relaxed">
              Cálculo de pérdidas por fricción mediante Darcy–Weisbach y ecuación explícita de Swamee–Jain junto a presión hidrostática en conductos circulares.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('mec120')}
            className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#1E314A] bg-[#14223B] text-[#38BDF8] hover:border-[#38BDF8] transition-colors cursor-pointer whitespace-nowrap"
          >
            Abrir MEC120
          </button>
        </div>

        <div className="rounded-xl border border-[#1E314A] bg-[#0B1322] p-5 space-y-1.5 text-xs">
          <h3 className="font-display text-sm font-semibold text-[#F1F5F9]">
            Rigor de cálculo y trazabilidad bibliográfica
          </h3>
          <p className="text-[#94A3B8] leading-relaxed">
            Propiedades de agua y vapor mediante ecuaciones oficiales <strong className="text-[#2DD4BF]">IAPWS-IF97 R7-97(2012)</strong> (Regiones 1, 2 y 4) y referencias temáticas a Çengel &amp; Boles (Termodinámica, 7.ª ed.) y Çengel (Transferencia de Calor, 3.ª ed.).
          </p>
        </div>
      </section>
    </div>
  );
};
