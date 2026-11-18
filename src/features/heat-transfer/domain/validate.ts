/**
 * Validación de dominio físico y dimensional para entradas de Transferencia de Calor.
 */

import type { DomainIssue, Parameter } from './models';
import { celsiusToKelvin } from './units';

export function validateNumericDomains(
  inputs: Record<string, Parameter>,
  temperatureKeys: string[]
): DomainIssue | null {
  for (const param of Object.values(inputs)) {
    if (!Number.isFinite(param.value)) {
      return {
        code: 'NON_FINITE_INPUT',
        field: param.id,
        message: `El parámetro "${param.label}" debe ser un número finito.`,
        physicalExplanation: 'Una magnitud física no puede ser NaN ni infinita.',
        suggestedFix: 'Ingresa un valor numérico válido o restaura los datos del libro.',
      };
    }
    const { min, max, minExclusive, maxExclusive } = param.domain;
    if (min !== undefined && (minExclusive ? param.value <= min : param.value < min)) {
      return {
        code: 'OUT_OF_DOMAIN_MIN',
        field: param.id,
        message: `"${param.label}" (${param.value} ${param.unit}) debe ser ${minExclusive ? '>' : '>='} ${min} ${param.unit}.`,
        physicalExplanation: 'Fuera del rango físico o geométrico admisible del modelo.',
        suggestedFix: `Ajusta ${param.label} dentro del dominio válido.`,
      };
    }
    if (max !== undefined && (maxExclusive ? param.value >= max : param.value > max)) {
      return {
        code: 'OUT_OF_DOMAIN_MAX',
        field: param.id,
        message: `"${param.label}" (${param.value} ${param.unit}) debe ser ${maxExclusive ? '<' : '<='} ${max} ${param.unit}.`,
        physicalExplanation:
          param.id === 'targetPct'
            ? 'Alcanzar el 100 % exacto en decaimiento exponencial requiere tiempo matemático infinito (ln 0).'
            : 'Supera el límite máximo admisible del modelo.',
        suggestedFix:
          param.id === 'targetPct'
            ? 'Elige un objetivo estrictamente menor a 100 % (ej. 99 % o 99,9 %).'
            : `Reduce ${param.label} dentro del rango admisible.`,
      };
    }
  }

  for (const tKey of temperatureKeys) {
    const tParam = inputs[tKey];
    if (tParam && celsiusToKelvin(tParam.value) <= 0) {
      return {
        code: 'ABSOLUTE_ZERO_VIOLATION',
        field: tKey,
        message: `Temperatura "${tParam.label}" (${tParam.value} °C) viola el cero absoluto (0 K = -273,15 °C).`,
        physicalExplanation: 'Ninguna temperatura termodinámica física puede ser <= 0 K.',
        suggestedFix: 'Ingresa una temperatura mayor a -273,15 °C.',
      };
    }
  }

  return null;
}

/**
 * Diferencia media logarítmica (LMTD) numéricamente estable cuando dT1 ≈ dT2.
 */
export function stableLogMeanDeltaT(dT1: number, dT2: number): number {
  const avg = 0.5 * (dT1 + dT2);
  if (Math.abs(dT1 - dT2) <= 1e-7 * Math.max(1, Math.abs(avg))) {
    return avg;
  }
  return (dT2 - dT1) / Math.log(dT2 / dT1);
}
