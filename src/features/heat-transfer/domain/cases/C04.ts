/**
 * Caso TC-C04: Tiempo de respuesta transitoria de un termopar esférico (capacidad concentrada).
 * Fuente de datos base: Çengel (3.ª ed.), Ejemplo 4-1, cap. 4, pp. 222–223 (pp. 248–249 PDF).
 */

import { BOOK_CASE_DEFINITIONS, detectModifiedFields } from '../../data/book-presets';
import type { CalculationStep, DomainIssue, HeatEvaluation, Parameter, ValidationCheck } from '../models';
import { formatHT, formatLatexNum, mmToMeters } from '../units';
import { validateNumericDomains } from '../validate';

export function evaluateC04(
  inputs: Record<string, Parameter>,
  playbackTimeSec?: number
): HeatEvaluation {
  const def = BOOK_CASE_DEFINITIONS['TC-C04'];
  const modifiedFields = detectModifiedFields('TC-C04', inputs);
  const domainError = validateNumericDomains(inputs, ['Ti', 'Tgas']);

  const Dmm = inputs.Dmm.value;
  const k = inputs.k.value;
  const rho = inputs.rho.value;
  const cp = inputs.cp.value;
  const h = inputs.h.value;
  const targetPct = inputs.targetPct.value;
  const Ti = inputs.Ti.value;
  const Tgas = inputs.Tgas.value;

  if (domainError) {
    return {
      caseId: 'TC-C04',
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
      result: { Bi: null, b: null, tau: null, targetTime: null },
      primaryMetrics: [],
      steps: [],
      checks: [{ id: 'domain', passed: false, severity: 'error', explanation: domainError.message }],
      charts: [],
      diagramSnapshot: { type: 'TC-C04', data: { invalid: true } },
      workshopQuestions: [],
    };
  }

  const D = mmToMeters(Dmm);
  const radius = D / 2;
  const volume = (Math.PI * Math.pow(D, 3)) / 6;
  const area = Math.PI * Math.pow(D, 2);
  const Lc = D / 6; // V / As = (πD³/6) / (πD²) = D/6
  const Bi = (h * Lc) / k;
  const alpha = k / (rho * cp); // difusividad térmica [m²/s]

  // Bloqueo científico obligatorio si Bi >= 0.1
  if (Bi >= 0.1) {
    const biIssue: DomainIssue = {
      code: 'BIOT_LUMPED_INVALID',
      field: 'Dmm',
      message: `Número de Biot Bi = ${formatHT(Bi, 4)} ≥ 0,10: el modelo de capacidad concentrada NO es válido.`,
      physicalExplanation:
        'La resistencia conductiva interna de la esfera supera el umbral frente a la convección superficial. La temperatura deja de ser uniforme en el interior del sólido y aparecen gradientes radiales apreciables.',
      suggestedFix:
        'Reduce el diámetro D o el coeficiente h, aumenta k, o cambia a una formulación transitoria distribuida (gráficos de Heisler / solución radial con r y Fo).',
    };

    const preSteps: CalculationStep[] = [
      {
        id: 'c04-blk-1',
        position: 1,
        label: 'Conversión geométrica de esfera y longitud característica L_c',
        law: 'Geometría L_c = V / A_s',
        why: 'Antes de aplicar cualquier fórmula transitoria exponencial debemos evaluar el número de Biot.',
        formulaLatex: 'L_c = \\frac{V}{A_s} = \\frac{\\pi D^3 / 6}{\\pi D^2} = \\frac{D}{6}',
        substitutionLatex: `D = ${formatLatexNum(D, 5)}\\,\\text{m} \\implies L_c = ${formatLatexNum(Lc, 6)}\\,\\text{m}`,
        value: Lc,
        displayValue: Lc.toExponential(4),
        unit: 'm',
        dependencies: ['Dmm'],
        assumptions: ['Unión esférica homogénea'],
        validity: 'ok',
      },
      {
        id: 'c04-blk-2',
        position: 2,
        label: 'Evaluación del número de Biot y bloqueo del modelo concentrado',
        law: 'Criterio de Biot (Bi < 0,1)',
        why: 'Con Bi ≥ 0,1 el error de suponer temperatura uniforme supera el margen ingenieril admisible y no debe entregarse un tiempo exponencial engañoso.',
        formulaLatex: 'Bi = \\frac{h L_c}{k} < 0{,}1',
        substitutionLatex: `Bi = \\frac{(${formatLatexNum(h, 2)})(${formatLatexNum(Lc, 6)})}{${formatLatexNum(k, 2)}} = ${formatLatexNum(Bi, 4)} \\ge 0{,}1 \\;(\\text{BLOQUEADO})`,
        value: Bi,
        displayValue: formatHT(Bi, 4),
        unit: 'adim.',
        dependencies: ['h', 'Dmm', 'k'],
        assumptions: ['Se requiere modelo espacial distribuido T(r,t)'],
        validity: 'blocked',
        errorCode: 'BIOT_LUMPED_INVALID',
      },
    ];

    return {
      caseId: 'TC-C04',
      title: def.title,
      difficulty: def.difficulty,
      source: def.source,
      premise: def.premise,
      assumptions: def.assumptions,
      inputs,
      isModifiedFromBook: modifiedFields.length > 0,
      modifiedFields,
      status: 'invalid',
      blockingIssue: biIssue,
      warnings: [],
      result: { Lc, Bi, b: null, tau: null, targetTime: null },
      primaryMetrics: [
        {
          id: 'Bi',
          label: 'Número de Biot (BLOQUEADO)',
          value: formatHT(Bi, 4),
          unit: '≥ 0,10',
          accent: 'red',
        },
      ],
      steps: preSteps,
      checks: [{ id: 'c04-chk-bi', passed: false, severity: 'error', explanation: biIssue.message }],
      charts: [],
      diagramSnapshot: {
        type: 'TC-C04',
        data: { Dmm, D, Lc, Bi, invalidLumped: true, Ti, Tgas },
      },
      workshopQuestions: [],
    };
  }

  const b = h / (rho * cp * Lc); // s^-1
  const tau = 1 / b; // constante de tiempo [s]
  const fRemaining = 1 - targetPct / 100; // fracción remanente (1 - 0.99 = 0.01)
  const targetTime = -Math.log(fRemaining) / b; // s
  const FoAtTarget = (alpha * targetTime) / (Lc * Lc);

  const tInspect =
    playbackTimeSec !== undefined && Number.isFinite(playbackTimeSec)
      ? Math.max(0, Math.min(targetTime * 1.4, playbackTimeSec))
      : targetTime;
  const TAtTarget = Tgas + (Ti - Tgas) * Math.exp(-b * targetTime);
  const TAtInspect = Tgas + (Ti - Tgas) * Math.exp(-b * tInspect);
  const responseFractionAtInspect =
    Math.abs(Tgas - Ti) > 1e-9 ? ((TAtInspect - Ti) / (Tgas - Ti)) * 100 : targetPct;

  const warnings: string[] = [];
  if (Bi >= 0.05) {
    warnings.push(
      `Bi = ${formatHT(Bi, 4)} está acercándose al límite 0,1; la aproximación concentrada sigue admisible pero conviene monitorear gradientes.`
    );
  }
  if (Math.abs(Tgas - Ti) < 1e-9) {
    warnings.push(
      'T_i = T_∞: el termopar ya está en equilibrio con el gas (0 °C de salto térmico); la constante τ y el tiempo adimensional b siguen definidos aunque ΔT sea nulo.'
    );
  }

  const steps: CalculationStep[] = [
    {
      id: 'c04-s1',
      position: 1,
      label: 'Comprensión física de respuesta transitoria de un sensor',
      law: 'Inercia térmica frente a convección',
      why: 'Aunque el termopar sea pequeño, posee masa y calor específico: no salta instantáneamente de T_i a T_∞ sino que se aproxima exponencialmente.',
      formulaLatex: '\\theta(t) = \\frac{T(t) - T_\\infty}{T_i - T_\\infty} = 1 - \\frac{\\text{Resp.}\\%}{100}',
      substitutionLatex: `\\text{Para } ${formatLatexNum(targetPct, 2)}\\%\\text{ de respuesta, } f_{\\text{rem}} = 1 - ${formatLatexNum(targetPct / 100, 4)} = ${formatLatexNum(fRemaining, 4)}`,
      value: fRemaining,
      displayValue: formatHT(fRemaining, 4),
      unit: 'adim.',
      dependencies: ['targetPct'],
      assumptions: ['Criterio adimensional independiente del salto absoluto T_∞ − T_i'],
      validity: 'ok',
    },
    {
      id: 'c04-s2',
      position: 2,
      label: 'Conversión de diámetro a metros y geometría de esfera',
      law: 'Geometría esférica SI',
      why: '1 mm = 0,001 m. Al variar el diámetro D, cambian tanto el volumen (∝ D³) como el área superficial (∝ D²).',
      formulaLatex: 'V = \\frac{\\pi D^3}{6}, \\qquad A_s = \\pi D^2',
      substitutionLatex: `D = ${formatLatexNum(D, 5)}\\,\\text{m}, \\quad V = ${volume.toExponential(3)}\\,\\text{m}^3, \\quad A_s = ${area.toExponential(3)}\\,\\text{m}^2`,
      value: D,
      displayValue: formatHT(D, 5),
      unit: 'm',
      dependencies: ['Dmm'],
      assumptions: ['Esfera maciza de diámetro uniforme'],
      validity: 'ok',
    },
    {
      id: 'c04-s3',
      position: 3,
      label: 'Longitud característica L_c = V / A_s',
      law: 'Definición de escala para sistema concentrado',
      why: 'Para una esfera, la razón entre volumen y superficie externa se simplifica exactamente a D/6.',
      formulaLatex: 'L_c = \\frac{V}{A_s} = \\frac{D}{6}',
      substitutionLatex: `L_c = \\frac{${formatLatexNum(D, 5)}\\,\\text{m}}{6} = ${Lc.toExponential(4)}\\,\\text{m}`,
      value: Lc,
      displayValue: Lc.toExponential(4),
      unit: 'm',
      dependencies: ['Dmm'],
      assumptions: ['Superficie completa expuesta al flujo de gas'],
      validity: 'ok',
    },
    {
      id: 'c04-s4',
      position: 4,
      label: 'Cálculo del número de Biot (Bi)',
      law: 'Razón resistencia interna / resistencia externa',
      why: 'Biot compara qué tan difícil es conducir calor dentro de la esfera frente a entregarlo por convección en la superficie.',
      formulaLatex: 'Bi = \\frac{h L_c}{k}',
      substitutionLatex: `Bi = \\frac{(${formatLatexNum(h, 2)})(${Lc.toExponential(4)})}{${formatLatexNum(k, 2)}} = ${formatLatexNum(Bi, 5)}`,
      value: Bi,
      displayValue: formatHT(Bi, 5),
      unit: 'adim.',
      dependencies: ['h', 'Dmm', 'k'],
      assumptions: ['k es la conductividad del metal del termopar (no del gas)'],
      validity: Bi >= 0.05 ? 'warning' : 'ok',
    },
    {
      id: 'c04-s5',
      position: 5,
      label: 'Verificación del criterio de capacidad concentrada',
      law: 'Umbral Bi < 0,1',
      why: 'Como Bi < 0,1, el error por asumir temperatura espacialmente uniforme T(t) dentro de la unión es menor al 5 %.',
      formulaLatex: 'Bi = ' + formatLatexNum(Bi, 5) + ' < 0{,}1 \\implies \\text{Válido}',
      substitutionLatex: `\\text{Modelo concentrado autorizado (margen } ${(0.1 / Math.max(1e-9, Bi)).toFixed(1)}\\times \\text{ bajo el umbral)}`,
      value: Bi,
      displayValue: `Válido (Bi = ${formatHT(Bi, 5)} < 0,1)`,
      unit: 'adim.',
      dependencies: ['h', 'Dmm', 'k'],
      assumptions: def.assumptions,
      validity: 'ok',
    },
    {
      id: 'c04-s6',
      position: 6,
      label: 'Balance de energía transitorio en el termopar',
      law: 'Primera ley en sistema cerrado concentrado',
      why: 'La energía convectiva que entra desde el gas iguala la rapidez de aumento de energía interna del metal.',
      formulaLatex: '\\rho V c_p \\frac{dT}{dt} = h A_s (T_\\infty - T)',
      substitutionLatex: `\\frac{dT}{dt} = \\frac{h}{\\rho c_p L_c}(T_\\infty - T) = b\\,(T_\\infty - T)`,
      value: rho * volume * cp,
      displayValue: (rho * volume * cp).toExponential(3),
      unit: 'J/K',
      dependencies: ['rho', 'cp', 'Dmm', 'h'],
      assumptions: ['Propiedades constantes y sin conducción por los alambres'],
      validity: 'ok',
      algebraNote: 'Dividiendo ambos lados por ρ·V·c_p y sustituyendo A_s/V = 1/L_c aparece el parámetro inverso del tiempo b = h/(ρ·c_p·L_c).',
    },
    {
      id: 'c04-s7',
      position: 7,
      label: 'Parámetro exponencial de rapidez b',
      law: 'Tasa característica inversa de tiempo',
      why: 'Cuanto mayor sea b [s⁻¹], más rápido responde el sensor; aumentar h acelera la lectura y aumentar D, ρ o c_p la vuelve más lenta.',
      formulaLatex: 'b = \\frac{h}{\\rho c_p L_c}',
      substitutionLatex: `b = \\frac{${formatLatexNum(h, 2)}}{(${formatLatexNum(rho, 0)})(${formatLatexNum(cp, 1)})(${Lc.toExponential(4)})} = ${formatLatexNum(b, 7)}\\,\\text{s}^{-1}`,
      value: b,
      displayValue: formatHT(b, 6),
      unit: 's⁻¹',
      dependencies: ['h', 'rho', 'cp', 'Dmm'],
      assumptions: ['Unidades: (W/m²K) / [(kg/m³)(J/kgK)(m)] = 1/s'],
      validity: 'ok',
    },
    {
      id: 'c04-s8',
      position: 8,
      label: 'Constante de tiempo térmica τ = 1/b',
      law: 'Dinámica de primer orden',
      why: 'Transcurrido un tiempo t = τ, el sensor ha recorrido 1 − e⁻¹ ≈ 63,21 % del cambio total.',
      formulaLatex: '\\tau = \\frac{1}{b} = \\frac{\\rho c_p L_c}{h}',
      substitutionLatex: `\\tau = \\frac{1}{${formatLatexNum(b, 6)}\\,\\text{s}^{-1}} = ${formatLatexNum(tau, 4)}\\,\\text{s}`,
      value: tau,
      displayValue: formatHT(tau, 4),
      unit: 's',
      dependencies: ['h', 'rho', 'cp', 'Dmm'],
      assumptions: ['En t = 5τ se supera el 99,3 % de respuesta'],
      validity: 'ok',
    },
    {
      id: 'c04-s9',
      position: 9,
      label: 'Ecuación exponencial y despeje logarítmico del tiempo objetivo',
      law: 'Solución por separación de variables',
      why: 'El término e^(−bt) representa la fracción de diferencia que TODAVÍA falta recorrer: para 99 % de respuesta, falta 0,01.',
      formulaLatex: 'e^{-b t} = 1 - \\frac{\\text{Resp.}\\%}{100} \\implies t = -\\frac{\\ln(f_{\\text{rem}})}{b}',
      substitutionLatex: `t_{${formatLatexNum(targetPct, 1)}} = -\\frac{\\ln(${formatLatexNum(fRemaining, 4)})}{${formatLatexNum(b, 7)}}`,
      value: Math.log(fRemaining),
      displayValue: `ln(${formatHT(fRemaining, 4)}) = ${formatHT(Math.log(fRemaining), 5)}`,
      unit: 'adim.',
      dependencies: ['targetPct', 'b'],
      assumptions: ['f_rem > 0 estrictamente (100 % requeriría t → ∞)'],
      validity: 'ok',
      algebraNote: 'Tomando logaritmo natural en ambos lados de e^(−bt) = f_rem resulta −b·t = ln(f_rem); como f_rem < 1, ln(f_rem) es negativo y −ln(f_rem)/b resulta positivo.',
    },
    {
      id: 'c04-s10',
      position: 10,
      label: 'Tiempo requerido para alcanzar la respuesta objetivo',
      law: 'Evaluación numérica del tiempo',
      why: 'Entrega el tiempo real que tarda el termopar en leer el porcentaje solicitado del salto térmico.',
      formulaLatex: 't_{\\text{obj}} = \\frac{-\\ln(f_{\\text{rem}})}{b}',
      substitutionLatex: `t_{${formatLatexNum(targetPct, 1)}} = ${formatLatexNum(targetTime, 5)}\\,\\text{s}`,
      value: targetTime,
      displayValue: formatHT(targetTime, 5),
      unit: 's',
      dependencies: ['h', 'rho', 'cp', 'Dmm', 'targetPct'],
      assumptions: ['En el libro, b redondeado a 0,462 s⁻¹ entrega ≈ 10 s; con precisión completa resulta 9,9413 s'],
      validity: 'ok',
    },
    {
      id: 'c04-s11',
      position: 11,
      label: 'Ilustración térmica T(t) con temperaturas iniciales y del gas',
      law: 'Evaluación temporal con T_i y T_∞',
      why: 'Muestra la temperatura física real en °C al instante objetivo (ej. 0 → 100 °C alcanza 99 °C a t ≈ 9,94 s).',
      formulaLatex: 'T(t) = T_\\infty + (T_i - T_\\infty)e^{-b t}',
      substitutionLatex: `T(${formatLatexNum(targetTime, 3)}\\,\\text{s}) = ${formatLatexNum(Tgas, 1)} + (${formatLatexNum(Ti, 1)} - ${formatLatexNum(Tgas, 1)})(${formatLatexNum(fRemaining, 4)}) = ${formatLatexNum(TAtTarget, 2)}\\,^\\circ\\text{C}`,
      value: TAtTarget,
      displayValue: formatHT(TAtTarget, 2),
      unit: '°C',
      dependencies: ['Ti', 'Tgas', 'targetPct', 'b'],
      assumptions: [`En instante inspeccionado t=${formatHT(tInspect, 2)} s: T = ${formatHT(TAtInspect, 2)} °C (${formatHT(responseFractionAtInspect, 1)} %)`],
      validity: 'ok',
    },
    {
      id: 'c04-s12',
      position: 12,
      label: 'Número de Fourier Fo y verificación de límites físicos',
      law: 'Tiempo adimensional y chequeo dimensional',
      why: 'Comprueba que Fo·Bi = b·t y verifica los límites extremos: t=0 → T=T_i y t→∞ → T→T_∞.',
      formulaLatex: 'Fo = \\frac{\\alpha t}{L_c^2}, \\qquad Fo \\cdot Bi = b \\cdot t = -\\ln(f_{\\text{rem}})',
      substitutionLatex: `\\alpha = ${alpha.toExponential(3)}\\,\\text{m}^2/\\text{s}, \\quad Fo = ${formatLatexNum(FoAtTarget, 1)}, \\quad Fo\\cdot Bi = ${formatLatexNum(FoAtTarget * Bi, 4)}`,
      value: FoAtTarget,
      displayValue: `Fo = ${formatHT(FoAtTarget, 1)} (Fo·Bi = ${formatHT(FoAtTarget * Bi, 3)})`,
      unit: 'adim.',
      dependencies: ['k', 'rho', 'cp', 'Dmm', 'h', 'targetPct'],
      assumptions: ['Identidad exacta Bi·Fo = h·t/(ρ·c_p·L_c) = b·t'],
      validity: 'ok',
    },
  ];

  const checks: ValidationCheck[] = [
    {
      id: 'c04-chk-bi',
      passed: Bi < 0.1,
      severity: Bi >= 0.05 ? 'warning' : 'info',
      explanation: `Criterio de capacidad concentrada satisfecho: Bi = ${formatHT(Bi, 5)} < 0,10.`,
    },
    {
      id: 'c04-chk-fobi',
      passed: Math.abs(FoAtTarget * Bi - b * targetTime) < 1e-6,
      severity: 'info',
      explanation: `Identidad transitoria verificada: Fo·Bi = b·t = ${formatHT(b * targetTime, 4)}.`,
    },
    {
      id: 'c04-chk-target',
      passed: targetPct < 100 && Number.isFinite(targetTime),
      severity: 'info',
      explanation: `Objetivo ${formatHT(targetPct, 1)} % alcanzable en tiempo finito (${formatHT(targetTime, 3)} s).`,
    },
  ];

  const tPlotMax = Math.max(targetTime * 1.35, tau * 5);
  const tCurve = Array.from({ length: 21 }, (_, idx) => {
    const t = (tPlotMax * idx) / 20;
    const temp = Tgas + (Ti - Tgas) * Math.exp(-b * t);
    const pct = (1 - Math.exp(-b * t)) * 100;
    return {
      x: t,
      y: temp,
      label: `t = ${formatHT(t, 2)} s`,
      extra: `Respuesta = ${formatHT(pct, 1)} %`,
    };
  });

  const tGasLine = [
    { x: 0, y: Tgas, label: 'T_∞ inicial' },
    { x: tPlotMax, y: Tgas, label: 'T_∞ final' },
  ];

  const tTargetLine = [
    { x: 0, y: TAtTarget, label: `Umbral ${formatHT(targetPct, 1)} %` },
    { x: tPlotMax, y: TAtTarget, label: `Umbral ${formatHT(targetPct, 1)} %` },
  ];

  return {
    caseId: 'TC-C04',
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
      D,
      Lc,
      Bi,
      b,
      tau,
      fRemaining,
      targetTime,
      TAtTarget,
      FoAtTarget,
      tInspect,
      TAtInspect,
      responseFractionAtInspect,
    },
    primaryMetrics: [
      {
        id: 'Bi',
        label: 'Número de Biot',
        value: formatHT(Bi, 5),
        unit: '< 0,10 válido',
        accent: 'teal',
        bookReference: '0,00100',
      },
      {
        id: 'b',
        label: 'Tasa exponencial b',
        value: formatHT(b, 5),
        unit: 's⁻¹',
        accent: 'blue',
        bookReference: '0,46324 s⁻¹ (0,462 texto)',
      },
      {
        id: 'targetTime',
        label: `Tiempo para ${formatHT(targetPct, 1)} %`,
        value: formatHT(targetTime, 3),
        unit: 's',
        accent: 'amber',
        bookReference: '9,941 s (≈ 10 s)',
      },
      {
        id: 'tau',
        label: 'Constante de tiempo τ',
        value: formatHT(tau, 3),
        unit: 's',
        accent: 'blue',
        bookReference: '2,159 s (63,2 %)',
      },
    ],
    steps,
    checks,
    charts: [
      {
        id: 'c04-response',
        title: 'Curva de respuesta térmica T(t) del termopar',
        subtitle: `Decaimiento exponencial con constante τ = ${formatHT(tau, 2)} s hacia T_∞ = ${formatHT(Tgas, 1)} °C`,
        xLabel: 'Tiempo t (s)',
        yLabel: 'Temperatura de unión T (°C)',
        xDecimals: 2,
        yDecimals: 1,
        markerX: { x: targetTime, label: `t=${formatHT(targetTime, 2)} s (${formatHT(targetPct, 0)} %)`, color: '#F4B860' },
        series: [
          { id: 'temp', name: 'T(t) unión', color: '#54A8FF', showNodes: true, points: tCurve },
          { id: 'gas', name: 'Temperatura gas T_∞', color: '#F87171', dashed: true, showNodes: false, points: tGasLine },
          { id: 'target', name: `Meta ${formatHT(targetPct, 0)} %`, color: '#42D9C0', dashed: true, showNodes: false, points: tTargetLine },
        ],
      },
    ],
    diagramSnapshot: {
      type: 'TC-C04',
      data: {
        Dmm,
        D,
        Lc,
        Bi,
        b,
        tau,
        targetPct,
        targetTime,
        Ti,
        Tgas,
        TAtTarget,
        tInspect,
        TAtInspect,
        responseFractionAtInspect,
        h,
        k,
        invalidLumped: false,
      },
    },
    workshopQuestions: [
      {
        id: 'c04-q1',
        prompt: 'Calcula la longitud característica L_c = D/6 en metros.',
        targetUnit: 'm',
        expectedValue: Lc,
        toleranceRel: 0.02,
        hint: 'Convierte D de milímetros a metros (D = 1 mm = 0,001 m) y divide por 6.',
        explanation: `L_c = ${formatHT(D, 5)} / 6 = ${Lc.toExponential(4)} m.`,
      },
      {
        id: 'c04-q2',
        prompt: 'Calcula el número de Biot Bi = h·L_c / k para verificar si el modelo concentrado es válido.',
        targetUnit: 'adim.',
        expectedValue: Bi,
        toleranceRel: 0.03,
        hint: 'Multiplica h por L_c en metros y divide entre k del metal.',
        explanation: `Bi = (${formatHT(h, 1)} × ${Lc.toExponential(3)}) / ${formatHT(k, 1)} = ${formatHT(Bi, 5)} < 0,1.`,
      },
      {
        id: 'c04-q3',
        prompt: 'Calcula el exponente b = h / (ρ·c_p·L_c).',
        targetUnit: 's⁻¹',
        expectedValue: b,
        toleranceRel: 0.02,
        hint: 'Verifica todas las unidades en kg, m, J, s, K.',
        explanation: `b = ${formatHT(b, 6)} s⁻¹ (τ = 1/b = ${formatHT(tau, 3)} s).`,
      },
      {
        id: 'c04-q4',
        prompt: `Calcula el tiempo necesario para alcanzar el ${formatHT(targetPct, 1)} % de la respuesta.`,
        targetUnit: 's',
        expectedValue: targetTime,
        toleranceRel: 0.02,
        hint: 'Traduce el porcentaje a fracción remanente f = 1 − %/100 y despeja t = −ln(f)/b.',
        explanation: `t = −ln(${formatHT(fRemaining, 4)}) / ${formatHT(b, 5)} = ${formatHT(targetTime, 3)} s.`,
      },
    ],
  };
}
