/**
 * Conversor de unidades SI, escalas de temperatura/presión y formato numérico.
 * Internamente el motor trabaja en SI base (Pa, K, J/kg, J/(kg·K), kg/s, m³/kg, W).
 */

export const KELVIN_OFFSET = 273.15;
export const STANDARD_ATM_PA = 101325;
export const GRAVITY_STD = 9.80665;
export const BOLTZMANN_K = 1.380649e-23;

export type PressureUnit = 'Pa' | 'kPa' | 'MPa' | 'bar' | 'atm';
export type TemperatureUnit = 'K' | 'degC';
export type EnergyUnit = 'J' | 'kJ' | 'MJ' | 'kWh';
export type PowerUnit = 'W' | 'kW' | 'MW' | 'HP';
export type MassFlowUnit = 'kg/s' | 'kg/h' | 'kg/min';
export type SpecificEnergyUnit = 'J/kg' | 'kJ/kg';
export type SpecificEntropyUnit = 'J/(kg*K)' | 'kJ/(kg*K)';
export type SpecificVolumeUnit = 'm3/kg' | 'L/kg';

export function cToK(celsius: number): number {
  return celsius + KELVIN_OFFSET;
}

export function kToC(kelvin: number): number {
  return kelvin - KELVIN_OFFSET;
}

export function deltaCtoDeltaK(deltaC: number): number {
  return deltaC;
}

export function gageToAbsolutePa(gagePa: number, atmPa = STANDARD_ATM_PA): number {
  return gagePa + atmPa;
}

export function toPa(value: number, unit: PressureUnit): number {
  switch (unit) {
    case 'Pa':
      return value;
    case 'kPa':
      return value * 1e3;
    case 'MPa':
      return value * 1e6;
    case 'bar':
      return value * 1e5;
    case 'atm':
      return value * STANDARD_ATM_PA;
  }
}

export function fromPa(pa: number, unit: PressureUnit): number {
  switch (unit) {
    case 'Pa':
      return pa;
    case 'kPa':
      return pa / 1e3;
    case 'MPa':
      return pa / 1e6;
    case 'bar':
      return pa / 1e5;
    case 'atm':
      return pa / STANDARD_ATM_PA;
  }
}

export function toKelvin(value: number, unit: TemperatureUnit): number {
  return unit === 'K' ? value : cToK(value);
}

export function fromKelvin(kelvin: number, unit: TemperatureUnit): number {
  return unit === 'K' ? kelvin : kToC(kelvin);
}

export function toWatts(value: number, unit: PowerUnit): number {
  switch (unit) {
    case 'W':
      return value;
    case 'kW':
      return value * 1e3;
    case 'MW':
      return value * 1e6;
    case 'HP':
      return value * 745.699872;
  }
}

export function fromWatts(watts: number, unit: PowerUnit): number {
  switch (unit) {
    case 'W':
      return watts;
    case 'kW':
      return watts / 1e3;
    case 'MW':
      return watts / 1e6;
    case 'HP':
      return watts / 745.699872;
  }
}

export function toJoules(value: number, unit: EnergyUnit): number {
  switch (unit) {
    case 'J':
      return value;
    case 'kJ':
      return value * 1e3;
    case 'MJ':
      return value * 1e6;
    case 'kWh':
      return value * 3.6e6;
  }
}

export function fromJoules(joules: number, unit: EnergyUnit): number {
  switch (unit) {
    case 'J':
      return joules;
    case 'kJ':
      return joules / 1e3;
    case 'MJ':
      return joules / 1e6;
    case 'kWh':
      return joules / 3.6e6;
  }
}

export function toKgPerS(value: number, unit: MassFlowUnit): number {
  switch (unit) {
    case 'kg/s':
      return value;
    case 'kg/min':
      return value / 60;
    case 'kg/h':
      return value / 3600;
  }
}

export function fromKgPerS(kgs: number, unit: MassFlowUnit): number {
  switch (unit) {
    case 'kg/s':
      return kgs;
    case 'kg/min':
      return kgs * 60;
    case 'kg/h':
      return kgs * 3600;
  }
}

export function toJPerKg(value: number, unit: SpecificEnergyUnit): number {
  return unit === 'J/kg' ? value : value * 1e3;
}

export function fromJPerKg(jkg: number, unit: SpecificEnergyUnit): number {
  return unit === 'J/kg' ? jkg : jkg / 1e3;
}

export function toJPerKgK(value: number, unit: SpecificEntropyUnit): number {
  return unit === 'J/(kg*K)' ? value : value * 1e3;
}

export function fromJPerKgK(jkgk: number, unit: SpecificEntropyUnit): number {
  return unit === 'J/(kg*K)' ? jkgk : jkgk / 1e3;
}

/**
 * Formato chileno/SI: coma decimal para presentación humana, sin afectar cálculo interno.
 */
export function formatCL(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return 'N/D';
  const fixed = value.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined ? `${formattedInt},${decPart}` : formattedInt;
}

export interface DimensionalCheckResult {
  valid: boolean;
  resultingUnit: string;
  explanation: string;
}

/**
 * Verificador dimensional pedagógico para fórmulas frecuentes de MEC110.
 */
export function checkFormulaDimensions(
  formulaId: 'Q=mcDT' | 'w=vDp' | 'PV=mRT' | 'Wdot=mdot*w' | 'Carnot=1-TL/TH',
  selectedUnits: Record<string, string>
): DimensionalCheckResult {
  if (formulaId === 'Q=mcDT') {
    const m = selectedUnits.m ?? 'kg';
    const c = selectedUnits.c ?? 'kJ/(kg*K)';
    const dT = selectedUnits.dT ?? 'K';
    const valid = m === 'kg' && c === 'kJ/(kg*K)' && (dT === 'K' || dT === 'Delta_degC');
    return {
      valid,
      resultingUnit: valid ? 'kJ' : 'Inconsistente',
      explanation: valid
        ? 'kg × kJ/(kg·K) × K = kJ (una diferencia ΔT en °C equivale numéricamente a K).'
        : `Revisa las unidades elegidas (${m} × ${c} × ${dT}). Para usar °C absoluto en ΔT, recuerda que ΔT(K)=ΔT(°C).`,
    };
  }
  if (formulaId === 'w=vDp') {
    const v = selectedUnits.v ?? 'm3/kg';
    const dp = selectedUnits.dp ?? 'kPa';
    const valid = v === 'm3/kg' && dp === 'kPa';
    return {
      valid,
      resultingUnit: valid ? 'kJ/kg' : dp === 'Pa' ? 'J/kg' : 'Requiere conversión',
      explanation: valid
        ? '1 kPa·m³ = 1 kJ, por lo tanto (m³/kg) × kPa = kJ/kg directamente.'
        : dp === 'MPa'
          ? 'MPa × m³/kg produce MJ/kg (= 1000 kJ/kg). Convierte MPa a kPa multiplicando por 1000.'
          : '(m³/kg) × Pa produce J/kg; divide por 1000 para obtener kJ/kg.',
    };
  }
  if (formulaId === 'PV=mRT') {
    const p = selectedUnits.p ?? 'kPa_abs';
    const V = selectedUnits.V ?? 'm3';
    const T = selectedUnits.T ?? 'K';
    const valid = p === 'kPa_abs' && V === 'm3' && T === 'K';
    return {
      valid,
      resultingUnit: valid ? 'kg (con R en kJ/(kg*K))' : 'Inválido físicamente',
      explanation: valid
        ? 'kPa·m³ = kJ; al dividir por [kJ/(kg·K) × K] queda kg.'
        : p === 'kPa_man'
          ? 'Error típico: la ley de gas ideal requiere presión ABSOLUTA, no manométrica.'
          : T === 'degC'
            ? 'Error crítico: pV=mRT exige temperatura absoluta en Kelvin (K).'
            : 'Verifica consistencia entre presión, volumen y R.',
    };
  }
  if (formulaId === 'Wdot=mdot*w') {
    const mdot = selectedUnits.mdot ?? 'kg/s';
    const w = selectedUnits.w ?? 'kJ/kg';
    const valid = mdot === 'kg/s' && w === 'kJ/kg';
    return {
      valid,
      resultingUnit: valid ? 'kW' : mdot === 'kg/h' ? 'kJ/h (dividir por 3600 para kW)' : 'Inconsistente',
      explanation: valid
        ? '(kg/s) × (kJ/kg) = kJ/s = kW.'
        : 'Si el caudal está en kg/h, divide por 3600 para obtener kg/s y potencia en kW.',
    };
  }
  const TL = selectedUnits.TL ?? 'K';
  const TH = selectedUnits.TH ?? 'K';
  const valid = TL === 'K' && TH === 'K';
  return {
    valid,
    resultingUnit: valid ? 'adimensional (0..1)' : 'Error físico',
    explanation: valid
      ? 'K / K es adimensional; el límite de Carnot es válido solo con temperaturas absolutas.'
      : 'Nunca uses °C en el cociente T_L / T_H de Carnot: 1 - 20/100 ≠ 1 - 293,15/373,15.',
  };
}
