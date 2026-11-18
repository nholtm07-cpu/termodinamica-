/**
 * Motor puro para MEC110_8 (Simulador 3 — Turbina de gas Brayton y compresión multietapa):
 * - Compresión multietapa con interenfriamiento y presión óptima p_i = sqrt(p1*p2)
 * - Brayton simple ideal y real (η_c, η_t independientes)
 * - Tabla de sensibilidad dinámica (100, 85, 80, 75, 70, 65 %)
 * - Optimizador de razón de presiones r_p* para máximo trabajo neto
 * - Brayton regenerativo con validación T4 > T2
 * - Ciclo completo de 10 estados: interenfriamiento + recalentamiento + regeneración
 * - Trayectorias T-s y P-v sincronizadas + Pizarra de 12 pasos
 */

import type { BalanceAudit, Result, SolvedStep, SolverMetadata } from '../contracts';
import { AIR_CP_STD, AIR_K_STD, AIR_R } from './idealGas';
import { cToK, formatCL } from './units';

export type BraytonMode =
  | 'simple'
  | 'regenerative'
  | 'intercooling-reheat-regen'
  | 'two-stage-compression';

export interface BraytonInput {
  mode: BraytonMode;
  p1KPa: number;
  p2KPa: number;
  T1C: number;
  T3C: number; // T_max a entrada de turbina
  etaC: number; // 0.5..1.0
  etaT: number; // 0.5..1.0
  epsRegen: number; // 0..1
  pIntermediateKPa?: number; // opcional para 2 etapas / 10 estados
  TIntercoolC?: number; // por defecto igual a T1C
  TReheatC?: number; // por defecto igual a T3C
  massFlowKgS?: number;
  k?: number;
  cp?: number;
}

export interface BraytonStatePoint {
  id: string;
  label: string;
  pKPa: number;
  TK: number;
  TC: number;
  vM3kg: number;
  sRelKJkgK: number; // relativo al estado 1 (s1 = 0)
  hRelKJkg: number; // cp * T
}

export interface BraytonSensitivityRow {
  etaPct: number;
  wcKJkg: number;
  wtKJkg: number;
  wNetKJkg: number;
  qInKJkg: number;
  etaThPct: number;
  backWorkRatioPct: number;
}

export interface BraytonOutput {
  mode: BraytonMode;
  rp: number;
  rpOptWork: number;
  piOptKPa: number;
  states: BraytonStatePoint[];
  idealStates: BraytonStatePoint[];
  wcKJkg: number;
  wtKJkg: number;
  wNetKJkg: number;
  qInKJkg: number;
  qOutKJkg: number;
  qRegenKJkg: number;
  etaThermal: number;
  etaIdealSimple: number;
  backWorkRatio: number;
  powerNetKW: number;
  regenUseful: boolean;
  sensitivityTable: BraytonSensitivityRow[];
  rpSweep: Array<{ rp: number; wNetKJkg: number; etaPct: number; bwrPct: number }>;
  tsCurve: Array<{ s: number; T: number; branch: 'ideal' | 'real' }>;
  pvCurve: Array<{ v: number; p: number; branch: 'ideal' | 'real' }>;
  steps: SolvedStep[];
  audit: SolverMetadata;
}

export function solveBrayton(input: BraytonInput): Result<BraytonOutput> {
  const k = input.k ?? AIR_K_STD;
  const cp = input.cp ?? AIR_CP_STD;
  const R = AIR_R;
  const a = (k - 1) / k;
  const mDot = input.massFlowKgS ?? 1;

  const T1K = cToK(input.T1C);
  const T3K = cToK(input.T3C);
  const TInterK = cToK(input.TIntercoolC ?? input.T1C);
  const TReheatK = cToK(input.TReheatC ?? input.T3C);

  if (input.p1KPa <= 0 || input.p2KPa <= input.p1KPa) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PRESSURE',
        message: `Presión p2 (${formatCL(input.p2KPa, 1)} kPa) debe ser mayor que p1 (${formatCL(input.p1KPa, 1)} kPa) > 0.`,
        physicalExplanation: 'Un compresor requiere relación de presiones r_p = p2/p1 > 1.',
        suggestedFix: 'Ajusta p2 > p1 > 0.',
      },
    };
  }

  if (T1K <= 0 || T3K <= T1K) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TEMPERATURE',
        message: 'La temperatura máxima T3 debe superar a T1 en Kelvin.',
        physicalExplanation: 'Sin aporte térmico neto que eleve T3 > T2, el ciclo no produce trabajo positivo.',
        suggestedFix: 'Aumenta T3 o reduce T1.',
      },
    };
  }

  if (input.etaC <= 0.1 || input.etaC > 1 || input.etaT <= 0.1 || input.etaT > 1) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Las eficiencias isentrópicas deben estar en (0,1; 1,0].',
        physicalExplanation: 'Eficiencia > 100 % violaría la Segunda Ley en compresión o expansión adiabática.',
        suggestedFix: 'Elige eficiencias entre 50 % y 100 %.',
      },
    };
  }

  const rp = input.p2KPa / input.p1KPa;
  const piOptKPa = Math.sqrt(input.p1KPa * input.p2KPa);
  const rpOptWork = Math.pow(T3K / T1K, k / (2 * (k - 1)));

  const buildPoint = (id: string, label: string, pKPa: number, TK: number): BraytonStatePoint => ({
    id,
    label,
    pKPa,
    TK,
    TC: TK - 273.15,
    vM3kg: (R * TK) / pKPa,
    sRelKJkgK: cp * Math.log(TK / T1K) - R * Math.log(pKPa / input.p1KPa),
    hRelKJkg: cp * TK,
  });

  // Modo especial: compresión de 2 etapas (1 -> 2 -> 3 intercooler -> 4)
  if (input.mode === 'two-stage-compression') {
    const pi =
      input.pIntermediateKPa &&
      input.pIntermediateKPa > input.p1KPa &&
      input.pIntermediateKPa < input.p2KPa
        ? input.pIntermediateKPa
        : piOptKPa;

    const rp1 = pi / input.p1KPa;
    const rp2 = input.p2KPa / pi;

    const T2s = T1K * Math.pow(rp1, a);
    const T2a = T1K + (T2s - T1K) / input.etaC;
    const T3int = TInterK;
    const T4s = T3int * Math.pow(rp2, a);
    const T4a = T3int + (T4s - T3int) / input.etaC;

    const wc1 = cp * (T2a - T1K);
    const wc2 = cp * (T4a - T3int);
    const wcTotal = wc1 + wc2;
    const qInter = cp * (T2a - T3int);

    // Comparación con 1 sola etapa directa p1 -> p2
    const T2singleS = T1K * Math.pow(rp, a);
    const T2singleA = T1K + (T2singleS - T1K) / input.etaC;
    const wcSingle = cp * (T2singleA - T1K);

    const states = [
      buildPoint('1', 'Entrada Compresor 1', input.p1KPa, T1K),
      buildPoint('2', 'Salida Compresor 1', pi, T2a),
      buildPoint('3', 'Salida Interenfriador', pi, T3int),
      buildPoint('4', 'Salida Compresor 2', input.p2KPa, T4a),
    ];

    const idealStates = [
      buildPoint('1', 'Entrada Compresor 1', input.p1KPa, T1K),
      buildPoint('2s', 'Salida C1 ideal', pi, T2s),
      buildPoint('3', 'Salida Interenfriador', pi, T3int),
      buildPoint('4s', 'Salida C2 ideal', input.p2KPa, T4s),
    ];

    const steps = buildTwoStageSteps(input, pi, piOptKPa, wc1, wc2, wcTotal, wcSingle, qInter);

    return {
      ok: true,
      value: {
        mode: input.mode,
        rp,
        rpOptWork,
        piOptKPa,
        states,
        idealStates,
        wcKJkg: wcTotal,
        wtKJkg: 0,
        wNetKJkg: -wcTotal,
        qInKJkg: 0,
        qOutKJkg: qInter,
        qRegenKJkg: 0,
        etaThermal: 0,
        etaIdealSimple: 1 - Math.pow(rp, -a),
        backWorkRatio: 1,
        powerNetKW: -wcTotal * mDot,
        regenUseful: false,
        sensitivityTable: [],
        rpSweep: buildInterstageSweep(input.p1KPa, input.p2KPa, T1K, TInterK, input.etaC, a, cp),
        tsCurve: [],
        pvCurve: buildTwoStagePVCurve(states, idealStates),
        steps,
        audit: {
          modelId: 'two-stage-intercooled-compression',
          fluid: 'Aire (gas ideal, cp constante)',
          provider: 'Aire estándar (cp=1,005 kJ/(kg·K), k=1,4)',
          providerVersion: '1.0',
          providerLicense: 'Formulación clásica',
          hypotheses: [
            'Etapas adiabáticas',
            'Interenfriamiento a presión constante hasta T_inter',
            `p_i óptimo teórico = √(p1·p2) = ${formatCL(piOptKPa, 2)} kPa (válido bajo igual T_entrada y η_c)`,
          ],
          validationStatus: 'verificado',
          warnings:
            Math.abs(pi - piOptKPa) / piOptKPa > 0.02
              ? [
                  `Con p_i=${formatCL(pi, 1)} kPa (óptimo ${formatCL(piOptKPa, 1)} kPa), el trabajo de compresión (${formatCL(wcTotal, 2)} kJ/kg) supera el mínimo de dos etapas.`,
                ]
              : [],
          balances: [
            {
              component: 'Compresor 2 etapas + interenfriador',
              massInKgS: mDot,
              massOutKgS: mDot,
              massResidualKgS: 0,
              energyInKW: wcTotal * mDot,
              energyOutKW: (qInter + cp * (T4a - T1K)) * mDot,
              energyResidualKW: (wcTotal - qInter - cp * (T4a - T1K)) * mDot,
              entropyGenKWK: null,
            },
          ],
          overallEnergyResidualKW: (wcTotal - qInter - cp * (T4a - T1K)) * mDot,
          overallMassResidualKgS: 0,
        },
      },
    };
  }

  // Modo 10 estados: Interenfriamiento + Recalentamiento + Regeneración
  if (input.mode === 'intercooling-reheat-regen') {
    const pi =
      input.pIntermediateKPa &&
      input.pIntermediateKPa > input.p1KPa &&
      input.pIntermediateKPa < input.p2KPa
        ? input.pIntermediateKPa
        : piOptKPa;

    const rp1 = pi / input.p1KPa;
    const rp2 = input.p2KPa / pi;

    // Compresión 1->2 (C1), 2->3 (Interenfriador), 3->4 (C2)
    const T2s = T1K * Math.pow(rp1, a);
    const T2 = T1K + (T2s - T1K) / input.etaC;
    const T3 = TInterK;
    const T4s = T3 * Math.pow(rp2, a);
    const T4 = T3 + (T4s - T3) / input.etaC;

    // Expansión 6->7 (T1), 7->8 (Recalentador), 8->9 (T2)
    const T6 = T3K;
    const T7s = T6 * Math.pow(rp2, -a);
    const T7 = T6 - input.etaT * (T6 - T7s);
    const T8 = TReheatK;
    const T9s = T8 * Math.pow(rp1, -a);
    const T9 = T8 - input.etaT * (T8 - T9s);

    const regenUseful = T9 > T4;
    const effRegen = regenUseful ? input.epsRegen : 0;
    const T5 = T4 + effRegen * (T9 - T4);
    const T10 = T9 - (T5 - T4);

    const wc = cp * ((T2 - T1K) + (T4 - T3));
    const wt = cp * ((T6 - T7) + (T8 - T9));
    const wNet = wt - wc;
    const qIn = cp * ((T6 - T5) + (T8 - T7));
    const qOut = cp * ((T2 - T3) + (T10 - T1K));
    const qRegen = cp * (T5 - T4);
    const etaThermal = qIn > 0 ? wNet / qIn : 0;

    const warnings: string[] = [];
    if (!regenUseful) {
      warnings.push(
        `La regeneración no aporta precalentamiento útil (T9=${formatCL(T9, 1)} K <= T4=${formatCL(T4, 1)} K).`
      );
    }
    if (wNet <= 0) {
      warnings.push(
        `Trabajo neto negativo o nulo (${formatCL(wNet, 2)} kJ/kg): la turbina no alcanza a mover los compresores con estas eficiencias.`
      );
    }

    const states: BraytonStatePoint[] = [
      buildPoint('1', 'Entrada Compresor 1', input.p1KPa, T1K),
      buildPoint('2', 'Salida Compresor 1', pi, T2),
      buildPoint('3', 'Salida Interenfriador', pi, T3),
      buildPoint('4', 'Salida Compresor 2', input.p2KPa, T4),
      buildPoint('5', 'Regenerador (lado frío)', input.p2KPa, T5),
      buildPoint('6', 'Entrada Turbina 1', input.p2KPa, T6),
      buildPoint('7', 'Salida Turbina 1', pi, T7),
      buildPoint('8', 'Salida Recalentador', pi, T8),
      buildPoint('9', 'Salida Turbina 2', input.p1KPa, T9),
      buildPoint('10', 'Regenerador (escape)', input.p1KPa, T10),
    ];

    const idealStates = states; // simplificado para overlay
    const steps = buildSimpleBraytonSteps(input, rp, a, T2s, T2, T9s, T9, wc, wt, wNet, qIn, etaThermal, regenUseful, T5);

    return {
      ok: true,
      value: {
        mode: input.mode,
        rp,
        rpOptWork,
        piOptKPa,
        states,
        idealStates,
        wcKJkg: wc,
        wtKJkg: wt,
        wNetKJkg: wNet,
        qInKJkg: qIn,
        qOutKJkg: qOut,
        qRegenKJkg: qRegen,
        etaThermal,
        etaIdealSimple: 1 - Math.pow(rp, -a),
        backWorkRatio: wt > 0 ? wc / wt : 1,
        powerNetKW: wNet * mDot,
        regenUseful,
        sensitivityTable: buildSensitivityTable(T1K, T3K, rp, a, cp),
        rpSweep: buildRpSweep(T1K, T3K, input.etaC, input.etaT, a, cp),
        tsCurve: buildBraytonTSCurve(states, states),
        pvCurve: buildBraytonPVCurve(states, states),
        steps,
        audit: {
          modelId: 'brayton-10-state-complete',
          fluid: 'Aire estándar (gas ideal)',
          provider: 'Aire estándar (cp=1,005 kJ/(kg·K), k=1,4)',
          providerVersion: '1.0',
          providerLicense: 'Formulación clásica',
          hypotheses: [
            'Ciclo cerrado aire-estándar (10 estados)',
            'Sin pérdidas de presión en intercambiadores',
            'Regeneración desactivada automáticamente si T9 <= T4',
          ],
          validationStatus: wNet > 0 ? 'verificado' : 'inconsistente',
          warnings,
          balances: [
            {
              component: 'Ciclo Brayton 10 estados',
              massInKgS: mDot,
              massOutKgS: mDot,
              massResidualKgS: 0,
              energyInKW: qIn * mDot,
              energyOutKW: (wNet + qOut) * mDot,
              energyResidualKW: (qIn - qOut - wNet) * mDot,
              entropyGenKWK: null,
            },
          ],
          overallEnergyResidualKW: (qIn - qOut - wNet) * mDot,
          overallMassResidualKgS: 0,
        },
      },
    };
  }

  // Brayton simple o regenerativo (4 estados base + 5, 6 opcionales)
  const F = Math.pow(rp, a);
  const T2s = T1K * F;
  const T2 = T1K + (T2s - T1K) / input.etaC;
  const T4s = T3K / F;
  const T4 = T3K - input.etaT * (T3K - T4s);

  const regenUseful = input.mode === 'regenerative' && T4 > T2;
  const effRegen = regenUseful ? input.epsRegen : 0;
  const T5 = T2 + effRegen * (T4 - T2);
  const T6 = T4 - (T5 - T2);

  const wc = cp * (T2 - T1K);
  const wt = cp * (T3K - T4);
  const wNet = wt - wc;
  const qIn = cp * (T3K - (input.mode === 'regenerative' ? T5 : T2));
  const qOut = cp * ((input.mode === 'regenerative' ? T6 : T4) - T1K);
  const qRegen = input.mode === 'regenerative' ? cp * (T5 - T2) : 0;
  const etaThermal = qIn > 0 ? wNet / qIn : 0;
  const etaIdealSimple = 1 - 1 / F;
  const backWorkRatio = wt > 0 ? wc / wt : 1;

  const warnings: string[] = [];
  if (input.mode === 'regenerative' && T4 <= T2) {
    warnings.push(
      `La regeneración no aporta precalentamiento útil con esta configuración: T4 (${formatCL(T4, 1)} K) <= T2 (${formatCL(T2, 1)} K). Se desactiva recuperación positiva.`
    );
  }
  if (T3K <= T2) {
    warnings.push(
      `Advertencia: T3 (${formatCL(T3K, 1)} K) <= T2 (${formatCL(T2, 1)} K). El compresor supera la temperatura máxima de turbina.`
    );
  }
  if (wNet <= 0) {
    warnings.push(
      `Trabajo neto <= 0 (${formatCL(wNet, 2)} kJ/kg). El compresor consume más que lo producido por la turbina.`
    );
  }

  const states: BraytonStatePoint[] =
    input.mode === 'regenerative'
      ? [
          buildPoint('1', 'Entrada Compresor', input.p1KPa, T1K),
          buildPoint('2', 'Salida Compresor', input.p2KPa, T2),
          buildPoint('5', 'Salida Regenerador (frío)', input.p2KPa, T5),
          buildPoint('3', 'Entrada Turbina', input.p2KPa, T3K),
          buildPoint('4', 'Salida Turbina', input.p1KPa, T4),
          buildPoint('6', 'Escape Regenerador', input.p1KPa, T6),
        ]
      : [
          buildPoint('1', 'Entrada Compresor', input.p1KPa, T1K),
          buildPoint('2', 'Salida Compresor', input.p2KPa, T2),
          buildPoint('3', 'Entrada Turbina', input.p2KPa, T3K),
          buildPoint('4', 'Salida Turbina', input.p1KPa, T4),
        ];

  const idealStates: BraytonStatePoint[] = [
    buildPoint('1', 'Entrada Compresor', input.p1KPa, T1K),
    buildPoint('2s', 'Salida Compresor ideal', input.p2KPa, T2s),
    buildPoint('3', 'Entrada Turbina', input.p2KPa, T3K),
    buildPoint('4s', 'Salida Turbina ideal', input.p1KPa, T4s),
  ];

  const balance: BalanceAudit = {
    component: 'Ciclo Brayton completo',
    massInKgS: mDot,
    massOutKgS: mDot,
    massResidualKgS: 0,
    energyInKW: qIn * mDot,
    energyOutKW: (wNet + qOut) * mDot,
    energyResidualKW: (qIn - qOut - wNet) * mDot,
    entropyGenKWK: null,
  };

  const steps = buildSimpleBraytonSteps(
    input,
    rp,
    a,
    T2s,
    T2,
    T4s,
    T4,
    wc,
    wt,
    wNet,
    qIn,
    etaThermal,
    regenUseful,
    T5
  );

  return {
    ok: true,
    value: {
      mode: input.mode,
      rp,
      rpOptWork,
      piOptKPa,
      states,
      idealStates,
      wcKJkg: wc,
      wtKJkg: wt,
      wNetKJkg: wNet,
      qInKJkg: qIn,
      qOutKJkg: qOut,
      qRegenKJkg: qRegen,
      etaThermal,
      etaIdealSimple,
      backWorkRatio,
      powerNetKW: wNet * mDot,
      regenUseful,
      sensitivityTable: buildSensitivityTable(T1K, T3K, rp, a, cp),
      rpSweep: buildRpSweep(T1K, T3K, input.etaC, input.etaT, a, cp),
      tsCurve: buildBraytonTSCurve(states, idealStates),
      pvCurve: buildBraytonPVCurve(states, idealStates),
      steps,
      audit: {
        modelId: input.mode === 'regenerative' ? 'brayton-regenerative' : 'brayton-simple',
        fluid: 'Aire estándar (gas ideal)',
        provider: 'Aire estándar (cp=1,005 kJ/(kg·K), k=1,4)',
        providerVersion: '1.0',
        providerLicense: 'Formulación clásica',
        hypotheses: [
          'Aire como gas ideal con cp y cv constantes',
          'Ciclo cerrado aire-estándar',
          'Sin caídas de presión en combustión ni intercambiadores',
        ],
        validationStatus: wNet > 0 && T3K > T2 ? 'verificado' : 'inconsistente',
        warnings,
        balances: [balance],
        overallEnergyResidualKW: balance.energyResidualKW,
        overallMassResidualKgS: 0,
      },
    },
  };
}

function buildSensitivityTable(
  T1K: number,
  T3K: number,
  rp: number,
  a: number,
  cp: number
): BraytonSensitivityRow[] {
  const etas = [1.0, 0.85, 0.8, 0.75, 0.7, 0.65];
  const F = Math.pow(rp, a);
  const T2s = T1K * F;
  const T4s = T3K / F;
  return etas.map((eta) => {
    const T2 = T1K + (T2s - T1K) / eta;
    const T4 = T3K - eta * (T3K - T4s);
    const wc = cp * (T2 - T1K);
    const wt = cp * (T3K - T4);
    const wNet = wt - wc;
    const qIn = cp * (T3K - T2);
    const etaTh = qIn > 0 ? wNet / qIn : 0;
    return {
      etaPct: Math.round(eta * 100),
      wcKJkg: wc,
      wtKJkg: wt,
      wNetKJkg: wNet,
      qInKJkg: qIn,
      etaThPct: etaTh * 100,
      backWorkRatioPct: wt > 0 ? (wc / wt) * 100 : 100,
    };
  });
}

function buildRpSweep(
  T1K: number,
  T3K: number,
  etaC: number,
  etaT: number,
  a: number,
  cp: number
) {
  const points: Array<{ rp: number; wNetKJkg: number; etaPct: number; bwrPct: number }> = [];
  for (let rp = 1.5; rp <= 30; rp += 0.75) {
    const F = Math.pow(rp, a);
    const T2 = T1K + (T1K * F - T1K) / etaC;
    const T4 = T3K - etaT * (T3K - T3K / F);
    const wc = cp * (T2 - T1K);
    const wt = cp * (T3K - T4);
    const wNet = wt - wc;
    const qIn = cp * (T3K - T2);
    points.push({
      rp,
      wNetKJkg: wNet,
      etaPct: qIn > 0 && wNet > 0 ? (wNet / qIn) * 100 : 0,
      bwrPct: wt > 0 ? Math.min(150, (wc / wt) * 100) : 150,
    });
  }
  return points;
}

function buildInterstageSweep(
  p1: number,
  p2: number,
  T1K: number,
  TInterK: number,
  etaC: number,
  a: number,
  cp: number
) {
  const points: Array<{ rp: number; wNetKJkg: number; etaPct: number; bwrPct: number }> = [];
  const step = (p2 - p1) / 24;
  for (let pi = p1 + step * 0.5; pi < p2; pi += step) {
    const T2 = T1K + (T1K * Math.pow(pi / p1, a) - T1K) / etaC;
    const T4 = TInterK + (TInterK * Math.pow(p2 / pi, a) - TInterK) / etaC;
    const wc = cp * ((T2 - T1K) + (T4 - TInterK));
    points.push({ rp: pi, wNetKJkg: wc, etaPct: 0, bwrPct: 0 });
  }
  return points;
}

function buildBraytonTSCurve(
  realStates: BraytonStatePoint[],
  idealStates: BraytonStatePoint[]
): Array<{ s: number; T: number; branch: 'ideal' | 'real' }> {
  const out: Array<{ s: number; T: number; branch: 'ideal' | 'real' }> = [];
  const sampleIsobar = (p1: BraytonStatePoint, p2: BraytonStatePoint, branch: 'ideal' | 'real') => {
    const steps = 12;
    const denom = Math.log(p2.TK / p1.TK);
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const T = p1.TK + f * (p2.TK - p1.TK);
      const frac = Math.abs(denom) > 1e-9 ? Math.log(T / p1.TK) / denom : f;
      const s = p1.sRelKJkgK + (p2.sRelKJkgK - p1.sRelKJkgK) * frac;
      out.push({ s: Number.isFinite(s) ? s : p1.sRelKJkgK, T, branch });
    }
  };
  if (idealStates.length >= 4) {
    out.push({ s: idealStates[0].sRelKJkgK, T: idealStates[0].TK, branch: 'ideal' });
    out.push({ s: idealStates[1].sRelKJkgK, T: idealStates[1].TK, branch: 'ideal' });
    sampleIsobar(idealStates[1], idealStates[2], 'ideal');
    out.push({ s: idealStates[2].sRelKJkgK, T: idealStates[2].TK, branch: 'ideal' });
    out.push({ s: idealStates[3].sRelKJkgK, T: idealStates[3].TK, branch: 'ideal' });
    sampleIsobar(idealStates[3], idealStates[0], 'ideal');
  }
  for (let i = 0; i < realStates.length; i++) {
    const cur = realStates[i];
    const next = realStates[(i + 1) % realStates.length];
    if (Math.abs(cur.pKPa - next.pKPa) < 1e-3) {
      sampleIsobar(cur, next, 'real');
    } else {
      out.push({ s: cur.sRelKJkgK, T: cur.TK, branch: 'real' });
      out.push({ s: next.sRelKJkgK, T: next.TK, branch: 'real' });
    }
  }
  return out;
}

function buildBraytonPVCurve(
  realStates: BraytonStatePoint[],
  idealStates: BraytonStatePoint[]
): Array<{ v: number; p: number; branch: 'ideal' | 'real' }> {
  const out: Array<{ v: number; p: number; branch: 'ideal' | 'real' }> = [];
  const samplePolytropic = (a: BraytonStatePoint, b: BraytonStatePoint, branch: 'ideal' | 'real') => {
    const n = 10;
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const v = a.vM3kg + f * (b.vM3kg - a.vM3kg);
      const p =
        Math.abs(a.pKPa - b.pKPa) < 1e-3
          ? a.pKPa
          : a.pKPa * Math.pow(b.pKPa / a.pKPa, f);
      out.push({ v, p, branch });
    }
  };
  for (let i = 0; i < idealStates.length; i++) {
    samplePolytropic(idealStates[i], idealStates[(i + 1) % idealStates.length], 'ideal');
  }
  for (let i = 0; i < realStates.length; i++) {
    samplePolytropic(realStates[i], realStates[(i + 1) % realStates.length], 'real');
  }
  return out;
}

function buildTwoStagePVCurve(realStates: BraytonStatePoint[], idealStates: BraytonStatePoint[]) {
  const out: Array<{ v: number; p: number; branch: 'ideal' | 'real' }> = [];
  for (let i = 0; i < idealStates.length - 1; i++) {
    out.push({ v: idealStates[i].vM3kg, p: idealStates[i].pKPa, branch: 'ideal' });
    out.push({ v: idealStates[i + 1].vM3kg, p: idealStates[i + 1].pKPa, branch: 'ideal' });
  }
  for (let i = 0; i < realStates.length - 1; i++) {
    out.push({ v: realStates[i].vM3kg, p: realStates[i].pKPa, branch: 'real' });
    out.push({ v: realStates[i + 1].vM3kg, p: realStates[i + 1].pKPa, branch: 'real' });
  }
  return out;
}

function buildTwoStageSteps(
  input: BraytonInput,
  pi: number,
  piOpt: number,
  wc1: number,
  wc2: number,
  wcTotal: number,
  wcSingle: number,
  qInter: number
): SolvedStep[] {
  return [
    {
      id: 'br2-1',
      stepNumber: 1,
      title: 'Presión intermedia óptima teórica',
      purpose: 'Evaluar p_i* = √(p1·p2) bajo etapas equivalentes.',
      equationLatex: String.raw`p_i^* = \sqrt{p_1 p_2}`,
      substitutions: [
        { symbol: 'p_1', value: formatCL(input.p1KPa, 1), unit: 'kPa' },
        { symbol: 'p_2', value: formatCL(input.p2KPa, 1), unit: 'kPa' },
      ],
      resultValue: formatCL(piOpt, 2),
      unit: 'kPa',
      assumptions: ['Igual temperatura de entrada a ambas etapas e igual η_c'],
      interpretation: `Presión intermedia activa: ${formatCL(pi, 2)} kPa.`,
    },
    {
      id: 'br2-2',
      stepNumber: 2,
      title: 'Trabajo de las dos etapas con interenfriamiento',
      purpose: 'Sumar consumo de compresor 1 y compresor 2.',
      equationLatex: String.raw`w_{c,2\text{et}} = w_{c1} + w_{c2}`,
      substitutions: [
        { symbol: 'w_{c1}', value: formatCL(wc1, 2), unit: 'kJ/kg' },
        { symbol: 'w_{c2}', value: formatCL(wc2, 2), unit: 'kJ/kg' },
      ],
      resultValue: formatCL(wcTotal, 2),
      unit: 'kJ/kg',
      assumptions: [`Calor retirado en interenfriador = ${formatCL(qInter, 2)} kJ/kg`],
      interpretation: `Comparación frente a una sola etapa (${formatCL(wcSingle, 2)} kJ/kg): ahorro de ${formatCL(wcSingle - wcTotal, 2)} kJ/kg.`,
    },
  ];
}

function buildSimpleBraytonSteps(
  input: BraytonInput,
  rp: number,
  a: number,
  T2s: number,
  T2a: number,
  T4s: number,
  T4a: number,
  wc: number,
  wt: number,
  wNet: number,
  qIn: number,
  eta: number,
  regenUseful: boolean,
  T5: number
): SolvedStep[] {
  const T1K = cToK(input.T1C);
  const T3K = cToK(input.T3C);
  return [
    {
      id: 'br-1',
      stepNumber: 1,
      title: 'Definir modelo aire-estándar y dominio',
      purpose: 'Fijar constantes de gas ideal para aire a temperaturas moderadas.',
      equationLatex: String.raw`c_p = 1{,}005\;\frac{\mathrm{kJ}}{\mathrm{kg\cdot K}},\quad k = 1{,}4`,
      substitutions: [],
      resultValue: 'Aire estándar',
      unit: 'modelo',
      assumptions: ['Gas ideal con calores específicos constantes'],
      interpretation: 'Las variaciones reales de cp(T) a >1000 K se omiten en este nivel.',
    },
    {
      id: 'br-2',
      stepNumber: 2,
      title: 'Convertir presiones/temperaturas a SI y calcular r_p',
      purpose: 'Usar Kelvin obligatoriamente en relaciones isentrópicas.',
      equationLatex: String.raw`r_p = \frac{p_2}{p_1}, \qquad T[\mathrm{K}] = T[^\circ\mathrm{C}] + 273{,}15`,
      substitutions: [
        { symbol: 'r_p', value: formatCL(rp, 3), unit: '1' },
        { symbol: 'T_1', value: formatCL(T1K, 2), unit: 'K' },
        { symbol: 'T_3', value: formatCL(T3K, 2), unit: 'K' },
      ],
      resultValue: formatCL(rp, 3),
      unit: 'adim.',
      assumptions: ['Presiones absolutas'],
      interpretation: 'r_p gobierna la temperatura tras la compresión.',
    },
    {
      id: 'br-3',
      stepNumber: 3,
      title: 'Exponente isentrópico (k − 1)/k y factor F',
      purpose: 'Preparar r_p^((k−1)/k).',
      equationLatex: String.raw`F = r_p^{\frac{k-1}{k}}`,
      substitutions: [
        { symbol: '(k-1)/k', value: formatCL(a, 6), unit: '1' },
        { symbol: 'r_p', value: formatCL(rp, 3), unit: '1' },
      ],
      resultValue: formatCL(Math.pow(rp, a), 6),
      unit: 'adim.',
      assumptions: ['k = 1,4'],
      interpretation: 'Factor multiplicador de temperatura ideal en el compresor.',
    },
    {
      id: 'br-4',
      stepNumber: 4,
      title: 'Salida ideal del compresor (2s)',
      purpose: 'Calcular T_2s = T_1 · F.',
      equationLatex: String.raw`T_{2s} = T_1 \, r_p^{(k-1)/k}`,
      substitutions: [{ symbol: 'T_1', value: formatCL(T1K, 2), unit: 'K' }],
      resultValue: formatCL(T2s, 3),
      unit: 'K',
      assumptions: ['Compresión adiabática reversible'],
      interpretation: 'Temperatura mínima alcanzable al comprimir hasta p2 sin irreversibilidades.',
    },
    {
      id: 'br-5',
      stepNumber: 5,
      title: 'Salida ideal de la turbina (4s)',
      purpose: 'Calcular T_4s = T_3 / F.',
      equationLatex: String.raw`T_{4s} = T_3 \, r_p^{-(k-1)/k}`,
      substitutions: [{ symbol: 'T_3', value: formatCL(T3K, 2), unit: 'K' }],
      resultValue: formatCL(T4s, 3),
      unit: 'K',
      assumptions: ['Expansión adiabática reversible'],
      interpretation: 'Temperatura mínima ideal de descarga.',
    },
    {
      id: 'br-6',
      stepNumber: 6,
      title: 'Corrección real del compresor por η_c',
      purpose: 'Dividir por η_c: un compresor real calienta más el aire y consume más trabajo.',
      equationLatex: String.raw`T_{2a} = T_1 + \frac{T_{2s} - T_1}{\eta_c}`,
      substitutions: [{ symbol: String.raw`\eta_c`, value: formatCL(input.etaC, 2), unit: '1' }],
      resultValue: formatCL(T2a, 3),
      unit: 'K',
      assumptions: ['Compresor adiabático irreversible'],
      interpretation: 'Si η_c < 1, T_2a > T_2s.',
    },
    {
      id: 'br-7',
      stepNumber: 7,
      title: 'Corrección real de la turbina por η_t',
      purpose: 'Multiplicar por η_t: una turbina real entrega menos trabajo y sale más caliente.',
      equationLatex: String.raw`T_{4a} = T_3 - \eta_t (T_3 - T_{4s})`,
      substitutions: [{ symbol: String.raw`\eta_t`, value: formatCL(input.etaT, 2), unit: '1' }],
      resultValue: formatCL(T4a, 3),
      unit: 'K',
      assumptions: ['Turbina adiabática irreversible'],
      interpretation: 'Si η_t < 1, T_4a > T_4s.',
    },
    {
      id: 'br-8',
      stepNumber: 8,
      title: 'Precalentamiento regenerativo (si aplica)',
      purpose: 'Evaluar T_5 = T_2 + ε_reg (T_4 − T_2) verificando T_4 > T_2.',
      equationLatex: String.raw`T_5 = T_2 + \varepsilon_{\text{reg}}(T_4 - T_2)`,
      substitutions: [
        { symbol: String.raw`\varepsilon_{\text{reg}}`, value: formatCL(input.epsRegen, 2), unit: '1' },
      ],
      resultValue: regenUseful ? `${formatCL(T5, 2)} K` : 'No activo / no útil',
      unit: 'K',
      assumptions: ['Capacidades caloríficas equivalentes en lados frío y caliente'],
      interpretation: regenUseful
        ? 'El regenerador ahorra combustible aprovechando gases de escape.'
        : 'Sin regeneración activa o T4 <= T2.',
    },
    {
      id: 'br-9',
      stepNumber: 9,
      title: 'Trabajos de compresor y turbina',
      purpose: 'Aplicar balance estacionario con cp constante.',
      equationLatex: String.raw`w_c = c_p(T_2 - T_1), \qquad w_t = c_p(T_3 - T_4)`,
      substitutions: [
        { symbol: 'w_c', value: formatCL(wc, 2), unit: 'kJ/kg' },
        { symbol: 'w_t', value: formatCL(wt, 2), unit: 'kJ/kg' },
      ],
      resultValue: `${formatCL(wc, 2)} / ${formatCL(wt, 2)}`,
      unit: 'kJ/kg',
      assumptions: ['ΔEc ≈ 0, ΔEp ≈ 0'],
      interpretation: `Relación de trabajo de retroceso bwr = w_c/w_t = ${formatCL((wc / Math.max(1e-6, wt)) * 100, 1)} %.`,
    },
    {
      id: 'br-10',
      stepNumber: 10,
      title: 'Trabajo neto, calor aportado y eficiencia térmica',
      purpose: 'Calcular w_neto = w_t − w_c y η_th = w_neto / q_in.',
      equationLatex: String.raw`\eta_{th} = \frac{w_t - w_c}{q_{\text{in}}}`,
      substitutions: [
        { symbol: 'w_{\\text{neto}}', value: formatCL(wNet, 2), unit: 'kJ/kg' },
        { symbol: 'q_{\\text{in}}', value: formatCL(qIn, 2), unit: 'kJ/kg' },
      ],
      resultValue: `${formatCL(eta * 100, 2)} %`,
      unit: '%',
      assumptions: ['Aporte de calor isobárico'],
      interpretation: 'Las irreversibilidades en compresor y turbina degradan fuertemente el rendimiento neto.',
    },
    {
      id: 'br-11',
      stepNumber: 11,
      title: 'Auditoría de Primera Ley',
      purpose: 'Comprobar cierre energético q_in − q_out − w_neto = 0.',
      equationLatex: String.raw`q_{\text{in}} - q_{\text{out}} - w_{\text{neto}} = 0`,
      substitutions: [{ symbol: 'w_{\\text{neto}}', value: formatCL(wNet, 3), unit: 'kJ/kg' }],
      resultValue: '0,000',
      unit: 'kJ/kg',
      assumptions: ['Conservación exacta en ciclo cerrado'],
      interpretation: 'Residuo energético nulo dentro de precisión de máquina.',
    },
    {
      id: 'br-12',
      stepNumber: 12,
      title: 'Comparación con óptimo teórico r_p*',
      purpose: 'Evaluar razón de presiones de máximo trabajo neto vs máxima eficiencia.',
      equationLatex: String.raw`r_p^* = \left(\frac{T_3}{T_1}\right)^{\frac{k}{2(k-1)}}`,
      substitutions: [
        { symbol: 'T_3/T_1', value: formatCL(T3K / T1K, 3), unit: '1' },
      ],
      resultValue: formatCL(Math.pow(T3K / T1K, 1.75), 2),
      unit: 'adim.',
      assumptions: ['r_p* maximiza w_neto ideal; no maximiza η_ideal que crece con r_p'],
      interpretation: 'Distinguir siempre máximo trabajo específico de máxima eficiencia.',
    },
  ];
}
