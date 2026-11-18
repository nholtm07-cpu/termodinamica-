/**
 * Tipos de dominio e interfaces inmutables para Transferencia de Calor (TC-C01 a TC-C05).
 */

export type HeatCaseId = 'TC-C01' | 'TC-C02' | 'TC-C03' | 'TC-C04' | 'TC-C05';

export type LearningMode = 'desde-cero' | 'guiado' | 'certamen' | 'simulador';

export type StepValidity = 'ok' | 'warning' | 'blocked';

export interface ParameterDomain {
  min?: number;
  max?: number;
  minExclusive?: boolean;
  maxExclusive?: boolean;
}

export interface Parameter {
  id: string;
  symbol: string;
  label: string;
  value: number;
  unit: string;
  step: number;
  domain: ParameterDomain;
  source: 'book_preset' | 'student_modified';
  explanation: string;
}

export interface SourceReference {
  author: 'Yunus A. Çengel';
  title: 'Transferencia de calor y masa: un enfoque práctico';
  edition: '3.ª';
  chapter: number;
  exampleId: string;
  printedPages: string;
  pdfPages: string;
}

export interface CalculationStep {
  id: string;
  position: number;
  label: string;
  law: string;
  why: string;
  formulaLatex: string;
  substitutionLatex: string;
  value: number | null;
  displayValue: string;
  unit: string;
  dependencies: string[];
  assumptions: string[];
  validity: StepValidity;
  errorCode?: string;
  algebraNote?: string;
}

export interface ValidationCheck {
  id: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'error';
  explanation: string;
}

export interface DomainIssue {
  code: string;
  field?: string;
  message: string;
  physicalExplanation: string;
  suggestedFix: string;
}

export interface ChartSeriesData {
  id: string;
  title: string;
  subtitle: string;
  xLabel: string;
  yLabel: string;
  xDecimals?: number;
  yDecimals?: number;
  markerX?: { x: number; label: string; color?: string };
  series: Array<{
    id: string;
    name: string;
    color: string;
    dashed?: boolean;
    showNodes?: boolean;
    points: Array<{ x: number; y: number; id?: string; label?: string; extra?: string }>;
  }>;
}

export interface HeatEvaluation {
  caseId: HeatCaseId;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  source: SourceReference;
  premise: string;
  assumptions: string[];
  inputs: Record<string, Parameter>;
  isModifiedFromBook: boolean;
  modifiedFields: string[];
  status: 'valid' | 'warning' | 'invalid';
  blockingIssue?: DomainIssue;
  warnings: string[];
  result: Record<string, number | string | null>;
  primaryMetrics: Array<{
    id: string;
    label: string;
    value: string;
    unit: string;
    accent: 'blue' | 'teal' | 'amber' | 'red';
    bookReference?: string;
  }>;
  steps: CalculationStep[];
  checks: ValidationCheck[];
  charts: ChartSeriesData[];
  diagramSnapshot: {
    type: HeatCaseId;
    data: Record<string, unknown>;
  };
  workshopQuestions: Array<{
    id: string;
    prompt: string;
    targetUnit: string;
    expectedValue: number;
    toleranceRel: number;
    hint: string;
    explanation: string;
  }>;
}
