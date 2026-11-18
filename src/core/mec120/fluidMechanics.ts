/**
 * Módulo preservado MEC120 · Mecánica de Fluidos.
 * Nota de auditoría: El repositorio inicial no contenía código fuente previo de MEC120;
 * este módulo provee la estructura, rutas, cálculos reales y pruebas de regresión
 * para garantizar la convivencia no destructiva entre Parte 1 (MEC120) y Parte 2 (MEC110).
 */

import type { Result } from '../contracts';

export interface PipeFlowInput {
  diameterM: number;
  lengthM: number;
  velocityMs: number;
  roughnessMm: number;
  densityKgM3: number;
  viscosityPaS: number;
}

export interface PipeFlowOutput {
  reynolds: number;
  regime: 'Laminar' | 'Transición' | 'Turbulento';
  frictionFactor: number;
  headLossM: number;
  pressureDropKPa: number;
  flowRateM3S: number;
}

export function solvePipeFlowDarcy(input: PipeFlowInput): Result<PipeFlowOutput> {
  if (
    input.diameterM <= 0 ||
    input.lengthM < 0 ||
    input.velocityMs < 0 ||
    input.densityKgM3 <= 0 ||
    input.viscosityPaS <= 0
  ) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Parámetros hidráulicos inválidos (diámetro, densidad y viscosidad deben ser > 0).',
        physicalExplanation: 'El número de Reynolds y Darcy-Weisbach requieren propiedades físicas positivas.',
        suggestedFix: 'Verifica que D > 0, ρ > 0 y μ > 0.',
      },
    };
  }

  const area = (Math.PI * input.diameterM * input.diameterM) / 4;
  const flowRateM3S = area * input.velocityMs;
  const reynolds =
    (input.densityKgM3 * input.velocityMs * input.diameterM) / input.viscosityPaS;

  if (input.velocityMs === 0) {
    return {
      ok: true,
      value: {
        reynolds: 0,
        regime: 'Laminar',
        frictionFactor: 0,
        headLossM: 0,
        pressureDropKPa: 0,
        flowRateM3S: 0,
      },
    };
  }

  let regime: PipeFlowOutput['regime'] = 'Turbulento';
  let frictionFactor: number;

  if (reynolds < 2300) {
    regime = 'Laminar';
    frictionFactor = 64 / reynolds;
  } else {
    regime = reynolds <= 4000 ? 'Transición' : 'Turbulento';
    // Swamee-Jain explícito (válido para tubería circular llena)
    const relRough = (input.roughnessMm / 1000) / input.diameterM;
    const term = relRough / 3.7 + 5.74 / Math.pow(reynolds, 0.9);
    frictionFactor = 0.25 / Math.pow(Math.log10(term), 2);
  }

  const g = 9.80665;
  const headLossM =
    frictionFactor * (input.lengthM / input.diameterM) * ((input.velocityMs * input.velocityMs) / (2 * g));
  const pressureDropKPa = (input.densityKgM3 * g * headLossM) / 1000;

  return {
    ok: true,
    value: {
      reynolds,
      regime,
      frictionFactor,
      headLossM,
      pressureDropKPa,
      flowRateM3S,
    },
  };
}

export interface HydrostaticInput {
  densityKgM3: number;
  depthM: number;
  pSurfaceKPa: number;
}

export function solveHydrostaticPressure(input: HydrostaticInput): Result<{ pAbsKPa: number; pGageKPa: number }> {
  if (input.densityKgM3 <= 0 || input.depthM < 0) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: 'Densidad debe ser > 0 y profundidad >= 0.',
        physicalExplanation: 'La presión hidrostática crece linealmente con profundidad h >= 0.',
        suggestedFix: 'Ajusta h >= 0 y ρ > 0.',
      },
    };
  }
  const pGageKPa = (input.densityKgM3 * 9.80665 * input.depthM) / 1000;
  return {
    ok: true,
    value: {
      pGageKPa,
      pAbsKPa: input.pSurfaceKPa + pGageKPa,
    },
  };
}
