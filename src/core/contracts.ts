/**
 * Contratos principales de FluidoTermo Lab (Parte 2: MEC110 & integración Parte 3).
 * Módulo puro sin dependencias de UI ni navegador.
 */

export type SubjectCode = 'MEC110' | 'MEC120';

export type DepthLevel = 'desde-cero' | 'universitario' | 'certamen';

export type ValidationStatus =
  | 'verificado'
  | 'aproximado'
  | 'requiere_fuente'
  | 'inconsistente'
  | 'fuera_de_dominio';

export type SimulationLifecycle =
  | 'idle'
  | 'computing'
  | 'ready'
  | 'out-of-domain'
  | 'scientifically-invalid'
  | 'numeric-error';

export type Phase =
  | 'compressed-liquid'
  | 'saturated-liquid'
  | 'two-phase'
  | 'saturated-vapor'
  | 'superheated-vapor'
  | 'supercritical'
  | 'ideal-gas'
  | 'unknown';

export interface Provenance {
  kind: 'lecture' | 'book-reference' | 'original' | 'iapws-if97';
  provider: string;
  version: string;
  title?: string;
  chapter?: string;
  section?: string;
  slide?: number;
  license?: string;
  toleranceNote?: string;
  verified: boolean;
}

export interface DomainError {
  code:
    | 'OUT_OF_DOMAIN'
    | 'INVALID_PRESSURE'
    | 'INVALID_TEMPERATURE'
    | 'INVALID_QUALITY'
    | 'SECOND_LAW_VIOLATION'
    | 'INCONSISTENT_TOPOLOGY'
    | 'SINGULAR_MATRIX'
    | 'CONVERGENCE_FAILURE'
    | 'UNSUPPORTED_FLUID';
  message: string;
  physicalExplanation: string;
  suggestedFix: string;
}

export type Result<T, E = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface ThermoState {
  id: string;
  label?: string;
  pPa: number;
  TK: number;
  hJkg: number;
  uJkg: number;
  sJkgK: number;
  vM3kg: number;
  phase: Phase;
  quality: number | null; // Exclusivo 0 <= x <= 1 en saturación / mezcla bifásica
  massFlowKgS?: number;
  provenance: Provenance;
}

export interface PropertyProvider {
  id: string;
  version: string;
  license: string;
  supportedFluids: string[];
  solvePT(fluid: string, pPa: number, TK: number): Result<ThermoState>;
  solvePS(fluid: string, pPa: number, sJkgK: number): Result<ThermoState>;
  solvePH(fluid: string, pPa: number, hJkg: number): Result<ThermoState>;
  solvePX(fluid: string, pPa: number, quality: number): Result<ThermoState>;
  saturationP(
    fluid: string,
    pPa: number
  ): Result<{ TSatK: number; liquid: ThermoState; vapor: ThermoState }>;
  saturationT(
    fluid: string,
    TK: number
  ): Result<{ pSatPa: number; liquid: ThermoState; vapor: ThermoState }>;
}

export interface SubstitutionItem {
  symbol: string;
  value: string;
  unit: string;
}

export interface SolvedStep {
  id: string;
  stepNumber: number;
  title: string;
  purpose: string;
  equationLatex: string;
  substitutions: SubstitutionItem[];
  resultValue: string;
  unit: string;
  assumptions: string[];
  interpretation: string;
  warning?: string;
}

export interface BalanceAudit {
  component: string;
  massInKgS: number;
  massOutKgS: number;
  massResidualKgS: number;
  energyInKW: number;
  energyOutKW: number;
  energyResidualKW: number;
  entropyGenKWK: number | null; // null si frontera térmica no está especificada
  entropyNote?: string;
}

export interface SolverMetadata {
  modelId: string;
  fluid: string;
  provider: string;
  providerVersion: string;
  providerLicense: string;
  hypotheses: string[];
  validationStatus: ValidationStatus;
  warnings: string[];
  balances: BalanceAudit[];
  overallEnergyResidualKW: number;
  overallMassResidualKgS: number;
}

// ---------------------------------------------------------------------------
// Contratos reservados para Parte 3 (Seguridad, Cuentas y Administración)
// No implementar autenticación en cliente en Parte 2.
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  displayName: string;
  role: 'student' | 'assistant' | 'instructor' | 'admin';
}

export interface AuthProvider {
  getCurrentUser(): Promise<AuthUser | null>;
  isAuthenticated(): boolean;
}

export interface LocalProgressSnapshot {
  completedLessons: string[];
  solvedExercises: Record<
    string,
    {
      attempts: number;
      correct: boolean;
      competencies: ('A' | 'B' | 'C' | 'D' | 'E')[];
      lastUpdatedIso: string;
    }
  >;
  errorNotebook: Array<{
    id: string;
    exerciseId: string;
    mistakeType: string;
    detail: string;
    timestampIso: string;
  }>;
  preferredDepth: DepthLevel;
  lastLessonId: string;
}

export interface UserProgressRepository {
  load(): Promise<LocalProgressSnapshot>;
  save(snapshot: LocalProgressSnapshot): Promise<void>;
}

export interface RolePolicy {
  canEditCurriculum(user: AuthUser | null): boolean;
  canPublishCases(user: AuthUser | null): boolean;
}
