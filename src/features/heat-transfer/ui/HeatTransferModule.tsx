import React, { useEffect, useMemo, useState } from 'react';
import { BookMarked, BookOpen, ClipboardCheck, Flame } from 'lucide-react';
import { clonePresetInputs } from '../data/book-presets';
import type { HeatExchangerFlowMode } from '../domain/cases/C05';
import type { HeatCaseId, LearningMode, Parameter } from '../domain/models';
import { evaluateHeatCase } from '../domain/solver';
import { HEAT_LESSONS } from '../content/lessons';
import { ModuleHero } from '../../../components/ui/LabPrimitives';
import { ExamWorkshop } from './ExamWorkshop';
import { HeatCoursePage } from './HeatCoursePage';
import { HeatLabPage } from './HeatLabPage';
import { HeatReferencePage } from './HeatReferencePage';

export type HeatSubTab = 'course' | 'workshop' | 'labs' | 'reference';

interface HeatLocalProgress {
  completedLessons: string[];
  solvedCases: string[];
  lastLessonId: string;
}

const HT_STORAGE_KEY = 'fluidotermo.heatTransfer.progress.v1';

function loadHTProgress(): HeatLocalProgress {
  try {
    const raw = window.localStorage.getItem(HT_STORAGE_KEY);
    if (!raw) return { completedLessons: [], solvedCases: [], lastLessonId: 'HT-00' };
    const parsed = JSON.parse(raw) as Partial<HeatLocalProgress>;
    return {
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      solvedCases: Array.isArray(parsed.solvedCases) ? parsed.solvedCases : [],
      lastLessonId: typeof parsed.lastLessonId === 'string' ? parsed.lastLessonId : 'HT-00',
    };
  } catch {
    return { completedLessons: [], solvedCases: [], lastLessonId: 'HT-00' };
  }
}

interface HeatTransferModuleProps {
  initialSubTab?: HeatSubTab;
  onChangeSubTab?: (tab: HeatSubTab) => void;
}

export const HeatTransferModule: React.FC<HeatTransferModuleProps> = ({
  initialSubTab = 'workshop',
  onChangeSubTab,
}) => {
  const [subTab, setSubTab] = useState<HeatSubTab>(initialSubTab);
  const [activeCaseId, setActiveCaseId] = useState<HeatCaseId>('TC-C01');
  const [mode, setMode] = useState<LearningMode>('guiado');
  const [flowMode, setFlowMode] = useState<HeatExchangerFlowMode>('counterflow');
  const [playbackTimeSec, setPlaybackTimeSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [inputsByCase, setInputsByCase] = useState<Record<HeatCaseId, Record<string, Parameter>>>(() => ({
    'TC-C01': clonePresetInputs('TC-C01'),
    'TC-C02': clonePresetInputs('TC-C02'),
    'TC-C03': clonePresetInputs('TC-C03'),
    'TC-C04': clonePresetInputs('TC-C04'),
    'TC-C05': clonePresetInputs('TC-C05'),
  }));

  const [progress, setProgress] = useState<HeatLocalProgress>(() => loadHTProgress());

  useEffect(() => {
    try {
      window.localStorage.setItem(HT_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignorar cuota en navegador privado
    }
  }, [progress]);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const selectSubTab = (next: HeatSubTab) => {
    setSubTab(next);
    onChangeSubTab?.(next);
  };

  const activeInputs = inputsByCase[activeCaseId];
  const evaluation = useMemo(
    () =>
      evaluateHeatCase(activeCaseId, activeInputs, {
        playbackTimeSec,
        flowMode,
      }),
    [activeCaseId, activeInputs, playbackTimeSec, flowMode]
  );

  const handleChangeParam = (id: string, value: number) => {
    setInputsByCase((prev) => ({
      ...prev,
      [activeCaseId]: {
        ...prev[activeCaseId],
        [id]: {
          ...prev[activeCaseId][id],
          value,
          source: 'student_modified',
        },
      },
    }));
  };

  const handleRestoreBook = () => {
    setIsPlaying(false);
    setPlaybackTimeSec(0);
    if (activeCaseId === 'TC-C05') setFlowMode('counterflow');
    setInputsByCase((prev) => ({
      ...prev,
      [activeCaseId]: clonePresetInputs(activeCaseId),
    }));
  };

  const handleSelectCase = (cid: HeatCaseId) => {
    setIsPlaying(false);
    setActiveCaseId(cid);
  };

  const navButtons: Array<{
    id: HeatSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'course', label: 'Aprender la materia', icon: BookOpen },
    { id: 'workshop', label: 'Taller de Certamen (5 casos)', icon: ClipboardCheck },
    { id: 'labs', label: 'Laboratorios (5 simuladores)', icon: Flame },
    { id: 'reference', label: 'Formulario y Bibliografía', icon: BookMarked },
  ];

  return (
    <div className="space-y-6">
      <ModuleHero
        eyebrow="Transferencia de Calor · Desde cero hasta diseño tipo certamen"
        title="Curso Conceptual, Taller de Cinco Certámenes y Laboratorios SI"
        subtitle="Conducción estacionaria, convección–radiación acoplada, redes térmicas, régimen transitorio Biot/Fourier e intercambiadores LMTD/NTU."
        accent="amber"
        rightSlot={
          <div className="text-xs font-mono-num text-[#94A3B8] bg-[#091120] border border-[#1E314A] rounded-lg px-3 py-2">
            Avance: <strong className="text-[#F1F5F9]">{progress.completedLessons.length}/{HEAT_LESSONS.length}</strong> lecciones ·{' '}
            <strong className="text-[#2DD4BF]">{progress.solvedCases.length}/5</strong> casos
          </div>
        }
      >
        <nav
          aria-label="Secciones de Transferencia de Calor"
          className="inline-flex flex-wrap items-center gap-1 bg-[#091120] border border-[#1E314A] p-1 rounded-xl"
        >
          {navButtons.map((b) => {
            const Icon = b.icon;
            const active = subTab === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => selectSubTab(b.id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#38BDF8] text-[#070D18]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#14223B]/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {b.label}
              </button>
            );
          })}
        </nav>
      </ModuleHero>

      {subTab === 'course' && (
        <HeatCoursePage
          selectedLessonId={progress.lastLessonId}
          onSelectLesson={(id) => setProgress((p) => ({ ...p, lastLessonId: id }))}
          completedLessons={progress.completedLessons}
          onToggleComplete={(id) =>
            setProgress((p) => ({
              ...p,
              completedLessons: p.completedLessons.includes(id)
                ? p.completedLessons.filter((l) => l !== id)
                : [...p.completedLessons, id],
            }))
          }
          onOpenCaseInWorkshop={(cid) => {
            setActiveCaseId(cid);
            selectSubTab('workshop');
          }}
        />
      )}

      {subTab === 'workshop' && (
        <ExamWorkshop
          activeCaseId={activeCaseId}
          onSelectCase={handleSelectCase}
          mode={mode}
          onChangeMode={setMode}
          inputs={activeInputs}
          evaluation={evaluation}
          flowMode={flowMode}
          onChangeFlowMode={setFlowMode}
          onChangeParam={handleChangeParam}
          onRestoreBook={handleRestoreBook}
          onOpenLabForCase={(cid) => {
            setActiveCaseId(cid);
            selectSubTab('labs');
          }}
          onMarkCaseSolved={(cid) =>
            setProgress((p) =>
              p.solvedCases.includes(cid) ? p : { ...p, solvedCases: [...p.solvedCases, cid] }
            )
          }
          solvedCases={progress.solvedCases}
        />
      )}

      {subTab === 'labs' && (
        <HeatLabPage
          activeCaseId={activeCaseId}
          onSelectCase={handleSelectCase}
          inputs={activeInputs}
          evaluation={evaluation}
          flowMode={flowMode}
          onChangeFlowMode={setFlowMode}
          playbackTimeSec={playbackTimeSec}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onResetPlayback={() => {
            setIsPlaying(false);
            setPlaybackTimeSec(0);
          }}
          onScrubTime={setPlaybackTimeSec}
          onChangeParam={handleChangeParam}
          onRestoreBook={handleRestoreBook}
        />
      )}

      {subTab === 'reference' && (
        <HeatReferencePage
          completedLessonsCount={progress.completedLessons.length}
          totalLessonsCount={HEAT_LESSONS.length}
          solvedCasesCount={progress.solvedCases.length}
        />
      )}
    </div>
  );
};
