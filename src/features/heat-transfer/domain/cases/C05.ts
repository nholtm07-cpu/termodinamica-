/**
 * Caso TC-C05: Dimensionamiento de intercambiador de doble tubo (LMTD y verificación ε-NTU).
 * Fuente de datos base: Çengel (3.ª ed.), Ejemplo 11-4, pp. 628–629 (pp. 654–655 PDF) y Ejemplo 11-8 NTU.
 */

import { BOOK_CASE_DEFINITIONS, detectModifiedFields } from '../../data/book-presets';
import type { CalculationStep, DomainIssue, HeatEvaluation, Parameter, ValidationCheck } from '../models';
import { cmToMeters, formatHT, formatLatexNum, kJkgKToJkgK, wattsToKilowatts } from '../units';
import { stableLogMeanDeltaT, validateNumericDomains } from '../validate';

export type HeatExchangerFlowMode = 'counterflow' | 'parallel';

export function evaluateC05(
  inputs: Record<string, Parameter>,
  flowMode: HeatExchangerFlowMode = 'counterflow'
): HeatEvaluation {
  const def = BOOK_CASE_DEFINITIONS['TC-C05'];
  const modifiedFields = detectModifiedFields('TC-C05', inputs);
  const domainError = validateNumericDomains(inputs, ['Tcin', 'TcoutTarget', 'Thin']);

  const mc = inputs.mc.value;
  const cpcKJ = inputs.cpcKJ.value;
  const Tcin = inputs.Tcin.value;
  const Tcout = inputs.TcoutTarget.value;
  const mh = inputs.mh.value;
  const cphKJ = inputs.cphKJ.value;
  const Thin = inputs.Thin.value;
  const Dcm = inputs.Dcm.value;
  const U = inputs.U.value;

  const failEval = (issue: DomainIssue): HeatEvaluation => ({
    caseId: 'TC-C05',
    title: def.title,
    difficulty: def.difficulty,
    source: def.source,
    premise: def.premise,
    assumptions: def.assumptions,
    inputs,
    isModifiedFromBook: modifiedFields.length > 0 || flowMode !== 'counterflow',
    modifiedFields,
    status: 'invalid',
    blockingIssue: issue,
    warnings: [],
    result: { Qdot: null, Thout: null, LMTD: null, A: null, L: null },
    primaryMetrics: [],
    steps: [],
    checks: [{ id: 'domain', passed: false, severity: 'error', explanation: issue.message }],
    charts: [],
    diagramSnapshot: { type: 'TC-C05', data: { invalid: true, flowMode } },
    workshopQuestions: [],
  });

  if (domainError) return failEval(domainError);

  const cpc = kJkgKToJkgK(cpcKJ); // J/(kg·K)
  const cph = kJkgKToJkgK(cphKJ); // J/(kg·K)
  const D = cmToMeters(Dcm); // m

  const Cc = mc * cpc; // W/K
  const Ch = mh * cph; // W/K
  const Qdot = Cc * (Tcout - Tcin); // W
  const Qkw = wattsToKilowatts(Qdot);

  if (Qdot <= 0) {
    return failEval({
      code: 'HX_NEGATIVE_OR_ZERO_HEAT',
      field: 'TcoutTarget',
      message: `La salida fría objetivo (${formatHT(Tcout, 1)} °C) debe ser mayor que la entrada fría (${formatHT(Tcin, 1)} °C).`,
      physicalExplanation:
        'Para dimensionar el calentamiento de la corriente fría se requiere Q̇ > 0. Si T_c,sal ≤ T_c,ent no existe carga térmica positiva de calentamiento.',
      suggestedFix: 'Ajusta T_c,sal por encima de T_c,ent.',
    });
  }

  const Thout = Thin - Qdot / Ch;

  // Diferencias terminales según configuración
  const dT1 = flowMode === 'counterflow' ? Thin - Tcout : Thin - Tcin;
  const dT2 = flowMode === 'counterflow' ? Thout - Tcin : Thout - Tcout;

  if (dT1 <= 0 || dT2 <= 0) {
    return failEval({
      code: 'HX_TEMP_CROSS_VIOLATION',
      field: 'TcoutTarget',
      message:
        flowMode === 'parallel'
          ? `Cruce térmico imposible en flujo paralelo: ΔT₂ = T_h,sal − T_c,sal = ${formatHT(Thout, 2)} − ${formatHT(Tcout, 2)} = ${formatHT(dT2, 2)} K ≤ 0.`
          : `Violación del acercamiento térmico en contraflujo: ΔT₁=${formatHT(dT1, 2)} K, ΔT₂=${formatHT(dT2, 2)} K (ambos deben ser > 0).`,
      physicalExplanation:
        flowMode === 'parallel'
          ? 'En flujo paralelo la corriente fría nunca puede salir a mayor temperatura que la corriente caliente de salida (requeriría área infinita o cruce térmico imposible por Segunda Ley).'
          : 'Por Segunda Ley, en ningún extremo del intercambiador el fluido frío puede superar o igualar la temperatura del fluido caliente en ese mismo extremo con área finita.',
      suggestedFix:
        flowMode === 'parallel'
          ? 'Reduce T_c,sal objetivo, aumenta T_h,ent / caudal caliente, o cambia a arreglo en contraflujo.'
          : 'Reduce T_c,sal objetivo, aumenta T_h,ent o aumenta la capacidad calorífica caliente ṁ_h·c_p,h.',
    });
  }

  const lmtd = stableLogMeanDeltaT(dT1, dT2);
  const A = Qdot / (U * lmtd);
  const L = A / (Math.PI * D);

  // Verificación independiente por método efectividad-NTU (Ejemplo 11-8)
  const Cmin = Math.min(Cc, Ch);
  const Cmax = Math.max(Cc, Ch);
  const Cr = Cmin / Cmax;
  const Qmax = Cmin * (Thin - Tcin);
  const effectiveness = Qdot / Qmax;
  const NTUfromLMTD = (U * A) / Cmin;

  // Recuperar NTU analíticamente desde ε para comparar consistencia exacta con LMTD
  let NTUanalytic: number;
  if (flowMode === 'counterflow') {
    if (Math.abs(Cr - 1) < 1e-8) {
      NTUanalytic = effectiveness / Math.max(1e-12, 1 - effectiveness);
    } else {
      NTUanalytic =
        (1 / (Cr - 1)) * Math.log((effectiveness - 1) / (Cr * effectiveness - 1));
    }
  } else {
    NTUanalytic = -Math.log(1 - effectiveness * (1 + Cr)) / (1 + Cr);
  }
  const AreaFromNTU = (NTUanalytic * Cmin) / U;
  const ntuConsistencyDiff = Math.abs(AreaFromNTU - A);

  const qBalanceHot = Ch * (Thin - Thout);
  const energyResidual = Math.abs(qBalanceHot - Qdot);

  const warnings: string[] = [];
  if (L > 40) {
    warnings.push(
      `Longitud resultante L = ${formatHT(L, 2)} m (> 40 m): para un solo tubo doble recto resulta poco práctico; en ingeniería suele dividirse en múltiples pasos en horquilla o intercambiadores de carcasa y tubos.`
    );
  }
  if (flowMode === 'parallel') {
    warnings.push(
      'Modo alternativo en flujo paralelo activado (el Ejemplo 11-4 original de Çengel usa contraflujo).'
    );
  }

  const steps: CalculationStep[] = [
    {
      id: 'c05-s1',
      position: 1,
      label: 'Esquema y configuración del equipo',
      law: 'Intercambiador de doble tubo',
      why:
        flowMode === 'counterflow'
          ? 'En contraflujo ambas corrientes circulan en sentidos opuestos, manteniendo la fuerza impulsora térmica mejor distribuida y permitiendo que T_c,sal supere a T_h,sal si fuese necesario.'
          : 'En flujo paralelo ambas corrientes entran por el mismo extremo y viajan en la misma dirección.',
      formulaLatex:
        flowMode === 'counterflow'
          ? '\\Delta T_1 = T_{h,\\text{ent}} - T_{c,\\text{sal}}, \\quad \\Delta T_2 = T_{h,\\text{sal}} - T_{c,\\text{ent}}'
          : '\\Delta T_1 = T_{h,\\text{ent}} - T_{c,\\text{ent}}, \\quad \\Delta T_2 = T_{h,\\text{sal}} - T_{c,\\text{sal}}',
      substitutionLatex: `\\text{Arreglo: } ${flowMode === 'counterflow' ? '\\text{Contraflujo}' : '\\text{Flujo paralelo}'}`,
      value: 1,
      displayValue: flowMode === 'counterflow' ? 'Contraflujo' : 'Flujo paralelo',
      unit: 'arreglo',
      dependencies: [],
      assumptions: def.assumptions,
      validity: 'ok',
    },
    {
      id: 'c05-s2',
      position: 2,
      label: 'Conversión explícita de calores específicos y diámetro a SI',
      law: 'Normalización SI (J/(kg·K) y m)',
      why: 'Los calores específicos suelen entregarse en kJ/(kg·K) y los diámetros de tubería en cm; convertir antes evita errores de factor 1000 o 100.',
      formulaLatex: 'c_p(\\text{J/(kg}\\cdot\\text{K)}) = 1000\\,c_p(\\text{kJ/(kg}\\cdot\\text{K)}), \\quad D(\\text{m}) = \\frac{D(\\text{cm})}{100}',
      substitutionLatex: `c_{p,c}=${formatLatexNum(cpc, 0)}\\,\\frac{\\text{J}}{\\text{kg}\\cdot\\text{K}},\\; c_{p,h}=${formatLatexNum(cph, 0)}\\,\\frac{\\text{J}}{\\text{kg}\\cdot\\text{K}},\\; D=${formatLatexNum(D, 4)}\\,\\text{m}`,
      value: D,
      displayValue: `${formatHT(cpc, 0)} / ${formatHT(cph, 0)} J/(kg·K) · D=${formatHT(D, 4)} m`,
      unit: 'SI',
      dependencies: ['cpcKJ', 'cphKJ', 'Dcm'],
      assumptions: ['Valores de c_p constantes en el rango térmico'],
      validity: 'ok',
    },
    {
      id: 'c05-s3',
      position: 3,
      label: 'Tasas de capacidad calorífica de cada corriente (C_c y C_h)',
      law: 'Definición de capacidad calorífica de flujo',
      why: 'C = ṁ·c_p indica cuántos watts se necesitan para variar 1 K la temperatura de esa corriente.',
      formulaLatex: 'C_c = \\dot m_c c_{p,c}, \\qquad C_h = \\dot m_h c_{p,h}',
      substitutionLatex: `C_c = (${formatLatexNum(mc, 2)})(${formatLatexNum(cpc, 0)}) = ${formatLatexNum(Cc, 1)}\\,\\text{W/K}, \\quad C_h = (${formatLatexNum(mh, 2)})(${formatLatexNum(cph, 0)}) = ${formatLatexNum(Ch, 1)}\\,\\text{W/K}`,
      value: Cc,
      displayValue: `C_c = ${formatHT(Cc, 1)} · C_h = ${formatHT(Ch, 1)}`,
      unit: 'W/K',
      dependencies: ['mc', 'cpcKJ', 'mh', 'cphKJ'],
      assumptions: ['Caudales másicos estacionarios sin cambio de fase'],
      validity: 'ok',
    },
    {
      id: 'c05-s4',
      position: 4,
      label: 'Carga térmica requerida por el agua fría (Q̇)',
      law: 'Primera ley en corriente fría',
      why: 'Conocemos entrada, salida objetivo y caudal del agua fría: eso fija la potencia térmica total que debe transferirse.',
      formulaLatex: '\\dot Q = C_c (T_{c,\\text{sal}} - T_{c,\\text{ent}})',
      substitutionLatex: `\\dot Q = (${formatLatexNum(Cc, 1)}\\,\\text{W/K})(${formatLatexNum(Tcout, 2)} - ${formatLatexNum(Tcin, 2)})\\,\\text{K} = ${formatLatexNum(Qdot, 1)}\\,\\text{W} = ${formatLatexNum(Qkw, 3)}\\,\\text{kW}`,
      value: Qdot,
      displayValue: formatHT(Qdot, 1),
      unit: 'W',
      dependencies: ['mc', 'cpcKJ', 'Tcin', 'TcoutTarget'],
      assumptions: ['Sin pérdidas térmicas hacia el entorno del laboratorio'],
      validity: 'ok',
    },
    {
      id: 'c05-s5',
      position: 5,
      label: 'Despeje de la temperatura de salida caliente T_h,sal',
      law: 'Conservación de energía en corriente caliente',
      why: 'La temperatura de salida caliente no se inventa: surge obligatoriamente del balance energético Q̇ = C_h·(T_h,ent − T_h,sal).',
      formulaLatex: 'T_{h,\\text{sal}} = T_{h,\\text{ent}} - \\frac{\\dot Q}{C_h}',
      substitutionLatex: `T_{h,\\text{sal}} = ${formatLatexNum(Thin, 2)} - \\frac{${formatLatexNum(Qdot, 1)}}{${formatLatexNum(Ch, 1)}} = ${formatLatexNum(Thout, 5)}\\,^\\circ\\text{C}`,
      value: Thout,
      displayValue: formatHT(Thout, 4),
      unit: '°C',
      dependencies: ['Thin', 'Qdot', 'mh', 'cphKJ'],
      assumptions: ['Equipo adiabático hacia el ambiente'],
      validity: 'ok',
      algebraNote: 'Partiendo de Q̇ = C_h·(T_h,ent − T_h,sal), se divide por C_h para obtener T_h,ent − T_h,sal = Q̇/C_h y se despeja T_h,sal.',
    },
    {
      id: 'c05-s6',
      position: 6,
      label: 'Diferencias de temperatura en los dos extremos (ΔT₁ y ΔT₂)',
      law: 'Acercamiento térmico terminal',
      why: 'Verifica que el fluido caliente supere siempre al frío en ambos extremos (sin cruce térmico imposible).',
      formulaLatex:
        flowMode === 'counterflow'
          ? '\\Delta T_1 = T_{h,\\text{ent}} - T_{c,\\text{sal}}, \\quad \\Delta T_2 = T_{h,\\text{sal}} - T_{c,\\text{ent}}'
          : '\\Delta T_1 = T_{h,\\text{ent}} - T_{c,\\text{ent}}, \\quad \\Delta T_2 = T_{h,\\text{sal}} - T_{c,\\text{sal}}',
      substitutionLatex: `\\Delta T_1 = ${formatLatexNum(dT1, 3)}\\,\\text{K}, \\qquad \\Delta T_2 = ${formatLatexNum(dT2, 5)}\\,\\text{K}`,
      value: Math.min(dT1, dT2),
      displayValue: `ΔT₁=${formatHT(dT1, 2)} K · ΔT₂=${formatHT(dT2, 3)} K`,
      unit: 'K',
      dependencies: ['Thin', 'Tcin', 'TcoutTarget', 'Thout'],
      assumptions: ['Ambos saltos > 0 garantizan validez termodinámica'],
      validity: 'ok',
    },
    {
      id: 'c05-s7',
      position: 7,
      label: 'Diferencia media logarítmica de temperatura (LMTD)',
      law: 'Integración axial dQ̇ = U·(T_h − T_c)·dA',
      why: 'La diferencia de temperatura decae exponencialmente a lo largo del intercambiador; la media aritmética sobreestimaría el promedio real cuando ΔT₁ y ΔT₂ difieren.',
      formulaLatex: '\\Delta T_{\\text{lm}} = \\frac{\\Delta T_2 - \\Delta T_1}{\\ln(\\Delta T_2 / \\Delta T_1)}',
      substitutionLatex:
        Math.abs(dT1 - dT2) < 1e-6
          ? `\\Delta T_1 \\approx \\Delta T_2 \\implies \\Delta T_{\\text{lm}} = ${formatLatexNum(lmtd, 5)}\\,\\text{K}`
          : `\\Delta T_{\\text{lm}} = \\frac{${formatLatexNum(dT2, 5)} - ${formatLatexNum(dT1, 3)}}{\\ln(${formatLatexNum(dT2, 5)} / ${formatLatexNum(dT1, 3)})} = ${formatLatexNum(lmtd, 5)}\\,\\text{K}`,
      value: lmtd,
      displayValue: formatHT(lmtd, 5),
      unit: 'K',
      dependencies: ['Thin', 'Tcin', 'TcoutTarget', 'Thout'],
      assumptions: ['Factor de corrección F = 1 para doble tubo puro; límite estable si ΔT₁ ≈ ΔT₂'],
      validity: 'ok',
    },
    {
      id: 'c05-s8',
      position: 8,
      label: 'Área superficial de intercambio requerida A',
      law: 'Ecuación de diseño LMTD',
      why: 'Despeja la superficie necesaria de transferencia a partir de Q̇, el coeficiente global U y la fuerza impulsora media ΔT_lm.',
      formulaLatex: '\\dot Q = U A \\Delta T_{\\text{lm}} \\implies A = \\frac{\\dot Q}{U\\,\\Delta T_{\\text{lm}}}',
      substitutionLatex: `A = \\frac{${formatLatexNum(Qdot, 1)}\\,\\text{W}}{(${formatLatexNum(U, 1)}\\,\\text{W/(m}^2\\cdot\\text{K)})(${formatLatexNum(lmtd, 5)}\\,\\text{K})} = ${formatLatexNum(A, 5)}\\,\\text{m}^2`,
      value: A,
      displayValue: formatHT(A, 5),
      unit: 'm²',
      dependencies: ['Qdot', 'U', 'lmtd'],
      assumptions: ['U uniforme sin factor de incrustación adicional'],
      validity: 'ok',
    },
    {
      id: 'c05-s9',
      position: 9,
      label: 'Longitud del tubo interior L = A / (π·D)',
      law: 'Área lateral de cilindro de pared delgada',
      why: 'Convierte el área requerida A en la longitud física necesaria del tubo interior de diámetro D.',
      formulaLatex: 'A = \\pi D L \\implies L = \\frac{A}{\\pi D}',
      substitutionLatex: `L = \\frac{${formatLatexNum(A, 5)}\\,\\text{m}^2}{\\pi (${formatLatexNum(D, 4)}\\,\\text{m})} = ${formatLatexNum(L, 3)}\\,\\text{m}`,
      value: L,
      displayValue: formatHT(L, 2),
      unit: 'm',
      dependencies: ['A', 'Dcm'],
      assumptions: ['Resistencia térmica de la pared metálica despreciable'],
      validity: L > 40 ? 'warning' : 'ok',
    },
    {
      id: 'c05-s10',
      position: 10,
      label: 'Parámetros adimensionales de efectividad–NTU (Ej. 11-8)',
      law: 'Método ε–NTU',
      why: 'Identifica la corriente limitante C_min y mide qué fracción del máximo teórico Q̇_max logra transferir el equipo.',
      formulaLatex: 'C_{\\min}=\\min(C_c,C_h),\\; C_r=\\frac{C_{\\min}}{C_{\\max}},\\; \\varepsilon=\\frac{\\dot Q}{C_{\\min}(T_{h,\\text{ent}}-T_{c,\\text{ent}})}',
      substitutionLatex: `C_{\\min}=${formatLatexNum(Cmin, 1)}\\,\\text{W/K},\\; C_r=${formatLatexNum(Cr, 5)},\\; \\varepsilon=${formatLatexNum(effectiveness, 5)}\\,(${formatLatexNum(effectiveness * 100, 2)}\\%)`,
      value: effectiveness,
      displayValue: `ε = ${formatHT(effectiveness, 5)} (Cr = ${formatHT(Cr, 4)})`,
      unit: 'adim.',
      dependencies: ['Cc', 'Ch', 'Qdot', 'Thin', 'Tcin'],
      assumptions: [`Q̇_max teórico = ${formatHT(wattsToKilowatts(Qmax), 2)} kW`],
      validity: 'ok',
    },
    {
      id: 'c05-s11',
      position: 11,
      label: 'Verificación cruzada NTU analítico vs área LMTD',
      law: 'Equivalencia matemática LMTD ↔ ε–NTU',
      why: 'Demuestra que para un intercambiador de doble tubo ambos métodos resuelven exactamente las mismas ecuaciones diferenciales y recuperan idéntica área.',
      formulaLatex:
        flowMode === 'counterflow'
          ? '\\text{NTU} = \\frac{1}{C_r - 1}\\ln\\left(\\frac{\\varepsilon - 1}{C_r\\varepsilon - 1}\\right), \\quad A_{\\text{NTU}} = \\frac{\\text{NTU}\\cdot C_{\\min}}{U}'
          : '\\text{NTU} = -\\frac{\\ln[1 - \\varepsilon(1+C_r)]}{1+C_r}, \\quad A_{\\text{NTU}} = \\frac{\\text{NTU}\\cdot C_{\\min}}{U}',
      substitutionLatex: `\\text{NTU} = ${formatLatexNum(NTUanalytic, 5)}, \\quad A_{\\text{NTU}} = ${formatLatexNum(AreaFromNTU, 5)}\\,\\text{m}^2\\; (\\Delta = ${ntuConsistencyDiff.toExponential(1)}\\,\\text{m}^2)`,
      value: NTUanalytic,
      displayValue: `NTU = ${formatHT(NTUanalytic, 5)} (A_NTU = ${formatHT(AreaFromNTU, 5)} m²)`,
      unit: 'adim.',
      dependencies: ['U', 'A', 'Cmin', 'Cr', 'effectiveness'],
      assumptions: ['Consistencia numérica sin redondeos intermedios'],
      validity: 'ok',
    },
    {
      id: 'c05-s12',
      position: 12,
      label: 'Comprobación de balance de energía, dimensiones e ingeniería',
      law: 'Auditoría integral',
      why: 'Comprueba que el calor cedido por el agua geotérmica iguala al absorbido por el agua fría y contextualiza si L es constructivamente práctico en un solo paso.',
      formulaLatex: '\\dot Q_h = C_h(T_{h,\\text{ent}}-T_{h,\\text{sal}}) = \\dot Q_c',
      substitutionLatex: `\\dot Q_h = ${formatLatexNum(qBalanceHot, 1)}\\,\\text{W} \\; (|\\Delta|=${energyResidual.toExponential(1)}\\,\\text{W}), \\quad L=${formatHT(L, 2)}\\,\\text{m}`,
      value: L,
      displayValue: `${formatHT(L, 2)} m (residuo ${energyResidual.toExponential(1)} W)`,
      unit: 'm',
      dependencies: ['Qdot', 'Thout', 'L'],
      assumptions: ['Nota de ingeniería: en la práctica un L > 100 m se distribuye en varios pasos'],
      validity: L > 40 ? 'warning' : 'ok',
    },
  ];

  const checks: ValidationCheck[] = [
    {
      id: 'c05-chk-energy',
      passed: energyResidual < 1e-6,
      severity: 'info',
      explanation: `Balance energético exacto entre corrientes fría y caliente (residuo ${energyResidual.toExponential(2)} W).`,
    },
    {
      id: 'c05-chk-ntu',
      passed: ntuConsistencyDiff < 1e-6,
      severity: 'info',
      explanation: `Equivalencia LMTD vs ε–NTU comprobada: A_LMTD = ${formatHT(A, 5)} m² vs A_NTU = ${formatHT(AreaFromNTU, 5)} m².`,
    },
    {
      id: 'c05-chk-length',
      passed: L <= 40,
      severity: L <= 40 ? 'info' : 'warning',
      explanation:
        L <= 40
          ? `Longitud ${formatHT(L, 2)} m dentro de escala compacta.`
          : `Un solo tubo recto de ${formatHT(L, 2)} m es largo en planta; conviene arreglo multipaso o carcasa-tubos.`,
    },
  ];

  // Perfiles axiales exactos T_h(x) y T_c(x) integrando analíticamente por paso x ∈ [0, L]
  const profileTc: Array<{ x: number; y: number; id?: string; label: string }> = [];
  const profileTh: Array<{ x: number; y: number; id?: string; label: string }> = [];
  const Npts = 16;

  for (let i = 0; i <= Npts; i++) {
    const frac = i / Npts;
    const xPos = frac * L;
    const localNTU = (U * (frac * A)) / Cmin;
    if (flowMode === 'counterflow') {
      // En x=0 entra caliente (Th_in) y sale fría (Tc_out)
      // Integración exacta desde x=0 hacia x=L para perfil contraflujo
      const beta = 1 / Ch - 1 / Cc; // negativo si Cc < Ch
      let thVal: number;
      let tcVal: number;
      if (Math.abs(beta) < 1e-12) {
        // C_c = C_h: perfil estrictamente lineal
        thVal = Thin - frac * (Thin - Thout);
        tcVal = Tcout - frac * (Tcout - Tcin);
      } else {
        const expTerm = Math.exp(-U * frac * A * beta);
        const dTx = (Thin - Tcout) * expTerm;
        // Para cualquier x: Th(x) - Tc(x) = dTx y flujo acumulado: Th(0)-Th(x) = (Cc/Ch)(Tc(0)-Tc(x))
        // Usando relación exacta: Th(x) - (Cc/Ch)*Tc(x) = Thin - (Cc/Ch)*Tcout
        const kDiff = Thin - (Cc / Ch) * Tcout;
        const rCap = Cc / Ch;
        tcVal = (kDiff - dTx) / (1 - rCap);
        thVal = tcVal + dTx;
      }
      profileTh.push({
        x: xPos,
        y: thVal,
        id: i === 0 ? 'Th,ent' : i === Npts ? 'Th,sal' : undefined,
        label: `x = ${formatHT(xPos, 1)} m`,
      });
      profileTc.push({
        x: xPos,
        y: tcVal,
        id: i === 0 ? 'Tc,sal' : i === Npts ? 'Tc,ent' : undefined,
        label: `x = ${formatHT(xPos, 1)} m`,
      });
    } else {
      // Flujo paralelo: ambos entran en x = 0
      const gamma = 1 / Ch + 1 / Cc;
      const dTx = (Thin - Tcin) * Math.exp(-U * frac * A * gamma);
      const qCum = ((Thin - Tcin - dTx) / gamma);
      const thVal = Thin - qCum / Ch;
      const tcVal = Tcin + qCum / Cc;
      profileTh.push({
        x: xPos,
        y: thVal,
        id: i === 0 ? 'Th,ent' : i === Npts ? 'Th,sal' : undefined,
        label: `x = ${formatHT(xPos, 1)} m (NTU_x=${formatHT(localNTU, 2)})`,
      });
      profileTc.push({
        x: xPos,
        y: tcVal,
        id: i === 0 ? 'Tc,ent' : i === Npts ? 'Tc,sal' : undefined,
        label: `x = ${formatHT(xPos, 1)} m`,
      });
    }
  }

  // Sensibilidad L(U) manteniendo temperaturas objetivo
  const uCurve = Array.from({ length: 13 }, (_, idx) => {
    const ux = 250 + idx * 100;
    const ax = Qdot / (ux * lmtd);
    const lx = ax / (Math.PI * D);
    return {
      x: ux,
      y: lx,
      label: `U = ${formatHT(ux, 0)} W/(m²·K)`,
      extra: `A = ${formatHT(ax, 2)} m²`,
    };
  });

  return {
    caseId: 'TC-C05',
    title: def.title,
    difficulty: def.difficulty,
    source: def.source,
    premise: def.premise,
    assumptions: def.assumptions,
    inputs,
    isModifiedFromBook: modifiedFields.length > 0 || flowMode !== 'counterflow',
    modifiedFields,
    status: warnings.length > 0 ? 'warning' : 'valid',
    warnings,
    result: {
      Cc,
      Ch,
      Qdot,
      Qkw,
      Thout,
      dT1,
      dT2,
      lmtd,
      A,
      L,
      Cmin,
      Cmax,
      Cr,
      effectiveness,
      NTUanalytic,
      NTUfromLMTD,
      AreaFromNTU,
      flowMode,
    },
    primaryMetrics: [
      {
        id: 'Qdot',
        label: 'Potencia requerida Q̇',
        value: formatHT(Qkw, 2),
        unit: 'kW',
        accent: 'blue',
        bookReference: '300,96 kW (≈ 301 kW)',
      },
      {
        id: 'Thout',
        label: 'Salida caliente T_h,sal',
        value: formatHT(Thout, 2),
        unit: '°C',
        accent: 'red',
        bookReference: '125,09 °C (≈ 125 °C)',
      },
      {
        id: 'lmtd',
        label: 'Media logarítmica LMTD',
        value: formatHT(lmtd, 2),
        unit: 'K',
        accent: 'teal',
        bookReference: '91,97 K (≈ 91,9 K)',
      },
      {
        id: 'L',
        label: 'Longitud del tubo L',
        value: formatHT(L, 2),
        unit: 'm',
        accent: 'amber',
        bookReference: '108,50 m (≈ 109 m)',
      },
    ],
    steps,
    checks,
    charts: [
      {
        id: 'c05-axial',
        title: `Perfiles axiales de temperatura (${flowMode === 'counterflow' ? 'Contraflujo' : 'Flujo paralelo'})`,
        subtitle:
          flowMode === 'counterflow'
            ? 'En x=0 entra caliente y sale fría; en x=L sale caliente y entra fría'
            : 'Ambos fluidos ingresan juntos en x=0 y evolucionan asintóticamente',
        xLabel: 'Posición axial x (m)',
        yLabel: 'Temperatura T (°C)',
        xDecimals: 1,
        yDecimals: 1,
        series: [
          { id: 'th', name: 'Fluido caliente T_h(x)', color: '#F87171', showNodes: true, points: profileTh },
          { id: 'tc', name: 'Agua fría T_c(x)', color: '#54A8FF', showNodes: true, points: profileTc },
        ],
      },
      {
        id: 'c05-lu',
        title: 'Sensibilidad de longitud L respecto al coeficiente global U',
        subtitle: 'Manteniendo caudales y temperaturas objetivo: Q̇ permanece constante y L ∝ 1/U',
        xLabel: 'Coeficiente global U (W/(m²·K))',
        yLabel: 'Longitud requerida L (m)',
        xDecimals: 0,
        yDecimals: 1,
        markerX: { x: U, label: `Actual U=${formatHT(U, 0)}`, color: '#F4B860' },
        series: [{ id: 'lu', name: 'Longitud L(U)', color: '#42D9C0', showNodes: true, points: uCurve }],
      },
    ],
    diagramSnapshot: {
      type: 'TC-C05',
      data: {
        mc,
        mh,
        Tcin,
        Tcout,
        Thin,
        Thout,
        Qdot,
        Qkw,
        dT1,
        dT2,
        lmtd,
        A,
        L,
        Dcm,
        U,
        effectiveness,
        NTUanalytic,
        flowMode,
      },
    },
    workshopQuestions: [
      {
        id: 'c05-q1',
        prompt: 'Calcula la tasa de capacidad calorífica fría C_c = ṁ_c · c_p,c.',
        targetUnit: 'W/K',
        expectedValue: Cc,
        toleranceRel: 0.015,
        hint: 'Convierte c_p,c de kJ/(kg·K) a J/(kg·K) multiplicando por 1000.',
        explanation: `C_c = ${formatHT(mc, 2)} × ${formatHT(cpc, 0)} = ${formatHT(Cc, 1)} W/K.`,
      },
      {
        id: 'c05-q2',
        prompt: 'Calcula la potencia térmica transferida Q̇ = C_c·(T_c,sal − T_c,ent).',
        targetUnit: 'W',
        expectedValue: Qdot,
        toleranceRel: 0.015,
        hint: 'Usa C_c en W/K para obtener directamente Watts (en kW es ≈ 300,96 kW).',
        explanation: `Q̇ = ${formatHT(Cc, 1)} × (${formatHT(Tcout, 1)} − ${formatHT(Tcin, 1)}) = ${formatHT(Qdot, 1)} W.`,
      },
      {
        id: 'c05-q3',
        prompt: 'Despeja la temperatura de salida caliente T_h,sal mediante balance energético.',
        targetUnit: '°C',
        expectedValue: Thout,
        toleranceRel: 0.015,
        hint: 'T_h,sal = T_h,ent − Q̇/(ṁ_h·c_p,h).',
        explanation: `T_h,sal = ${formatHT(Thin, 1)} − ${formatHT(Qdot, 0)}/${formatHT(Ch, 0)} = ${formatHT(Thout, 2)} °C.`,
      },
      {
        id: 'c05-q4',
        prompt: 'Calcula la longitud de tubo necesaria L = A/(π·D).',
        targetUnit: 'm',
        expectedValue: L,
        toleranceRel: 0.025,
        hint: 'Primero calcula LMTD, luego A = Q̇/(U·LMTD) y convierte D a metros (0,015 m).',
        explanation: `LMTD = ${formatHT(lmtd, 2)} K, A = ${formatHT(A, 3)} m², L = ${formatHT(L, 2)} m.`,
      },
    ],
  };
}
