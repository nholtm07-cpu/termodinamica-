/**
 * Contenido pedagógico original de Transferencia de Calor ("Aprender la materia").
 * Redacción propia en español de Chile con atribución bibliográfica a Çengel (3.ª ed., 2007).
 */

import type { HeatCaseId } from '../domain/models';

export interface HeatLesson {
  id: string;
  order: number;
  title: string;
  cengelRef: string;
  difficulty: 'Desde cero' | 'Básico' | 'Intermedio' | 'Intermedio-alto' | 'Avanzado';
  linkedCase?: HeatCaseId;
  linkedNote: string;
  physicalQuestion: string;
  analogy: string;
  keyDistinction: string;
  variables: Array<{ symbol: string; name: string; unit: string; note: string }>;
  assumptions: string[];
  formulaLatex: string;
  derivation: string;
  miniExample: {
    statement: string;
    calculationLatex: string;
    interpretation: string;
  };
  commonMistake: string;
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    feedback: string;
  };
}

export const HEAT_LESSONS: HeatLesson[] = [
  {
    id: 'HT-00',
    order: 0,
    title: 'Alfabetización física y matemática: calor, potencia, flujo y Kelvin',
    cengelRef: 'Preparación SI · Cap. 1 (pp. 1–16)',
    difficulty: 'Desde cero',
    linkedCase: 'TC-C01',
    linkedNote: 'Base obligatoria antes de resolver TC-C01 y TC-C02.',
    physicalQuestion:
      '¿Por qué no es lo mismo decir «1.690 W», «16,9 kWh» o «35,2 W/m²», y cuándo es obligatorio sumar 273,15 a °C?',
    analogy:
      'La potencia térmica Q̇ (Watts = J/s) equivale al caudal de agua que sale por una manguera cada segundo; la energía Q (Joules o kWh) equivale a los litros totales acumulados en el balde al terminar el riego; el flujo q″ (W/m²) es cuánta agua cae por cada metro cuadrado de pasto.',
    keyDistinction:
      'Una diferencia de temperatura ΔT vale exactamente lo mismo en °C que en Kelvin (15 °C − 4 °C = 11 K). En cambio, cualquier temperatura absoluta elevada a potencia (como T⁴ en radiación) EXIGE usar Kelvin (T_K = T_°C + 273,15).',
    variables: [
      { symbol: 'Q', name: 'Calor (energía transferida)', unit: 'J o kWh', note: '1 kWh = 3,6 MJ' },
      { symbol: '\\dot Q', name: 'Tasa de transferencia (potencia)', unit: 'W = J/s', note: '1 kW = 1000 W' },
      { symbol: 'q\'\'', name: 'Flujo térmico superficial', unit: 'W/m²', note: 'q″ = Q̇ / A' },
      { symbol: 'T(\\text{K})', name: 'Temperatura absoluta', unit: 'K', note: 'T_K = T_°C + 273,15' },
    ],
    assumptions: [
      'Todas las ecuaciones físicas del motor trabajan internamente en SI puro (m, s, kg, W, J, K)',
      'Los ingresos en mm, cm, h, kW o kJ/(kg·K) se convierten explícitamente antes de sustituir',
    ],
    formulaLatex: 'Q = \\int \\dot Q\\,dt \\approx \\dot Q\\,\\Delta t, \\qquad T(\\text{K}) = T(^\\circ\\text{C}) + 273{,}15',
    derivation:
      'Si la tasa de calor Q̇ permanece constante durante un intervalo Δt, integrar energía por segundo a lo largo del tiempo da simplemente el producto Q = Q̇·Δt. Multiplicar kW por horas produce kWh directamente.',
    miniExample: {
      statement: 'Un panel disipa 1.500 W de potencia térmica constante durante 4 horas.',
      calculationLatex: '\\dot Q = 1{,}5\\,\\text{kW} \\implies Q = (1{,}5\\,\\text{kW})(4\\,\\text{h}) = 6{,}0\\,\\text{kWh} = 21{,}6\\,\\text{MJ}',
      interpretation: '1.500 W indica rapidez instantánea; 6,0 kWh indica la energía acumulada cobrable en tarifa eléctrica.',
    },
    commonMistake:
      'Multiplicar directamente Watts por tarifa USD/kWh sin dividir por 1000 ni multiplicar por horas, o sustituir °C directamente dentro de T⁴.',
    quickCheck: {
      question: 'Si una pared tiene cara interior a 22 °C y cara exterior a −3 °C, ¿cuánto vale ΔT en Kelvin?',
      options: ['298,15 K', '25 K', '19 K'],
      correctIndex: 1,
      feedback: 'Correcto: ΔT = 22 − (−3) = 25 °C = 25 K. Sumar 273,15 en ambos extremos se cancela en la resta.',
    },
  },
  {
    id: 'HT-01',
    order: 1,
    title: 'Conducción estacionaria y ley de Fourier en pared plana',
    cengelRef: 'Çengel 3.ª ed., Cap. 1–2 (pp. 17–25, 61–85)',
    difficulty: 'Desde cero',
    linkedCase: 'TC-C01',
    linkedNote: 'Resuelve directamente TC-C01 (techo de hormigón, Ejemplo 1-5).',
    physicalQuestion:
      '¿Cómo viaja el calor a través de una losa sólida sin que el material se mueva, y por qué duplicar el espesor reduce la pérdida a la mitad?',
    analogy:
      'Imagina una fila de personas pasándose baldes sin caminar de su puesto: cada molécula vibra y cede energía térmica a su vecina más fría. Cuanto más larga es la fila (espesor L), más lento es el traspaso; cuanto más ancha la puerta (área A), más baldes pasan a la vez.',
    keyDistinction:
      'Conductividad térmica k [W/(m·K)] es una propiedad intrínseca del material sólido (cobre ~400, hormigón ~0,8, aire estancado ~0,026). No confundir k con el coeficiente convectivo h.',
    variables: [
      { symbol: 'k', name: 'Conductividad térmica', unit: 'W/(m·K)', note: 'Facilidad de conducción del medio' },
      { symbol: 'A', name: 'Área perpendicular al flujo', unit: 'm²', note: 'Para pared rectangular A = a·b' },
      { symbol: 'L', name: 'Espesor recorrido por el calor', unit: 'm', note: 'En dirección del gradiente' },
      { symbol: 'dT/dx', name: 'Gradiente espacial de temperatura', unit: 'K/m', note: 'Negativo si T cae hacia +x' },
    ],
    assumptions: [
      'Conducción 1D perpendicular a las caras principales',
      'Estado estacionario (∂T/∂t = 0) y sin generación interna (q‴ = 0)',
      'Conductividad térmica k constante en el espesor L',
    ],
    formulaLatex: '\\dot Q_{\\text{cond}} = -k A \\frac{dT}{dx} = k A \\frac{T_{si} - T_{se}}{L}',
    derivation:
      'De la ecuación general d²T/dx² = 0 con T(0)=T_si y T(L)=T_se se obtiene T(x) = T_si + ((T_se−T_si)/L)·x. Su derivada es constante dT/dx = (T_se−T_si)/L; al sustituir en Fourier desaparece el signo menos invirtiendo la resta.',
    miniExample: {
      statement: 'Losa de A = 10 m², L = 0,20 m, k = 1,0 W/(m·K), caras a 20 °C y 10 °C.',
      calculationLatex: '\\dot Q = \\frac{(1{,}0)(10)(20 - 10)}{0{,}20} = 500\\,\\text{W}',
      interpretation: 'Si se duplica L a 0,40 m, la potencia cae exactamente a 250 W.',
    },
    commonMistake:
      'Usar L como longitud lateral de la losa en lugar del espesor paralelo al flujo de calor, o agregar convección inventada cuando el problema ya entrega T_si y T_se superficiales.',
    quickCheck: {
      question: 'En estado estacionario sin generación y k constante, ¿qué forma tiene T(x) dentro de una pared plana?',
      options: ['Exponencial decreciente', 'Lineal (recta)', 'Parabólica'],
      correctIndex: 1,
      feedback: 'Exacto: d²T/dx² = 0 tiene como solución una función lineal T(x) = C₁x + C₂.',
    },
  },
  {
    id: 'HT-02',
    order: 2,
    title: 'Convección de Newton, Radiación de Stefan–Boltzmann y mecanismos en paralelo',
    cengelRef: 'Çengel 3.ª ed., Cap. 1 y Cap. 12 (pp. 26–33, 663–690)',
    difficulty: 'Básico',
    linkedCase: 'TC-C02',
    linkedNote: 'Fundamenta TC-C02 (superficie expuesta simultáneamente a aire y paredes, Ej. 1-10).',
    physicalQuestion:
      '¿Por qué una persona o un radiador en una habitación tibia pierde casi tanta energía por radiación invisible como por convección del aire?',
    analogy:
      'Un objeto caliente en una sala tiene dos puertas de salida independientes abiertas al mismo tiempo: por una el aire en movimiento se lleva calor (convección) y por otra emite ondas electromagnéticas infrarrojas hacia las paredes (radiación).',
    keyDistinction:
      'Como ambos mecanismos nacen en la misma superficie T_s hacia los alrededores, sus flujos se SUMAN en paralelo (Q̇_total = Q̇_conv + Q̇_rad). Además, T_aire y T_alr pueden ser distintas si las paredes están más frías que el aire.',
    variables: [
      { symbol: 'h', name: 'Coeficiente convectivo', unit: 'W/(m²·K)', note: 'Depende del flujo y geometría' },
      { symbol: '\\varepsilon', name: 'Emisividad superficial', unit: 'adim. [0,1]', note: 'Cuerpo negro ideal = 1' },
      { symbol: '\\sigma', name: 'Constante de Stefan–Boltzmann', unit: 'W/(m²·K⁴)', note: '5,670374419×10⁻⁸' },
      { symbol: 'T_{s,\\text{K}}', name: 'Temperatura superficial absoluta', unit: 'K', note: 'Obligatoria en T⁴' },
    ],
    assumptions: [
      'Recinto circundante mucho mayor que la superficie emisora (factor de vista F ≈ 1)',
      'Superficie gris difusa con emisividad ε constante',
      'Sin evaporación ni conducción al piso incluidos en el modelo básico',
    ],
    formulaLatex: '\\dot Q_{\\text{conv}} = h A_s (T_s - T_{\\text{aire}}), \\qquad \\dot Q_{\\text{rad}} = \\varepsilon \\sigma A_s \\left(T_{s,\\text{K}}^4 - T_{\\text{alr},\\text{K}}^4\\right)',
    derivation:
      'La radiación emitida por el cuerpo es εσA_s T_s⁴ y la fracción absorbida proveniente del recinto grande isotermo a T_alr es α_rad σA_s T_alr⁴. Bajo superficie gris (α_rad = ε), la resta entrega εσA_s(T_s⁴ − T_alr⁴).',
    miniExample: {
      statement: 'Superficie a 300 K (≈ 26,85 °C) con ε = 0,9 y A = 1 m² frente a paredes a 290 K.',
      calculationLatex: '\\dot Q_{\\text{rad}} = (0{,}9)(5{,}670374\\times 10^{-8})(1)(300^4 - 290^4) \\approx 52{,}41\\,\\text{W}',
      interpretation: 'Elevar (300 − 290)⁴ = 10⁴ habría subestimado el resultado en más de mil millones de veces.',
    },
    commonMistake:
      'Calcular (T_s − T_alr)⁴ en vez de (T_s,K⁴ − T_alr,K⁴), o usar °C dentro de la cuarta potencia.',
    quickCheck: {
      question: 'Si duplicas el coeficiente convectivo h manteniendo iguales todas las temperaturas y ε, ¿qué ocurre con Q̇_rad?',
      options: ['Se duplica también', 'Permanece igual (si T_s no cambia)', 'Se anula'],
      correctIndex: 1,
      feedback: 'Correcto: Q̇_rad depende de ε, σ, A_s y las temperaturas absolutas; no depende de h mientras T_s esté fijada.',
    },
  },
  {
    id: 'HT-03',
    order: 3,
    title: 'Circuitos de resistencias térmicas, cilindros, radio crítico y aletas',
    cengelRef: 'Çengel 3.ª ed., Cap. 3 (pp. 131–186)',
    difficulty: 'Intermedio',
    linkedCase: 'TC-C03',
    linkedNote: 'Sustenta TC-C03 (ventana de doble vidrio con 5 resistencias en serie, Ej. 3-3).',
    physicalQuestion:
      '¿Cómo se analiza una pared o ventana multicapa con aire atrapado entre vidrios, y por qué el área cambia en tuberías?',
    analogy:
      'El flujo de calor Q̇ hace el papel de la corriente eléctrica I, la diferencia de temperatura ΔT hace de voltaje ΔV, y cada capa sólida o película convectiva actúa como una resistencia R en serie o paralelo.',
    keyDistinction:
      'En una ventana de doble vidrio existen CINCO resistencias en serie: película interior + vidrio 1 + cámara de aire + vidrio 2 + película exterior. Además, en cilindros no aplica L/(kA) porque el área 2πrL crece con el radio.',
    variables: [
      { symbol: 'R_{\\text{cond,plana}}', name: 'Resistencia conductiva plana', unit: 'K/W', note: 'L / (k·A)' },
      { symbol: 'R_{\\text{conv}}', name: 'Resistencia convectiva', unit: 'K/W', note: '1 / (h·A)' },
      { symbol: 'R_{\\text{cil}}', name: 'Resistencia radial cilíndrica', unit: 'K/W', note: 'ln(r_o/r_i)/(2πkL)' },
      { symbol: 'r_{\\text{cr}}', name: 'Radio crítico de aislamiento (cilindro)', unit: 'm', note: 'k_ais / h_o' },
    ],
    assumptions: [
      'Flujo 1D estacionario sin puentes térmicos en marcos ni fuentes internas',
      'En TC-C03, h_i y h_o ya incluyen radiación efectiva (no sumar radiación adicional)',
    ],
    formulaLatex: 'R_{\\text{serie}} = \\sum_{j=1}^{n} R_j, \\quad \\dot Q = \\frac{T_{\\infty,i} - T_{\\infty,o}}{R_{\\text{total}}}, \\quad T_{j+1} = T_j - \\dot Q R_j',
    derivation:
      'Al atravesar el mismo flujo Q̇ cada capa en serie, ΔT_j = Q̇·R_j. Sumando todas las caídas térmicas se cancelan las temperaturas intermedias y queda T_∞,i − T_∞,o = Q̇·ΣR_j.',
    miniExample: {
      statement: 'Aleta recta uniforme (m = √(hP/kA_c)) vs pared multicapa con resistencia de contacto R″_c.',
      calculationLatex: '\\dot Q_{\\text{aleta,adiab}} = \\sqrt{h P k A_c}\\,(T_b - T_\\infty)\\tanh(m L_c), \\quad R_{\\text{contacto}} = \\frac{R\'\'_c}{A}',
      interpretation: 'Las aletas reducen la resistencia convectiva ampliando el área; los aislantes aumentan R_cond.',
    },
    commonMistake:
      'Contar solo 3 o 4 resistencias en una ventana doble olvidando las películas convectivas, o usar R = (r_o−r_i)/(kA) en un tubo.',
    quickCheck: {
      question: 'En una ventana de doble vidrio estándar (4 mm vidrio / 10 mm aire / 4 mm vidrio), ¿qué capa aporta la mayor resistencia (~74 %)?',
      options: ['Los dos vidrios', 'La película exterior', 'La cámara de aire estancado'],
      correctIndex: 2,
      feedback: 'Exacto: el aire en reposo tiene k ≈ 0,026 W/(m·K), ~30 veces menor que el vidrio.',
    },
  },
  {
    id: 'HT-04',
    order: 4,
    title: 'Conducción transitoria: números de Biot, Fourier y capacidad concentrada',
    cengelRef: 'Çengel 3.ª ed., Cap. 4 (pp. 217–255)',
    difficulty: 'Intermedio-alto',
    linkedCase: 'TC-C04',
    linkedNote: 'Gobierna TC-C04 (termopar esférico, Ej. 4-1) y su bloqueo obligatorio cuando Bi ≥ 0,1.',
    physicalQuestion:
      '¿Cuándo podemos suponer que todo un sólido tiene la misma temperatura mientras se calienta o enfría, y cuánto demora en alcanzar el 99 % del cambio?',
    analogy:
      'Piensa en un balde lleno de agua vaciándose por un caño delgado: si el balde es ancho y de metal muy conductor, el nivel interno baja parejo (Bi < 0,1). Si es una esponja gigante donde el agua casi no fluye adentro (Bi ≥ 0,1), la superficie se seca antes que el centro.',
    keyDistinction:
      'El número de Biot (Bi = h·L_c/k_sólido) usa la conductividad del SÓLIDO k_s y decide si el modelo concentrado es válido. El número de Fourier (Fo = αt/L_*²) es el tiempo adimensional usando difusividad α = k/(ρc_p).',
    variables: [
      { symbol: 'L_c', name: 'Longitud característica', unit: 'm', note: 'V/A_s (= D/6 en esfera)' },
      { symbol: 'Bi', name: 'Número de Biot', unit: 'adim.', note: 'Criterio concentrado: Bi < 0,1' },
      { symbol: 'b', name: 'Tasa exponencial inversa', unit: 's⁻¹', note: 'h / (ρ·c_p·L_c)' },
      { symbol: '\\tau', name: 'Constante de tiempo térmica', unit: 's', note: 'τ = 1/b (63,2 % respuesta)' },
    ],
    assumptions: [
      'Bi < 0,1 para considerar temperatura interna espacialmente uniforme',
      'Propiedades k, ρ, c_p constantes y ambiente T_∞ constante',
      'Para sólidos grandes donde Bi ≥ 0,1 o t corto en la piel: usar sólido semiinfinito con función error erf(x/(2√(αt)))',
    ],
    formulaLatex: 'Bi = \\frac{h L_c}{k}, \\qquad \\frac{T(t) - T_\\infty}{T_i - T_\\infty} = e^{-b t}, \\qquad t = -\\frac{\\ln(1 - \\text{Resp.}\\%/100)}{b}',
    derivation:
      'El balance ρVc_p(dT/dt) = hA_s(T_∞ − T) se separa en dT/(T−T_∞) = −b·dt. Integrando desde T_i en t=0 resulta la ley exponencial. Para 99 % de respuesta, la fracción restante es 0,01; nunca puede llegar al 100 % en tiempo finito.',
    miniExample: {
      statement: 'Unión esférica de D = 1 mm, k = 35 W/mK, h = 210 W/m²K.',
      calculationLatex: 'L_c = \\frac{0{,}001}{6} = 1{,}667\\times 10^{-4}\\,\\text{m} \\implies Bi = \\frac{210 \\cdot 1{,}667\\times 10^{-4}}{35} = 0{,}001 < 0{,}1',
      interpretation: 'Bi = 0,001 está 100 veces por debajo del límite 0,1: la hipótesis concentrada es altamente precisa.',
    },
    commonMistake:
      'Usar k del gas en lugar de k del sólido al calcular Bi, o intentar evaluar ln(0) pidiendo exactamente 100 % de respuesta.',
    quickCheck: {
      question: 'Si Bi resulta igual a 0,35 en una pieza gruesa de baja conductividad, ¿qué debe hacer el ingeniero?',
      options: ['Usar igual T(t)=T_∞+(T_i−T_∞)e^(−bt)', 'Rechazar capacidad concentrada y usar modelo espacial distribuido', 'Dividir el tiempo por 0,35'],
      correctIndex: 1,
      feedback: 'Correcto: con Bi ≥ 0,1 existen gradientes internos importantes; el modelo concentrado queda científicamente bloqueado.',
    },
  },
  {
    id: 'HT-05',
    order: 5,
    title: 'Métodos numéricos en conducción: diferencias finitas y estabilidad',
    cengelRef: 'Çengel 3.ª ed., Cap. 5 (pp. 285–325)',
    difficulty: 'Avanzado',
    linkedNote: 'Extiende el análisis de TC-C01 y TC-C04 a geometrías o transitorios sin solución analítica simple.',
    physicalQuestion:
      '¿Cómo resuelve un computador la distribución de temperaturas en una pieza real cuando la fórmula analítica ya no alcanza, y por qué puede explotar numéricamente si Δt es muy grande?',
    analogy:
      'Dividimos la barra en pequeños bloques (nodos separados por Δx) y tomamos fotografías cada Δt segundos. Cada nodo actualiza su temperatura promediando a sus vecinos; si el paso Δt es demasiado largo, un nodo sobreestima la corrección y empieza a oscilar sin límite.',
    keyDistinction:
      'En 1D explícito sin convección en borde, la estabilidad exige Fo_Δx = αΔt/Δx² ≤ 0,5. Además, un dibujo en malla de diferencias finitas NO es CFD a menos que resuelva ecuaciones de Navier–Stokes del fluido.',
    variables: [
      { symbol: '\\Delta x', name: 'Paso espacial de malla', unit: 'm', note: 'Distancia entre nodos vecinos' },
      { symbol: '\\Delta t', name: 'Paso temporal', unit: 's', note: 'Limitado en esquema explícito' },
      { symbol: 'Fo_{\\Delta x}', name: 'Número de Fourier de malla', unit: 'adim.', note: 'α·Δt / Δx² ≤ 0,5 en 1D interior' },
    ],
    assumptions: [
      'Malla uniforme y propiedades térmicas constantes en cada nodo',
      'Fronteras convección/radiación imponen restricciones de estabilidad aún más estrictas que 0,5',
    ],
    formulaLatex: 'T_i^{n+1} = T_i^n + Fo_{\\Delta x}\\left(T_{i+1}^n - 2 T_i^n + T_{i-1}^n\\right) + \\frac{q\'\'\'\\Delta t}{\\rho c_p}, \\qquad Fo_{\\Delta x} \\le \\frac{1}{2}',
    derivation:
      'Reemplazando ∂T/∂t ≈ (T_i^{n+1}−T_i^n)/Δt y ∂²T/∂x² ≈ (T_{i+1}^n − 2T_i^n + T_{i-1}^n)/Δx² en la ecuación de difusión, el coeficiente que multiplica a T_i^n es (1 − 2·Fo_Δx), el cual debe ser ≥ 0 para no violar el principio físico.',
    miniExample: {
      statement: 'Acero con α = 1,2×10⁻⁵ m²/s y malla Δx = 0,01 m.',
      calculationLatex: '\\Delta t_{\\max} = \\frac{0{,}5\\,\\Delta x^2}{\\alpha} = \\frac{0{,}5(0{,}01)^2}{1{,}2\\times 10^{-5}} \\approx 4{,}17\\,\\text{s}',
      interpretation: 'Para simular con esquema explícito debemos elegir Δt ≤ 4,17 s o usar un esquema implícito incondicionalmente estable.',
    },
    commonMistake:
      'Reducir Δx a la mitad sin reducir Δt a la cuarta parte (ya que Δt_max ∝ Δx²), provocando oscilaciones no físicas.',
    quickCheck: {
      question: 'En estado estacionario 1D sin generación interna y malla uniforme, ¿a qué equivale T_i de un nodo interior?',
      options: ['Al promedio (T_{i-1} + T_{i+1})/2', 'Al doble de T_{i-1}', 'A cero siempre'],
      correctIndex: 0,
      feedback: 'Exacto: 0 = T_{i-1} − 2T_i + T_{i+1} ⇒ T_i = (T_{i-1} + T_{i+1})/2.',
    },
  },
  {
    id: 'HT-06',
    order: 6,
    title: 'Convección forzada y natural: Re, Pr, Nu, Gr/Ra y criterios de correlación',
    cengelRef: 'Çengel 3.ª ed., Cap. 6–9 (pp. 355–535)',
    difficulty: 'Intermedio',
    linkedNote: 'Explica cómo se determinan los coeficientes h empleados en TC-C02, TC-C03, TC-C04 y TC-C05.',
    physicalQuestion:
      '¿De dónde sale el coeficiente convectivo h en un problema real si h NO es una propiedad fija del agua ni del aire?',
    analogy:
      'El coeficiente h mide qué tan rápido se renueva la capa de fluido pegada a la pared (capa límite). Si soplas rápido (Re alto), la capa térmica es delgada y h sube; si no hay ventilador, el aire tibio sube solo por flotación (convección natural, Ra).',
    keyDistinction:
      'Ninguna correlación de Nusselt es universal: antes de aplicarla debes identificar geometría (placa, tubo, cilindro), régimen (laminar vs turbulento), condición de frontera (T_s cte vs q″ cte) y rango de Re/Pr/Ra.',
    variables: [
      { symbol: 'Re', name: 'Número de Reynolds', unit: 'adim.', note: 'V·L_*/ν (inercia/viscosidad)' },
      { symbol: 'Pr', name: 'Número de Prandtl', unit: 'adim.', note: 'ν/α_f = μc_p/k_f' },
      { symbol: 'Nu', name: 'Número de Nusselt', unit: 'adim.', note: 'h·L_*/k_fluido ⇒ h = Nu·k_f/L_*' },
      { symbol: 'Ra', name: 'Número de Rayleigh (natural)', unit: 'adim.', note: 'Gr·Pr = gβ|T_s−T_∞|L³/(να_f)' },
    ],
    assumptions: [
      'Propiedades del fluido evaluadas típicamente a temperatura de película T_f = (T_s + T_∞)/2 (externa) o temperatura media global (interna)',
      'Transición en placa plana lisa suele ubicarse alrededor de Re_x ≈ 5×10⁵; en tubo circular laminar Re_D < 2300',
    ],
    formulaLatex: 'Nu_L = 0{,}664\\,Re_L^{1/2}Pr^{1/3}\\;(\\text{placa lam.}), \\quad Nu_D = 0{,}023\\,Re_D^{0{,}8}Pr^n\\;(\\text{Dittus–Boelter}), \\quad Nu_{\\text{nat}} = \\left[0{,}825 + \\frac{0{,}387\\,Ra_L^{1/6}}{\\left(1+(0{,}492/Pr)^{9/16}\\right)^{8/27}}\\right]^2',
    derivation:
      'Mediante análisis dimensional de las ecuaciones de capa límite, h se adimensionaliza como Nu = hL_*/k_f, el cual queda en función de Re y Pr (forzada) o Gr·Pr = Ra (natural por empuje térmico).',
    miniExample: {
      statement: 'Tubo interno completamente desarrollado laminar con T_s constante frente a flujo turbulento (Re = 25.000, Pr = 4, calentamiento n = 0,4).',
      calculationLatex: 'Nu_{\\text{lam},T_s} = 3{,}66, \\qquad Nu_{\\text{turb}} = 0{,}023(25000)^{0{,}8}(4)^{0{,}4} \\approx 132{,}1',
      interpretation: 'El flujo turbulento mezcla el fluido transversalmente y multiplica más de 30 veces el Nusselt respecto al laminar.',
    },
    commonMistake:
      'Usar k del metal en Nu = hL/k (siempre es k del FLUIDO), o aplicar Dittus–Boelter en régimen laminar o transicional.',
    quickCheck: {
      question: 'En Nu = h·D/k para flujo de agua dentro de una tubería de cobre, ¿a qué material corresponde la conductividad k?',
      options: ['Al cobre de la pared', 'Al agua (fluido)', 'Al promedio de ambos'],
      correctIndex: 1,
      feedback: 'Correcto: en el número de Nusselt, k es siempre la conductividad térmica del fluido evaluada en la capa límite.',
    },
  },
  {
    id: 'HT-07',
    order: 7,
    title: 'Intercambiadores de calor: balances térmicos, LMTD y efectividad–NTU',
    cengelRef: 'Çengel 3.ª ed., Cap. 11 (pp. 609–650)',
    difficulty: 'Avanzado',
    linkedCase: 'TC-C05',
    linkedNote: 'Modela integralmente TC-C05 (doble tubo a contraflujo, Ej. 11-4 y 11-8 NTU).',
    physicalQuestion:
      '¿Por qué no puede usarse el promedio aritmético de temperaturas en un intercambiador y cómo elegimos entre LMTD y efectividad–NTU?',
    analogy:
      'Dos trenes circulando por vías paralelas intercambian pasajeros: si viajan en sentidos opuestos (contraflujo), el tren frío al salir se encuentra con el tren caliente recién ingresado, manteniendo un empuje térmico vigoroso de punta a punta.',
    keyDistinction:
      'LMTD es ideal cuando conoces todas las temperaturas terminales (problema de dimensionamiento: hallar A y L). Efectividad–NTU es ideal cuando ya conoces el tamaño U·A del equipo y deseas predecir las temperaturas de salida.',
    variables: [
      { symbol: 'C = \\dot m c_p', name: 'Tasa de capacidad calorífica', unit: 'W/K', note: 'Watts por cada Kelvin de cambio' },
      { symbol: '\\Delta T_{\\text{lm}}', name: 'Diferencia media logarítmica', unit: 'K', note: '(ΔT₂ − ΔT₁) / ln(ΔT₂/ΔT₁)' },
      { symbol: 'U', name: 'Coeficiente global de transferencia', unit: 'W/(m²·K)', note: '1/(UA) = ΣR_totales' },
      { symbol: '\\varepsilon, \\text{NTU}', name: 'Efectividad y unidades de transf.', unit: 'adim.', note: 'ε = Q̇/Q̇_max; NTU = UA/C_min' },
    ],
    assumptions: [
      'Equipo adiabático hacia el exterior, régimen estacionario, sin cambio de fase (c_p constante)',
      'Factor F = 1 para doble tubo puro paralelo o contraflujo; si ΔT₁ ≈ ΔT₂ usar límite estable ΔT_lm → ΔT₁',
    ],
    formulaLatex: '\\dot Q = U A F \\Delta T_{\\text{lm}}, \\qquad \\varepsilon_{\\text{cf}} = \\frac{1 - \\exp[-\\text{NTU}(1-C_r)]}{1 - C_r \\exp[-\\text{NTU}(1-C_r)]}\\;(C_r \\ne 1)',
    derivation:
      'Integrando dQ̇ = U(T_h − T_c)dA = −C_h dT_h = C_c dT_c entre ambos extremos del tubo se demuestra que ln(ΔT₂/ΔT₁) = −UA(1/C_h ± 1/C_c), de donde emerge exactamente ΔT_lm.',
    miniExample: {
      statement: 'Agua fría (C_c = 5016 W/K) sube de 20 a 80 °C usando agua geotérmica (C_h = 8620 W/K) a 160 °C.',
      calculationLatex: '\\dot Q = 5016(60) = 300{,}96\\,\\text{kW} \\implies T_{h,\\text{sal}} = 160 - \\frac{300960}{8620} = 125{,}09\\,^\\circ\\text{C}',
      interpretation: 'Ambos saltos terminales (80 K y 105,09 K) son positivos, dando LMTD = 91,97 K y A = 5,113 m².',
    },
    commonMistake:
      'Usar la media aritmética (ΔT₁+ΔT₂)/2 en vez de LMTD, confundir ΔT₁/ΔT₂ de contraflujo con paralelo, o aceptar un caso donde T_c,sal > T_h,sal en flujo paralelo.',
    quickCheck: {
      question: 'En un dimensionamiento con temperaturas y caudales fijos, si mejoras el diseño duplicando U, ¿qué pasa con la potencia Q̇ y con el área A?',
      options: ['Q̇ se duplica y A queda igual', 'Q̇ no cambia (fijado por el balance) y A cae a la mitad', 'Ambos caen a la mitad'],
      correctIndex: 1,
      feedback: 'Exacto: las temperaturas terminales fijan Q̇ = C_c·ΔT_c; mayor U permite transferir ese mismo calor con menor área A.',
    },
  },
  {
    id: 'HT-08',
    order: 8,
    title: 'Cambio de fase, radiación avanzada y transferencia de masa',
    cengelRef: 'Çengel 3.ª ed., Cap. 10, 13 y 14 (pp. 561–608, 709–790)',
    difficulty: 'Avanzado',
    linkedNote: 'Completa el mapa de capítulos 10, 13 y 14 de Çengel para cursos superiores y diseño industrial.',
    physicalQuestion:
      '¿Qué cambia cuando el fluido hierve o condensa a temperatura casi constante, cómo actúa un blindaje radiativo y qué analogía conecta calor con difusión de masa?',
    analogy:
      'Hervir rompe enlaces líquidos con calor latente h_fg enorme sin subir °C; un escudo térmico reflectante corta la radiación interponiendo dos resistencias superficiales adicionales; la ley de Fick difunde moléculas igual que Fourier difunde calor.',
    keyDistinction:
      'En ebullición en estanque superar el flujo crítico de calor (CHF) provoca transición abrupta a ebullición en película (aislante de vapor) y posible fusión de la pared. Además, la evaporación real acopla calor y masa (no basta Q = mc_pΔT).',
    variables: [
      { symbol: 'h_{fg}', name: 'Entalpía de vaporización', unit: 'J/kg', note: 'Depende de presión (no fijar 2257 kJ/kg siempre)' },
      { symbol: 'F_{ij}', name: 'Factor de visión radiativo', unit: 'adim.', note: 'A_i F_ij = A_j F_ji; ΣF_ij = 1' },
      { symbol: 'D_{AB}', name: 'Difusividad másica (Fick)', unit: 'm²/s', note: 'Análoga a α en calor' },
    ],
    assumptions: [
      'Recintos cerrados con superficies difusas grises para red de radiosidad',
      'Analogía calor-masa (Pr ↔ Sc, Nu ↔ Sh) válida solo a concentraciones bajas sin flujo másico alto acoplado',
    ],
    formulaLatex: 'q\'\'_{\\text{placas}} = \\frac{\\sigma(T_1^4 - T_2^4)}{\\frac{1}{\\varepsilon_1} + \\frac{1}{\\varepsilon_2} - 1}, \\qquad Q_{\\text{latente}} = m\\,h_{fg}, \\qquad j_A = -D_{AB}\\frac{dc_A}{dx}',
    derivation:
      'Al insertar un blindaje delgado de emisividad ε_s entre dos placas negras a T₁ y T₂, se forman dos resistencias radiativas en serie de valor 1/ε_s cada una respecto a placas negras, reduciendo el flujo en factor 1/(2/ε_s − 1) (o ε_s/2 para ε_1=ε_2=1).',
    miniExample: {
      statement: 'Dos placas negras grandes separadas por un escudo de aluminio pulido con ε_s = 0,05.',
      calculationLatex: '\\frac{\\dot q_{\\text{con escudo}}}{\\dot q_{\\text{sin escudo}}} = \\frac{1}{\\frac{2}{0{,}05} - 1} = \\frac{1}{39} \\approx 2{,}56\\%',
      interpretation: 'Un simple papel reflectante reduce la radiación neta en más de un 97 %.',
    },
    commonMistake:
      'Asumir h_fg = 2257 kJ/kg a cualquier presión (solo vale a 1 atm) o suponer un porcentaje fijo arbitrario para blindajes radiativos.',
    quickCheck: {
      question: 'En un recinto cerrado compuesto por 3 superficies, ¿cuánto debe valer F₁₁ + F₁₂ + F₁₃?',
      options: ['Depende del área', 'Exactamente 1', 'Igual a ε₁'],
      correctIndex: 1,
      feedback: 'Correcto: por conservación de la energía radiante saliente, la suma de factores de visión desde una superficie hacia todo el recinto cerrado es 1.',
    },
  },
];

export const HT_SYMBOLS_DICTIONARY = [
  { symbol: 'Q', name: 'Calor (energía térmica transferida)', unit: 'J o kWh', note: 'No confundir con potencia Q̇' },
  { symbol: 'Q̇', name: 'Tasa de transferencia de calor', unit: 'W (J/s)', note: '1 kW = 1000 W' },
  { symbol: 'q″', name: 'Flujo térmico superficial', unit: 'W/m²', note: 'q″ = Q̇ / A' },
  { symbol: 'q‴', name: 'Generación volumétrica de calor', unit: 'W/m³', note: 'Fuente interna' },
  { symbol: 'T_s, T_∞', name: 'Temperatura superficial / fluido libre', unit: '°C o K', note: 'Kelvin obligatorio en T⁴' },
  { symbol: 'k', name: 'Conductividad térmica', unit: 'W/(m·K)', note: 'Propiedad del material' },
  { symbol: 'h', name: 'Coeficiente convectivo', unit: 'W/(m²·K)', note: 'Depende de flujo, geometría y régimen' },
  { symbol: 'ε', name: 'Emisividad superficial', unit: 'adim. [0..1]', note: 'Relación con cuerpo negro' },
  { symbol: 'σ', name: 'Constante de Stefan–Boltzmann', unit: 'W/(m²·K⁴)', note: '5,670374419×10⁻⁸ SI' },
  { symbol: 'α', name: 'Difusividad térmica', unit: 'm²/s', note: 'α = k / (ρ·c_p)' },
  { symbol: 'R_t', name: 'Resistencia térmica', unit: 'K/W', note: 'L/(kA), 1/(hA), ln(r_o/r_i)/(2πkL)' },
  { symbol: 'Bi', name: 'Número de Biot', unit: 'adim.', note: 'h·L_c / k_sólido (< 0,1 concentrado)' },
  { symbol: 'Fo', name: 'Número de Fourier', unit: 'adim.', note: 'α·t / L_*²' },
  { symbol: 'Re, Pr, Nu', name: 'Reynolds, Prandtl, Nusselt', unit: 'adim.', note: 'Convección forzada' },
  { symbol: 'Gr, Ra', name: 'Grashof, Rayleigh', unit: 'adim.', note: 'Convección natural' },
  { symbol: 'C = ṁ·c_p', name: 'Tasa de capacidad calorífica', unit: 'W/K', note: 'Intercambiadores' },
  { symbol: 'U', name: 'Coeficiente global de transferencia', unit: 'W/(m²·K)', note: 'Referido a área declarada' },
  { symbol: 'LMTD', name: 'Diferencia media logarítmica', unit: 'K', note: '(ΔT₂−ΔT₁)/ln(ΔT₂/ΔT₁)' },
  { symbol: 'NTU, ε', name: 'Unidades de transf. y efectividad', unit: 'adim.', note: 'NTU = UA/C_min; ε = Q̇/Q̇_max' },
  { symbol: 'F_ij', name: 'Factor de visión radiativo', unit: 'adim.', note: 'Reciprocidad A_i F_ij = A_j F_ji' },
];

export const HT_FORMULAS_BANK = [
  {
    id: 'F-FOURIER',
    title: 'Ley de conducción de Fourier (pared plana)',
    latex: '\\dot Q = -kA\\frac{dT}{dx} = kA\\frac{T_{si}-T_{se}}{L}',
    validity: '1D estacionario, k constante, sin generación interna.',
    linkedCase: 'TC-C01' as HeatCaseId,
  },
  {
    id: 'F-NEWTON',
    title: 'Ley de enfriamiento de Newton (convección)',
    latex: '\\dot Q_{\\text{conv}} = h A_s (T_s - T_{\\text{aire}})',
    validity: 'h promedio representativo de la geometría y régimen.',
    linkedCase: 'TC-C02' as HeatCaseId,
  },
  {
    id: 'F-STEFAN',
    title: 'Radiación neta hacia recinto grande isotermo',
    latex: '\\dot Q_{\\text{rad}} = \\varepsilon \\sigma A_s (T_{s,\\text{K}}^4 - T_{\\text{alr},\\text{K}}^4)',
    validity: 'Temperaturas en Kelvin; superficie gris difusa; F ≈ 1.',
    linkedCase: 'TC-C02' as HeatCaseId,
  },
  {
    id: 'F-RESIST',
    title: 'Resistencias térmicas planas y radiales',
    latex: 'R_{\\text{plana}}=\\frac{L}{kA},\\; R_{\\text{conv}}=\\frac{1}{hA},\\; R_{\\text{cil}}=\\frac{\\ln(r_o/r_i)}{2\\pi k L},\\; R_{\\text{esf}}=\\frac{r_o-r_i}{4\\pi k r_i r_o}',
    validity: '1D estacionario sin generación; circuito en serie suma R_j.',
    linkedCase: 'TC-C03' as HeatCaseId,
  },
  {
    id: 'F-LUMPED',
    title: 'Sistema de capacidad concentrada (transitorio)',
    latex: 'Bi=\\frac{hL_c}{k}<0{,}1 \\implies \\frac{T(t)-T_\\infty}{T_i-T_\\infty}=\\exp\\left(-\\frac{hA_s}{\\rho V c_p}t\\right)',
    validity: 'Estricto Bi < 0,1; T_∞ constante; L_c = V/A_s.',
    linkedCase: 'TC-C04' as HeatCaseId,
  },
  {
    id: 'F-FINITE-DIFF',
    title: 'Esquema explícito 1D en diferencias finitas',
    latex: 'T_i^{n+1} = T_i^n + Fo_{\\Delta x}(T_{i+1}^n - 2T_i^n + T_{i-1}^n), \\quad Fo_{\\Delta x}=\\frac{\\alpha\\Delta t}{\\Delta x^2}\\le 0{,}5',
    validity: 'Malla uniforme interior 1D sin fuentes no lineales.',
  },
  {
    id: 'F-CONV-CORR',
    title: 'Correlaciones fundamentales de convección',
    latex: 'Nu_{\\text{placa,lam}}=0{,}664Re_L^{1/2}Pr^{1/3}, \\quad Nu_{\\text{tubo,turb}}=0{,}023Re_D^{0{,}8}Pr^n',
    validity: 'Dittus–Boelter: Re≳10⁴, 0,7≤Pr≤160, L/D≳10 (n=0,4 cal., 0,3 enf.).',
  },
  {
    id: 'F-HX',
    title: 'Diseño de intercambiadores (LMTD y ε–NTU)',
    latex: '\\dot Q = U A F \\Delta T_{\\text{lm}}, \\qquad \\Delta T_{\\text{lm}} = \\frac{\\Delta T_2 - \\Delta T_1}{\\ln(\\Delta T_2/\\Delta T_1)}',
    validity: 'Sin pérdidas ni cambio de fase; c_p constante; ΔT₁, ΔT₂ > 0.',
    linkedCase: 'TC-C05' as HeatCaseId,
  },
];

export const CENGEL_CHAPTER_MAP = [
  { cap: 1, title: 'Introducción y conceptos básicos', page: 'p. 1', lessonId: 'HT-00', caseId: 'TC-C01 / TC-C02' },
  { cap: 2, title: 'Ecuación de la conducción de calor', page: 'p. 61', lessonId: 'HT-01', caseId: 'TC-C01' },
  { cap: 3, title: 'Conducción de calor en estado estacionario', page: 'p. 131', lessonId: 'HT-03', caseId: 'TC-C03' },
  { cap: 4, title: 'Conducción de calor en régimen transitorio', page: 'p. 217', lessonId: 'HT-04', caseId: 'TC-C04' },
  { cap: 5, title: 'Métodos numéricos en conducción de calor', page: 'p. 285', lessonId: 'HT-05', caseId: 'Ampliación' },
  { cap: 6, title: 'Fundamentos de la convección', page: 'p. 355', lessonId: 'HT-06', caseId: 'Base h' },
  { cap: 7, title: 'Convección externa forzada', page: 'p. 395', lessonId: 'HT-06', caseId: 'Base h' },
  { cap: 8, title: 'Convección interna forzada', page: 'p. 451', lessonId: 'HT-06', caseId: 'Base TC-C05' },
  { cap: 9, title: 'Convección natural', page: 'p. 503', lessonId: 'HT-06', caseId: 'Alerta TC-C03' },
  { cap: 10, title: 'Ebullición y condensación', page: 'p. 561', lessonId: 'HT-08', caseId: 'Ampliación' },
  { cap: 11, title: 'Intercambiadores de calor', page: 'p. 609', lessonId: 'HT-07', caseId: 'TC-C05' },
  { cap: 12, title: 'Fundamentos de radiación térmica', page: 'p. 663', lessonId: 'HT-02', caseId: 'TC-C02' },
  { cap: 13, title: 'Transferencia de calor por radiación', page: 'p. 709', lessonId: 'HT-08', caseId: 'Ampliación' },
  { cap: 14, title: 'Transferencia de masa (ampliación)', page: 'p. 773', lessonId: 'HT-08', caseId: 'Opcional' },
];
