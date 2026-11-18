/**
 * Cátedra interactiva MEC110_1–MEC110_9 + Curso Preparatorio T00.01–T00.04.
 * Implementa el modelo "El Profesor al Lado" con los 10 bloques obligatorios
 * y tres niveles conmutables ('desde-cero' | 'universitario' | 'certamen').
 * Bibliografía de apoyo: Çengel y Boles, Termodinámica 7ª ed. (solo mapeo temático, sin copiar capítulos).
 */

import type { DepthLevel } from '../../core/contracts';

export interface LessonVariable {
  symbol: string;
  name: string;
  unit: string;
  meaning: string;
}

export interface LessonItem {
  id: string;
  unitId: 'U0' | 'U1' | 'U2' | 'U3' | 'U4' | 'U5' | 'U6';
  unitTitle: string;
  sourceModule: string; // ej. 'MEC110_1', 'Preparatorio', etc.
  title: string;
  cengelRef: string;
  initialQuestion: string;
  diagramKind:
    | 'units-balance'
    | 'system-boundary'
    | 'phase-dome'
    | 'piston-pv'
    | 'flow-device'
    | 'boltzmann-box'
    | 'carnot-reservoirs'
    | 'brayton-loop'
    | 'rankine-loop';
  diagramCaption: string;
  levels: Record<
    DepthLevel,
    {
      explanation: string;
      analogyOrInsight: string;
      extraMathNote?: string;
    }
  >;
  variables: LessonVariable[];
  hypotheses: string[];
  formulaLatex: string;
  workedExample: {
    title: string;
    givens: string;
    steps: string[];
    result: string;
    interpretation: string;
  };
  typicalError: {
    mistake: string;
    whyWrong: string;
    correction: string;
  };
  practiceCheck: {
    prompt: string;
    options: string[];
    correctIndex: number;
    hint: string;
    feedbackCorrect: string;
    feedbackIncorrect: string;
  };
  simulatorLink?: {
    tab: 'sim-boltzmann' | 'sim-carnot' | 'sim-brayton' | 'sim-rankine' | 'tools';
    label: string;
  };
}

export const MEC110_UNITS = [
  { id: 'U0' as const, code: 'T00', title: 'Curso Preparatorio Desde Cero', source: 'T00.01–T00.04' },
  { id: 'U1' as const, code: 'MEC110_1–2', title: 'Unidad I · Fundamentos, Fases y Gas Ideal', source: 'MEC110_1–2' },
  { id: 'U2' as const, code: 'MEC110_3–5', title: 'Unidad II · Primera Ley y Equipos de Flujo', source: 'MEC110_3–5' },
  { id: 'U3' as const, code: 'MEC110_6', title: 'Unidad III · Segunda Ley, Boltzmann y Entropía', source: 'MEC110_6' },
  { id: 'U4' as const, code: 'MEC110_7', title: 'Unidad IV · Carnot, Refrigeración y Hielo', source: 'MEC110_7' },
  { id: 'U5' as const, code: 'MEC110_8', title: 'Unidad V · Compresión Multietapa y Brayton', source: 'MEC110_8' },
  { id: 'U6' as const, code: 'MEC110_9', title: 'Unidad VI · Rankine, Recalentamiento y 4×4', source: 'MEC110_9' },
];

export const LESSONS: LessonItem[] = [
  // ======================== UNIDAD 0: PREPARATORIO ========================
  {
    id: 'T00.01',
    unitId: 'U0',
    unitTitle: 'Curso Preparatorio Desde Cero',
    sourceModule: 'Preparatorio T00.01',
    title: 'Unidades SI, Kelvin, kPa y energía vs potencia',
    cengelRef: 'Çengel Cap. 1, §§1-3 a 1-6 (págs. 10–22)',
    initialQuestion: 'Si una central entrega 300 MW y un calefactor entrega 2 kW durante 15 minutos, ¿por qué no puedes sumar MW con kJ directamente?',
    diagramKind: 'units-balance',
    diagramCaption: 'Conversión coherente: Energía [kJ] = Potencia [kW = kJ/s] × Tiempo [s].',
    levels: {
      'desde-cero': {
        explanation:
          'La energía (kJ) mide una cantidad total transferida, como los litros de agua en un estanque. La potencia (kW = kJ/s) mide qué tan rápido ocurre esa transferencia por cada segundo, como el caudal de la llave.',
        analogyOrInsight: 'Analogía: 2 litros por segundo durante 10 segundos entregan 20 litros totales. Nunca confundas velocidad de flujo con cantidad acumulada.',
      },
      universitario: {
        explanation:
          'El motor interno opera en unidades SI base (Pa, K, J/kg, W). Al usar unidades derivadas prácticas (kPa, m³/kg, kJ/kg), recuerda las identidades exactas: 1 kPa·m³ = 1 kJ y 1 kW = 1 kJ/s.',
        analogyOrInsight: 'Las escalas absolutas (K, Pa_abs) son obligatorias en cocientes de Carnot y ecuaciones de estado.',
        extraMathNote: 'T[K] = T[°C] + 273,15; pero ΔT[K] = ΔT[°C]. Nunca sumes 273,15 a una diferencia.',
      },
      certamen: {
        explanation:
          'En problemas de certamen, los errores más costosos provienen de omitir el factor 3600 (kg/h ↔ kg/s o kJ/h ↔ kW), mezclar MPa con kPa en v·Δp, o introducir °C en relaciones de temperaturas.',
        analogyOrInsight: 'Regla de chequeo rápido: escribe cada unidad al costado del número y cancélalas antes de teclear en la calculadora.',
      },
    },
    variables: [
      { symbol: 'E, Q, W', name: 'Energía, calor, trabajo', unit: 'kJ (o MJ)', meaning: 'Cantidad total de energía transferida o almacenada.' },
      { symbol: '\\dot Q, \\dot W', name: 'Flujo de calor o potencia', unit: 'kW = kJ/s', meaning: 'Tasa temporal de transferencia energética.' },
      { symbol: 'T', name: 'Temperatura absoluta', unit: 'K', meaning: 'T[K] = T[°C] + 273,15.' },
      { symbol: 'p_{\\text{abs}}', name: 'Presión absoluta', unit: 'kPa, MPa', meaning: 'p_abs = p_manométrica + p_atm.' },
    ],
    hypotheses: ['Sistema Internacional coherente', 'Atmósfera estándar ≈ 101,3 kPa si no se indica otra'],
    formulaLatex: String.raw`Q = \dot Q \cdot \Delta t, \qquad 1\;\mathrm{kPa}\cdot\mathrm{m}^3 = 1\;\mathrm{kJ}, \qquad T[\mathrm{K}] = T[^\circ\mathrm{C}] + 273{,}15`,
    workedExample: {
      title: 'Calefactor de 2 kW en 15 minutos',
      givens: 'Ẇ = 2 kW = 2 kJ/s; Δt = 15 min',
      steps: [
        '1) Convertir minutos a segundos: Δt = 15 × 60 = 900 s.',
        '2) Multiplicar potencia por tiempo: Q = (2 kJ/s) × (900 s) = 1800 kJ.',
      ],
      result: 'Q = 1800 kJ (= 1,8 MJ)',
      interpretation: 'En 15 minutos se transfieren 1800 kJ de energía térmica.',
    },
    typicalError: {
      mistake: 'Sumar 273,15 a un ΔT o usar kW como si fuera kJ.',
      whyWrong: 'Al restar (T2 + 273,15) − (T1 + 273,15), el 273,15 se cancela exactamente.',
      correction: 'Convierte a K solo temperaturas absolutas individuales; en diferencias ΔT(K) = ΔT(°C).',
    },
    practiceCheck: {
      prompt: 'Si una máquina extrae 7200 kJ/h de calor, ¿a cuántos kW equivale?',
      options: ['0,5 kW', '2,0 kW', '120 kW', '7,2 kW'],
      correctIndex: 1,
      hint: '1 hora tiene 3600 segundos; divide kJ/h por 3600 para obtener kJ/s (= kW).',
      feedbackCorrect: 'Exacto: 7200 / 3600 = 2,0 kJ/s = 2,0 kW.',
      feedbackIncorrect: 'Revisa el factor temporal: 1 h = 3600 s, no 60 s ni 1000 s.',
    },
    simulatorLink: { tab: 'tools', label: 'Abrir Conversor SI y Verificador Dimensional' },
  },
  {
    id: 'T00.02',
    unitId: 'U0',
    unitTitle: 'Curso Preparatorio Desde Cero',
    sourceModule: 'Preparatorio T00.02–04',
    title: 'Álgebra, logaritmos, interpolación lineal y método en 7 pasos',
    cengelRef: 'Çengel Cap. 1, §1-12 (págs. 30–33)',
    initialQuestion: '¿Cómo estimas una propiedad a 210 °C si la tabla solo muestra filas de 200 °C y 220 °C?',
    diagramKind: 'units-balance',
    diagramCaption: 'Interpolación lineal: proporción α = (x − x0)/(x1 − x0) aplicada entre filas vecinas.',
    levels: {
      'desde-cero': {
        explanation:
          'Interpolar es avanzar la misma fracción en la columna de salida que avanzaste en la columna de entrada. Si 210 °C está justo a la mitad entre 200 y 220 °C, el resultado estará justo a la mitad entre sus entalpías.',
        analogyOrInsight: 'Analogía: caminar la mitad del camino entre dos postes te deja a la mitad de la altura si la rampa es recta.',
      },
      universitario: {
        explanation:
          'Además de interpolación lineal y logaritmos naturales ln (base e, clave en W_iso y Δs = cp ln(T2/T1) − R ln(p2/p1)), toda resolución estructurada sigue 7 pasos: frontera → hipótesis → modelo → propiedades → unidades → balances → verificación física.',
        analogyOrInsight: 'Nunca interpoles linealmente atravesando la campana de saturación (fase cambia bruscamente).',
      },
      certamen: {
        explanation:
          'En problemas de certamen con doble interpolación (ej. p y T en vapor sobrecalentado), mantén 4–5 cifras significativas en α para evitar deriva acumulada en entropías s.',
        analogyOrInsight: 'Chequea siempre que el valor interpolado quede acotado entre y0 e y1.',
      },
    },
    variables: [
      { symbol: '\\alpha', name: 'Fracción de interpolación', unit: 'adimensional', meaning: 'Posición relativa entre x0 y x1 (0 <= α <= 1).' },
      { symbol: '\\ln(x)', name: 'Logaritmo natural', unit: 'adimensional', meaning: 'Logaritmo en base e ≈ 2,71828 (ln 1 = 0, ln 2 ≈ 0,6931).' },
    ],
    hypotheses: ['Variación aproximadamente lineal entre filas adyacentes de la misma fase'],
    formulaLatex: String.raw`\alpha = \frac{x - x_0}{x_1 - x_0}, \qquad y = y_0 + \alpha (y_1 - y_0)`,
    workedExample: {
      title: 'Interpolación de entalpía a 210 °C (datos didácticos)',
      givens: 'h(200 °C) = 2800 kJ/kg; h(220 °C) = 2840 kJ/kg; objetivo T = 210 °C',
      steps: [
        '1) α = (210 − 200) / (220 − 200) = 10 / 20 = 0,50.',
        '2) h = 2800 + 0,50 × (2840 − 2800) = 2800 + 20 = 2820 kJ/kg.',
      ],
      result: 'h ≈ 2820 kJ/kg',
      interpretation: 'Queda exactamente entre 2800 y 2840, consistente con α = 0,5.',
    },
    typicalError: {
      mistake: 'Usar log₁₀ (tecla LOG) en vez de ln (tecla LN), o extrapolar cruzando una curva de saturación.',
      whyWrong: 'La integración de dT/T y dV/V produce exactamente logaritmo natural ln.',
      correction: 'Verifica siempre ln(2) ≈ 0,6931 (no 0,3010) y confirma la fase antes de interpolar.',
    },
    practiceCheck: {
      prompt: 'Si s(2,0 MPa) = 7,4317 y s(2,5 MPa) = 7,3234, ¿en qué rango debe quedar la presión interpolada para s = 7,3988?',
      options: ['Menor que 2,0 MPa', 'Entre 2,0 y 2,25 MPa', 'Entre 2,25 y 2,5 MPa', 'Mayor que 2,5 MPa'],
      correctIndex: 1,
      hint: '7,3988 está más cerca de 7,4317 (2,0 MPa) que de 7,3234 (2,5 MPa).',
      feedbackCorrect: 'Correcto: α ≈ 0,3034 → p ≈ 2,152 MPa (¡el mismo cálculo del Caso 4B Rankine!).',
      feedbackIncorrect: 'Compara distancias: |7,3988 − 7,4317| = 0,0329 es menor que la mitad del intervalo total (0,1083).',
    },
    simulatorLink: { tab: 'tools', label: 'Practicar en Calculadora de Interpolación' },
  },

  // ======================== UNIDAD I: MEC110_1 y MEC110_2 ========================
  {
    id: 'T01.01',
    unitId: 'U1',
    unitTitle: 'Unidad I · Fundamentos, Fases y Gas Ideal',
    sourceModule: 'MEC110_1 · Diapos introductorias',
    title: '¿Qué estudia la termodinámica? Sistemas, propiedades y centrales',
    cengelRef: 'Çengel Cap. 1, §§1-1 a 1-5 (págs. 2–16)',
    initialQuestion: 'Si divides una sala llena de aire con un tabique, ¿qué propiedades quedan iguales en cada mitad y cuáles se reducen a la mitad?',
    diagramKind: 'system-boundary',
    diagramCaption: 'Sistema cerrado (masa fija) vs Volumen de control (masa cruza la frontera).',
    levels: {
      'desde-cero': {
        explanation:
          'La termodinámica estudia cómo la energía se transforma entre calor, trabajo y energía interna de la materia. Para analizar cualquier equipo, primero trazas una frontera imaginaria: si la masa no la cruza es un sistema cerrado; si entra o sale fluido, es un volumen de control.',
        analogyOrInsight: 'Analogía: la temperatura de un vaso de agua es la misma que la de la jarra de donde salió (intensiva), pero su masa y volumen son menores (extensivas).',
      },
      universitario: {
        explanation:
          'Las propiedades intensivas (T, p, ρ, v, u, h, s) son independientes de la masa del sistema; las extensivas (m, V, U, H, S, E) son proporcionales a ella. Dividir una propiedad extensiva por m produce su propiedad específica.',
        analogyOrInsight: 'Postulado de estado: un sistema compresible simple requiere dos propiedades intensivas independientes (ojo: en saturación p y T NO son independientes).',
      },
      certamen: {
        explanation:
          'Errores frecuentes en clasificación: confundir sistema adiabático (Q = 0, puede tener W) con sistema aislado (Q = 0, W = 0, Δm = 0), o asumir que una olla hirviendo sin tapa es un sistema cerrado.',
        analogyOrInsight: 'Regla práctica: pregunta siempre "¿entra o sale masa por mi frontera dibujada?" antes de escoger entre u (cerrado) y h (abierto).',
      },
    },
    variables: [
      { symbol: 'm', name: 'Masa', unit: 'kg', meaning: 'Propiedad extensiva.' },
      { symbol: 'v = V/m', name: 'Volumen específico', unit: 'm³/kg', meaning: 'Inverso de densidad ρ = 1/v (intensiva).' },
      { symbol: 'e = u + V_f^2/2 + gz', name: 'Energía total específica', unit: 'kJ/kg', meaning: 'Suma de interna, cinética y potencial.' },
    ],
    hypotheses: ['Sustancia simple compresible', 'Equilibrio termodinámico local en estados extremos'],
    formulaLatex: String.raw`v = \frac{V}{m} = \frac{1}{\rho}, \qquad E = U + E_c + E_p = U + \frac{1}{2}m V_f^2 + mgz`,
    workedExample: {
      title: 'Propiedades intensivas vs extensivas en tanque dividido',
      givens: 'Tanque de V = 3 m³ con m = 6 kg de gas, dividido en dos tanques idénticos.',
      steps: [
        '1) Volumen específico original: v = V/m = 3 / 6 = 0,5 m³/kg; ρ = 1/0,5 = 2 kg/m³.',
        '2) En cada mitad: m_mitad = 3 kg, V_mitad = 1,5 m³ → v = 1,5 / 3 = 0,5 m³/kg (no cambia).',
      ],
      result: 'v = 0,5 m³/kg; ρ = 2 kg/m³',
      interpretation: 'v y ρ son intensivas; m y V son extensivas.',
    },
    typicalError: {
      mistake: 'Decir que "temperatura y presión fijan siempre el estado del agua".',
      whyWrong: 'Cuando hierve agua a 100 °C y 101,3 kPa, coexisten líquido y vapor con la misma T y p pero distinta entalpía.',
      correction: 'En mezcla saturada necesitas además calidad x, volumen específico v, entalpía h o entropía s.',
    },
    practiceCheck: {
      prompt: 'Una turbina de vapor en operación continua es:',
      options: ['Un sistema cerrado aislado', 'Un volumen de control (sistema abierto)', 'Un sistema rígido sin flujo', 'Un sistema sin trabajo'],
      correctIndex: 1,
      hint: 'El vapor entra continuamente por alta presión y sale por baja presión.',
      feedbackCorrect: 'Correcto: la masa cruza la frontera constantemente, por lo que es un volumen de control.',
      feedbackIncorrect: 'Observa que el vapor atraviesa la turbina; no queda encerrado como en un cilindro sellado.',
    },
  },
  {
    id: 'T02.05',
    unitId: 'U1',
    unitTitle: 'Unidad I · Fundamentos, Fases y Gas Ideal',
    sourceModule: 'MEC110_2 · Sustancias puras y Gas Ideal',
    title: 'Fases del agua, calidad x, tablas IF97 y ecuación de gas ideal',
    cengelRef: 'Çengel Cap. 3, §§3-2 a 3-6 (págs. 112–137)',
    initialQuestion: 'Si tienes agua a 100 kPa con calidad x = 0,25, ¿significa que un cuarto del volumen del estanque es vapor?',
    diagramKind: 'phase-dome',
    diagramCaption: 'Campana T-s real IAPWS-IF97: líquido comprimido → mezcla saturada (0 ≤ x ≤ 1) → vapor sobrecalentado.',
    levels: {
      'desde-cero': {
        explanation:
          'No: la calidad x = m_vapor / m_total mide fracción de MASA, no de volumen. Como el vapor ocupa cientos de veces más volumen por kilogramo que el líquido, un 25 % de masa en vapor suele ocupar casi todo el volumen del recipiente.',
        analogyOrInsight: 'Analogía: 1 kg de plumas ocupa mucho más espacio que 1 kg de agua, aunque ambos pesen lo mismo.',
      },
      universitario: {
        explanation:
          'En la región bifásica saturada (0 ≤ x ≤ 1), cualquier propiedad específica aditiva por masa cumple y = y_f + x(y_g − y_f). Para gases lejos de saturación/punto crítico aplica pV = mRT (o pv = ZRT con factor de compresibilidad Z).',
        analogyOrInsight: 'Nunca reportes calidad x para vapor sobrecalentado o líquido comprimido: allí x no está definida.',
      },
      certamen: {
        explanation:
          'Ruta de decisión de fase a presión p conocida: compara T con T_sat(p) (o s con s_f, s_g; h con h_f, h_g). Solo si y_f ≤ y ≤ y_g estás en mezcla y calculas x = (y − y_f)/y_fg.',
        analogyOrInsight: 'Este chequeo previo evita el error clásico de usar tablas de saturación para vapor a 500 °C y 10 MPa.',
      },
    },
    variables: [
      { symbol: 'x', name: 'Calidad (título)', unit: 'kg_g / kg_total', meaning: 'Definida solo en mezcla saturada 0 <= x <= 1.' },
      { symbol: 'y_f, y_g', name: 'Propiedad de líquido/vapor saturado', unit: 'según y', meaning: 'Bordes izquierdo (x=0) y derecho (x=1) de la campana.' },
      { symbol: 'R', name: 'Constante específica del gas', unit: 'kJ/(kg·K)', meaning: 'Para aire seco estándar R ≈ 0,287 kJ/(kg·K).' },
    ],
    hypotheses: ['Equilibrio líquido-vapor en mezcla saturada', 'Para gas ideal: bajas presiones relativas y altas temperaturas respecto al punto crítico'],
    formulaLatex: String.raw`y = y_f + x(y_g - y_f), \qquad x = \frac{y - y_f}{y_{fg}}, \qquad pV = mRT`,
    workedExample: {
      title: 'Mezcla didáctica y masa de aire ideal',
      givens: 'Parte A (tabla didáctica): h_f=200, h_g=2600 kJ/kg, x=0,25. Parte B: aire p=200 kPa, V=0,5 m³, T=300 K.',
      steps: [
        'A1) h_fg = 2600 − 200 = 2400 kJ/kg → h = 200 + 0,25 × 2400 = 800 kJ/kg.',
        'B1) m = pV/(RT) = (200 × 0,5) / (0,287 × 300) = 100 / 86,1 ≈ 1,1614 kg.',
      ],
      result: 'h = 800 kJ/kg (didáctico) | m ≈ 1,1614 kg',
      interpretation: 'Ambos cálculos muestran consistencia dimensional directa.',
    },
    typicalError: {
      mistake: 'Escribir x = 1,15 cuando h > h_g, o usar °C en pV = mRT.',
      whyWrong: 'Si h > h_g el fluido ya es vapor sobrecalentado; no hay líquido coexistiendo.',
      correction: 'Comprueba primero h_f ≤ h ≤ h_g; si h > h_g pasa a Región 2 (vapor sobrecalentado).',
    },
    practiceCheck: {
      prompt: 'A 10 MPa y 500 °C (Tsat ≈ 311 °C), el agua se encuentra en fase:',
      options: ['Líquido comprimido', 'Mezcla saturada con x = 0,8', 'Vapor sobrecalentado (x no aplica)', 'Sólido'],
      correctIndex: 2,
      hint: 'Compara T = 500 °C con T_sat(10 MPa) ≈ 311 °C.',
      feedbackCorrect: 'Correcto: T > T_sat, por lo que es vapor sobrecalentado (Región 2 IF97) y la calidad no aplica.',
      feedbackIncorrect: 'Como 500 °C > 311 °C a la misma presión de 10 MPa, ya superó completamente la evaporación.',
    },
    simulatorLink: { tab: 'tools', label: 'Consultar Tablas IAPWS-IF97 en Vivo' },
  },

  // ======================== UNIDAD II: MEC110_3, 4 y 5 ========================
  {
    id: 'T03.01',
    unitId: 'U2',
    unitTitle: 'Unidad II · Primera Ley y Equipos de Flujo',
    sourceModule: 'MEC110_3 · Sistemas cerrados',
    title: 'Calor, trabajo de frontera P-v y Primera Ley en sistemas cerrados',
    cengelRef: 'Çengel Cap. 2 & Cap. 4, §§4-1 a 4-4 (págs. 166–184)',
    initialQuestion: 'Si comprimes aire rápidamente en una jeringa tapada, ¿por qué se calienta incluso si nadie le encendió un mechero?',
    diagramKind: 'piston-pv',
    diagramCaption: 'Trabajo de frontera W_b = ∫ P dV equivale al área bajo la curva en el diagrama P-V.',
    levels: {
      'desde-cero': {
        explanation:
          'Al empujar el émbolo realizas trabajo sobre el aire (W < 0 bajo la convención "trabajo hecho por el sistema es positivo"). Por conservación de energía (Q − W = ΔU), ese trabajo entra al gas y eleva su energía interna U y su temperatura.',
        analogyOrInsight: 'Analogía: el bombín de bicicleta se calienta al inflar una rueda por trabajo de compresión, no porque reciba calor del aire frío.',
      },
      universitario: {
        explanation:
          'Convención canónica: Q > 0 entra al sistema; W > 0 sale del sistema → Q − W = ΔU + ΔEc + ΔEp. Para procesos cuasiestáticos: W_b = p(V2−V1) si p=cte; W_b = mRT ln(V2/V1) si isotérmico ideal; W_b = (p2V2−p1V1)/(1−n) si politrópico n≠1.',
        analogyOrInsight: 'En un tanque rígido ΔV = 0 anula el trabajo de frontera W_b, pero aún podría haber trabajo de eje o eléctrico.',
      },
      certamen: {
        explanation:
          'Para gas ideal con calores específicos constantes: ΔU = m c_v ΔT siempre (no solo a volumen constante), y ΔH = m c_p ΔT siempre. Ojo: c_p > c_v porque c_p − c_v = R.',
        analogyOrInsight: 'Revisa los signos antes de despejar: si sale Q < 0 significa que el sistema rechazó calor hacia el entorno.',
      },
    },
    variables: [
      { symbol: 'Q', name: 'Calor neto entrante', unit: 'kJ', meaning: 'Positivo cuando entra al sistema.' },
      { symbol: 'W_b', name: 'Trabajo de frontera móvil', unit: 'kJ', meaning: 'Positivo en expansión (V2 > V1).' },
      { symbol: 'c_v, c_p', name: 'Calores específicos', unit: 'kJ/(kg·K)', meaning: 'Aire estándar: cv=0,718; cp=1,005; k=1,4.' },
    ],
    hypotheses: ['Proceso cuasiestático mecánico', 'Sin trabajo eléctrico/eje adicional salvo indicación', 'Gas ideal con cv constante'],
    formulaLatex: String.raw`Q - W = \Delta U = m c_v (T_2 - T_1), \qquad W_b = \int_{V_1}^{V_2} p\,dV`,
    workedExample: {
      title: 'Calentamiento de aire en recipiente rígido',
      givens: 'm = 2 kg aire, cv = 0,718 kJ/(kg·K), T1 = 300 K → T2 = 400 K, V = cte.',
      steps: [
        '1) Recipiente rígido sin eje → W = 0.',
        '2) ΔU = m·cv·(T2 − T1) = 2 × 0,718 × (400 − 300) = 143,6 kJ.',
        '3) Q = ΔU + W = 143,6 + 0 = 143,6 kJ.',
      ],
      result: 'Q = 143,6 kJ',
      interpretation: 'Toda la energía entregada como calor eleva la energía interna del gas.',
    },
    typicalError: {
      mistake: 'Usar m·cp·ΔT para ΔU en recipiente rígido, o confundir W_b cerrado con trabajo de compresor abierto.',
      whyWrong: 'ΔU de un gas ideal siempre usa cv (no cp), mientras ΔH usa cp.',
      correction: 'Memoriza con lógica física: ΔU = m cv ΔT; ΔH = m cp ΔT.',
    },
    practiceCheck: {
      prompt: 'Un gas recibe 300 kJ de calor y realiza 100 kJ de trabajo sobre un pistón (sin ΔEc ni ΔEp). ¿Cuánto cambia su energía interna ΔU?',
      options: ['400 kJ', '200 kJ', '−200 kJ', '100 kJ'],
      correctIndex: 1,
      hint: 'Aplica ΔU = Q − W con Q = +300 kJ y W = +100 kJ.',
      feedbackCorrect: 'Exacto: ΔU = 300 − 100 = +200 kJ.',
      feedbackIncorrect: 'Revisa los signos: el trabajo realizado POR el gas se resta del calor recibido.',
    },
  },
  {
    id: 'T04.01',
    unitId: 'U2',
    unitTitle: 'Unidad II · Primera Ley y Equipos de Flujo',
    sourceModule: 'MEC110_4 & MEC110_5 · Volúmenes de control',
    title: 'Entalpía, equipos estacionarios (turbina, bomba, tobera, válvula) y flujo transitorio',
    cengelRef: 'Çengel Cap. 5, §§5-1 a 5-5 (págs. 220–244)',
    initialQuestion: '¿Por qué en una turbina o caldera usamos entalpía h en vez de energía interna u?',
    diagramKind: 'flow-device',
    diagramCaption: 'Volumen de control estacionario: h = u + pv agrupa energía interna + trabajo de flujo.',
    levels: {
      'desde-cero': {
        explanation:
          'Cuando un fluido entra o sale de una máquina por una tubería, el fluido de atrás debe empujarlo para vencer la presión. Ese trabajo de empuje (p·v) se suma automáticamente a la energía interna u formando una sola magnitud cómoda: la entalpía h = u + p·v.',
        analogyOrInsight: 'Analogía: entrar a una sala llena de gente requiere llevar tu propia energía más el esfuerzo de abrirte paso.',
      },
      universitario: {
        explanation:
          'Balance estacionario SISO: Q̇ − Ẇ = ṁ[(h2 − h1) + (Vf2² − Vf1²)/2000 + g(z2 − z1)/1000]. En flujo transitorio (ej. llenado de tanque rígido): m2 − m1 = Σm_in − Σm_out y U2 − U1 = Q − W + Σm_in·h_in − Σm_out·h_out.',
        analogyOrInsight: 'Cada equipo desprecia términos distintos: tobera conserva ΔEc; válvula cumple h2 ≈ h1 (¡NO s2 = s1!); bomba usa w_s ≈ v·Δp.',
      },
      certamen: {
        explanation:
          'Hoja de chequeo rápido: en tobera multiplicar Δh [kJ/kg] por 2000 bajo la raíz cuadrada; en intercambiadores de calor elegir la frontera global (Q̇_ext = 0) para igualar ṁ_h Δh_h = ṁ_c Δh_c.',
        analogyOrInsight: 'En válvula de estrangulación recuerda: h1 ≈ h2, pero la presión cae y la entropía SIEMPRE aumenta (irreversible).',
      },
    },
    variables: [
      { symbol: 'h = u + pv', name: 'Entalpía específica', unit: 'kJ/kg', meaning: 'Energía transportada por unidad de masa que cruza la frontera.' },
      { symbol: '\\dot m', name: 'Caudal másico', unit: 'kg/s', meaning: 'ṁ = ρ · A · V_f.' },
      { symbol: 'w_{B,s}', name: 'Trabajo ideal de bomba', unit: 'kJ/kg', meaning: 'w_B,s ≈ v_f (p2 − p1) con v en m³/kg y p en kPa.' },
    ],
    hypotheses: ['Régimen estacionario (dE_CV/dt = 0) para equipos continuos', 'Flujo uniforme en puertos de entrada/salida'],
    formulaLatex: String.raw`\dot Q - \dot W = \dot m\left[(h_2 - h_1) + \frac{V_{f2}^2 - V_{f1}^2}{2000} + \frac{g(z_2 - z_1)}{1000}\right]`,
    workedExample: {
      title: 'Turbina de vapor y tobera adiabática',
      givens: 'Turbina: h1=3200, h2=2700 kJ/kg, ṁ=2 kg/s. Tobera: Δh=50 kJ/kg, V1≈0.',
      steps: [
        '1) Turbina: w_t = 3200 − 2700 = 500 kJ/kg → Ẇ_t = 2 × 500 = 1000 kW = 1 MW.',
        '2) Tobera: V2 = √(2 × 1000 × 50) = √100000 ≈ 316,2 m/s.',
      ],
      result: 'Ẇ_t = 1 MW | V2 ≈ 316,2 m/s',
      interpretation: 'El factor 1000 en la tobera convierte kJ/kg a m²/s².',
    },
    typicalError: {
      mistake: 'Suponer que una válvula de estrangulación es isentrópica (s1 = s2) o que T1 = T2 siempre.',
      whyWrong: 'La estrangulación es un proceso irreversible con generación de entropía; lo que se conserva es h (h1 ≈ h2).',
      correction: 'Para válvulas y trampas de vapor fija h_salida = h_entrada.',
    },
    practiceCheck: {
      prompt: 'En una bomba de agua líquida (v = 0,001 m³/kg) que eleva la presión de 100 kPa a 1100 kPa con η_B = 80 %, ¿cuánto trabajo real consume por kg?',
      options: ['0,80 kJ/kg', '1,00 kJ/kg', '1,25 kJ/kg', '1000 kJ/kg'],
      correctIndex: 2,
      hint: 'w_s = 0,001 × (1100 − 100) = 1,00 kJ/kg; una bomba real consume w_s / η_B.',
      feedbackCorrect: 'Exacto: w_real = 1,00 / 0,80 = 1,25 kJ/kg.',
      feedbackIncorrect: 'Recuerda dividir por η_B (una bomba real requiere MÁS trabajo que la ideal).',
    },
  },

  // ======================== UNIDAD III: MEC110_6 ========================
  {
    id: 'T06.02',
    unitId: 'U3',
    unitTitle: 'Unidad III · Segunda Ley, Boltzmann y Entropía',
    sourceModule: 'MEC110_6 · Segunda ley estadística',
    title: 'Caja molecular, combinatoria C(N,n), entropía de Boltzmann y equilibrio E + E\' = 13',
    cengelRef: 'Çengel Cap. 6, §§6-1 a 6-3 y Cap. 7, §7-1 (págs. 280, 332)',
    initialQuestion: 'Si retiras el tabique que encierra 200 moléculas en la mitad izquierda de una caja, ¿por qué jamás las ves volver todas juntas a la izquierda?',
    diagramKind: 'boltzmann-box',
    diagramCaption: 'Distribución binomial C(N, n)/2^N y entropía estadística S = k_B ln Ω.',
    levels: {
      'desde-cero': {
        explanation:
          'No está prohibido por las leyes del movimiento individual, pero hay tantísimas más formas de repartirse mitad y mitad que todas en un rincón. Para N=40 ya existen más de 137 mil millones de configuraciones 20/20 frente a solo 1 configuración 40/0.',
        analogyOrInsight: 'Analogía: si lanzas 200 monedas al aire, todas podrían salir cara, pero la probabilidad es 1 entre 10⁶⁰.',
      },
      universitario: {
        explanation:
          'La multiplicidad Ω(n) = N!/[n!(N−n)!] define la entropía estadística S = k_B ln Ω. Al poner en contacto dos sistemas con energía fija E_tot = E + E\', la partición de equilibrio maximiza Ω_A(E)·Ω_B(E_tot−E), lo que equivale a ∂S_A/∂E_A = ∂S_B/∂E_B → T_A = T_B.',
        analogyOrInsight: 'Desviación típica relativa σ/N = 1/(2√N): explica por qué las fluctuaciones relativas desaparecen al aumentar N.',
      },
      certamen: {
        explanation:
          'Evita la analogía imprecisa "entropía = desorden". En termodinámica estadística corresponde a multiplicidad de microestados accesibles; en cálculos numéricos con N >= 40 usar ln Γ(N+1) para evitar desbordamiento factorial.',
        analogyOrInsight: 'Un sistema puede reducir su entropía local siempre que el entorno aumente su entropía al menos en igual magnitud (S_gen >= 0).',
      },
    },
    variables: [
      { symbol: '\\Omega', name: 'Multiplicidad de microestados', unit: 'adimensional', meaning: 'Número de arreglos microscópicos compatibles con un macroestado.' },
      { symbol: 'k_B', name: 'Constante de Boltzmann', unit: '1,380649×10⁻²³ J/K', meaning: 'Conecta conteo estadístico con escala térmica Kelvin.' },
      { symbol: 'S', name: 'Entropía', unit: 'J/K (o kJ/K)', meaning: 'S = k_B ln Ω.' },
    ],
    hypotheses: ['Microestados equiprobables bajo restricciones dadas', 'Modelo estadístico discreto independiente'],
    formulaLatex: String.raw`C(N,n) = \frac{N!}{n!(N-n)!}, \qquad P(n)=\frac{C(N,n)}{2^N}, \qquad S = k_B \ln \Omega`,
    workedExample: {
      title: 'Caja con N = 4 moléculas',
      givens: 'N = 4 moléculas distinguibles entre mitad izquierda (n) y derecha.',
      steps: [
        '1) Total de asignaciones: 2⁴ = 16.',
        '2) Multiplicidades: C(4,0)=1, C(4,1)=4, C(4,2)=6, C(4,3)=4, C(4,4)=1.',
        '3) Estado de equilibrio 2/2: P(2) = 6/16 = 37,5 % (mayor que cualquier otro macroestado).',
      ],
      result: 'Distribución exacta [1, 4, 6, 4, 1]/16',
      interpretation: 'Con N=4 aún hay fluctuaciones frecuentes; al subir a N=200 la campana se vuelve muy angosta.',
    },
    typicalError: {
      mistake: 'Confundir "equilibrio" con ausencia total de fluctuaciones, o calcular N! directamente para N=200.',
      whyWrong: 'En JavaScript 171! ya da Infinity (desbordamiento IEEE-754).',
      correction: 'Calcula ln C(N,n) = ln Γ(N+1) − ln Γ(n+1) − ln Γ(N−n+1) antes de exponenciar.',
    },
    practiceCheck: {
      prompt: 'En la caja simétrica con N = 2 moléculas, ¿cuál es la probabilidad P(n = 1) de tener una en cada lado?',
      options: ['25 %', '37,5 %', '50 %', '100 %'],
      correctIndex: 2,
      hint: 'Las 4 asignaciones son LL, LR, RL, RR.',
      feedbackCorrect: 'Correcto: LR y RL son 2 de 4 configuraciones posibles → 2/4 = 50 %.',
      feedbackIncorrect: 'Enumera los 4 casos: LL (n=2), LR (n=1), RL (n=1), RR (n=0).',
    },
    simulatorLink: { tab: 'sim-boltzmann', label: 'Experimentar en Simulador 1 (Caja Molecular)' },
  },
  {
    id: 'T06.05',
    unitId: 'U3',
    unitTitle: 'Unidad III · Segunda Ley, Boltzmann y Entropía',
    sourceModule: 'MEC110_6 · Relaciones Tds y Eficiencias',
    title: 'Relaciones Tds, generación de entropía S_gen y eficiencias isentrópicas',
    cengelRef: 'Çengel Cap. 7, §§7-3 a 7-13 (págs. 340–377)',
    initialQuestion: 'Si una turbina y un compresor tienen ambos 85 % de eficiencia isentrópica, ¿por qué en la turbina multiplicas por 0,85 y en el compresor divides por 0,85?',
    diagramKind: 'flow-device',
    diagramCaption: 'Expansión real (h2a > h2s) vs Compresión real (h2a > h2s): la fricción siempre degrada el desempeño.',
    levels: {
      'desde-cero': {
        explanation:
          'Una turbina produce trabajo útil: la fricción real hace que entregue MENOS trabajo que el ideal (× 0,85). Un compresor consume trabajo: la fricción real hace que demande MÁS trabajo que el ideal (÷ 0,85).',
        analogyOrInsight: 'Analogía: el rendimiento real siempre te perjudica; cobras menos salario neto o pagas más por la misma subida.',
      },
      universitario: {
        explanation:
          'Relaciones de propiedades: T ds = du + p dv y T ds = dh − v dp. Para gas ideal (cp, cv constantes): Δs = cp ln(T2/T1) − R ln(p2/p1). Balance entrópico cerrado: S2 − S1 = ∫δQ/T_b + S_gen con S_gen >= 0.',
        analogyOrInsight: 'Adiabático (δQ=0) + reversible (S_gen=0) implica isentrópico (Δs=0). Sin reversibilidad, s aumenta.',
      },
      certamen: {
        explanation:
          'Si obtienes S_gen < 0 en un proceso pasivo adiabático o aislado, NO redondees a cero: indica un error de signo, presión, temperatura no convertida a Kelvin o proceso físicamente imposible.',
        analogyOrInsight: 'Comprueba siempre h2a > h2s tanto en turbina como en compresor adiabático.',
      },
    },
    variables: [
      { symbol: 'S_{\\text{gen}}', name: 'Entropía generada', unit: 'kJ/K (o kW/K)', meaning: 'Siempre >= 0 en procesos físicamente posibles.' },
      { symbol: '\\eta_T', name: 'Eficiencia isentrópica de turbina', unit: 'adim.', meaning: 'η_T = (h1 − h2a) / (h1 − h2s).' },
      { symbol: '\\eta_c', name: 'Eficiencia isentrópica de compresor', unit: 'adim.', meaning: 'η_c = (h2s − h1) / (h2a − h1).' },
    ],
    hypotheses: ['Dispositivos adiabáticos estacionarios para definición estándar de η_T y η_c', 'ΔEc ≈ 0, ΔEp ≈ 0'],
    formulaLatex: String.raw`\Delta s = c_p\ln\!\frac{T_2}{T_1} - R\ln\!\frac{p_2}{p_1}, \qquad \eta_T = \frac{h_1 - h_{2a}}{h_1 - h_{2s}}, \qquad \eta_c = \frac{h_{2s} - h_1}{h_{2a} - h_1}`,
    workedExample: {
      title: 'Comparación de entropía en gas ideal + turbina vs compresor',
      givens: 'Aire: 300→450 K, 100→200 kPa. Turbina: h1=1000, h2s=700, η_T=0,85.',
      steps: [
        '1) Δs = 1,005 ln(450/300) − 0,287 ln(200/100) = 1,005(0,40547) − 0,287(0,69315) ≈ 0,2086 kJ/(kg·K).',
        '2) Turbina: w_a = 0,85 × (1000 − 700) = 255 kJ/kg → h2a = 1000 − 255 = 745 kJ/kg.',
      ],
      result: 'Δs ≈ 0,2086 kJ/(kg·K) | h2a = 745 kJ/kg',
      interpretation: 'Ambos resultados muestran aumento de entropía o entalpía de salida respecto al límite ideal.',
    },
    typicalError: {
      mistake: 'Invertir la fórmula de eficiencia del compresor con la de la turbina.',
      whyWrong: 'Entregaría η > 1 o h2a < h2s, violando la Segunda Ley.',
      correction: 'Verifica que el trabajo real sea menor en turbina y mayor en compresor.',
    },
    practiceCheck: {
      prompt: 'Un compresor requiere 100 kJ/kg en el caso ideal isentrópico (h1=300, h2s=400). Si η_c = 0,80, ¿cuál es h2a?',
      options: ['380 kJ/kg', '420 kJ/kg', '425 kJ/kg', '320 kJ/kg'],
      correctIndex: 2,
      hint: 'w_real = w_s / η_c = 100 / 0,80 = 125 kJ/kg.',
      feedbackCorrect: 'Correcto: h2a = 300 + 125 = 425 kJ/kg.',
      feedbackIncorrect: 'Recuerda: el compresor real consume más trabajo (100 / 0,80 = 125 kJ/kg), no 100 × 0,80.',
    },
  },

  // ======================== UNIDAD IV: MEC110_7 ========================
  {
    id: 'T07.01',
    unitId: 'U4',
    unitTitle: 'Unidad IV · Carnot, Refrigeración y Hielo',
    sourceModule: 'MEC110_7 · Máquinas térmicas y Carnot',
    title: 'Postulados Kelvin–Planck y Clausius, Carnot, refrigeración y cambio de fase',
    cengelRef: 'Çengel Cap. 6, §§6-4 a 6-11 y Cap. 11, §§11-1 a 11-5 (págs. 285, 616)',
    initialQuestion: '¿Cómo logra un refrigerador tener un COP = 4,5 (retira 4,5 veces más calor que la electricidad que gasta) sin violar la conservación de la energía?',
    diagramKind: 'carnot-reservoirs',
    diagramCaption: 'Máquina térmica (produce W_neto = Q_H − Q_L) vs Refrigerador / Bomba de calor (consume W_in).',
    levels: {
      'desde-cero': {
        explanation:
          'Un refrigerador no fabrica frío ni destruye energía: toma calor existente del interior frío, le suma la energía eléctrica del compresor y bota esa suma por la rejilla trasera (Q_H = Q_L + W_in). Como solo mueve calor en vez de crearlo, COP puede ser 3, 4 o 5.',
        analogyOrInsight: 'Analogía: una bomba de agua consume 1 unidad de energía eléctrica para mover 4 unidades de energía potencial de agua desde un pozo.',
      },
      universitario: {
        explanation:
          'Carnot establece el techo reversible entre T_H y T_L (en Kelvin): η_Carnot = 1 − T_L/T_H; COP_R,max = T_L/(T_H − T_L); COP_HP = COP_R + 1. En ciclos de compresión de vapor: evaporador (q_L = h1 − h4), compresor (w = h2 − h1), condensador (q_H = h2 − h3), válvula (h3 ≈ h4).',
        analogyOrInsight: 'En enfriamiento con solidificación (hielo), q_total incluye calor sensible líquido + latente de fusión + sensible sólido.',
      },
      certamen: {
        explanation:
          'Atención a tres trampas de MEC110_7: (1) temperatura en Kelvin para Carnot; (2) fracción de tiempo encendido f en refrigeradores intermitentes (Q̇_activo = Q̇_prom / f); (3) meseta latente de 333,7 kJ/kg al congelar agua.',
        analogyOrInsight: 'Si una máquina propone Q_L = 0 con Q_H > 0, viola Kelvin–Planck.',
      },
    },
    variables: [
      { symbol: '\\eta_{\\text{Carnot}}', name: 'Eficiencia límite de Carnot', unit: 'adim. (<1)', meaning: '1 − T_L/T_H con T en Kelvin.' },
      { symbol: '\\mathrm{COP}_R', name: 'Coeficiente de desempeño frigorífico', unit: 'adim.', meaning: 'Q_L / W_in (objetivo: enfriar espacio frío).' },
      { symbol: 'h_{\\text{fusión}}', name: 'Calor latente de solidificación', unit: 'kJ/kg', meaning: '333,7 kJ/kg para agua a 0 °C.' },
    ],
    hypotheses: ['Reservorios isotérmicos T_H y T_L', 'CAPACIDAD frigorífica constante en cálculos básicos de tiempo de enfriamiento'],
    formulaLatex: String.raw`\eta_{\text{Carnot}} = 1 - \frac{T_L}{T_H}, \qquad \mathrm{COP}_R = \frac{Q_L}{W_{\text{in}}}, \qquad \mathrm{COP}_{HP} = \mathrm{COP}_R + 1`,
    workedExample: {
      title: 'Carnot 500/200 kJ a T_L = 17 °C (MEC110_7 diapo 12)',
      givens: 'Q_H = 500 kJ, Q_L = 200 kJ, T_L = 17 °C',
      steps: [
        '1) T_L = 17 + 273,15 = 290,15 K; W = 500 − 200 = 300 kJ → η = 300/500 = 60 %.',
        '2) T_H = T_L · (Q_H / Q_L) = 290,15 × (500 / 200) = 725,375 K (≈ 452,2 °C).',
      ],
      result: 'η = 60 % | T_H = 725,375 K',
      interpretation: 'Muestra por qué fuentes de alta temperatura (carbón 1200 °C) superan en límite Carnot a geotermia (140 °C) o estanque solar (80 °C).',
    },
    typicalError: {
      mistake: 'Calcular 1 − 17/TH en Celsius, o olvidar el calor latente al fabricar hielo.',
      whyWrong: 'Cambiar de cero de escala destruye la proporcionalidad termodinámica.',
      correction: 'Pasa siempre a K antes de multiplicar o dividir temperaturas.',
    },
    practiceCheck: {
      prompt: '¿Cuál fuente tiene mayor eficiencia límite de Carnot frente a un ambiente de 20 °C?',
      options: ['Estanque solar a 80 °C (17,0 %)', 'Geotermia a 140 °C (29,0 %)', 'Carbón a 1200 °C (80,1 %)', 'Todas tienen igual límite'],
      correctIndex: 2,
      hint: 'A mayor T_H en Kelvin para igual T_L, menor es la fracción T_L/T_H.',
      feedbackCorrect: 'Exacto: 1 − 293,15/1473,15 ≈ 80,1 % (límite idealizado de Carnot).',
      feedbackIncorrect: 'Evalúa 1 − 293,15 / (T_H + 273,15) para cada fuente.',
    },
    simulatorLink: { tab: 'sim-carnot', label: 'Explorar en Simulador 2 (Carnot, Sandías y Hielo)' },
  },

  // ======================== UNIDAD V: MEC110_8 ========================
  {
    id: 'T08.01',
    unitId: 'U5',
    unitTitle: 'Unidad V · Compresión Multietapa y Brayton',
    sourceModule: 'MEC110_8 · Turbinas de gas',
    title: 'Compresión multietapa, Brayton ideal/real, óptimo r_p*, regeneración y 10 estados',
    cengelRef: 'Çengel Cap. 9, §§9-8 a 9-10 (págs. 511–521)',
    initialQuestion: 'Si una turbina de gas real tiene η_c = η_t = 65 %, ¿por qué su eficiencia cae a menos del 3 % aun cuando cada equipo parece "razonable"?',
    diagramKind: 'brayton-loop',
    diagramCaption: 'Ciclo Brayton: compresor → cámara de calor → turbina (+ interenfriador, recalentador y regenerador).',
    levels: {
      'desde-cero': {
        explanation:
          'En una turbina de gas, el compresor consume una fracción enorme (a veces 40 %–80 %) del trabajo que produce la turbina. Cuando ambos pierden eficiencia simultáneamente, el compresor exige más y la turbina entrega menos, apretando el trabajo neto casi hasta cero.',
        analogyOrInsight: 'Analogía: si tu negocio factura 100 y gasta 70 en insumos, una caída del 15 % en ventas y alza del 15 % en costos casi borra tu ganancia neta.',
      },
      universitario: {
        explanation:
          'En Brayton ideal (aire estándar cp constante): η = 1 − r_p^(-(k-1)/k), mientras el máximo trabajo neto ocurre en r_p* = (T3/T1)^(k/(2(k-1))). La regeneración reduce q_in solo si T4 > T2. En dos etapas ideales de compresión, p_i* = √(p1·p2).',
        analogyOrInsight: 'La configuración avanzada de 10 estados combina interenfriamiento (baja w_c), recalentamiento (sube w_t) y regeneración (aprovecha T9 > T4).',
      },
      certamen: {
        explanation:
          'No confundas r_p* (maximiza w_neto) con máxima eficiencia térmica. Además, no apliques 1 − r_p^(-a) cuando η_c < 1, η_t < 1 o cuando hay regenerador.',
        analogyOrInsight: 'Verifica siempre T3 > T2a y, con regenerador, T4a > T2a.',
      },
    },
    variables: [
      { symbol: 'r_p = p_2/p_1', name: 'Relación de presiones', unit: 'adim.', meaning: 'Cociente entre alta y baja presión.' },
      { symbol: 'bwr = w_c/w_t', name: 'Relación de trabajo de retroceso', unit: 'adim. (%)', meaning: 'Fracción del trabajo de turbina consumida por el compresor.' },
      { symbol: '\\varepsilon_{\\text{reg}}', name: 'Eficacia del regenerador', unit: '0..1', meaning: '(T5 − T2) / (T4 − T2) cuando T4 > T2.' },
    ],
    hypotheses: ['Aire estándar con cp = 1,005 kJ/(kg·K), k = 1,4', 'Ciclo cerrado equivalente sin cambio de masa por combustible'],
    formulaLatex: String.raw`T_{2s}=T_1 r_p^{\frac{k-1}{k}}, \quad r_p^* = \left(\frac{T_3}{T_1}\right)^{\frac{k}{2(k-1)}}, \quad p_i^* = \sqrt{p_1 p_2}`,
    workedExample: {
      title: 'Brayton 100→480 kPa, 20→880 °C (MEC110_8 diapo 19)',
      givens: 'p1=100 kPa, p2=480 kPa, T1=293,15 K, T3=1153,15 K, k=1,4.',
      steps: [
        '1) F = 4,8^(0,285714) ≈ 1,5655 → T2s ≈ 458,91 K, T4s ≈ 736,62 K.',
        '2) Ideal: w_neto ≈ 252,02 kJ/kg, η ≈ 36,12 %.',
        '3) Con η_c = η_t = 0,85: T2a ≈ 488,17 K, T4a ≈ 799,10 K → w_neto ≈ 159,83 kJ/kg, η ≈ 23,91 %.',
      ],
      result: 'Ideal: 36,12 % | Real (85 %): 23,91 %',
      interpretation: 'La razón de retroceso sube de ~40 % a ~55 % al caer las eficiencias al 85 %.',
    },
    typicalError: {
      mistake: 'Activar regeneración cuando T4 < T2 o confundir presión óptima p_i* con igualdad aritmética (p1+p2)/2.',
      whyWrong: 'Si T4 < T2, el "regenerador" enfriaría el aire comprimido en vez de precalentarlo.',
      correction: 'Comprueba siempre T_escape_turbina > T_salida_compresor antes de aplicar ε_reg.',
    },
    practiceCheck: {
      prompt: 'Para compresión en dos etapas de 100 kPa a 900 kPa con interenfriamiento perfecto e iguales etapas, ¿cuál es la presión intermedia óptima?',
      options: ['500 kPa', '300 kPa', '450 kPa', '200 kPa'],
      correctIndex: 1,
      hint: 'Usa la media geométrica p_i = √(p1 · p2), no el promedio aritmético.',
      feedbackCorrect: 'Exacto: √(100 × 900) = √90000 = 300 kPa (razón 3 en cada etapa).',
      feedbackIncorrect: '500 kPa es la media aritmética; el mínimo trabajo de compresión requiere igual razón de presiones: √(100×900) = 300 kPa.',
    },
    simulatorLink: { tab: 'sim-brayton', label: 'Abrir Simulador 3 (Brayton y 10 Estados)' },
  },

  // ======================== UNIDAD VI: MEC110_9 ========================
  {
    id: 'T09.01',
    unitId: 'U6',
    unitTitle: 'Unidad VI · Rankine, Recalentamiento y 4×4',
    sourceModule: 'MEC110_9 · Centrales de vapor',
    title: 'Rankine ideal/real (4A), recalentamiento (4B), regeneración 11 estados 4×4 (4C) y cogeneración',
    cengelRef: 'Çengel Cap. 10, §§10-2 a 10-9 (págs. 561–591)',
    initialQuestion: 'En una central regenerativa de 250 MW con dos calentadores (CAA y CAC), ¿por qué el cálculo de bomba P2 (12,5 MPa) exige auditar cuidadosamente 0,5365 vs 13,09 kJ/kg?',
    diagramKind: 'rankine-loop',
    diagramCaption: 'Planta Rankine real con campana IAPWS-IF97, TAP/TBP, calentadores CAA/CAC y balance 4×4.',
    levels: {
      'desde-cero': {
        explanation:
          'El ciclo Rankine usa agua líquida en la bomba (gasta poquísima energía para subir mucho la presión) y vapor en la turbina (produce muchísimo trabajo). Para subir eficiencia y evitar gotas que dañen los álabes, se recalienta el vapor y se extrae una parte para precalentar el agua.',
        analogyOrInsight: 'Analogía: bombear agua líquida es mucho más fácil que comprimir vapor esponjoso en el mismo salto de presión.',
      },
      universitario: {
        explanation:
          'En 4A (300 MW, 10 MPa, 500 °C, 10 kPa) se evalúa IF97 en Región 2 y Región 4. En 4B (9 MPa, x5 >= 0,90) se invierte s(p_recal, 500 °C) ≈ 7,3988 → p ≈ 2,15 MPa. En 4C (11 estados, CAA + CAC) se resuelve el sistema lineal 4×4 de flujos [ṁ8, ṁ9, ṁ10, ṁ11].',
        analogyOrInsight: 'Cogeneración evalúa ε_u = (Ẇ_neto + Q̇_útil)/Q̇_combustible; el ciclo binario Hg–H2O se estudia solo como concepto histórico por toxicidad del mercurio.',
      },
      certamen: {
        explanation:
          'Auditoría científica del Caso 4C: la transcripción previa reporta h4 = 562,01 kJ/kg (w_B2 = 0,5365 kJ/kg), incompatible con v3·(p4−p3) = 0,001073×12200 = 13,09 kJ/kg. El Simulador 4 ofrece ambos modos con transparencia total.',
        analogyOrInsight: 'Nunca fuerces coeficientes para que coincidan con una diapositiva; reporta la discrepancia y sus residuos.',
      },
    },
    variables: [
      { symbol: 'w_B', name: 'Trabajo de bomba', unit: 'kJ/kg', meaning: 'w_B ≈ v_f (p_alta − p_baja) / η_B.' },
      { symbol: 'x_{\\text{salida}}', name: 'Calidad a escape de turbina', unit: '0..1', meaning: 'Objetivo típico >= 0,88–0,90 para evitar erosión.' },
      { symbol: '\\varepsilon_u', name: 'Factor de utilización cogeneración', unit: '%', meaning: '(Ẇ_neto + Q̇_útil) / Q̇_aporte.' },
    ],
    hypotheses: ['Propiedades IAPWS-IF97 en Regiones 1, 2 y 4', 'Trampa isoentálpica en CAC (h7 = h6)', 'Régimen estacionario'],
    formulaLatex: String.raw`\eta_{\text{Rankine}} = \frac{w_T - w_B}{q_{\text{in}}}, \qquad \dot m_8 = \dot m_9 + \dot m_{10} + \dot m_{11}, \qquad \varepsilon_u = \frac{\dot W_{\text{neto}} + \dot Q_{\text{útil}}}{\dot Q_{\text{comb}}}`,
    workedExample: {
      title: 'Caso 4A (300 MW) y auditoría 4C (250 MW)',
      givens: '4A: 10 MPa, 500 °C → 10 kPa. 4C: 12,5 MPa, 550 °C, 0,8 MPa CAC, 0,3 MPa CAA, 10 kPa.',
      steps: [
        '4A ideal: w_B = 10,09 kJ/kg, x3s = 79,34 %, w_neto = 1275,3 kJ/kg, η = 40,19 %, ṁ = 235,2 kg/s.',
        '4A real (85 %): w_neto = 1080,7 kJ/kg, η = 34,08 %, ṁ = 277,6 kg/s.',
        '4C referencia: [198,49; 15,53; 27,29; 155,67] kg/s; modo IF97 recalcula w_B2 = 13,09 kJ/kg y resuelve 4×4 consistente.',
      ],
      result: '4A: 40,2 % / 34,1 % | 4C: Sistema 4×4 resuelto con residuos < 10⁻⁶',
      interpretation: 'Las irreversibilidades reales elevan el caudal necesario y el recalentamiento/regeneración mejoran humedad y eficiencia.',
    },
    typicalError: {
      mistake: 'Omitir el trabajo de bomba, calcular calidad x en vapor sobrecalentado, o ignorar que en CAC las masas no se mezclan.',
      whyWrong: 'Mezclar corrientes de distinta presión en un CAC destruiría la topología del balance.',
      correction: 'Distingue siempre CAA (mezcla a igual presión) de CAC (intercambio sin mezcla + drenaje por trampa).',
    },
    practiceCheck: {
      prompt: 'En un calentador abierto (CAA), entran 3 kg/s a h=200 kJ/kg y 1 kg/s de vapor extraído a h=2600 kJ/kg. ¿Cuál es la entalpía de salida (sin pérdidas)?',
      options: ['1400 kJ/kg', '800 kJ/kg', '650 kJ/kg', '2800 kJ/kg'],
      correctIndex: 1,
      hint: 'Balance: m_out · h_out = m1·h1 + m2·h2 → 4 · h_out = 3×200 + 1×2600.',
      feedbackCorrect: 'Correcto: (600 + 2600) / 4 = 3200 / 4 = 800 kJ/kg.',
      feedbackIncorrect: 'No es promedio simple (200+2600)/2; debes ponderar por cada flujo másico.',
    },
    simulatorLink: { tab: 'sim-rankine', label: 'Abrir Simulador 4 (Rankine 4A, 4B, 4C IF97)' },
  },
  {
    id: 'T05.01',
    unitId: 'U2',
    unitTitle: 'Unidad II · Primera Ley y Equipos de Flujo',
    sourceModule: 'MEC110_5 · Flujo no permanente',
    title: 'Volumen de control transitorio: llenado y vaciado de tanques',
    cengelRef: 'Çengel Cap. 5, §5-5 (págs. 244–253)',
    initialQuestion: 'Si llenas un tanque rígido inicialmente vacío desde una línea a h_in = 300 kJ/kg (sin calor ni trabajo), ¿por qué su energía interna final u_2 termina siendo igual a h_in en vez de u_in?',
    diagramKind: 'system-boundary',
    diagramCaption: 'Flujo transitorio: masa y energía dentro del volumen de control cambian con el tiempo.',
    levels: {
      'desde-cero': {
        explanation:
          'El gas de la cañería entra empujado por la presión de la línea (trabajo de flujo p·v). Una vez adentro del tanque, ya no está fluyendo, así que toda esa energía (u_in + p_in·v_in = h_in) queda atrapada como energía interna U_2.',
        analogyOrInsight: 'Analogía: el dinero que entra a tu cuenta incluye tanto el billete como el impulso de depósito; adentro queda como saldo acumulado.',
      },
      universitario: {
        explanation:
          'Balance integral transitorio: m_2 − m_1 = Σm_i − Σm_e; E_2 − E_1 = Q − W + Σm_i(h_i + ke_i + pe_i) − Σm_e(h_e + ke_e + pe_e). En tanques rígidos sin calor ni trabajo, con un único puerto de entrada constante y vacío inicial (m_1 = 0), resulta u_2 = h_in.',
        analogyOrInsight: 'No confundir conceptualmente u con h: numéricamente coinciden en ese caso límite por la Primera Ley.',
      },
      certamen: {
        explanation:
          'Para gas ideal en tanque rígido aislado inicialmente vacío: u_2 = c_v T_2 y h_in = c_p T_in → T_2 = (c_p/c_v) T_in = k · T_in (¡la temperatura dentro del tanque supera a la de la línea!).',
        analogyOrInsight: 'Verifica siempre si el tanque parte vacío (m_1=0) o con masa inicial m_1 > 0 antes de cancelar términos.',
      },
    },
    variables: [
      { symbol: 'm_2 - m_1', name: 'Acumulación de masa', unit: 'kg', meaning: 'Diferencia entre masa final e inicial dentro del tanque.' },
      { symbol: 'h_{\\text{in}}', name: 'Entalpía de corriente entrante', unit: 'kJ/kg', meaning: 'Incluye energía interna y trabajo de flujo.' },
      { symbol: 'u_2', name: 'Energía interna final acumulada', unit: 'kJ/kg', meaning: 'Propiedad del fluido en reposo dentro del tanque.' },
    ],
    hypotheses: ['Propiedades uniformes dentro del volumen de control en cada instante', 'Corriente de entrada con propiedades constantes'],
    formulaLatex: String.raw`m_2 - m_1 = \sum m_{\text{in}} - \sum m_{\text{out}}, \qquad U_2 - U_1 = Q - W + m_{\text{in}} h_{\text{in}} - m_{\text{out}} h_{\text{out}}`,
    workedExample: {
      title: 'Llenado adiabático ideal de tanque vacío',
      givens: 'Tanque rígido vacío (m1=0), Q=0, W=0, entra m_in = 2 kg con h_in = 300 kJ/kg.',
      steps: [
        '1) Masa final: m_2 = 0 + 2 − 0 = 2 kg.',
        '2) Energía acumulada: U_2 − 0 = 0 − 0 + 2 × 300 = 600 kJ → u_2 = 600 / 2 = 300 kJ/kg.',
      ],
      result: 'm_2 = 2 kg | U_2 = 600 kJ (u_2 = 300 kJ/kg)',
      interpretation: 'Para aire ideal a 300 K entrando, T_2 llegaría a k·T_in = 1,4×300 = 420 K.',
    },
    typicalError: {
      mistake: 'Usar u_in en vez de h_in al multiplicar por m_in en la frontera de entrada.',
      whyWrong: 'Olvida el trabajo de flujo p·v necesario para introducir la masa al tanque.',
      correction: 'Las corrientes que cruzan una frontera SIEMPRE entran o salen con entalpía h.',
    },
    practiceCheck: {
      prompt: 'Un tanque inicia con m1 = 2 kg, recibe 5 kg y descarga 1 kg. ¿Cuál es su masa final m2?',
      options: ['4 kg', '6 kg', '8 kg', '3 kg'],
      correctIndex: 1,
      hint: 'Aplica m2 = m1 + m_in − m_out.',
      feedbackCorrect: 'Exacto: m2 = 2 + 5 − 1 = 6 kg.',
      feedbackIncorrect: 'Revisa los signos: la masa entrante suma (+5) y la saliente resta (−1).',
    },
  },
  {
    id: 'T09.07',
    unitId: 'U6',
    unitTitle: 'Unidad VI · Rankine, Recalentamiento y 4×4',
    sourceModule: 'MEC110_9 · Cogeneración y Binario',
    title: 'Cogeneración (factor de utilización ε_u) y ciclo binario conceptual',
    cengelRef: 'Çengel Cap. 10, §§10-8 a 10-9 (págs. 585–591)',
    initialQuestion: '¿Por qué una planta de cogeneración puede alcanzar ε_u = 75 % mientras su eficiencia eléctrica sigue siendo 30 %?',
    diagramKind: 'rankine-loop',
    diagramCaption: 'Cogeneración aprovecha Ẇ_neto + Q̇_útil de proceso; ciclo binario acopla dos circuitos vía intercambiador.',
    levels: {
      'desde-cero': {
        explanation:
          'Una central eléctrica común bota calor tibio al río o al aire. En cogeneración, ese vapor aún caliente se entrega a una fábrica (calefacción, secado, pasteurización) para que haga trabajo útil térmico además de electricidad.',
        analogyOrInsight: 'Analogía: usar el calor del motor de un auto para calefaccionar la cabina en invierno sin gastar combustible extra.',
      },
      universitario: {
        explanation:
          'El factor de utilización ε_u = (Ẇ_neto + Q̇_útil) / Q̇_combustible distingue el aprovechamiento conjunto respecto de la eficiencia eléctrica η_el = Ẇ_neto / Q̇_combustible. El ciclo binario histórico Hg–H2O acopla un ciclo superior e inferior únicamente por intercambio térmico (Q̇_intercambio).',
        analogyOrInsight: 'Nota ambiental y de seguridad: el mercurio es altamente tóxico; su aparición en MEC110_9 es estrictamente histórica/pedagógica, no recomendación de diseño.',
      },
      certamen: {
        explanation:
          'No confundas ε_u con η_Carnot ni asumas que todo el calor rechazado por el condensador a 45 °C sirve para procesos industriales que requieren 150 °C.',
        analogyOrInsight: 'La demanda térmica útil fija a qué presión conviene extraer o condensar el vapor.',
      },
    },
    variables: [
      { symbol: '\\varepsilon_u', name: 'Factor de utilización energética', unit: '%', meaning: 'Razón de energía útil total (eléctrica + térmica) sobre combustible.' },
      { symbol: '\\dot Q_{\\text{útil}}', name: 'Calor útil entregado a proceso', unit: 'MW', meaning: 'Requiere temperatura suficiente para el proceso industrial.' },
    ],
    hypotheses: ['Demanda térmica industrial simultánea a la generación eléctrica', 'Sin mezcla material entre fluidos en ciclo binario'],
    formulaLatex: String.raw`\varepsilon_u = \frac{\dot W_{\text{neto}} + \dot Q_{\text{útil}}}{\dot Q_{\text{combustible}}}`,
    workedExample: {
      title: 'Planta de cogeneración 100 MW y binario conceptual',
      givens: 'Cogen: Q̇_comb=100 MW, Ẇ_net=30 MW, Q̇_útil=45 MW. Binario: 40 MW transferidos, 2 MW pérdidas, 25 % conversión inferior.',
      steps: [
        '1) Cogeneración: η_el = 30/100 = 30 %; ε_u = (30 + 45)/100 = 75 %.',
        '2) Binario conceptual: ciclo inferior recibe 40 − 2 = 38 MW → entrega 0,25 × 38 = 9,5 MW.',
      ],
      result: 'ε_u = 75 % | Ẇ_inferior = 9,5 MW',
      interpretation: 'Distingue claramente rendimiento eléctrico puro de utilización energética total.',
    },
    typicalError: {
      mistake: 'Presentar ε_u como si fuera "eficiencia termodinámica de potencia" o proponer diseños reales con mercurio.',
      whyWrong: 'Mezcla trabajo mecánico con calor de proceso de menor exergía e ignora toxicidad del mercurio.',
      correction: 'Etiqueta siempre ε_u como factor de utilización y el ciclo Hg–H2O como ejemplo histórico.',
    },
    practiceCheck: {
      prompt: 'Una planta recibe 100 MW de combustible, entrega 30 MW eléctricos y 45 MW térmicos útiles. ¿Cuál es su factor ε_u?',
      options: ['30 %', '45 %', '75 %', '15 %'],
      correctIndex: 2,
      hint: 'Suma trabajo eléctrico neto + calor útil de proceso y divide por el aporte total.',
      feedbackCorrect: 'Exacto: (30 + 45) / 100 = 75 %.',
      feedbackIncorrect: 'En cogeneración ambos productos (Ẇ_neto y Q̇_útil) cuentan como energía aprovechada.',
    },
    simulatorLink: { tab: 'sim-rankine', label: 'Probar Cogeneración y Binario en Simulador 4' },
  },
];

