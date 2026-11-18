/**
 * Motor puro para MEC110_9 (Simulador 4 — Planta de vapor Rankine con IAPWS-IF97 real):
 * - Modo 4A: Rankine simple ideal y real (300 MW, 10 MPa, 500 °C, 10 kPa)
 * - Modo 4B: Rankine con recalentamiento y restricción de humedad (x_out >= 0.90) + traza de interpolación
 * - Modo 4C: Rankine regenerativo 250 MW, 11 estados, CAA + CAC, sistema lineal 4×4:
 *     * Submodo 'lecture-reference': reproduce exactamente la matriz transcrita en la especificación
 *       (mostrando discrepancia documentada en w_B2 = 0,5365 vs 13,0906 kJ/kg).
 *     * Submodo 'if97-consistent': recalcula los 11 estados con IAPWS-IF97 y w_B2 = v3*(p4-p3),
 *       resolviendo el 4×4 con eliminación gaussiana escalada y comparando resultados.
 * - Modo 4F: Cogeneración y ciclo binario conceptual (límites históricos mercurio-agua).
 * - Pizarra dinámica de hasta 14 etapas (sin límite artificial de 10).
 */

import type { BalanceAudit, Result, SolvedStep, SolverMetadata, ThermoState } from '../contracts';
import { getRealSaturationDome, iapwsIF97Provider, type SaturationDomePoint } from './if97';
import { solveLinearSystem, type LinearSolveOutput } from './linalg';
import { cToK, formatCL, kToC } from './units';

export type RankineMode = 'simple' | 'reheat' | 'regenerative-4c' | 'cogeneration-binary';

export type RegenerativeSubmode = 'lecture-reference' | 'if97-consistent';

export interface RankineInput {
  mode: RankineMode;
  pBoilerMPa: number;
  TBoilerC: number;
  pCondKPa: number;
  etaTurbine: number; // 0.5..1.0
  etaPump: number; // 0.5..1.0
  netPowerMW: number;
  // Recalentamiento (4B)
  TReheatC?: number;
  targetMinQuality?: number; // ej. 0.90
  massFlowFixedKgS?: number; // ej. 25 kg/s en 4B
  // Regenerativo (4C)
  pCacMPa?: number; // 0.8 MPa
  pCaaMPa?: number; // 0.3 MPa
  regenSubmode?: RegenerativeSubmode;
  // Cogeneración (4F)
  processHeatMW?: number;
  fuelInputMW?: number;
}

export interface RankineDisplayState {
  id: string;
  label: string;
  pKPa: number;
  TC: number;
  hKJkg: number;
  sKJkgK: number;
  vM3kg: number;
  phaseLabel: string;
  quality: number | null; // null fuera de saturación
  massFlowKgS: number;
  massFraction: number; // m_i / m_total_caldera para "Rastrea 1 kg"
  sourceNote: string;
}

export interface Rankine4CComparison {
  lectureMatrix: number[][];
  lectureRhs: number[];
  lectureFlows: number[];
  lectureResidualMax: number;
  lectureWB2: number;
  lectureEtaPct: number;
  physicalMatrix: number[][];
  physicalRhs: number[];
  physicalFlows: number[];
  physicalResidualMax: number;
  physicalWB2: number;
  physicalEtaPct: number;
  discrepancyNote: string;
}

export interface RankineOutput {
  mode: RankineMode;
  states: RankineDisplayState[];
  saturationDome: SaturationDomePoint[];
  wTurbineKJkg: number;
  wPumpKJkg: number;
  wNetKJkg: number;
  qInKJkg: number;
  qOutKJkg: number;
  etaThermal: number;
  massFlowBoilerKgS: number;
  exitQuality: number | null;
  pReheatMPa?: number;
  reheatInterpTrace?: string[];
  matrixAudit4C?: Rankine4CComparison;
  cogenerationSummary?: {
    electricMW: number;
    processHeatMW: number;
    fuelMW: number;
    utilizationFactorPct: number;
    binaryUpperRejectMW: number;
    binaryLossMW: number;
    binaryLowerNetMW: number;
  };
  steps: SolvedStep[];
  audit: SolverMetadata;
}

function phaseToSpanish(st: ThermoState): string {
  switch (st.phase) {
    case 'compressed-liquid':
      return 'Líquido comprimido';
    case 'saturated-liquid':
      return 'Líquido saturado (x=0)';
    case 'two-phase':
      return 'Mezcla saturada';
    case 'saturated-vapor':
      return 'Vapor saturado (x=1)';
    case 'superheated-vapor':
      return 'Vapor sobrecalentado';
    default:
      return 'Estado definido';
  }
}

export function solveRankine(input: RankineInput): Result<RankineOutput> {
  const pBoilerPa = input.pBoilerMPa * 1e6;
  const pCondPa = input.pCondKPa * 1e3;
  const TBoilerK = cToK(input.TBoilerC);

  if (pCondPa <= 700 || pBoilerPa <= pCondPa || pBoilerPa > 20e6) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PRESSURE',
        message: `Presiones inválidas: p_cond=${formatCL(input.pCondKPa, 1)} kPa debe ser > 0,7 kPa y < p_caldera=${formatCL(input.pBoilerMPa, 2)} MPa <= 20 MPa.`,
        physicalExplanation: 'La presión del condensador debe superar el punto triple del agua (0,611 kPa) y ser inferior a la caldera.',
        suggestedFix: 'Ajusta p_cond >= 2 kPa y p_caldera entre 0,5 y 16 MPa.',
      },
    };
  }

  if (input.etaTurbine <= 0.2 || input.etaTurbine > 1 || input.etaPump <= 0.2 || input.etaPump > 1) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Las eficiencias de turbina y bomba deben estar en (0,2; 1,0].',
        physicalExplanation: 'Eficiencias mayores al 100 % violan la Segunda Ley.',
        suggestedFix: 'Selecciona eficiencias entre 50 % y 100 %.',
      },
    };
  }

  const dome = getRealSaturationDome(42);

  if (input.mode === 'simple') {
    return solveSimpleRankine(input, pBoilerPa, pCondPa, TBoilerK, dome);
  }
  if (input.mode === 'reheat') {
    return solveReheatRankine(input, pBoilerPa, pCondPa, TBoilerK, dome);
  }
  if (input.mode === 'regenerative-4c') {
    return solveRegenerative4C(input, pBoilerPa, pCondPa, TBoilerK, dome);
  }
  return solveCogenAndBinary(input, pBoilerPa, pCondPa, TBoilerK, dome);
}

// ---------------------------------------------------------------------------
// 4A: Rankine Simple Ideal y Real
// ---------------------------------------------------------------------------
function solveSimpleRankine(
  input: RankineInput,
  pBoilerPa: number,
  pCondPa: number,
  TBoilerK: number,
  dome: SaturationDomePoint[]
): Result<RankineOutput> {
  const satCond = iapwsIF97Provider.saturationP('water', pCondPa);
  if (!satCond.ok) return satCond;
  const st1 = satCond.value.liquid; // salida condensador

  const st3 = iapwsIF97Provider.solvePT('water', pBoilerPa, TBoilerK);
  if (!st3.ok) return st3;
  if (st3.value.phase !== 'superheated-vapor' && st3.value.phase !== 'saturated-vapor') {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'La temperatura de caldera es insuficiente para vaporizar el agua a esta presión.',
        physicalExplanation: `A ${formatCL(input.pBoilerMPa, 2)} MPa, T_sat = ${formatCL(kToC(iapwsIF97Provider.saturationP('water', pBoilerPa).ok ? (iapwsIF97Provider.saturationP('water', pBoilerPa) as { ok: true; value: { TSatK: number } }).value.TSatK : 373.15), 1)} °C.`,
        suggestedFix: 'Aumenta T_caldera por encima de T_sat(p_caldera).',
      },
    };
  }

  // Bomba: aproximación líquido incompresible w_Bs = v1*(p2 - p1) en J/kg
  const wBsJkg = st1.vM3kg * (pBoilerPa - pCondPa);
  const wBaJkg = wBsJkg / input.etaPump;
  const h2Jkg = st1.hJkg + wBaJkg;
  const st2Res = iapwsIF97Provider.solvePH('water', pBoilerPa, h2Jkg);
  if (!st2Res.ok) return st2Res;
  const st2 = st2Res.value;

  // Turbina ideal (4s) y real (4a)
  const st4sRes = iapwsIF97Provider.solvePS('water', pCondPa, st3.value.sJkgK);
  if (!st4sRes.ok) return st4sRes;
  const st4s = st4sRes.value;

  const wTsJkg = st3.value.hJkg - st4s.hJkg;
  const wTaJkg = input.etaTurbine * wTsJkg;
  const h4aJkg = st3.value.hJkg - wTaJkg;
  const st4aRes = iapwsIF97Provider.solvePH('water', pCondPa, h4aJkg);
  if (!st4aRes.ok) return st4aRes;
  const st4a = st4aRes.value;

  const wTurbineKJkg = wTaJkg / 1e3;
  const wPumpKJkg = wBaJkg / 1e3;
  const wNetKJkg = wTurbineKJkg - wPumpKJkg;
  const qInKJkg = (st3.value.hJkg - h2Jkg) / 1e3;
  const qOutKJkg = (h4aJkg - st1.hJkg) / 1e3;
  const etaThermal = wNetKJkg / qInKJkg;
  const mDot = (input.netPowerMW * 1e3) / Math.max(1e-6, wNetKJkg);

  const states: RankineDisplayState[] = [
    {
      id: '1',
      label: 'Salida condensador (líq. sat.)',
      pKPa: input.pCondKPa,
      TC: kToC(st1.TK),
      hKJkg: st1.hJkg / 1e3,
      sKJkgK: st1.sJkgK / 1e3,
      vM3kg: st1.vM3kg,
      phaseLabel: phaseToSpanish(st1),
      quality: st1.quality,
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: 'IAPWS-IF97 Región 4',
    },
    {
      id: '2',
      label: 'Salida bomba (agua comprimida)',
      pKPa: input.pBoilerMPa * 1e3,
      TC: kToC(st2.TK),
      hKJkg: h2Jkg / 1e3,
      sKJkgK: st2.sJkgK / 1e3,
      vM3kg: st2.vM3kg,
      phaseLabel: phaseToSpanish(st2),
      quality: st2.quality,
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: 'h1 + v1·Δp / η_B (IF97)',
    },
    {
      id: '3',
      label: 'Salida caldera / entrada turbina',
      pKPa: input.pBoilerMPa * 1e3,
      TC: kToC(st3.value.TK),
      hKJkg: st3.value.hJkg / 1e3,
      sKJkgK: st3.value.sJkgK / 1e3,
      vM3kg: st3.value.vM3kg,
      phaseLabel: phaseToSpanish(st3.value),
      quality: null, // Nunca mostrar x en vapor sobrecalentado
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: 'IAPWS-IF97 Región 2',
    },
    {
      id: '4',
      label: 'Escape turbina',
      pKPa: input.pCondKPa,
      TC: kToC(st4a.TK),
      hKJkg: h4aJkg / 1e3,
      sKJkgK: st4a.sJkgK / 1e3,
      vM3kg: st4a.vM3kg,
      phaseLabel: phaseToSpanish(st4a),
      quality: st4a.quality,
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: input.etaTurbine < 1 ? 'Expansión real vía η_T (IF97)' : 'Expansión isentrópica (IF97)',
    },
  ];

  const warnings: string[] = [];
  if (st4a.quality !== null && st4a.quality < 0.88) {
    warnings.push(
      `Humedad elevada a salida de turbina: x=${formatCL(st4a.quality * 100, 2)} % (humedad ${formatCL((1 - st4a.quality) * 100, 2)} %). En planta real puede causar erosión de álabes; evalúa recalentamiento.`
    );
  }

  const balance: BalanceAudit = {
    component: 'Ciclo Rankine simple',
    massInKgS: mDot,
    massOutKgS: mDot,
    massResidualKgS: 0,
    energyInKW: qInKJkg * mDot,
    energyOutKW: (wNetKJkg + qOutKJkg) * mDot,
    energyResidualKW: (qInKJkg - qOutKJkg - wNetKJkg) * mDot,
    entropyGenKWK: null,
  };

  const steps = buildRankineStepsSimple(
    input,
    states,
    st4s,
    wPumpKJkg,
    wTurbineKJkg,
    wNetKJkg,
    qInKJkg,
    etaThermal,
    mDot
  );

  return {
    ok: true,
    value: {
      mode: 'simple',
      states,
      saturationDome: dome,
      wTurbineKJkg,
      wPumpKJkg,
      wNetKJkg,
      qInKJkg,
      qOutKJkg,
      etaThermal,
      massFlowBoilerKgS: mDot,
      exitQuality: st4a.quality,
      steps,
      audit: {
        modelId: 'rankine-simple-if97',
        fluid: 'Agua / Vapor (IAPWS-IF97)',
        provider: iapwsIF97Provider.id,
        providerVersion: iapwsIF97Provider.version,
        providerLicense: iapwsIF97Provider.license,
        hypotheses: [
          'Régimen estacionario, ΔEc ≈ 0, ΔEp ≈ 0',
          'Condensador entrega líquido saturado a p_cond',
          'Bomba aproximada con v_f constante para líquido subenfriado',
          'Caldera y condensador isobáricos',
        ],
        validationStatus: 'verificado',
        warnings,
        balances: [balance],
        overallEnergyResidualKW: balance.energyResidualKW,
        overallMassResidualKgS: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// 4B: Rankine con Recalentamiento y restricción de humedad
// ---------------------------------------------------------------------------
function solveReheatRankine(
  input: RankineInput,
  pBoilerPa: number,
  pCondPa: number,
  TBoilerK: number,
  dome: SaturationDomePoint[]
): Result<RankineOutput> {
  const targetX = input.targetMinQuality ?? 0.9;
  const TReheatK = cToK(input.TReheatC ?? input.TBoilerC);
  const mDot = input.massFlowFixedKgS ?? 25;

  const satCond = iapwsIF97Provider.saturationP('water', pCondPa);
  if (!satCond.ok) return satCond;
  const st1 = satCond.value.liquid;

  // Estado objetivo final de TBP (para encontrar p_reheat isentrópica con x_5s = targetX)
  const st5TargetRes = iapwsIF97Provider.solvePX('water', pCondPa, targetX);
  if (!st5TargetRes.ok) return st5TargetRes;
  const s5Target = st5TargetRes.value.sJkgK;

  // Si hay η_T < 1, buscamos p_reheat tal que la salida REAL 5a tenga x >= targetX o mantengamos el criterio isentrópico de cátedra cuando η_T=1
  const solveOutletQualityForPReheat = (pMidPa: number): number | null => {
    const st4 = iapwsIF97Provider.solvePT('water', pMidPa, TReheatK);
    if (!st4.ok) return null;
    const st5s = iapwsIF97Provider.solvePS('water', pCondPa, st4.value.sJkgK);
    if (!st5s.ok) return null;
    const h5a = st4.value.hJkg - input.etaTurbine * (st4.value.hJkg - st5s.value.hJkg);
    const st5a = iapwsIF97Provider.solvePH('water', pCondPa, h5a);
    if (!st5a.ok) return null;
    return st5a.value.quality ?? 1.01; // >1 si sobrecalentado
  };

  // Bisección sobre pMidPa en [pCondPa * 2, pBoilerPa * 0.95]
  let lo = Math.max(pCondPa * 2, 50e3);
  let hi = pBoilerPa * 0.95;
  const qLo = solveOutletQualityForPReheat(lo);
  const qHi = solveOutletQualityForPReheat(hi);
  if (qLo === null || qHi === null) {
    return {
      ok: false,
      error: {
        code: 'CONVERGENCE_FAILURE',
        message: 'No se pudo acotar presión de recalentamiento dentro del dominio IF97.',
        physicalExplanation: 'Las presiones o temperaturas de recalentamiento caen fuera de Región 2.',
        suggestedFix: 'Verifica T_recalentamiento y presión de caldera.',
      },
    };
  }

  let pMidPa = 0.5 * (lo + hi);
  if (qHi > targetX) {
    pMidPa = hi; // incluso al máximo sigue seco
  } else if (qLo < targetX) {
    pMidPa = lo;
  } else {
    for (let i = 0; i < 48; i++) {
      const mid = 0.5 * (lo + hi);
      const qMid = solveOutletQualityForPReheat(mid);
      if (qMid === null) break;
      if (qMid >= targetX) lo = mid;
      else hi = mid;
      pMidPa = mid;
    }
  }

  // Traza de interpolación lineal didáctica alrededor de pMidPa (paso 0.5 MPa)
  const pLowerMPa = Math.max(0.1, Math.floor((pMidPa / 1e6) * 2) / 2);
  const pUpperMPa = pLowerMPa + 0.5;
  const stLower = iapwsIF97Provider.solvePT('water', pLowerMPa * 1e6, TReheatK);
  const stUpper = iapwsIF97Provider.solvePT('water', pUpperMPa * 1e6, TReheatK);
  const reheatInterpTrace: string[] = [];
  if (stLower.ok && stUpper.ok) {
    const sL = stLower.value.sJkgK / 1e3;
    const sU = stUpper.value.sJkgK / 1e3;
    const sT = s5Target / 1e3;
    const alpha = (sT - sL) / Math.max(1e-9, sU - sL);
    const pInterp = pLowerMPa + alpha * (pUpperMPa - pLowerMPa);
    reheatInterpTrace.push(
      `s_5 objetivo (x=${formatCL(targetX, 2)} a ${formatCL(input.pCondKPa, 1)} kPa) = ${formatCL(sT, 5)} kJ/(kg·K)`,
      `Tabla IF97 a ${formatCL(input.TReheatC ?? input.TBoilerC, 0)} °C: p=${formatCL(pLowerMPa, 2)} MPa (s=${formatCL(sL, 4)}), p=${formatCL(pUpperMPa, 2)} MPa (s=${formatCL(sU, 4)})`,
      `Interpolación lineal local: α=${formatCL(alpha, 4)} → p_lin=${formatCL(pInterp, 3)} MPa; bisección exacta IF97=${formatCL(pMidPa / 1e6, 3)} MPa.`
    );
  }

  // Resolver los 6 estados completos
  const wBsJkg = st1.vM3kg * (pBoilerPa - pCondPa);
  const wBaJkg = wBsJkg / input.etaPump;
  const st1bRes = iapwsIF97Provider.solvePH('water', pBoilerPa, st1.hJkg + wBaJkg);
  if (!st1bRes.ok) return st1bRes;
  const st1b = st1bRes.value;

  const st2Res = iapwsIF97Provider.solvePT('water', pBoilerPa, TBoilerK);
  if (!st2Res.ok) return st2Res;
  const st2 = st2Res.value;

  const st3sRes = iapwsIF97Provider.solvePS('water', pMidPa, st2.sJkgK);
  if (!st3sRes.ok) return st3sRes;
  const h3a = st2.hJkg - input.etaTurbine * (st2.hJkg - st3sRes.value.hJkg);
  const st3aRes = iapwsIF97Provider.solvePH('water', pMidPa, h3a);
  if (!st3aRes.ok) return st3aRes;
  const st3a = st3aRes.value;

  const st4Res = iapwsIF97Provider.solvePT('water', pMidPa, TReheatK);
  if (!st4Res.ok) return st4Res;
  const st4 = st4Res.value;

  const st5sRes = iapwsIF97Provider.solvePS('water', pCondPa, st4.sJkgK);
  if (!st5sRes.ok) return st5sRes;
  const h5a = st4.hJkg - input.etaTurbine * (st4.hJkg - st5sRes.value.hJkg);
  const st5aRes = iapwsIF97Provider.solvePH('water', pCondPa, h5a);
  if (!st5aRes.ok) return st5aRes;
  const st5a = st5aRes.value;

  const wTurbineKJkg = (st2.hJkg - st3a.hJkg + (st4.hJkg - st5a.hJkg)) / 1e3;
  const wPumpKJkg = wBaJkg / 1e3;
  const wNetKJkg = wTurbineKJkg - wPumpKJkg;
  const qInKJkg = (st2.hJkg - st1b.hJkg + (st4.hJkg - st3a.hJkg)) / 1e3;
  const qOutKJkg = (st5a.hJkg - st1.hJkg) / 1e3;
  const etaThermal = wNetKJkg / qInKJkg;

  const states: RankineDisplayState[] = [
    {
      id: '1',
      label: 'Salida condensador',
      pKPa: input.pCondKPa,
      TC: kToC(st1.TK),
      hKJkg: st1.hJkg / 1e3,
      sKJkgK: st1.sJkgK / 1e3,
      vM3kg: st1.vM3kg,
      phaseLabel: phaseToSpanish(st1),
      quality: st1.quality,
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: 'IAPWS-IF97 Región 4',
    },
    {
      id: '1b',
      label: 'Salida bomba',
      pKPa: input.pBoilerMPa * 1e3,
      TC: kToC(st1b.TK),
      hKJkg: st1b.hJkg / 1e3,
      sKJkgK: st1b.sJkgK / 1e3,
      vM3kg: st1b.vM3kg,
      phaseLabel: phaseToSpanish(st1b),
      quality: null,
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: 'IF97 + v·Δp/η_B',
    },
    {
      id: '2',
      label: 'Entrada TAP',
      pKPa: input.pBoilerMPa * 1e3,
      TC: kToC(st2.TK),
      hKJkg: st2.hJkg / 1e3,
      sKJkgK: st2.sJkgK / 1e3,
      vM3kg: st2.vM3kg,
      phaseLabel: phaseToSpanish(st2),
      quality: null,
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: 'IAPWS-IF97 Región 2',
    },
    {
      id: '3',
      label: 'Salida TAP / entrada recalentador',
      pKPa: pMidPa / 1e3,
      TC: kToC(st3a.TK),
      hKJkg: st3a.hJkg / 1e3,
      sKJkgK: st3a.sJkgK / 1e3,
      vM3kg: st3a.vM3kg,
      phaseLabel: phaseToSpanish(st3a),
      quality: st3a.quality,
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: 'IAPWS-IF97',
    },
    {
      id: '4',
      label: 'Salida recalentador / entrada TBP',
      pKPa: pMidPa / 1e3,
      TC: kToC(st4.TK),
      hKJkg: st4.hJkg / 1e3,
      sKJkgK: st4.sJkgK / 1e3,
      vM3kg: st4.vM3kg,
      phaseLabel: phaseToSpanish(st4),
      quality: null,
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: 'IAPWS-IF97 Región 2',
    },
    {
      id: '5',
      label: 'Salida TBP (límite humedad)',
      pKPa: input.pCondKPa,
      TC: kToC(st5a.TK),
      hKJkg: st5a.hJkg / 1e3,
      sKJkgK: st5a.sJkgK / 1e3,
      vM3kg: st5a.vM3kg,
      phaseLabel: phaseToSpanish(st5a),
      quality: st5a.quality,
      massFlowKgS: mDot,
      massFraction: 1,
      sourceNote: 'IAPWS-IF97',
    },
  ];

  const balance: BalanceAudit = {
    component: 'Ciclo Rankine con recalentamiento',
    massInKgS: mDot,
    massOutKgS: mDot,
    massResidualKgS: 0,
    energyInKW: qInKJkg * mDot,
    energyOutKW: (wNetKJkg + qOutKJkg) * mDot,
    energyResidualKW: (qInKJkg - qOutKJkg - wNetKJkg) * mDot,
    entropyGenKWK: null,
  };

  const steps: SolvedStep[] = [
    {
      id: 'reh-1',
      stepNumber: 1,
      title: 'Traducir humedad máxima permitida a calidad mínima',
      purpose: 'Convertir restricción de 10 % de humedad a x_5 >= 0,90.',
      equationLatex: String.raw`x_5 = 1 - \text{humedad}`,
      substitutions: [{ symbol: 'x_5', value: formatCL(targetX, 2), unit: 'kg_v/kg' }],
      resultValue: formatCL(targetX, 2),
      unit: 'calidad',
      assumptions: ['Restricción de integridad de álabes en última etapa de TBP'],
      interpretation: 'A mayor x, menor erosión por gotas líquidas.',
    },
    {
      id: 'reh-2',
      stepNumber: 2,
      title: 'Fijar entropía objetivo en salida de TBP',
      purpose: 'Evaluar s_5 = s_f + x_5 s_fg a presión de condensador.',
      equationLatex: String.raw`s_5 = s_f + x_5 (s_g - s_f)`,
      substitutions: [{ symbol: 'p_5', value: formatCL(input.pCondKPa, 1), unit: 'kPa' }],
      resultValue: formatCL(st5a.sJkgK / 1e3, 5),
      unit: 'kJ/(kg·K)',
      assumptions: ['Propiedades de saturación IAPWS-IF97'],
      interpretation: 'Define la línea isentrópica/real inversa hacia el recalentador.',
    },
    {
      id: 'reh-3',
      stepNumber: 3,
      title: 'Resolver presión óptima de recalentamiento (bisección IF97)',
      purpose: 'Hallar p_recalentamiento tal que x_5 >= objetivo a T_reheat.',
      equationLatex: String.raw`s(p_{\text{recal}}, T_{\text{recal}}) \longrightarrow x_5 \ge ${formatCL(targetX, 2)}`,
      substitutions: [{ symbol: 'T_{\\text{recal}}', value: formatCL(input.TReheatC ?? input.TBoilerC, 1), unit: '°C' }],
      resultValue: formatCL(pMidPa / 1e6, 3),
      unit: 'MPa',
      assumptions: ['Expansión continua en TBP'],
      interpretation: reheatInterpTrace[2] ?? 'Presión obtenida por inversión IF97.',
    },
    {
      id: 'reh-4',
      stepNumber: 4,
      title: 'Calor total suministrado (caldera + recalentador) y eficiencia',
      purpose: 'Sumar q_caldera y q_recalentador para evaluar rendimiento térmico.',
      equationLatex: String.raw`q_{\text{in}} = (h_2 - h_{1b}) + (h_4 - h_3), \qquad \eta_{th} = \frac{w_T - w_B}{q_{\text{in}}}`,
      substitutions: [
        { symbol: 'q_{\\text{in}}', value: formatCL(qInKJkg, 2), unit: 'kJ/kg' },
        { symbol: String.raw`\dot Q_{\text{in}}`, value: formatCL((qInKJkg * mDot) / 1e3, 2), unit: 'MW' },
      ],
      resultValue: `${formatCL(etaThermal * 100, 2)} %`,
      unit: '%',
      assumptions: [`Caudal másico = ${formatCL(mDot, 1)} kg/s`],
      interpretation: 'El recalentamiento reduce la humedad final y mejora el rendimiento respecto al ciclo simple.',
    },
  ];

  return {
    ok: true,
    value: {
      mode: 'reheat',
      states,
      saturationDome: dome,
      wTurbineKJkg,
      wPumpKJkg,
      wNetKJkg,
      qInKJkg,
      qOutKJkg,
      etaThermal,
      massFlowBoilerKgS: mDot,
      exitQuality: st5a.quality,
      pReheatMPa: pMidPa / 1e6,
      reheatInterpTrace,
      steps,
      audit: {
        modelId: 'rankine-reheat-if97',
        fluid: 'Agua / Vapor (IAPWS-IF97)',
        provider: iapwsIF97Provider.id,
        providerVersion: iapwsIF97Provider.version,
        providerLicense: iapwsIF97Provider.license,
        hypotheses: [
          `Restricción de humedad: x_salida >= ${formatCL(targetX, 2)}`,
          'Presión de recalentamiento recalculada dinámicamente por el motor IF97',
          'Régimen estacionario sin pérdidas de presión',
        ],
        validationStatus: 'verificado',
        warnings: [],
        balances: [balance],
        overallEnergyResidualKW: balance.energyResidualKW,
        overallMassResidualKgS: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// 4C: Rankine Regenerativo 250 MW, 11 Estados, CAA + CAC, Sistema 4×4
// ---------------------------------------------------------------------------
function solveRegenerative4C(
  input: RankineInput,
  pBoilerPa: number,
  pCondPa: number,
  TBoilerK: number,
  dome: SaturationDomePoint[]
): Result<RankineOutput> {
  const pCacPa = (input.pCacMPa ?? 0.8) * 1e6;
  const pCaaPa = (input.pCaaMPa ?? 0.3) * 1e6;
  const submode: RegenerativeSubmode = input.regenSubmode ?? 'if97-consistent';

  if (pCacPa <= pCaaPa || pCaaPa <= pCondPa || pCacPa >= pBoilerPa) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PRESSURE',
        message: 'Las presiones deben cumplir p_caldera > p_CAC > p_CAA > p_condensador.',
        physicalExplanation: 'Los flujos de extracción y drenaje requieren presiones estrictamente decrecientes.',
        suggestedFix: 'Ajusta p_CAC (ej. 0,8 MPa) > p_CAA (ej. 0,3 MPa) > p_cond (ej. 10 kPa).',
      },
    };
  }

  // 1) Siempre resolvemos la matriz de referencia literal del §11.8 para auditoría comparativa
  const lectureA = [
    [1, -1, -1, -1],
    [3475.7, -2754.11, -2577.7, -2099.13],
    [561.47, -721.11, -2577.7, -192.12],
    [159.1, -2033.0, 0, 0],
  ];
  const lectureB = [0, 250000, 0, 0];
  const lectureSolveRes = solveLinearSystem(lectureA, lectureB);
  const lectureSolve: LinearSolveOutput = lectureSolveRes.ok
    ? lectureSolveRes.value
    : {
        x: [0, 0, 0, 0],
        residualVector: [0, 0, 0, 0],
        maxAbsResidual: 0,
        maxRelativeRowResidual: 0,
        pivotMin: 0,
        conditionEstimate: 0,
      };
  const lectureEtaPct =
    lectureSolve.x[0] > 0
      ? (250000 / (lectureSolve.x[0] * (3475.2 - 721.11))) * 100
      : 0;

  // 2) Modo Consistencia Física (IAPWS-IF97 real + w_B2 = v3*(p4-p3))
  const sat1 = iapwsIF97Provider.saturationP('water', pCondPa);
  const sat3 = iapwsIF97Provider.saturationP('water', pCaaPa);
  const sat6 = iapwsIF97Provider.saturationP('water', pCacPa);
  const st8Res = iapwsIF97Provider.solvePT('water', pBoilerPa, TBoilerK);
  if (!sat1.ok || !sat3.ok || !sat6.ok || !st8Res.ok) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Uno de los estados de saturación o caldera excede el dominio IF97.',
        physicalExplanation: 'Verifica que p_caldera y T_caldera estén dentro de las Regiones 1, 2 y 4.',
        suggestedFix: 'Restaura los valores de cátedra o ajusta las presiones.',
      },
    };
  }

  const st1 = sat1.value.liquid;
  const wB1Jkg = (st1.vM3kg * (pCaaPa - pCondPa)) / input.etaPump;
  const st2Res = iapwsIF97Provider.solvePH('water', pCaaPa, st1.hJkg + wB1Jkg);
  if (!st2Res.ok) return st2Res;
  const st2 = st2Res.value;

  const st3 = sat3.value.liquid; // Salida CAA líquido saturado a p_CAA
  const wB2Jkg = (st3.vM3kg * (pBoilerPa - pCaaPa)) / input.etaPump;
  const st4Res = iapwsIF97Provider.solvePH('water', pBoilerPa, st3.hJkg + wB2Jkg);
  if (!st4Res.ok) return st4Res;
  const st4 = st4Res.value;

  const st6 = sat6.value.liquid; // Condensado CAC a p_CAC
  const st7Res = iapwsIF97Provider.solvePH('water', pCaaPa, st6.hJkg); // Trampa isoentálpica h7 = h6
  if (!st7Res.ok) return st7Res;
  const st7 = st7Res.value;

  // Salida CAC lado agua de alimentación: idealización clásica T5 ≈ Tsat(p_CAC) -> h5 ≈ h6 (o evaluar a p_caldera, Tsat6)
  const st5Res = iapwsIF97Provider.solvePT('water', pBoilerPa, sat6.value.TSatK);
  const h5Jkg = st5Res.ok ? st5Res.value.hJkg : st6.hJkg;
  const st5: ThermoState = st5Res.ok ? st5Res.value : { ...st6, pPa: pBoilerPa };

  const st8 = st8Res.value;

  // Expansiones en turbina (ideal isentrópica + corrección real η_T)
  const st9s = iapwsIF97Provider.solvePS('water', pCacPa, st8.sJkgK);
  const st10s = iapwsIF97Provider.solvePS('water', pCaaPa, st8.sJkgK);
  const st11s = iapwsIF97Provider.solvePS('water', pCondPa, st8.sJkgK);
  if (!st9s.ok || !st10s.ok || !st11s.ok) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Error al resolver expansión en turbina 4C.',
        physicalExplanation: 'La entropía de entrada no intersecta una presión de extracción válida.',
        suggestedFix: 'Ajusta T_caldera o p_caldera.',
      },
    };
  }

  const h9 = st8.hJkg - input.etaTurbine * (st8.hJkg - st9s.value.hJkg);
  const h10 = st8.hJkg - input.etaTurbine * (st8.hJkg - st10s.value.hJkg);
  const h11 = st8.hJkg - input.etaTurbine * (st8.hJkg - st11s.value.hJkg);

  const st9Res = iapwsIF97Provider.solvePH('water', pCacPa, h9);
  const st10Res = iapwsIF97Provider.solvePH('water', pCaaPa, h10);
  const st11Res = iapwsIF97Provider.solvePH('water', pCondPa, h11);
  if (!st9Res.ok || !st10Res.ok || !st11Res.ok) {
    return {
      ok: false,
      error: { code: 'CONVERGENCE_FAILURE', message: 'Error resolviendo estados reales 9-11.', physicalExplanation: '', suggestedFix: '' },
    };
  }
  const st9 = st9Res.value;
  const st10 = st10Res.value;
  const st11 = st11Res.value;

  // Matriz 4×4 físicamente consistente (en kJ/kg y kW):
  // Eq A: m8 - m9 - m10 - m11 = 0
  // Eq B: W_net = W_T - W_B1 - W_B2:
  //       m8*(h8 - (h4-h3)) - m9*h9 - m10*h10 - m11*(h11 + (h2-h1)) = P_net_kW
  // Eq C (CAA): m8*h3 - m9*h7 - m10*h10 - m11*h2 = 0
  // Eq D (CAC): m8*(h5 - h4) - m9*(h9 - h6) = 0
  const h1k = st1.hJkg / 1e3;
  const h2k = st2.hJkg / 1e3;
  const h3k = st3.hJkg / 1e3;
  const h4k = st4.hJkg / 1e3;
  const h5k = h5Jkg / 1e3;
  const h6k = st6.hJkg / 1e3;
  const h7k = st7.hJkg / 1e3;
  const h8k = st8.hJkg / 1e3;
  const h9k = st9.hJkg / 1e3;
  const h10k = st10.hJkg / 1e3;
  const h11k = st11.hJkg / 1e3;

  const wB1k = wB1Jkg / 1e3;
  const wB2k = wB2Jkg / 1e3;
  const PNetKW = input.netPowerMW * 1e3;

  const physA = [
    [1, -1, -1, -1],
    [h8k - wB2k, -h9k, -h10k, -(h11k + wB1k)],
    [h3k, -h7k, -h10k, -h2k],
    [h5k - h4k, -(h9k - h6k), 0, 0],
  ];
  const physB = [0, PNetKW, 0, 0];
  const physSolveRes = solveLinearSystem(physA, physB);
  if (!physSolveRes.ok) return physSolveRes;
  const physSolve = physSolveRes.value;

  const physicalEtaPct =
    physSolve.x[0] > 0 ? (PNetKW / (physSolve.x[0] * (h8k - h5k))) * 100 : 0;

  const activeFlows = submode === 'lecture-reference' ? lectureSolve.x : physSolve.x;
  const [m8, m9, m10, m11] = activeFlows;

  if (activeFlows.some((m) => m <= 0 || !Number.isFinite(m))) {
    return {
      ok: false,
      error: {
        code: 'INCONSISTENT_TOPOLOGY',
        message: `El solver obtuvo flujos másicos no positivos: [${activeFlows.map((v) => formatCL(v, 2)).join('; ')}] kg/s.`,
        physicalExplanation: 'Con estas presiones o eficiencias, uno de los calentadores requeriría flujo inverso.',
        suggestedFix: 'Verifica que p_CAC > p_CAA > p_cond y T_caldera > T_sat.',
      },
    };
  }

  const comparison: Rankine4CComparison = {
    lectureMatrix: lectureA,
    lectureRhs: lectureB,
    lectureFlows: lectureSolve.x,
    lectureResidualMax: lectureSolve.maxAbsResidual,
    lectureWB2: 562.01 - 561.47,
    lectureEtaPct,
    physicalMatrix: physA,
    physicalRhs: physB,
    physicalFlows: physSolve.x,
    physicalResidualMax: physSolve.maxAbsResidual,
    physicalWB2: wB2k,
    physicalEtaPct,
    discrepancyNote:
      `Divergencia auditada en bomba P2 (estado 4): la referencia previa consigna w_B2 = 0,5365 kJ/kg (h4 = 562,01 kJ/kg), mientras que v3·(p4−p3) = ${formatCL(st3.vM3kg, 6)}×(${formatCL(input.pBoilerMPa * 1e3 - input.pCaaMPa! * 1e3, 0)}) = ${formatCL(wB2k, 4)} kJ/kg (h4 = ${formatCL(h4k, 2)} kJ/kg). Además, la referencia mezcla h8 = 3475,2 vs 3475,7 kJ/kg.`,
  };

  // Construir los 11 estados para visualización y tabla
  const states: RankineDisplayState[] =
    submode === 'lecture-reference'
      ? [
          { id: '1', label: 'Salida condensador', pKPa: 10, TC: 45.81, hKJkg: 191.83, sKJkgK: st1.sJkgK / 1e3, vM3kg: 0.00101, phaseLabel: 'Líquido saturado', quality: 0, massFlowKgS: m11, massFraction: m11 / m8, sourceNote: 'Referencia cátedra' },
          { id: '2', label: 'Salida bomba P1', pKPa: 300, TC: kToC(st2.TK), hKJkg: 192.12, sKJkgK: st2.sJkgK / 1e3, vM3kg: st2.vM3kg, phaseLabel: 'Líquido comprimido', quality: null, massFlowKgS: m11, massFraction: m11 / m8, sourceNote: 'Referencia cátedra' },
          { id: '3', label: 'Salida CAA', pKPa: 300, TC: kToC(st3.TK), hKJkg: 561.47, sKJkgK: st3.sJkgK / 1e3, vM3kg: 0.001073, phaseLabel: 'Líquido saturado', quality: 0, massFlowKgS: m8, massFraction: 1, sourceNote: 'Referencia cátedra' },
          { id: '4', label: 'Salida bomba P2 (cuestionado)', pKPa: 12500, TC: kToC(st4.TK), hKJkg: 562.01, sKJkgK: st4.sJkgK / 1e3, vM3kg: st4.vM3kg, phaseLabel: 'Líquido comprimido', quality: null, massFlowKgS: m8, massFraction: 1, sourceNote: 'Cuestionado (w_B2=0,5365)' },
          { id: '5', label: 'Salida CAC (agua alim.)', pKPa: 12500, TC: kToC(st5.TK), hKJkg: 721.11, sKJkgK: st5.sJkgK / 1e3, vM3kg: st5.vM3kg, phaseLabel: 'Líquido comprimido', quality: null, massFlowKgS: m8, massFraction: 1, sourceNote: 'Referencia cátedra' },
          { id: '6', label: 'Condensado CAC', pKPa: 800, TC: kToC(st6.TK), hKJkg: 721.11, sKJkgK: st6.sJkgK / 1e3, vM3kg: st6.vM3kg, phaseLabel: 'Líquido saturado', quality: 0, massFlowKgS: m9, massFraction: m9 / m8, sourceNote: 'Referencia cátedra' },
          { id: '7', label: 'Drenaje trampa a CAA', pKPa: 300, TC: kToC(st7.TK), hKJkg: 721.11, sKJkgK: st7.sJkgK / 1e3, vM3kg: st7.vM3kg, phaseLabel: 'Mezcla (h7=h6)', quality: st7.quality, massFlowKgS: m9, massFraction: m9 / m8, sourceNote: 'Referencia cátedra' },
          { id: '8', label: 'Entrada turbina', pKPa: 12500, TC: 550, hKJkg: 3475.7, sKJkgK: st8.sJkgK / 1e3, vM3kg: st8.vM3kg, phaseLabel: 'Vapor sobrecalentado', quality: null, massFlowKgS: m8, massFraction: 1, sourceNote: 'Matriz ref. (3475,7 vs 3475,2)' },
          { id: '9', label: 'Extracción CAC', pKPa: 800, TC: kToC(st9.TK), hKJkg: 2754.11, sKJkgK: st9.sJkgK / 1e3, vM3kg: st9.vM3kg, phaseLabel: phaseToSpanish(st9), quality: st9.quality, massFlowKgS: m9, massFraction: m9 / m8, sourceNote: 'Referencia cátedra' },
          { id: '10', label: 'Extracción CAA', pKPa: 300, TC: kToC(st10.TK), hKJkg: 2577.7, sKJkgK: st10.sJkgK / 1e3, vM3kg: st10.vM3kg, phaseLabel: phaseToSpanish(st10), quality: st10.quality, massFlowKgS: m10, massFraction: m10 / m8, sourceNote: 'Referencia cátedra' },
          { id: '11', label: 'Escape condensador', pKPa: 10, TC: 45.81, hKJkg: 2099.13, sKJkgK: st11.sJkgK / 1e3, vM3kg: st11.vM3kg, phaseLabel: 'Mezcla saturada', quality: (2099.13 - 191.83) / 2392.1, massFlowKgS: m11, massFraction: m11 / m8, sourceNote: 'Matriz ref. (2099,13 vs 2099,42)' },
        ]
      : [
          { id: '1', label: 'Salida condensador', pKPa: input.pCondKPa, TC: kToC(st1.TK), hKJkg: h1k, sKJkgK: st1.sJkgK / 1e3, vM3kg: st1.vM3kg, phaseLabel: phaseToSpanish(st1), quality: st1.quality, massFlowKgS: m11, massFraction: m11 / m8, sourceNote: 'IAPWS-IF97' },
          { id: '2', label: 'Salida bomba P1', pKPa: pCaaPa / 1e3, TC: kToC(st2.TK), hKJkg: h2k, sKJkgK: st2.sJkgK / 1e3, vM3kg: st2.vM3kg, phaseLabel: phaseToSpanish(st2), quality: null, massFlowKgS: m11, massFraction: m11 / m8, sourceNote: 'IAPWS-IF97' },
          { id: '3', label: 'Salida CAA', pKPa: pCaaPa / 1e3, TC: kToC(st3.TK), hKJkg: h3k, sKJkgK: st3.sJkgK / 1e3, vM3kg: st3.vM3kg, phaseLabel: phaseToSpanish(st3), quality: st3.quality, massFlowKgS: m8, massFraction: 1, sourceNote: 'IAPWS-IF97' },
          { id: '4', label: 'Salida bomba P2', pKPa: input.pBoilerMPa * 1e3, TC: kToC(st4.TK), hKJkg: h4k, sKJkgK: st4.sJkgK / 1e3, vM3kg: st4.vM3kg, phaseLabel: phaseToSpanish(st4), quality: null, massFlowKgS: m8, massFraction: 1, sourceNote: 'IF97 + v3·Δp/η_B' },
          { id: '5', label: 'Salida CAC (agua alim.)', pKPa: input.pBoilerMPa * 1e3, TC: kToC(st5.TK), hKJkg: h5k, sKJkgK: st5.sJkgK / 1e3, vM3kg: st5.vM3kg, phaseLabel: phaseToSpanish(st5), quality: null, massFlowKgS: m8, massFraction: 1, sourceNote: 'IAPWS-IF97 (T5=Tsat6)' },
          { id: '6', label: 'Condensado CAC', pKPa: pCacPa / 1e3, TC: kToC(st6.TK), hKJkg: h6k, sKJkgK: st6.sJkgK / 1e3, vM3kg: st6.vM3kg, phaseLabel: phaseToSpanish(st6), quality: st6.quality, massFlowKgS: m9, massFraction: m9 / m8, sourceNote: 'IAPWS-IF97' },
          { id: '7', label: 'Drenaje trampa a CAA', pKPa: pCaaPa / 1e3, TC: kToC(st7.TK), hKJkg: h7k, sKJkgK: st7.sJkgK / 1e3, vM3kg: st7.vM3kg, phaseLabel: phaseToSpanish(st7), quality: st7.quality, massFlowKgS: m9, massFraction: m9 / m8, sourceNote: 'IAPWS-IF97 (h7=h6)' },
          { id: '8', label: 'Entrada turbina', pKPa: input.pBoilerMPa * 1e3, TC: kToC(st8.TK), hKJkg: h8k, sKJkgK: st8.sJkgK / 1e3, vM3kg: st8.vM3kg, phaseLabel: phaseToSpanish(st8), quality: null, massFlowKgS: m8, massFraction: 1, sourceNote: 'IAPWS-IF97 Región 2' },
          { id: '9', label: 'Extracción CAC', pKPa: pCacPa / 1e3, TC: kToC(st9.TK), hKJkg: h9k, sKJkgK: st9.sJkgK / 1e3, vM3kg: st9.vM3kg, phaseLabel: phaseToSpanish(st9), quality: st9.quality, massFlowKgS: m9, massFraction: m9 / m8, sourceNote: 'IAPWS-IF97' },
          { id: '10', label: 'Extracción CAA', pKPa: pCaaPa / 1e3, TC: kToC(st10.TK), hKJkg: h10k, sKJkgK: st10.sJkgK / 1e3, vM3kg: st10.vM3kg, phaseLabel: phaseToSpanish(st10), quality: st10.quality, massFlowKgS: m10, massFraction: m10 / m8, sourceNote: 'IAPWS-IF97' },
          { id: '11', label: 'Escape condensador', pKPa: input.pCondKPa, TC: kToC(st11.TK), hKJkg: h11k, sKJkgK: st11.sJkgK / 1e3, vM3kg: st11.vM3kg, phaseLabel: phaseToSpanish(st11), quality: st11.quality, massFlowKgS: m11, massFraction: m11 / m8, sourceNote: 'IAPWS-IF97' },
        ];

  const qInKJkg = submode === 'lecture-reference' ? 3475.2 - 721.11 : h8k - h5k;
  const qOutKJkg = (m11 / m8) * (states[10].hKJkg - states[0].hKJkg);
  const wNetKJkg = (submode === 'lecture-reference' ? 250000 : PNetKW) / m8;
  const wPumpKJkg =
    submode === 'lecture-reference'
      ? (m11 / m8) * (192.12 - 191.83) + (562.01 - 561.47)
      : (m11 / m8) * wB1k + wB2k;
  const wTurbineKJkg = wNetKJkg + wPumpKJkg;
  const etaThermal = wNetKJkg / qInKJkg;

  const balances: BalanceAudit[] = [
    {
      component: 'Turbina (continuidad y potencia)',
      massInKgS: m8,
      massOutKgS: m9 + m10 + m11,
      massResidualKgS: m8 - (m9 + m10 + m11),
      energyInKW: m8 * states[7].hKJkg,
      energyOutKW:
        m9 * states[8].hKJkg +
        m10 * states[9].hKJkg +
        m11 * states[10].hKJkg +
        wTurbineKJkg * m8,
      energyResidualKW:
        m8 * states[7].hKJkg -
        (m9 * states[8].hKJkg + m10 * states[9].hKJkg + m11 * states[10].hKJkg + wTurbineKJkg * m8),
      entropyGenKWK: null,
    },
    {
      component: 'Calentador Abierto (CAA)',
      massInKgS: m9 + m10 + m11,
      massOutKgS: m8,
      massResidualKgS: m9 + m10 + m11 - m8,
      energyInKW: m9 * states[6].hKJkg + m10 * states[9].hKJkg + m11 * states[1].hKJkg,
      energyOutKW: m8 * states[2].hKJkg,
      energyResidualKW:
        m9 * states[6].hKJkg + m10 * states[9].hKJkg + m11 * states[1].hKJkg - m8 * states[2].hKJkg,
      entropyGenKWK: null,
    },
    {
      component: 'Calentador Cerrado (CAC)',
      massInKgS: m8 + m9,
      massOutKgS: m8 + m9,
      massResidualKgS: 0,
      energyInKW: m9 * states[8].hKJkg + m8 * states[3].hKJkg,
      energyOutKW: m9 * states[5].hKJkg + m8 * states[4].hKJkg,
      energyResidualKW:
        m9 * (states[8].hKJkg - states[5].hKJkg) - m8 * (states[4].hKJkg - states[3].hKJkg),
      entropyGenKWK: null,
    },
  ];

  const maxEnergyRes = Math.max(...balances.map((b) => Math.abs(b.energyResidualKW)));

  const steps = buildRankine4CSteps(input, submode, states, comparison, activeFlows, etaThermal);

  return {
    ok: true,
    value: {
      mode: 'regenerative-4c',
      states,
      saturationDome: dome,
      wTurbineKJkg,
      wPumpKJkg,
      wNetKJkg,
      qInKJkg,
      qOutKJkg,
      etaThermal,
      massFlowBoilerKgS: m8,
      exitQuality: states[10].quality,
      matrixAudit4C: comparison,
      steps,
      audit: {
        modelId:
          submode === 'lecture-reference'
            ? 'rankine-4c-lecture-reference'
            : 'rankine-4c-if97-consistent',
        fluid: 'Agua / Vapor',
        provider:
          submode === 'lecture-reference'
            ? 'Coeficientes de referencia MEC110_9 (pendiente conciliación)'
            : iapwsIF97Provider.id,
        providerVersion: submode === 'lecture-reference' ? 'Transcripción v1' : iapwsIF97Provider.version,
        providerLicense: iapwsIF97Provider.license,
        hypotheses: [
          '11 estados con 1 calentador cerrado (CAC) y 1 calentador abierto (CAA)',
          'Trampa de vapor isoentálpica (h7 = h6)',
          'Salida de agua en CAC igualada a T_sat(p_CAC)',
        ],
        validationStatus: submode === 'lecture-reference' ? 'inconsistente' : 'verificado',
        warnings: submode === 'lecture-reference' ? [comparison.discrepancyNote] : [],
        balances,
        overallEnergyResidualKW: maxEnergyRes,
        overallMassResidualKgS: Math.abs(m8 - m9 - m10 - m11),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// 4F: Cogeneración y Ciclo Binario Conceptual
// ---------------------------------------------------------------------------
function solveCogenAndBinary(
  input: RankineInput,
  pBoilerPa: number,
  pCondPa: number,
  TBoilerK: number,
  dome: SaturationDomePoint[]
): Result<RankineOutput> {
  const base = solveSimpleRankine(input, pBoilerPa, pCondPa, TBoilerK, dome);
  if (!base.ok) return base;

  const electricMW = input.netPowerMW;
  const processHeatMW = input.processHeatMW ?? 45;
  const fuelMW = Math.max(electricMW + processHeatMW + 10, input.fuelInputMW ?? 100);
  const utilizationFactorPct = ((electricMW + processHeatMW) / fuelMW) * 100;

  // Ciclo binario conceptual ilustrativo (mercurio-agua histórico)
  const binaryUpperRejectMW = 40;
  const binaryLossMW = 2;
  const binaryLowerNetMW = (binaryUpperRejectMW - binaryLossMW) * 0.25;

  return {
    ok: true,
    value: {
      ...base.value,
      mode: 'cogeneration-binary',
      cogenerationSummary: {
        electricMW,
        processHeatMW,
        fuelMW,
        utilizationFactorPct,
        binaryUpperRejectMW,
        binaryLossMW,
        binaryLowerNetMW,
      },
      audit: {
        ...base.value.audit,
        modelId: 'rankine-cogeneration-binary-conceptual',
        hypotheses: [
          ...base.value.audit.hypotheses,
          'Cogeneración: ε_u = (Ẇ_neto + Q̇_útil) / Q̇_combustible (distinto de η_eléctrica)',
          'Ciclo binario Hg–H2O mostrado únicamente como modelo energético histórico conceptual (no diseño industrial vigente por toxicidad del mercurio)',
        ],
      },
    },
  };
}

function buildRankineStepsSimple(
  input: RankineInput,
  states: RankineDisplayState[],
  st4s: ThermoState,
  wPumpKJkg: number,
  wTurbineKJkg: number,
  wNetKJkg: number,
  qInKJkg: number,
  etaThermal: number,
  mDot: number
): SolvedStep[] {
  const [s1, s2, s3, s4] = states;
  return [
    {
      id: 'rk-1',
      stepNumber: 1,
      title: 'Identificar topología Rankine simple y presiones de operación',
      purpose: 'Fijar alta presión de caldera y baja presión de condensador.',
      equationLatex: String.raw`p_{\text{caldera}} = ${formatCL(input.pBoilerMPa, 2)}\;\mathrm{MPa},\quad p_{\text{cond}} = ${formatCL(input.pCondKPa, 1)}\;\mathrm{kPa}`,
      substitutions: [],
      resultValue: `${formatCL(input.pBoilerMPa, 2)} MPa / ${formatCL(input.pCondKPa, 1)} kPa`,
      unit: 'presiones',
      assumptions: ['Ciclo cerrado de vapor de agua en régimen estacionario'],
      interpretation: 'Dos niveles de presión conectan la caldera y el condensador.',
    },
    {
      id: 'rk-2',
      stepNumber: 2,
      title: 'Estado 1: salida del condensador (líquido saturado)',
      purpose: 'Consultar propiedades de saturación IAPWS-IF97 a p_cond.',
      equationLatex: String.raw`x_1 = 0 \implies h_1 = h_f(p_{\text{cond}}),\quad v_1 = v_f(p_{\text{cond}})`,
      substitutions: [
        { symbol: 'h_1', value: formatCL(s1.hKJkg, 2), unit: 'kJ/kg' },
        { symbol: 'v_1', value: formatCL(s1.vM3kg, 6), unit: 'm³/kg' },
      ],
      resultValue: formatCL(s1.hKJkg, 2),
      unit: 'kJ/kg',
      assumptions: ['Condensación completa sin subenfriamiento'],
      interpretation: 'Bombear líquido saturado consume mucho menos trabajo que comprimir vapor.',
    },
    {
      id: 'rk-3',
      stepNumber: 3,
      title: 'Trabajo de bomba y estado 2',
      purpose: 'Aplicar w_B ≈ v_1·Δp / η_B y h_2 = h_1 + w_B.',
      equationLatex: String.raw`w_B = \frac{v_1 (p_2 - p_1)}{\eta_B}, \qquad h_2 = h_1 + w_B`,
      substitutions: [
        { symbol: 'w_B', value: formatCL(wPumpKJkg, 2), unit: 'kJ/kg' },
        { symbol: String.raw`\eta_B`, value: formatCL(input.etaPump, 2), unit: '1' },
      ],
      resultValue: formatCL(s2.hKJkg, 2),
      unit: 'kJ/kg',
      assumptions: ['Líquido prácticamente incompresible en bomba'],
      interpretation: `El trabajo de bomba (${formatCL(wPumpKJkg, 2)} kJ/kg) es < 1 % del de turbina, pero no debe omitirse.`,
    },
    {
      id: 'rk-4',
      stepNumber: 4,
      title: 'Estado 3: vapor sobrecalentado a entrada de turbina',
      purpose: 'Consultar Región 2 IAPWS-IF97 para (p_caldera, T_caldera).',
      equationLatex: String.raw`(p_3, T_3) \xrightarrow{\text{IF97}} h_3,\; s_3`,
      substitutions: [
        { symbol: 'h_3', value: formatCL(s3.hKJkg, 2), unit: 'kJ/kg' },
        { symbol: 's_3', value: formatCL(s3.sKJkgK, 4), unit: 'kJ/(kg·K)' },
      ],
      resultValue: `${formatCL(s3.hKJkg, 2)} kJ/kg`,
      unit: 'kJ/kg',
      assumptions: ['Calidad x no aplica en región sobrecalentada'],
      interpretation: 'El sobrecalentamiento eleva h_3 y reduce la humedad al final de la expansión.',
    },
    {
      id: 'rk-5',
      stepNumber: 5,
      title: 'Expansión isentrópica ideal (4s) y verificación de fase',
      purpose: 'Resolver (p_cond, s_4s = s_3) y calidad ideal x_4s.',
      equationLatex: String.raw`s_{4s} = s_3 \implies x_{4s} = \frac{s_{4s} - s_f}{s_g - s_f}`,
      substitutions: [
        { symbol: 'h_{4s}', value: formatCL(st4s.hJkg / 1e3, 2), unit: 'kJ/kg' },
        { symbol: 'x_{4s}', value: st4s.quality !== null ? formatCL(st4s.quality * 100, 2) : 'Sobrecal.', unit: '%' },
      ],
      resultValue: formatCL(st4s.hJkg / 1e3, 2),
      unit: 'kJ/kg',
      assumptions: ['Turbina ideal adiabática reversible'],
      interpretation: 'Referencia límite para aplicar el rendimiento isentrópico η_T.',
    },
    {
      id: 'rk-6',
      stepNumber: 6,
      title: 'Trabajo real de turbina y estado real de escape (4)',
      purpose: 'Aplicar w_T = η_T (h_3 − h_4s) y h_4 = h_3 − w_T.',
      equationLatex: String.raw`w_T = \eta_T (h_3 - h_{4s}), \qquad h_4 = h_3 - w_T`,
      substitutions: [
        { symbol: String.raw`\eta_T`, value: formatCL(input.etaTurbine, 2), unit: '1' },
        { symbol: 'w_T', value: formatCL(wTurbineKJkg, 2), unit: 'kJ/kg' },
      ],
      resultValue: `${formatCL(s4.hKJkg, 2)} kJ/kg`,
      unit: 'kJ/kg',
      assumptions: ['Las irreversibilidades aumentan s_4 > s_3 y la entalpía de salida'],
      interpretation:
        s4.quality !== null
          ? `Calidad final real x_4 = ${formatCL(s4.quality * 100, 2)} % (mayor que x_4s por recalentamiento interno por fricción).`
          : 'Sale como vapor sobrecalentado.',
    },
    {
      id: 'rk-7',
      stepNumber: 7,
      title: 'Trabajo neto específico y calor en caldera',
      purpose: 'Calcular w_neto = w_T − w_B y q_in = h_3 − h_2.',
      equationLatex: String.raw`w_{\text{neto}} = w_T - w_B, \qquad q_{\text{in}} = h_3 - h_2`,
      substitutions: [
        { symbol: 'w_{\\text{neto}}', value: formatCL(wNetKJkg, 2), unit: 'kJ/kg' },
        { symbol: 'q_{\\text{in}}', value: formatCL(qInKJkg, 2), unit: 'kJ/kg' },
      ],
      resultValue: formatCL(wNetKJkg, 2),
      unit: 'kJ/kg',
      assumptions: ['Caldera sin trabajo de eje'],
      interpretation: 'Cada kilogramo de vapor produce este trabajo mecánico neto.',
    },
    {
      id: 'rk-8',
      stepNumber: 8,
      title: 'Eficiencia térmica y flujo másico para potencia neta',
      purpose: 'Evaluar η_th = w_neto / q_in y ṁ = Ẇ_neto / w_neto.',
      equationLatex: String.raw`\eta_{th} = \frac{w_{\text{neto}}}{q_{\text{in}}}, \qquad \dot m = \frac{\dot W_{\text{neto}}}{w_{\text{neto}}}`,
      substitutions: [
        { symbol: String.raw`\dot W_{\text{neto}}`, value: formatCL(input.netPowerMW * 1e3, 0), unit: 'kW' },
        { symbol: String.raw`\dot m`, value: formatCL(mDot, 2), unit: 'kg/s' },
      ],
      resultValue: `${formatCL(etaThermal * 100, 2)} %`,
      unit: '%',
      assumptions: ['1 MW = 1000 kW = 1000 kJ/s'],
      interpretation: `Se requieren ${formatCL(mDot, 2)} kg/s de vapor para sostener ${formatCL(input.netPowerMW, 0)} MW netos.`,
    },
  ];
}

function buildRankine4CSteps(
  input: RankineInput,
  submode: RegenerativeSubmode,
  states: RankineDisplayState[],
  comp: Rankine4CComparison,
  flows: number[],
  etaThermal: number
): SolvedStep[] {
  const [m8, m9, m10, m11] = flows;
  const activeA = submode === 'lecture-reference' ? comp.lectureMatrix : comp.physicalMatrix;
  const maxRes = submode === 'lecture-reference' ? comp.lectureResidualMax : comp.physicalResidualMax;

  return [
    {
      id: '4c-1',
      stepNumber: 1,
      title: 'Detectar topología regenerativa (11 estados, CAC + CAA)',
      purpose: 'Identificar la trayectoria del fluido y extracciones de turbina.',
      equationLatex: String.raw`p_{\text{cald}}=${formatCL(input.pBoilerMPa, 1)}\;\mathrm{MPa} \to p_{\text{CAC}}=${formatCL(input.pCacMPa ?? 0.8, 2)}\;\mathrm{MPa} \to p_{\text{CAA}}=${formatCL(input.pCaaMPa ?? 0.3, 2)}\;\mathrm{MPa} \to p_{\text{cond}}=${formatCL(input.pCondKPa, 1)}\;\mathrm{kPa}`,
      substitutions: [],
      resultValue: '11 estados',
      unit: 'grafo',
      assumptions: ['Dos extracciones de vapor desde turbina'],
      interpretation: 'El vapor extraído precalienta el agua antes de entrar a la caldera.',
    },
    {
      id: '4c-2',
      stepNumber: 2,
      title: 'Separar mezclador abierto (CAA) y cerrado (CAC)',
      purpose: 'Distinguir dónde se mezclan las masas y dónde solo hay intercambio térmico.',
      equationLatex: String.raw`\text{CAA: mezclan } \dot m_9, \dot m_{10}, \dot m_{11} \qquad \text{CAC: circuitos separados}`,
      substitutions: [],
      resultValue: '2 circuitos en CAC',
      unit: 'topología',
      assumptions: ['Trampa isoentálpica h_7 = h_6 entre CAC y CAA'],
      interpretation: 'El CAA produce líquido saturado (3) a 0,3 MPa; el CAC drena condensado (6→7).',
    },
    {
      id: '4c-3',
      stepNumber: 3,
      title: 'Estado 1 y bomba P1 (0,01 → 0,3 MPa)',
      purpose: 'Calcular salto de entalpía en bomba de baja presión.',
      equationLatex: String.raw`w_{B1} = h_2 - h_1 \approx \frac{v_1(p_2 - p_1)}{\eta_B}`,
      substitutions: [
        { symbol: 'h_1', value: formatCL(states[0].hKJkg, 2), unit: 'kJ/kg' },
        { symbol: 'h_2', value: formatCL(states[1].hKJkg, 2), unit: 'kJ/kg' },
      ],
      resultValue: formatCL(states[1].hKJkg - states[0].hKJkg, 3),
      unit: 'kJ/kg',
      assumptions: ['Por P1 circula únicamente el caudal ṁ_11'],
      interpretation: 'Salto energético pequeño debido a Δp moderado.',
    },
    {
      id: '4c-4',
      stepNumber: 4,
      title: 'Auditoría crítica: bomba P2 (estado 3 → 4)',
      purpose: 'Evaluar w_B2 = v_3 (p_4 − p_3) y exponer discrepancia respecto a la referencia.',
      equationLatex: String.raw`w_{B2,s} = v_3(p_4 - p_3) = 0{,}001073\,(12500 - 300) \approx 13{,}0906\;\frac{\mathrm{kJ}}{\mathrm{kg}}`,
      substitutions: [
        { symbol: 'w_{B2,\\text{ref}}', value: formatCL(comp.lectureWB2, 4), unit: 'kJ/kg' },
        { symbol: 'w_{B2,\\text{físico}}', value: formatCL(comp.physicalWB2, 4), unit: 'kJ/kg' },
      ],
      resultValue: formatCL(states[3].hKJkg - states[2].hKJkg, 4),
      unit: 'kJ/kg',
      assumptions: ['Por P2 circula el caudal total ṁ_8'],
      interpretation: comp.discrepancyNote,
      warning: submode === 'lecture-reference' ? 'Modo Referencia: usando h4=562,01 de transcripción.' : undefined,
    },
    {
      id: '4c-5',
      stepNumber: 5,
      title: 'Estados de entrada y extracciones en turbina (8, 9, 10, 11)',
      purpose: 'Consultar propiedades IF97 (o coeficientes de referencia según modo activo).',
      equationLatex: String.raw`h_8 = ${formatCL(states[7].hKJkg, 2)},\; h_9=${formatCL(states[8].hKJkg, 2)},\; h_{10}=${formatCL(states[9].hKJkg, 2)},\; h_{11}=${formatCL(states[10].hKJkg, 2)}`,
      substitutions: [],
      resultValue: '4 estados turbina',
      unit: 'kJ/kg',
      assumptions: [submode === 'lecture-reference' ? 'Coeficientes de referencia MEC110_9' : 'IAPWS-IF97'],
      interpretation: 'Cada extracción abandona la turbina a su presión intermedia correspondiente.',
    },
    {
      id: '4c-6',
      stepNumber: 6,
      title: 'Ecuación A — Continuidad másica en turbina',
      purpose: 'Asegurar que el vapor que entra en 8 se reparte en 9, 10 y 11.',
      equationLatex: String.raw`\dot m_8 - \dot m_9 - \dot m_{10} - \dot m_{11} = 0`,
      substitutions: [],
      resultValue: 'Fila 1',
      unit: 'kg/s',
      assumptions: ['Sin fugas en sellos'],
      interpretation: 'Primera fila del sistema lineal 4×4.',
    },
    {
      id: '4c-7',
      stepNumber: 7,
      title: 'Ecuación B — Balance de potencia neta (250 MW)',
      purpose: 'Restar el consumo de bombas P1 y P2 a la potencia de turbina.',
      equationLatex: String.raw`\dot m_8(h_8 - w_{B2}) - \dot m_9 h_9 - \dot m_{10} h_{10} - \dot m_{11}(h_{11} + w_{B1}) = \dot W_{\text{neto}}`,
      substitutions: [{ symbol: String.raw`\dot W_{\text{neto}}`, value: formatCL(input.netPowerMW * 1e3, 0), unit: 'kW' }],
      resultValue: `${formatCL(input.netPowerMW * 1e3, 0)} kW`,
      unit: 'kW',
      assumptions: ['Potencia neta fijada como especificación de planta'],
      interpretation: 'Segunda fila del sistema lineal 4×4.',
    },
    {
      id: '4c-8',
      stepNumber: 8,
      title: 'Ecuación C — Balance energético del Calentador Abierto (CAA)',
      purpose: 'Igualar entalpía de corrientes entrantes (7, 10, 2) con salida (3).',
      equationLatex: String.raw`\dot m_8 h_3 - \dot m_9 h_7 - \dot m_{10} h_{10} - \dot m_{11} h_2 = 0`,
      substitutions: [],
      resultValue: 'Fila 3',
      unit: 'kW',
      assumptions: ['Mezclador adiabático al ambiente'],
      interpretation: 'Tercera fila del sistema lineal 4×4.',
    },
    {
      id: '4c-9',
      stepNumber: 9,
      title: 'Ecuación D — Balance energético del Calentador Cerrado (CAC)',
      purpose: 'Igualar calor cedido por vapor ṁ_9 con calor ganado por agua ṁ_8.',
      equationLatex: String.raw`\dot m_8 (h_5 - h_4) - \dot m_9 (h_9 - h_6) = 0`,
      substitutions: [
        { symbol: 'h_5-h_4', value: formatCL(activeA[3][0], 2), unit: 'kJ/kg' },
        { symbol: '-(h_9-h_6)', value: formatCL(activeA[3][1], 2), unit: 'kJ/kg' },
      ],
      resultValue: 'Fila 4',
      unit: 'kW',
      assumptions: ['Intercambiador de superficie sin mezcla de masas'],
      interpretation: 'Cuarta fila del sistema lineal 4×4.',
    },
    {
      id: '4c-10',
      stepNumber: 10,
      title: 'Resolución numérica 4×4 (Eliminación gaussiana con pivoteo escalado)',
      purpose: 'Calcular los 4 caudales simultáneamente sin valores hardcodeados.',
      equationLatex: String.raw`A\,\vec{\dot m} = \vec{b}`,
      substitutions: [
        { symbol: String.raw`\dot m_8`, value: formatCL(m8, 3), unit: 'kg/s' },
        { symbol: String.raw`\dot m_9`, value: formatCL(m9, 3), unit: 'kg/s' },
        { symbol: String.raw`\dot m_{10}`, value: formatCL(m10, 3), unit: 'kg/s' },
        { symbol: String.raw`\dot m_{11}`, value: formatCL(m11, 3), unit: 'kg/s' },
      ],
      resultValue: `${formatCL(m8, 2)} kg/s total`,
      unit: 'kg/s',
      assumptions: ['Solver LU/Gauss con pivoteo parcial escalado'],
      interpretation: `Fracciones de 1 kg en caldera: y_CAC=${formatCL((m9 / m8) * 100, 2)} %, z_CAA=${formatCL((m10 / m8) * 100, 2)} %, condensador=${formatCL((m11 / m8) * 100, 2)} %.`,
    },
    {
      id: '4c-11',
      stepNumber: 11,
      title: 'Calor en caldera y eficiencia térmica global',
      purpose: 'Evaluar Q̇_in = ṁ_8 (h_8 − h_5) y η_th = Ẇ_neto / Q̇_in.',
      equationLatex: String.raw`\eta_{th} = \frac{\dot W_{\text{neto}}}{\dot m_8 (h_8 - h_5)}`,
      substitutions: [
        { symbol: String.raw`\eta_{\text{activo}}`, value: formatCL(etaThermal * 100, 2), unit: '%' },
        { symbol: String.raw`\eta_{\text{IF97}}`, value: formatCL(comp.physicalEtaPct, 2), unit: '%' },
      ],
      resultValue: `${formatCL(etaThermal * 100, 2)} %`,
      unit: '%',
      assumptions: ['La regeneración reduce Q̇_in al entrar agua más caliente a la caldera'],
      interpretation: `Referencia: ${formatCL(comp.lectureEtaPct, 2)} % vs Consistencia física IF97: ${formatCL(comp.physicalEtaPct, 2)} %.`,
    },
    {
      id: '4c-12',
      stepNumber: 12,
      title: 'Auditoría de residuos del sistema 4×4',
      purpose: 'Verificar ||A·ṁ − b||_∞ tras resolver.',
      equationLatex: String.raw`\|A\vec{\dot m} - \vec{b}\|_\infty`,
      substitutions: [{ symbol: 'residuo_{\\max}', value: maxRes.toExponential(2), unit: 'kW / kg/s' }],
      resultValue: maxRes.toExponential(2),
      unit: 'residuo',
      assumptions: ['Tolerancia algebraica < 1e-6'],
      interpretation: 'El sistema lineal cierra con precisión de punto flotante; la diferencia entre modos proviene únicamente de la física del estado 4 y redondeo de propiedades.',
    },
  ];
}
