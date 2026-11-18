/**
 * Caso TC-C01: Pérdida de calor por conducción a través de un techo plano.
 * Fuente de datos base: Çengel (3.ª ed.), Ejemplo 1-5, cap. 1, p. 19 (p. 45 PDF).
 */

import { BOOK_CASE_DEFINITIONS, detectModifiedFields } from '../../data/book-presets';
import type { CalculationStep, HeatEvaluation, Parameter, ValidationCheck } from '../models';
import { formatHT, formatLatexNum, kWhToMJ, wattsToKilowatts } from '../units';
import { validateNumericDomains } from '../validate';

export function evaluateC01(inputs: Record<string, Parameter>): HeatEvaluation {
  const def = BOOK_CASE_DEFINITIONS['TC-C01'];
  const modifiedFields = detectModifiedFields('TC-C01', inputs);
  const domainError = validateNumericDomains(inputs, ['Tsi', 'Tse']);

  const a = inputs.a.value;
  const b = inputs.b.value;
  const L = inputs.L.value;
  const k = inputs.k.value;
  const Tsi = inputs.Tsi.value;
  const Tse = inputs.Tse.value;
  const tHours = inputs.tHours.value;
  const priceUsdKwh = inputs.priceUsdKwh.value;

  if (domainError) {
    return {
      caseId: 'TC-C01',
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
      result: { Qdot: null, Qkw: null, energyKwh: null, costUsd: null },
      primaryMetrics: [],
      steps: [],
      checks: [{ id: 'domain', passed: false, severity: 'error', explanation: domainError.message }],
      charts: [],
      diagramSnapshot: { type: 'TC-C01', data: { invalid: true } },
      workshopQuestions: [],
    };
  }

  // Cálculos físicos puros en SI
  const area = a * b;
  const deltaT = Tsi - Tse;
  const dTdx = (Tse - Tsi) / L; // gradiente en dirección interior -> exterior
  const qFlux = (k * deltaT) / L; // W/m² (firmado: >0 si sale hacia exterior)
  const Qdot = qFlux * area; // W
  const Qkw = wattsToKilowatts(Qdot); // kW
  const energyKwh = Qkw * tHours; // kWh
  const energyMJ = kWhToMJ(energyKwh); // MJ
  const costUsd = Math.abs(energyKwh) * priceUsdKwh; // costo asociado a magnitud de flujo
  const Rcond = L / (k * area); // K/W equivalente

  const warnings: string[] = [];
  if (deltaT < 0) {
    warnings.push(
      'T_se > T_si: el gradiente térmico se invirtió, por lo que el calor entra desde el exterior hacia el interior (Q̇ < 0 en convención interior→exterior).'
    );
  } else if (Math.abs(deltaT) < 1e-9) {
    warnings.push('No existe diferencia de temperatura entre ambas caras: el flujo neto por conducción es nulo.');
  }

  const flowDirection =
    deltaT > 1e-9
      ? 'Interior (cara caliente) → Exterior (cara fría)'
      : deltaT < -1e-9
      ? 'Exterior (cara caliente) → Interior (cara fría)'
      : 'Equilibrio térmico (sin flujo neto)';

  const steps: CalculationStep[] = [
    {
      id: 'c01-s1',
      position: 1,
      label: 'Lectura del sistema y geometría del techo',
      law: 'Geometría de pared plana',
      why: 'Identificamos que el calor atraviesa perpendicularmente una losa rectangular de ancho a, largo b y espesor L.',
      formulaLatex: 'A = a \\cdot b',
      substitutionLatex: `A = (${formatLatexNum(a, 2)}\\,\\text{m})(${formatLatexNum(b, 2)}\\,\\text{m}) = ${formatLatexNum(area, 2)}\\,\\text{m}^2`,
      value: area,
      displayValue: formatHT(area, 2),
      unit: 'm²',
      dependencies: ['a', 'b'],
      assumptions: ['Sección transversal uniforme perpendicular al flujo de calor'],
      validity: 'ok',
    },
    {
      id: 'c01-s2',
      position: 2,
      label: 'Identificación de incógnitas y sentido esperado',
      law: 'Segunda ley (dirección térmica)',
      why: 'El calor siempre fluye espontáneamente desde la superficie de mayor temperatura hacia la de menor temperatura.',
      formulaLatex: '\\Delta T = T_{si} - T_{se}',
      substitutionLatex: `\\Delta T = ${formatLatexNum(Tsi, 2)}\\,^\\circ\\text{C} - (${formatLatexNum(Tse, 2)}\\,^\\circ\\text{C}) = ${formatLatexNum(deltaT, 2)}\\,\\text{K}`,
      value: deltaT,
      displayValue: formatHT(deltaT, 2),
      unit: 'K',
      dependencies: ['Tsi', 'Tse'],
      assumptions: ['Un salto ΔT en °C es numéricamente idéntico a ΔT en K'],
      validity: deltaT < 0 ? 'warning' : 'ok',
    },
    {
      id: 'c01-s3',
      position: 3,
      label: 'Verificación de escala de diferencia de temperatura',
      law: 'Conversión SI de intervalos térmicos',
      why: 'Sumar 273,15 a ambos términos se cancela exactamente al restar: (T_si+273,15)−(T_se+273,15) = T_si−T_se.',
      formulaLatex: '\\Delta T(\\text{K}) = (T_{si}+273{,}15) - (T_{se}+273{,}15) = T_{si}-T_{se}',
      substitutionLatex: `(${formatLatexNum(Tsi + 273.15, 2)} - ${formatLatexNum(Tse + 273.15, 2)})\\,\\text{K} = ${formatLatexNum(deltaT, 2)}\\,\\text{K}`,
      value: deltaT,
      displayValue: formatHT(deltaT, 2),
      unit: 'K',
      dependencies: ['Tsi', 'Tse'],
      assumptions: ['Solo aplica a diferencias lineales de temperatura, nunca a T⁴'],
      validity: 'ok',
    },
    {
      id: 'c01-s4',
      position: 4,
      label: 'Declaración de supuestos e hipótesis de Fourier',
      law: 'Balance 1D estacionario',
      why: 'Las temperaturas superficiales T_si y T_se ya están especificadas; no se añade convección porque no se conocen temperaturas del aire ni coeficientes h.',
      formulaLatex: '\\frac{d^2 T}{dx^2} = 0 \\implies T(x) = T_{si} + \\frac{T_{se}-T_{si}}{L}x',
      substitutionLatex: `\\frac{dT}{dx} = \\frac{${formatLatexNum(Tse, 2)} - (${formatLatexNum(Tsi, 2)})}{${formatLatexNum(L, 3)}} = ${formatLatexNum(dTdx, 2)}\\,\\text{K/m}`,
      value: dTdx,
      displayValue: formatHT(dTdx, 2),
      unit: 'K/m',
      dependencies: ['Tsi', 'Tse', 'L'],
      assumptions: def.assumptions,
      validity: 'ok',
      algebraNote: 'Integrando d²T/dx² = 0 dos veces con T(0)=T_si y T(L)=T_se se obtiene un perfil lineal de pendiente constante (T_se − T_si)/L.',
    },
    {
      id: 'c01-s5',
      position: 5,
      label: 'Ley de Fourier y flujo térmico superficial q″',
      law: 'Ley de conducción de Fourier',
      why: 'El signo menos de Fourier indica que el calor avanza en sentido contrario al gradiente positivo de temperatura.',
      formulaLatex: 'q\'\' = -k\\frac{dT}{dx} = k\\frac{T_{si}-T_{se}}{L}',
      substitutionLatex: `q'' = \\frac{(${formatLatexNum(k, 3)})(${formatLatexNum(deltaT, 2)})}{${formatLatexNum(L, 3)}} = ${formatLatexNum(qFlux, 2)}\\,\\text{W/m}^2`,
      value: qFlux,
      displayValue: formatHT(qFlux, 2),
      unit: 'W/m²',
      dependencies: ['k', 'Tsi', 'Tse', 'L'],
      assumptions: ['Conductividad k isotrópica y constante'],
      validity: deltaT < 0 ? 'warning' : 'ok',
    },
    {
      id: 'c01-s6',
      position: 6,
      label: 'Tasa de transferencia de calor (potencia térmica Q̇)',
      law: 'Ley de Fourier integrada sobre área A',
      why: 'Multiplicar el flujo superficial q″ [W/m²] por el área A [m²] entrega la potencia térmica total en Watts.',
      formulaLatex: '\\dot Q = k A \\frac{T_{si} - T_{se}}{L}',
      substitutionLatex: `\\dot Q = \\frac{(${formatLatexNum(k, 3)}\\,\\text{W/(m\\cdot K)})(${formatLatexNum(area, 2)}\\,\\text{m}^2)(${formatLatexNum(deltaT, 2)}\\,\\text{K})}{${formatLatexNum(L, 3)}\\,\\text{m}} = ${formatLatexNum(Qdot, 2)}\\,\\text{W}`,
      value: Qdot,
      displayValue: formatHT(Qdot, 2),
      unit: 'W',
      dependencies: ['k', 'a', 'b', 'Tsi', 'Tse', 'L'],
      assumptions: ['Sin pérdidas laterales por bordes'],
      validity: deltaT < 0 ? 'warning' : 'ok',
    },
    {
      id: 'c01-s7',
      position: 7,
      label: 'Resistencia conductiva equivalente del techo',
      law: 'Analogía eléctrica térmica',
      why: 'Permite verificar Q̇ = ΔT / R_cond e intuir que mayor espesor L eleva la resistencia.',
      formulaLatex: 'R_{\\text{cond}} = \\frac{L}{k A}',
      substitutionLatex: `R_{\\text{cond}} = \\frac{${formatLatexNum(L, 3)}\\,\\text{m}}{(${formatLatexNum(k, 3)})(${formatLatexNum(area, 2)})} = ${formatLatexNum(Rcond, 6)}\\,\\text{K/W}`,
      value: Rcond,
      displayValue: formatHT(Rcond, 6),
      unit: 'K/W',
      dependencies: ['L', 'k', 'a', 'b'],
      assumptions: ['Flujo 1D uniforme'],
      validity: 'ok',
    },
    {
      id: 'c01-s8',
      position: 8,
      label: 'Conversión de potencia térmica a kilowatts (kW)',
      law: 'Prefijo métrico SI (1 kW = 1000 W)',
      why: 'Las tarifas eléctricas y facturaciones de energía operan en kW y kWh.',
      formulaLatex: '\\dot Q_{\\text{kW}} = \\frac{\\dot Q}{1000}',
      substitutionLatex: `\\dot Q_{\\text{kW}} = \\frac{${formatLatexNum(Qdot, 2)}\\,\\text{W}}{1000\\,\\text{W/kW}} = ${formatLatexNum(Qkw, 4)}\\,\\text{kW}`,
      value: Qkw,
      displayValue: formatHT(Qkw, 4),
      unit: 'kW',
      dependencies: ['Qdot'],
      assumptions: ['Factor exacto 10⁻³ kW/W'],
      validity: 'ok',
    },
    {
      id: 'c01-s9',
      position: 9,
      label: 'Energía total transferida en el período Δt',
      law: 'Integración temporal en régimen estacionario',
      why: 'Potencia (kW) no es energía (kWh): en régimen estacionario la energía acumulada es potencia multiplicada por tiempo.',
      formulaLatex: 'Q = \\dot Q_{\\text{kW}} \\cdot \\Delta t',
      substitutionLatex: `Q = (${formatLatexNum(Qkw, 4)}\\,\\text{kW})(${formatLatexNum(tHours, 2)}\\,\\text{h}) = ${formatLatexNum(energyKwh, 3)}\\,\\text{kWh}`,
      value: energyKwh,
      displayValue: formatHT(energyKwh, 3),
      unit: 'kWh',
      dependencies: ['Qdot', 'tHours'],
      assumptions: ['Temperaturas constantes durante todo el período Δt'],
      validity: 'ok',
    },
    {
      id: 'c01-s10',
      position: 10,
      label: 'Equivalencia de energía en megajoules (SI puro)',
      law: 'Conversión SI (1 kWh = 3,6 MJ)',
      why: 'Verifica la consistencia en unidades SI puras de energía (J y MJ).',
      formulaLatex: 'Q_{\\text{MJ}} = Q_{\\text{kWh}} \\times 3{,}6\\,\\text{MJ/kWh}',
      substitutionLatex: `Q_{\\text{MJ}} = (${formatLatexNum(energyKwh, 3)})(3{,}6) = ${formatLatexNum(energyMJ, 4)}\\,\\text{MJ}`,
      value: energyMJ,
      displayValue: formatHT(energyMJ, 4),
      unit: 'MJ',
      dependencies: ['tHours', 'Qdot'],
      assumptions: ['1 kW·h = 1000 J/s × 3600 s = 3,6×10⁶ J'],
      validity: 'ok',
    },
    {
      id: 'c01-s11',
      position: 11,
      label: 'Costo eléctrico equivalente del calor transferido',
      law: 'Valorización energética',
      why: 'Se multiplica la magnitud de energía transferida (kWh) por el precio unitario en USD/kWh.',
      formulaLatex: '\\text{Costo} = |Q_{\\text{kWh}}| \\cdot c_{\\text{elec}}',
      substitutionLatex: `\\text{Costo} = (${formatLatexNum(Math.abs(energyKwh), 3)}\\,\\text{kWh})(${formatLatexNum(priceUsdKwh, 3)}\\,\\text{USD/kWh}) = ${formatLatexNum(costUsd, 5)}\\,\\text{USD}`,
      value: costUsd,
      displayValue: formatHT(costUsd, 4),
      unit: 'USD',
      dependencies: ['tHours', 'priceUsdKwh', 'Qdot'],
      assumptions: ['Tarifa en USD referencial del ejemplo; no incluye eficiencia de caldera o bomba de calor'],
      validity: 'ok',
    },
    {
      id: 'c01-s12',
      position: 12,
      label: 'Comprobación física, dimensional y temperatura media de losa',
      law: 'Auditoría dimensional y perfil lineal',
      why: 'En x = L/2 la temperatura debe ser exactamente el promedio aritmético (T_si + T_se)/2 y las unidades cancelan a Watt.',
      formulaLatex: '\\frac{\\text{W}}{\\text{m}\\cdot\\text{K}} \\cdot \\text{m}^2 \\cdot \\frac{\\text{K}}{\\text{m}} = \\text{W}, \\qquad T(L/2) = \\frac{T_{si}+T_{se}}{2}',
      substitutionLatex: `T(${formatLatexNum(L / 2, 3)}\\,\\text{m}) = ${formatHT(0.5 * (Tsi + Tse), 2)}\\,^\\circ\\text{C}, \\quad \\dot Q = \\frac{\\Delta T}{R_{\\text{cond}}} = ${formatLatexNum(deltaT / Rcond, 2)}\\,\\text{W}`,
      value: 0.5 * (Tsi + Tse),
      displayValue: `${formatHT(0.5 * (Tsi + Tse), 2)} °C (${flowDirection})`,
      unit: '°C',
      dependencies: ['Tsi', 'Tse', 'L', 'k', 'a', 'b'],
      assumptions: ['Balance entre cálculo directo y circuito resistivo ΔT/R_cond'],
      validity: 'ok',
    },
  ];

  const checks: ValidationCheck[] = [
    {
      id: 'c01-chk-dim',
      passed: Math.abs(Qdot - deltaT / Rcond) < 1e-9,
      severity: 'info',
      explanation: `Consistencia Q̇ = kAΔT/L = ΔT/R_cond verificada (${formatHT(Qdot, 2)} W).`,
    },
    {
      id: 'c01-chk-dir',
      passed: deltaT >= 0,
      severity: deltaT >= 0 ? 'info' : 'warning',
      explanation:
        deltaT >= 0
          ? `Sentido físico confirmado: interior (${formatHT(Tsi, 1)} °C) → exterior (${formatHT(Tse, 1)} °C).`
          : `Sentido invertido: el calor ingresa desde la cara exterior (${formatHT(Tse, 1)} °C) hacia la interior (${formatHT(Tsi, 1)} °C).`,
    },
    {
      id: 'c01-chk-energy',
      passed: Math.abs(energyMJ - energyKwh * 3.6) < 1e-9,
      severity: 'info',
      explanation: `Distinción potencia/energía verificada: ${formatHT(Qkw, 4)} kW durante ${formatHT(tHours, 1)} h = ${formatHT(energyKwh, 3)} kWh (${formatHT(energyMJ, 3)} MJ).`,
    },
  ];

  // Curvas sincronizadas: 1) T(x) lineal, 2) Q(L) hiperbólica 1/L, 3) Energía acumulada E(t)
  const txPoints = Array.from({ length: 11 }, (_, idx) => {
    const x = (L * idx) / 10;
    const tx = Tsi + dTdx * x;
    return {
      x,
      y: tx,
      id: idx === 0 ? 'Tsi' : idx === 10 ? 'Tse' : undefined,
      label: idx === 0 ? 'Cara interior (x=0)' : idx === 10 ? 'Cara exterior (x=L)' : `x = ${formatHT(x, 3)} m`,
    };
  });

  const lMin = Math.max(0.05, L * 0.4);
  const lMax = Math.max(0.6, L * 2.0);
  const qlPoints = Array.from({ length: 15 }, (_, idx) => {
    const lx = lMin + ((lMax - lMin) * idx) / 14;
    const qx = (k * area * deltaT) / lx;
    return {
      x: lx,
      y: qx,
      label: `L = ${formatHT(lx, 3)} m`,
      extra: `Q̇ = ${formatHT(qx, 1)} W`,
    };
  });

  const tSamples = Array.from({ length: 11 }, (_, idx) => {
    const th = (Math.max(1, tHours) * idx) / 10;
    return {
      x: th,
      y: Qkw * th,
      label: `t = ${formatHT(th, 1)} h`,
      extra: `Costo ≈ ${formatHT(Math.abs(Qkw * th) * priceUsdKwh, 3)} USD`,
    };
  });

  return {
    caseId: 'TC-C01',
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
      area,
      deltaT,
      qFlux,
      Qdot,
      Qkw,
      energyKwh,
      energyMJ,
      costUsd,
      Rcond,
      dTdx,
    },
    primaryMetrics: [
      {
        id: 'Qdot',
        label: deltaT >= 0 ? 'Potencia perdida Q̇' : 'Potencia entrante Q̇',
        value: formatHT(Qdot, 2),
        unit: 'W',
        accent: 'amber',
        bookReference: '1.689,6 W (≈ 1,69 kW)',
      },
      {
        id: 'energyKwh',
        label: `Energía en ${formatHT(tHours, 1)} h`,
        value: formatHT(energyKwh, 3),
        unit: 'kWh',
        accent: 'blue',
        bookReference: '16,896 kWh',
      },
      {
        id: 'costUsd',
        label: 'Costo equivalente',
        value: formatHT(costUsd, 4),
        unit: 'USD',
        accent: 'teal',
        bookReference: '1,3517 USD (≈ 1,35 USD)',
      },
      {
        id: 'qFlux',
        label: 'Flujo superficial q″',
        value: formatHT(qFlux, 2),
        unit: 'W/m²',
        accent: 'blue',
        bookReference: '35,20 W/m²',
      },
    ],
    steps,
    checks,
    charts: [
      {
        id: 'c01-profile',
        title: 'Perfil lineal de temperatura T(x) en la losa',
        subtitle: 'Estado estacionario sin generación con k constante',
        xLabel: 'Espesor x (m)',
        yLabel: 'Temperatura T (°C)',
        xDecimals: 3,
        yDecimals: 1,
        series: [
          {
            id: 'tx',
            name: 'T(x) analítica 1D',
            color: '#54A8FF',
            showNodes: true,
            points: txPoints,
          },
        ],
      },
      {
        id: 'c01-thickness',
        title: 'Sensibilidad de Q̇ respecto al espesor L',
        subtitle: 'Relación inversa Q̇ ∝ 1/L manteniendo el resto constante',
        xLabel: 'Espesor L (m)',
        yLabel: 'Potencia Q̇ (W)',
        xDecimals: 2,
        yDecimals: 0,
        markerX: { x: L, label: `Actual L=${formatHT(L, 2)} m`, color: '#F4B860' },
        series: [
          {
            id: 'ql',
            name: 'Curva Q̇(L)',
            color: '#42D9C0',
            showNodes: true,
            points: qlPoints,
          },
        ],
      },
      {
        id: 'c01-energy',
        title: 'Energía acumulada E(t) durante el período',
        subtitle: 'Integración de potencia constante en el tiempo',
        xLabel: 'Tiempo t (h)',
        yLabel: 'Energía E (kWh)',
        xDecimals: 1,
        yDecimals: 2,
        series: [
          {
            id: 'et',
            name: 'Energía E(t)',
            color: '#F4B860',
            showNodes: true,
            points: tSamples,
          },
        ],
      },
    ],
    diagramSnapshot: {
      type: 'TC-C01',
      data: {
        a,
        b,
        area,
        L,
        k,
        Tsi,
        Tse,
        deltaT,
        Qdot,
        Qkw,
        qFlux,
        energyKwh,
        costUsd,
        flowDirection,
      },
    },
    workshopQuestions: [
      {
        id: 'c01-q1',
        prompt: 'Calcula el área perpendicular al flujo de calor A = a · b.',
        targetUnit: 'm²',
        expectedValue: area,
        toleranceRel: 0.01,
        hint: 'Multiplica ancho (a) por largo (b) de la losa.',
        explanation: `A = ${formatHT(a, 2)} × ${formatHT(b, 2)} = ${formatHT(area, 2)} m².`,
      },
      {
        id: 'c01-q2',
        prompt: 'Calcula el flujo térmico superficial q″ = k·(T_si − T_se)/L.',
        targetUnit: 'W/m²',
        expectedValue: qFlux,
        toleranceRel: 0.02,
        hint: 'Divide k·ΔT entre el espesor L en metros (en el libro resulta 35,2 W/m²).',
        explanation: `q″ = (${formatHT(k, 3)} × ${formatHT(deltaT, 2)}) / ${formatHT(L, 3)} = ${formatHT(qFlux, 2)} W/m².`,
      },
      {
        id: 'c01-q3',
        prompt: 'Calcula la potencia térmica total Q̇ que atraviesa el techo.',
        targetUnit: 'W',
        expectedValue: Qdot,
        toleranceRel: 0.02,
        hint: 'Multiplica q″ por el área A.',
        explanation: `Q̇ = ${formatHT(qFlux, 2)} × ${formatHT(area, 2)} = ${formatHT(Qdot, 2)} W (${formatHT(Qkw, 4)} kW).`,
      },
      {
        id: 'c01-q4',
        prompt: 'Determina la energía total transferida en el período de tiempo Δt.',
        targetUnit: 'kWh',
        expectedValue: energyKwh,
        toleranceRel: 0.02,
        hint: 'Convierte Q̇ a kW (dividiendo por 1000) y multiplica por las horas Δt.',
        explanation: `E = ${formatHT(Qkw, 4)} kW × ${formatHT(tHours, 2)} h = ${formatHT(energyKwh, 3)} kWh.`,
      },
    ],
  };
}
