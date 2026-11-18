/**
 * Módulo aislado de conversión SI, constantes físicas y formato numérico
 * para Transferencia de Calor (FluidoTermo Lab — Parte 4).
 */

export const KELVIN_OFFSET = 273.15;

/** Constante física exacta de Stefan-Boltzmann (CODATA 2018 / SI redefinido 2019) [W/(m²·K⁴)] */
export const SIGMA_STEFAN_BOLTZMANN = 5.670374419e-8;

/** Valor redondeado habitual en textos introductorios (solo para comparación transparente) */
export const SIGMA_TEXTBOOK_ROUNDED = 5.67e-8;

export function celsiusToKelvin(tempC: number): number {
  return tempC + KELVIN_OFFSET;
}

export function kelvinToCelsius(tempK: number): number {
  return tempK - KELVIN_OFFSET;
}

export function mmToMeters(mm: number): number {
  return mm / 1000;
}

export function cmToMeters(cm: number): number {
  return cm / 100;
}

export function kJkgKToJkgK(kJkgK: number): number {
  return kJkgK * 1000;
}

export function wattsToKilowatts(watts: number): number {
  return watts / 1000;
}

export function kWhToMJ(kWh: number): number {
  return kWh * 3.6;
}

/**
 * Formato numérico chileno/SI: coma decimal y separador de miles con punto.
 */
export function formatHT(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/D';
  const fixed = value.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;
}

/**
 * Formato LaTeX seguro con punto o coma visual y exponentes legibles.
 */
export function formatLatexNum(value: number, decimals = 3): string {
  if (!Number.isFinite(value)) return '\\text{N/D}';
  if (value !== 0 && (Math.abs(value) < 1e-3 || Math.abs(value) >= 1e6)) {
    const expStr = value.toExponential(decimals);
    const [mantissa, exp] = expStr.split('e');
    const cleanExp = parseInt(exp, 10);
    return `${mantissa.replace('.', '{,}')}\\times 10^{${cleanExp}}`;
  }
  return value.toFixed(decimals).replace('.', '{,}');
}
