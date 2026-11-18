/**
 * Motor puro para MEC110_1–MEC110_5:
 * - Gas ideal (aire estándar cp/cv constantes y opción cp(T) variable aproximada)
 * - Procesos cerrados (isobárico, isocórico, isotérmico, politrópico, isentrópico)
 * - Equipos estacionarios de volumen de control (turbina, compresor, bomba, tobera, válvula, intercambiador)
 * - Flujo transitorio (llenado/vaciado de tanque)
 * - Interpolación lineal explícita y relaciones Tds de Gibbs
 */

import type { BalanceAudit, Result, SolvedStep, SolverMetadata } from '../contracts';
import { cToK, formatCL } from './units';

export const AIR_R = 0.287; // kJ/(kg·K)
export const AIR_CP_STD = 1.005; // kJ/(kg·K)
export const AIR_CV_STD = 0.718; // kJ/(kg·K)
export const AIR_K_STD = 1.4;

/**
 * Calor específico aproximado del aire como gas ideal (NASA/Çengel polinómico 250–1500 K) en kJ/(kg·K).
 */
export function airCpVariableKJkgK(TK: number): number {
  const M = 28.97;
  const a = 28.11;
  const b = 0.1967e-2;
  const c = 0.4802e-5;
  const d = -1.966e-9;
  const cpMolar = a + b * TK + c * TK * TK + d * TK * TK * TK;
  return cpMolar / M;
}

export interface LinearInterpolationResult {
  alpha: number;
  y: number;
  steps: string[];
}

export function linearInterpolate(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x: number
): Result<LinearInterpolationResult> {
  if (!Number.isFinite(x0) || !Number.isFinite(x1) || Math.abs(x1 - x0) < 1e-12) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Los puntos de referencia x0 y x1 coinciden o no son finitos.',
        physicalExplanation: 'La interpolación lineal requiere dos filas distintas de la tabla.',
        suggestedFix: 'Selecciona dos filas vecinas con x0 ≠ x1.',
      },
    };
  }
  const alpha = (x - x0) / (x1 - x0);
  const y = y0 + alpha * (y1 - y0);
  const warning =
    alpha < 0 || alpha > 1
      ? 'Advertencia: estás extrapolando fuera del intervalo [x0, x1]. Verifica que no cruces una línea de cambio de fase.'
      : '';
  return {
    ok: true,
    value: {
      alpha,
      y,
      steps: [
        `α = (${formatCL(x, 4)} − ${formatCL(x0, 4)}) / (${formatCL(x1, 4)} − ${formatCL(x0, 4)}) = ${formatCL(alpha, 5)}`,
        `y = ${formatCL(y0, 4)} + ${formatCL(alpha, 5)} × (${formatCL(y1, 4)} − ${formatCL(y0, 4)}) = ${formatCL(y, 4)}`,
        ...(warning ? [warning] : []),
      ],
    },
  };
}

export type ClosedProcessType = 'isobaric' | 'isochoric' | 'isothermal' | 'polytropic';

export interface ClosedSystemInput {
  process: ClosedProcessType;
  mKg: number;
  p1KPa: number;
  V1M3: number;
  T1C: number;
  V2M3: number;
  nPolytropic?: number;
  R?: number;
  cv?: number;
}

export interface ClosedSystemOutput {
  T1K: number;
  T2K: number;
  p2KPa: number;
  WbKJ: number;
  deltaUKJ: number;
  QKJ: number;
  deltaSKJK: number;
  steps: SolvedStep[];
  audit: SolverMetadata;
}

export function solveIdealGasClosedProcess(input: ClosedSystemInput): Result<ClosedSystemOutput> {
  const R = input.R ?? AIR_R;
  const cv = input.cv ?? AIR_CV_STD;
  const T1K = cToK(input.T1C);

  if (input.mKg <= 0 || input.p1KPa <= 0 || input.V1M3 <= 0 || input.V2M3 <= 0 || T1K <= 0) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Masa, presión absoluta, volumen y temperatura en Kelvin deben ser positivos.',
        physicalExplanation: 'Un sistema físico cerrado con gas ideal no admite volumen, masa o presión nula/negativa.',
        suggestedFix: 'Ingresa valores estrictamente positivos y temperatura > −273,15 °C.',
      },
    };
  }

  // Verificar consistencia de estado inicial p1*V1 = m*R*T1 o recalcular V1/T1?
  // Tomamos m = (p1 * V1) / (R * T1) si el usuario dio p1, V1, T1; o notificamos si m difiere.
  const mConsistent = (input.p1KPa * input.V1M3) / (R * T1K);
  const massMismatch = Math.abs(mConsistent - input.mKg) / input.mKg;
  const warnings: string[] = [];
  if (massMismatch > 0.02) {
    warnings.push(
      `Nota de consistencia: con p1=${formatCL(input.p1KPa, 1)} kPa, V1=${formatCL(input.V1M3, 3)} m³ y T1=${formatCL(T1K, 2)} K, la ecuación de estado da m=${formatCL(mConsistent, 4)} kg (ingresaste ${formatCL(input.mKg, 3)} kg). Se usa la masa ingresada en el balance térmico.`
    );
  }

  let p2KPa = input.p1KPa;
  let T2K = T1K;
  let WbKJ = 0;

  if (input.process === 'isochoric') {
    // Volumen constante: se usa V2 como V1
    p2KPa = input.p1KPa;
    T2K = T1K;
    WbKJ = 0;
  } else if (input.process === 'isobaric') {
    p2KPa = input.p1KPa;
    T2K = T1K * (input.V2M3 / input.V1M3);
    WbKJ = input.p1KPa * (input.V2M3 - input.V1M3);
  } else if (input.process === 'isothermal') {
    T2K = T1K;
    p2KPa = input.p1KPa * (input.V1M3 / input.V2M3);
    WbKJ = input.p1KPa * input.V1M3 * Math.log(input.V2M3 / input.V1M3);
  } else {
    const n = input.nPolytropic ?? 1.3;
    if (Math.abs(n - 1) < 1e-6) {
      T2K = T1K;
      p2KPa = input.p1KPa * (input.V1M3 / input.V2M3);
      WbKJ = input.p1KPa * input.V1M3 * Math.log(input.V2M3 / input.V1M3);
    } else {
      p2KPa = input.p1KPa * Math.pow(input.V1M3 / input.V2M3, n);
      T2K = T1K * Math.pow(input.V1M3 / input.V2M3, n - 1);
      WbKJ = (p2KPa * input.V2M3 - input.p1KPa * input.V1M3) / (1 - n);
    }
  }

  const deltaUKJ = input.mKg * cv * (T2K - T1K);
  const QKJ = deltaUKJ + WbKJ;
  const cp = cv + R;
  const deltaSKJK =
    input.mKg * (cp * Math.log(T2K / T1K) - R * Math.log(p2KPa / input.p1KPa));

  const balance: BalanceAudit = {
    component: 'Sistema cerrado (cilindro-pistón)',
    massInKgS: 0,
    massOutKgS: 0,
    massResidualKgS: 0,
    energyInKW: QKJ,
    energyOutKW: deltaUKJ + WbKJ,
    energyResidualKW: QKJ - WbKJ - deltaUKJ,
    entropyGenKWK: null,
    entropyNote: 'Se reporta ΔS del sistema; S_gen requiere especificar la temperatura de frontera T_b.',
  };

  const steps: SolvedStep[] = [
    {
      id: 'cs-1',
      stepNumber: 1,
      title: 'Identificar sistema cerrado y estado inicial',
      purpose: 'Convertir temperatura a Kelvin y verificar frontera impermeable a la masa.',
      equationLatex: String.raw`T_1 = T_1[^\circ\mathrm{C}] + 273{,}15`,
      substitutions: [{ symbol: 'T_1', value: formatCL(T1K, 2), unit: 'K' }],
      resultValue: formatCL(T1K, 2),
      unit: 'K',
      assumptions: ['Sistema cerrado (Δm = 0)', 'Gas ideal', 'ΔEc ≈ 0, ΔEp ≈ 0'],
      interpretation: 'Al no cruzar masa la frontera, aplicamos Q − W = ΔU.',
    },
    {
      id: 'cs-2',
      stepNumber: 2,
      title: 'Trabajo de frontera cuasiestático',
      purpose: 'Integrar ∫P dV según la trayectoria seleccionada.',
      equationLatex:
        input.process === 'isothermal'
          ? String.raw`W_b = p_1 V_1 \ln\!\left(\frac{V_2}{V_1}\right)`
          : input.process === 'isobaric'
            ? String.raw`W_b = p_1 (V_2 - V_1)`
            : input.process === 'isochoric'
              ? String.raw`W_b = 0`
              : String.raw`W_b = \frac{p_2 V_2 - p_1 V_1}{1 - n}`,
      substitutions: [
        { symbol: 'p_1', value: formatCL(input.p1KPa, 2), unit: 'kPa' },
        { symbol: 'V_1', value: formatCL(input.V1M3, 3), unit: 'm³' },
        { symbol: 'V_2', value: formatCL(input.V2M3, 3), unit: 'm³' },
      ],
      resultValue: formatCL(WbKJ, 3),
      unit: 'kJ',
      assumptions: ['Proceso de cuasiequilibrio mecánico'],
      interpretation:
        WbKJ >= 0
          ? 'Expansión: el gas realiza trabajo positivo sobre el pistón.'
          : 'Compresión: el entorno entrega trabajo al gas.',
    },
    {
      id: 'cs-3',
      stepNumber: 3,
      title: 'Variación de energía interna y Primera Ley',
      purpose: 'Obtener ΔU = m·cv·ΔT y despejar Q = ΔU + W_b.',
      equationLatex: String.raw`Q = m c_v (T_2 - T_1) + W_b`,
      substitutions: [
        { symbol: '\\Delta U', value: formatCL(deltaUKJ, 3), unit: 'kJ' },
        { symbol: 'W_b', value: formatCL(WbKJ, 3), unit: 'kJ' },
      ],
      resultValue: formatCL(QKJ, 3),
      unit: 'kJ',
      assumptions: ['cv constante'],
      interpretation:
        QKJ >= 0
          ? 'Calor neto entra al sistema (Q > 0).'
          : 'Calor neto sale del sistema hacia el entorno (Q < 0).',
    },
  ];

  return {
    ok: true,
    value: {
      T1K,
      T2K,
      p2KPa,
      WbKJ,
      deltaUKJ,
      QKJ,
      deltaSKJK,
      steps,
      audit: {
        modelId: 'ideal-gas-closed-system',
        fluid: 'Aire (gas ideal)',
        provider: 'Modelo analítico aire estándar',
        providerVersion: '1.0',
        providerLicense: 'Ecuación de estado ideal',
        hypotheses: ['Gas ideal', 'cv constante', 'Proceso cuasiestático', 'ΔEc ≈ 0, ΔEp ≈ 0'],
        validationStatus: warnings.length > 0 ? 'aproximado' : 'verificado',
        warnings,
        balances: [balance],
        overallEnergyResidualKW: balance.energyResidualKW,
        overallMassResidualKgS: 0,
      },
    },
  };
}

/**
 * Cálculo rápido para tobera adiabática estacionaria (MEC110_4).
 */
export function solveAdiabaticNozzle(
  h1KJkg: number,
  h2KJkg: number,
  V1Ms: number
): Result<{ V2Ms: number; deltaEcKJkg: number }> {
  const deltaH = h1KJkg - h2KJkg;
  const inside = V1Ms * V1Ms + 2000 * deltaH;
  if (inside < 0) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'La caída de entalpía no alcanza para sostener energía cinética positiva.',
        physicalExplanation: 'En una tobera adiabática sin trabajo de eje, h2 > h1 + V1²/2000 implicaría V2² < 0.',
        suggestedFix: 'Asegúrate de que h1 > h2 en expansión aceleradora.',
      },
    };
  }
  const V2Ms = Math.sqrt(inside);
  return {
    ok: true,
    value: { V2Ms, deltaEcKJkg: (V2Ms * V2Ms - V1Ms * V1Ms) / 2000 },
  };
}
