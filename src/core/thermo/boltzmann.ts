/**
 * Motor puro de Segunda Ley estadística (MEC110_6):
 * - Combinatoria exacta sin desbordamiento mediante logGamma: C(N, n)
 * - Distribución binomial idealizada P(n) = C(N, n) / 2^N
 * - Entropía estadística de Boltzmann S = k_B ln(Ω)
 * - Equilibrio térmico entre dos sistemas E + E' = E_total
 * - Generador pseudoaleatorio con semilla reproducible (Mulberry32)
 * - Pizarra de 10 pasos reactivos
 */

import type { Result, SolvedStep, SolverMetadata } from '../contracts';
import { BOLTZMANN_K, formatCL } from './units';

/**
 * Aproximación de Lanczos de ln(Gamma(z)) con precisión ~1e-15 para reales positivos.
 */
export function logGamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  const zz = z - 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) {
    x += p[i] / (zz + i);
  }
  const t = zz + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

export function logBinomialCoeff(N: number, n: number): number {
  if (n < 0 || n > N) return -Infinity;
  if (n === 0 || n === N) return 0;
  return logGamma(N + 1) - logGamma(n + 1) - logGamma(N - n + 1);
}

export function exactBinomialCoeff(N: number, n: number): number {
  if (n < 0 || n > N) return 0;
  if (N <= 50) {
    // Recurrencia multiplicativa exacta para enteros seguros JS hasta N=50
    let res = 1;
    const k = Math.min(n, N - n);
    for (let i = 1; i <= k; i++) {
      res = (res * (N - k + i)) / i;
    }
    return Math.round(res);
  }
  return Math.exp(logBinomialCoeff(N, n));
}

export interface CombinatorialRow {
  nLeft: number;
  nRight: number;
  logOmega: number;
  omegaApprox: number; // Infinity si supera Number.MAX_VALUE (~1.79e308), siempre usar logOmega para N grande
  probability: number;
  entropyBoltzmannJK: number;
}

export interface BoltzmannBoxOutput {
  N: number;
  nSelected: number;
  totalMicrostatesLog2: number;
  totalMicrostatesApprox: number;
  expectedN: number;
  stdDevN: number;
  relativeFluctuation: number; // 1 / (2 * sqrt(N))
  rows: CombinatorialRow[];
  selectedRow: CombinatorialRow;
  centerRow: CombinatorialRow;
  steps: SolvedStep[];
  audit: SolverMetadata;
}

export function solveBoltzmannBox(N: number, nSelected?: number): Result<BoltzmannBoxOutput> {
  if (!Number.isInteger(N) || N < 2 || N > 1000) {
    return {
      ok: false,
      error: {
        code: 'OUT_OF_DOMAIN',
        message: `Número de partículas N=${N} fuera de rango entero [2, 1000].`,
        physicalExplanation: 'El laboratorio combinatorio requiere al menos 2 moléculas distinguibles.',
        suggestedFix: 'Selecciona N = 2, 4, 40, 200 o un entero entre 2 y 1000.',
      },
    };
  }

  const targetN = nSelected !== undefined ? Math.min(N, Math.max(0, Math.round(nSelected))) : Math.floor(N / 2);
  const log2N = N * Math.LN2;
  const rows: CombinatorialRow[] = [];

  for (let n = 0; n <= N; n++) {
    const exactC = N <= 50 ? exactBinomialCoeff(N, n) : null;
    const logOmega = exactC !== null ? Math.log(exactC) : logBinomialCoeff(N, n);
    const probability = exactC !== null ? exactC / Math.pow(2, N) : Math.exp(logOmega - log2N);
    const omegaApprox = exactC !== null ? exactC : logOmega < 709 ? Math.round(Math.exp(logOmega)) : Infinity;
    rows.push({
      nLeft: n,
      nRight: N - n,
      logOmega,
      omegaApprox,
      probability,
      entropyBoltzmannJK: BOLTZMANN_K * logOmega,
    });
  }

  const centerIdx = Math.floor(N / 2);
  const selectedRow = rows[targetN];
  const centerRow = rows[centerIdx];
  const expectedN = N / 2;
  const stdDevN = Math.sqrt(N) / 2;
  const relativeFluctuation = 1 / (2 * Math.sqrt(N));

  const formatOmega = (row: CombinatorialRow) =>
    Number.isFinite(row.omegaApprox)
      ? row.omegaApprox <= 1e12
        ? Math.round(row.omegaApprox).toLocaleString('es-CL')
        : row.omegaApprox.toExponential(3)
      : `exp(${formatCL(row.logOmega, 2)})`;

  const steps: SolvedStep[] = [
    {
      id: 'boltz-1',
      stepNumber: 1,
      title: 'Definir el sistema y el parámetro N',
      purpose: 'Establecer el número de partículas distinguibles y el macroestado n (mitad izquierda).',
      equationLatex: String.raw`N = ${N}, \quad n_{\text{izq}} = ${targetN}, \quad n_{\text{der}} = ${N - targetN}`,
      substitutions: [
        { symbol: 'N', value: `${N}`, unit: 'moléculas' },
        { symbol: 'n', value: `${targetN}`, unit: 'izq' },
      ],
      resultValue: `${targetN} / ${N - targetN}`,
      unit: 'partición',
      assumptions: ['Partículas distinguibles e independientes', 'Mitades de igual volumen (p = 0,5)'],
      interpretation: 'Un macroestado se caracteriza por cuántas moléculas hay en cada mitad, sin importar cuáles.',
    },
    {
      id: 'boltz-2',
      stepNumber: 2,
      title: 'Contar microestados accesibles totales',
      purpose: 'Cada partícula tiene 2 elecciones equiprobables (L o R).',
      equationLatex: String.raw`\Omega_{\text{total}} = 2^N`,
      substitutions: [{ symbol: 'N', value: `${N}`, unit: '1' }],
      resultValue: N <= 50 ? Math.pow(2, N).toLocaleString('es-CL') : `2^{${N}} ≈ ${Math.exp(log2N).toExponential(3)}`,
      unit: 'microestados',
      assumptions: ['Equiprobabilidad a priori'],
      interpretation: 'El número total de configuraciones crece exponencialmente con N.',
    },
    {
      id: 'boltz-3',
      stepNumber: 3,
      title: 'Multiplicidad combinatoria C(N, n)',
      purpose: 'Evaluar cuántas asignaciones microscópicas producen exactamente n moléculas a la izquierda.',
      equationLatex: String.raw`\Omega(n) = \binom{N}{n} = \frac{N!}{n!(N-n)!}`,
      substitutions: [
        { symbol: 'N', value: `${N}`, unit: '1' },
        { symbol: 'n', value: `${targetN}`, unit: '1' },
      ],
      resultValue: formatOmega(selectedRow),
      unit: 'configuraciones',
      assumptions: ['Evaluación numérica estable vía ln Γ(N+1)'],
      interpretation: 'Para N grande los factoriales desbordan; logGamma permite cálculo exacto sin overflow.',
    },
    {
      id: 'boltz-4',
      stepNumber: 4,
      title: 'Logaritmo de la multiplicidad',
      purpose: 'Preparar el término ln Ω para la fórmula de Boltzmann.',
      equationLatex: String.raw`\ln \Omega(n) = \ln\Gamma(N+1) - \ln\Gamma(n+1) - \ln\Gamma(N-n+1)`,
      substitutions: [{ symbol: 'n', value: `${targetN}`, unit: '1' }],
      resultValue: formatCL(selectedRow.logOmega, 4),
      unit: 'adim.',
      assumptions: ['Escala logarítmica natural'],
      interpretation: 'El logaritmo transforma productos gigantes en sumas manejables.',
    },
    {
      id: 'boltz-5',
      stepNumber: 5,
      title: 'Entropía estadística de Boltzmann',
      purpose: 'Calcular S = k_B ln Ω para el macroestado elegido.',
      equationLatex: String.raw`S = k_B \ln \Omega`,
      substitutions: [
        { symbol: 'k_B', value: '1,380649e-23', unit: 'J/K' },
        { symbol: String.raw`\ln \Omega`, value: formatCL(selectedRow.logOmega, 4), unit: '1' },
      ],
      resultValue: selectedRow.entropyBoltzmannJK.toExponential(3),
      unit: 'J/K',
      assumptions: ['Escala microscópica de N moléculas (no 1 mol = 6,022×10²³)'],
      interpretation: 'Más microestados accesibles implican mayor entropía estadística.',
    },
    {
      id: 'boltz-6',
      stepNumber: 6,
      title: 'Normalizar probabilidad del macroestado',
      purpose: 'Dividir multiplicidad del macroestado por 2^N.',
      equationLatex: String.raw`P(n) = \frac{\binom{N}{n}}{2^N}`,
      substitutions: [{ symbol: 'n', value: `${targetN}`, unit: '1' }],
      resultValue: `${formatCL(selectedRow.probability * 100, 4)} %`,
      unit: '%',
      assumptions: ['Cálculo vía exp(ln Ω − N ln 2)'],
      interpretation:
        targetN === 0 || targetN === N
          ? 'Configuración extrema (todas a un lado): altamente improbable cuando N crece.'
          : 'Probabilidad puntual para esa partición específica.',
    },
    {
      id: 'boltz-7',
      stepNumber: 7,
      title: 'Comparar con la distribución de equilibrio (50/50)',
      purpose: 'Contrastar la partición seleccionada con n = N/2.',
      equationLatex: String.raw`\frac{P(N/2)}{P(n)} = \exp\big(\ln\Omega(N/2) - \ln\Omega(n)\big)`,
      substitutions: [{ symbol: 'P(N/2)', value: `${formatCL(centerRow.probability * 100, 3)}`, unit: '%' }],
      resultValue: `${formatCL(centerRow.probability / Math.max(1e-300, selectedRow.probability), 2)} ×`,
      unit: 'razón',
      assumptions: ['Equilibrio corresponde al máximo de Ω(n)'],
      interpretation: 'Cuanto más cerca de N/2, mayor es el número de microestados equivalentes.',
    },
    {
      id: 'boltz-8',
      stepNumber: 8,
      title: 'Media y desviación típica binomial',
      purpose: 'Cuantificar dónde se concentra la distribución al aumentar N.',
      equationLatex: String.raw`\mu = \frac{N}{2}, \qquad \sigma = \frac{\sqrt{N}}{2}`,
      substitutions: [{ symbol: 'N', value: `${N}`, unit: '1' }],
      resultValue: `${formatCL(expectedN, 1)} ± ${formatCL(stdDevN, 2)}`,
      unit: 'moléculas',
      assumptions: ['Distribución binomial simétrica p = 0,5'],
      interpretation: 'La dispersión absoluta crece como √N, pero la relativa disminuye.',
    },
    {
      id: 'boltz-9',
      stepNumber: 9,
      title: 'Concentración relativa alrededor del equilibrio',
      purpose: 'Evaluar la amplitud de fluctuaciones relativas σ / N.',
      equationLatex: String.raw`\frac{\sigma}{N} = \frac{1}{2\sqrt{N}}`,
      substitutions: [{ symbol: 'N', value: `${N}`, unit: '1' }],
      resultValue: `${formatCL(relativeFluctuation * 100, 3)} %`,
      unit: '% de N',
      assumptions: ['Límite termodinámico al crecer N'],
      interpretation:
        N >= 200
          ? 'Con N=200 las fluctuaciones relativas ya son pequeñas (~3,5 %). En 1 mol (N~10²³) son indetectables (~10⁻¹²).'
          : 'Con N pequeño aún observas fluctuaciones frecuentes respecto a la mitad.',
    },
    {
      id: 'boltz-10',
      stepNumber: 10,
      title: 'Puente conceptual hacia la Segunda Ley',
      purpose: 'Explicar la flecha del tiempo sin afirmar imposibilidad matemática absoluta.',
      equationLatex: String.raw`P(\text{todas a la izq.}) = 2^{-N}`,
      substitutions: [{ symbol: '2^{-N}', value: Math.pow(2, -N).toExponential(2), unit: '1' }],
      resultValue: Math.pow(2, -N).toExponential(2),
      unit: 'prob.',
      assumptions: ['Modelo estadístico discreto (no dinámica molecular Hamiltoniana)'],
      interpretation:
        'La irreversibilidad macroscópica emerge porque el estado de equilibrio agrupa abrumadoramente más microestados, no porque el retorno sea matemáticamente nulo en N pequeño.',
    },
  ];

  return {
    ok: true,
    value: {
      N,
      nSelected: targetN,
      totalMicrostatesLog2: N,
      totalMicrostatesApprox: Math.pow(2, N),
      expectedN,
      stdDevN,
      relativeFluctuation,
      rows,
      selectedRow,
      centerRow,
      steps,
      audit: {
        modelId: 'boltzmann-binomial-box',
        fluid: 'Gas idealizado discreto (modelo estadístico)',
        provider: 'Combinatoria exacta / logGamma',
        providerVersion: '1.0',
        providerLicense: 'Modelo estadístico de Boltzmann',
        hypotheses: [
          'Distribución binomial simétrica (p = 0,5)',
          'Partículas sin colisiones inelásticas ni potencial de interacción',
          'Las trayectorias 2D del lienzo son ilustrativas; la curva teórica usa combinatoria exacta',
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

/**
 * Equilibrio térmico de dos sistemas en contacto con energía total E_tot = 13 (MEC110_6 §8.4).
 * Usa un modelo sintético tipo sólido de Einstein (osciladores armónicos) como referencia pedagógica
 * claramente rotulada mientras la tabla literal de la diapositiva 24 no esté transcrita como archivo.
 */
export interface ThermalPartitionRow {
  EA: number;
  EB: number;
  omegaA: number;
  omegaB: number;
  omegaTotal: number;
  lnOmegaTotal: number;
  probability: number;
}

export function solveTwoSystemEquilibrium(
  totalEnergy = 13,
  oscillatorsA = 4,
  oscillatorsB = 6
): { rows: ThermalPartitionRow[]; maxRow: ThermalPartitionRow; provenanceNote: string } {
  const countMicrostatesEinstein = (q: number, Nosc: number) =>
    exactBinomialCoeff(q + Nosc - 1, q);

  const rawRows: Omit<ThermalPartitionRow, 'probability'>[] = [];
  let sumOmega = 0;

  for (let EA = 0; EA <= totalEnergy; EA++) {
    const EB = totalEnergy - EA;
    const omegaA = countMicrostatesEinstein(EA, oscillatorsA);
    const omegaB = countMicrostatesEinstein(EB, oscillatorsB);
    const omegaTotal = omegaA * omegaB;
    sumOmega += omegaTotal;
    rawRows.push({
      EA,
      EB,
      omegaA,
      omegaB,
      omegaTotal,
      lnOmegaTotal: Math.log(Math.max(1, omegaTotal)),
    });
  }

  const rows: ThermalPartitionRow[] = rawRows.map((r) => ({
    ...r,
    probability: r.omegaTotal / sumOmega,
  }));

  const maxRow = rows.reduce((best, cur) =>
    cur.omegaTotal > best.omegaTotal ? cur : best
  );

  return {
    rows,
    maxRow,
    provenanceNote:
      'Modelo sintético original de osciladores de Einstein (N_A=4, N_B=6, E+E\'=13) — la tabla literal de MEC110_6 diapositiva 24 requiere transcripción verificada del archivo fuente.',
  };
}

/**
 * PRNG determinista Mulberry32 para experimentos reproducibles con semilla.
 */
export function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
