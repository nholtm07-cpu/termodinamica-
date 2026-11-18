/**
 * Caso TC-C03: Ventana de doble vidrio y circuito de cinco resistencias térmicas en serie.
 * Fuente de datos base: Çengel (3.ª ed.), Ejemplo 3-3, cap. 3, pp. 140–141 (pp. 166–167 PDF).
 */

import { BOOK_CASE_DEFINITIONS, detectModifiedFields } from '../../data/book-presets';
import type { CalculationStep, HeatEvaluation, Parameter, ValidationCheck } from '../models';
import { formatHT, formatLatexNum, mmToMeters } from '../units';
import { validateNumericDomains } from '../validate';

export function evaluateC03(inputs: Record<string, Parameter>): HeatEvaluation {
  const def = BOOK_CASE_DEFINITIONS['TC-C03'];
  const modifiedFields = detectModifiedFields('TC-C03', inputs);
  const domainError = validateNumericDomains(inputs, ['Ti', 'To']);

  const H = inputs.H.value;
  const B = inputs.B.value;
  const Lg1mm = inputs.Lg1mm.value;
  const kg = inputs.kg.value;
  const Lairmm = inputs.Lairmm.value;
  const kair = inputs.kair.value;
  const Lg2mm = inputs.Lg2mm.value;
  const Ti = inputs.Ti.value;
  const To = inputs.To.value;
  const hi = inputs.hi.value;
  const ho = inputs.ho.value;

  if (domainError) {
    return {
      caseId: 'TC-C03',
      title: def.title,
      difficulty: def.difficulty,
      source: def.source,
      premise: def.premise,
      assumptions: def.assumptions,
      inputs,
      isModifiedFromBook: modifiedFields.length > 0,
      modifiedFields,
      status: 'invalid',
      blockingIssue: domainError,
      warnings: [],
      result: { Rtotal: null, Qdot: null, Tsi: null },
      primaryMetrics: [],
      steps: [],
      checks: [{ id: 'domain', passed: false, severity: 'error', explanation: domainError.message }],
      charts: [],
      diagramSnapshot: { type: 'TC-C03', data: { invalid: true } },
      workshopQuestions: [],
    };
  }

  const A = H * B;
  const Lg1 = mmToMeters(Lg1mm);
  const Lair = mmToMeters(Lairmm);
  const Lg2 = mmToMeters(Lg2mm);

  // Cinco resistencias térmicas en serie [K/W]
  const Ri = 1 / (hi * A);
  const Rg1 = Lg1 / (kg * A);
  const Rair = Lair / (kair * A);
  const Rg2 = Lg2 / (kg * A);
  const Ro = 1 / (ho * A);
  const Rtotal = Ri + Rg1 + Rair + Rg2 + Ro;

  const deltaT = Ti - To;
  const Qdot = deltaT / Rtotal;

  // Cálculo topológico nodo a nodo (sin valores prefijados)
  const Tsi = Ti - Qdot * Ri;
  const Tmid1 = Tsi - Qdot * Rg1;
  const Tmid2 = Tmid1 - Qdot * Rair;
  const Tso = Tmid2 - Qdot * Rg2;
  const ToCheck = Tso - Qdot * Ro;
  const balanceError = Math.abs(ToCheck - To);

  const shareAirPct = (Rair / Rtotal) * 100;
  const Uglobal = 1 / (Rtotal * A);

  const warnings: string[] = [];
  if (Lairmm > 15) {
    warnings.push(
      `Cámara de aire de ${formatHT(Lairmm, 1)} mm: en cámaras más anchas (> 15 mm) puede desarrollarse convección natural interna; el modelo de conducción pura con k_aire deja de ser automáticamente representativo.`
    );
  }
  if (deltaT < 0) {
    warnings.push(
      'T_∞,o > T_∞,i: la dirección del flujo térmico se invierte hacia el interior de la habitación.'
    );
  }

  const resistances = [
    { id: 'Ri', label: 'Película convectiva interior', R: Ri, share: (Ri / Rtotal) * 100 },
    { id: 'Rg1', label: 'Vidrio interior', R: Rg1, share: (Rg1 / Rtotal) * 100 },
    { id: 'Rair', label: 'Cámara de aire estancado', R: Rair, share: shareAirPct },
    { id: 'Rg2', label: 'Vidrio exterior', R: Rg2, share: (Rg2 / Rtotal) * 100 },
    { id: 'Ro', label: 'Película convectiva exterior', R: Ro, share: (Ro / Rtotal) * 100 },
  ];

  const steps: CalculationStep[] = [
    {
      id: 'c03-s1',
      position: 1,
      label: 'Esquema físico y circuito de cinco resistencias en serie',
      law: 'Analogía térmico-eléctrica en serie',
      why: 'El mismo flujo de calor atraviesa sucesivamente: película interior → vidrio 1 → cámara de aire → vidrio 2 → película exterior. Son cinco resistencias, no cuatro.',
      formulaLatex: 'R_{\\text{total}} = R_i + R_{v1} + R_{\\text{aire}} + R_{v2} + R_o',
      substitutionLatex: `T_{\\infty,i} \\xrightarrow{R_i} T_{s,i} \\xrightarrow{R_{v1}} T_{1} \\xrightarrow{R_{\\text{aire}}} T_{2} \\xrightarrow{R_{v2}} T_{s,o} \\xrightarrow{R_o} T_{\\infty,o}`,
      value: 5,
      displayValue: '5 resistencias en serie',
      unit: 'nodos',
      dependencies: [],
      assumptions: def.assumptions,
      validity: 'ok',
    },
    {
      id: 'c03-s2',
      position: 2,
      label: 'Área de transferencia y conversión de espesores a SI',
      law: 'Conversión geométrica (1 mm = 0,001 m)',
      why: 'Todas las resistencias comparten el mismo área perpendicular A = H·B y requieren espesores en metros.',
      formulaLatex: 'A = H \\cdot B, \\quad L(\\text{m}) = \\frac{L(\\text{mm})}{1000}',
      substitutionLatex: `A = ${formatLatexNum(H, 2)} \\times ${formatLatexNum(B, 2)} = ${formatLatexNum(A, 2)}\\,\\text{m}^2, \\quad L_{v1}=${formatLatexNum(Lg1, 4)}\\,\\text{m}, \\; L_{\\text{aire}}=${formatLatexNum(Lair, 4)}\\,\\text{m}, \\; L_{v2}=${formatLatexNum(Lg2, 4)}\\,\\text{m}`,
      value: A,
      displayValue: formatHT(A, 2),
      unit: 'm²',
      dependencies: ['H', 'B', 'Lg1mm', 'Lairmm', 'Lg2mm'],
      assumptions: ['Sin efecto de marco perimetral ni puentes térmicos'],
      validity: 'ok',
    },
    {
      id: 'c03-s3',
      position: 3,
      label: 'Resistencia convectiva interior R_i',
      law: 'Resistencia por convección de Newton',
      why: 'Modela la película de aire interior; h_i ya incorpora el intercambio radiativo efectivo interior (no sumar radiación aparte).',
      formulaLatex: 'R_i = \\frac{1}{h_i A}',
      substitutionLatex: `R_i = \\frac{1}{(${formatLatexNum(hi, 2)})(${formatLatexNum(A, 2)})} = ${formatLatexNum(Ri, 6)}\\,\\text{K/W}`,
      value: Ri,
      displayValue: formatHT(Ri, 6),
      unit: 'K/W',
      dependencies: ['hi', 'H', 'B'],
      assumptions: ['h_i uniforme combinado (convección + radiación efectiva)'],
      validity: 'ok',
    },
    {
      id: 'c03-s4',
      position: 4,
      label: 'Resistencia conductiva del primer vidrio R_v1',
      law: 'Resistencia conductiva plana',
      why: 'El vidrio conduce relativamente bien (k ≈ 0,78 W/mK) y es muy delgado, por lo que opone poca resistencia.',
      formulaLatex: 'R_{v1} = \\frac{L_{v1}}{k_v A}',
      substitutionLatex: `R_{v1} = \\frac{${formatLatexNum(Lg1, 4)}}{(${formatLatexNum(kg, 3)})(${formatLatexNum(A, 2)})} = ${formatLatexNum(Rg1, 6)}\\,\\text{K/W}`,
      value: Rg1,
      displayValue: formatHT(Rg1, 6),
      unit: 'K/W',
      dependencies: ['Lg1mm', 'kg', 'H', 'B'],
      assumptions: ['Conducción 1D en vidrio homogéneo'],
      validity: 'ok',
    },
    {
      id: 'c03-s5',
      position: 5,
      label: 'Resistencia de la cámara de aire estancado R_aire',
      law: 'Conducción en gas confinado',
      why: 'El aire en reposo tiene conductividad muy baja (~0,026 W/mK), concentrando la mayor fracción de resistencia térmica de la ventana.',
      formulaLatex: 'R_{\\text{aire}} = \\frac{L_{\\text{aire}}}{k_{\\text{aire}} A}',
      substitutionLatex: `R_{\\text{aire}} = \\frac{${formatLatexNum(Lair, 4)}}{(${formatLatexNum(kair, 4)})(${formatLatexNum(A, 2)})} = ${formatLatexNum(Rair, 6)}\\,\\text{K/W}`,
      value: Rair,
      displayValue: formatHT(Rair, 6),
      unit: 'K/W',
      dependencies: ['Lairmm', 'kair', 'H', 'B'],
      assumptions: ['Aire inmóvil sin convección natural apreciable dentro del espacio'],
      validity: Lairmm > 15 ? 'warning' : 'ok',
    },
    {
      id: 'c03-s6',
      position: 6,
      label: 'Resistencia conductiva del segundo vidrio R_v2',
      law: 'Resistencia conductiva plana',
      why: 'Evalúa la segunda hoja vidriada que protege la cámara frente al exterior.',
      formulaLatex: 'R_{v2} = \\frac{L_{v2}}{k_v A}',
      substitutionLatex: `R_{v2} = \\frac{${formatLatexNum(Lg2, 4)}}{(${formatLatexNum(kg, 3)})(${formatLatexNum(A, 2)})} = ${formatLatexNum(Rg2, 6)}\\,\\text{K/W}`,
      value: Rg2,
      displayValue: formatHT(Rg2, 6),
      unit: 'K/W',
      dependencies: ['Lg2mm', 'kg', 'H', 'B'],
      assumptions: ['Misma área transversal A'],
      validity: 'ok',
    },
    {
      id: 'c03-s7',
      position: 7,
      label: 'Resistencia convectiva exterior R_o',
      law: 'Resistencia por convección exterior',
      why: 'Con viento exterior (h_o mayor que h_i), la resistencia de película externa es mucho menor que la interna.',
      formulaLatex: 'R_o = \\frac{1}{h_o A}',
      substitutionLatex: `R_o = \\frac{1}{(${formatLatexNum(ho, 2)})(${formatLatexNum(A, 2)})} = ${formatLatexNum(Ro, 6)}\\,\\text{K/W}`,
      value: Ro,
      displayValue: formatHT(Ro, 6),
      unit: 'K/W',
      dependencies: ['ho', 'H', 'B'],
      assumptions: ['h_o efectivo combinado exterior'],
      validity: 'ok',
    },
    {
      id: 'c03-s8',
      position: 8,
      label: 'Resistencia térmica total en serie R_total y transmitancia U',
      law: 'Suma de resistencias en serie',
      why: 'En serie se suman las 5 resistencias directamente; la resistencia dominante determina el orden de magnitud del aislamiento.',
      formulaLatex: 'R_{\\text{total}} = R_i + R_{v1} + R_{\\text{aire}} + R_{v2} + R_o',
      substitutionLatex: `R_{\\text{total}} = ${formatLatexNum(Ri, 5)} + ${formatLatexNum(Rg1, 5)} + ${formatLatexNum(Rair, 5)} + ${formatLatexNum(Rg2, 5)} + ${formatLatexNum(Ro, 5)} = ${formatLatexNum(Rtotal, 6)}\\,\\text{K/W}`,
      value: Rtotal,
      displayValue: formatHT(Rtotal, 6),
      unit: 'K/W',
      dependencies: ['Ri', 'Rg1', 'Rair', 'Rg2', 'Ro'],
      assumptions: [`Transmitancia global U = 1/(R_total·A) = ${formatHT(Uglobal, 3)} W/(m²·K)`],
      validity: 'ok',
    },
    {
      id: 'c03-s9',
      position: 9,
      label: 'Diferencia global de temperatura (cuidado con signos negativos)',
      law: 'Resta de temperaturas ambientes',
      why: 'Cuando T_∞,o es negativa (ej. −10 °C), restar un número negativo suma magnitudes: 20 − (−10) = 30 K.',
      formulaLatex: '\\Delta T_{\\text{global}} = T_{\\infty,i} - T_{\\infty,o}',
      substitutionLatex: `\\Delta T_{\\text{global}} = ${formatLatexNum(Ti, 2)} - (${formatLatexNum(To, 2)}) = ${formatLatexNum(deltaT, 2)}\\,\\text{K}`,
      value: deltaT,
      displayValue: formatHT(deltaT, 2),
      unit: 'K',
      dependencies: ['Ti', 'To'],
      assumptions: ['Temperaturas de fluido sin perturbación en ambos lados'],
      validity: deltaT < 0 ? 'warning' : 'ok',
    },
    {
      id: 'c03-s10',
      position: 10,
      label: 'Tasa de transferencia de calor Q̇ a través de la ventana',
      law: 'Ley de Ohm térmica global',
      why: 'La misma potencia térmica Q̇ circula por cada una de las cinco capas en estado estacionario.',
      formulaLatex: '\\dot Q = \\frac{T_{\\infty,i} - T_{\\infty,o}}{R_{\\text{total}}}',
      substitutionLatex: `\\dot Q = \\frac{${formatLatexNum(deltaT, 2)}\\,\\text{K}}{${formatLatexNum(Rtotal, 6)}\\,\\text{K/W}} = ${formatLatexNum(Qdot, 4)}\\,\\text{W}`,
      value: Qdot,
      displayValue: formatHT(Qdot, 3),
      unit: 'W',
      dependencies: ['Ti', 'To', 'Rtotal'],
      assumptions: ['Flujo continuo idéntico en los 5 tramos'],
      validity: 'ok',
    },
    {
      id: 'c03-s11',
      position: 11,
      label: 'Temperatura de la cara interior del vidrio T_s,i',
      law: 'Caída térmica en película interior',
      why: 'Como hay resistencia convectiva R_i, la superficie interior del vidrio está más fría que el aire interior (lo que explica la condensación invernal en vidrios simples).',
      formulaLatex: 'T_{s,i} = T_{\\infty,i} - \\dot Q R_i',
      substitutionLatex: `T_{s,i} = ${formatLatexNum(Ti, 2)} - (${formatLatexNum(Qdot, 4)})(${formatLatexNum(Ri, 6)}) = ${formatLatexNum(Tsi, 4)}\\,^\\circ\\text{C}`,
      value: Tsi,
      displayValue: formatHT(Tsi, 3),
      unit: '°C',
      dependencies: ['Ti', 'Qdot', 'Ri'],
      assumptions: ['Recorrido desde fluido interior hacia pared'],
      validity: 'ok',
      algebraNote: 'Despejando de Q̇ = (T_∞,i − T_s,i)/R_i se obtiene directamente T_s,i = T_∞,i − Q̇·R_i.',
    },
    {
      id: 'c03-s12',
      position: 12,
      label: 'Temperaturas sucesivas de interfaces y cierre del balance',
      law: 'Continuidad de flujo y verificación nodal',
      why: 'Cada interfaz desciende proporcionalmente a su resistencia; al restar las 5 caídas se recupera exactamente T_∞,o.',
      formulaLatex: 'T_1 = T_{s,i}-\\dot Q R_{v1},\\; T_2 = T_1-\\dot Q R_{\\text{aire}},\\; T_{s,o} = T_2-\\dot Q R_{v2},\\; T_{\\infty,o}^{\\text{chk}} = T_{s,o}-\\dot Q R_o',
      substitutionLatex: `T_1=${formatLatexNum(Tmid1, 2)}\\,^\\circ\\text{C},\\; T_2=${formatLatexNum(Tmid2, 2)}\\,^\\circ\\text{C},\\; T_{s,o}=${formatLatexNum(Tso, 2)}\\,^\\circ\\text{C},\\; |\\text{error}|=${balanceError.toExponential(1)}\\,\\text{K}`,
      value: ToCheck,
      displayValue: `T1=${formatHT(Tmid1, 2)} · T2=${formatHT(Tmid2, 2)} · Tso=${formatHT(Tso, 2)} °C`,
      unit: '°C',
      dependencies: ['Tsi', 'Qdot', 'Rg1', 'Rair', 'Rg2', 'Ro'],
      assumptions: [`La cámara de aire aporta ${formatHT(shareAirPct, 1)} % de la resistencia total`],
      validity: 'ok',
    },
  ];

  const checks: ValidationCheck[] = [
    {
      id: 'c03-chk-5r',
      passed: resistances.length === 5,
      severity: 'info',
      explanation: `Cinco resistencias en serie verificadas; la cámara de aire concentra el ${formatHT(shareAirPct, 1)} % de R_total.`,
    },
    {
      id: 'c03-chk-nodes',
      passed: balanceError < 1e-8,
      severity: 'info',
      explanation: `Cierre nodal exacto: Σ(Q̇·R_j) reconstruye ΔT = ${formatHT(deltaT, 2)} K (residuo ${balanceError.toExponential(2)} K).`,
    },
    {
      id: 'c03-chk-conv',
      passed: Lairmm <= 15,
      severity: Lairmm <= 15 ? 'info' : 'warning',
      explanation:
        Lairmm <= 15
          ? `Separación de aire (${formatHT(Lairmm, 1)} mm) compatible con el modelo de conducción pura del ejemplo.`
          : `Separación de ${formatHT(Lairmm, 1)} mm > 15 mm: podría iniciarse convección natural en la cámara.`,
    },
  ];

  // Gráfico 1: Perfil espacial T(x) con caídas convectivas representadas como elementos de borde
  const xVid1End = Lg1mm;
  const xAirEnd = Lg1mm + Lairmm;
  const xVid2End = Lg1mm + Lairmm + Lg2mm;
  const txPoints = [
    { x: -3, y: Ti, id: 'T∞i', label: 'Aire interior' },
    { x: 0, y: Tsi, id: 'Tsi', label: 'Cara interior vidrio 1 (x=0)' },
    { x: xVid1End, y: Tmid1, id: 'T1', label: `Interfaz vidrio 1 / aire (x=${formatHT(xVid1End, 1)} mm)` },
    { x: xAirEnd, y: Tmid2, id: 'T2', label: `Interfaz aire / vidrio 2 (x=${formatHT(xAirEnd, 1)} mm)` },
    { x: xVid2End, y: Tso, id: 'Tso', label: `Cara exterior vidrio 2 (x=${formatHT(xVid2End, 1)} mm)` },
    { x: xVid2End + 3, y: To, id: 'T∞o', label: 'Aire exterior' },
  ];

  // Gráfico 2: T(R_acumulada) estrictamente lineal!
  const trPoints = [
    { x: 0, y: Ti, id: '0', label: 'Aire interior (R=0)' },
    { x: Ri, y: Tsi, id: 'Ri', label: 'Después de película interior' },
    { x: Ri + Rg1, y: Tmid1, id: 'Rv1', label: 'Después de vidrio 1' },
    { x: Ri + Rg1 + Rair, y: Tmid2, id: 'Rair', label: 'Después de cámara de aire' },
    { x: Ri + Rg1 + Rair + Rg2, y: Tso, id: 'Rv2', label: 'Después de vidrio 2' },
    { x: Rtotal, y: To, id: 'Ro', label: 'Aire exterior (R=R_total)' },
  ];

  return {
    caseId: 'TC-C03',
    title: def.title,
    difficulty: def.difficulty,
    source: def.source,
    premise: def.premise,
    assumptions: def.assumptions,
    inputs,
    isModifiedFromBook: modifiedFields.length > 0,
    modifiedFields,
    status: warnings.length > 0 ? 'warning' : 'valid',
    warnings,
    result: {
      A,
      Ri,
      Rg1,
      Rair,
      Rg2,
      Ro,
      Rtotal,
      Uglobal,
      Qdot,
      Tsi,
      Tmid1,
      Tmid2,
      Tso,
      shareAirPct,
    },
    primaryMetrics: [
      {
        id: 'Rtotal',
        label: 'Resistencia total (5 capas)',
        value: formatHT(Rtotal, 5),
        unit: 'K/W',
        accent: 'blue',
        bookReference: '0,43323 K/W',
      },
      {
        id: 'Qdot',
        label: 'Potencia transferida Q̇',
        value: formatHT(Qdot, 2),
        unit: 'W',
        accent: 'amber',
        bookReference: '69,25 W (≈ 69,2 W)',
      },
      {
        id: 'Tsi',
        label: 'Cara interior vidrio T_s,i',
        value: formatHT(Tsi, 2),
        unit: '°C',
        accent: 'teal',
        bookReference: '14,23 °C (≈ 14,2 °C)',
      },
      {
        id: 'shareAirPct',
        label: 'Peso de cámara de aire',
        value: formatHT(shareAirPct, 1),
        unit: '% de R_t',
        accent: 'blue',
        bookReference: '74,0 %',
      },
    ],
    steps,
    checks,
    charts: [
      {
        id: 'c03-tr',
        title: 'Temperatura frente a resistencia térmica acumulada T(R)',
        subtitle: 'Pendiente constante igual a −Q̇ en todo el circuito en serie',
        xLabel: 'Resistencia acumulada R (K/W)',
        yLabel: 'Temperatura T (°C)',
        xDecimals: 3,
        yDecimals: 1,
        series: [{ id: 'tr', name: 'Nodos T(R)', color: '#42D9C0', showNodes: true, points: trPoints }],
      },
      {
        id: 'c03-tx',
        title: 'Perfil espacial T(x) con capas límite convectivas',
        subtitle: 'Mayor caída térmica ocurre en la cámara de aire y en la película interior',
        xLabel: 'Posición x (mm, bordes muestran capas límite)',
        yLabel: 'Temperatura T (°C)',
        xDecimals: 1,
        yDecimals: 1,
        series: [{ id: 'tx', name: 'Perfil nodal T(x)', color: '#54A8FF', showNodes: true, points: txPoints }],
      },
    ],
    diagramSnapshot: {
      type: 'TC-C03',
      data: {
        H,
        B,
        A,
        Lg1mm,
        Lairmm,
        Lg2mm,
        Ti,
        Tsi,
        Tmid1,
        Tmid2,
        Tso,
        To,
        Qdot,
        Rtotal,
        Uglobal,
        resistances,
      },
    },
    workshopQuestions: [
      {
        id: 'c03-q1',
        prompt: 'Calcula la resistencia térmica de la película interior R_i = 1/(h_i·A).',
        targetUnit: 'K/W',
        expectedValue: Ri,
        toleranceRel: 0.02,
        hint: 'Primero calcula A = H·B en m²; luego divide 1 entre (h_i · A).',
        explanation: `R_i = 1 / (${formatHT(hi, 1)} × ${formatHT(A, 2)}) = ${formatHT(Ri, 5)} K/W.`,
      },
      {
        id: 'c03-q2',
        prompt: 'Calcula la resistencia de la cámara de aire estancado R_aire = L_aire/(k_aire·A).',
        targetUnit: 'K/W',
        expectedValue: Rair,
        toleranceRel: 0.02,
        hint: 'Recuerda convertir L_aire de milímetros a metros (10 mm = 0,010 m).',
        explanation: `R_aire = ${formatHT(Lair, 4)} / (${formatHT(kair, 4)} × ${formatHT(A, 2)}) = ${formatHT(Rair, 5)} K/W.`,
      },
      {
        id: 'c03-q3',
        prompt: 'Calcula la resistencia total en serie R_total sumando las 5 capas.',
        targetUnit: 'K/W',
        expectedValue: Rtotal,
        toleranceRel: 0.015,
        hint: 'Suma R_i + R_v1 + R_aire + R_v2 + R_o.',
        explanation: `R_total = ${formatHT(Rtotal, 5)} K/W.`,
      },
      {
        id: 'c03-q4',
        prompt: 'Determina la potencia perdida Q̇ y la temperatura de la cara interior T_s,i.',
        targetUnit: 'W',
        expectedValue: Qdot,
        toleranceRel: 0.02,
        hint: 'Q̇ = (T_∞,i − T_∞,o) / R_total; ten cuidado al restar T_∞,o negativo.',
        explanation: `Q̇ = ${formatHT(deltaT, 1)} / ${formatHT(Rtotal, 5)} = ${formatHT(Qdot, 2)} W; T_s,i = ${formatHT(Tsi, 2)} °C.`,
      },
    ],
  };
}
