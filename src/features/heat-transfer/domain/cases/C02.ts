/**
 * Caso TC-C02: Convección y radiación simultáneas desde una superficie.
 * Fuente de datos base: Çengel (3.ª ed.), Ejemplo 1-10, cap. 1, p. 31 (p. 57 PDF).
 */

import { BOOK_CASE_DEFINITIONS, detectModifiedFields } from '../../data/book-presets';
import type { CalculationStep, HeatEvaluation, Parameter, ValidationCheck } from '../models';
import {
  SIGMA_STEFAN_BOLTZMANN,
  SIGMA_TEXTBOOK_ROUNDED,
  celsiusToKelvin,
  formatHT,
  formatLatexNum,
} from '../units';
import { validateNumericDomains } from '../validate';

export function evaluateC02(inputs: Record<string, Parameter>): HeatEvaluation {
  const def = BOOK_CASE_DEFINITIONS['TC-C02'];
  const modifiedFields = detectModifiedFields('TC-C02', inputs);
  const domainError = validateNumericDomains(inputs, ['Ts', 'Tair', 'Tsur']);

  const A = inputs.A.value;
  const Ts = inputs.Ts.value;
  const Tair = inputs.Tair.value;
  const Tsur = inputs.Tsur.value;
  const h = inputs.h.value;
  const epsilon = inputs.epsilon.value;

  if (domainError) {
    return {
      caseId: 'TC-C02',
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
      result: { Qconv: null, Qrad: null, Qtotal: null },
      primaryMetrics: [],
      steps: [],
      checks: [{ id: 'domain', passed: false, severity: 'error', explanation: domainError.message }],
      charts: [],
      diagramSnapshot: { type: 'TC-C02', data: { invalid: true } },
      workshopQuestions: [],
    };
  }

  const TsK = celsiusToKelvin(Ts);
  const TairK = celsiusToKelvin(Tair);
  const TsurK = celsiusToKelvin(Tsur);

  const deltaTconv = Ts - Tair;
  const Qconv = h * A * deltaTconv;

  const TsK4 = Math.pow(TsK, 4);
  const TsurK4 = Math.pow(TsurK, 4);
  const diffK4 = TsK4 - TsurK4;

  const Qrad = epsilon * SIGMA_STEFAN_BOLTZMANN * A * diffK4;
  const QradTextbookSigma = epsilon * SIGMA_TEXTBOOK_ROUNDED * A * diffK4;
  const Qtotal = Qconv + Qrad;

  // Coeficiente radiativo linealizado equivalente h_rad para comparar con h
  const hRad =
    Math.abs(TsK - TsurK) > 1e-9
      ? epsilon * SIGMA_STEFAN_BOLTZMANN * (TsK + TsurK) * (TsK * TsK + TsurK * TsurK)
      : 4 * epsilon * SIGMA_STEFAN_BOLTZMANN * Math.pow(TsK, 3);

  const absSum = Math.abs(Qconv) + Math.abs(Qrad);
  const shareConvPct = absSum > 1e-12 ? (Math.abs(Qconv) / absSum) * 100 : 0;
  const shareRadPct = absSum > 1e-12 ? (Math.abs(Qrad) / absSum) * 100 : 0;

  const warnings: string[] = [];
  if (Math.abs(Tair - Tsur) > 1e-9) {
    warnings.push(
      `T_aire (${formatHT(Tair, 1)} °C) difiere de T_alr (${formatHT(Tsur, 1)} °C): no confundir ambas temperaturas en las fórmulas separadas de convección y radiación.`
    );
  }
  if (Qtotal < 0) {
    warnings.push(
      'Q̇_total < 0: bajo convención positiva hacia el ambiente, el resultado indica GANANCIA NETA de calor por la superficie (no una pérdida).'
    );
  } else if (Qconv < 0 || Qrad < 0) {
    warnings.push(
      'Uno de los mecanismos aporta ganancia de calor (flujo entrante a la superficie) mientras el otro disipa calor hacia el exterior.'
    );
  }

  const labelBySign = (val: number, name: string) =>
    val > 1e-9
      ? `Pérdida por ${name}`
      : val < -1e-9
      ? `Ganancia neta por ${name}`
      : `Equilibrio en ${name}`;

  const steps: CalculationStep[] = [
    {
      id: 'c02-s1',
      position: 1,
      label: 'Visualización física y separación de mecanismos en paralelo',
      law: 'Superposición de mecanismos desde una frontera',
      why: 'Desde la misma superficie se transfiere energía al aire por convección y hacia las paredes del recinto por radiación electromagnética. Son rutas paralelas, no en serie.',
      formulaLatex: '\\dot Q_{\\text{total}} = \\dot Q_{\\text{conv}} + \\dot Q_{\\text{rad}}',
      substitutionLatex: `\\dot Q_{\\text{total}} = \\dot Q_{\\text{conv}}(T_s, T_{\\text{aire}}) + \\dot Q_{\\text{rad}}(T_{s,\\text{K}}^4, T_{\\text{alr},\\text{K}}^4)`,
      value: Qtotal,
      displayValue: formatHT(Qtotal, 2),
      unit: 'W',
      dependencies: ['A', 'Ts', 'Tair', 'Tsur', 'h', 'epsilon'],
      assumptions: ['Superficie en contacto simultáneo con gas y recinto grande'],
      validity: Qtotal < 0 ? 'warning' : 'ok',
    },
    {
      id: 'c02-s2',
      position: 2,
      label: 'Declaración de hipótesis del modelo idealizado',
      law: 'Recinto isotérmico grande y superficie gris difusa',
      why: 'Si el entorno es mucho mayor que el cuerpo (A_s/A_alr → 0), el factor de vista es F = 1 y la emisividad del recinto no limita la emisión neta.',
      formulaLatex: 'F_{s \\to \\text{alr}} \\approx 1, \\quad A_s = ' + formatLatexNum(A, 2) + '\\,\\text{m}^2',
      substitutionLatex: `\\varepsilon = ${formatLatexNum(epsilon, 2)}, \\quad h = ${formatLatexNum(h, 2)}\\,\\text{W/(m}^2\\cdot\\text{K)}`,
      value: A,
      displayValue: formatHT(A, 2),
      unit: 'm²',
      dependencies: ['A', 'epsilon', 'h'],
      assumptions: def.assumptions,
      validity: 'ok',
    },
    {
      id: 'c02-s3',
      position: 3,
      label: 'Conversión obligatoria a temperatura absoluta (Kelvin)',
      law: 'Escala termodinámica Kelvin',
      why: 'Stefan–Boltzmann depende de T⁴. Elevar °C a la cuarta potencia viola el cero absoluto y produce un error físico severo.',
      formulaLatex: 'T(\\text{K}) = T(^\\circ\\text{C}) + 273{,}15',
      substitutionLatex: `T_s = ${formatLatexNum(Ts, 2)} + 273{,}15 = ${formatLatexNum(TsK, 2)}\\,\\text{K}, \\quad T_{\\text{alr}} = ${formatLatexNum(Tsur, 2)} + 273{,}15 = ${formatLatexNum(TsurK, 2)}\\,\\text{K}`,
      value: TsK,
      displayValue: `${formatHT(TsK, 2)} K / ${formatHT(TsurK, 2)} K`,
      unit: 'K',
      dependencies: ['Ts', 'Tsur'],
      assumptions: ['Constante exacta 273,15 K según SI'],
      validity: 'ok',
    },
    {
      id: 'c02-s4',
      position: 4,
      label: 'Diferencia térmica para convección',
      law: 'Escala lineal de diferencias',
      why: 'En convección la diferencia de temperatura es lineal, por lo que T_s(K)−T_aire(K) equivale exactamente a T_s(°C)−T_aire(°C).',
      formulaLatex: '\\Delta T_{\\text{conv}} = T_s - T_{\\text{aire}}',
      substitutionLatex: `\\Delta T_{\\text{conv}} = ${formatLatexNum(Ts, 2)} - (${formatLatexNum(Tair, 2)}) = ${formatLatexNum(deltaTconv, 2)}\\,\\text{K}`,
      value: deltaTconv,
      displayValue: formatHT(deltaTconv, 2),
      unit: 'K',
      dependencies: ['Ts', 'Tair'],
      assumptions: ['Fluido lejos de la capa límite a T_aire uniforme'],
      validity: deltaTconv < 0 ? 'warning' : 'ok',
    },
    {
      id: 'c02-s5',
      position: 5,
      label: 'Cálculo de convección (ley de enfriamiento de Newton)',
      law: 'Ley de enfriamiento de Newton',
      why: 'Cuantifica el calor arrastrado por el movimiento del aire en contacto con la superficie.',
      formulaLatex: '\\dot Q_{\\text{conv}} = h A_s (T_s - T_{\\text{aire}})',
      substitutionLatex: `\\dot Q_{\\text{conv}} = (${formatLatexNum(h, 2)})(${formatLatexNum(A, 2)})(${formatLatexNum(deltaTconv, 2)}) = ${formatLatexNum(Qconv, 2)}\\,\\text{W}`,
      value: Qconv,
      displayValue: formatHT(Qconv, 2),
      unit: 'W',
      dependencies: ['h', 'A', 'Ts', 'Tair'],
      assumptions: ['Coeficiente h promedio representativo de toda el área A_s'],
      validity: Qconv < 0 ? 'warning' : 'ok',
    },
    {
      id: 'c02-s6',
      position: 6,
      label: 'Cuartas potencias absolutas (evitar error (T_s − T_alr)⁴)',
      law: 'Algebra no lineal de radiación',
      why: 'Debe calcularse T_s⁴ y T_alr⁴ por separado antes de restar; (T_s−T_alr)⁴ sería miles de veces menor y físicamente incorrecto.',
      formulaLatex: 'T_s^4 - T_{\\text{alr}}^4 \\neq (T_s - T_{\\text{alr}})^4',
      substitutionLatex: `${formatLatexNum(TsK, 2)}^4 - ${formatLatexNum(TsurK, 2)}^4 = ${formatLatexNum(diffK4, 4)}\\,\\text{K}^4`,
      value: diffK4,
      displayValue: diffK4.toExponential(4),
      unit: 'K⁴',
      dependencies: ['Ts', 'Tsur'],
      assumptions: ['Temperaturas estrictamente en Kelvin'],
      validity: 'ok',
      algebraNote: `Factorizando T_s⁴ − T_alr⁴ = (T_s − T_alr)(T_s + T_alr)(T_s² + T_alr²), se observa que equivale a multiplicar ΔT por un factor ~ 4·T_m³.`,
    },
    {
      id: 'c02-s7',
      position: 7,
      label: 'Constante física exacta de Stefan–Boltzmann σ',
      law: 'Constante CODATA 2018 / SI',
      why: 'Usamos σ = 5,670374419×10⁻⁸ W/(m²·K⁴) y registramos la mínima diferencia frente al valor redondeado 5,67×10⁻⁸ del texto.',
      formulaLatex: '\\sigma = 5{,}670374419 \\times 10^{-8}\\,\\frac{\\text{W}}{\\text{m}^2\\cdot\\text{K}^4}',
      substitutionLatex: `\\varepsilon\\sigma A_s = (${formatLatexNum(epsilon, 2)})(5{,}670374\\times 10^{-8})(${formatLatexNum(A, 2)}) = ${(epsilon * SIGMA_STEFAN_BOLTZMANN * A).toExponential(4)}\\,\\frac{\\text{W}}{\\text{K}^4}`,
      value: epsilon * SIGMA_STEFAN_BOLTZMANN * A,
      displayValue: (epsilon * SIGMA_STEFAN_BOLTZMANN * A).toExponential(4),
      unit: 'W/K⁴',
      dependencies: ['epsilon', 'A'],
      assumptions: ['Emisividad espectral constante en el infrarrojo térmico'],
      validity: 'ok',
    },
    {
      id: 'c02-s8',
      position: 8,
      label: 'Cálculo de radiación térmica neta Q̇_rad',
      law: 'Ley de Stefan–Boltzmann',
      why: 'Calcula el intercambio radiativo neto entre la superficie y las paredes circundantes.',
      formulaLatex: '\\dot Q_{\\text{rad}} = \\varepsilon \\sigma A_s (T_{s,\\text{K}}^4 - T_{\\text{alr},\\text{K}}^4)',
      substitutionLatex: `\\dot Q_{\\text{rad}} = (${formatLatexNum(epsilon, 2)})(5{,}670374\\times 10^{-8})(${formatLatexNum(A, 2)})(${formatLatexNum(TsK, 2)}^4 - ${formatLatexNum(TsurK, 2)}^4) = ${formatLatexNum(Qrad, 4)}\\,\\text{W}`,
      value: Qrad,
      displayValue: formatHT(Qrad, 2),
      unit: 'W',
      dependencies: ['epsilon', 'A', 'Ts', 'Tsur'],
      assumptions: ['Recinto opaco negro o mucho más grande que la superficie'],
      validity: Qrad < 0 ? 'warning' : 'ok',
    },
    {
      id: 'c02-s9',
      position: 9,
      label: 'Coeficiente radiativo linealizado equivalente h_rad',
      law: 'Linealización de radiación para comparar con h',
      why: 'Permite expresar la radiación en las mismas unidades W/(m²·K) que la convección y notar que ambas tienen órdenes de magnitud similares a temperatura ambiente.',
      formulaLatex: 'h_{\\text{rad}} = \\varepsilon \\sigma (T_s + T_{\\text{alr}})(T_s^2 + T_{\\text{alr}}^2)',
      substitutionLatex: `h_{\\text{rad}} = ${formatLatexNum(hRad, 3)}\\,\\text{W/(m}^2\\cdot\\text{K)} \\quad (\\text{frente a } h = ${formatLatexNum(h, 2)})`,
      value: hRad,
      displayValue: formatHT(hRad, 3),
      unit: 'W/(m²·K)',
      dependencies: ['epsilon', 'Ts', 'Tsur'],
      assumptions: ['h_rad depende fuertemente del nivel térmico absoluto T_m³'],
      validity: 'ok',
    },
    {
      id: 'c02-s10',
      position: 10,
      label: 'Suma total de transferencia combinada Q̇_total',
      law: 'Principio de superposición en frontera',
      why: 'Suma los aportes paralelos de convección y radiación manteniendo sus signos físicos.',
      formulaLatex: '\\dot Q_{\\text{total}} = \\dot Q_{\\text{conv}} + \\dot Q_{\\text{rad}}',
      substitutionLatex: `\\dot Q_{\\text{total}} = ${formatLatexNum(Qconv, 2)} + (${formatLatexNum(Qrad, 2)}) = ${formatLatexNum(Qtotal, 2)}\\,\\text{W}`,
      value: Qtotal,
      displayValue: formatHT(Qtotal, 2),
      unit: 'W',
      dependencies: ['Qconv', 'Qrad'],
      assumptions: ['Sin pérdida por conducción en contacto ni cambio de fase'],
      validity: Qtotal < 0 ? 'warning' : 'ok',
    },
    {
      id: 'c02-s11',
      position: 11,
      label: 'Participación porcentual de cada mecanismo',
      law: 'Descomposición energética',
      why: 'Muestra por qué a temperatura ambiente en convección natural suave la radiación no puede despreciarse (aporta casi la mitad del intercambio).',
      formulaLatex: '\\%_{\\text{conv}} = \\frac{|\\dot Q_{\\text{conv}}|}{|\\dot Q_{\\text{conv}}|+|\\dot Q_{\\text{rad}}|}\\times 100\\%',
      substitutionLatex: `\\text{Conv: } ${formatLatexNum(shareConvPct, 2)}\\%, \\quad \\text{Rad: } ${formatLatexNum(shareRadPct, 2)}\\%`,
      value: shareRadPct,
      displayValue: `${formatHT(shareConvPct, 1)} % conv / ${formatHT(shareRadPct, 1)} % rad`,
      unit: '%',
      dependencies: ['Qconv', 'Qrad'],
      assumptions: ['Fracción sobre magnitud total intercambiada'],
      validity: 'ok',
    },
    {
      id: 'c02-s12',
      position: 12,
      label: 'Comprobación dimensional, signos y comparación de constante',
      law: 'Auditoría SI y trazabilidad numérica',
      why: 'Verifica que σ=5,670374419×10⁻⁸ vs 5,67×10⁻⁸ (y 273,15 vs 273) solo explica centésimas de watt y valida casos límite (ε=0, h=0, equilibrio).',
      formulaLatex: '\\frac{\\text{W}}{\\text{m}^2\\cdot\\text{K}^4}\\cdot\\text{m}^2\\cdot\\text{K}^4 = \\text{W}, \\quad \\dot Q_{\\text{rad}}(\\sigma=5{,}67\\times 10^{-8}) = ' + formatLatexNum(QradTextbookSigma, 2) + '\\,\\text{W}',
      substitutionLatex: `\\dot Q_{\\text{total}}(\\sigma_{\\text{SI}}) = ${formatLatexNum(Qtotal, 2)}\\,\\text{W}, \\quad \\text{Diferencia por }\\sigma: ${formatLatexNum(Qrad - QradTextbookSigma, 4)}\\,\\text{W}`,
      value: Qtotal,
      displayValue: `${formatHT(Qtotal, 2)} W (${labelBySign(Qtotal, 'superficie')})`,
      unit: 'W',
      dependencies: ['Qconv', 'Qrad'],
      assumptions: ['T_air K = ' + formatHT(TairK, 2) + ' K'],
      validity: 'ok',
    },
  ];

  const checks: ValidationCheck[] = [
    {
      id: 'c02-chk-kelvin',
      passed: TsK > 0 && TairK > 0 && TsurK > 0,
      severity: 'info',
      explanation: `Temperaturas convertidas a Kelvin: T_s = ${formatHT(TsK, 2)} K, T_alr = ${formatHT(TsurK, 2)} K.`,
    },
    {
      id: 'c02-chk-eq',
      passed: true,
      severity: Qtotal < 0 ? 'warning' : 'info',
      explanation:
        Math.abs(Ts - Tair) < 1e-9 && Math.abs(Ts - Tsur) < 1e-9
          ? 'Equilibrio térmico completo: convección y radiación nulas.'
          : `${labelBySign(Qconv, 'convección')} (${formatHT(Qconv, 2)} W) + ${labelBySign(Qrad, 'radiación')} (${formatHT(Qrad, 2)} W).`,
    },
    {
      id: 'c02-chk-sigma',
      passed: Math.abs(Qrad - QradTextbookSigma) < 0.5,
      severity: 'info',
      explanation: `Uso de σ CODATA 2018 (${formatHT(Qrad, 3)} W) frente a σ redondeado del libro (${formatHT(QradTextbookSigma, 3)} W).`,
    },
  ];

  const tsMin = Math.min(Ts, Tair, Tsur) - 10;
  const tsMax = Math.max(Ts, Tair, Tsur) + 25;
  const curveConv: Array<{ x: number; y: number; label: string }> = [];
  const curveRad: Array<{ x: number; y: number; label: string }> = [];
  const curveTotal: Array<{ x: number; y: number; label: string; extra: string }> = [];

  for (let i = 0; i <= 16; i++) {
    const tVal = tsMin + ((tsMax - tsMin) * i) / 16;
    const tValK = celsiusToKelvin(tVal);
    const qc = h * A * (tVal - Tair);
    const qr = epsilon * SIGMA_STEFAN_BOLTZMANN * A * (Math.pow(tValK, 4) - TsurK4);
    const qt = qc + qr;
    curveConv.push({ x: tVal, y: qc, label: `T_s=${formatHT(tVal, 1)} °C` });
    curveRad.push({ x: tVal, y: qr, label: `T_s=${formatHT(tVal, 1)} °C` });
    curveTotal.push({
      x: tVal,
      y: qt,
      label: `T_s=${formatHT(tVal, 1)} °C`,
      extra: `Conv=${formatHT(qc, 1)} W · Rad=${formatHT(qr, 1)} W`,
    });
  }

  return {
    caseId: 'TC-C02',
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
      TsK,
      TairK,
      TsurK,
      Qconv,
      Qrad,
      Qtotal,
      hRad,
      shareConvPct,
      shareRadPct,
    },
    primaryMetrics: [
      {
        id: 'Qconv',
        label: labelBySign(Qconv, 'convección'),
        value: formatHT(Qconv, 2),
        unit: 'W',
        accent: 'blue',
        bookReference: '86,40 W',
      },
      {
        id: 'Qrad',
        label: labelBySign(Qrad, 'radiación'),
        value: formatHT(Qrad, 2),
        unit: 'W',
        accent: 'amber',
        bookReference: '≈ 81,84 W (81,7 W texto)',
      },
      {
        id: 'Qtotal',
        label: Qtotal >= 0 ? 'Calor total disipado Q̇' : 'Ganancia neta total Q̇',
        value: formatHT(Qtotal, 2),
        unit: 'W',
        accent: 'teal',
        bookReference: '≈ 168,24 W (168 W texto)',
      },
      {
        id: 'hRad',
        label: 'h_rad equivalente',
        value: formatHT(hRad, 2),
        unit: 'W/(m²·K)',
        accent: 'blue',
      },
    ],
    steps,
    checks,
    charts: [
      {
        id: 'c02-sweep-ts',
        title: 'Potencia convectiva, radiativa y total en función de T_s',
        subtitle: 'Observa el crecimiento no lineal T⁴ de la radiación frente a la recta convectiva',
        xLabel: 'Temperatura superficial T_s (°C)',
        yLabel: 'Potencia térmica (W)',
        xDecimals: 1,
        yDecimals: 1,
        markerX: { x: Ts, label: `Actual T_s=${formatHT(Ts, 1)} °C`, color: '#F4B860' },
        series: [
          { id: 'total', name: 'Q̇ total', color: '#42D9C0', showNodes: true, points: curveTotal },
          { id: 'conv', name: 'Q̇ convección', color: '#54A8FF', dashed: true, showNodes: false, points: curveConv },
          { id: 'rad', name: 'Q̇ radiación', color: '#F4B860', dashed: true, showNodes: false, points: curveRad },
        ],
      },
    ],
    diagramSnapshot: {
      type: 'TC-C02',
      data: {
        A,
        Ts,
        Tair,
        Tsur,
        TsK,
        TsurK,
        h,
        epsilon,
        Qconv,
        Qrad,
        Qtotal,
        shareConvPct,
        shareRadPct,
      },
    },
    workshopQuestions: [
      {
        id: 'c02-q1',
        prompt: 'Convierte la temperatura superficial T_s a Kelvin.',
        targetUnit: 'K',
        expectedValue: TsK,
        toleranceRel: 0.001,
        hint: 'Suma 273,15 a la temperatura en °C.',
        explanation: `T_s = ${formatHT(Ts, 2)} + 273,15 = ${formatHT(TsK, 2)} K.`,
      },
      {
        id: 'c02-q2',
        prompt: 'Calcula la transferencia por convección Q̇_conv = h·A_s·(T_s − T_aire).',
        targetUnit: 'W',
        expectedValue: Qconv,
        toleranceRel: 0.02,
        hint: 'Usa ΔT en °C o K directamente porque la ley de Newton es lineal.',
        explanation: `Q̇_conv = ${formatHT(h, 2)} × ${formatHT(A, 2)} × ${formatHT(deltaTconv, 2)} = ${formatHT(Qconv, 2)} W.`,
      },
      {
        id: 'c02-q3',
        prompt: 'Calcula la radiación neta Q̇_rad = ε·σ·A_s·(T_s,K⁴ − T_alr,K⁴).',
        targetUnit: 'W',
        expectedValue: Qrad,
        toleranceRel: 0.02,
        hint: 'Aplica las cuartas potencias sobre las temperaturas absolutas en Kelvin.',
        explanation: `Q̇_rad = ${formatHT(Qrad, 2)} W.`,
      },
      {
        id: 'c02-q4',
        prompt: 'Calcula la transferencia total combinada Q̇_total = Q̇_conv + Q̇_rad.',
        targetUnit: 'W',
        expectedValue: Qtotal,
        toleranceRel: 0.02,
        hint: 'Suma algebraicamente ambos mecanismos paralelos.',
        explanation: `Q̇_total = ${formatHT(Qconv, 2)} + ${formatHT(Qrad, 2)} = ${formatHT(Qtotal, 2)} W.`,
      },
    ],
  };
}
