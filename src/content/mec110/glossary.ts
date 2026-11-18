/**
 * Diccionario de símbolos, glosario contextual, guía de sistemas y método de 7 pasos.
 * Contenido de apoyo para "El Profesor al Lado" (MEC110).
 */

export interface SymbolEntry {
  symbol: string;
  latex: string;
  name: string;
  category: 'Intensiva' | 'Extensiva' | 'Transferencia (no es propiedad)' | 'Adimensional / Constante';
  unitSI: string;
  practicalUnit: string;
  meaning: string;
  typicalTrap: string;
}

export const SYMBOL_DICTIONARY: SymbolEntry[] = [
  {
    symbol: 'T',
    latex: 'T',
    name: 'Temperatura absoluta',
    category: 'Intensiva',
    unitSI: 'K',
    practicalUnit: '°C (solo diferencias ΔT)',
    meaning: 'Medida macroscópica de energía térmica media; determina dirección espontánea de calor.',
    typicalTrap: 'Usar °C en pV=mRT o en η_Carnot = 1 − T_L/T_H.',
  },
  {
    symbol: 'p',
    latex: 'p',
    name: 'Presión absoluta',
    category: 'Intensiva',
    unitSI: 'Pa',
    practicalUnit: 'kPa, MPa, bar',
    meaning: 'Fuerza normal por unidad de área ejercida por el fluido.',
    typicalTrap: 'Confundir presión manométrica (relativa al ambiente) con presión absoluta.',
  },
  {
    symbol: 'v',
    latex: 'v',
    name: 'Volumen específico',
    category: 'Intensiva',
    unitSI: 'm³/kg',
    practicalUnit: 'm³/kg',
    meaning: 'Volumen ocupado por 1 kg de sustancia (v = V/m = 1/ρ).',
    typicalTrap: 'Confundir v (intensiva) con V volumen total [m³] o V_f rapidez [m/s].',
  },
  {
    symbol: 'u',
    latex: 'u',
    name: 'Energía interna específica',
    category: 'Intensiva',
    unitSI: 'J/kg',
    practicalUnit: 'kJ/kg',
    meaning: 'Energía microscópica molecular por unidad de masa; predomina en sistemas cerrados.',
    typicalTrap: 'Usar u en lugar de entalpía h para corrientes que cruzan un volumen de control.',
  },
  {
    symbol: 'h',
    latex: 'h',
    name: 'Entalpía específica',
    category: 'Intensiva',
    unitSI: 'J/kg',
    practicalUnit: 'kJ/kg',
    meaning: 'Combinación h = u + p·v que agrupa energía interna más trabajo de flujo.',
    typicalTrap: 'Creer que h es "calor almacenado" o despreciar trabajo de bomba en h2 = h1 + w_B.',
  },
  {
    symbol: 's',
    latex: 's',
    name: 'Entropía específica',
    category: 'Intensiva',
    unitSI: 'J/(kg·K)',
    practicalUnit: 'kJ/(kg·K)',
    meaning: 'Propiedad de estado asociada a multiplicidad microscópica y dirección de procesos.',
    typicalTrap: 'Suponer Δs = 0 solo porque un proceso es adiabático (requiere además reversibilidad).',
  },
  {
    symbol: 'x',
    latex: 'x',
    name: 'Calidad o título de vapor',
    category: 'Adimensional / Constante',
    unitSI: 'kg_vapor / kg_total',
    practicalUnit: '0..1 (o 0..100 %)',
    meaning: 'Fracción másica de vapor en una mezcla bifásica saturada líquido-vapor.',
    typicalTrap: 'Reportar x en vapor sobrecalentado o confundir fracción másica con fracción de volumen.',
  },
  {
    symbol: 'Q',
    latex: 'Q,\\;\\dot Q',
    name: 'Calor / flujo de calor',
    category: 'Transferencia (no es propiedad)',
    unitSI: 'J / W',
    practicalUnit: 'kJ / kW (o kJ/h)',
    meaning: 'Energía en tránsito a través de la frontera debida a una diferencia de temperatura.',
    typicalTrap: 'Mezclar kJ (energía) con kW (potencia = kJ/s) o escribir ΔQ en vez de Q_1→2.',
  },
  {
    symbol: 'W',
    latex: 'W,\\;\\dot W',
    name: 'Trabajo / potencia',
    category: 'Transferencia (no es propiedad)',
    unitSI: 'J / W',
    practicalUnit: 'kJ / kW, MW',
    meaning: 'Energía en tránsito por frontera móvil, eje rotatorio o corriente eléctrica.',
    typicalTrap: 'Olvidar el signo de convención en Q − W = ΔE o invertir η_T con η_C.',
  },
  {
    symbol: 'η',
    latex: '\\eta_{th},\\;\\eta_T,\\;\\eta_c',
    name: 'Eficiencia térmica o isentrópica',
    category: 'Adimensional / Constante',
    unitSI: 'adimensional',
    practicalUnit: '0..1 (o %)',
    meaning: 'Razón entre beneficio útil obtenido y costo energético (o desempeño real vs ideal).',
    typicalTrap: 'En fórmulas usar 0,85 y no 85; en compresor dividir por η_c, en turbina multiplicar por η_T.',
  },
  {
    symbol: 'COP',
    latex: '\\mathrm{COP}_R,\\;\\mathrm{COP}_{HP}',
    name: 'Coeficiente de desempeño',
    category: 'Adimensional / Constante',
    unitSI: 'adimensional',
    practicalUnit: 'adim. (puede ser > 1)',
    meaning: 'Calor útil desplazado dividido por trabajo neto consumido (Q_L/W_in o Q_H/W_in).',
    typicalTrap: 'Pensar que COP > 1 viola la Primera Ley (no es eficiencia de conversión sino bombeo).',
  },
  {
    symbol: 'Ω / Sgen',
    latex: '\\Omega,\\;S_{\\text{gen}}',
    name: 'Multiplicidad / Entropía generada',
    category: 'Extensiva',
    unitSI: 'adim. / J/K',
    practicalUnit: 'adim. / kJ/K',
    meaning: 'Ω cuenta microestados accesibles (S = k_B ln Ω); S_gen >= 0 mide irreversibilidades.',
    typicalTrap: 'Descartar S_gen < 0 redondeando a cero en vez de corregir el error de signo o dato.',
  },
];

export interface GlossaryTerm {
  id: string;
  term: string;
  shortDef: string;
  detail: string;
  relatedLesson: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'sistema-cerrado',
    term: 'Sistema cerrado (masa de control)',
    shortDef: 'Cantidad fija de materia; la energía puede cruzar la frontera, la masa no.',
    detail: 'Ejemplo: gas atrapado en cilindro-pistón hermético. Su balance es Q − W = ΔU + ΔEc + ΔEp.',
    relatedLesson: 'T02.02',
  },
  {
    id: 'volumen-control',
    term: 'Volumen de control (sistema abierto)',
    shortDef: 'Región del espacio por cuya frontera cruza flujo másico además de calor y trabajo.',
    detail: 'Ejemplo: turbina, compresor, bomba, tobera, caldera o intercambiador. Transporta entalpía h = u + pv.',
    relatedLesson: 'T04.01',
  },
  {
    id: 'estado-saturado',
    term: 'Región de saturación (mezcla bifásica)',
    shortDef: 'Estado donde coexisten líquido y vapor saturados en equilibrio térmico y mecánico.',
    detail: 'Dentro de la campana, p y T dependen una de la otra (p = p_sat(T)), por lo que necesitas otra propiedad como calidad x para fijar el estado.',
    relatedLesson: 'T02.05',
  },
  {
    id: 'proceso-isentropico',
    term: 'Proceso isentrópico',
    shortDef: 'Proceso idealizado a entropía constante (s2 = s1), típicamente adiabático y internamente reversible.',
    detail: 'Sirve como estado de referencia ideal (2s, 4s) para definir eficiencias isentrópicas de turbinas, bombas y compresores.',
    relatedLesson: 'T06.07',
  },
  {
    id: 'estrangulacion',
    term: 'Estrangulación (válvula)',
    shortDef: 'Caída brusca de presión sin trabajo de eje y con Q̇ ≈ 0, resultando h2 ≈ h1.',
    detail: 'Proceso altamente irreversible (S_gen > 0). Nunca modelar una válvula de expansión como isentrópica.',
    relatedLesson: 'T04.02',
  },
  {
    id: 'calentador-caa-cac',
    term: 'Calentadores CAA vs CAC (Rankine regenerativo)',
    shortDef: 'CAA mezcla vapor extraído y agua de alimentación; CAC transfiere calor sin mezclar corrientes.',
    detail: 'El CAA iguala presiones y entrega líquido saturado a esa presión; el CAC mantiene el agua de alimentación a alta presión mientras condensa la extracción y drena por trampa isoentálpica.',
    relatedLesson: 'T09.05',
  },
];

export const SEVEN_STEP_METHOD = [
  {
    step: 1,
    title: 'Identificar el fenómeno y dibujar la frontera',
    question: '¿Qué equipo tengo? ¿Cruza masa la frontera (cerrado vs volumen de control)?',
  },
  {
    step: 2,
    title: 'Definir régimen e hipótesis justificadas',
    question: '¿Es estacionario o transitorio? ¿Es adiabático? ¿Son despreciables ΔEc y ΔEp?',
  },
  {
    step: 3,
    title: 'Identificar la sustancia y su modelo',
    question: '¿Aire ideal, agua/vapor (IAPWS-IF97), sólido/líquido incompresible o refrigerante?',
  },
  {
    step: 4,
    title: 'Localizar estados y propiedades independientes',
    question: '¿Qué par de propiedades fija cada estado? ¿Requiere saturación, tabla sobrecalentada o interpolación?',
  },
  {
    step: 5,
    title: 'Convertir a unidades SI consistentes',
    question: '¿T en Kelvin? ¿Presión absoluta en kPa/Pa? ¿Caudal en kg/s y potencia en kW?',
  },
  {
    step: 6,
    title: 'Plantear balances de masa, energía y entropía',
    question: 'Escribir la ecuación general primero, tachar términos justificados y sustituir con unidades.',
  },
  {
    step: 7,
    title: 'Verificar sentido físico, signos y residuos',
    question: '¿0 <= η < 1? ¿0 <= x <= 1? ¿S_gen >= 0? ¿Cierra Q_in − Q_out = W_neto?',
  },
];

export interface SystemClassificationQuizItem {
  id: string;
  scenario: string;
  correctType: 'cerrado' | 'abierto' | 'aislado';
  explanation: string;
}

export const SYSTEM_CLASSIFICATION_ITEMS: SystemClassificationQuizItem[] = [
  {
    id: 'sys-1',
    scenario: 'Gas comprimido dentro de un cilindro-pistón sellado sin válvulas abiertas.',
    correctType: 'cerrado',
    explanation: 'No cruza masa la frontera, aunque sí hay trabajo de frontera y posiblemente calor.',
  },
  {
    id: 'sys-2',
    scenario: 'Turbina de vapor en operación continua recibiendo 25 kg/s y descargando al condensador.',
    correctType: 'abierto',
    explanation: 'La masa entra y sale continuamente por la frontera del volumen de control.',
  },
  {
    id: 'sys-3',
    scenario: 'Termo rígido perfectamente aislado y cerrado herméticamente (sin intercambio de calor ni trabajo).',
    correctType: 'aislado',
    explanation: 'Ni masa ni energía cruzan la frontera.',
  },
  {
    id: 'sys-4',
    scenario: 'Olla abierta hirviendo agua sobre una cocina.',
    correctType: 'abierto',
    explanation: 'El vapor de agua escapa continuamente hacia el ambiente.',
  },
];
