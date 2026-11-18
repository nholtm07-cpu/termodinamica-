/**
 * Banco de ejercicios MEC110 con procedencia trazable, pistas graduales (5 niveles),
 * diagnóstico de errores típicos y verificación numérica tolerante.
 */

export interface ExerciseItem {
  id: string;
  unit: string;
  lessonId: string;
  title: string;
  level: 'Inicial' | 'Intermedio' | 'Avanzado' | 'Auditoría';
  originType: 'lecture' | 'original' | 'book-inspired';
  originLabel: string;
  question: string;
  physicalSystem: string;
  givens: string[];
  assumptions: string[];
  targetVariable: string;
  targetUnit: string;
  expectedValue: number;
  toleranceRelative: number;
  acceptedPercentageVariant?: boolean; // permite 0.4 o 40 si es porcentaje
  competencies: ('A' | 'B' | 'C' | 'D' | 'E')[];
  hints: [string, string, string, string, string];
  commonMistakeChecks: Array<{
    detectRange: [number, number];
    diagnosis: string;
    remedy: string;
  }>;
  simulatorLink?: {
    tab: 'sim-boltzmann' | 'sim-carnot' | 'sim-brayton' | 'sim-rankine';
    label: string;
  };
}

export const EXERCISE_BANK: ExerciseItem[] = [
  {
    id: 'P00-01',
    unit: 'Unidad 0 · Preparatorio',
    lessonId: 'T00.01',
    title: 'Energía vs potencia en un calefactor',
    level: 'Inicial',
    originType: 'original',
    originLabel: 'Original plataforma',
    question: 'Un calefactor eléctrico entrega 2 kW durante 15 minutos. ¿Cuánta energía total transfiere en kJ?',
    physicalSystem: 'Resistencia eléctrica de potencia constante',
    givens: ['Potencia = 2 kW (= 2 kJ/s)', 'Tiempo = 15 min'],
    assumptions: ['Potencia constante durante todo el intervalo'],
    targetVariable: 'Q',
    targetUnit: 'kJ',
    expectedValue: 1800,
    toleranceRelative: 0.01,
    competencies: ['B', 'D'],
    hints: [
      'Observa que te piden energía [kJ], mientras el dato es potencia [kW = kJ/s].',
      'Convierte los 15 minutos a segundos multiplicando por 60.',
      'Usa Q = P · Δt.',
      'Q = 2 kJ/s × (15 × 60) s = 2 × 900.',
      'Respuesta: 1800 kJ (= 1,8 MJ).',
    ],
    commonMistakeChecks: [
      {
        detectRange: [29, 31],
        diagnosis: 'Multiplicaste kW por minutos (2 × 15 = 30) sin pasar minutos a segundos.',
        remedy: 'Recuerda: 1 kW = 1 kJ/s, así que el tiempo debe estar en segundos (15 × 60 = 900 s).',
      },
    ],
  },
  {
    id: 'P02-02',
    unit: 'Unidad I · Fundamentos y Gases',
    lessonId: 'T02.08',
    title: 'Masa de aire en tanque rígido (Gas Ideal)',
    level: 'Inicial',
    originType: 'original',
    originLabel: 'Original plataforma (B02)',
    question: 'Un tanque rígido de 0,5 m³ contiene aire a presión absoluta de 200 kPa y 300 K. Calcula la masa de aire [kg] con R = 0,287 kJ/(kg·K).',
    physicalSystem: 'Sistema cerrado rígido con aire ideal',
    givens: ['p = 200 kPa (abs)', 'V = 0,5 m³', 'T = 300 K', 'R = 0,287 kPa·m³/(kg·K)'],
    assumptions: ['Comportamiento de gas ideal'],
    targetVariable: 'm',
    targetUnit: 'kg',
    expectedValue: 1.1614,
    toleranceRelative: 0.015,
    competencies: ['B', 'C', 'D'],
    hints: [
      'Identifica si tienes estado de gas ideal: conoces p, V y T.',
      'Escribe p·V = m·R·T.',
      'Despeja m = (p·V) / (R·T).',
      'm = (200 × 0,5) / (0,287 × 300) = 100 / 86,1.',
      'Resultado: m ≈ 1,1614 kg.',
    ],
    commonMistakeChecks: [
      {
        detectRange: [0.001, 0.002],
        diagnosis: 'Posible desajuste por factor 1000 entre Pa y kPa frente a R en kJ/(kg·K).',
        remedy: '1 kPa·m³ = 1 kJ, por lo que p en kPa combina directo con R en kJ/(kg·K).',
      },
    ],
  },
  {
    id: 'P03-02',
    unit: 'Unidad II · Primera Ley',
    lessonId: 'T03.02',
    title: 'Trabajo de frontera en expansión isobárica',
    level: 'Inicial',
    originType: 'original',
    originLabel: 'Original plataforma',
    question: 'Un gas en cilindro-pistón se expande a presión constante de 150 kPa desde 0,2 m³ hasta 0,5 m³. Calcula el trabajo de frontera W_b [kJ].',
    physicalSystem: 'Sistema cerrado cuasiestático isobárico',
    givens: ['p = 150 kPa constante', 'V1 = 0,2 m³', 'V2 = 0,5 m³'],
    assumptions: ['Proceso cuasiestático sin fricción de pistón'],
    targetVariable: 'W_b',
    targetUnit: 'kJ',
    expectedValue: 45,
    toleranceRelative: 0.01,
    competencies: ['A', 'C', 'D'],
    hints: [
      '¿Cambia el volumen? Sí, entonces hay trabajo de frontera ∫p dV.',
      'Como p es constante, sale fuera de la integral.',
      'Usa W_b = p · (V2 − V1).',
      'W_b = 150 kPa × (0,5 − 0,2) m³ = 150 × 0,3.',
      'Resultado: W_b = 45 kJ (positivo porque el gas se expande).',
    ],
    commonMistakeChecks: [
      {
        detectRange: [-46, -44],
        diagnosis: 'Invertiste V1 − V2 obteniendo signo negativo en una expansión.',
        remedy: 'En expansión V2 > V1, el trabajo realizado por el sistema es positivo (+45 kJ).',
      },
    ],
  },
  {
    id: 'P04-02',
    unit: 'Unidad II · Volúmenes de Control',
    lessonId: 'T04.04',
    title: 'Velocidad de salida en tobera adiabática',
    level: 'Intermedio',
    originType: 'book-inspired',
    originLabel: 'Inspirado en Çengel Cap. 5 (B04)',
    question: 'Aire entra a una tobera adiabática horizontal con V1 = 30 m/s y h1 = 320 kJ/kg, saliendo con h2 = 290 kJ/kg. Calcula V2 [m/s].',
    physicalSystem: 'Volumen de control estacionario (tobera)',
    givens: ['V1 = 30 m/s', 'h1 = 320 kJ/kg', 'h2 = 290 kJ/kg'],
    assumptions: ['Estacionario', 'Adiabático (Q̇ = 0)', 'Sin trabajo de eje (Ẇ = 0)', 'ΔEp ≈ 0'],
    targetVariable: 'V_2',
    targetUnit: 'm/s',
    expectedValue: 246.78,
    toleranceRelative: 0.015,
    competencies: ['A', 'B', 'C', 'D'],
    hints: [
      'En una tobera NO puedes despreciar la energía cinética.',
      'Balance estacionario: h1 + V1²/2000 = h2 + V2²/2000 (con h en kJ/kg).',
      'Despeja V2 = √(V1² + 2000·(h1 − h2)).',
      'V2 = √(30² + 2000 × 30) = √(900 + 60000) = √60900.',
      'Resultado: V2 ≈ 246,8 m/s.',
    ],
    commonMistakeChecks: [
      {
        detectRange: [25, 35],
        diagnosis: 'Olvidaste multiplicar Δh [kJ/kg] por 1000 para convertir a J/kg (= m²/s²).',
        remedy: '1 kJ/kg = 1000 m²/s²; el factor 2000 aparece de 2 × 1000.',
      },
    ],
  },
  {
    id: 'P06-05',
    unit: 'Unidad III · Entropía y Eficiencias',
    lessonId: 'T06.07',
    title: 'Entalpía real de salida en turbina',
    level: 'Intermedio',
    originType: 'original',
    originLabel: 'Original plataforma',
    question: 'Vapor entra a una turbina con h1 = 1000 kJ/kg y su salida isentrópica sería h2s = 700 kJ/kg. Si η_T = 85 %, halla la entalpía real h2a [kJ/kg].',
    physicalSystem: 'Turbina adiabática real',
    givens: ['h1 = 1000 kJ/kg', 'h2s = 700 kJ/kg', 'η_T = 0,85'],
    assumptions: ['Adiabática, flujo estacionario'],
    targetVariable: 'h_{2a}',
    targetUnit: 'kJ/kg',
    expectedValue: 745,
    toleranceRelative: 0.01,
    competencies: ['C', 'D', 'E'],
    hints: [
      'Una turbina real entrega MENOS trabajo que la ideal isentrópica.',
      'Calcula primero w_s = h1 − h2s = 300 kJ/kg.',
      'Multiplica por η_T: w_real = 0,85 × 300 = 255 kJ/kg.',
      'h2a = h1 − w_real = 1000 − 255.',
      'Resultado: h2a = 745 kJ/kg (> 700 kJ/kg).',
    ],
    commonMistakeChecks: [
      {
        detectRange: [640, 655],
        diagnosis: 'Dividiste por 0,85 como si fuera compresor en vez de multiplicar por 0,85.',
        remedy: 'En turbina se multiplica (entrega menos trabajo); en compresor se divide (consume más).',
      },
    ],
  },
  {
    id: 'C07-02',
    unit: 'Unidad IV · Carnot y Refrigeración',
    lessonId: 'T07.02',
    title: 'Temperatura de foco caliente en Carnot (500/200 kJ)',
    level: 'Intermedio',
    originType: 'lecture',
    originLabel: 'Cátedra MEC110_7 · diapo 12',
    question: 'Una máquina de Carnot absorbe Q_H = 500 kJ y rechaza Q_L = 200 kJ hacia un foco frío a T_L = 17 °C. Calcula T_H en Kelvin [K].',
    physicalSystem: 'Máquina térmica reversible de Carnot',
    givens: ['Q_H = 500 kJ', 'Q_L = 200 kJ', 'T_L = 17 °C'],
    assumptions: ['Ciclo totalmente reversible de Carnot'],
    targetVariable: 'T_H',
    targetUnit: 'K',
    expectedValue: 725.375,
    toleranceRelative: 0.01,
    competencies: ['B', 'C', 'D', 'E'],
    hints: [
      'Convierte primero T_L = 17 °C a Kelvin sumando 273,15.',
      'En un ciclo de Carnot reversible se cumple Q_L / Q_H = T_L / T_H.',
      'Despeja T_H = T_L · (Q_H / Q_L).',
      'T_H = 290,15 × (500 / 200) = 290,15 × 2,5.',
      'Resultado: T_H = 725,375 K (≈ 452,2 °C).',
    ],
    commonMistakeChecks: [
      {
        detectRange: [40, 45],
        diagnosis: 'Usaste T_L = 17 °C directamente en el cociente sin convertir a Kelvin.',
        remedy: 'El cociente de Carnot exige escala absoluta Kelvin: 17 + 273,15 = 290,15 K.',
      },
    ],
    simulatorLink: { tab: 'sim-carnot', label: 'Abrir en Simulador 2 (Carnot)' },
  },
  {
    id: 'C07-04',
    unit: 'Unidad IV · Carnot y Refrigeración',
    lessonId: 'T07.05',
    title: 'Enfriamiento de 5 sandías (tiempo mínimo idealizado)',
    level: 'Intermedio',
    originType: 'lecture',
    originLabel: 'Cátedra MEC110_7 · diapo 16',
    question: 'Cinco sandías de 10 kg c/u (50 kg total, c = 4,184 kJ/(kg·K)) se enfrían de 20 °C a 8 °C en un refrigerador de 450 W con COP_R = 4,5. Calcula el tiempo mínimo en minutos.',
    physicalSystem: 'Carga térmica sensible con potencia frigorífica constante',
    givens: ['m = 50 kg', 'c = 4,184 kJ/(kg·K)', 'ΔT = 12 K', 'Ẇ = 450 W = 0,45 kW', 'COP_R = 4,5'],
    assumptions: ['Sandías aproximadas a agua', 'Sin infiltraciones térmicas', 'COP constante'],
    targetVariable: 't',
    targetUnit: 'min',
    expectedValue: 20.66,
    toleranceRelative: 0.015,
    competencies: ['A', 'B', 'C', 'D'],
    hints: [
      'Calcula el calor total a retirar: |Q| = m·c·ΔT.',
      'Convierte 450 W a 0,450 kW y calcula Q̇_L = COP_R × Ẇ.',
      'Q = 50 × 4,184 × 12 = 2510,4 kJ; Q̇_L = 4,5 × 0,45 = 2,025 kW.',
      'Tiempo en segundos: t = 2510,4 / 2,025 = 1239,7 s.',
      'Divide por 60: t ≈ 20,66 min.',
    ],
    commonMistakeChecks: [
      {
        detectRange: [90, 95],
        diagnosis: 'Olvidaste multiplicar la potencia eléctrica por COP_R = 4,5.',
        remedy: 'Un refrigerador extrae COP_R veces la potencia eléctrica: Q̇_L = 4,5 × 0,45 kW.',
      },
      {
        detectRange: [1200, 1260],
        diagnosis: 'Entregaste el tiempo en segundos en lugar de minutos.',
        remedy: 'Divide 1239,7 s por 60 para expresar el resultado en minutos.',
      },
    ],
    simulatorLink: { tab: 'sim-carnot', label: 'Simular Sandías en Simulador 2' },
  },
  {
    id: 'C07-05',
    unit: 'Unidad IV · Carnot y Refrigeración',
    lessonId: 'T07.05',
    title: 'Máquina productora de hielo (15 °C → −5 °C)',
    level: 'Avanzado',
    originType: 'lecture',
    originLabel: 'Cátedra MEC110_7 · diapos 17–18',
    question: 'Una máquina produce 12 kg/h de hielo a −5 °C desde agua a 15 °C con COP = 2,4 (c_agua=4,184; h_fusión=333,7; c_hielo=2,11). Calcula la potencia eléctrica requerida en Watts [W].',
    physicalSystem: 'Enfriamiento sensible líquido + solidificación latente + subenfriamiento sólido',
    givens: ['ṁ = 12 kg/h', 'T_in = 15 °C', 'T_out = −5 °C', 'COP = 2,4'],
    assumptions: ['Sin pérdidas térmicas de gabinete', 'Cambio de fase completo a 0 °C'],
    targetVariable: '\\dot W_{\\text{in}}',
    targetUnit: 'W',
    expectedValue: 565.3,
    toleranceRelative: 0.015,
    competencies: ['B', 'C', 'D', 'E'],
    hints: [
      'Divide el proceso en 3 tramos: agua (15→0 °C), congelación a 0 °C, hielo (0→−5 °C).',
      'q_total = 4,184×15 + 333,7 + 2,11×5 = 407,01 kJ/kg.',
      'Convierte 12 kg/h a kg/s dividiendo por 3600 (= 0,003333 kg/s).',
      'Q̇_L = ṁ × q_total = 1,3567 kW; Ẇ_in = Q̇_L / 2,4 = 0,5653 kW.',
      'En Watts: 0,5653 × 1000 ≈ 565,3 W.',
    ],
    commonMistakeChecks: [
      {
        detectRange: [95, 135],
        diagnosis: 'Omitiste el calor latente de solidificación (333,7 kJ/kg), que es el 82 % de la carga.',
        remedy: 'Nunca uses un único mcΔT cuando hay cambio de fase sólido-líquido.',
      },
    ],
    simulatorLink: { tab: 'sim-carnot', label: 'Simular Hielo en Simulador 2' },
  },
  {
    id: 'C08-03',
    unit: 'Unidad V · Brayton',
    lessonId: 'T08.03',
    title: 'Eficiencia de Brayton real (100→480 kPa, η=85 %)',
    level: 'Avanzado',
    originType: 'lecture',
    originLabel: 'Cátedra MEC110_8 · diapos 19–20',
    question: 'Aire en Brayton opera entre 100 kPa (20 °C) y 480 kPa, T3 = 880 °C, con η_c = η_t = 0,85 (k=1,4; cp=1,005). Calcula la eficiencia térmica [%].',
    physicalSystem: 'Ciclo aire-estándar Brayton irreversible',
    givens: ['p1 = 100 kPa', 'p2 = 480 kPa', 'T1 = 293,15 K', 'T3 = 1153,15 K', 'η_c = η_t = 0,85'],
    assumptions: ['Gas ideal con cp constante', 'Sin regeneración'],
    targetVariable: '\\eta_{th}',
    targetUnit: '%',
    expectedValue: 23.91,
    toleranceRelative: 0.02,
    acceptedPercentageVariant: true,
    competencies: ['B', 'C', 'D', 'E'],
    hints: [
      'Calcula r_p = 4,8 y F = 4,8^(0,4/1,4) ≈ 1,5655.',
      'Estados ideales: T2s = 458,91 K; T4s = 736,62 K.',
      'Reales: T2a = 293,15 + (458,91−293,15)/0,85 = 488,17 K; T4a = 1153,15 − 0,85(1153,15−736,62) = 799,10 K.',
      'w_net = 1,005[(1153,15−799,10) − (488,17−293,15)] ≈ 159,83 kJ/kg; q_in = 668,46 kJ/kg.',
      'η_th ≈ 23,91 % (baja fuertemente desde 36,12 % ideal).',
    ],
    commonMistakeChecks: [
      {
        detectRange: [35, 37],
        diagnosis: 'Calculaste η_ideal = 1 − r_p^(-(k-1)/k) = 36,12 %, ignorando las eficiencias reales del 85 %.',
        remedy: '1 − r_p^(-(k-1)/k) solo vale para el ciclo Brayton ideal.',
      },
    ],
    simulatorLink: { tab: 'sim-brayton', label: 'Abrir en Simulador 3 (Brayton)' },
  },
  {
    id: 'C09-01',
    unit: 'Unidad VI · Rankine',
    lessonId: 'T09.01',
    title: 'Flujo de vapor en Rankine ideal 300 MW (Caso 4A)',
    level: 'Avanzado',
    originType: 'lecture',
    originLabel: 'Cátedra MEC110_9 · diapo 8',
    question: 'Un ciclo Rankine ideal de 300 MW opera entre 10 MPa (500 °C) y 10 kPa. Calcula el flujo másico de vapor necesario [kg/s].',
    physicalSystem: 'Planta Rankine simple ideal (IAPWS-IF97)',
    givens: ['Ẇ_net = 300 MW = 300000 kW', 'p3 = 10 MPa, T3 = 500 °C', 'p1 = 10 kPa'],
    assumptions: ['Turbina y bomba ideales', 'Condensador entrega líquido saturado'],
    targetVariable: '\\dot m',
    targetUnit: 'kg/s',
    expectedValue: 235.2,
    toleranceRelative: 0.02,
    competencies: ['A', 'B', 'C', 'D', 'E'],
    hints: [
      'Consulta en IF97: h3 ≈ 3375,1 kJ/kg, s3 ≈ 6,5995 kJ/(kg·K).',
      'Expansión isentrópica a 10 kPa: x4s ≈ 0,7934 → h4s ≈ 2089,7 kJ/kg.',
      'Trabajo de turbina w_T ≈ 1285,4 kJ/kg; bomba w_B ≈ 10,09 kJ/kg → w_neto ≈ 1275,3 kJ/kg.',
      'ṁ = 300.000 kW / 1275,3 kJ/kg.',
      'Resultado: ṁ ≈ 235,2 kg/s.',
    ],
    commonMistakeChecks: [
      {
        detectRange: [232, 234],
        diagnosis: 'Posible omisión del trabajo de bomba w_B ≈ 10,1 kJ/kg.',
        remedy: 'Incluye siempre w_neto = w_T − w_B.',
      },
    ],
    simulatorLink: { tab: 'sim-rankine', label: 'Abrir Caso 4A en Simulador 4' },
  },
];
