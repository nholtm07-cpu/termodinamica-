/**
 * Motor puro para MEC110_7:
 * - Máquina térmica, postulado de Kelvin–Planck y ciclo de Carnot (incl. 3 fuentes y 500/200 kJ)
 * - Refrigerador doméstico de funcionamiento intermitente (1200 kJ/h, f=1/4, COP=2,5)
 * - Enfriamiento de 5 sandías (50 kg, 20->8 °C, 450 W, COP=4,5) + modelo comparativo con resistencia térmica
 * - Máquina productora de hielo (12 kg/h, 15->-5 °C, calor sensible + latente + solidificación)
 */

import type { BalanceAudit, Result, SolvedStep, SolverMetadata } from '../contracts';
import { cToK, formatCL, toKgPerS } from './units';

// ---------------------------------------------------------------------------
// M2-A: Máquina Térmica & Carnot
// ---------------------------------------------------------------------------
export interface CarnotEngineInput {
  mode: 'carnot-ideal' | 'general-engine';
  QHKJ: number;
  TH_C: number;
  TL_C: number;
  QLKJ?: number; // usado en general-engine o para despejar TH en caso 500/200
  solveTHFromQRatio?: boolean;
}

export interface CarnotEngineOutput {
  TH_K: number;
  TL_K: number;
  QHKJ: number;
  QLKJ: number;
  WNetKJ: number;
  etaThermal: number;
  etaCarnotMax: number;
  secondLawOk: boolean;
  steps: SolvedStep[];
  audit: SolverMetadata;
}

export function solveCarnotEngine(input: CarnotEngineInput): Result<CarnotEngineOutput> {
  const TL_K = cToK(input.TL_C);
  let TH_K = cToK(input.TH_C);

  if (TL_K <= 0 || TH_K <= 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_TEMPERATURE',
        message: 'La temperatura absoluta debe superar 0 K (−273,15 °C).',
        physicalExplanation: 'Las relaciones de Carnot usan escala absoluta Kelvin.',
        suggestedFix: 'Ingresa temperaturas superiores a −273,15 °C.',
      },
    };
  }
  if (input.QHKJ <= 0) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'El calor absorbido Q_H debe ser positivo.',
        physicalExplanation: 'Una máquina térmica requiere aporte térmico desde el foco caliente.',
        suggestedFix: 'Ajusta Q_H > 0.',
      },
    };
  }

  let QLKJ = input.QLKJ ?? input.QHKJ * (TL_K / TH_K);

  if (input.solveTHFromQRatio && input.QLKJ !== undefined) {
    if (input.QLKJ <= 0 || input.QLKJ >= input.QHKJ) {
      return {
        ok: false,
        error: {
          code: 'SECOND_LAW_VIOLATION',
          message: 'Violación de Kelvin–Planck / Primera Ley: Q_L debe cumplir 0 < Q_L < Q_H.',
          physicalExplanation:
            input.QLKJ <= 0
              ? 'El postulado de Kelvin–Planck prohíbe convertir todo el calor de un depósito en trabajo neto sin rechazar calor (Q_L = 0 es imposible en un ciclo).'
              : 'Si Q_L >= Q_H no existe trabajo neto positivo de salida.',
          suggestedFix: 'Elige 0 < Q_L < Q_H.',
        },
      };
    }
    QLKJ = input.QLKJ;
    TH_K = TL_K * (input.QHKJ / QLKJ);
  } else if (input.mode === 'carnot-ideal') {
    if (TH_K <= TL_K) {
      return {
        ok: false,
        error: {
          code: 'INVALID_TEMPERATURE',
          message: `T_H (${formatCL(TH_K, 2)} K) debe ser estrictamente mayor que T_L (${formatCL(TL_K, 2)} K).`,
          physicalExplanation: 'Sin gradiente térmico T_H > T_L no puede operar una máquina térmica motora.',
          suggestedFix: 'Aumenta T_H o reduce T_L.',
        },
      };
    }
    QLKJ = input.QHKJ * (TL_K / TH_K);
  } else {
    if (TH_K <= TL_K) {
      return {
        ok: false,
        error: {
          code: 'INVALID_TEMPERATURE',
          message: 'T_H debe ser mayor que T_L.',
          physicalExplanation: 'El foco caliente debe estar a mayor temperatura que el foco frío.',
          suggestedFix: 'Aumenta T_H por encima de T_L.',
        },
      };
    }
    if (QLKJ <= 0) {
      return {
        ok: false,
        error: {
          code: 'SECOND_LAW_VIOLATION',
          message: 'Violación de Kelvin–Planck: una máquina cíclica con Q_H > 0 no puede operar con Q_L <= 0.',
          physicalExplanation:
            'Es imposible construir un dispositivo cíclico cuyo único efecto sea absorber calor de un depósito y producir igual trabajo neto.',
          suggestedFix: 'Aumenta el calor rechazado Q_L > 0.',
        },
      };
    }
  }

  const WNetKJ = input.QHKJ - QLKJ;
  const etaThermal = WNetKJ / input.QHKJ;
  const etaCarnotMax = 1 - TL_K / TH_K;
  const sGenUniverse = QLKJ / TL_K - input.QHKJ / TH_K;
  const secondLawOk = etaThermal <= etaCarnotMax + 1e-9 && QLKJ > 0 && sGenUniverse >= -1e-9;

  const warnings: string[] = [];
  if (!secondLawOk) {
    warnings.push(
      `Violación de la Segunda Ley: la eficiencia térmica (${formatCL(etaThermal * 100, 2)} %) supera el límite de Carnot (${formatCL(etaCarnotMax * 100, 2)} %) y daría S_gen = ${formatCL(sGenUniverse, 4)} kJ/K < 0.`
    );
  }

  const balance: BalanceAudit = {
    component: 'Ciclo máquina térmica',
    massInKgS: 0,
    massOutKgS: 0,
    massResidualKgS: 0,
    energyInKW: input.QHKJ,
    energyOutKW: WNetKJ + QLKJ,
    energyResidualKW: input.QHKJ - WNetKJ - QLKJ,
    entropyGenKWK: sGenUniverse,
    entropyNote: 'Evaluado sobre reservorios externos T_H y T_L.',
  };

  const steps: SolvedStep[] = [
    {
      id: 'carnot-1',
      stepNumber: 1,
      title: 'Convertir temperaturas a escala absoluta (Kelvin)',
      purpose: 'Evitar el error típico de dividir grados Celsius en el cociente de Carnot.',
      equationLatex: String.raw`T[\mathrm{K}] = T[^\circ\mathrm{C}] + 273{,}15`,
      substitutions: [
        { symbol: 'T_L', value: formatCL(TL_K, 2), unit: 'K' },
        { symbol: 'T_H', value: formatCL(TH_K, 2), unit: 'K' },
      ],
      resultValue: `${formatCL(TL_K, 2)} / ${formatCL(TH_K, 2)}`,
      unit: 'K',
      assumptions: ['Depósitos isotérmicos ideales'],
      interpretation: 'Usar °C directamente cambiaría falsamente el límite termodinámico.',
    },
    {
      id: 'carnot-2',
      stepNumber: 2,
      title: 'Balance de Primera Ley en el ciclo',
      purpose: 'Aplicar ΔE_ciclo = 0 → W_neto = Q_H − Q_L.',
      equationLatex: String.raw`W_{\text{neto}} = Q_H - Q_L`,
      substitutions: [
        { symbol: 'Q_H', value: formatCL(input.QHKJ, 2), unit: 'kJ' },
        { symbol: 'Q_L', value: formatCL(QLKJ, 2), unit: 'kJ' },
      ],
      resultValue: formatCL(WNetKJ, 2),
      unit: 'kJ',
      assumptions: ['Operación cíclica estacionaria'],
      interpretation: 'Parte de Q_H se convierte en trabajo y el resto debe rechazarse al sumidero.',
    },
    {
      id: 'carnot-3',
      stepNumber: 3,
      title: 'Eficiencia térmica del ciclo',
      purpose: 'Medir la fracción del calor absorbido transformada en trabajo neto.',
      equationLatex: String.raw`\eta_{th} = \frac{W_{\text{neto}}}{Q_H} = 1 - \frac{Q_L}{Q_H}`,
      substitutions: [
        { symbol: 'W_{\text{neto}}', value: formatCL(WNetKJ, 2), unit: 'kJ' },
        { symbol: 'Q_H', value: formatCL(input.QHKJ, 2), unit: 'kJ' },
      ],
      resultValue: `${formatCL(etaThermal * 100, 2)} %`,
      unit: '%',
      assumptions: ['Definición estándar de rendimiento térmico'],
      interpretation: 'Nunca puede alcanzar 100 % en un ciclo con Q_H > 0.',
    },
    {
      id: 'carnot-4',
      stepNumber: 4,
      title: 'Límite reversible de Carnot y verificación entrópica',
      purpose: 'Contrastar con η_Carnot = 1 − T_L/T_H y S_gen del universo.',
      equationLatex: String.raw`\eta_{\text{Carnot}} = 1 - \frac{T_L}{T_H}, \qquad S_{\text{gen}} = \frac{Q_L}{T_L} - \frac{Q_H}{T_H} \ge 0`,
      substitutions: [
        { symbol: String.raw`\eta_{\text{Carnot}}`, value: formatCL(etaCarnotMax * 100, 2), unit: '%' },
        { symbol: String.raw`S_{\text{gen}}`, value: formatCL(sGenUniverse, 4), unit: 'kJ/K' },
      ],
      resultValue: secondLawOk ? 'Cumple 2ª Ley' : 'VIOLA 2ª LEY',
      unit: 'estado',
      assumptions: ['Frontera incluye ambos reservorios térmicos'],
      interpretation: secondLawOk
        ? 'El ciclo respeta el límite reversible de Carnot.'
        : 'Combinación imposible: S_gen resulta negativa.',
    },
  ];

  return {
    ok: true,
    value: {
      TH_K,
      TL_K,
      QHKJ: input.QHKJ,
      QLKJ,
      WNetKJ,
      etaThermal,
      etaCarnotMax,
      secondLawOk,
      steps,
      audit: {
        modelId: input.mode === 'carnot-ideal' ? 'carnot-reversible' : 'heat-engine-general',
        fluid: 'Modelo independiente del fluido',
        provider: 'Relaciones termodinámicas de Carnot',
        providerVersion: '1.0',
        providerLicense: 'Formulación clásica',
        hypotheses: ['Ciclo cerrado estacionario', 'Reservorios isotérmicos T_H y T_L'],
        validationStatus: secondLawOk ? 'verificado' : 'inconsistente',
        warnings,
        balances: [balance],
        overallEnergyResidualKW: balance.energyResidualKW,
        overallMassResidualKgS: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// M2-B: Refrigerador Doméstico Intermitente (Caso MEC110_7 s16)
// ---------------------------------------------------------------------------
export interface IntermittentFridgeInput {
  qLAvgKJH: number; // 1200 kJ/h
  activeFraction: number; // 0.25 (1/4 del tiempo)
  copR: number; // 2.5
}

export interface IntermittentFridgeOutput {
  qLAvgKW: number;
  qLActiveKW: number;
  wActiveKW: number;
  wActiveW: number;
  wAvgKW: number;
  qHActiveKW: number;
  steps: SolvedStep[];
  audit: SolverMetadata;
}

export function solveIntermittentFridge(
  input: IntermittentFridgeInput
): Result<IntermittentFridgeOutput> {
  if (input.qLAvgKJH <= 0 || input.activeFraction <= 0 || input.activeFraction > 1 || input.copR <= 0) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Verifica que Q̇_L > 0, COP > 0 y la fracción activa esté en (0, 1].',
        physicalExplanation: 'Un compresor no puede operar más del 100 % del tiempo ni tener COP <= 0.',
        suggestedFix: 'Ajusta fracción de funcionamiento entre 0,10 y 1,00 y COP > 0.',
      },
    };
  }

  const qLAvgKW = input.qLAvgKJH / 3600;
  const qLActiveKW = qLAvgKW / input.activeFraction;
  const wActiveKW = qLActiveKW / input.copR;
  const wActiveW = wActiveKW * 1000;
  const wAvgKW = wActiveKW * input.activeFraction;
  const qHActiveKW = qLActiveKW + wActiveKW;

  const steps: SolvedStep[] = [
    {
      id: 'fr-1',
      stepNumber: 1,
      title: 'Convertir tasa horaria (kJ/h) a potencia promedio (kW)',
      purpose: 'Unificar unidades antes de aplicar COP.',
      equationLatex: String.raw`\dot Q_{L,\text{prom}} = \frac{\dot Q_{L,\text{h}}}{3600}`,
      substitutions: [{ symbol: String.raw`\dot Q_{L,\text{h}}`, value: formatCL(input.qLAvgKJH, 1), unit: 'kJ/h' }],
      resultValue: formatCL(qLAvgKW, 4),
      unit: 'kW',
      assumptions: ['1 h = 3600 s'],
      interpretation: 'Representa el calor promedio extraído por segundo a lo largo del ciclo completo.',
    },
    {
      id: 'fr-2',
      stepNumber: 2,
      title: 'Escalar a la tasa real mientras el compresor está encendido',
      purpose: 'Si opera solo una fracción f del tiempo, debe extraer más rápido cuando está activo.',
      equationLatex: String.raw`\dot Q_{L,\text{activo}} = \frac{\dot Q_{L,\text{prom}}}{f}`,
      substitutions: [
        { symbol: 'f', value: formatCL(input.activeFraction, 2), unit: 'adim.' },
      ],
      resultValue: formatCL(qLActiveKW, 4),
      unit: 'kW',
      assumptions: ['Extracción uniforme durante encendido y despreciable en reposo'],
      interpretation: 'Mientras menor es el tiempo encendido, mayor es la potencia instantánea requerida.',
    },
    {
      id: 'fr-3',
      stepNumber: 3,
      title: 'Calcular potencia eléctrica activa desde el COP',
      purpose: 'Despejar Ẇ_in = Q̇_L / COP_R.',
      equationLatex: String.raw`\dot W_{\text{activo}} = \frac{\dot Q_{L,\text{activo}}}{\mathrm{COP}_R}`,
      substitutions: [{ symbol: String.raw`\mathrm{COP}_R`, value: formatCL(input.copR, 2), unit: '1' }],
      resultValue: `${formatCL(wActiveKW, 4)} kW (${formatCL(wActiveW, 1)} W)`,
      unit: 'W',
      assumptions: ['COP constante durante operación'],
      interpretation: `El compresor demanda ${formatCL(wActiveW, 1)} W cuando funciona, equivalentes a ${formatCL(wAvgKW * 1000, 1)} W promedio.`,
    },
  ];

  return {
    ok: true,
    value: {
      qLAvgKW,
      qLActiveKW,
      wActiveKW,
      wActiveW,
      wAvgKW,
      qHActiveKW,
      steps,
      audit: {
        modelId: 'intermittent-refrigerator',
        fluid: 'Modelo energético de ciclo de refrigeración',
        provider: 'Balances energéticos COP',
        providerVersion: '1.0',
        providerLicense: 'Formulación clásica',
        hypotheses: ['COP constante durante ciclo activo', 'Régimen cíclico estacionario'],
        validationStatus: 'verificado',
        warnings: [],
        balances: [
          {
            component: 'Refrigerador (fase activa)',
            massInKgS: 0,
            massOutKgS: 0,
            massResidualKgS: 0,
            energyInKW: qLActiveKW + wActiveKW,
            energyOutKW: qHActiveKW,
            energyResidualKW: 0,
            entropyGenKWK: null,
          },
        ],
        overallEnergyResidualKW: 0,
        overallMassResidualKgS: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// M2-C: Enfriamiento de 5 Sandías (Caso MEC110_7 s16)
// ---------------------------------------------------------------------------
export interface WatermelonCoolingInput {
  count: number; // 5
  massEachKg: number; // 10
  TInitialC: number; // 20
  TFinalC: number; // 8
  cpKJkgK: number; // 4.184
  electricPowerW: number; // 450
  copR: number; // 4.5
  heatLeakW?: number; // pérdida térmica opcional por paredes/puerta
}

export interface WatermelonCoolingOutput {
  totalMassKg: number;
  heatRemovedKJ: number;
  coolingPowerKW: number;
  netCoolingPowerKW: number;
  elapsedSeconds: number;
  elapsedMinutes: number;
  curve: Array<{ tMin: number; TIdealC: number; TRealisticC: number }>;
  steps: SolvedStep[];
  audit: SolverMetadata;
}

export function solveWatermelonCooling(
  input: WatermelonCoolingInput
): Result<WatermelonCoolingOutput> {
  const heatLeakW = input.heatLeakW ?? 0;
  if (
    input.count <= 0 ||
    input.massEachKg <= 0 ||
    input.cpKJkgK <= 0 ||
    input.electricPowerW <= 0 ||
    input.copR <= 0 ||
    input.TInitialC <= input.TFinalC
  ) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Para enfriamiento, T_inicial debe superar T_final y masas/potencias/COP deben ser positivos.',
        physicalExplanation: 'El modelo calcula el tiempo para extraer calor sensible desde T_i hasta T_f.',
        suggestedFix: 'Ajusta T_inicial > T_final y parámetros positivos.',
      },
    };
  }

  const totalMassKg = input.count * input.massEachKg;
  const deltaT = input.TInitialC - input.TFinalC;
  const heatRemovedKJ = totalMassKg * input.cpKJkgK * deltaT;
  const coolingPowerKW = (input.electricPowerW / 1000) * input.copR;
  const netCoolingPowerKW = coolingPowerKW - heatLeakW / 1000;

  if (netCoolingPowerKW <= 0) {
    return {
      ok: false,
      error: {
        code: 'INCONSISTENT_TOPOLOGY',
        message: 'La infiltración térmica por paredes supera la capacidad frigorífica.',
        physicalExplanation: 'Si las ganancias térmicas >= Q̇_L, la fruta no se enfría hasta T_final.',
        suggestedFix: 'Reduce las pérdidas térmicas o aumenta la potencia/COP.',
      },
    };
  }

  const elapsedSeconds = heatRemovedKJ / netCoolingPowerKW;
  const elapsedMinutes = elapsedSeconds / 60;

  // Curva ideal lineal vs curva comparativa con resistencia térmica interna (enfriamiento exponencial aproximado)
  const curve: Array<{ tMin: number; TIdealC: number; TRealisticC: number }> = [];
  const points = 24;
  const maxTMin = elapsedMinutes * 1.4;
  const tauMin = elapsedMinutes * 0.65;
  const TambMin = input.TFinalC - 4;
  for (let i = 0; i <= points; i++) {
    const tMin = (maxTMin * i) / points;
    const TIdealC =
      tMin <= elapsedMinutes
        ? input.TInitialC - (deltaT * tMin) / elapsedMinutes
        : input.TFinalC;
    const TRealisticC =
      TambMin + (input.TInitialC - TambMin) * Math.exp(-tMin / Math.max(1e-3, tauMin));
    curve.push({ tMin, TIdealC, TRealisticC });
  }

  const steps: SolvedStep[] = [
    {
      id: 'wm-1',
      stepNumber: 1,
      title: 'Masa total del alimento',
      purpose: 'Multiplicar cantidad de unidades por masa unitaria.',
      equationLatex: String.raw`m_{\text{total}} = N_{\text{frutas}} \cdot m_{\text{c/u}}`,
      substitutions: [
        { symbol: 'N', value: `${input.count}`, unit: '1' },
        { symbol: 'm', value: formatCL(input.massEachKg, 1), unit: 'kg' },
      ],
      resultValue: formatCL(totalMassKg, 1),
      unit: 'kg',
      assumptions: ['Propiedades térmicas aproximadas a agua líquida'],
      interpretation: 'Masa total que debe reducir su temperatura.',
    },
    {
      id: 'wm-2',
      stepNumber: 2,
      title: 'Calor sensible a extraer',
      purpose: 'Calcular |Q| = m · c · ΔT sin cambio de fase.',
      equationLatex: String.raw`|Q| = m c (T_i - T_f)`,
      substitutions: [
        { symbol: 'c', value: formatCL(input.cpKJkgK, 3), unit: 'kJ/(kg·K)' },
        { symbol: String.raw`\Delta T`, value: formatCL(deltaT, 1), unit: 'K' },
      ],
      resultValue: formatCL(heatRemovedKJ, 2),
      unit: 'kJ',
      assumptions: ['Calor específico constante en 8–20 °C'],
      interpretation: 'Nota: ΔT en °C es numéricamente igual a ΔT en K.',
    },
    {
      id: 'wm-3',
      stepNumber: 3,
      title: 'Capacidad frigorífica efectiva',
      purpose: 'Convertir W a kW y multiplicar por COP_R.',
      equationLatex: String.raw`\dot Q_{L,\text{neta}} = \mathrm{COP}_R \cdot \dot W_{\text{eléctrica}} - \dot Q_{\text{pérdidas}}`,
      substitutions: [
        { symbol: String.raw`\dot W`, value: formatCL(input.electricPowerW / 1000, 3), unit: 'kW' },
        { symbol: String.raw`\mathrm{COP}_R`, value: formatCL(input.copR, 2), unit: '1' },
      ],
      resultValue: formatCL(netCoolingPowerKW, 4),
      unit: 'kW',
      assumptions: ['Capacidad frigorífica constante durante el enfriamiento'],
      interpretation: 'Por cada kW eléctrico se retiran 4,5 kW de calor del compartimento.',
    },
    {
      id: 'wm-4',
      stepNumber: 4,
      title: 'Tiempo mínimo idealizado',
      purpose: 'Dividir energía total por tasa neta de extracción.',
      equationLatex: String.raw`t = \frac{|Q|}{\dot Q_{L,\text{neta}}}`,
      substitutions: [
        { symbol: '|Q|', value: formatCL(heatRemovedKJ, 2), unit: 'kJ' },
        { symbol: String.raw`\dot Q_L`, value: formatCL(netCoolingPowerKW, 4), unit: 'kW' },
      ],
      resultValue: `${formatCL(elapsedSeconds, 2)} s (${formatCL(elapsedMinutes, 2)} min)`,
      unit: 'min',
      assumptions: ['Sin resistencia térmica interna ni apertura de puertas'],
      interpretation:
        'Es un límite inferior idealizado; en un refrigerador real la difusión interna de calor extiende el tiempo.',
    },
  ];

  return {
    ok: true,
    value: {
      totalMassKg,
      heatRemovedKJ,
      coolingPowerKW,
      netCoolingPowerKW,
      elapsedSeconds,
      elapsedMinutes,
      curve,
      steps,
      audit: {
        modelId: 'watermelon-transient-cooling',
        fluid: 'Alimento aproximado como agua líquida',
        provider: 'Modelo lumped-capacitance idealizado',
        providerVersion: '1.0',
        providerLicense: 'Formulación clásica',
        hypotheses: [
          'Sandía tratada como agua (c = 4,184 kJ/(kg·K))',
          'Capacidad frigorífica y COP constantes',
          'Sin cambio de fase (T_f > 0 °C)',
        ],
        validationStatus: 'verificado',
        warnings: [],
        balances: [],
        overallEnergyResidualKW: 0,
        overallMassResidualKgS: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// M2-D: Máquina Productora de Hielo (Caso MEC110_7 s17–18)
// ---------------------------------------------------------------------------
export interface IceMakerInput {
  massFlowKgH: number; // 12 kg/h
  TWaterInC: number; // 15 °C
  TIceOutC: number; // -5 °C
  cWater?: number; // 4.184
  hFusion?: number; // 333.7
  cIce?: number; // 2.11
  copR: number; // 2.4
}

export interface IceMakerOutput {
  massFlowKgS: number;
  qSensibleWaterKJkg: number;
  qLatentFusionKJkg: number;
  qSensibleIceKJkg: number;
  qTotalKJkg: number;
  qDotLKW: number;
  wDotInKW: number;
  wDotInW: number;
  curve: Array<{ label: string; qAccumKJkg: number; TC: number; regime: string }>;
  steps: SolvedStep[];
  audit: SolverMetadata;
}

export function solveIceMaker(input: IceMakerInput): Result<IceMakerOutput> {
  const cWater = input.cWater ?? 4.184;
  const hFusion = input.hFusion ?? 333.7;
  const cIce = input.cIce ?? 2.11;

  if (input.massFlowKgH <= 0 || input.copR <= 0 || input.TWaterInC <= 0 || input.TIceOutC >= 0) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'El proceso de fabricación de hielo requiere T_agua > 0 °C, T_hielo < 0 °C, ṁ > 0 y COP > 0.',
        physicalExplanation: 'Para cruzar la solidificación completa a 0 °C, el agua entra líquida (>0 °C) y sale hielo (<0 °C).',
        suggestedFix: 'Ajusta T_agua > 0 °C y T_hielo < 0 °C.',
      },
    };
  }

  const qSensibleWaterKJkg = cWater * (input.TWaterInC - 0);
  const qLatentFusionKJkg = hFusion;
  const qSensibleIceKJkg = cIce * (0 - input.TIceOutC);
  const qTotalKJkg = qSensibleWaterKJkg + qLatentFusionKJkg + qSensibleIceKJkg;

  const massFlowKgS = toKgPerS(input.massFlowKgH, 'kg/h');
  const qDotLKW = massFlowKgS * qTotalKJkg;
  const wDotInKW = qDotLKW / input.copR;
  const wDotInW = wDotInKW * 1000;

  const curve = [
    { label: 'A (Agua entra)', qAccumKJkg: 0, TC: input.TWaterInC, regime: 'Líquido sensible' },
    { label: 'B (Inicio congelación)', qAccumKJkg: qSensibleWaterKJkg, TC: 0, regime: 'Líquido saturado 0 °C' },
    {
      label: 'C (Fin congelación)',
      qAccumKJkg: qSensibleWaterKJkg + qLatentFusionKJkg,
      TC: 0,
      regime: 'Meseta latente',
    },
    { label: 'D (Hielo final)', qAccumKJkg: qTotalKJkg, TC: input.TIceOutC, regime: 'Sólido sensible' },
  ];

  const steps: SolvedStep[] = [
    {
      id: 'ice-1',
      stepNumber: 1,
      title: 'Tramo I: enfriamiento sensible del agua líquida (T_in → 0 °C)',
      purpose: 'Retirar calor hasta alcanzar el punto de congelación.',
      equationLatex: String.raw`q_1 = c_{\text{agua}} (T_{\text{in}} - 0)`,
      substitutions: [
        { symbol: 'c_{\\text{agua}}', value: formatCL(cWater, 3), unit: 'kJ/(kg·K)' },
        { symbol: '\\Delta T_1', value: formatCL(input.TWaterInC, 1), unit: 'K' },
      ],
      resultValue: formatCL(qSensibleWaterKJkg, 2),
      unit: 'kJ/kg',
      assumptions: ['Presión cercana a 1 atm (T_congelación ≈ 0 °C)'],
      interpretation: 'Solo representa una fracción menor de la carga total.',
    },
    {
      id: 'ice-2',
      stepNumber: 2,
      title: 'Tramo II: cambio de fase líquido → sólido a 0 °C (calor latente)',
      purpose: 'Incluir la entalpía de fusión/solidificación en la meseta isotérmica.',
      equationLatex: String.raw`q_2 = h_{\text{fusión}}`,
      substitutions: [{ symbol: 'h_{\\text{fusión}}', value: formatCL(hFusion, 1), unit: 'kJ/kg' }],
      resultValue: formatCL(qLatentFusionKJkg, 2),
      unit: 'kJ/kg',
      assumptions: ['Solidificación completa isotérmica a 0 °C'],
      interpretation: 'Domina el requerimiento energético (~82 % del calor total a retirar).',
    },
    {
      id: 'ice-3',
      stepNumber: 3,
      title: 'Tramo III: subenfriamiento del hielo (0 °C → T_out)',
      purpose: 'Enfriar el hielo formado hasta la temperatura objetivo.',
      equationLatex: String.raw`q_3 = c_{\text{hielo}} (0 - T_{\text{out}})`,
      substitutions: [
        { symbol: 'c_{\\text{hielo}}', value: formatCL(cIce, 2), unit: 'kJ/(kg·K)' },
        { symbol: '\\Delta T_3', value: formatCL(-input.TIceOutC, 1), unit: 'K' },
      ],
      resultValue: formatCL(qSensibleIceKJkg, 2),
      unit: 'kJ/kg',
      assumptions: ['c_hielo constante bajo 0 °C'],
      interpretation: 'Error típico de certamen: olvidar q_2 o usar un único mcΔT de 15 a −5 °C.',
    },
    {
      id: 'ice-4',
      stepNumber: 4,
      title: 'Carga frigorífica y potencia del compresor',
      purpose: 'Combinar q_total = q_1+q_2+q_3 con ṁ en kg/s y COP_R.',
      equationLatex: String.raw`\dot Q_L = \dot m \, q_{\text{total}}, \qquad \dot W_{\text{in}} = \frac{\dot Q_L}{\mathrm{COP}_R}`,
      substitutions: [
        { symbol: 'q_{\\text{total}}', value: formatCL(qTotalKJkg, 2), unit: 'kJ/kg' },
        { symbol: String.raw`\dot m`, value: formatCL(massFlowKgS, 5), unit: 'kg/s' },
        { symbol: String.raw`\dot Q_L`, value: formatCL(qDotLKW, 4), unit: 'kW' },
      ],
      resultValue: `${formatCL(wDotInKW, 4)} kW (${formatCL(wDotInW, 1)} W)`,
      unit: 'W',
      assumptions: ['Operación estacionaria continua'],
      interpretation: `Requiere ${formatCL(wDotInW, 1)} W de trabajo eléctrico para producir ${formatCL(input.massFlowKgH, 1)} kg/h de hielo.`,
    },
  ];

  return {
    ok: true,
    value: {
      massFlowKgS,
      qSensibleWaterKJkg,
      qLatentFusionKJkg,
      qSensibleIceKJkg,
      qTotalKJkg,
      qDotLKW,
      wDotInKW,
      wDotInW,
      curve,
      steps,
      audit: {
        modelId: 'ice-maker-phase-change',
        fluid: 'Agua líquida / hielo (propiedades constantes por fase)',
        provider: 'Parámetros térmicos de cambio de fase (MEC110_7)',
        providerVersion: '1.0',
        providerLicense: 'Formulación clásica',
        hypotheses: [
          `c_agua=${formatCL(cWater, 3)} kJ/(kg·K)`,
          `h_fusión=${formatCL(hFusion, 1)} kJ/kg a 0 °C`,
          `c_hielo=${formatCL(cIce, 2)} kJ/(kg·K)`,
          'Sin pérdidas térmicas de gabinete',
        ],
        validationStatus: 'verificado',
        warnings: [],
        balances: [],
        overallEnergyResidualKW: 0,
        overallMassResidualKgS: 0,
      },
    },
  };
}
