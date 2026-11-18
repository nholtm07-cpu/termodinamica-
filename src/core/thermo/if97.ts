/**
 * Implementación pura en TypeScript de la formulación internacional IAPWS-IF97
 * (International Association for the Properties of Water and Steam, 1997 / Rev. 2007)
 * para agua y vapor:
 *   - Región 1: Líquido comprimido / subenfriado (273.15 K <= T <= 623.15 K, p_sat(T) <= p <= 100 MPa)
 *   - Región 2: Vapor sobrecalentado y gas ideal a baja p (273.15 K <= T <= 1073.15 K)
 *   - Región 4: Curva de saturación y mezcla bifásica (273.15 K <= T <= 647.096 K)
 *
 * Referencia pública: IAPWS R7-97(2012), "Revised Release on the IAPWS Industrial
 * Formulation 1997 for the Thermodynamic Properties of Water and Steam".
 * Licencia de la formulación matemática: estándar científico abierto IAPWS.
 */

import type {
  DomainError,
  Phase,
  PropertyProvider,
  Provenance,
  Result,
  ThermoState,
} from '../contracts';

export const IF97_R = 461.526; // J/(kg·K)
export const IF97_TC = 647.096; // K
export const IF97_PC = 22.064e6; // Pa
export const IF97_T_MIN = 273.15; // K
export const IF97_P_MIN = 611.212677; // Pa (p_sat at 273.15 K)
export const IF97_P_MAX = 100e6; // Pa

const PROVENANCE_IF97: Provenance = {
  kind: 'iapws-if97',
  provider: 'IAPWS-IF97 (Regiones 1, 2 y 4)',
  version: 'R7-97(2012)',
  license: 'Formulación matemática abierta IAPWS',
  toleranceNote: 'Tolerancia numérica interna <= 1e-6 relativa en Regiones 1, 2 y 4.',
  verified: true,
};

// ---------------------------------------------------------------------------
// Región 4: Saturación (IAPWS-IF97 Tabla 34)
// ---------------------------------------------------------------------------
const R4_N = [
  0.11670521452767e4,
  -0.72421316703206e6,
  -0.17073846940092e2,
  0.1202082470247e5,
  -0.32325550322333e7,
  0.1491510861353e2,
  -0.48232657361591e4,
  0.40511340542057e6,
  -0.23855557567849,
  0.65017534844798e3,
];

export function saturationPressurePa(TK: number): Result<number> {
  if (!Number.isFinite(TK) || TK < IF97_T_MIN || TK > IF97_TC) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: `Temperatura T=${TK.toFixed(2)} K fuera de la curva de saturación [${IF97_T_MIN}, ${IF97_TC}] K.`,
        physicalExplanation:
          'La coexistencia líquido-vapor del agua solo existe entre el punto triple (0,01 °C) y el punto crítico (373,946 °C).',
        suggestedFix: 'Elige una temperatura dentro del rango de saturación o consulta estado supercrítico.',
      },
    };
  }
  const n = R4_N;
  const theta = TK + n[8] / (TK - n[9]);
  const A = theta * theta + n[0] * theta + n[1];
  const B = n[2] * theta * theta + n[3] * theta + n[4];
  const C = n[5] * theta * theta + n[6] * theta + n[7];
  const disc = B * B - 4 * A * C;
  const pMPa = Math.pow((2 * C) / (-B + Math.sqrt(disc)), 4);
  return { ok: true, value: pMPa * 1e6 };
}

export function saturationTemperatureK(pPa: number): Result<number> {
  if (!Number.isFinite(pPa) || pPa < IF97_P_MIN - 1 || pPa > IF97_PC) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: `Presión p=${(pPa / 1e3).toFixed(3)} kPa fuera de la curva de saturación [0,611 kPa, 22,064 MPa].`,
        physicalExplanation:
          'Por encima de 22,064 MPa el agua es fluido supercrítico y no presenta cambio de fase nítido.',
        suggestedFix: 'Ajusta la presión por debajo de 22,064 MPa y sobre 0,612 kPa.',
      },
    };
  }
  const n = R4_N;
  const pMPa = pPa / 1e6;
  const beta = Math.pow(pMPa, 0.25);
  const E = beta * beta + n[2] * beta + n[5];
  const F = n[0] * beta * beta + n[3] * beta + n[6];
  const G = n[1] * beta * beta + n[4] * beta + n[7];
  const D = (2 * G) / (-F - Math.sqrt(F * F - 4 * E * G));
  const TK = (n[9] + D - Math.sqrt(Math.pow(n[9] + D, 2) - 4 * (n[8] + n[9] * D))) / 2;
  return { ok: true, value: TK };
}

// Frontera Región 2-3 (IAPWS-IF97 Tabla 1)
function boundary23PressurePa(TK: number): number {
  const n1 = 0.34805185628969e3;
  const n2 = -0.11671859879975e1;
  const n3 = 0.10192970039326e-2;
  return (n1 + n2 * TK + n3 * TK * TK) * 1e6;
}

// ---------------------------------------------------------------------------
// Región 1: Líquido comprimido (IAPWS-IF97 Tabla 2)
// ---------------------------------------------------------------------------
const R1_I = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 8, 8, 21, 23, 29,
  30, 31, 32,
];
const R1_J = [
  -2, -1, 0, 1, 2, 3, 4, 5, -9, -7, -1, 0, 1, 3, -3, 0, 1, 3, 17, -4, 0, 6, -5, -2, 10, -8, -11, -6,
  -29, -31, -38, -39, -40, -41,
];
const R1_N = [
  0.14632971213167,
  -0.84548187169114,
  -0.3756360367204e1,
  0.33855169168385e1,
  -0.95791963387872,
  0.15772038513228,
  -0.16616417199501e-1,
  0.81214629983568e-3,
  0.28319080123804e-3,
  -0.60706301565874e-3,
  -0.18990068218419e-1,
  -0.32529748770505e-1,
  -0.21841717175414e-1,
  -0.5283835796993e-4,
  -0.47184321073267e-3,
  -0.30001780793026e-3,
  0.47661393906987e-4,
  -0.44141845330846e-5,
  -0.72694996297594e-15,
  -0.31679644845054e-4,
  -0.28270797985312e-5,
  -0.85205128120103e-9,
  -0.22425281908e-5,
  -0.65171222895601e-6,
  -0.14341729937924e-12,
  -0.40516996860117e-6,
  -0.12734301741641e-8,
  -0.17424871230634e-9,
  -0.68762131295531e-18,
  0.14478307828521e-19,
  0.26335781662795e-22,
  -0.11947622640071e-22,
  0.18228094581404e-23,
  -0.93537087292458e-25,
];

function evalRegion1(pPa: number, TK: number, phase: Phase): ThermoState {
  const pi = pPa / 16.53e6;
  const tau = 1386 / TK;
  const a = 7.1 - pi;
  const b = tau - 1.222;

  let gamma = 0;
  let gammaPi = 0;
  let gammaTau = 0;

  for (let k = 0; k < R1_N.length; k++) {
    const I = R1_I[k];
    const J = R1_J[k];
    const n = R1_N[k];
    const powA = Math.pow(a, I);
    const powB = Math.pow(b, J);
    gamma += n * powA * powB;
    if (I !== 0) {
      gammaPi += -n * I * Math.pow(a, I - 1) * powB;
    }
    if (J !== 0) {
      gammaTau += n * powA * J * Math.pow(b, J - 1);
    }
  }

  const v = ((IF97_R * TK) / pPa) * pi * gammaPi;
  const h = IF97_R * TK * tau * gammaTau;
  const s = IF97_R * (tau * gammaTau - gamma);
  const u = h - pPa * v;

  return {
    id: '',
    pPa,
    TK,
    hJkg: h,
    uJkg: u,
    sJkgK: s,
    vM3kg: v,
    phase,
    quality: phase === 'saturated-liquid' ? 0 : null,
    provenance: PROVENANCE_IF97,
  };
}

// ---------------------------------------------------------------------------
// Región 2: Vapor sobrecalentado (IAPWS-IF97 Tablas 10 y 11)
// ---------------------------------------------------------------------------
const R2_J0 = [0, 1, -5, -4, -3, -2, -1, 2, 3];
const R2_N0 = [
  -0.96927686500217e1,
  0.10086655968018e2,
  -0.5608791128302e-2,
  0.71452738081455e-1,
  -0.40710498223928,
  0.14240819171444e1,
  -0.4383951131945e1,
  -0.28408632460772,
  0.21268463753307e-1,
];

const R2_I = [
  1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 10, 10, 10,
  16, 16, 18, 20, 20, 20, 21, 22, 23, 24, 24, 24,
];
const R2_J = [
  0, 1, 2, 3, 6, 1, 2, 4, 7, 36, 0, 1, 3, 6, 35, 1, 2, 3, 7, 3, 16, 35, 0, 11, 25, 8, 36, 13, 4,
  10, 14, 29, 50, 57, 20, 35, 48, 21, 53, 39, 26, 40, 58,
];
const R2_N = [
  -0.17731742473213e-2,
  -0.17834862292358e-1,
  -0.45996013696365e-1,
  -0.57581259083432e-1,
  -0.5032527872793e-1,
  -0.33032641670203e-4,
  -0.18948987516315e-3,
  -0.39392777243355e-2,
  -0.43797295650573e-1,
  -0.26674547914087e-4,
  0.20481737692309e-7,
  0.43870667284435e-6,
  -0.3227767723857e-4,
  -0.15033924542148e-2,
  -0.40668253562649e-1,
  -0.78847309559367e-9,
  0.12790717852285e-7,
  0.48225372718507e-6,
  0.22922076337661e-5,
  -0.16714766451061e-10,
  -0.21171472321355e-2,
  -0.23895741934104e2,
  -0.5905956432427e-17,
  -0.12621808899101e-5,
  -0.38946842435739e-1,
  0.11256211360459e-10,
  -0.82311340897998e1,
  0.19809712802088e-7,
  0.10406965210174e-18,
  -0.10234747095929e-12,
  -0.10018179379511e-8,
  -0.80882908646985e-10,
  0.10693031879409,
  -0.33662250574171,
  0.89185845355421e-24,
  0.30629316876232e-12,
  -0.42002467698208e-5,
  -0.59056029685639e-25,
  0.37826947613457e-5,
  -0.12768608934681e-14,
  0.73087610595061e-28,
  0.55414715350778e-16,
  -0.9436970724121e-6,
];

function evalRegion2(pPa: number, TK: number, phase: Phase): ThermoState {
  const pi = pPa / 1e6;
  const tau = 540 / TK;
  const b = tau - 0.5;

  let gamma0 = Math.log(pi);
  let gamma0Tau = 0;
  for (let k = 0; k < R2_N0.length; k++) {
    const J0 = R2_J0[k];
    const n0 = R2_N0[k];
    const powT = Math.pow(tau, J0);
    gamma0 += n0 * powT;
    if (J0 !== 0) {
      gamma0Tau += n0 * J0 * Math.pow(tau, J0 - 1);
    }
  }

  let gammaR = 0;
  let gammaRPi = 0;
  let gammaRTau = 0;
  for (let k = 0; k < R2_N.length; k++) {
    const I = R2_I[k];
    const J = R2_J[k];
    const n = R2_N[k];
    const powPi = Math.pow(pi, I);
    const powB = Math.pow(b, J);
    gammaR += n * powPi * powB;
    gammaRPi += n * I * Math.pow(pi, I - 1) * powB;
    if (J !== 0) {
      gammaRTau += n * powPi * J * Math.pow(b, J - 1);
    }
  }

  const v = ((IF97_R * TK) / pPa) * (1 + pi * gammaRPi);
  const h = IF97_R * TK * tau * (gamma0Tau + gammaRTau);
  const s = IF97_R * (tau * (gamma0Tau + gammaRTau) - (gamma0 + gammaR));
  const u = h - pPa * v;

  return {
    id: '',
    pPa,
    TK,
    hJkg: h,
    uJkg: u,
    sJkgK: s,
    vM3kg: v,
    phase,
    quality: phase === 'saturated-vapor' ? 1 : null,
    provenance: PROVENANCE_IF97,
  };
}

function makeDomainError(
  code: DomainError['code'],
  message: string,
  physicalExplanation: string,
  suggestedFix: string
): DomainError {
  return { code, message, physicalExplanation, suggestedFix };
}

function checkWaterFluid(fluid: string): DomainError | null {
  const f = fluid.toLowerCase();
  if (f !== 'water' && f !== 'agua' && f !== 'steam' && f !== 'vapor') {
    return makeDomainError(
      'UNSUPPORTED_FLUID',
      `El proveedor IAPWS-IF97 solo soporta agua/vapor (recibido: "${fluid}").`,
      'No se deben usar tablas del agua para refrigerantes u otros fluidos.',
      'Selecciona "water" o utiliza el modelo energético con entalpías dadas.'
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Proveedor público IAPWS-IF97
// ---------------------------------------------------------------------------
export const iapwsIF97Provider: PropertyProvider = {
  id: 'iapws-if97-ts',
  version: 'R7-97(2012)',
  license: 'Formulación matemática abierta IAPWS (Regiones 1, 2 y 4)',
  supportedFluids: ['water', 'agua', 'steam', 'vapor'],

  saturationP(fluid: string, pPa: number) {
    const fErr = checkWaterFluid(fluid);
    if (fErr) return { ok: false, error: fErr };
    const tSatRes = saturationTemperatureK(pPa);
    if (!tSatRes.ok) return tSatRes;
    const TSatK = tSatRes.value;
    if (TSatK > 623.15) {
      return {
        ok: false,
        error: makeDomainError(
          'OUT_OF_DOMAIN',
          `Presión p=${(pPa / 1e6).toFixed(3)} MPa corresponde a T_sat=${TSatK.toFixed(2)} K (> 623,15 K, Región 3 cercana al punto crítico).`,
          'Esta implementación cubre Regiones 1, 2 y 4 hasta 623,15 K (16,529 MPa en saturación).',
          'Reduce la presión de caldera o saturación por debajo de 16,5 MPa.'
        ),
      };
    }
    const liquid = evalRegion1(pPa, TSatK, 'saturated-liquid');
    const vapor = evalRegion2(pPa, TSatK, 'saturated-vapor');
    return { ok: true, value: { TSatK, liquid, vapor } };
  },

  saturationT(fluid: string, TK: number) {
    const fErr = checkWaterFluid(fluid);
    if (fErr) return { ok: false, error: fErr };
    if (TK > 623.15) {
      return {
        ok: false,
        error: makeDomainError(
          'OUT_OF_DOMAIN',
          `Temperatura T=${TK.toFixed(2)} K supera 623,15 K (Región 3 cercana al punto crítico).`,
          'Las ecuaciones de Regiones 1 y 2 cubren saturación hasta 623,15 K (350 °C).',
          'Utiliza una temperatura entre 0,01 °C y 350 °C en la línea de saturación.'
        ),
      };
    }
    const pSatRes = saturationPressurePa(TK);
    if (!pSatRes.ok) return pSatRes;
    const pSatPa = pSatRes.value;
    const liquid = evalRegion1(pSatPa, TK, 'saturated-liquid');
    const vapor = evalRegion2(pSatPa, TK, 'saturated-vapor');
    return { ok: true, value: { pSatPa, liquid, vapor } };
  },

  solvePX(fluid: string, pPa: number, quality: number): Result<ThermoState> {
    const fErr = checkWaterFluid(fluid);
    if (fErr) return { ok: false, error: fErr };
    if (!Number.isFinite(quality) || quality < 0 || quality > 1) {
      return {
        ok: false,
        error: makeDomainError(
          'INVALID_QUALITY',
          `Calidad x=${quality} fuera de [0, 1].`,
          'La calidad solo existe como fracción másica de vapor dentro de mezcla saturada (0 <= x <= 1).',
          'Ingresa una calidad entre 0 (líquido saturado) y 1 (vapor saturado).'
        ),
      };
    }
    const sat = this.saturationP(fluid, pPa);
    if (!sat.ok) return sat;
    const { TSatK, liquid, vapor } = sat.value;
    const phase: Phase =
      quality === 0
        ? 'saturated-liquid'
        : quality === 1
          ? 'saturated-vapor'
          : 'two-phase';
    return {
      ok: true,
      value: {
        id: '',
        pPa,
        TK: TSatK,
        hJkg: liquid.hJkg + quality * (vapor.hJkg - liquid.hJkg),
        uJkg: liquid.uJkg + quality * (vapor.uJkg - liquid.uJkg),
        sJkgK: liquid.sJkgK + quality * (vapor.sJkgK - liquid.sJkgK),
        vM3kg: liquid.vM3kg + quality * (vapor.vM3kg - liquid.vM3kg),
        phase,
        quality,
        provenance: PROVENANCE_IF97,
      },
    };
  },

  solvePT(fluid: string, pPa: number, TK: number): Result<ThermoState> {
    const fErr = checkWaterFluid(fluid);
    if (fErr) return { ok: false, error: fErr };
    if (!Number.isFinite(pPa) || pPa <= 0 || pPa > IF97_P_MAX) {
      return {
        ok: false,
        error: makeDomainError(
          'INVALID_PRESSURE',
          `Presión p=${pPa} Pa fuera de rango válido (0, 100 MPa].`,
          'La presión absoluta debe ser estrictamente positiva y dentro del rango IF97.',
          'Verifica la unidad (kPa vs MPa) y que sea presión absoluta.'
        ),
      };
    }
    if (!Number.isFinite(TK) || TK < IF97_T_MIN || TK > 1073.15) {
      return {
        ok: false,
        error: makeDomainError(
          'OUT_OF_DOMAIN',
          `Temperatura T=${TK.toFixed(2)} K fuera del dominio IF97 [273,15 K, 1073,15 K].`,
          'El proveedor cubre desde 0 °C hasta 800 °C en Regiones 1 y 2.',
          'Ingresa una temperatura entre 0,01 °C y 800 °C.'
        ),
      };
    }

    // Verificar si está en saturación o en Región 1 vs Región 2
    if (TK <= 623.15) {
      const pSatRes = saturationPressurePa(TK);
      if (!pSatRes.ok) return pSatRes;
      const pSat = pSatRes.value;
      const relDiff = Math.abs(pPa - pSat) / pSat;
      if (relDiff < 1e-5) {
        return {
          ok: false,
          error: makeDomainError(
            'OUT_OF_DOMAIN',
            `Estado sobre la línea de saturación (T=${(TK - 273.15).toFixed(2)} °C, p=${(pPa / 1e3).toFixed(2)} kPa): P y T no son independientes.`,
            'En la región bifásica saturada, p y T están ligadas por p_sat(T) y no fijan por sí solas el estado.',
            'Especifica además la calidad x, entalpía h o entropía s (usa solvePX, solvePH o solvePS).'
          ),
        };
      }
      if (pPa > pSat) {
        return { ok: true, value: evalRegion1(pPa, TK, 'compressed-liquid') };
      }
      return { ok: true, value: evalRegion2(pPa, TK, 'superheated-vapor') };
    }

    // 623.15 K < T <= 863.15 K: verificar frontera B23
    if (TK <= 863.15) {
      const pB23 = boundary23PressurePa(TK);
      if (pPa > pB23) {
        return {
          ok: false,
          error: makeDomainError(
            'OUT_OF_DOMAIN',
            `Estado en Región 3 cercana al punto crítico (T=${(TK - 273.15).toFixed(1)} °C, p=${(pPa / 1e6).toFixed(2)} MPa).`,
            'Esta versión implementa Regiones 1, 2 y 4; las presiones por sobre la frontera B23 entre 350 °C y 590 °C caen en Región 3.',
            'Reduce la presión o aumenta la temperatura para permanecer en Región 2.'
          ),
        };
      }
    }

    return { ok: true, value: evalRegion2(pPa, TK, 'superheated-vapor') };
  },

  solvePS(fluid: string, pPa: number, sJkgK: number): Result<ThermoState> {
    const fErr = checkWaterFluid(fluid);
    if (fErr) return { ok: false, error: fErr };
    if (!Number.isFinite(pPa) || pPa < IF97_P_MIN || pPa > IF97_P_MAX) {
      return {
        ok: false,
        error: makeDomainError(
          'INVALID_PRESSURE',
          `Presión p=${pPa} Pa fuera de rango IF97.`,
          'Presión debe estar entre 611,2 Pa y 100 MPa.',
          'Verifica que la presión sea absoluta y positiva.'
        ),
      };
    }

    // Si p <= p_sat(623.15 K) = 16.529 MPa, comparar contra s_f y s_g
    const pBoundary623 = saturationPressurePa(623.15);
    const p623 = pBoundary623.ok ? pBoundary623.value : 16.529e6;

    if (pPa <= p623) {
      const sat = this.saturationP(fluid, pPa);
      if (!sat.ok) return sat;
      const { TSatK, liquid, vapor } = sat.value;

      if (sJkgK >= liquid.sJkgK - 1e-6 && sJkgK <= vapor.sJkgK + 1e-6) {
        const rawX = (sJkgK - liquid.sJkgK) / (vapor.sJkgK - liquid.sJkgK);
        const x = Math.min(1, Math.max(0, rawX));
        return this.solvePX(fluid, pPa, x);
      }

      if (sJkgK < liquid.sJkgK) {
        // Líquido comprimido: bisección en [273.15, TSatK]
        return bisectTemperature(
          (T) => evalRegion1(pPa, T, 'compressed-liquid'),
          (st) => st.sJkgK - sJkgK,
          IF97_T_MIN,
          TSatK
        );
      }

      // Vapor sobrecalentado: determinar T_max según p
      const TMax = 1073.15;
      return bisectTemperature(
        (T) => evalRegion2(pPa, T, 'superheated-vapor'),
        (st) => st.sJkgK - sJkgK,
        TSatK,
        TMax
      );
    }

    // Presión alta (> 16.529 MPa): probar Región 1 primero y Región 2 si s supera frontera
    const st1Max = evalRegion1(pPa, 623.15, 'compressed-liquid');
    if (sJkgK <= st1Max.sJkgK) {
      return bisectTemperature(
        (T) => evalRegion1(pPa, T, 'compressed-liquid'),
        (st) => st.sJkgK - sJkgK,
        IF97_T_MIN,
        623.15
      );
    }
    const TMinR2 = findMinTRegion2ForP(pPa);
    return bisectTemperature(
      (T) => evalRegion2(pPa, T, 'superheated-vapor'),
      (st) => st.sJkgK - sJkgK,
      TMinR2,
      1073.15
    );
  },

  solvePH(fluid: string, pPa: number, hJkg: number): Result<ThermoState> {
    const fErr = checkWaterFluid(fluid);
    if (fErr) return { ok: false, error: fErr };
    if (!Number.isFinite(pPa) || pPa < IF97_P_MIN || pPa > IF97_P_MAX) {
      return {
        ok: false,
        error: makeDomainError(
          'INVALID_PRESSURE',
          `Presión p=${pPa} Pa fuera de rango IF97.`,
          'Presión debe estar entre 611,2 Pa y 100 MPa.',
          'Verifica que la presión sea absoluta.'
        ),
      };
    }

    const pBoundary623 = saturationPressurePa(623.15);
    const p623 = pBoundary623.ok ? pBoundary623.value : 16.529e6;

    if (pPa <= p623) {
      const sat = this.saturationP(fluid, pPa);
      if (!sat.ok) return sat;
      const { TSatK, liquid, vapor } = sat.value;

      if (hJkg >= liquid.hJkg - 1e-3 && hJkg <= vapor.hJkg + 1e-3) {
        const rawX = (hJkg - liquid.hJkg) / (vapor.hJkg - liquid.hJkg);
        const x = Math.min(1, Math.max(0, rawX));
        return this.solvePX(fluid, pPa, x);
      }

      if (hJkg < liquid.hJkg) {
        return bisectTemperature(
          (T) => evalRegion1(pPa, T, 'compressed-liquid'),
          (st) => st.hJkg - hJkg,
          IF97_T_MIN,
          TSatK
        );
      }

      return bisectTemperature(
        (T) => evalRegion2(pPa, T, 'superheated-vapor'),
        (st) => st.hJkg - hJkg,
        TSatK,
        1073.15
      );
    }

    const st1Max = evalRegion1(pPa, 623.15, 'compressed-liquid');
    if (hJkg <= st1Max.hJkg) {
      return bisectTemperature(
        (T) => evalRegion1(pPa, T, 'compressed-liquid'),
        (st) => st.hJkg - hJkg,
        IF97_T_MIN,
        623.15
      );
    }
    const TMinR2 = findMinTRegion2ForP(pPa);
    return bisectTemperature(
      (T) => evalRegion2(pPa, T, 'superheated-vapor'),
      (st) => st.hJkg - hJkg,
      TMinR2,
      1073.15
    );
  },
};

function findMinTRegion2ForP(pPa: number): number {
  if (pPa <= 16.529e6) {
    const t = saturationTemperatureK(pPa);
    return t.ok ? t.value : 623.15;
  }
  // Resolver T donde boundary23PressurePa(T) = pPa
  let lo = 623.15;
  let hi = 863.15;
  if (pPa > boundary23PressurePa(hi)) return 863.15;
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi);
    if (boundary23PressurePa(mid) < pPa) lo = mid;
    else hi = mid;
  }
  return hi;
}

function bisectTemperature(
  evalFn: (T: number) => ThermoState,
  residualFn: (st: ThermoState) => number,
  tLow: number,
  tHigh: number
): Result<ThermoState> {
  let lo = tLow;
  let hi = tHigh;
  let fLo = residualFn(evalFn(lo));
  let fHi = residualFn(evalFn(hi));

  if (Math.abs(fLo) < 1e-6) return { ok: true, value: evalFn(lo) };
  if (Math.abs(fHi) < 1e-6) return { ok: true, value: evalFn(hi) };

  if (fLo * fHi > 0) {
    return {
      ok: false,
      error: makeDomainError(
        'OUT_OF_DOMAIN',
        'El par de propiedades excede los límites de Región 1 o Región 2 (IF97).',
        'La entalpía o entropía entregada cae fuera de [273,15 K, 1073,15 K] o en Región 3.',
        'Ajusta presión, entalpía o entropía dentro de la región cubierta.'
      ),
    };
  }

  for (let i = 0; i < 65; i++) {
    const mid = 0.5 * (lo + hi);
    const stMid = evalFn(mid);
    const fMid = residualFn(stMid);
    if (Math.abs(fMid) < 1e-8 || hi - lo < 1e-8) {
      return { ok: true, value: stMid };
    }
    if (fLo * fMid <= 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return { ok: true, value: evalFn(0.5 * (lo + hi)) };
}

/**
 * Genera la campana de saturación REAL desde IAPWS-IF97 (sin curvas Bezier falsas).
 */
export interface SaturationDomePoint {
  TC: number;
  TK: number;
  pKPa: number;
  sfKJkgK: number;
  sgKJkgK: number;
  hfKJkg: number;
  hgKJkg: number;
  vfM3kg: number;
  vgM3kg: number;
}

export function getRealSaturationDome(steps = 44): SaturationDomePoint[] {
  const points: SaturationDomePoint[] = [];
  const tStart = 275.15;
  const tEnd = 623.15;
  for (let i = 0; i <= steps; i++) {
    const TK = tStart + ((tEnd - tStart) * i) / steps;
    const sat = iapwsIF97Provider.saturationT('water', TK);
    if (sat.ok) {
      points.push({
        TC: TK - 273.15,
        TK,
        pKPa: sat.value.pSatPa / 1e3,
        sfKJkgK: sat.value.liquid.sJkgK / 1e3,
        sgKJkgK: sat.value.vapor.sJkgK / 1e3,
        hfKJkg: sat.value.liquid.hJkg / 1e3,
        hgKJkg: sat.value.vapor.hJkg / 1e3,
        vfM3kg: sat.value.liquid.vM3kg,
        vgM3kg: sat.value.vapor.vM3kg,
      });
    }
  }
  return points;
}
