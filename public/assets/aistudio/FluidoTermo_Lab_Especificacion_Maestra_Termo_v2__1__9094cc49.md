# FLUIDOTERMO LAB — ESPECIFICACIÓN MAESTRA V2.0
## Parte 2: Termodinámica MEC110 — diseño pedagógico, contenido desarrollado, simulación, cálculo científico y arquitectura de software

**Tipo de documento:** pliego funcional, pedagógico, científico, visual y de aseguramiento de calidad; insumo implementable por un equipo de desarrollo o una IA constructora de software.  
**Público:** estudiantes de ingeniería que cursan Termodinámica por primera vez; estudiantes en preparación de pruebas y certámenes; docentes y desarrolladores.  
**Estado:** propuesta de especificación ampliada, **no** aplicación ya implementada.  
**Fecha de elaboración:** 17 de noviembre de 2026.  
**Idioma de interfaz:** español de Chile; notación internacional, unidades SI, coma decimal en texto y cálculos internamente en representación numérica no localizada.  
**Relación con otras partes:** Parte 1 = Mecánica de Fluidos (MEC120), existente y no modificable sin regresión; Parte 2 = Termodinámica (MEC110), objeto de este documento; Parte 3 = Seguridad, usuarios y administración, fuera del alcance de implementación inmediata salvo contratos de integración.

> **Alcance documental y honestidad de fuentes.** Esta edición se elaboró contrastando la especificación Markdown entregada y las nueve presentaciones de termodinámica MEC110_1 a MEC110_9. Se incorporó como referencia **Çengel y Boles, Termodinámica, séptima edición (McGraw-Hill, 2012)**, a partir del PDF aportado. Se verificaron su portada, índice temático, organización de capítulos y apéndices. La cartografía bibliográfica del §20 indica las secciones aplicables. Los ejemplos identificados como «creado para la plataforma» son originales y no transcripciones del libro. Los ejercicios «de cátedra» conservan sus datos trazables, pero sus resultados deben comprobarse por separado. Las tablas completas, figuras y problemas protegidos no deben reproducirse masivamente en una web pública.

---

# ÍNDICE DE NAVEGACIÓN

1. [Objetivo de producto y criterios de éxito](#1-objetivo-de-producto-y-criterios-de-éxito)
2. [Auditoría inicial del material y decisiones de rigor](#2-auditoría-inicial-del-material-y-decisiones-de-rigor)
3. [Mapa curricular completo MEC110_1–MEC110_9](#3-mapa-curricular-completo-mec110_1mec110_9)
4. [Modelo pedagógico «El Profesor al Lado»](#4-modelo-pedagógico-el-profesor-al-lado)
5. [Curso preparatorio desde cero](#5-curso-preparatorio-desde-cero)
6. [Unidad I: fundamentos, sustancias y gases ideales](#6-unidad-i-fundamentos-sustancias-y-gases-ideales)
7. [Unidad II: primera ley y análisis de equipos](#7-unidad-ii-primera-ley-y-análisis-de-equipos)
8. [Unidad III: segunda ley, probabilidad y entropía](#8-unidad-iii-segunda-ley-probabilidad-y-entropía)
9. [Unidad IV: máquinas térmicas, Carnot y refrigeración](#9-unidad-iv-máquinas-térmicas-carnot-y-refrigeración)
10. [Unidad V: compresión multietapa y Brayton](#10-unidad-v-compresión-multietapa-y-brayton)
11. [Unidad VI: Rankine, recalentamiento y regeneración](#11-unidad-vi-rankine-recalentamiento-y-regeneración)
12. [Banco de ejemplos, actividades y certámenes](#12-banco-de-ejemplos-actividades-y-certámenes)
13. [Especificación integral de simuladores](#13-especificación-integral-de-simuladores)
14. [Motor termodinámico y trazabilidad numérica](#14-motor-termodinámico-y-trazabilidad-numérica)
15. [Diseño de interfaz, interacciones y accesibilidad](#15-diseño-de-interfaz-interacciones-y-accesibilidad)
16. [Arquitectura técnica, contratos y seguridad](#16-arquitectura-técnica-contratos-y-seguridad)
17. [Modelos de datos, contenido y APIs](#17-modelos-de-datos-contenido-y-apis)
18. [Pruebas, criterios de aceptación y validación](#18-pruebas-criterios-de-aceptación-y-validación)
19. [Plan de entrega incremental y definición de terminado](#19-plan-de-entrega-incremental-y-definición-de-terminado)
20. [Glosario y diccionario de fórmulas](#20-glosario-y-diccionario-de-fórmulas)
21. [Fuentes, trazabilidad y asuntos pendientes](#21-fuentes-trazabilidad-y-asuntos-pendientes)

---

# 1. OBJETIVO DE PRODUCTO Y CRITERIOS DE ÉXITO

## 1.1. Problema educativo concreto

Una persona puede saber reemplazar números en una ecuación y, aun así, no comprender qué máquina se está analizando, qué significa cada variable, por qué se elige cierta fórmula ni cuándo el resultado es físicamente imposible. La plataforma debe resolver esta brecha. La experiencia de aprendizaje comienza por el fenómeno observable y termina en una resolución matemática auditable, no al revés.

El estudiante debe poder entrar sin conocimientos previos y avanzar, con apoyo graduado, hasta problemas multietapa: balances de energía, trabajo de bombas y turbinas, calidad del vapor, interpolación de propiedades, rendimientos y sistemas de ecuaciones de un ciclo regenerativo.

## 1.2. Propuesta de valor

Una plataforma que actúa simultáneamente como **libro explicativo interactivo**, **laboratorio virtual**, **profesor que resuelve paso a paso** y **entrenador de certámenes**, con un motor numérico real y controles de calidad científica. No se acepta una maqueta que solo mueva gráficos sin recalcular ecuaciones.

## 1.3. Objetivos verificables

- Una persona principiante puede convertir unidades, identificar el tipo de sistema y localizar propiedades antes de resolver un ciclo.
- Todo símbolo en una fórmula admite explicación en contexto: nombre, magnitud, unidad, origen, supuesto y uso.
- Todos los ejercicios precargados incluyen **datos → incógnitas → hipótesis → sistema físico → ecuación general → simplificación → sustitución → resultado → interpretación → verificación**.
- Al modificar un parámetro, cambia un único estado científico compartido entre el esquema industrial, los diagramas, la tabla de estados, el balance y la pizarra.
- Cada respuesta numérica tiene estado de validación: `verificado`, `aproximado`, `requiere_fuente`, `inconsistente` o `fuera_de_dominio`.
- El módulo de Fluidos permanece utilizable e intacto tras integrar Termodinámica.
- El sistema funciona con teclado, lector de pantalla y movimiento reducido; los diagramas ofrecen alternativa tabular.

## 1.4. Perfiles y recorridos

**Principiante absoluto.** Entra a «Empezar desde cero», recibe una breve evaluación sin nota, estudia calor/trabajo, aprende Kelvin y kPa, prueba un pistón y resuelve una suma de calor sensible.

**Estudiante que está por rendir un certamen.** Entra a «Preparar certamen», selecciona unidad, dificultad, uso de tablas y tiempo, resuelve sin ver pasos y pide pistas progresivas. Al finalizar recibe retroalimentación por error conceptual, algebraico, de unidades o de propiedades.

**Estudiante que comprende teoría pero no diagramas.** Entra a «Laboratorio», selecciona ciclo y enciende la capa «Qué ocurre físicamente». Al pulsar la turbina ve entrada/salida, flechas, trabajo y puntos del T-s resaltados.

**Docente o ayudante.** Crea una variante de parámetros, define tolerancia, revisa los pasos del motor, anota fuente y exporta una ficha de actividad. El editor curricular administrativo completo pertenece a la Parte 3 y se conecta por interfaces.

## 1.5. Jerarquía de información del producto

```text
FluidoTermo Lab
├─ Inicio / Continuar estudiando
├─ MEC120 · Mecánica de Fluidos       [módulo existente, sin regresiones]
│  ├─ Cátedra interactiva
│  ├─ Laboratorios
│  └─ Ejercicios / Certámenes
├─ MEC110 · Termodinámica            [módulo nuevo]
│  ├─ Ruta «Desde cero»
│  ├─ Cátedra interactiva (MEC110_1–9)
│  ├─ Laboratorios (4 simuladores principales)
│  ├─ Ejercicios / Certámenes
│  ├─ Biblioteca de fórmulas y tablas
│  └─ Mi progreso / Cuaderno de errores
└─ Cuenta / Seguridad / Administración  [Parte 3, integración desacoplada]
```

La selección **asignatura** y la selección **tipo de experiencia** son dimensiones independientes. Cambiar «Cátedra» a «Simuladores» mantiene la asignatura y, cuando sea posible, el tema actual.

---

# 2. AUDITORÍA INICIAL DEL MATERIAL Y DECISIONES DE RIGOR

## 2.1. Qué se preserva del documento anterior

Se mantiene el concepto de laboratorio oscuro `#0a1120`–`#0f172a`, equipos con corte técnico (*cutaway*), partículas animadas, gradientes térmicos, callouts, los cuatro simuladores principales, la biblioteca de ejemplos de MEC110_6–9, los diagramas T-s/P-v/P-h, la Pizarra del Profesor y el botón «Restaurar valores originales de cátedra». El nuevo documento no sustituye estos componentes por tarjetas genéricas.

## 2.2. Qué faltaba y se agrega

La especificación anterior iniciaba casi directamente con la segunda ley. Las presentaciones MEC110_1–5 muestran que los estudiantes necesitan antes: vocabulario físico, clasificación de sistemas, propiedades intensivas/extensivas, estados, equilibrio, fases, calidad, tablas, gas ideal, factor Z, calor y trabajo, primera ley en sistemas cerrados, volúmenes de control en régimen estacionario y transitorio, y operación de bombas, turbinas, toberas y válvulas. Se agregan **dos unidades previas completas**, una ruta preparatoria y ejercicios puente.

Se agregan además: diseño de datos de contenido, criterios de procedencia, validación numérica, señalización de hipótesis, modo de lectura accesible, pruebas automatizadas, límites de alcance científico, protección del módulo de Fluidos y entrega por etapas.

## 2.3. Auditoría específica: bomba P2 del Rankine regenerativo

En la especificación anterior se registra para la bomba P2 el cambio desde `0,3 MPa` hasta `12,5 MPa`, con `v_3 = 0,001073 m³/kg`, y se afirma `w_B2 = 0,5365 kJ/kg`. Aplicar directamente la fórmula aproximada para líquido incompresible da:

\[
w_{B2,s}=v_3(p_4-p_3)=0{,}001073(12500-300)=13{,}0906\ \mathrm{kJ/kg}.
\]

El valor `0,5365 kJ/kg` no coincide con esas entradas. Asimismo, el balance del sistema `4×4` reproducido en el Markdown anterior entrega flujos próximos a `198,5; 15,53; 27,29; 155,7 kg/s`, pero incorpora el dato de bombeo cuestionado. **No se debe ocultar esta contradicción ni declarar ambas salidas equivalentes.**

**Especificación de comportamiento:**

1. «**Modo referencia de cátedra**»: reproduce los coeficientes de la diapositiva/documento, etiquetados expresamente como resultados de referencia pendientes de conciliación.
2. «**Modo cálculo físico independiente**»: recalcula cada bomba, entalpía y balance desde las propiedades adoptadas, guarda supuestos y determina los nuevos flujos; requiere una fuente de propiedades validada.
3. La interfaz muestra la divergencia con explicación de causa probable, diferencia absoluta y relativa.
4. El ejercicio no puede recibir el sello `verificado` hasta reconciliar ambos métodos con las tablas, diagrama de estados y resolución original.

Esta auditoría es un requisito de calidad, no una corrección silenciosa del material docente.

## 2.4. Otras cautelas científicas importantes

- **«CFD» visual versus CFD real:** una animación de temperatura o partículas no es simulación numérica de dinámica de fluidos. Mostrar «visualización termodinámica ilustrativa» salvo que exista un solver real con malla, condiciones de borde y validación.
- **Entropía y desorden:** «más desorden» es analogía útil pero no definición universal. Enseñar microestados accesibles, multiplicidad y distribución probable; la irreversibilidad macroscópica no significa que el proceso inverso sea matemáticamente imposible.
- **Diagramas T-s/P-v:** jamás dibujar un domo «real del agua» con una curva Bezier decorativa y presentarlo como propiedades IAPWS. Si solo hay geometría pedagógica, rotularlo «esquema conceptual, no a escala».
- **Rendimiento de Carnot:** límites absolutos en Kelvin, reservorios definidos y proceso reversible; no confundir temperatura de llama nominal con temperatura termodinámica efectiva de una fuente.
- **Calidad x:** solo se define como fracción másica de vapor en región bifásica saturada. No mostrar `x = 1,2` ni «calidad 100 %» para vapor sobrecalentado; usar `no aplica`.
- **Refrigerantes:** ciclo conceptual puede analizarse con entalpías suministradas; simulación cuantitativa de R134a u otros requiere su propia base de propiedades y validación, no usar tablas del agua.
- **Interenfriamiento y presión óptima:** `p_i=√(p_1 p_2)` exige hipótesis precisas de etapas equivalentes y enfriamiento suficientemente completo, no es universal para toda red real.
- **Regeneración Brayton:** si `T_4 ≤ T_2`, desactivar recuperación de calor útil, no producir un rendimiento artificial.
- **Cálculos avanzados:** validar conservación de masa y energía con tolerancias, sin imponer números «de ejemplo» cuando el slider cambia.

---

# 3. MAPA CURRICULAR COMPLETO MEC110_1–MEC110_9

La navegación debe reflejar la secuencia real de conocimientos, no únicamente la división de cuatro simuladores avanzados.

| Código lección | Material base | Concepto | Prerrequisitos | Evidencia de comprensión |
|---|---|---|---|---|
| T00.01 | Preparación original | Unidades SI y prefijos | Ninguno | Convierte kPa↔MPa y kJ↔kW·s |
| T00.02 | Preparación original | Despeje algebraico y proporciones | Aritmética | Despeja `m` en `Q=mcΔT` |
| T00.03 | Preparación original | Gráficas, pendientes y áreas | Coordenadas | Identifica ejes T-s y P-v |
| T00.04 | Preparación original | Método de resolución de problemas | T00.01–03 | Distingue dato, incógnita y supuesto |
| T01.01 | MEC110_1 | ¿Qué estudia la termodinámica? | T00 | Reconoce calor/trabajo/equipos |
| T01.02 | MEC110_1 | Centrales y equipos industriales | T01.01 | Traza una transformación energética |
| T02.01 | MEC110_2 | Formas de energía y energía interna | T01 | Identifica `U`, `Ec`, `Ep` |
| T02.02 | MEC110_2 | Sistema, entorno y frontera | T02.01 | Dibuja sistema cerrado/abierto |
| T02.03 | MEC110_2 | Propiedades y estado termodinámico | T02.02 | Separa intensivas/extensivas |
| T02.04 | MEC110_2 | Temperatura, presión y unidades | T00.01 | Convierte T y P correctamente |
| T02.05 | MEC110_2 | Sustancias puras, fases y saturación | T02.03 | Ubica 5 estados en un domo |
| T02.06 | MEC110_2 | Calidad `x` de mezcla | T02.05 | Calcula `h` o `x` |
| T02.07 | MEC110_2 | Tablas y doble interpolación | T02.05–06 | Justifica selección de tabla |
| T02.08 | MEC110_2 | Gas ideal y factor `Z` | T02.03–04 | Resuelve `PV=mRT` y límites |
| T03.01 | MEC110_3 | Calor, trabajo y signos | T02.02 | Aplica `Q−W=ΔE` |
| T03.02 | MEC110_3 | Trabajo de frontera, P-v | T03.01 | Integra `∫P dV` |
| T03.03 | MEC110_3 | Primera ley en sistema cerrado | T03.01–02 | Calcula energía final |
| T03.04 | MEC110_3 | Calores específicos `cp`,`cv` | T02.08 | Resuelve `mcΔT` |
| T04.01 | MEC110_4 | Volumen de control estacionario | T03.03 | Construye balance general |
| T04.02 | MEC110_4 | Entalpía y trabajo de flujo | T04.01 | Interpreta `h=u+Pv` |
| T04.03 | MEC110_4 | Turbina, compresor y bomba | T04.02 | Calcula trabajo por `Δh` |
| T04.04 | MEC110_4 | Tobera, intercambiador y válvula | T04.02 | Justifica términos despreciados |
| T05.01 | MEC110_5 | Flujo no permanente | T04.01 | Balancea llenado de tanque |
| T05.02 | MEC110_5 | Balance integral masa-energía | T05.01 | Distingue energía acumulada y transportada |
| T06.01 | MEC110_6 | Segunda ley y direccionalidad | T03 | Da contraejemplo de primera ley sola |
| T06.02 | MEC110_6 | Probabilidades y combinatoria | T00 | Calcula `C(N,n)` |
| T06.03 | MEC110_6 | Microestados y entropía | T06.02 | Interpreta `S=k_B ln Ω` |
| T06.04 | MEC110_6 | Equilibrio entre sistemas | T06.03 | Maximiza multiplicidad conjunta |
| T06.05 | MEC110_6 | Relaciones `Tds`, gases y líquidos | T03.04 | Calcula `Δs` |
| T06.06 | MEC110_6 | Reversible, irreversibilidad, `Sgen` | T06.05 | Comprueba `Sgen≥0` |
| T06.07 | MEC110_6 | Eficiencias isentrópicas | T04.03,T06.06 | Distingue `2s` de `2` |
| T07.01 | MEC110_7 | Máquina térmica y postulados | T06 | Calcula `η_th` |
| T07.02 | MEC110_7 | Carnot y límite térmico | T07.01 | Usa Kelvin |
| T07.03 | MEC110_7 | Refrigerador y bomba de calor | T07.01 | Distingue COPs |
| T07.04 | MEC110_7 | Compresión de vapor y estrangulación | T04.04 | Identifica 4 equipos |
| T07.05 | MEC110_7 | Carga de refrigeración y cambio de fase | T03.04,T02.05 | Calcula potencia y tiempo |
| T08.01 | MEC110_8 | Compresión en múltiples etapas | T06.07 | Justifica enfriamiento intermedio |
| T08.02 | MEC110_8 | Brayton ideal | T02.08,T06.07 | Resuelve 4 estados |
| T08.03 | MEC110_8 | Brayton real | T08.02 | Compara `ηc`,`ηt` |
| T08.04 | MEC110_8 | Óptimo de presión / trabajo neto | T08.02 | Distingue máximo trabajo/eficiencia |
| T08.05 | MEC110_8 | Brayton regenerativo | T08.03 | Verifica `T4>T2` |
| T08.06 | MEC110_8 | Interenfriamiento + recalentamiento | T08.01–05 | Recorre 10 estados |
| T09.01 | MEC110_9 | Rankine ideal | T02.07,T06.07 | Calcula `η`,`x`,`ṁ` |
| T09.02 | MEC110_9 | Rankine real | T09.01 | Usa eficiencias de bomba/turbina |
| T09.03 | MEC110_9 | Arquitectura de calderas | T09.01 | Identifica componentes |
| T09.04 | MEC110_9 | Rankine con recalentamiento | T09.01 | Evalúa humedad límite |
| T09.05 | MEC110_9 | Regeneración CAA/CAC | T09.01 | Plantea balances por mezclador |
| T09.06 | MEC110_9 | Sistema lineal 4×4 | T09.05 | Verifica residuos de balances |
| T09.07 | MEC110_9 | Cogeneración y binario | T09.01 | Calcula aprovechamiento global |

**Resultado esperado de cada lección:** conocer (concepto), entender (explicación), aplicar (ejemplo), experimentar (variable), diagnosticar (error) y transferir (problema nuevo). No marcar una lección «completa» solamente por verla.

---

# 4. MODELO PEDAGÓGICO «EL PROFESOR AL LADO»

## 4.1. Estructura obligatoria de toda lección

1. **Pregunta inicial:** una situación física concreta; por ejemplo, «¿Por qué enfría un refrigerador si gasta electricidad?».
2. **Idea intuitiva:** explicación breve sin símbolos; explícitamente una analogía cuando corresponde.
3. **Objeto físico animado:** equipo, masa de control o diagrama que el usuario pueda inspeccionar.
4. **Propiedades que importan:** dos o tres variables resaltadas con unidades y signos.
5. **Ecuación original completa:** primero mostrar ecuación general, luego las hipótesis que permiten simplificar.
6. **Despiece de fórmula:** cada término clicable, con definición, unidad, valor actual y sentido físico.
7. **Ejemplo con números pequeños:** valores deliberadamente simples, con sustitución visible línea a línea.
8. **Ejemplo equivalente de ingeniería:** unidades reales, propiedades tabuladas si corresponde, estimación.
9. **Práctica de una decisión:** «¿Descartarías velocidad en esta tobera?» o «¿Qué tabla usarías?».
10. **Error de certamen:** comparación entre solución incorrecta, motivo y corrección.
11. **Miniresumen de una frase:** qué aprendió realmente, no lista de fórmulas.
12. **Desafío transferible:** problema nuevo que exige seleccionar el modelo y no solo repetir el cálculo.

Para evitar una interfaz interminable, usar revelado progresivo. La vista inicial tiene la explicación en lenguaje sencillo, la escena física y el primer ejemplo. Al expandir «ver desarrollo completo» se presentan derivaciones, unidades, tablas y casos especiales. No ocultar información matemática esencial en estados por defecto inaccesibles.

## 4.2. Tres niveles de profundidad, compatibles entre sí

- **Comprender:** lenguaje básico, dibujos, unidades, una operación por paso.
- **Resolver:** fórmulas generales, simplificación, propiedades, pasos completos y razonamiento.
- **Profundizar:** demostraciones, diferenciales, hipótesis de equilibrio, sensibilidades, casos límites y modelo numérico.

El nivel se guarda por usuario y puede cambiar en cualquier momento sin borrar valores ni progreso. Todas las dificultades usan la **misma física**, no una versión simplificada que entregue una conclusión contradictoria.

## 4.3. Ejemplo de enseñanza progresiva de una misma fórmula

**Fórmula:** `Q = m c ΔT`, para calentamiento/enfriamiento sin cambio de fase, con `c` aproximadamente constante.

- **Analogía:** calentar una olla más grande requiere más energía que calentar la misma agua en una taza para subir ambas la misma temperatura.
- **Variables:** `Q` energía transferida como calor [kJ]; `m` masa [kg]; `c` calor específico [kJ/(kg·K)]; `ΔT=T_f−T_i` cambio de temperatura [K].
- **Límite:** esta expresión no describe por sí sola la energía de vaporización o solidificación.
- **Ejemplo inicial:** `m=2 kg`, `c=4 kJ/(kg·K)`, `T_i=20 °C`, `T_f=30 °C`; `ΔT=10 K`; `Q=2×4×10=80 kJ`.
- **Comprobación de unidades:** `kg × kJ/(kg·K) × K = kJ`.
- **Si se enfría:** `ΔT<0`, entonces `Q<0` para el sistema agua bajo la convención calor hacia el sistema positivo. La **magnitud extraída** será `|Q|`.
- **Error típico:** sumar `273,15` a una diferencia de temperaturas; una diferencia de `10 °C` equivale a `10 K`, no a `283,15 K`.
- **Pregunta interactiva:** «Si duplicas la masa manteniendo `c` y `ΔT`, ¿qué ocurre con `Q`?» → se duplica.

## 4.4. Estrategia de pistas sin regalar la respuesta

**Pista 1 (orientación):** «Mira si hay flujo de masa a través de la frontera».  
**Pista 2 (modelo):** «Podría servir el balance de energía para volumen de control».  
**Pista 3 (ecuación):** presentar la ecuación simbólica.  
**Pista 4 (sustitución):** completar únicamente las propiedades conocidas.  
**Pista 5 (solución completa):** revelar procedimiento con explicación del criterio, no solo número.

La evaluación registra si se usaron pistas, pero no estigmatiza ni oculta contenido. Permitir repetir con otro conjunto de parámetros.

## 4.5. Tratamiento de errores y retroalimentación específica

| Error detectado | Mensaje que debe mostrar | Apoyo concreto |
|---|---|---|
| Celsius en cociente de Carnot | «El cociente necesita temperatura absoluta.» | Convertidor °C→K, sustitución rehecha |
| Mezcla `kJ` con `kW` | «Estás comparando energía con potencia.» | Conversión `1 kW=1 kJ/s` |
| Eficiencia de turbina invertida | «Una turbina real entrega menos trabajo que la ideal.» | Diagrama h-s con 4 y 4s |
| Eficiencia de compresor invertida | «Un compresor real consume más trabajo que el ideal.» | Barras `w_c` ideal/real |
| `x` fuera de 0 a 1 | «La calidad solo existe dentro de mezcla líquido-vapor saturada.» | Localizador de fase |
| Entalpía tomada de tabla incorrecta | «Comprueba presión, temperatura y región de fase.» | Árbol de decisión tablas |
| Omisión de bomba en Rankine | «El trabajo neto resta el trabajo consumido por la bomba.» | Destacar flecha bomba |
| Residuo de energía distinto de cero | «El equipo no conserva energía con estos estados.» | Panel de auditoría de balances |
| Extraer energía de dos reservas sin pérdidas imposibles | «Revisa el límite de la segunda ley.» | Comparador con Carnot |

---

# 5. CURSO PREPARATORIO DESDE CERO

Esta sección es **contenido visible dentro de la web**, no solo instrucciones para programadores. Debe existir antes de que se pida interpretar una tabla de vapor.

## T00.01. Las unidades y por qué importan

**En palabras simples.** La termodinámica usa cantidades que a veces parecen parecidas pero no lo son: energía, potencia, presión, temperatura, masa y flujo de masa. Una central puede producir `300 MW` (potencia), mientras que la energía entregada durante una hora se mide en `MWh` o `MJ`. Es un error comparar una con otra sin considerar el tiempo.

| Magnitud | Símbolos frecuentes | Unidad SI y unidades de uso | Relación práctica |
|---|---|---|---|
| Temperatura | `T` | K; °C | `T[K]=T[°C]+273,15` |
| Presión | `p` | Pa; kPa; MPa | `1 MPa=1000 kPa=10^6 Pa` |
| Masa | `m` | kg | `1000 g=1 kg` |
| Caudal másico | `ṁ` | kg/s | `kg/h ÷ 3600=kg/s` |
| Volumen | `V` | m³ | `1000 L=1 m³` |
| Volumen específico | `v` | m³/kg | `v=V/m` |
| Densidad | `ρ` | kg/m³ | `ρ=m/V=1/v` |
| Energía/calor/trabajo | `E,Q,W` | J; kJ; MJ | `1 kJ=1000 J` |
| Energía específica | `e,u,h,w,q` | kJ/kg | `m×kJ/kg=kJ` |
| Potencia | `Ẇ, Q̇` | W; kW; MW | `1 kW=1 kJ/s` |
| Entropía específica | `s` | kJ/(kg·K) | `ṁ Δs` tiene unidades kW/K |
| Calor específico | `c_p,c_v` | kJ/(kg·K) | `m c ΔT` tiene unidades kJ |
| Aceleración gravitatoria | `g` | m/s² | En ejercicios terrestres `≈9,81` |

**Microlección 1 — Pasar de presión a presión.** `2,5 MPa × 1000 = 2500 kPa`. Si la fórmula de trabajo de bomba usa `v[m³/kg] × Δp[kPa]`, el producto entrega `kJ/kg` porque `1 kPa·m³ = 1 kJ`.

**Microlección 2 — Energía versus potencia.** Si un calefactor entrega `2 kW` durante `15 min`, convertir `15×60=900 s`; `Q=2 kJ/s ×900 s=1800 kJ`. No se puede reportar `2 kJ` a menos que hayan transcurrido `1 s`.

**Microlección 3 — Potencia a flujo de calor.** Si se extraen `7200 kJ/h`, entonces `Q̇=7200/3600=2 kW`.

**Microlección 4 — Kelvin.** `20 °C=293,15 K`; `120 °C=393,15 K`. Para calcular la relación `T_1/T_2`, **usar Kelvin**. Para un salto térmico `120−20=100 °C`, el salto también es `100 K`.

**Microlección 5 — Presión absoluta versus manométrica.** Una presión indicada de `200 kPa` manométricos, bajo atmósfera aproximada de `101,3 kPa`, equivale a `301,3 kPa` absolutos. `PV=mRT`, tablas de saturación y relaciones de presión requieren conocer qué escala se usa. El software debe etiquetar `p_abs` y `p_man`, sin suponer que son iguales.

### Comprobador dimensional interactivo

Al pasar el cursor por cualquier igualdad se muestra una reducción de unidades. Si alguien coloca `R=0,287 kJ/(kg·K)` y `p` en `Pa`, el motor transforma las unidades antes de operar o bloquea la expresión; jamás devuelve silenciosamente un resultado mil veces mayor o menor.

## T00.02. Matemática mínima para comprender fórmulas

**Despejar no es adivinar.** De `Q=m c ΔT`:

- Para calcular la masa: dividir ambos lados por `c ΔT`: `m=Q/(c ΔT)`.
- Para calcular diferencia de temperatura: `ΔT=Q/(m c)`.
- Para calcular el calor específico: `c=Q/(m ΔT)`.

**Ejemplo con sustitución:** si para elevar `5 kg` de una sustancia `10 K` hacen falta `100 kJ`, entonces `c=100/(5×10)=2 kJ/(kg·K)`.

**Fracciones:** si `η=0,4`, expresado en porcentaje corresponde a `40 %`; si `η=40 %`, en una fórmula se reemplaza por `0,40`. Un rendimiento isentrópico de `85 %` no equivale al número `85`.

**Potencias y raíces:** `p_i=√(p_1p_2)`. Para `p_1=100 kPa`, `p_2=900 kPa`: `p_i=√90000=300 kPa`. Ambas razones son iguales: `300/100=900/300=3`.

**Logaritmos:** `ln` es logaritmo natural. `ln(2)≈0,6931`; `ln(1)=0`; `ln(0)` no está definido. Por eso no calcular entropía de Boltzmann con `Ω=0`. Usar `logGamma` para combinatorias enormes en la implementación.

**Interpolación lineal:** si una tabla informa `(p=2,0 MPa, s=7,4317)` y `(p=2,5 MPa, s=7,3234)`, estimar `p` para `s=7,3988` con la fracción entre valores; cada operación se despliega y comprueba.

## T00.03. Cómo leer una gráfica termodinámica

**Diagrama P-v.** Eje horizontal: volumen específico `v`; eje vertical: presión `P`. El área bajo una curva cuasiestática `P(v)` representa trabajo de frontera **específico** `∫P dv`. En expansión (`v` aumenta) el trabajo realizado por el sistema es positivo bajo la convención de este curso.

**Diagrama T-s.** Eje horizontal: entropía específica `s`; eje vertical: temperatura absoluta `T`. En un proceso internamente reversible la integral `∫T ds` representa el calor transferido **por unidad de masa** bajo las condiciones adecuadas, no en cualquier proceso irreversible. Una línea vertical indica `s` constante, no necesariamente `T` constante.

**Diagrama h-s (Mollier).** Útil para turbinas y toberas: permite visualizar entalpías de estados isentrópicos y reales.

**Diagrama P-h.** Especialmente útil en refrigeración: condensador y evaporador siguen aproximadamente líneas isobáricas; la válvula de expansión idealizada sigue una línea de entalpía constante.

### Ejercicio de lectura

Se dibujan dos estados con `P_1=200 kPa`, `v_1=0,5 m³/kg`, `P_2=200 kPa`, `v_2=1,0 m³/kg`. Pregunta: «¿Se expandió o se comprimió?». Respuesta: expansión isobárica; `w_b=P(v_2−v_1)=200×0,5=100 kJ/kg`. Mostrar que el rectángulo bajo la línea `P-v` tiene exactamente esta área.

## T00.04. Algoritmo mental antes de usar una fórmula

**Siempre seguir esta secuencia:**

```text
1. ¿Qué equipo o fenómeno tengo? → dibujo del sistema
2. ¿Cruza masa la frontera? → cerrado / volumen de control
3. ¿Es estacionario o transitorio? → acumulación sí / no
4. ¿Cuál es la sustancia? → gas ideal / agua / refrigerante / otra
5. ¿Conozco fase y propiedades? → elegir ecuación de estado o tablas
6. ¿Qué datos y qué incógnitas tengo? → tabla de conocidos
7. ¿Qué suposiciones son defendibles? → aislamiento, ΔEc, ΔEp, idealidad
8. ¿Qué balance físico se conserva? → masa, energía, entropía
9. ¿Cómo transformo unidades? → SI coherente
10. ¿El resultado tiene sentido físico? → límites, signos, residuos
```

El software debe ofrecer este algoritmo como **asistente opcional**, activado por el usuario, nunca como un modal invasivo en cada ejercicio.

---

# 6. UNIDAD I: FUNDAMENTOS, SUSTANCIAS Y GASES IDEALES

**Correspondencia:** MEC110_1 y MEC110_2. La primera presentación introduce transformaciones de energía, centrales y equipos; la segunda aborda propiedades, sistemas, equilibrio, fases, tablas, gases ideales y factor de compresibilidad. El objetivo es que ninguna fórmula avanzada aparezca sin su concepto asociado.

## 6.1. T01.01. Termodinámica: qué estudia realmente

La termodinámica estudia estados macroscópicos de la materia y las transformaciones e intercambios de energía. Una turbina convierte parte de la energía transportada por vapor o gas en trabajo mecánico. Una caldera transfiere energía desde una fuente térmica al fluido. Un refrigerador utiliza trabajo para transportar calor desde una región fría hacia otra más caliente.

**Interacción inicial:** pulsar elementos de una planta animada: `caldera → turbina → generador → condensador → bomba`. Al pulsar cada equipo mostrar qué entra (fluido, calor, trabajo) y qué sale. Evitar representar el calor como una sustancia almacenada en el agua; lo que el fluido posee es energía interna/entalpía, y `Q` nombra energía transferida por diferencia térmica.

**Mini problema:** una máquina recibe `800 kJ` como calor y en el ciclo entrega `240 kJ` como trabajo. Si completa un ciclo (`ΔE_ciclo=0`), debe rechazar `560 kJ`. Enseñar primero `800 = 240 + 560` y después `W_neto=Q_H−Q_L`.

## 6.2. T02.01. Energía total e interna

Para un sistema macroscópico se utiliza:

\[
E=U+E_c+E_p,\qquad e=u+\frac{V_{\!f}^{2}}{2}+gz,
\]

siendo `V_f` la rapidez del fluido, para evitar confusión con `V` volumen. En la forma específica se convierte `m²/s²` a `J/kg`, y para usar `kJ/kg` se divide por 1000.

- **`U` [kJ]:** energía interna total, asociada a estados microscópicos.
- **`u` [kJ/kg]:** energía interna por masa.
- **`E_c` [kJ]:** energía cinética de movimiento macroscópico.
- **`E_p` [kJ]:** energía potencial gravitatoria.
- **`h=u+pv` [kJ/kg]:** entalpía específica, combinación especialmente conveniente para fluidos que cruzan una frontera.

**Ejemplo original:** `m=2 kg`, velocidad `20 m/s`. `E_c=(1/2)mV_f² = 0,5×2×400=400 J=0,4 kJ`. Comparar la pequeña contribución cinética con un calentamiento de decenas de kilojoules; explicar por qué a veces, pero no siempre, se desprecia `ΔE_c`.

## 6.3. T02.02. Sistema, entorno y frontera

**Sistema cerrado:** no entra ni sale masa; sí puede haber calor o trabajo a través de la frontera. Ejemplo: gas contenido en un cilindro-pistón hermético.

**Sistema abierto o volumen de control:** la masa puede cruzar la frontera; ejemplo: turbina con vapor que entra y sale.

**Sistema aislado:** idealización sin intercambios de masa ni energía con el entorno. Diferenciar «aislado» de «adiabático»: un compresor adiabático sí puede intercambiar trabajo.

**Animación exigida:** al elegir «cerrado», el contorno sigue al gas; en «abierto», una caja de control fija rodea la turbina y partículas cruzan sus límites. Colores y flechas no bastan; mostrar texto «masa cruza/no cruza».

**Chequeo:** una botella sellada que se calienta al sol, ¿cerrado o abierto? Cerrado (si no fuga). Una olla sin tapa que hierve, ¿cerrado o abierto? Abierto (vapor escapa).

## 6.4. T02.03. Propiedades: intensivas y extensivas

**Extensivas:** dependen de la cantidad de materia, como `m`, `V`, `U`, `E`, `S`. Si duplico dos sistemas idénticos, se duplican estas propiedades.

**Intensivas:** no dependen directamente de la masa, como `T`, `p`, `ρ`, `v`, `u`, `h`, `s`. Si divido una sustancia uniforme en dos partes, sus propiedades intensivas siguen iguales.

**Específica = por unidad de masa.** `v=V/m`, `u=U/m`, `h=H/m`, `s=S/m`.

**Ejemplo original:** un tanque contiene `6 kg` de gas en `3 m³`. `v=3/6=0,5 m³/kg`, `ρ=6/3=2 kg/m³`. Si se reparte en dos tanques idénticos con 3 kg y 1,5 m³ cada uno, `v` y `ρ` no cambian.

## 6.5. T02.04. Equilibrio, proceso y estado

Un **estado termodinámico** se caracteriza por propiedades. Un **proceso** es la transformación desde estado 1 a estado 2; un **ciclo** regresa al estado inicial. Un proceso de **cuasiequilibrio** idealiza cambios suficientemente lentos como para que el sistema atraviese estados cercanos al equilibrio.

La regla de «dos propiedades intensivas independientes» para sustancias puras simples y compresibles requiere cuidado: en la región de mezcla saturada, `p` y `T` están vinculadas por la curva de saturación y **no** constituyen dos propiedades independientes. Se requiere además, por ejemplo, `x` o `v`.

**Desafío:** si agua saturada se encuentra a `100 °C` y `≈101,3 kPa`, ¿alcanzan `T` y `p` para saber cuánta masa es vapor? No. Falta la calidad u otra propiedad independiente.

## 6.6. T02.05. Fases del agua: antes de leer una tabla

**Líquido comprimido o subenfriado:** `T < T_sat(p)` a presión dada.  
**Líquido saturado:** justo antes de comenzar a hervir, `x=0`.  
**Mezcla saturada:** líquido y vapor coexisten, `0<x<1`.  
**Vapor saturado:** último estado antes del sobrecalentamiento, `x=1`.  
**Vapor sobrecalentado:** `T > T_sat(p)`; no corresponde hablar de calidad bifásica.

El ciclo de cinco imágenes de `MEC110_2` debe convertirse en un control deslizante con escenas propias: líquido frío → líquido saturado → mezcla → vapor saturado → vapor sobrecalentado. Cada estado muestra qué tabla corresponde consultar.

### Lectura de la campana

En `T-v` o `T-s`, una cúpula separa regiones de líquido, mezcla y vapor. La curva izquierda es líquido saturado; la derecha es vapor saturado. Dentro de la cúpula ocurre cambio de fase a presión/temperatura relacionadas. En el punto crítico desaparece la distinción líquido-vapor. La visualización debe indicar propiedades exactas solo cuando provienen del motor validado.

### Calidad `x`: derivación útil

En una mezcla de masa total `m=m_f+m_g`, la calidad es `x=m_g/m`. Una propiedad específica aproximadamente aditiva por masa `y` cumple:

\[
y = \frac{m_f y_f+m_g y_g}{m}= (1-x)y_f+xy_g=y_f+x(y_g-y_f).
\]

Por tanto, `y=y_f+x y_fg`, para `y∈{v,u,h,s}` y en región bifásica. Invertir: `x=(y−y_f)/y_fg`.

**Ejemplo didáctico creado:** una mezcla tiene `h_f=200 kJ/kg`, `h_g=2600 kJ/kg` y calidad `x=0,25`. Entonces `h_fg=2400 kJ/kg` y `h=200+0,25×2400=800 kJ/kg`. Revertir: `(800−200)/2400=0,25`. Estos números son pedagógicos, **no** una fila de la tabla del agua.

**Error de interpretación:** `x=0,25` significa que el 25 % de la **masa** está en fase vapor; no que el 25 % del volumen ni el 25 % de la energía sea vapor.

## 6.7. T02.06. Tablas de propiedades: ruta de decisión

```text
CONOCEMOS SUSTANCIA, p, T y quizá h/s/v
            |
      ¿Se conoce fase?
      /             \
   Sí               No
   |                |
   elegir      comparar T con Tsat(p)
   tabla          o p con psat(T)
      \             /
       -> ¿Región? <---
          |         |             |
      comprimida  mezcla       sobrecalentada
          |         |             |
      líquido     h=hf+xhfg      tabla p,T
      comprimido  s=sf+xsfg      o correlación
```

**Pizarra de interpolación:** presentar columnas `p`,`T`,`h`,`s`,`v`, un resaltado de las dos filas vecinas, la variable objetivo, la fracción `α=(x−x_0)/(x_1−x_0)` y la salida `y=y_0+α(y_1−y_0)`. Mostrar los números de la tabla y una ficha con su fuente, edición y unidades.

**Ejemplo pedagógico de interpolación simple:** `h(200 °C)=2800 kJ/kg`, `h(220 °C)=2840 kJ/kg`. A `T=210 °C`, `α=(210−200)/(220−200)=0,5`, por lo que `h≈2820 kJ/kg`. Es una tabla ficticia únicamente para practicar el método.

**Interpolación doble:** cuando presión y temperatura están entre valores tabulados, interpolar primero en una dirección en ambas filas y luego en la otra. Mostrar cuatro puntos de origen y una tabla de cálculo, no hacer interpolación sobre los valores en pantalla con precisión reducida.

**Advertencia:** no extrapolar fuera de tablas ni cruzar una frontera de fase con interpolación lineal arbitraria. El motor debe cambiar de región o señalar falta de cobertura.

## 6.8. T02.07. Ecuación de estado del gas ideal

\[
pV=mRT\qquad\text{y}\qquad pv=RT.
\]

`p`: presión absoluta [kPa]; `V`: volumen total [m³]; `m`: masa [kg]; `R`: constante específica [kJ/(kg·K)]; `T`: temperatura absoluta [K]. Para aire seco ideal de aproximación pedagógica `R≈0,287 kJ/(kg·K)`.

**Ejemplo resuelto paso a paso:** un tanque rígido contiene aire a `p=200 kPa`, `V=0,5 m³`, `T=300 K`. Se busca `m`.

1. Modelo: gas ideal con `R=0,287 kJ/(kg·K)`.
2. Escribir `pV=mRT`.
3. Despejar `m=pV/(RT)`.
4. Sustituir: `m=(200 kPa×0,5 m³)/(0,287 kJ/(kg·K)×300 K)`.
5. Numerador `100 kPa·m³=100 kJ`; denominador `86,1 kJ/kg`.
6. Resultado `m=100/86,1≈1,1614 kg`.
7. Comprobación: masa positiva y orden de magnitud plausible.

**Segundo ejemplo resuelto:** un recipiente rígido con cantidad de gas constante pasa de `T_1=300 K` a `T_2=450 K` con `p_1=100 kPa`. Como `V` y `m` permanecen, `p_2/p_1=T_2/T_1`, luego `p_2=100×450/300=150 kPa`.

**Factor de compresibilidad:** para gases reales se utiliza `p v=ZRT`, donde `Z=1` corresponde al modelo ideal. Cerca de saturación/punto crítico las desviaciones pueden ser relevantes; un valor de `Z` real depende del estado. No elegir `Z` arbitrariamente sin carta/correlación validada.

## 6.9. Actividades de Unidad I

| ID | Modalidad | Consigna | Respuesta/criterio |
|---|---|---|---|
| U1-A01 | Selección interactiva | Clasificar cilindro cerrado y turbina | Sistema cerrado / volumen de control |
| U1-A02 | Arrastrar/soltar | Ordenar fases del calentamiento del agua | líquido→saturado→mezcla→vapor→sobrecalentado |
| U1-A03 | Numérico | `ρ` para `m=8 kg`, `V=4 m³` | `2 kg/m³` |
| U1-A04 | Numérico | `T=27 °C` en Kelvin | `300,15 K` |
| U1-A05 | Fórmula | Despejar `V` en `pV=mRT` | `V=mRT/p` |
| U1-A06 | Conceptual | ¿Se aplica `x` al vapor sobrecalentado? | No |
| U1-A07 | Tablas | Calcular `h` con `hf=500`, `hfg=2100`, `x=0,8` | `2180 kJ/kg`, datos ficticios |
| U1-A08 | Aplicación | Aire ideal `m=2 kg`, `T=300 K`, `p=100 kPa`: hallar V | `V=1,722 m³` |

---

# 7. UNIDAD II: PRIMERA LEY Y ANÁLISIS DE EQUIPOS

**Correspondencia:** MEC110_3, MEC110_4 y MEC110_5. Antes de Carnot, Brayton o Rankine, el estudiante debe poder plantear balances de energía.

## 7.1. T03.01. Calor, trabajo y convención de signos

**Calor `Q`:** energía que cruza la frontera por una diferencia de temperatura.  
**Trabajo `W`:** otras formas de transferencia de energía a través de la frontera; por ejemplo, un eje giratorio o un pistón móvil.  
**Convención elegida en esta plataforma:** `Q>0` cuando entra calor al sistema; `W>0` cuando el sistema realiza trabajo hacia su entorno. Es la convención compatible con `Q−W=ΔE`.

Si el estudiante encuentra otra convención en un libro, debe verla como alternativa coherente, no como error automático. Mostrar un selector de convención únicamente para explicar la equivalencia; internamente usar una convención canónica.

**Ejemplo:** un gas recibe `Q=300 kJ` y empuja un pistón realizando `W=100 kJ`, sin variaciones cinéticas o potenciales. Entonces `ΔU=Q−W=300−100=200 kJ`. Si `U_1=500 kJ`, `U_2=700 kJ`.

**Ejemplo inverso:** el gas pierde `50 kJ` de calor (`Q=−50 kJ`) mientras se comprime y recibe `100 kJ` de trabajo (`W=−100 kJ`), por tanto `ΔU=−50−(−100)=+50 kJ`.

## 7.2. T03.02. Trabajo de frontera en pistón

\[
W_b=\int_{V_1}^{V_2}p_{\mathrm{ext}}\,dV
\]

Para proceso cuasiequilibrio mecánico, `p_ext` puede identificarse con la presión de frontera del sistema. Si `p` es constante:

\[
W_b=p(V_2-V_1).
\]

**Ejemplo:** gas pasa de `V_1=0,2 m³` a `V_2=0,5 m³` a `p=150 kPa`. `ΔV=+0,3 m³`, `W=150×0,3=45 kJ`. En el gráfico P-V se ve un rectángulo con base `0,3 m³` y altura `150 kPa`.

**Caso isotérmico de gas ideal:** a temperatura constante y masa constante `p=mRT/V`, de modo que:

\[
W_{b,iso}=\int_{V_1}^{V_2}\frac{mRT}{V}\,dV=mRT\ln\left(\frac{V_2}{V_1}\right).
\]

**Ejemplo de aproximación creado:** `m=1 kg` aire, `T=300 K`, `R=0,287`, `V_2=2V_1`. `W=1×0,287×300×ln2≈59,68 kJ`. Comprobar que en expansión el logaritmo es positivo.

**Proceso politrópico** `pV^n=constante`, con `n≠1`:

\[
W_b=\frac{p_2V_2-p_1V_1}{1-n}.
\]

Para `n=1`, usar la expresión logarítmica. Esta derivación corresponde a trabajo de frontera de un sistema cerrado cuasiequilibrio, **no automáticamente** al trabajo de eje de un compresor de flujo estacionario.

### Caso inspirado en cátedra MEC110_3

El material incluye expansión isotérmica de aire con `p_1=500 kPa`, `V_1=0,5 m³` (MEC110_3, diapositiva 12), con un volumen final definido en el enunciado completo de la fuente. La plataforma debe importar **todos** los datos desde la diapositiva verificada antes de precargar el valor final; si falta un dato, mostrar parámetro requerido y no inventar el resultado.

## 7.3. T03.03. Primera ley para sistemas cerrados

**Forma general de balance:**

\[
Q_{1\to2}-W_{1\to2}=(U_2-U_1)+(E_{c2}-E_{c1})+(E_{p2}-E_{p1}).
\]

En muchos recipientes sin movimiento macroscópico relevante, `ΔEc≈0` y `ΔEp≈0`:

\[
Q-W=\Delta U.
\]

**Preguntas antes de simplificar:** ¿se mueve el recipiente? ¿hay variación de altura? ¿el gas se expande y efectúa trabajo? ¿se transfiere calor?

**Ejemplo de recipiente rígido:** `m=2 kg` de aire ideal, `c_v=0,718 kJ/(kg·K)`, `T_1=300 K`, `T_2=400 K`. No hay trabajo de frontera (`ΔV=0`). `ΔU=m c_v ΔT=2×0,718×100=143,6 kJ`; `Q=143,6 kJ` si no hay otros trabajos ni energías.

**Advertencia:** en un recipiente rígido puede existir trabajo eléctrico o de agitador; «rígido» elimina trabajo de frontera, no todo trabajo posible.

## 7.4. T03.04. Calores específicos e idealización

Para aire bajo el modelo de calores específicos constantes cercano a temperatura ambiente:

- `c_p≈1,005 kJ/(kg·K)`.
- `c_v≈0,718 kJ/(kg·K)`.
- `R=c_p−c_v≈0,287 kJ/(kg·K)`.
- `k=c_p/c_v≈1,40`.

Para gases ideales: `Δu≈c_vΔT`, `Δh≈c_pΔT`. Si los calores específicos dependen apreciablemente de la temperatura, reemplazar por integrales `Δu=∫c_v(T)dT`, `Δh=∫c_p(T)dT` o tablas de gas ideal.

**Ejemplo:** 3 kg de aire se calientan a presión constante de `300` a `350 K`. `ΔH≈m c_p ΔT=3×1,005×50=150,75 kJ`. Esta magnitud no equivale automáticamente a `Q` sin considerar el sistema y sus hipótesis; en un recipiente de flujo estacionario sin trabajo y variaciones de energía mecánica relevantes puede representar el calor suministrado.

**Ejemplo de comparación:** para la misma masa y el mismo aumento `ΔT`, `m c_pΔT` supera a `m c_vΔT` para un gas ideal, porque la condición a presión constante incluye el efecto asociado al trabajo de expansión en un sistema cerrado simple.

## 7.5. T04.01. Entalpía: por qué aparece en fluidos que circulan

Una masa que entra a un volumen de control desplaza fluido por presión. La energía específica que transporta convenientemente se expresa como `h=u+pv`. No es una nueva forma misteriosa de energía añadida de manera arbitraria: agrupa energía interna y trabajo de flujo por unidad de masa.

**Balance general estacionario de una entrada y una salida:**

\[
\dot Q-\dot W=\dot m\left[(h_2-h_1)+\frac{V_{f2}^{2}-V_{f1}^{2}}{2} +g(z_2-z_1)\right],
\]

con coherencia en unidades. La diferencia cinética y potencial debe dividirse por `1000` si los términos de entalpía están en kJ/kg.

**Balance general para múltiples entradas y salidas**:

\[
\dot Q-\dot W+\sum_{in}\dot m_i\left(h_i+\frac{V_{fi}^{2}}2+gz_i\right)
-\sum_{out}\dot m_e\left(h_e+\frac{V_{fe}^{2}}2+gz_e\right)=0.
\]

Si hay acumulación de energía, no es estacionario y el lado derecho deja de ser cero: `dE_CV/dt`.

## 7.6. T04.02. Turbina, compresor, bomba y tobera

### Turbina adiabática

**Qué hace:** el fluido se expande y cede trabajo al eje. Si `Q̇≈0`, velocidad/altura despreciables:

\[
w_t=h_{in}-h_{out}>0,\qquad\dot W_t=\dot m\,w_t.
\]

**Ejemplo creado:** vapor entra con `h_1=3200 kJ/kg`, sale con `h_2=2700 kJ/kg`, `ṁ=2 kg/s`. Entonces `w_t=500 kJ/kg` y `Ẇ_t=1000 kW=1 MW`.

### Compresor adiabático

**Qué hace:** necesita trabajo para aumentar presión de un gas. En aproximación estacionaria:

\[
w_{c,in}=h_2-h_1>0.
\]

**Ejemplo creado:** si el aire eleva su entalpía de `300` a `450 kJ/kg`, el trabajo requerido es `150 kJ/kg`. Su `W` con signo de trabajo realizado por el sistema sería `−150 kJ/kg`; la interfaz puede mostrar también magnitud de **trabajo de entrada** `+150`.

### Bomba de líquido

El líquido de baja compresibilidad se aproxima como:

\[
w_{B,s}\approx v_f(p_2-p_1),
\]

con `p` en kPa y `v_f` en m³/kg; resultado en kJ/kg. Para bomba real de eficiencia isentrópica `η_B`, `w_{B,real}=w_{B,s}/η_B`.

**Ejemplo creado:** `v=0,001 m³/kg`, `p_1=100 kPa`, `p_2=1100 kPa`, `η_B=0,8`: `w_s=0,001×1000=1 kJ/kg`; `w_real=1/0,8=1,25 kJ/kg`.

### Tobera adiabática

Convierte caída de entalpía en aumento de energía cinética; si `Ẇ≈0`, `Q̇≈0`, `ΔEp≈0`:

\[
h_1+\frac{V_{f1}^{2}}{2000}=h_2+\frac{V_{f2}^{2}}{2000}.
\]

**Ejemplo creado:** `h_1−h_2=50 kJ/kg`, `V_f1≈0`. `V_f2=√(2×1000×50)≈316,2 m/s`. El factor 1000 convierte kJ/kg a J/kg.

### Válvula de estrangulación

Con `Q̇≈0`, `Ẇ≈0`, sin variaciones relevantes de velocidad/altura:

\[
h_1\approx h_2.
\]

**Importante:** no implica temperatura ni entropía constantes. Es una reducción de presión normalmente irreversible. Una expansión idealizada por válvula no se representa como expansión isentrópica.

### Intercambiador de calor

Para volumen de control que incluye ambos flujos, sin calor hacia el exterior ni trabajo, el balance ideal es:

\[
\dot m_h(h_{h,in}-h_{h,out})=\dot m_c(h_{c,out}-h_{c,in}).
\]

**Ejemplo creado:** corriente caliente `ṁ_h=1 kg/s` pierde `100 kJ/kg`; corriente fría gana `50 kJ/kg`. Requiere `ṁ_c=2 kg/s`.

## 7.7. T04.03. Ejercicio puente de planta de vapor

La presentación MEC110_4 incluye una planta de vapor con `ṁ=35 kg/s` y potencia de bomba de `350 HP`, más estados medidos en caldera, turbina y condensador. Importar todos los datos de las diapositivas antes de calcular balances. El laboratorio «Piezas de una planta» puede ofrecer una versión de complejidad reducida **original**, con entalpías ya entregadas, y después la versión auténtica que exige lectura de tablas.

## 7.8. T05.01. Volumen de control transitorio: llenar un tanque

En un tanque que se llena, la masa almacenada cambia:

\[
m_2-m_1=\sum m_{in}-\sum m_{out}.
\]

Para flujo transitorio, la energía acumulada se relaciona con calor, trabajo y energía que cruza con las corrientes:

\[
E_2-E_1=Q-W+\sum_{in}m_i\left(h_i+ke_i+pe_i\right)-\sum_{out}m_e\left(h_e+ke_e+pe_e\right).
\]

Aquí `ke_i=V_{fi}²/2` y `pe_i=gz_i` deben expresarse en las mismas unidades que `h`. Las formas integrales son válidas cuando las cantidades de cada flujo corresponden a propiedades efectivamente integradas o adecuadamente promediadas.

**Ejemplo introductorio de masa:** tanque inicia con `2 kg`, recibe `5 kg`, descarga `1 kg`; termina con `m_2=2+5−1=6 kg`.

**Ejemplo de energía idealizado:** tanque inicialmente vacío y rígido, sin intercambios de calor ni trabajo, llenado por una única entrada con `m_in=2 kg` y entalpía específica constante `h_in=300 kJ/kg`, sin energía cinética/potencial relevante. `U_2=m_in h_in=600 kJ`; si termina con `2 kg`, `u_2=300 kJ/kg`. Explicar por qué la entalpía del flujo entrante no es igual conceptualmente a la energía interna almacenada, aunque el balance entregue estos valores en este caso.

**Simulación:** recipiente que se llena, lectura de `m(t)`, presión y energía; nunca usar un valor de `u` calculado sin estado de sustancia válido. Para gas ideal y tanque rígido, resolver masa y energía conjuntamente y validar la presión final.

## 7.9. Hoja de decisión de equipos

| Equipo | Magnitud principal | Hipótesis frecuente | Ecuación abreviada | Lo que NO se puede asumir siempre |
|---|---|---|---|---|
| Turbina | Trabajo de salida | Adiabática, estacionaria | `w_t≈h1−h2` | Eficiencia 100 % |
| Compresor | Trabajo de entrada | Adiabático, estacionario | `w_in≈h2−h1` | Temperatura fija |
| Bomba | Trabajo de entrada | Líquido incompresible | `w_s≈vΔp` | `v` exacto a todo estado |
| Tobera | Velocidad de salida | Adiabática, sin eje | `Δh≈−Δ(V²/2)` | Energía cinética despreciable |
| Válvula | Reducción de presión | Isoentálpica | `h1≈h2` | `T1=T2` o `s1=s2` |
| Condensador | Calor rechazado | Pérdida de presión pequeña | `q_out≈h_in−h_out` | Calor nulo |
| Caldera | Calor agregado | Régimen estacionario | `q_in≈h_out−h_in` | Sin cambios de fase |
| Intercambiador | Transferencia interna | Adiabático al ambiente | `m_hΔh_h+m_cΔh_c=0` | Igual caudal en ambos lados |

---

# 8. UNIDAD III: SEGUNDA LEY, PROBABILIDAD Y ENTROPÍA

**Correspondencia:** MEC110_6, 36 diapositivas. La lección debe partir desde procesos cotidianos y terminar en las relaciones de entropía y eficiencia. Es clave no saltar desde una caja de moléculas directamente a turbinas sin explicar el puente conceptual.

## 8.1. T06.01. ¿Por qué necesitamos una segunda ley?

**Situación:** el café caliente se enfría sobre una mesa. La energía que pierde llega al ambiente: la primera ley se cumple. La situación inversa —que el café espontáneamente se caliente tomando energía de una habitación más fría, sin otras consecuencias— también podría satisfacer un balance algebraico, pero no es la dirección espontánea observada.

**Primera ley:** la energía se conserva.  
**Segunda ley:** establece restricciones adicionales sobre la dirección y la viabilidad de los procesos. La producción de entropía cuantifica irreversibilidades dentro del modelo macroscópico.

**Ejemplo de demostración:** mostrar dos cuerpos, A a 80 °C y B a 20 °C, en contacto. El calor pasa del más caliente al más frío hasta equilibrio sin necesidad de trabajo externo. Si el estudiante invierte una flecha para representar calor espontáneo de B a A, el sistema exige indicar un refrigerador o una intervención externa; no declara violación de la primera ley, sino incompatibilidad con la segunda ley para el sistema considerado.

## 8.2. T06.02. Caja molecular: microconfiguraciones

**Modelo didáctico:** N moléculas distinguibles por etiqueta ocupan, con igual probabilidad idealizada, la mitad izquierda (L) o derecha (R) de una caja. Hay `2^N` asignaciones izquierda/derecha. Para un valor `n` de moléculas a la izquierda, el número de configuraciones es:

\[
C(N,n)=\binom Nn=\frac{N!}{n!(N-n)!}.
\]

La probabilidad en el modelo simétrico es:

\[
P(n)=\frac{\binom Nn}{2^N},\quad n=0,1,\ldots,N.
\]

**N=2, desarrollo íntegro:** hay cuatro asignaciones `LL, LR, RL, RR`. Los casos `n=0,1,2` aparecen `1,2,1` veces; probabilidades `25 %, 50 %, 25 %`.

**N=4, desarrollo íntegro:** `C(4,0)=1`, `C(4,1)=4`, `C(4,2)=6`, `C(4,3)=4`, `C(4,4)=1`; suma `16=2^4`. La distribución más probable tiene `n=2`, con probabilidad puntual `6/16=37,5 %`.

**N=40:** `C(40,20)=137.846.528.820`. Aunque el valor puntual del centro no sea 100 %, los resultados se concentran **relativamente** alrededor de `n≈20`. Para `n` binomial con `p=0,5`, `E[n]=N/2`, `Var(n)=N/4`, desviación típica relativa de `n/N`: `1/(2√N)`. Esta es la razón matemática de que las fluctuaciones relativas se reduzcan cuando N aumenta.

**N muy grande:** representar el logaritmo de la multiplicidad, no factoriales directos que desbordan memoria numérica. Usar `logC(N,n)=lgamma(N+1)−lgamma(n+1)−lgamma(N−n+1)`.

### Guion de animación, sin interpretación errónea

1. Se muestran 4 moléculas inicialmente agrupadas a un lado.
2. El alumno pulsa «Retirar tabique».
3. Las partículas se mueven de manera visualmente comprensible y el conteo `n(t)` se actualiza.
4. A un lado aparece el **modelo combinatorio independiente** y la probabilidad teórica por `n`.
5. Si la dinámica de partículas es solo estética, rotular: «Trayectorias ilustrativas. La comparación estadística usa una distribución binomial idealizada».
6. Debe existir un botón «Simular distribución estadística», que muestrea asignaciones independientes reproducibles con semilla, sin presentar el movimiento Canvas como molecular dinámica de precisión.
7. Para N=200 utilizar agregación visual o partículas GPU; no forzar miles de operaciones DOM.

**Preguntas guiadas:** ¿qué significa una configuración?, ¿cuál distribución tiene más maneras de ocurrir?, ¿por qué 20/20 es más probable que 40/0?, ¿«equilibrio» significa que jamás habrá fluctuaciones? (No).

## 8.3. T06.03. Microestados y entropía de Boltzmann

En un sistema macroscópico con `Ω` microestados compatibles con las restricciones y macroestado considerado, la expresión fundamental es:

\[
S=k_B\ln\Omega,
\]

con `k_B≈1,380649×10^{−23} J/K` y `S` en J/K. La constante por masa y la entropía específica `s` deben diferenciarse de `S` total.

**Ejemplo numérico conceptual:** macroestado A tiene `Ω_A=10` microestados y macroestado B `Ω_B=1000`. Diferencia de entropía `ΔS=k_B ln(1000/10)=k_B ln100≈6,358×10^{−23} J/K`. No interpretar el número como entropía de 1 kg de vapor: es un ejemplo estadístico microscópico.

**Desmontar confusiones:** «entropía = desorden» es una metáfora insuficiente. La multiplicidad accesible, restricciones del sistema y probabilidad de macrostados son un punto de partida más riguroso. Un sistema puede reducir su entropía si transfiere suficiente entropía al entorno; la restricción de no disminución aplica a **sistema aislado total**.

## 8.4. T06.04. Equilibrio térmico de dos sistemas, E + E' = 13

La presentación MEC110_6 propone un sistema combinado con energía fija `E_tot=13` y microestados accesibles `Ω_A(E)` y `Ω_B(E')`. Para cada partición `E'=13−E`, el número de microestados conjuntos es:

\[
\Omega_{tot}(E)=\Omega_A(E)\Omega_B(13-E).
\]

La probabilidad relativa es `P(E)=Ω_tot(E)/Σ_E Ω_tot(E)`. El equilibrio más probable se asocia al máximo de `ln Ω_tot(E)=ln Ω_A(E)+ln Ω_B(13−E)`.

**Implementación:** tabla interactiva con columnas `E`, `E'`, `Ω_A`, `Ω_B`, `Ω_tot`, `ln Ω_tot`, `P(E)`. Importar los valores de la diapositiva 24 desde una transcripción validada con su fuente visible; no fabricar una «tabla oficial» sin verificar la imagen. Si aún no se ha transcrito, mostrar una **tabla sintética original** con rótulo muy claro y dejar la tabla de cátedra como pendiente.

**Derivación en profundidad:** al maximizar el logaritmo bajo energía total constante, `∂S_A/∂E_A = ∂S_B/∂E_B`; de la identidad termodinámica `(∂S/∂E)_{V,N}=1/T`, surge la igualdad de temperaturas de equilibrio. La versión principiante solo necesita comprender que el equilibrio corresponde a la partición más probable, no dominar derivadas parciales.

## 8.5. T06.05. Relación macroscópica de entropía

Para una transformación reversible de transferencia térmica, `dS=δQ_rev/T` en las condiciones correspondientes. Para sistemas cerrados generales se aplica el balance de entropía:

\[
S_2-S_1=\int_{1}^{2}\frac{\delta Q}{T_b}+S_{gen},\qquad S_{gen}\ge0.
\]

`T_b`: temperatura absoluta en la porción de frontera donde pasa calor. `S_gen` no es una propiedad de estado: es entropía generada por irreversibilidades durante el proceso.

**Interacción:** dos recipientes intercambian calor; se actualizan cambios de entropía de cada uno y el total. El gráfico presenta `ΔS_total` y alerta si los datos elegidos harían `S_gen<0` en un sistema aislado.

### Ecuaciones Tds de Gibbs

Para una sustancia simple compresible en equilibrio:

\[
T\,ds=du+p\,dv, \qquad T\,ds=dh-v\,dp.
\]

Estas son relaciones entre propiedades; no significan que todo proceso físico tenga transferencia de calor `δQ=Tds`. Para gas ideal a `c_p,c_v` constantes:

\[
\Delta s=c_v\ln\!\frac{T_2}{T_1}+R\ln\!\frac{v_2}{v_1}
=c_p\ln\!\frac{T_2}{T_1}-R\ln\!\frac{p_2}{p_1}.
\]

Para sólidos y líquidos aproximadamente incompresibles con calor específico constante, si la contribución de presión es despreciable en el modelo elegido:

\[
\Delta s\approx c\ln(T_2/T_1).
\]

**Ejemplo resuelto de gas ideal:** aire con `c_p=1,005`, `R=0,287`, `T_1=300 K`, `T_2=450 K`, `p_1=100 kPa`, `p_2=200 kPa`.

1. Ecuación: `Δs=cp ln(T2/T1)−R ln(p2/p1)`.
2. Sustitución: `1,005 ln(1,5)−0,287 ln(2)`.
3. Logaritmos: `1,005×0,405465 − 0,287×0,693147`.
4. Resultado: `≈0,2086 kJ/(kg·K)`.
5. Interpretación: la contribución del aumento de temperatura supera el efecto de aumento de presión en este ejemplo.

## 8.6. T06.06. Reversibilidad e irreversibilidad

Un proceso reversible es un ideal de referencia que podría invertirse sin efectos netos en sistema y entorno. Procesos reales tienen fricción, mezclas, transferencia de calor con diferencia finita de temperatura, estrangulación y otras irreversibilidades. Un proceso **adiabático** no necesariamente es **isentrópico**; se requiere además reversibilidad interna para afirmar `Δs=0` en condiciones adecuadas.

**Ejemplo demostrativo:** turbina adiabática real con `s_2>s_1`. Si no intercambia calor y existe una entrada/salida, el balance estacionario de entropía implica `Ṡ_gen=ṁ(s_2−s_1)>0`, en el modelo simplificado.

**Advertencia numérica:** si un cálculo arroja `S_gen=−0,3 kW/K` para un volumen de control adiabático cerrado correctamente especificado, no redondear a cero: mostrar fallo físico y ayudar a revisar signos, temperaturas, datos de propiedades o esquema de flujos.

## 8.7. T06.07. Rendimientos isentrópicos de dispositivos

**Turbina:** el trabajo ideal isentrópico representa un límite mayor bajo las mismas condiciones de entrada y presión final:

\[
\eta_t=\frac{h_1-h_{2a}}{h_1-h_{2s}}.
\]

`2s`: salida ideal isentrópica. `2a`: salida real. Para una turbina real usual, `h_1>h_{2a}>h_{2s}`.

**Compresor:** el mínimo trabajo ideal está en el numerador:

\[
\eta_c=\frac{h_{2s}-h_1}{h_{2a}-h_1}.
\]

**Bomba:** `η_B=(h_{2s}−h_1)/(h_{2a}−h_1)`.

**Tobera:** la eficiencia debe definirse según su formulación energética, por ejemplo relación entre aumento de energía cinética real e ideal bajo entradas y salidas de presión comparables; no copiar automáticamente la fórmula de turbina sin revisar datos y velocidades.

**Ejemplo sencillo:** turbina con `h_in=1000`, `h_{out,s}=700 kJ/kg`, `η_t=0,85`. `w_{t,s}=300 kJ/kg`; `w_{t,a}=0,85×300=255 kJ/kg`; `h_{out,a}=1000−255=745 kJ/kg`. Es coherente que la salida real retenga más entalpía.

**Segundo ejemplo:** compresor con `h_in=300`, `h_{out,s}=400 kJ/kg`, `η_c=0,80`; trabajo real `100/0,8=125 kJ/kg` y `h_{out,a}=425 kJ/kg`. El sistema comparará los dos equipos, resaltando **multiplicar en turbina / dividir en compresor**, con explicación física de por qué.

---

# 9. UNIDAD IV: MÁQUINAS TÉRMICAS, CARNOT Y REFRIGERACIÓN

**Correspondencia:** MEC110_7, 18 diapositivas. Las situaciones de carbón, geotermia, estanques solares, refrigerador doméstico, sandías y máquina de hielo proceden del temario y ejercicios identificados en la presentación y en el Markdown base.

## 9.1. T07.01. La máquina térmica y Kelvin–Planck

**Máquina térmica:** opera cíclicamente, recibe calor `Q_H` desde un foco a temperatura más elevada, entrega trabajo `W_neto` y rechaza calor `Q_L` a otro foco más frío. Para un ciclo, `ΔE=0`, por tanto:

\[
W_{neto}=Q_H-Q_L,\qquad \eta_{th}=\frac{W_{neto}}{Q_H}=1-\frac{Q_L}{Q_H}.
\]

**Ejemplo simple creado:** `Q_H=1000 kJ`, `Q_L=600 kJ`. `W=400 kJ` y `η=400/1000=0,40=40 %`.

**Postulado de Kelvin–Planck (paráfrasis):** un dispositivo cíclico no puede convertir en trabajo neto todo el calor recibido de un único depósito sin otros efectos. En la interfaz, un estudiante que intente fijar `Q_L=0` mientras `Q_H>0` en una máquina térmica con un solo depósito recibe explicación de límite físico, no solo un mensaje rojo.

## 9.2. T07.02. Ciclo de Carnot

Cuatro transformaciones ideales **reversibles**: (1) adición de calor isotérmica a `T_H`; (2) expansión adiabática/isentrópica; (3) rechazo de calor isotérmico a `T_L`; (4) compresión adiabática/isentrópica. Representar el ciclo con recorrido animado sobre T-s y un botón para detener en cada estado.

**Límite térmico:**

\[
\eta_{Carnot}=1-\frac{T_L}{T_H},\quad 0<T_L<T_H, \quad T\text{ en K}.
\]

**Qué significa:** para dos focos térmicos dados, el límite reversible de eficiencia térmica no puede superarse por una máquina de potencia que opere entre ellos. Una central real normalmente queda debajo de él.

### Caso MEC110_7: tres fuentes térmicas

Suposición pedagógica: foco frío `20 °C =293,15 K`. Focos calientes: carbón `1200 °C`, geotermia `140 °C`, estanque solar `80 °C`. Estos valores sirven para calcular **límites idealizados de Carnot**, no rendimientos de centrales reales completas.

| Fuente idealizada | `T_H` | Sustitución | `η_Carnot` aprox. |
|---|---:|---|---:|
| Carbón | 1473,15 K | `1−293,15/1473,15` | 80,1 % |
| Geotermia | 413,15 K | `1−293,15/413,15` | 29,0 % |
| Estanque solar | 353,15 K | `1−293,15/353,15` | 17,0 % |

**Actividad visual:** tres termómetros de distinta altura, mismo `T_L`, curvas o barras animadas y una pregunta «¿A qué se debe la diferencia?». Mostrar también la inversión de Kelvin para que se aprecie por qué no se calculan ratios con grados Celsius.

### Caso MEC110_7: `Q_H=500 kJ`, `Q_L=200 kJ`, `T_L=17 °C`

1. Convertir: `T_L=17+273,15=290,15 K`.
2. Primera ley cíclica: `W=500−200=300 kJ`.
3. Rendimiento: `η=300/500=0,60=60 %`.
4. Por Carnot reversible: `Q_L/Q_H=T_L/T_H`.
5. Despejar `T_H=T_L(Q_H/Q_L)=290,15×2,5=725,375 K`.
6. Volver a Celsius: `T_H≈452,225 °C`.
7. Comprobación: `T_H>T_L` y `1−290,15/725,375=0,60`.

**Error típico:** invertir `Q_H/Q_L` o usar `17` directamente en la proporción de temperaturas.

## 9.3. T07.03. Refrigerador, bomba de calor y Clausius

**Refrigerador:** su objetivo es retirar calor `Q_L` de un recinto frío mediante trabajo de entrada `W_in`.  
**Bomba de calor:** su objetivo es entregar `Q_H` a un recinto caliente usando la misma lógica de ciclo.

\[
COP_R=\frac{Q_L}{W_{in}},\qquad COP_{HP}=\frac{Q_H}{W_{in}}=COP_R+1
\]

para un mismo ciclo sin pérdidas adicionales fuera de las definiciones. **No son eficiencias entre 0 y 1**; `COP` puede superar 1.

**Postulado de Clausius (paráfrasis):** no puede ocurrir como único resultado de un dispositivo cíclico transferir calor de un cuerpo frío a otro caliente sin aporte externo apropiado.

**Ejemplo creado:** refrigerador extrae `Q_L=300 kJ` con `W_in=100 kJ`. `COP_R=3`, `Q_H=400 kJ`, `COP_HP=4`.

**Carnot invertido:** `COP_R,Carnot=T_L/(T_H−T_L)` y `COP_HP,Carnot=T_H/(T_H−T_L)`, en Kelvin. Si `T_L≈273,15 K`, `T_H≈303,15 K`, `COP_R,Carnot≈9,105`. Aclarar que valores reales serán inferiores, según condiciones y equipos.

## 9.4. T07.04. Ciclo de refrigeración por compresión de vapor

**Equipo y recorrido:**

```text
                 W_in
                  ↓
   (1) vapor ─ COMPRESOR ─ (2) vapor alta p
       ↑                          ↓
   EVAPORADOR                  CONDENSADOR ── Q_H al ambiente
       ↑                          ↓
   (4) mezcla ← VÁLVULA ← (3) líquido alta p
                 h3 = h4
          Q_L desde recinto frío
```

### Estados y ecuaciones para régimen estacionario idealizado

- `1→2`, compresor: `w_in=h_2−h_1`, con `s_2≈s_1` solo en el caso isentrópico ideal.
- `2→3`, condensador: `q_H=h_2−h_3`.
- `3→4`, válvula: `h_3≈h_4`.
- `4→1`, evaporador: `q_L=h_1−h_4`.
- `COP_R=(h_1−h_4)/(h_2−h_1)`.

**Diseño de visualización:** circuito cerrado con partículas de fase gaseosa y líquida distinguibles; cuatro nodos en P-h. Colores expresan rangos térmicos **según el refrigerante elegido**. Si no hay propiedades de refrigerante validadas, ofrecer un modo que recibe entalpías y presiones definidas por el problema y etiquetar la planta como «modelo energético», no simulación de estado R134a.

## 9.5. T07.05. Refrigerador de funcionamiento intermitente — caso de cátedra

**Datos:** extracción promedio `Q̇_L,prom=1200 kJ/h`, tiempo activo `f=1/4`, `COP_R=2,5`. Pregunta: potencia eléctrica cuando el compresor **está encendido**.

1. `1200 kJ/h = 1200/3600 kJ/s = 0,3333 kW` promedio.
2. Solo funciona `0,25` del tiempo, entonces `Q̇_L,activo=0,3333/0,25=1,3333 kW`.
3. `COP_R=Q̇_L,activo/Ẇ_in,activo`.
4. `Ẇ_in,activo=1,3333/2,5=0,5333 kW≈533 W`.
5. **Comprobación:** potencia promedio estimada `0,5333×0,25≈0,1333 kW`, y `0,1333×2,5≈0,3333 kW` promedio de enfriamiento.

**Interacción:** slider de fracción de operación entre `0,10` y `1,00`; explicar que la potencia durante funcionamiento depende de cómo se defina la tasa promedio. Si el texto original cambia su definición de «promedio» se debe revisar el significado antes de atribuir el número a la diapositiva.

## 9.6. Enfriamiento de cinco sandías — caso de cátedra

**Datos:** `5×10=50 kg`, aproximación del alimento como agua con `c=4,184 kJ/(kg·K)`, `T_i=20 °C`, `T_f=8 °C`, potencia del refrigerador `450 W`, `COP_R=4,5`. Se ignoran cargas térmicas de paredes, puertas, ventilación y resistencia interna de transferencia en el alimento; por ello es **tiempo mínimo idealizado bajo carga constante**.

1. `ΔT=20−8=12 K` de enfriamiento.
2. Calor a extraer: `|Q|=mcΔT=50×4,184×12=2510,4 kJ`.
3. Potencia eléctrica: `450 W=0,450 kW`.
4. Capacidad frigorífica: `Q̇_L=COP×Ẇ=4,5×0,450=2,025 kW`.
5. Tiempo: `t=2510,4 kJ/2,025 kJ/s=1239,70 s`.
6. En minutos: `1239,70/60≈20,66 min`.
7. Comprobación: energía `≈2,51 MJ`, extracción `≈2,0 kJ/s`, orden de magnitud `≈20 min`.

**Gráfico exigido:** temperatura idealizada del alimento versus tiempo, con cautela de capacidad frigorífica constante. En modo profundo, comparar con un modelo de transferencia térmica con resistencia y explicar que el tiempo real puede ser mayor.

## 9.7. Máquina productora de hielo — caso de cátedra

**Datos:** agua entra a `15 °C`, sale como hielo a `−5 °C`; producción `12 kg/h`; `COP=2,4`; adoptar `c_agua=4,184 kJ/(kg·K)`, `h_fusión=333,7 kJ/kg`, `c_hielo=2,11 kJ/(kg·K)` según el conjunto de parámetros del ejercicio.

**Tramo I: enfriamiento del agua 15→0 °C:** `q_1=4,184×15=62,76 kJ/kg`.  
**Tramo II: congelación a 0 °C:** `q_2=333,7 kJ/kg`.  
**Tramo III: enfriamiento del hielo 0→−5 °C:** `q_3=2,11×5=10,55 kJ/kg`.

`q_total=62,76+333,7+10,55=407,01 kJ/kg`.  
`ṁ=12/3600=0,0033333 kg/s`.  
`Q̇_L=ṁ×q_total≈1,3567 kW`.  
`Ẇ_in=Q̇_L/COP≈1,3567/2,4≈0,5653 kW≈565 W`.

**Gráfico termodinámico obligatorio:** curva de temperatura versus energía retirada por kilogramo, con tramo de temperatura descendente en agua líquida, meseta de solidificación a 0 °C y tramo descendente en hielo. Etiquetar ejes en el sentido de «calor extraído acumulado» para evitar curvas invertidas. Permitir activar anotaciones de calor **sensible** y **latente**.

**Error típico:** aplicar `mcΔT` una sola vez de 15 a −5 °C; eso omite la energía latente de solidificación, que aquí domina la carga térmica.

---

# 10. UNIDAD V: COMPRESIÓN MULTIETAPA Y BRAYTON

**Correspondencia:** MEC110_8, 25 diapositivas.

## 10.1. T08.01. ¿Por qué enfriar entre etapas de compresión?

Al comprimir gas, la temperatura normalmente sube. Si se enfría entre etapas, la siguiente etapa parte de una temperatura más baja y el trabajo total requerido puede reducirse. En un diagrama P-v, comparar trayectorias de una etapa, dos etapas y compresión próxima a isotérmica bajo supuestos consistentes.

**Dos etapas con interenfriamiento ideal completo:** `p_1→p_i→p_2`. Para mismas condiciones de entrada térmica y exponentes de compresión de cada etapa, la suma de trabajos se minimiza cuando las razones de presión son iguales:

\[
\frac{p_i}{p_1}=\frac{p_2}{p_i}\ \Rightarrow\ p_i^2=p_1p_2\ \Rightarrow\ p_i=\sqrt{p_1p_2}.
\]

**Ejemplo con números:** `p_1=100 kPa`, `p_2=900 kPa`, razón total 9. `p_i=300 kPa`, de modo que cada etapa tiene razón 3. El slider de presión intermedia debe mostrar que desviarse de 300 kPa aumenta el trabajo **bajo las hipótesis del modelo**. Si eficiencias distintas, pérdidas de presión, temperaturas de intercooling distintas o modelos de compresión diferentes, el óptimo se determina numéricamente y puede cambiar.

## 10.2. T08.02. Ciclo Brayton ideal de cuatro estados

**Modelo aire estándar de calores específicos constantes:**

1. `1→2`: compresión isentrópica.
2. `2→3`: suministro de calor a presión constante.
3. `3→4`: expansión isentrópica.
4. `4→1`: rechazo de calor a presión constante.

```
    (1) ──► [ COMPRESOR ] ──► (2) ──► [ APORTE CALOR ] ──► (3)
      ▲           W_in                  Q_in                 │
      │                                                   ▼
 [ RECHAZO CALOR ] ◄────── (4) ◄────── [ TURBINA ] ◄──────┘
       Q_out                           W_out
```

Usar siempre `T` absoluta para relaciones isentrópicas. Con `r_p=p_2/p_1` y `k=cp/cv`:

\[
\frac{T_{2s}}{T_1}=r_p^{(k-1)/k},\qquad
\frac{T_{4s}}{T_3}=r_p^{-(k-1)/k}.
\]

\[
w_c=c_p(T_2-T_1),\quad w_t=c_p(T_3-T_4),\quad
w_{neto}=w_t-w_c.
\]

\[
q_{in}=c_p(T_3-T_2),\quad q_{out}=c_p(T_4-T_1),\quad
\eta_{th}=\frac{w_{neto}}{q_{in}}.
\]

Bajo las idealizaciones mencionadas, la eficiencia también se expresa como:

\[
\eta_{ideal}=1-r_p^{-(k-1)/k}.
\]

**Distinción clave:** esta relación sencilla no se aplica sin correcciones al Brayton real, ni al aire con calores específicos variables, ni a plantas con regeneración.

## 10.3. T08.03. Ejercicio de cátedra Brayton `100→480 kPa`, `20→880 °C`

**Datos:** `p_1=100 kPa`, `T_1=20 °C=293,15 K`, `p_2=480 kPa`, `T_3=880 °C=1153,15 K`; usar `k=1,4`, `cp=1,005 kJ/(kg·K)`. Las temperaturas y presiones de referencia son las de MEC110_8, diapositiva 19; los números calculados quedan vinculados al motor de esta versión.

1. Razón de presión: `r_p=480/100=4,8`.
2. Exponente: `a=(k−1)/k=0,4/1,4≈0,285714`.
3. Factor `F=r_p^a≈1,565454`.
4. Salida ideal del compresor: `T_2s=T_1F≈458,913 K`.
5. Salida ideal de turbina: `T_4s=T_3/F≈736,623 K`.
6. Trabajo del compresor: `w_c,s=1,005(458,913−293,15)≈166,592 kJ/kg`.
7. Trabajo de turbina: `w_t,s=1,005(1153,15−736,623)≈418,609 kJ/kg`.
8. Neto: `w_neto,s≈252,018 kJ/kg`.
9. Calor de entrada: `q_in,s=1,005(1153,15−458,913)≈697,708 kJ/kg`.
10. Eficiencia: `η≈252,018/697,708≈36,12 %`.
11. Comprobación alternativa: `1−1/1,565454≈0,361208`.

### Caso real: `η_t=η_c=0,85`

**Compresor real:**

\[
T_{2a}=T_1+\frac{T_{2s}-T_1}{\eta_c}
=293{,}15+\frac{458{,}913-293{,}15}{0{,}85}
\approx488{,}165\;K.
\]

**Turbina real:**

\[
T_{4a}=T_3-\eta_t(T_3-T_{4s})
=1153{,}15-0{,}85(1153{,}15-736{,}623)
\approx799{,}102\;K.
\]

`w_c≈195,990 kJ/kg`; `w_t≈355,818 kJ/kg`; `w_neto≈159,828 kJ/kg`; `q_in≈668,459 kJ/kg`; `η≈23,92 %`.

### Tabla de sensibilidad — mismo modelo, sin copiar valores fijos

| `η_t=η_c` | `w_c` [kJ/kg] | `w_neto` [kJ/kg] | `η_th` |
|---:|---:|---:|---:|
| 100 % | 166,59 | 252,02 | 36,12 % |
| 85 % | 195,99 | 159,83 | 23,92 % |
| 80 % | 208,24 | 126,65 | 19,30 % |
| 75 % | 222,12 | 91,83 | 14,30 % |
| 70 % | 237,99 | 55,04 | 8,79 % |
| 65 % | 256,29 | 15,80 | 2,60 % |

**Mensaje físico:** una turbina de gas puede dedicar una parte considerable de su trabajo a mover el compresor. Al empeorar ambas eficiencias, cae mucho el trabajo útil del conjunto. Comparar trabajo de turbina, consumo de compresor y trabajo neto con barras apiladas.

**Controles:** `η_t` y `η_c` independientes entre 0,65 y 1,00; `r_p` dentro de región válida; `T_3`, `T_1` con `T_3>T_2`; botón «Restaurar valores originales». Guardar el último estado de usuario separadamente del caso original.

## 10.4. T08.04. Presión óptima para máximo trabajo neto

Para Brayton ideal con `T_1`,`T_3` fijas y `cp`, `k` constantes, sea `r=r_p^a`, `a=(k−1)/k`. El trabajo neto es:

\[
\frac{w_{neto}}{c_p}=T_3\left(1-\frac1r\right)-T_1(r-1).
\]

Derivar respecto de `r`:

\[
\frac{d(w_{neto}/c_p)}{dr}=\frac{T_3}{r^2}-T_1=0
\implies r^*=\sqrt{\frac{T_3}{T_1}}.
\]

Por lo tanto:

\[
r_p^*=\left(\frac{T_3}{T_1}\right)^{\frac{k}{2(k-1)}}.
\]

**Caso de cátedra:** `T_3=1700 K`, `T_1=473 K`, `k=1,4`; `r_p*≈(1700/473)^1,75≈9,39` (aproximado). Recalcular en vivo con la biblioteca matemática y graficar `w_neto(r_p)`.

**Advertencia conceptual esencial:** **máximo trabajo neto** y **máxima eficiencia térmica** no son el mismo criterio. La ecuación de eficiencia ideal `1−r_p^−a` aumenta con `r_p` en su dominio ideal, pero el trabajo neto tiene un máximo y puede llegar a cero cuando el salto térmico disponible deja de producir trabajo. Un gráfico doble permite comparar los dos objetivos.

## 10.5. T08.05. Brayton con regeneración

Cuando los gases a salida de turbina son más calientes que el aire a salida de compresor (`T_4>T_2`), un regenerador puede recuperar calor de escape para precalentar el aire antes del aporte externo. Definir eficacia térmica en una forma simplificada con capacidades térmicas equivalentes:

\[
\varepsilon_{reg}=\frac{T_5-T_2}{T_4-T_2},\qquad 0\le\varepsilon_{reg}\le1.
\]

`5` representa la salida fría del regenerador; las numeraciones son locales al circuito. `T_5=T_2+ε_reg(T_4−T_2)`. Con `ε=0`, no hay recuperación; con `ε=1`, el límite ideal de salida fría alcanza la temperatura de entrada caliente, bajo capacidades equivalentes y sin diferencias mínimas/caídas de presión. El modelo avanzado debe usar balances por entalpía y permitir capacidades distintas.

**Ejemplo creado:** `T_2=500 K`, `T_4=800 K`, `ε=0,70`: `T_5=500+0,70×300=710 K`. Se necesitan 210 K menos de calentamiento externo para llegar a una temperatura de entrada de turbina dada, bajo `cp` constante.

**Validación:** si `T_4=450 K` y `T_2=500 K`, mostrar «la regeneración no aporta precalentamiento útil con esta configuración» y evitar `q_reg<0` bajo rótulo de recuperación positiva.

## 10.6. T08.06. Configuración avanzada: interenfriamiento, recalentamiento, regeneración

El laboratorio debe ofrecer una topología con diez estados **explícitos y editables**. Numeración sugerida para el ejemplo didáctico (la fuente de la diapositiva puede utilizar otra; conservar un mapeo de numeración por caso):

| Tramo | Componente | Significado físico |
|---|---|---|
| 1→2 | Compresor etapa 1 | Aumento de p y T, consume trabajo |
| 2→3 | Interenfriador | Rechazo de calor entre etapas |
| 3→4 | Compresor etapa 2 | Segundo aumento de presión |
| 4→5 | Regenerador, lado frío | Precalienta aire comprimido |
| 5→6 | Cámara de aporte térmico | Sube T hasta máximo |
| 6→7 | Turbina etapa 1 | Primera expansión y trabajo |
| 7→8 | Recalentador | Recupera temperatura antes de otra expansión |
| 8→9 | Turbina etapa 2 | Segunda expansión y trabajo |
| 9→10 | Regenerador, lado caliente | Cede energía a 4→5 |
| 10→1 | Rechazo térmico idealizado | Cierra el ciclo aire-estándar |

**Balances implementables:** `w_c=cp[(T_2−T_1)+(T_4−T_3)]`, `w_t=cp[(T_6−T_7)+(T_8−T_9)]`, `w_net=w_t−w_c`, `q_in=cp[(T_6−T_5)+(T_8−T_7)]`, `η=w_net/q_in`. Para fluidos reales o `cp(T)` sustituir por diferencias de entalpía.

**Limitaciones del modelo:** la cámara de combustión de una turbina real es de flujo abierto con incorporación de combustible; el ciclo cerrado dibujado es idealización aire-estándar. La pérdida de presión en intercambiadores, las eficiencias de etapa y la eficacia regenerativa son parámetros configurables, no siempre cero o uno.

---

# 11. UNIDAD VI: RANKINE, RECALENTAMIENTO Y REGENERACIÓN

**Correspondencia:** MEC110_9, 42 diapositivas. Esta unidad requiere un motor de propiedades de agua/vapor validado. Nunca calcular entalpías/entropías de vapor real mediante una única ecuación de gas ideal en toda la región de fase.

## 11.1. T09.01. ¿Por qué no se implementa Carnot ideal directamente en vapor?

El ciclo de Carnot reversible es un referente de eficiencia, no una receta sencilla de planta. Una implementación basada en vapor húmedo exigiría comprimir una mezcla líquido-vapor en ciertas configuraciones, lo que resulta industrialmente difícil; además, la transferencia de calor y los equipos reales introducen otras restricciones. El Rankine sustituye la compresión de mezcla por **bombeo de líquido condensado**, mucho más practicable.

**Animación comparativa:** circuito Carnot idealizado versus Rankine con una bomba de agua líquida. Al pulsar la bomba, un globo explica: «Es más conveniente presurizar líquido prácticamente incompresible que intentar comprimir una mezcla húmeda».

## 11.2. Ciclo Rankine simple ideal

Un ciclo elemental tiene cuatro equipos: **bomba → caldera → turbina → condensador**. La numeración varía entre fuentes; no fijar fórmulas globales a números de estado. La descripción basada en funciones es:

| Proceso | Entrada → salida | Balance específico |
|---|---|---|
| Bomba | Líquido a baja → alta presión | `w_B≈h_B,out−h_B,in` |
| Caldera | Agua presurizada → vapor | `q_in=h_caldera,out−h_caldera,in` |
| Turbina | Vapor alta p → mezcla/vapor baja p | `w_T=h_T,in−h_T,out` |
| Condensador | Vapor/mezcla → líquido | `q_out=h_cond,in−h_cond,out` |

`w_neto=w_T−w_B`, `η_th=w_neto/q_in`, `Ẇ_neto=ṁ w_neto` y `ṁ=Ẇ_neto/w_neto`.

**Estado en tabla:** cada punto muestra `p`,`T`,`h`,`s`,`v`,`fase`,`x` (si procede), `origen de propiedades` y `estado de validación`. En mezcla, calcular `x=(s−s_f)/s_fg` para expansión isentrópica ideal cuando `s` está dentro de `s_f` y `s_g` a la presión final.

### Lectura paso a paso: turbina que entra sobrecalentada y sale como mezcla

1. A entrada, `p` y `T` conocidos; comprobar `T>T_sat(p)`.
2. Abrir propiedades de vapor sobrecalentado y obtener `h_in`,`s_in`.
3. Suponer ideal isentrópico: `s_out,s=s_in`.
4. En presión del condensador, obtener `s_f`,`s_fg`,`h_f`,`h_fg` de saturación.
5. Si `s_f≤s_out,s≤s_g`, calcular `x_out,s=(s_out,s−s_f)/s_fg`.
6. `h_out,s=h_f+x_out,s h_fg`.
7. `w_T,s=h_in−h_out,s`.
8. Bomba ideal `w_B,s≈v_fΔp`.
9. `q_in=h_in−h_bomba,out`.
10. `η=(w_T−w_B)/q_in`.
11. Para una potencia deseada, `ṁ=Ẇ_neto/w_neto`.
12. Comprobar unidades, calidad en `[0,1]`, primera ley en el ciclo y orden de temperaturas.

## 11.3. Caso 4A — Planta Rankine simple de 300 MW, ideal y real

**Datos de cátedra MEC110_9, diapositivas 8–10:** potencia neta de referencia `300 MW`, vapor a turbina `10 MPa` y `500 °C`, condensador `10 kPa`. Caso real de comparación: eficiencias de turbina y bomba del `85 %`.

**Propiedades de referencia utilizadas en el Markdown original** (deben conservar su procedencia y edición de tabla hasta la validación cruzada): entrada turbina `h_2≈3375,1 kJ/kg`, `s_2≈6,5995 kJ/(kg·K)`; a `10 kPa`, `h_f≈191,81`, `h_fg≈2392,1`, `s_f≈0,6492`, `s_fg≈7,4996`, `v_f≈0,001010`.

### Variante ideal, sin saltar pasos

**Paso 1 — Bomba:** `p_cond=10 kPa`, `p_caldera=10000 kPa`.

\[
w_{B,s}\approx v_f\Delta p=0{,}001010(10000-10)\approx10{,}09\ \mathrm{kJ/kg}.
\]

`h_1≈h_f+w_B≈191,81+10,09=201,90 kJ/kg` (numeración según caso de cátedra).

**Paso 2 — Turbina ideal:** `s_{3s}=s_2≈6,5995`.

\[
x_{3s}=\frac{s_{3s}-s_f}{s_{fg}}=
\frac{6{,}5995-0{,}6492}{7{,}4996}\approx0{,}7934.
\]

`h_{3s}=h_f+x_{3s}h_fg≈2089,7 kJ/kg`.

**Paso 3 — Trabajo de turbina:** `w_T,s≈3375,1−2089,7=1285,4 kJ/kg`.

**Paso 4 — Trabajo neto:** `w_neto,s≈1285,4−10,09=1275,3 kJ/kg`.

**Paso 5 — Calor de caldera:** `q_in,s≈3375,1−201,90=3173,2 kJ/kg`.

**Paso 6 — Rendimiento:** `η≈1275,3/3173,2≈0,4019=40,19 %`.

**Paso 7 — Caudal:** convertir `300 MW=300000 kW`; `ṁ≈300000 kJ/s /1275,3 kJ/kg≈235,2 kg/s`.

**Interpretación:** `x≈0,7934` equivale a una mezcla de aproximadamente 79,3 % de vapor en masa y 20,7 % de líquido en masa a la descarga idealizada; el alto contenido de humedad puede plantear problemas de operación y erosión.

### Variante real, `η_T=η_B=85 %`

**Paso 1 — Bomba real:** `w_B≈10,09/0,85≈11,87 kJ/kg`, `h_1≈191,81+11,87=203,68 kJ/kg`.

**Paso 2 — Turbina real:** `w_T≈0,85×1285,4≈1092,6 kJ/kg`; `h_3≈3375,1−1092,6≈2282,5 kJ/kg`.

**Paso 3 — Calidad real estimada:** `x_3≈(2282,5−191,81)/2392,1≈0,8740`.

**Paso 4 — Neto y aporte:** `w_neto≈1092,6−11,87≈1080,7 kJ/kg`; `q_in≈3375,1−203,68≈3171,4 kJ/kg`.

**Paso 5 — Rendimiento y caudal:** `η≈1080,7/3171,4≈34,08 %`; `ṁ≈300000/1080,7≈277,6 kg/s`.

| Resultado | Rankine ideal | Rankine real al 85 % | Interpretación |
|---|---:|---:|---|
| Calidad salida turbina | 79,34 % | 87,40 % | Menor humedad en salida real, con menor trabajo útil |
| Trabajo neto | 1275,3 kJ/kg | 1080,7 kJ/kg | El real produce menos trabajo/kg |
| Eficiencia térmica | 40,2 % | 34,1 % | Las irreversibilidades reducen el rendimiento |
| Flujo necesario para 300 MW | 235,2 kg/s | 277,6 kg/s | Se requiere más vapor para igual potencia |

**Regla de producto:** estos valores son **referencias redondeadas** del caso de cátedra y del Markdown previo, no resultados fijados a la fuerza. Con un proveedor IF97 y otra interpolación/precisión pueden variar levemente. Mostrar tolerancias y fuente de cada propiedad.

## 11.4. T09.02. Tres estrategias para mejorar la eficiencia de Rankine

1. **Bajar presión del condensador**, dentro de límites de equipo, ambiente y humedad de salida: reduce temperatura media de rechazo, pero puede aumentar contenido de humedad y exigir mayores volúmenes en turbina.
2. **Aumentar presión de caldera:** suele elevar temperatura media de aporte de calor, aunque puede aumentar humedad al expandir si no hay otras medidas.
3. **Aumentar temperatura de sobrecalentamiento:** incrementa temperatura media de adición de calor y suele reducir humedad al final, limitada por materiales y seguridad.

**Experimento comparativo:** modificar una variable a la vez en la planta, mostrar simultáneamente `η`, `x_salida`, `w_neto`, `ṁ` y advertencias de validez. No afirmar que toda variación siempre mejorará simultáneamente todos los indicadores.

## 11.5. T09.03. Componentes de una caldera industrial

- **Economizador:** precalienta agua de alimentación usando calor de los gases de salida; puede elevar eficiencia de recuperación.
- **Evaporador:** suministra energía para el cambio de fase líquido-vapor.
- **Sobrecalentador:** eleva la temperatura del vapor por encima de saturación.
- **Recalentador:** calienta nuevamente vapor que ya se expandió parcialmente en la turbina.
- **Tambor / domo de vapor:** separa y recircula fases en calderas que lo utilizan; algunas calderas de paso único no tienen el mismo esquema.
- **Bombas, ventiladores, quemadores y control:** equipos auxiliares que deben distinguirse de los cuatro elementos del ciclo idealizado.

Las presentaciones incluyen fotografías de calderas industriales (MEC110_9, diapositivas 13–16). Reemplazarlas o utilizarlas solo con permisos pertinentes, atribución y calidad suficiente; no presentar un render sintético como una fotografía de la planta real.

## 11.6. T09.04. Rankine con recalentamiento

Un ciclo con dos etapas de expansión usa una turbina de alta presión (TAP), un recalentador y una turbina de baja presión (TBP). El vapor sale de la TAP y vuelve a una fuente térmica para elevar su temperatura antes de entrar a la TBP. El objetivo puede ser aumentar trabajo y controlar humedad, sujeto a condiciones de operación.

**Balances específicos:** `w_T=(h_TAP,in−h_TAP,out)+(h_TBP,in−h_TBP,out)`; `q_in=(h_caldera,out−h_bomba,out)+(h_reheat,out−h_reheat,in)`; `w_neto=w_T−w_B`; `η=w_neto/q_in`.

### Caso 4B — Recalentamiento con restricción de humedad

**Enunciado MEC110_9 diapositiva 18:** planta entre `9 MPa` y `10 kPa`; caudal `25 kg/s`; vapor entra a ambas etapas de turbina a `500 °C`; la humedad a salida de TBP no puede exceder `10 %`. Se pide presión de recalentamiento, calor de caldera y eficiencia.

**Paso 1 — Traducir humedad a calidad:** `humedad=10 %=0,10` → `x_salida=1−0,10=0,90`.

**Paso 2 — Estado final a 10 kPa**, con propiedades de referencia `s_f=0,6492`, `s_fg=7,4996`, `h_f=191,81`, `h_fg=2392,1`:

- `s_5=s_f+x s_fg=0,6492+0,90×7,4996=7,39884 kJ/(kg·K)`.
- `h_5=h_f+x h_fg=191,81+0,90×2392,1≈2344,7 kJ/kg`.

**Paso 3 — Recalentamiento:** si la TBP es ideal isentrópica, `s_4=s_5=7,39884`. A `T_4=500 °C`, la tabla de vapor sobrecalentado de referencia da valores cercanos a:

| `p` | `s` [kJ/(kg·K)] | `h` [kJ/kg] |
|---|---:|---:|
| 2,00 MPa | 7,4317 | 3467,6 |
| 2,50 MPa | 7,3234 | 3462,1 |

**Paso 4 — Interpolación visible:**

\[
\alpha=\frac{7{,}39884-7{,}4317}{7{,}3234-7{,}4317}\approx0{,}3034,
\]

\[
p_4\approx2{,}00+0{,}3034(2{,}50-2{,}00)=2{,}152\ \mathrm{MPa}.
\]

`h_4≈3467,6+0,3034(3462,1−3467,6)≈3465,9 kJ/kg`.

**Paso 5 — TAP:** a `9 MPa, 500 °C`, referencia `h_2≈3386,1`, `s_2≈6,6576`. Su salida a `p_3≈2,152 MPa` y `s_3=s_2` requiere consulta de vapor/mezcla según región; referencia del documento previo `h_3≈2989,0 kJ/kg`. La plataforma **no** debe presentar este dato como derivado si falta visualizar la búsqueda/interpolación correspondiente.

**Paso 6 — Bomba:** desde líquido saturado del condensador a 10 kPa; `v_f≈0,001010`; hasta `9000 kPa`, `w_B≈0,001010×(9000−10)≈9,08 kJ/kg`; `h_bomba,out≈200,89 kJ/kg`.

**Paso 7 — Calor total suministrado:**

`q_in=(3386,1−200,89)+(3465,9−2989,0)≈3662,1 kJ/kg`.  
`Q̇_in=25×3662,1≈91553 kW≈91,6 MW`.

**Paso 8 — Calor rechazado:** `q_out≈2344,7−191,81≈2152,9 kJ/kg`.

**Paso 9 — Eficiencia:** `η≈1−2152,9/3662,1≈41,2 %`.

**Paso 10 — Auditoría:** comprobar que `q_in−q_out≈w_neto` dentro de tolerancia de tablas, y que humedad final no supera 10 %. Si se modifica temperatura de recalentamiento o presión de caldera, volver a resolver por el motor, **no** conservar `2,152 MPa` fijo.

## 11.7. T09.05. Rankine regenerativo: calentadores abiertos y cerrados

### Calentador abierto CAA

Entra agua de alimentación a cierta presión y vapor extraído de la turbina a **la misma presión de mezcla**. Ambos caudales se mezclan directamente. Balance simple sin pérdidas al ambiente:

\[
\dot m_a+\dot m_b=\dot m_o,
\quad \dot m_a h_a+\dot m_b h_b=\dot m_o h_o.
\]

**Ejemplo pedagógico creado:** `ṁ_a=3 kg/s`, `h_a=200 kJ/kg`, `ṁ_b=1 kg/s`, `h_b=2600 kJ/kg`; `ṁ_o=4 kg/s`, `h_o=(3×200+1×2600)/4=800 kJ/kg`. Mostrar que la entalpía de salida es un promedio ponderado de entradas, **solo** bajo el modelo sin otras entradas de energía.

### Calentador cerrado CAC

Los dos fluidos intercambian calor **sin mezclarse**. Balance simplificado:

\[
\dot m_h(h_{h,in}-h_{h,out})=
\dot m_c(h_{c,out}-h_{c,in}).
\]

El vapor de extracción puede condensar y luego drenar hacia otra presión a través de una trampa o válvula idealizada isoentálpica `h_antes≈h_después`. Mantener dos circuitos diferenciados mediante colores, líneas y etiquetas, no solo posición de las flechas.

**Caso de aprendizaje:** pedir al estudiante identificar dónde sí se mezclan masas (CAA) y dónde no (CAC), antes de presentar el sistema lineal completo.

## 11.8. T09.06. Caso 4C — Rankine regenerativo de 250 MW, once estados

**Datos de cátedra MEC110_9, diapositivas 32–37:** potencia neta `250 MW`; entrada turbina `12,5 MPa`, `550 °C`; condensador `10 kPa`; extracción hacia CAC `0,8 MPa`; extracción hacia CAA `0,3 MPa`; once estados según diagrama original. En modo clase se usarán los números del circuito original, nunca una renumeración parcial sin leyenda.

### Diagrama de flujos exigido

```text
Caldera -> (8) -> TURBINA ----------------------------- (11) -> Condensador -> (1)
                    |               |                                     |
                    |(9) 0,8 MPa    |(10) 0,3 MPa                         v
                    v               |                                  Bomba P1
                [ CAC cerrado ]     |                                     |
                    |               v                                    (2)
                    |            [ CAA abierto ] <------------------------|
                    v               ^
               condensado (6)       |
                    |            drenaje (7)
             trampa isoentálpica ----|
                                    |
                              (3) -> Bomba P2 -> (4) -> CAC -> (5) -> Caldera
```

El esquema ASCII es solo orientación, no sustituye la topología exacta del dibujo de cátedra. Verificar dirección de todas las líneas y conexiones antes de codificar. El motor debe representar flujos en **grafo dirigido**, con continuidad de masa en cada nodo.

### Propiedades de referencia del documento original

| Estado | Descripción | Referencia relevante | Condición de uso |
|---|---|---|---|
| 1 | salida condensador | `h1≈191,83`, `v1≈0,001010` | líquido saturado, 10 kPa |
| 2 | después bomba P1 | `h2≈192,12` | `0,3 MPa` |
| 3 | salida CAA | `h3≈561,47`, `v3≈0,001073` | líquido saturado, 0,3 MPa |
| 4 | salida bomba P2 | **valor original `h4≈562,01` cuestionado** | recalcular `vΔp` |
| 5 | después de CAC | `h5≈721,11` | aproximación de salida a Tsat del lado caliente |
| 6 | condensado CAC | `h6≈721,11` | líquido saturado, 0,8 MPa |
| 7 | drenaje a CAA | `h7=h6≈721,11` | estrangulación |
| 8 | entrada turbina | `h8≈3475,2` | 12,5 MPa, 550 °C |
| 9 | extracción CAC | `h9≈2754,11` | 0,8 MPa, ideal isentrópica según referencia |
| 10 | extracción CAA | `h10≈2577,7` | 0,3 MPa |
| 11 | escape condensador | `h11≈2099,42` | 10 kPa |

**No corregir silenciosamente:** la especificación anterior mezcla `3475,2` y `3475,7` para el estado 8, y `2099,42` y `2099,13` para el estado 11 dentro de una misma formulación. El modo referencia debe indicar qué coeficientes usa exactamente; el modo físico obtiene todos los estados una sola vez desde su motor.

### Balances del circuito — formulación conceptual limpia

**Ecuación A, continuidad en turbina:**

\[
\dot m_8=\dot m_9+\dot m_{10}+\dot m_{11}.
\]

**Ecuación B, turbina y trabajo de bombas:**

\[
\dot m_8h_8-\dot m_9h_9-\dot m_{10}h_{10}-\dot m_{11}h_{11}
=\dot W_T,
\]

\[
\dot W_{neto}=\dot W_T-\dot W_{B1}-\dot W_{B2};
\quad \dot W_{B1}=\dot m_{11}(h_2-h_1),
\quad \dot W_{B2}=\dot m_8(h_4-h_3).
\]

**Ecuación C, energía del CAA:**

\[
\dot m_9h_7+\dot m_{10}h_{10}+\dot m_{11}h_2
=\dot m_8h_3.
\]

**Ecuación D, energía del CAC:**

\[
\dot m_9(h_9-h_6)=\dot m_8(h_5-h_4).
\]

Estas cuatro ecuaciones forman el sistema lineal, una vez que las propiedades `h` y los saltos de bomba están disponibles. Primero mostrar términos simbólicos, después coeficientes numéricos, matriz, vector y solución.

### Modo de referencia de la transcripción anterior

Para reproducir **exactamente el sistema escrito en el Markdown original**, se usa como banco de prueba de álgebra el siguiente conjunto de coeficientes, que **no queda automáticamente validado físicamente**:

\[
\begin{bmatrix}
1 & -1 & -1 & -1\\
3475.7 & -2754.11 & -2577.7 & -2099.13\\
561.47 & -721.11 & -2577.7 & -192.12\\
159.1 & -2033.0 & 0 & 0
\end{bmatrix}
\begin{bmatrix}\dot m_8\\\dot m_9\\\dot m_{10}\\\dot m_{11}\end{bmatrix}
=\begin{bmatrix}0\\250000\\0\\0\end{bmatrix}.
\]

Resolver por eliminación gaussiana con pivoteo, LU/QR o biblioteca numérica robusta; no codificar la respuesta en un objeto literal. Resultado de la **matriz anterior** con redondeo:

- `ṁ8≈198,488 kg/s`.
- `ṁ9≈15,533 kg/s`.
- `ṁ10≈27,287 kg/s`.
- `ṁ11≈155,668 kg/s`.

Al utilizar el calor de caldera `Q̇_in≈ṁ8(h8−h5)` con `h8=3475,2` y `h5=721,11` se obtiene el valor de referencia `η≈45,73 %`, **pero este cálculo hereda la incompatibilidad de valores indicada**.

### Modo de consistencia física — punto crítico

Si `v3=0,001073 m³/kg`, `p3=300 kPa`, `p4=12500 kPa`, entonces:

\[
w_{B2,s}\approx0{,}001073(12500-300)=13{,}0906\;\mathrm{kJ/kg},
\]

**no** `0,5365 kJ/kg`. Con `h3≈561,47`, se obtendría `h4≈574,56 kJ/kg` bajo la aproximación adoptada, no `562,01`. El balance del CAC y el trabajo neto cambian. Por tanto, **el simulador científico no debe usar la matriz de referencia sin advertencia ni devolver `45,7 %` como resultado físicamente verificado**.

El equipo de implementación debe cotejar las diapositivas 33–37 y las tablas originales, decidir si hay un error de transcripción, escala, numeración, presión o propiedad, y documentar la conciliación. El botón `Comparar modo cátedra / modo consistente` muestra:

- Por qué surge la diferencia en `w_B2`.
- Valores de `h4` y de los coeficientes de la ecuación D en ambos modos.
- Residuos `A·m−b` de cada conjunto.
- Diferencia relativa de flujos y rendimiento.
- Estado `pendiente de conciliación` si persiste discrepancia.

**Bloqueo inteligente:** si una combinación de datos entrega `ṁ<0`, balance de masa incompatible, temperaturas imposibles o sistema mal condicionado, explicar el problema en vez de forzar un número positivo.

## 11.9. T09.07. Cogeneración

Una planta puede aprovechar energía térmica útil en procesos industriales además de producir electricidad. La **eficiencia global de utilización energética** se expresa, bajo una frontera bien delimitada, como:

\[
\varepsilon_u=\frac{\dot W_{neto}+\dot Q_{util}}{\dot Q_{combustible,\,aportado}}.
\]

**Ejemplo pedagógico creado:** una planta recibe `100 MW` térmicos, produce `30 MW` eléctricos y suministra `45 MW` de calor útil a un proceso. `ε_u=(30+45)/100=75 %`. La eficiencia **eléctrica** sería `30 %`, no confundir ambos indicadores.

**Interacción:** interruptor «usar calor residual» modifica la energía aprovechada y el diagrama Sankey. Explicar que cogeneración necesita una demanda térmica real y condiciones de operación, no equivale a recuperar todo calor rechazado.

## 11.10. Ciclo binario mercurio–agua: contexto histórico y límites

La presentación MEC110_9 cierra con un ciclo binario ilustrativo de mercurio y agua. Es un ejemplo termodinámico histórico/conceptual: un ciclo superior a temperatura alta cede calor en un intercambiador a un ciclo inferior de agua. **No** presentarlo como recomendación de diseño industrial actual, debido a los graves peligros toxicológicos y ambientales del mercurio.

**Modelo seguro de aprendizaje:** dibujar dos circuitos **sin interacción material**, conectados por transferencia de calor `Q̇_intercambio`. Se conserva la energía transferida entre ambos lados con pérdidas opcionales; no se pretende recrear, operar ni diseñar físicamente una instalación de mercurio.

**Ejercicio conceptual:** si el ciclo superior rechaza `40 MW` en el intercambiador y hay pérdidas externas de `2 MW`, el inferior recibe `38 MW`. Si el inferior convierte `25 %` de ello en potencia, entrega `9,5 MW`. Declarar que es un cálculo didáctico con eficiencias impuestas.

---

# 12. BANCO DE EJEMPLOS, ACTIVIDADES Y CERTÁMENES

## 12.1. Principio de diseño del banco

La plataforma debe almacenar **problemas como datos** y **soluciones como funciones derivadas de un motor**, no como bloques de texto pegados que se vuelven falsos al modificar sliders. Una entrada de problema define modelo, datos, incógnitas, hipótesis, fuente, unidades, respuestas esperadas si están auditadas, pistas, pasos de la pizarra y tolerancias.

Cada problema tiene dos experiencias:

- **Modo aprendizaje:** desarrollo navegable, opciones «muéstrame por qué», ejemplo resuelto, variables visibles.
- **Modo certamen:** enunciado limpio, tabla/fórmulas disponibles si la evaluación así lo permite, cronómetro opcional, ingreso de resultados y unidades, pistas configurables, retroalimentación al terminar.

No es correcto entrenar solo memoria numérica: al reintentar un caso, proponer variantes que exijan decidir hipótesis y escoger relaciones válidas. Se debe poder bloquear un dato y pedir su justificación, o presentar un resultado potencialmente erróneo y solicitar revisión.

## 12.2. Matriz maestra de casos, con procedencia

**`C` = ejercicio/enunciado asociado a presentación de cátedra. `P` = ejemplo pedagógico original propuesto. `V` = cálculo que requiere validación adicional de propiedades.** La columna «respuesta» es un objetivo de prueba en las condiciones explícitas, no salida pegada a la interfaz.

| ID | Nivel | Origen | Problema y datos clave | Magnitud objetivo |
|---|---|---|---|---|
| P00-01 | Inicial | P | `2 kW` por `15 min` | `1800 kJ` |
| P00-02 | Inicial | P | `200 kPa` man., `p_atm=101,3` | `301,3 kPa` abs. |
| P01-01 | Inicial | P | Ciclo `QH=800`, `W=240` | `QL=560 kJ` |
| P02-01 | Inicial | P | `6 kg`, `3 m³` | `v=0,5 m³/kg` |
| P02-02 | Inicial | P | Aire ideal `200 kPa`,`0,5 m³`,`300 K` | `m≈1,1614 kg` |
| P02-03 | Intermedio | P | `hf=200`,`hfg=2400`,`x=0,25` | `h=800 kJ/kg` (tabla ficticia) |
| P02-04 | Inicial | P | `p1=100`, `T1=300`, `T2=450 K` a volumen constante | `p2=150 kPa` |
| C03-01 | Intermedio | C: MEC110_3 s12 | Expansión isotérmica `p1=500 kPa`,`V1=0,5 m³` | Trabajo; confirmar `V2` |
| P03-02 | Inicial | P | `p=150 kPa`, `0,2→0,5 m³` | `W=45 kJ` |
| P03-03 | Inicial | P | Aire rígido `m=2 kg`, `cv=0,718`, `300→400 K` | `Q=143,6 kJ` |
| P04-01 | Inicial | P | Turbina `h1=3200`,`h2=2700`, `ṁ=2` | `1 MW` |
| P04-02 | Intermedio | P | Tobera `Δh=50 kJ/kg`,`V1≈0` | `V2≈316,2 m/s` |
| C04-03 | Avanzado | C: MEC110_4 s9 | Planta vapor `35 kg/s`, bomba `350 HP` | Balances; importar estados completos |
| C04-04 | Avanzado | C: MEC110_4 s15 | Estrangulación R134a `800→140 kPa` | `ΔT`, `v2`; requiere propiedades de refrigerante |
| P05-01 | Inicial | P | Tanque `m1=2`, entran 5, salen 1 | `m2=6 kg` |
| P06-01 | Inicial | P | `N=2` moléculas | `P(n=1)=0,5` |
| P06-02 | Intermedio | P | `N=4` moléculas | `C(4,2)=6` |
| C06-03 | Avanzado | C: MEC110_6 s24 | Interacción `E+E'=13` | `Ω` máximo; validar tabla |
| P06-04 | Intermedio | P | Gas ideal `300→450 K`, `100→200 kPa` | `Δs≈0,2086 kJ/(kg·K)` |
| P06-05 | Intermedio | P | Turbina `h1=1000`,`h2s=700`,`η=0,85` | `h2a=745 kJ/kg` |
| C07-01 | Intermedio | C: MEC110_7 s7 | Carnot 3 centrales 1200/140/80 °C, sumidero 20 °C | `80,1/29,0/17,0 %` |
| C07-02 | Intermedio | C: MEC110_7 s12 | `QH=500`,`QL=200`,`TL=17 °C` | `TH≈725,375 K`,`η=60 %` |
| C07-03 | Intermedio | C: MEC110_7 s16 | Frigorífico 1/4 tiempo, 1200 kJ/h, COP 2,5 | `Ẇ_activo≈533 W` |
| C07-04 | Intermedio | C: MEC110_7 s16 | 5 sandías, 50 kg, 20→8 °C, 450 W, COP 4,5 | `t≈20,66 min` |
| C07-05 | Avanzado | C: MEC110_7 s17–18 | Hielo 12 kg/h, 15→−5 °C, COP 2,4 | `Ẇ≈565 W` |
| P08-01 | Intermedio | P | Compresión 100→900 kPa, dos etapas ideales | `pi=300 kPa` |
| C08-02 | Avanzado | C: MEC110_8 s19 | Brayton ideal 100→480 kPa, 20→880 °C | `η≈36,12 %` |
| C08-03 | Avanzado | C: MEC110_8 s19–20 | Brayton con `ηt=ηc=0,85` | `η≈23,92 %` |
| C08-04 | Avanzado | C: MEC110_8 s16–17 | `T3=1700 K`, `T1=473 K` | `rp*≈9,39` |
| P08-05 | Intermedio | P | Regenerador `T2=500`,`T4=800`,`ε=0,7` | `T5=710 K` |
| C09-01 | Avanzado | C: MEC110_9 s8 | Rankine ideal 300 MW, 10 MPa/500 °C, 10 kPa | `η≈40,2 %`,`ṁ≈235,2 kg/s` |
| C09-02 | Avanzado | C: MEC110_9 s10 | Mismo caso, `ηT=ηB=0,85` | `η≈34,1 %`,`ṁ≈277,6 kg/s` |
| C09-03 | Avanzado | C: MEC110_9 s18–20 | Rankine recalentamiento, 9 MPa, 500 °C, 10 kPa, `x≥0,9` | `precal≈2,152 MPa`,`η≈41,2 %` |
| C09-04 | Experto / auditoría | C: MEC110_9 s32–37 | Rankine 250 MW con CAA/CAC, once estados | Matriz 4×4, **inconsistencia bomba** |
| P09-05 | Inicial | P | Cogeneración 100 MW entrada, 30 eléctrico, 45 térmico | `εu=75 %` |
| P09-06 | Intermedio | P | Binario conceptual 40 MW transferidos, 2 pérdidas, 25 % de 38 | `9,5 MW` |

`V` aplica a todos los ejercicios con estado de vapor/refrigerante dependiente de tablas, incluso si se conoce una respuesta orientativa.

## 12.3. Formato de ficha de ejercicio completo

Cada objeto `exercise` tendrá estos campos pedagógicos obligatorios:

```yaml
id: C07-04
version: 1
subject: MEC110
lesson: T07.05
origin:
  type: lecture
  file: MEC110_7.ppt
  slides: [16]
  verification: statement-checked
status: numeric-checked-under-assumptions
level: intermediate
question: "¿Cuánto tardaría un refrigerador idealizado en enfriar cinco sandías?"
physicalSystem: "Alimentos tratados como agua; refrigerador de capacidad constante"
givens:
  - {key: fruitCount, value: 5, unit: '1'}
  - {key: massEach, value: 10, unit: 'kg'}
  - {key: tempInitial, value: 20, unit: 'degC'}
  - {key: tempFinal, value: 8, unit: 'degC'}
  - {key: electricPower, value: 450, unit: 'W'}
  - {key: cop, value: 4.5, unit: '1'}
  - {key: cp, value: 4.184, unit: 'kJ/(kg*K)'}
asks: [heatRemoved, coolingPower, elapsedTime]
assumptions: [constant_cop, constant_cooling_power, water_as_fruit, no_heat_leaks]
calculator: cooling-time-v1
solutionSteps: [findMass, findDeltaT, findHeat, findCoolingPower, findTime, check]
referenceOutputs:
  elapsedTime: {value: 1239.70, unit: s, toleranceRelative: 0.001}
commonMistakes: [W_to_kW, missing_cop, kg_per_fruit, Celsius_difference]
```

**Diseño:** los valores son numéricos tipados, las unidades tienen semántica, la fórmula se busca por identificador y las soluciones se recomputan. Los textos explicativos son editables por un docente sin modificar el solver.

## 12.4. Más desarrollos originales para «aprender haciendo»

### P-A. ¿Cuánto trabajo mueve una masa de agua en una bomba?

Agua líquida aproximada con `v=0,001 m³/kg` eleva su presión de `200` a `2200 kPa`; `η_B=0,75`; `ṁ=4 kg/s`.

**1.** `Δp=2200−200=2000 kPa`.  
**2.** Ideal: `w_s=vΔp=0,001×2000=2 kJ/kg`.  
**3.** Real: `w_a=w_s/η=2/0,75=2,6667 kJ/kg`.  
**4.** Potencia consumida `Ẇ_in=ṁ w_a=4×2,6667≈10,667 kW`.  
**5.** En revisión: potencia real supera potencia ideal, coherente con `η<1`.

### P-B. ¿Cómo leer una turbina con entalpías ya dadas?

Vapor de entrada `h1=3300 kJ/kg` y salida ideal `h2s=2500`. Rendimiento real `ηT=0,90`, caudal `ṁ=5 kg/s`.

**1.** Ideal: `w_s=3300−2500=800 kJ/kg`.  
**2.** Real: `w=0,90×800=720 kJ/kg`.  
**3.** Salida real: `h2a=3300−720=2580 kJ/kg`.  
**4.** Potencia real: `Ẇ=5×720=3600 kW=3,6 MW`.  
**5.** Verificar `2500<2580<3300`.

### P-C. ¿Cómo cambia el COP de un refrigerador?

`Q̇_L=6 kW`, `Ẇ_in=2 kW`. `COP_R=6/2=3`. Si la misma carga se extrae con `Ẇ_in=1,5 kW`, `COP_R=4`. **Nota física:** el segundo escenario requiere una máquina o condiciones distintas; no asegurar que es posible solo por ajustar un control a voluntad.

### P-D. ¿Cuánta energía necesita elevar temperatura de aire ideal?

`m=4 kg`, `cp=1,005`, calentamiento `300→550 K` a presión aproximadamente constante y condiciones apropiadas. `ΔH≈mcpΔT=4×1,005×250=1005 kJ`. Si el proceso ocurre en flujo estacionario sin trabajo de eje y sin variaciones mecánicas apreciables, puede representarse como `Q≈1005 kJ` por esa masa procesada.

### P-E. Ejercicio de detección de imposible

Un estudiante calcula `η_th=114 %` para una máquina térmica. El software **no** debe explicar cómo usar ese número como aceptable; debe solicitar revisar `QH`, `QL`, signos, conversiones y definición de trabajo. Para un motor cíclico de potencia con calor suministrado positivo y trabajo neto, `η_th>1` no es viable.

### P-F. Energía sensible más latente sin usar hielo

Un fluido hipotético tiene `c_l=2 kJ/(kg·K)`, calor latente `L=100 kJ/kg`, `c_vapor=1,2 kJ/(kg·K)`; masa 3 kg. Se calienta de `10 °C` a saturación `50 °C`, evapora totalmente y sobrecalienta hasta `70 °C`.

**Líquido:** `q_l=2×(50−10)=80 kJ/kg`.  
**Cambio de fase:** `q_lat=100 kJ/kg`.  
**Vapor:** `q_v=1,2×(70−50)=24 kJ/kg`.  
**Total:** `q=204 kJ/kg`; energía `Q=3×204=612 kJ`.  
**Aclaración:** parámetros hipotéticos para comprender el procedimiento, no propiedades de agua ni de refrigerante comercial.

## 12.5. Entrenamiento de certámenes por competencias

**Competencia A — Interpretar sistema:** identificar equipo, entradas, salidas y frontera.  
**Competencia B — Unidades/propiedades:** convertir y escoger tabla.  
**Competencia C — Seleccionar ecuación:** explicar descartes de términos.  
**Competencia D — Resolver:** operar con consistencia algebraica y dimensional.  
**Competencia E — Verificar:** límites físicos, balances, signos y resultados alternativos.

Cada intento almacena evidencias de estas cinco competencias, no únicamente un puntaje final. Los comentarios serán descriptivos: «Seleccionaste correctamente el balance, pero usaste h de líquido saturado a una presión distinta».

### Generación parametrizada responsable

Una plantilla de ejercicio tendrá rangos y restricciones: por ejemplo en Carnot `T_H>T_L>0 K`, en Brayton `T3>T2`, en Rankine puntos dentro de validez del proveedor de propiedades, y en refrigeración `COP>0`. El generador descarta configuraciones físicamente inconsistentes antes de mostrar preguntas. Mantener semilla para reproducir intento. Mostrar «variante original generada» y no atribuirla a la cátedra.

### Reglas de evaluación

- Comparar con tolerancia, no con igualdad exacta de cadenas.
- Permitir respuestas equivalentes como `0,4` y `40 %` cuando el tipo de respuesta es rendimiento y la unidad de entrada está explícita.
- Diferenciar error numérico de error conceptual. Aceptar redondeos razonables y explicar diferencia por tablas.
- Guardar pasos opcionales, nunca solo el resultado, si se quiere retroalimentación específica.
- Ofrecer reintento y revisión de pasos, sin limitar acceso a explicaciones detrás de una evaluación.

---

# 13. ESPECIFICACIÓN INTEGRAL DE SIMULADORES

## 13.1. Patrones compartidos de los cuatro laboratorios

**Layout de escritorio recomendado:** un contenedor con tres zonas lógicas:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ MEC110 / Termodinámica     Tema / Caso       Restaurar valores  [Ayuda] │
├──────────────────────────────┬───────────────────────────────────────────┤
│ ESCENA INDUSTRIAL INTERACTIVA│ DATOS Y CONTROLES                          │
│ cutaway, estados, flujos     │ variables, unidades, rangos y supuestos    │
│ [selección de equipo]        │                                           │
├──────────────────────────────┴───────────────────────────────────────────┤
│ DIAGRAMA T-s       │ DIAGRAMA P-v / P-h │ TABLA DE ESTADOS             │
├──────────────────────────────────────────────────────────────────────────┤
│ PIZARRA DEL PROFESOR  [1] [2] [3] ... [10]  [Explicar todo]             │
├──────────────────────────────────────────────────────────────────────────┤
│ AUDITORÍA: balances, fuente de propiedades, estado científico, versión  │
└──────────────────────────────────────────────────────────────────────────┘
```

En pantalla móvil, apilar: controles esenciales → escena → resultado resumido → gráficos con pestañas → pizarra → auditoría. La barra superior de asignatura debe seguir disponible; no forzar interacción horizontal ilegible para ver diagramas.

### Reglas de sincronización

Una modificación de slider actualiza primero **inputs canónicos**, después calcula el **estado termodinámico**, después deriva **resultados**, después renderiza **todos** los gráficos y pasos. No mantener temperaturas, entalpías y dibujos en estados React independientes que puedan desincronizarse. Si el cálculo falla, conservar los últimos datos válidos con sello «vista anterior» y explicar el fallo; no mostrar como actual una tabla vieja.

**Estados de simulación:** `idle`, `computing`, `ready`, `out-of-domain`, `scientifically-invalid`, `numeric-error`. Si el cálculo es pesado, usar Web Worker y debounce de inputs. La interacción visual no debe bloquear la lectura.

### Comportamiento de «Restaurar valores originales de cátedra»

El botón restaura parámetros, modelo, versión de propiedades y etiquetas del caso precargado; no borra notas del estudiante ni progreso global. Si hubo cambios, mostrar breve confirmación solo cuando se perderían datos de una variante sin guardar.

## 13.2. Simulador 1 — Laboratorio de Boltzmann y caja molecular

### Modos

**M1-A: caja dividida.** Selector N=2,4,40,200; tabique removible; vista partículas; evolución `n_izq/N`; distribución combinatoria.  
**M1-B: probabilidad exacta.** Histograma de `P(n)` y tabla `C(N,n)`; selector de probabilidad puntual/acumulada; para N grande cálculo por logaritmos.  
**M1-C: sistemas en contacto térmico.** Tabla `Ω_A(E)Ω_B(E_tot−E)`, máximo y `S_A+S_B`; incluir versión de cátedra E_total=13 cuando se verifique tabla.  
**M1-D: entropía macroscópica.** Comparador de procesos reversible/irreversible, balance `Sgen` y pregunta «¿qué ocurre si aislamos el sistema?».

### Controles y lecturas

- `N` número de partículas; en modo probabilístico sin límites visuales, aceptar valores mucho mayores utilizando cálculo estable.
- `n_inicial`, tasa de actualización gráfica, semilla aleatoria y botón «reiniciar experimento».
- `mostrar_identidades` para N pequeño; opcional desactivar para N=40/200.
- Tablero de resultados: `E[n]`, `σ_n`, `P(n=N/2)`, `logΩ`.
- Accesibilidad: gráfico de barras con tabla equivalente de probabilidades; narración textual de fluctuaciones.

### Pizarra: diez etapas

1. Definir N y `n`.
2. Explicar qué cuenta un microestado en este modelo.
3. Calcular `2^N` posibilidades.
4. Mostrar `N!/(n!(N−n)!)`.
5. Resolver `C(N,n)` sin desbordamiento.
6. Normalizar por `2^N`.
7. Construir tabla e histograma.
8. Calcular media y dispersión.
9. Comparar una fluctuación extrema con el valor más probable.
10. Traducir el resultado a interpretación de equilibrio/entropía, con límites de analogía.

**Prueba de regresión:** para N=4, el histograma debe ser `[1,4,6,4,1]/16`. Para N=2, `[1,2,1]/4`. La suma de probabilidades es 1 dentro de tolerancia.

## 13.3. Simulador 2 — Carnot, refrigeradores y máquina de hielo

### Modos y escenarios

**M2-A: máquina térmica.** Controles `Q_H`, `Q_L`, `T_H`, `T_L`, modelo reversible/general. Al elegir Carnot, imponer relaciones consistentes o resolver la incógnita; no permitir a la vez valores que se contradigan sin advertencia. Precargas de tres centrales y 500/200 kJ a 17 °C.

**M2-B: refrigerador doméstico.** `COP`, extracción promedio, fracción activa, potencia en funcionamiento y promedio. Precarga `1200 kJ/h`, `25 %`, `COP 2,5`.

**M2-C: enfriamiento de sandías.** Controles `n`, `m_fruta`, `T_inicial`, `T_final`, `c`, `potencia`, `COP`, pérdidas de calor opcionales; gráfico T(t) idealizado. Precarga `5×10 kg`, `20→8 °C`, `450 W`, `COP 4,5`.

**M2-D: hielo sensible/latente.** `ṁ_agua`, `T_in`, `T_out`, `c_agua`, calor latente, `c_hielo`, COP. Gráfico de tres tramos con puntos A–E según la convención visual del diseño; precarga `12 kg/h` y `15→−5 °C`.

### Visualización avanzada

- **Carnot:** dos reservorios de temperatura, cuatro procesos, flechas de energía y trabajo; el área bajo el tramo reversible en T-s debe corresponder a calor según el modelo.
- **Frigorífico:** compresor, condensador, válvula, evaporador; modo energético con `h` dados o propiedades de refrigerante reales si se dispone de motor certificado.
- **Hielo:** mostrar solidificación con cambio de fase a temperatura constante en condiciones aproximadas; la cantidad de líquido/hielo cambia gradualmente.
- **Comparador:** `η_Carnot`, `COP`, `Q̇`, `Ẇ` no comparten escala sin explicación. Evitar barras engañosas por mezclar magnitudes distintas.

### Pizarra: secuencia dinámica

1. Identificar objetivo: potencia de salida o transporte de calor.
2. Delimitar frontera y convención de signos.
3. Convertir temperaturas a Kelvin cuando corresponde.
4. Convertir energía/tiempo a potencia.
5. Dibujar flujo térmico neto.
6. Elegir `η` o `COP` apropiado.
7. Calcular energía transferida / sensible / latente.
8. Resolver incógnita con unidades.
9. Verificar primera/segunda ley o desigualdad de Carnot.
10. Interpretar y señalar hipótesis no realistas.

**Pruebas mínimas:** 500/200 kJ produce 60 %; refrigerador intermitente 533 W; sandías 20,66 min; máquina de hielo 565 W, con tolerancias publicadas.

## 13.4. Simulador 3 — Turbina de gas Brayton

### Modos

**M3-A:** Brayton simple ideal y real; caso `100→480 kPa`, `20→880 °C`.

**M3-B:** tabla de sensibilidad con `η_t` y `η_c` independientes; comparación de 100, 85, 80, 75, 70, 65 %; la tabla se recalcula y se muestra fórmula detrás de cada celda.

**M3-C:** optimizador de razón de presión con `T1=473 K`, `T3=1700 K`; presentar curva `w_neto`, `η` y razón de trabajo de retroceso. Línea vertical marca óptimo teórico y razón actual.

**M3-D:** dos etapas con interenfriamiento y presión intermedia; comparar `p_i` variable con `√(p1p2)` bajo supuestos.

**M3-E:** regeneración con eficacia `ε_reg`; validar `T4>T2` y pérdidas/eficiencias.

**M3-F:** diez estados, interenfriamiento+recalentamiento+regeneración, con subcircuitos activables y balances por componente.

### Vista industrial

Compresor de álabes en cutaway, cámara de adición térmica, turbina, ductos, dos intercambiadores si se activa complejidad avanzada; animación de dirección de flujo por flechas y gradiente térmico. Etiquetas `P`,`T`,`h`,`s` según modelo. Si se renderiza una geometría de motor, no afirmar que fue resuelta con CFD sin el solver correspondiente.

### Dos gráficos sincronizados

**T-s:** procesos idealizados de compresión/expansión, caminos reales con aumento de entropía, isóbaras de aporte/rechazo de calor.  
**P-v:** ciclo aire-estándar, presiones de cada estado y segmentos; advertencia «curvas ideales» si se usan aproximaciones de `cp` constante y gas ideal.

### Pizarra: doce etapas

1. Datos, modelo de aire y dominio.
2. `p`,`T` en SI y cálculo de `r_p`.
3. Cálculo de `a=(k−1)/k`.
4. Estado `2s`.
5. Estado `4s`.
6. Corrección de compresor por `η_c`.
7. Corrección de turbina por `η_t`.
8. Tabla completa estados 1,2,3,4 y opcionales.
9. Trabajos y calor en cada equipo.
10. `w_neto`, retroceso, eficiencia.
11. Balance energético y restricción termodinámica.
12. Comparación con referencia y explicación de sensibilidad/óptimo.

**Prueba física:** modificar `η_c` de 1 a 0,8 manteniendo el resto aumenta `T2a` y el trabajo consumido. Modificar `η_t` de 1 a 0,8 aumenta `T4a` y reduce trabajo entregado.

## 13.5. Simulador 4 — Planta de vapor Rankine

### Modos

**M4-A:** simple ideal: 300 MW, 10 MPa, 500 °C, 10 kPa.  
**M4-B:** mismo caso real `η_T=η_B=0,85`, comparador de tablas.  
**M4-C:** recalentamiento: 9 MPa, 500 °C, 10 kPa, `ṁ=25`, restricción `x_salida≥0,90`, interpolación de presión.  
**M4-D:** regeneración de 250 MW con CAC/CAA, once estados, matriz 4×4, **dos modos de referencia/consistencia física**.  
**M4-E:** explorador de mejora de eficiencia con presión de condensador, presión de caldera y temperatura máxima.  
**M4-F:** cogeneración (modo energético) y ciclo binario histórico ilustrativo.

### Gráficos y capas de datos

**T-s** con campana calculada según proveedor de propiedades en el dominio válido: trazar líneas de saturación por muestras termodinámicas reales, no curvas decorativas. Los estados 1 a 11 deben posicionarse mediante propiedades `(T,s)` del mismo motor.  
**P-v:** escala logarítmica opcional para cubrir magnitudes muy diferentes de líquido y vapor, con aviso del cambio de escala.  
**h-s / Mollier:** útil para inspeccionar entalpía de expansiones ideales y reales.  
**Sankey energético:** calor suministrado, rechazado, trabajos; con flujo real en kW si existe `ṁ`.

### Callouts por estado

Ejemplo `Estado 8 · Entrada turbina`:

```text
P = 12,5 MPa
T = 550 °C
h = 3475,2 kJ/kg  [referencia; pendiente cotejo con proveedor]
s = 6,629 kJ/(kg·K) [referencia]
fase = vapor sobrecalentado
ṁ = 198,5 kg/s  [solo modo de referencia; no fijar en modo físico]
```

No mostrar calidad `x` en vapor sobrecalentado. Las tarjetas se desplazan o colapsan cuando ocultan componentes; cada punto tiene foco de teclado, etiqueta textual y acceso a tabla.

### Pizarra: hasta catorce etapas, no límite artificial de diez

1. Detectar topología: simple, recalentamiento o regeneración.
2. Identificar variables conocidas y desconocidas.
3. Elegir presiones de cada estado.
4. Determinar región de fase de agua/vapor.
5. Buscar/interpolar propiedades, mostrando fuente.
6. Calcular salidas ideales isentrópicas.
7. Aplicar eficiencias de equipos reales.
8. Calcular trabajo de bomba y caudal que lo atraviesa.
9. Calcular trabajo de turbina por ramal/extracción.
10. Calcular aportes de caldera/recalentador y rechazo.
11. Plantear balances de mezclador/calentadores.
12. Montar sistema lineal, resolver y revisar condición numérica.
13. Obtener `η`,`ṁ`,`x` y variables objetivo.
14. Verificar residuos, segunda ley, discrepancias de fuentes y respuesta final.

### Función especial «Rastrea un kilogramo de vapor»

En ciclos regenerativos, el usuario elige seguir una base de cálculo de `1 kg` que entra a turbina. La escena muestra fracciones `y,z` extraídas y cuánto sigue al condensador. Los cálculos por caudal másico deben poder alternar entre `kg/s` y fracciones de masa sin perder conservación. Ejemplo: `ṁ9/ṁ8≈0,0783`, `ṁ10/ṁ8≈0,1375`, `ṁ11/ṁ8≈0,7842` **en modo de referencia**.

## 13.6. Panel de auditoría científica en todos los simuladores

Una franja discreta y desplegable incluye:

- Modelo: `ideal-gas-cp-constant`, `ideal-gas-variable-cp`, `water-IF97`, `pedagogical-input-enthalpies`.
- Sustancia y versión del proveedor de propiedades.
- Temperaturas, presiones y unidades internas usadas.
- Hipótesis activas: adiabático, estacionario, cambios cinéticos despreciables, ausencia de pérdidas de presión, etc.
- Residuos de masa, energía y (cuando aplique) desigualdad de entropía.
- Estado de validación y comparación con caso original.
- Descargar tabla/solución, registrar semillas y parámetros para reproducibilidad.

**Regla:** un rótulo verde de «resultado verificado» solo se enciende si el estado científico cumple tests; un gráfico bonito jamás equivale a validación.

---

# 14. MOTOR TERMODINÁMICO Y TRAZABILIDAD NUMÉRICA

## 14.1. Separar cálculo físico, contenido y presentación

El motor no debe depender de React, Canvas ni del estilo visual. Debe ser una biblioteca de funciones puras, con tipos de unidad, ecuaciones documentadas, proveedores de propiedades, tests y resultados con metadatos. Los componentes visuales leen estados calculados; no implementan fórmulas repetidas.

```text
UI inputs ─► normalización de unidades ─► validación de dominio
  ─► identificación de fase / proveedor termodinámico
  ─► solución de estados y ecuaciones del ciclo
  ─► residuos y auditoría científica
  ─► modelo de resultados (serializable)
       ├─ escena y callouts
       ├─ T-s / P-v / P-h
       ├─ tabla de estados
       ├─ tarjetas de métricas
       └─ pizarra con expresiones y pasos derivados
```

## 14.2. Proveedores de propiedades explícitos

**P0 — Modelo pedagógico de aire con `cp`,`cv` constantes.** Implementación directa, rápida y fácil de auditar. Limitación publicada: la aproximación se degrada a temperaturas elevadas; no vender como precisión industrial.

**P1 — Aire con calores específicos variables `cp(T)`.** Requiere correlaciones verificadas y coherencia de referencias de entalpía/entropía; las relaciones `T2/T1=r_p^a` con `k` constante dejan de ser exactas.

**P2 — Agua/vapor por IAPWS-IF97.** Preferir biblioteca contrastada, con versión y licencia comprobadas, o implementación propia de formulación oficial con baterías de referencia. IF97 es una formulación industrial internacional para propiedades de agua y vapor. Referencia oficial: https://iapws.org/technical-guidance/release/IF97-Rev . Una opción técnica de biblioteca es CoolProp/IF97, siempre verificando integración, licencia y unidades reales de API: https://coolprop.org/fluid_properties/IF97.html .

**P3 — Refrigerantes.** Requiere biblioteca que soporte sustancia y región; no utilizar tablas de agua por sustitución. Ejemplos tipo R134a se habilitan solo cuando exista proveedor válido, con política de versionado y compatibilidad.

**P4 — Modo propiedades proporcionadas.** Si el problema entrega valores `h`,`s`,`v`, permitir resolver balances con esos datos sin consulta externa. Debe etiquetarse como «datos impuestos por ejercicio» y realizar auditoría donde existan relaciones suficientes.

## 14.3. Contrato mínimo de proveedor

```typescript
export type Phase =
  | 'compressed-liquid' | 'saturated-liquid' | 'two-phase'
  | 'saturated-vapor' | 'superheated-vapor'
  | 'supercritical' | 'unknown';

export type Provenance = {
  provider: string;
  version: string;
  reference?: string;
  approximation?: string;
};

export type ThermoState = {
  pPa: number;           // presión absoluta SI
  TK: number;            // Kelvin
  hJkg: number;          // J/kg
  uJkg: number;          // J/kg
  sJkgK: number;         // J/(kg K)
  vM3kg: number;         // m3/kg
  phase: Phase;
  quality: number | null; // solo 0 <= x <= 1 si estado saturado
  provenance: Provenance;
};

export interface PropertyProvider {
  id: string;
  solvePT(fluid: string, pPa: number, TK: number): ThermoState;
  solvePS(fluid: string, pPa: number, sJkgK: number): ThermoState;
  solvePH(fluid: string, pPa: number, hJkg: number): ThermoState;
  saturationP(fluid: string, pPa: number): {
    liquid: ThermoState; vapor: ThermoState;
  };
  validateDomain(fluid: string, inputs: Record<string, number>): void;
}
```

**Precaución técnica:** `(P,T)` no identifica unívocamente la calidad dentro del domo de saturación. `solvePT` debe devolver resultado con ambigüedad tipada o exigir una propiedad adicional, no elegir `x=0,5` por defecto. El tipo real debe modelar `Result<T,DomainError>` con códigos de error.

## 14.4. Convenciones numéricas y unidades

- Motor interno preferentemente en SI base: `Pa`, `K`, `J/kg`, `J/(kg·K)`, `kg/s`, `m³/kg`, `W`.
- Capa de presentación adapta a `kPa`, `MPa`, `°C`, `kJ/kg`, `kW`, `MW` y separador decimal local.
- Cálculos de `v[km³/kg]` no tienen sentido: tipo y formato deben impedir unidades inválidas; evitar conversiones implícitas.
- Las conversiones se realizan **una sola vez al ingresar** y **una sola vez al presentar**, no en cada subcomponente.
- Definir constantes centralizadas: `KELVIN_OFFSET=273.15`, `AIR_R=287 J/(kg·K)` para modelo básico, etc. Las tablas y correlaciones llevan su propia fuente.
- Mantener precisión completa en el cálculo; redondear únicamente al mostrar. Preservar cifras significativas y tolerancias por fuente.

## 14.5. Algoritmo de equilibrio y combinatoria

Para `C(N,n)`, implementar cálculo estable por `logGamma` o recurrencias, no factorial tradicional cuando N supera magnitudes pequeñas. Para probabilidades normalizadas, utilizar log-sum-exp si procede; en `N=200` la función debe seguir siendo finita. Una semilla de generación aleatoria permite reproducibilidad.

Para `Ω_A(E)Ω_B(E_tot−E)`, trabajar con logaritmos evita desbordamiento. Antes de calcular normalizaciones, validar que multiplicidades sean positivas y rangos energéticos físicamente accesibles.

## 14.6. Algoritmo de estados de ciclo Rankine

```text
solveRankine(case, propertyProvider):
  1. validar presiones (p_alta > p_cond > 0), temperaturas y dominio del fluido
  2. resolver líquido de salida de condensador
  3. resolver bomba ideal y corrección real según η_B
  4. resolver entrada turbina en (p,T) o (p,h/s) según caso
  5. resolver salida isentrópica a presión final mediante (p,s)
  6. calcular h_real_out por eficiencia isentrópica si aplica
  7. resolver fase de salida real mediante (p,h)
  8. para reheat, resolver estado intermedio y segunda expansión
  9. para regeneración, crear grafo de caudales y balances por equipo
 10. calcular W_turbinas, W_bombas, Q_caldera, Q_condensador
 11. resolver caudal total desde potencia si falta
 12. comprobar igualdad Q_in-Q_out = W_neto en frontera completa
 13. calcular residuos y desigualdades de segunda ley cuando las fronteras térmicas están definidas
 14. devolver estados completos, pasos, procedencia y validación
```

**Reglas por fase:** `x` devuelto por proveedor solo en mezcla/estados límite de saturación; si `p,s` da vapor sobrecalentado, no intentar `x=(s−sf)/sfg` fuera de `[0,1]` y mostrar `x=null`.

## 14.7. Solver del sistema 4×4

Usar una biblioteca con estabilidad numérica: LU con pivoteo parcial, QR o solver confiable equivalente. Calcular rango, escala de coeficientes, número de condición si está disponible, y residuos. Evitar implementar una inversión explícita `A^{-1}` como estrategia de producción.

**Pseudoflujo:** `buildEquations(states, topology) → A,b → scaleRows → solve → checkMassFlow → computeResiduals → auditThermo`.

**Criterio de aceptación:** `||A x−b||∞` debe estar por debajo de tolerancia relativa definida respecto de escalas de cada ecuación, no una tolerancia absoluta única para términos de 250000 kW versus balances de masa de 200 kg/s.

**Prueba matemática independiente:** para la matriz transcrita en §11.8, la solución debe coincidir con `[198,488;15,533;27,287;155,668]` dentro de tolerancia de cálculo. Esto verifica **álgebra**, no exactitud física de los coeficientes.

## 14.8. Balance de energía y control científico

Cada equipo devuelve un objeto `balance` con cantidades de entrada/salida, flujo de energía por masa, calor, trabajo, acumulación y residuo. Por ejemplo, una turbina estacionaria adiabática idealizada debe satisfacer `ṁh_in≈ṁh_out+Ẇ_out` cuando se desprecia energía mecánica. Un `residuo=15 MW` no puede convertirse en `0` por formateo.

La entropía se audita cuando las condiciones de frontera (incluidas temperaturas de transferencia de calor) son conocidas. No inventar `Sgen` a partir de una temperatura no especificada. Mostrar «no evaluable con datos disponibles» cuando sea necesario.

## 14.9. Test de referencia de propiedades

Preparar un conjunto versionado de referencias de agua/vapor: líquido saturado, vapor saturado, mezcla con `0<x<1`, sobrecalentado, líquido comprimido, límites de región y situaciones de ciclo (10 kPa, 0,3 MPa, 0,8 MPa, 9 MPa, 10 MPa, 12,5 MPa; `500` y `550 °C`). **Los valores de aceptación deben obtenerse de un proveedor oficial o tabla con edición identificada**, no del Markdown previo como única verdad.

**Criterios:** dominio explícito; errores tipados; comparabilidad de unidades; ausencia de discontinuidad espuria al cruzar regiones; campana T-s trazada con propiedades reales; tolerancias acordes a fuente y aproximación. Documentar precisión esperada, no prometer exactitud absoluta.

---


# 15. DISEÑO DE INTERFAZ, INTERACCIONES Y ACCESIBILIDAD

## 15.1. Sistema visual profesional

Diseñar una aplicación de ingeniería, no una colección de tarjetas genéricas. Fondo base `#0A1120`, superficies `#101B2D` y `#17263B`, líneas `#26364A`, texto principal `#F2F6FC`, secundario `#A9B9CA`; azul `#54A8FF` para control, ámbar `#F4B860` para energía/calor y turquesa `#42D9C0` para validaciones. Rojo `#F87171` reservado a advertencias reales. Colores térmicos con leyenda cuantitativa y rango visible: nunca representar una temperatura arbitraria como si proviniera de CFD real.

Tipografía de interfaz Inter o equivalente; matemática KaTeX; números tabulares monoespaciados. Diseño escritorio 1440 px: barra superior, navegación lateral de unidades, área de simulación central y pizarra lateral ajustable. En móvil: pestañas accesibles y gráficos desplazables sin perder unidades. Densidad informativa equilibrada: encabezados breves, datos clave visibles, explicación desplegable. Transiciones 150–250 ms, respetando `prefers-reduced-motion`.

## 15.2. Pantallas obligatorias

- Inicio: mapa de aprendizaje, progreso local, última lección y acceso a simuladores.
- Cátedra: objetivo, intuición física, prerequisitos, visualización, ejemplo guiado, errores frecuentes, autoevaluación.
- Simuladores: diagrama del equipo, estados, sliders, tablas, T-s y P-v, pizarra, balance de energía, exportación.
- Ejercicios: filtros por unidad/dificultad/procedencia, intento propio, pistas graduadas, resolución auditada.
- Tablas de propiedades: buscador por sustancia y par de variables, fase, interpolación visible, procedencia, incertidumbre de redondeo.
- Glosario y conversor SI: buscador con ejemplos, distinción entre magnitudes intensivas y extensivas.
- Panel de calidad: hipótesis activas, proveedor de propiedades, tolerancias, residuos, versión de modelo.

## 15.3. Accesibilidad

WCAG 2.2 AA como objetivo; navegación íntegra con teclado, focos visibles, textos alternativos, gráficos con tabla de datos equivalente, tooltips activables por foco y toque, contraste de texto comprobado, no depender solo del color, controles con etiquetas y unidades, opción pausar animación. Para moléculas, ofrecer conteo y tabla de probabilidades sin movimiento. Para curvas, ofrecer descripción de tendencia y valores de puntos seleccionados.

# 16. ARQUITECTURA TÉCNICA, CONTRATOS Y SEGURIDAD

Arquitectura sugerida (adaptar al repositorio existente, sin reescribirlo): React + TypeScript + Vite/Next según base actual; rutas lazy-loaded; Canvas 2D para moléculas; SVG/D3 o Plotly para gráficos científicos; Three.js solo si la geometría 3D añade valor; KaTeX para fórmulas; Zod para validación; Vitest + Playwright para pruebas; Web Workers para barridos y simulación. La elección de librerías debe justificar mantenimiento, licencia, peso y compatibilidad con el proyecto existente.

Separar paquetes: `core/thermo` (física pura), `core/units`, `core/properties`, `content/mec110`, `features/thermo/lessons`, `features/thermo/simulators`, `features/thermo/exercises`, `ui/charts`, `ui/cutaway`, `ui/stepboard`, `quality/reference-cases`. Los módulos de fluidos se mantienen aislados; no alterar API pública sin adaptador y pruebas de regresión.

No implementar autenticación casera en la Parte 2. Definir interfaces futuras (`AuthProvider`, `UserProgressRepository`, `RolePolicy`) y dejar la administración para la Parte 3. No almacenar contraseñas en texto plano ni en localStorage; si se habilitan cuentas, usar proveedor de identidad confiable, contraseñas con hash seguro del lado servidor, sesiones protegidas, control de acceso por recurso y auditoría de acciones sensibles. El contenido de aprendizaje debe poder funcionar en modo invitado.

# 17. MODELOS DE DATOS, CONTENIDO Y APIs

```ts
type Provenance = {kind:'lecture'|'book-reference'|'original'; title:string; chapter?:string; section?:string; slide?:number; verified:boolean};
type ThermoState = {id:string; p_kPa:number; T_K:number; h_kJkg?:number; s_kJkgK?:number; v_m3kg?:number; x?:number|null; phase?:'compressed-liquid'|'saturated-liquid'|'mixture'|'saturated-vapor'|'superheated-vapor'; source:string};
type Lesson = {id:string; unit:string; title:string; prerequisites:string[]; physicalIntuition:string; concepts:string[]; equations:string[]; workedExamples:string[]; misconceptionChecks:string[]; provenance:Provenance[]};
type SolvedStep = {id:string; purpose:string; equationLatex:string; substitutions:{symbol:string; value:number; unit:string}[]; result:number; unit:string; assumptions:string[]; validation?:string};
type SimulationCase = {id:string; title:string; mode:string; baseline:Record<string,number>; bounds:Record<string,[number,number]>; states:ThermoState[]; steps:SolvedStep[]; provenance:Provenance[]; validationStatus:'verified'|'pending'|'invalid'};
```

El contenido educativo se define en archivos versionados, no en JSX monolítico. `solve(case, inputs, provider)` devuelve resultados físicos, estados, advertencias y pasos matemáticos; `render` solo presenta. Prohibido mantener resultados precalculados mientras los sliders modifican los datos. Los cálculos son deterministas y tienen pruebas con casos de referencia.

# 18. PRUEBAS, CRITERIOS DE ACEPTACIÓN Y VALIDACIÓN

| Área | Prueba mínima | Criterio |
|---|---|---|
| Regresión MEC120 | Navegación, ejemplos, simuladores y estados previos | Sin roturas ni cambios de resultados |
| Física | Conservación de masa y energía en cada equipo | Residuo dentro de tolerancia documentada |
| Segunda ley | `Sgen >= 0` para procesos pasivos físicamente válidos | No mostrar procesos imposibles como válidos |
| Propiedades | Estados de agua en regiones saturada, bifásica y sobrecalentada | Concordancia con referencia versionada |
| Matemática | Interpolación lineal, conversiones, logaritmos, combinatoria | Valores y unidades comprobados |
| Ciclos | Carnot, refrigeración, Brayton, Rankine | Resultados recalculados tras cada cambio |
| Interfaz | Navegación teclado y lector de pantalla | Operación esencial sin ratón |
| Resiliencia | Entradas no físicas, proveedor ausente, división por cero | Error explicativo; no `NaN` silencioso |
| Rendimiento | 40–200 moléculas, gráficas y controles | Interacción fluida en equipo corriente |
| Seguridad | Rutas y persistencia sin credenciales | Ninguna contraseña ni secreto en cliente |

Cada caso de cátedra debe tener ficha `input → supuestos → método → referencia → resultado esperado → tolerancia → estado de verificación`. Cuando la fuente de propiedades no reproduzca exactamente el resultado redondeado de la diapositiva, mostrar ambos y explicar la diferencia; nunca forzar un número. Para casos Rankine, verificar la región antes de calcular calidad. Para Carnot, exigir temperaturas absolutas. Para compresión, distinguir trabajo específico de potencia. Para refrigeración, distinguir kJ/h de kW y factor de operación.

# 19. PLAN DE ENTREGA INCREMENTAL Y DEFINICIÓN DE TERMINADO

**Entrega A — base funcional:** auditoría de repositorio, navegación integrada sin romper MEC120, conversor, glosario, cátedra de unidades 1–2, motor de gas ideal y 10 ejemplos básicos con tests. **Entrega B — segunda ley:** unidades 3–4, caja molecular, Carnot, refrigeración, pizarra y evaluaciones. **Entrega C — Brayton:** compresión, eficiencia isentrópica, regeneración, optimizador y casos de cátedra. **Entrega D — Rankine:** proveedor de agua validado, ciclos ideal/real/recalentado/regenerativo y solver 4×4. **Entrega E — calidad:** accesibilidad, pruebas de regresión, exportación, documentación y auditoría científica.

No declarar «completo» si solo hay mockups. Cada entrega exige navegación real, cálculos reactivos, explicación de pasos, pruebas, estados de error, documentación de hipótesis y demostración reproducible.

# 20. INTEGRACIÓN BIBLIOGRÁFICA VERIFICADA — ÇENGEL Y BOLES, SÉPTIMA EDICIÓN

**Referencia identificada en PDF aportado:** Yunus A. Çengel y Michael A. Boles, *Termodinámica*, séptima edición, McGraw-Hill/Interamericana, 2012, ISBN 978-607-15-0743-3. El índice de contenidos del ejemplar identifica las siguientes correspondencias. Los números a continuación son **páginas impresas del libro**, no necesariamente páginas del visor PDF (el archivo tiene preliminares).

| Materia de la plataforma | Sección del libro | Página impresa de inicio | Uso pedagógico permitido |
|---|---|---:|---|
| Sistemas, propiedades, estados, presión, técnica de problemas | Cap. 1, §§1-3 a 1-12 | 10–33 | Introducción, mapa de variables y método de 7 pasos |
| Calor, trabajo, primera ley, eficiencia | Cap. 2, §§2-3 a 2-7 | 60–78 | Comparación conceptual y balances originales |
| Sustancias puras, tablas, fase y calidad | Cap. 3, §§3-2 a 3-6 | 112–137 | Identificación de región y lectura guiada de tablas |
| Sistemas cerrados, gases ideales, calor específico | Cap. 4, §§4-1 a 4-5 | 166–189 | Ejercicios originales de cilindro-pistón y calentamiento |
| Conservación de masa y equipos de flujo | Cap. 5, §§5-1 a 5-4 | 220–233 | Turbina, bomba, válvula y mezclador |
| Segunda ley, Carnot y refrigeradores | Cap. 6, §§6-1 a 6-11 | 280–308 | Laboratorio de depósitos y límite reversible |
| Entropía, Tds, eficiencia isentrópica y balance | Cap. 7, §§7-1 a 7-13 | 332–377 | Pizarra con hipótesis y balance entrópico |
| Exergía (ampliación optativa) | Cap. 8, §§8-1 a 8-8 | 428–460 | Interpretar destrucción de potencial de trabajo |
| Brayton, regeneración, interenfriamiento | Cap. 9, §§9-8 a 9-10 | 511–521 | Comparador de ciclos de gas |
| Rankine, recalentamiento, regeneración, cogeneración | Cap. 10, §§10-2 a 10-9 | 561–591 | Modelos de planta de vapor y extracción |
| Refrigeración por compresión de vapor | Cap. 11, §§11-1 a 11-5 | 616–624 | Diagrama y COP |
| Tablas SI de agua y vapor | Apéndice 1, A-4, A-5, A-6, A-7 | 914, 916, 918, 922 | Validación manual y orientación para búsqueda de propiedades |
| Propiedades de gas ideal del aire | Apéndice 1, A-17 | 934 | Comparación de `cp` constante y variable |

**Política editorial:** explicar conceptos con redacción propia; citar capítulo y sección; construir ejercicios numéricos originales y reconocer la inspiración temática. No copiar enunciados, tablas completas, ilustraciones ni soluciones extensas del libro. La aplicación no debe distribuir el PDF ni asumir licencia de reproducción. Para cálculos en producción, preferir implementación IAPWS-IF97 o tablas de propiedades licenciadas y contrastadas; citar versión y tolerancias.

## 20.1. Laboratorios complementarios originales inspirados en el temario del libro

**B01 — Distinguir calor de temperatura:** calentar 2 kg de agua de 20 °C a 35 °C, con `c=4,18 kJ/(kg·K)`. `Q=2×4,18×15=125,4 kJ`. Explicar que calor es energía transferida, no una propiedad almacenada. Incluir deslizador de masa y gráfico Q–ΔT.

**B02 — Gas ideal desde cero:** aire con `m=0,5 kg`, `T=300 K`, `p=100 kPa`, `R=0,287 kPa·m³/(kg·K)`. `V=mRT/p=0,4305 m³`. Desglosar cancelación de unidades. Advertir que la presión debe ser absoluta.

**B03 — Sistema cerrado, primer principio:** cilindro recibe `Q=90 kJ` y entrega `W=35 kJ`; despreciar energías cinética/potencial. `ΔU=Q−W=55 kJ`. Permitir cambiar convención de signos solo si se reformula toda la ecuación.

**B04 — Tobera adiabática idealizada:** aire entra a `h1=320 kJ/kg`, `V1=30 m/s`, sale con `h2=290 kJ/kg`, sin trabajo ni altura. `V2=sqrt(V1²+2×1000(h1−h2))=246,8 m/s` aproximadamente. Mostrar de dónde proviene el factor 1000.

**B05 — Entropía de gas ideal:** aire de `T1=300 K`, `p1=100 kPa` a `T2=450 K`, `p2=200 kPa`, `cp=1,005`, `R=0,287`. `Δs=cp ln(T2/T1)−R ln(p2/p1)≈0,2086 kJ/(kg·K)`. Advertir que `ln` no es logaritmo decimal.

**B06 — Límite de Carnot:** fuente a `500 °C`, sumidero a `20 °C`. `ηmax=1−293,15/773,15≈62,08%`. Incluir comparación con la fórmula incorrecta usando °C.

**B07 — Refrigerador simple:** se extraen `600 kJ` de un recinto consumiendo `200 kJ` de trabajo: `COP_R=3`; `Q_H=800 kJ`. Aclarar por qué COP puede superar 1.

**B08 — Brayton aire estándar ideal:** `T1=300 K`, `rp=6`, `k=1,4`, `T3=1200 K`, `cp=1,005`. `a=(k−1)/k`; `T2=T1 rp^a`; `T4=T3/rp^a`; `wnet=cp[(T3−T4)−(T2−T1)]`; `η=wnet/[cp(T3−T2)]`. Recalcular con controles y comparar trabajo vs. eficiencia.

**B09 — Compresión de dos etapas:** `p1=100 kPa`, `p2=900 kPa`; interenfriamiento perfecto y mismas leyes politrópicas. `pi=sqrt(100×900)=300 kPa`. Visualizar razones de presión 3 y 3; advertir que no es regla universal si cambian hipótesis.

**B10 — Mezcla saturada:** a presión fija con propiedades ficticias **solo para practicar interpolación**, `hf=200`, `hfg=2200 kJ/kg`, `h=1300 kJ/kg`; `x=(1300−200)/2200=0,50`. Marcar claramente «valores didácticos, no tabla de agua»; nunca dibujar estos puntos como propiedades reales.

**B11 — Balance de potencia:** turbina de vapor idealizada con `ṁ=12 kg/s`, `h1=3200`, `h2=2600 kJ/kg`, adiabática; `Ẇ=12×600=7200 kW=7,2 MW`. Mostrar la diferencia entre `w` y `Ẇ`.

**B12 — Mezclador abierto:** corrientes `m1=2 kg/s`, `h1=500 kJ/kg`; `m2=3 kg/s`, `h2=100 kJ/kg`, sin calor ni trabajo. `m3=5 kg/s`, `h3=(2×500+3×100)/5=260 kJ/kg`. Usar como preparación para el CAA regenerativo.

En todos los ejemplos: enunciado breve, sistema y frontera, datos, hipótesis, esquema, ecuación simbólica, unidades, sustitución, cálculo, interpretación, comprobación de orden de magnitud, dos preguntas de práctica y error frecuente.

# 21. CONTROL DE PROCEDENCIA Y OBSERVACIONES FINALES

- **Verificado en el PDF:** título, autores, séptima edición, año editorial, índice de capítulos/secciones y páginas impresas indicadas arriba.
- **Verificado en la especificación y material de cátedra:** estructura MEC110_1 a MEC110_9, objetivos temáticos y casos numéricos consignados en §§3–14; sus resultados publicados son referencias a contrastar, no garantía de identidad con todo proveedor termodinámico.
- **Propuesto para desarrollo:** arquitectura, diseño visual, casos B01–B12, contratos y criterios de prueba.
- **Pendiente antes de publicación:** confirmar licencias de materiales docentes, autoría y atribuciones; validar estados termodinámicos y resultados de todos los casos con proveedor independiente; probar el sistema real en su repositorio; verificar cobertura de diapositivas con revisión visual de figuras y tablas.
