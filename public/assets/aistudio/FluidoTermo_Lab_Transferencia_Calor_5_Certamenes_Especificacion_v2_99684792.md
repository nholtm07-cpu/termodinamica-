# FLUIDOTERMO LAB — ESPECIFICACIÓN MAESTRA DE TRANSFERENCIA DE CALOR
## Parte 4 · Curso completo desde cero, banco de ejercicios progresivos, laboratorios paramétricos y contrato técnico de implementación

**Versión:** 2.0 — cinco problemas originales del libro adaptados · **Fecha:** 17 de noviembre de 2026  
**Formato:** Documento maestro Markdown para diseño pedagógico, ingeniería científica, desarrollo web y validación.  
**Audiencia:** estudiantes de ingeniería sin conocimientos previos; docentes; desarrolladores frontend/backend y especialistas en métodos numéricos.  
**Idioma:** español de Chile. **Cálculo:** unidades SI, notación decimal consistente y resultados con unidades.  
**Estado:** especificación y material didáctico original; **no** es código implementado, ni transcripción del libro.

> **Relación con FluidoTermo Lab.** El producto se organiza ahora en MEC120 — Mecánica de Fluidos; MEC110 — Termodinámica; **Transferencia de Calor — nuevo módulo académico**; y la futura capa transversal de Seguridad, Acceso y Administración. La navegación y el motor científico deben ser independientes. No modificar módulos existentes sin auditoría y pruebas de regresión.

> **Fuente central inspeccionada:** Yunus A. Çengel, *Transferencia de calor y masa: un enfoque práctico*, **tercera edición**, McGraw-Hill, 2007, PDF de 930 páginas facilitado por el usuario. Se revisaron portada, datos editoriales, índice de capítulos y contenido técnico de referencia, incluidos diagramas de resistencias térmicas. Se conserva el orden temático de sus capítulos **1 a 14**, pero las explicaciones se redactaron de manera original. **Los cinco casos principales usan datos numéricos y referencias concretas de ejemplos del libro**, con procedimientos recalculados y redacción propia; no se transcriben sus soluciones. Las correlaciones reconocidas se mencionan por su nombre y **deben validarse dentro de sus rangos de aplicación**.

---

> **Prioridad de esta versión:** el nuevo módulo se centra en **cinco ejercicios tipo certamen que usan los datos de cinco ejemplos del libro**. La teoría permite comprenderlos; los laboratorios los hacen interactivos, y las simulaciones solo muestran resultados físicos que el motor sabe calcular.

# ÍNDICE DE USO

1. Alcance, resultados de aprendizaje y política de precisión científica.
2. Mapa curricular por dificultad y correspondencia con el libro.
3. Método de enseñanza «El Profesor al Lado» y alfabetización matemática.
4. Curso conceptual completo: conducción, convección, radiación, régimen transitorio, métodos numéricos y sistemas industriales.
5. Diccionario de símbolos, fórmulas, supuestos y unidades.
6. Cinco ejercicios **basados en datos del libro y resueltos nuevamente**, con dificultad progresiva y escenarios editables.
7. Laboratorios científicos paramétricos: interacciones, figuras, controles, gráficas y pizarras recalculables.
8. Motor de cálculo, validaciones, sensibilidad, casos límite, trazabilidad y pruebas.
9. Diseño de interfaz, navegación, rendimiento, accesibilidad y arquitectura.
10. Matriz de cobertura, criterios de aceptación, implementación incremental y bibliografía.

---

# 1. META PEDAGÓGICA Y CIENTÍFICA

## 1.1. Qué diferencia este módulo de una calculadora

Una calculadora responde «723 W». Este módulo responde también: **qué intercambia calor, por qué lo hace, qué superficie se usó, cuál es la diferencia de temperatura, de dónde surge la ecuación, qué unidades cancelan, qué se asume, qué cambiaría si aumentamos el espesor y cómo comprobar el resultado**. El cálculo, el diagrama, las curvas y la pizarra son distintas vistas del **mismo estado numérico**.

Una persona que nunca ha cursado transferencia de calor debe avanzar hasta ser capaz de: reconocer los mecanismos de transporte; formular balances de energía; elegir correlaciones; determinar resistencias térmicas; distinguir régimen transitorio de estacionario; dimensionar aislación, aletas e intercambiadores; y detectar resultados físicamente imposibles.

## 1.2. Resultados de aprendizaje comprobables

| Código | Capacidad al terminar | Evidencia observable |
|---|---|---|
| RA-01 | Leer una situación física y dibujar superficies, sistemas y flujos | Diagrama con fronteras, temperaturas y dirección del calor |
| RA-02 | Reconocer conducción, convección, radiación y combinaciones | Justifica el mecanismo dominante y la superposición física |
| RA-03 | Resolver problemas 1D de conducción en paredes, cilindros, esferas y contactos | Resultado, unidades, resistencias y temperaturas intermedias |
| RA-04 | Formular la ecuación de calor y reconocer condiciones iniciales/de frontera | Selecciona ecuación y régimen coherentes |
| RA-05 | Determinar cuándo se aplica capacidad concentrada | Calcula Biot, evalúa validez y muestra alternativa |
| RA-06 | Utilizar números adimensionales y correlaciones | Calcula Re, Pr, Nu, Gr/Ra; identifica geometría y rango |
| RA-07 | Dimensionar y evaluar intercambiadores | Calcula balances, LMTD, UA, NTU y efectividad |
| RA-08 | Resolver pérdidas combinadas por convección y radiación | Balance no lineal con solución verificable |
| RA-09 | Comparar alternativas de diseño | Análisis de sensibilidad, límites, hipótesis y métricas |
| RA-10 | Explicar la solución completa de un certamen sin memorizar fórmulas | Pizarra con despejes, pasos y comprobaciones |

## 1.3. Política de exactitud y honestidad

- Todo ejemplo usa **datos didácticos declarados**, no pretende caracterizar sin ensayo materiales reales. Conductividad, viscosidad, calor específico y emisividad pueden depender de temperatura, presión, humedad, rugosidad o composición. Los datos iniciales serán constantes **solo cuando se indique**.
- «Simulación 2D de temperatura» **no** significa CFD. Si se resuelve únicamente una ecuación 1D analítica, mostrar la imagen como **mapa 1D extruido**. Para usar el término CFD deben existir ecuaciones de flujo, discretización, solución y verificación numérica pertinentes.
- Cada ley tiene límites: Fourier presupone un modelo continuo; Newton de enfriamiento utiliza un coeficiente `h` dependiente de la situación; Stefan–Boltzmann requiere temperaturas absolutas y modelo radiativo correcto; correlaciones de Nusselt no son universales.
- Si el usuario ajusta un parámetro fuera del dominio, **detener la evaluación o cambiar de modelo con explicación explícita**, en vez de devolver un número engañoso.
- Mostrar valores exactos, intermedios completos y redondear solo en presentación. Aplicar tolerancias y análisis dimensional.
- Para publicar, utilizar contenido redactado originalmente, imágenes técnicas propias, propiedades con licencia compatible y referencias bibliográficas. No publicar el PDF ni sus tablas/figuras completas sin autorización.

---

# 2. MAPA CURRICULAR Y SECUENCIA DE APRENDIZAJE

El índice del libro aportado organiza **14 capítulos**. Para aprender sin prerrequisitos innecesarios, se recomienda estudiar primero capítulos 1–4, después 6–9, 11–13, 5 y 10 según nivel, y finalmente la conexión con 14. La interfaz permitirá consultar la **secuencia original del libro** y la **ruta didáctica sugerida**.

| Etapa de plataforma | Base en Çengel 3.ª ed. (página impresa de inicio) | Contenido y mínimo exigible | Dificultad |
|---|---|---|---|
| 0. Preparación matemática | Complemento propio | SI, áreas, potencias, logaritmos, derivadas, despejes, gráficas | 0/5 |
| 1. Fundamentos | Cap. 1, p. 1 | energía/calor, tasa/flujo, conducción/convección/radiación | 1/5 |
| 2. Ecuación de calor | Cap. 2, p. 61 | balance diferencial, coordenadas, fuente de calor, fronteras | 2/5 |
| 3. Conducción estacionaria | Cap. 3, p. 131 | paredes, cilindros, esferas, contactos, aletas, radio crítico | 2–4/5 |
| 4. Conducción transitoria | Cap. 4, p. 217 | Biot, Fourier, cuerpo concentrado, sólidos semiinfinitos | 3–4/5 |
| 5. Métodos numéricos | Cap. 5, p. 285 | diferencias finitas, estabilidad, convergencia y energía | 4–5/5 |
| 6. Convección: fundamentos | Cap. 6, p. 355 | capas límite, `h`, Re, Pr, Nu, semejanza | 2–3/5 |
| 7. Convección externa forzada | Cap. 7, p. 395 | placa, cilindro, esfera, bancos de tubos | 3–4/5 |
| 8. Convección interna forzada | Cap. 8, p. 451 | tubos, perfiles, Re, correlaciones, calor y pérdida de presión | 3–4/5 |
| 9. Convección natural | Cap. 9, p. 503 | flotación, Gr, Ra, paredes verticales, recintos | 3–4/5 |
| 10. Ebullición/condensación | Cap. 10, p. 561 | cambio de fase, curvas/regímenes y límites de diseño | 4–5/5 |
| 11. Intercambiadores | Cap. 11, p. 609 | UA, LMTD, efectividad-NTU y configuraciones | 3–5/5 |
| 12. Radiación básica | Cap. 12, p. 663 | cuerpo negro, emisividad, propiedades y radiación solar | 2–4/5 |
| 13. Radiación entre superficies | Cap. 13, p. 709 | factor de visión, radiosidad, blindajes | 4–5/5 |
| 14. Ampliación: transferencia de masa | Cap. 14, p. 773 | analogía con difusión y convección de especies | 5/5, opcional |

**Referencia bibliográfica complementaria:** tablas SI del Apéndice 1, desde la página impresa 841 (metales, materiales de construcción, aislantes, aire, agua, emisividades). Las tablas del libro deben usarse para consulta personal; la web almacenará **datos originales, con licencia o explícitamente autorizados**, indicando temperatura de referencia.

## 2.1. Hitos de dominio y desbloqueo

- **Hito A — Iniciación:** unidades, diferencias de temperatura, cálculo de energía y potencia térmica. Resolver 4 ejercicios sin errores de dimensiones.
- **Hito B — Conducción:** identificar geometría, construir circuito térmico, calcular temperaturas de interfaz y detectar resistencia dominante.
- **Hito C — Transitorio:** decidir entre modelo concentrado y distribución espacial; explicar papel de Bi y Fo.
- **Hito D — Convección:** justificar selección de correlación según flujo, geometría, régimen y propiedades.
- **Hito E — Radiación e intercambiadores:** resolver combinaciones, balances energéticos y diseño básico.
- **Hito F — Certamen avanzado:** modelar un sistema real simplificado, validar física y defender la respuesta.

**Los hitos no bloquean contenido:** son recomendaciones adaptativas, no barreras. En cada nivel hay una vista «Ver la física», «Ver la ecuación» y «Ver el desarrollo».

---

# 3. ALFABETIZACIÓN MATEMÁTICA DESDE CERO

## 3.1. Diferencias conceptuales que deben enseñarse explícitamente

**Calor** `Q` (J) es energía que se transfiere **debido a diferencia de temperatura**. No es una sustancia almacenada. **Tasa de transferencia** `Q̇` (W = J/s) es energía por segundo. **Flujo superficial** `q''` (W/m²) es tasa por unidad de área. No son intercambiables.

**Temperatura:** `T(K)=T(°C)+273,15`. Una diferencia de `10 °C` es una diferencia de `10 K`, pero **no** es válido reemplazar `80 °C` por `80 K` en `T^4`. Una potencia cuarta amplifica ese error enormemente.

**Conductividad térmica** `k` (W/(m·K)): facilidad del medio para conducir calor, no coeficiente de convección. **Coeficiente convectivo** `h` (W/(m²·K)): propiedad de la interacción flujo-superficie bajo condiciones específicas, no valor universal del fluido.

**Área:** pared `A = ancho × alto`; tubo `A_lateral = πDL`; esfera `A = 4πr²`. Para conducir en un cilindro, el área aumenta con `r`, por lo que no corresponde sustituir sin más `kAΔT/L` usando una sola área.

**Logaritmo natural:** `ln(b/a)` aparece al integrar la conducción radial; exige `b/a > 0`. El resultado `ln(2)=0,693147...` es positivo si `b>a`.

**Derivada espacial:** `dT/dx` representa cuánto cambia la temperatura por metro. El signo menos de Fourier hace que el calor vaya hacia temperaturas menores; el programa debe explicar dirección y convención positiva elegida.

**Balance:** `entrada – salida + generación = acumulación` para un volumen de control sin otros transportes energéticos; cuando exista flujo másico y trabajo, incluirlos. Estado estacionario implica acumulación cero, **no** que el calor sea cero.

## 3.2. Herramienta de conversión y auditoría dimensional

| Magnitud | Conversión / regla | Ejemplo |
|---|---|---|
| Longitud | `1 mm = 0,001 m`; `1 cm = 0,01 m` | `25 mm = 0,025 m` |
| Área | `1 cm² = 0,0001 m²` | `200 cm² = 0,0200 m²` |
| Potencia | `1 kW = 1000 W` | `1,6 kW = 1600 W` |
| Energía | `1 kJ = 1000 J`; `1 kWh = 3,6 MJ` | `0,5 kWh = 1,8 MJ` |
| Tiempo | `1 h = 3600 s` | `20 min = 1200 s` |
| Temperatura absoluta | `K = °C + 273,15` | `27 °C = 300,15 K` |
| Diferencia de temperatura | `ΔT(K)=ΔT(°C)` | `60–20 °C = 40 K` |
| Densidad | `kg/m³` | masa `m=ρV` |
| Flujo de energía | `W/m²` | `q''=Q̇/A` |

**Pizarra obligatoria para cada igualdad:** (1) valor original, (2) factor, (3) cancelación explícita de unidades, (4) valor convertido. Los campos de entrada pueden aceptar cm, mm, °C y kW, pero la capa física utiliza SI.

## 3.3. Plantilla de resolución obligatoria de todos los ejercicios

1. **Visualizar:** esquema del sistema, límites, entradas/salidas y sentido esperado del calor.
2. **Leer datos:** tabla de símbolo, significado, cantidad, unidad y origen (dato o valor supuesto).
3. **Identificar incógnita:** ¿energía `Q`, potencia `Q̇`, flujo `q''`, temperatura o espesor?
4. **Declarar hipótesis:** régimen, dimensionalidad, propiedades constantes/variables, contactos, fuentes internas, radiación, flujo.
5. **Elegir el modelo:** ley y razón física; descartar fórmulas que no correspondan.
6. **Despejar simbólicamente:** mostrar cada operación algebraica, sin reemplazar números demasiado pronto.
7. **Sustituir y calcular:** unidades y subresultados reales (temperaturas de interfaz, resistencias, h, números adimensionales).
8. **Interpretar:** sentido, unidades, valores y límites de diseño.
9. **Verificar:** balance de energía, dimensiones, comportamiento límite, residuos y tolerancia.
10. **Variar:** mover parámetro, recalcular y comparar con valor original de la cátedra/laboratorio.

## 3.4. Pistas graduadas, no respuesta anticipada

- Nivel «Desde cero»: frase intuitiva, dibujo, diccionario de variables y una operación por pantalla.
- Nivel «Universitario»: ecuación general, hipótesis y un par de pasos por pantalla.
- Nivel «Certamen»: solo enunciado y datos inicialmente; pista de modelo, luego despeje, luego sustitución y finalmente solución validada.
- Aciertos: explicar por qué funciona. Errores: clasificar en **modelo físico**, **unidades**, **álgebra**, **signos**, **correlación**, **redondeo**, **dominio**.

---

# 4. DESARROLLO DE LA MATERIA

## 4.1. Mecanismos fundamentales

### Conducción — ley de Fourier

El transporte se produce por gradiente de temperatura en un medio; en un sólido común no requiere movimiento macroscópico del material. Para conducción 1D:

`q''_x = -k(dT/dx)`; `Q̇_x = -k A(dT/dx)`.

En pared plana, con `k`, `A` constantes y sin generación interna, en estado estacionario:

`Q̇ = k A (T_caliente - T_fría)/L`.

Significados: `L` espesor (m), `A` área perpendicular (m²), `k` (W/m·K), `Q̇` (W). El modelo da una **distribución lineal** de temperatura. Si el área o `k` varía, debe integrarse o resolverse con un modelo más general.

**Deducción breve:** desde `Q̇=-kA dT/dx`, integrar entre `x=0` y `x=L`: `Q̇∫₀ᴸdx = -kA∫_{T1}^{T2}dT` ⇒ `Q̇ L = kA(T1-T2)` ⇒ ecuación anterior. En el visor, cada integral se abre con explicación y significado físico.

### Convección — ley de enfriamiento de Newton

Existe intercambio entre una superficie y un fluido en movimiento macroscópico o inducido por flotación. Modelo de ingeniería:

`Q̇_conv = h A_s (T_s - T_∞)`.

`h` depende de geometría, velocidad, propiedades y régimen. Mostrar flechas de flujo y capa límite, no dibujar el coeficiente como una propiedad permanente de cualquier aire. Una superficie caliente respecto del ambiente produce `Q̇_conv>0` si la convención positiva es «sale del sólido».

### Radiación — ley de Stefan–Boltzmann

Cualquier cuerpo a temperatura absoluta no nula emite radiación térmica. Para una superficie gris difusa que intercambia con un recinto grande, aproximadamente isotermo, bajo condiciones apropiadas:

`Q̇_rad = εσ A (T_s^4 - T_alr^4)`.

`σ ≈ 5,670374419×10⁻⁸ W/(m²·K⁴)`. `ε` emisividad, entre 0 y 1. **Usar Kelvin**. Para dos superficies finitas es necesario considerar factores de visión y emisividades, y la ecuación simplificada no siempre corresponde.

### Mecanismos simultáneos

Una pared de un horno puede perder calor **a la vez** por convección y radiación al mismo ambiente: `Q̇_total=Q̇_conv+Q̇_rad` con las temperaturas de cada entorno bien identificadas. No sumarlos mecánicamente en serie: desde una misma superficie son **rutas paralelas**. Cuando `T_s` es incógnita, el balance es no lineal por `T_s^4`.

## 4.2. Ecuación general de conducción y condiciones de frontera

Para un sólido isotrópico, propiedades constantes, con posible generación volumétrica `q'''`:

`ρc_p ∂T/∂t = k ∇²T + q'''`.

En una dimensión cartesiana: `ρc_p ∂T/∂t = k ∂²T/∂x² + q'''`.

- **Estacionario sin generación:** `d²T/dx² = 0` (perfil lineal si k constante).
- **Estacionario con generación uniforme:** `d²T/dx² = -q'''/k` (perfil parabólico en pared plana).
- **Transitorio:** `∂T/∂t ≠ 0`; se requiere temperatura inicial `T(x,0)` y condiciones de frontera.
- **Dirichlet:** temperatura superficial especificada `T_s`.
- **Neumann:** flujo superficial prescrito, incluido flujo cero en frontera aislada/simétrica.
- **Robin:** flujo por conducción igualado a convección y/o radiación.
- **Interfase:** continuidad de flujo, salvo aporte/almacenamiento interfacial; salto térmico posible si se declara resistencia de contacto.

**Derivación educativa:** aplicar balance a elemento `A dx`: conducción que entra − conducción que sale + fuente `q''' A dx` = `ρc A dx ∂T/∂t`; usar Fourier y tomar `dx→0`. Distinguir conductividad `k` de difusividad `α=k/(ρc_p)` (m²/s).

## 4.3. Circuitos de resistencias térmicas

Es útil comparar la transmisión de calor con el paso de corriente por resistencias. La analogía válida: `Q̇ = ΔT/R_t` con `R_t` en K/W.

- Pared: `R_cond,plana=L/(kA)`.
- Convección: `R_conv=1/(hA)`.
- Contacto con resistencia superficial `R''_c` (m²K/W): `R_contacto=R''_c/A`.
- Cilindro: `R_cond,cil=ln(r_o/r_i)/(2πkL)`.
- Esfera: `R_cond,esf=(1/r_i - 1/r_o)/(4πk)`.

Resistencias **en serie**: `R_total=ΣR_i`; la misma `Q̇` atraviesa cada elemento en estado estacionario sin fuentes entre ellos. Resistencia **en paralelo**: conductancias se suman, `1/R_total=Σ(1/R_i)`; comparten una diferencia de temperatura entre nodos comunes. En redes mixtas, resolver nodos y balances.

Temperatura de interfaz: `T_{j+1} = T_j − Q̇ R_j` en dirección caliente→frío. La suma de caídas debe reconstruir la diferencia térmica total (verificación numérica en pantalla).

**Error típico:** usar la misma área plana para una tubería: la conducción radial no tiene área transversal constante. Otro: sumar pérdidas por dos caras sin verificar si comparten el mismo flujo en serie o si las rutas son paralelas.

## 4.4. Geometrías, aislación y aletas

### Tubos y tuberías

Con un fluido caliente interior y aire exterior, `R_total = 1/(h_i 2πr_i L)+Σ ln(r_{j+1}/r_j)/(2πk_j L)+1/(h_o2πr_oL)`; `Q̇ = (T_{∞,i}−T_{∞,o})/R_total`. El radio utilizado en la convección interna y externa **no es el mismo**.

### Radio crítico de aislamiento

Para cilindro largo con `h_o` aproximadamente constante: `r_cr=k_ais/h_o`. Para esfera: `r_cr=2k_ais/h_o`. Añadir aislante a un cilindro por debajo de `r_cr` puede aumentar temporalmente la pérdida debido al aumento de área; sobre `r_cr` la pérdida disminuye. Esta conclusión depende de las hipótesis y la geometría, no significa que toda aislación inicial sea perjudicial.

### Aletas

Se agregan para incrementar el área de intercambio. Para una aleta recta uniforme con base a `T_b`, ambiente `T_∞`, sección `A_c`, perímetro mojado `P`, conductividad `k`, coeficiente constante `h`:

`m = sqrt(hP/(kA_c))` (1/m); para punta aproximadamente adiabática con longitud corregida `L_c`: `Q̇_aleta ≈ sqrt(hPkA_c)(T_b−T_∞) tanh(m L_c)`.

Eficiencia de aleta (modelo indicado): `η_f=Q̇_aleta/[h A_f (T_b−T_∞)]`; efectividad de aleta `ε_f=Q̇_aleta/[h A_base (T_b−T_∞)]`. Explicar las áreas incluidas y mostrar cuándo la aproximación de punta es admisible.

### Generación interna

En pared plana simétrica de espesor total `2L`, generación uniforme `q'''`, superficies fijadas a `T_s` y propiedades constantes:

`T(x)=T_s + (q'''/(2k))(L²−x²)` para `−L≤x≤L`; `T_max=T_s+q'''L²/(2k)`; flujo que sale por cada cara `q''=q'''L`. El esquema debe mostrar que el calor se genera en el volumen y sale por ambas caras.

## 4.5. Régimen transitorio: Biot y Fourier

**Biot:** `Bi=hL_c/k_s`, donde `L_c=V/A_s` para criterio de sistema concentrado. Compara resistencia conductiva interna con convectiva externa. Si `Bi<0,1` normalmente es defendible aproximar temperatura uniforme del sólido (con matices según geometría, propiedades y tolerancia). Si no se cumple, **no** mostrar la exponencial concentrada como solución confiable.

**Fourier:** `Fo=αt/L_*²`, con la **longitud característica del modelo específico**: en análisis espacial de paredes/cilindros no debe confundirse automáticamente con `V/A_s`. Documentar `L_*` en la interfaz.

**Capacidad concentrada:** para sólido sin fuentes y ambiente constante:

`(T(t)-T_∞)/(T_i-T_∞)=exp[-hA_s t/(ρVc_p)]`.

Constante de tiempo `τ=ρVc_p/(hA_s)` (s). Para alcanzar `T_obj`: `t = τ ln[(T_i−T_∞)/(T_obj−T_∞)]`, siempre que el cociente y evolución sean físicamente consistentes.

**Sólido semiinfinito con cambio brusco de superficie a T_s constante:** para `x≥0`, condiciones ideales homogéneas, `T(x,t)=T_s+(T_i−T_s)erf[x/(2√(αt))]`. La solución debe enseñar `erf` y por qué solo aplica si la penetración térmica no alcanza la pared opuesta.

**Enfriamiento espacial:** series de Heisler/soluciones por separación de variables cuando son aplicables; si no se implementa el solver verificado, la app debe indicar «método pendiente», nunca aproximar con un gráfico decorativo.

## 4.6. Métodos numéricos y control de estabilidad

Discretizar `ρc ∂T/∂t = k∂²T/∂x² + q'''` en malla 1D uniforme. Nodos interiores, propiedades constantes y esquema explícito:

`T_i^{n+1}=T_i^n + Fo_Δx(T_{i+1}^n−2T_i^n+T_{i-1}^n) + (q'''Δt)/(ρc)`;
`Fo_Δx=αΔt/Δx²`.

Para ecuación 1D lineal sin condiciones especiales, estabilidad explícita interior requiere `Fo_Δx≤1/2`. **La condición de estabilidad de nodos con convección, radiación, fuentes no lineales o dimensiones adicionales puede ser más estricta**. Si el paso de tiempo no es admisible, bloquear y recomendar valor menor o usar esquema implícito.

En estado estacionario interior sin generación: `T_i=(T_{i-1}+T_{i+1})/2`; con fuente `T_i=(T_{i-1}+T_{i+1})/2 + q'''Δx²/(2k)`.

Validación: refinamiento `Δx`, `Δt`, residuo térmico local, conservación global y contraste con solución analítica. Incluir mapa `x–t` de temperatura con escala numérica y aviso de resolución.

## 4.7. Convección y números adimensionales

- `Re=ρVD/μ=VD/ν` para diámetro característico del tubo; para placa, `Re_L=V L/ν`. Relaciona inercia/viscosidad.
- `Pr=ν/α_f=μ c_p/k_f` para propiedades del **fluido**. Relaciona difusión de cantidad de movimiento y difusión térmica.
- `Nu=hL_*/k_f`. Permite calcular `h=Nu k_f/L_*` con longitud característica de la correlación.
- `Gr=gβ|T_s−T_∞|L³/ν²`; `Ra=GrPr`. Relacionan flotación y difusión en convección natural.

**Reglas sobre correlaciones:** antes de calcular Nu, pedir geometría (tubo, placa, esfera), flujo interno/externo, régimen, temperatura de película (`(T_s+T∞)/2` en aproximaciones apropiadas), propiedades y condición de frontera (temperatura o flujo uniforme). Presentar la correlación, rango, fuente, hipótesis y posible error de modelo.

### Placa plana, flujo externo forzado

Ejemplo habitual para placa isotérmica y capa límite laminar promediada desde el borde de ataque: `Nu_L≈0,664Re_L^{1/2}Pr^{1/3}`, apropiada bajo condiciones de aplicación laminar y `Pr` moderado. Para régimen mixto con transición usual cerca de `Re_x≈5×10⁵` en una superficie lisa de flujo libre poco perturbado, puede usarse `Nu_L≈(0,037Re_L^{0,8}−871)Pr^{1/3}` cuando corresponda al rango del modelo. **La transición no ocurre siempre en un Reynolds fijo.**

### Tubos internos

Flujo laminar completamente desarrollado, circular, propiedades constantes: `Nu_D=3,66` para pared a temperatura uniforme y `Nu_D=4,36` para flujo de calor uniforme (otras condiciones difieren). En entrada térmica, estas constantes no aplican de inmediato.

Para flujo turbulento interno suave, Dittus–Boelter es un ejemplo de correlación restringida: `Nu=0,023Re^{0,8}Pr^n`, con `n=0,4` cuando el fluido se calienta y `n=0,3` cuando se enfría; se usa típicamente en `Re≳10⁴`, `Pr≈0,7–160`, `L/D≳10`, condiciones adecuadas. **No** usarla en región transicional ni con viscosidad fuertemente variable sin justificación.

### Convección natural, placa vertical

Una correlación de Churchill–Chu para temperatura de superficie uniforme sobre placa vertical, en rango amplio, es:

`Nu_L=[0,825 + 0,387 Ra_L^{1/6}/(1+(0,492/Pr)^{9/16})^{8/27}]²`.

Calcular `h=Nu_L k_f/L`. Se debe comprobar que `Ra_L` esté dentro del rango admisible para la geometría, así como validez de aproximación de Boussinesq si se emplea.

### Convección interna y balance de energía

Para un flujo que no cambia de fase: `Q̇=ṁc_p(T_salida−T_entrada)` con signo del fluido, usando `ṁ=ρV̄ A_flujo`. Si pared a temperatura uniforme y `h` es constante, la evolución de temperatura media puede modelarse con una exponencial asociada a `hP L/(ṁc_p)`; no sustituir sin más `A=πDL` en `hA(T_s−T_entrada)` como si la diferencia se mantuviese constante.

## 4.8. Intercambiadores de calor

### Balance energético

Sin pérdidas y sin cambio de fase: `Q̇=ṁ_h c_{p,h}(T_{h,i}−T_{h,o})=ṁ_c c_{p,c}(T_{c,o}−T_{c,i})`. Usar magnitudes positivas de calor transferido; las caídas/aumentos de temperatura están escogidas coherentemente.

### Método LMTD

`Q̇=U A F ΔT_lm`; para un intercambiador simple de flujo paralelo o contraflujo sin corrección, `F=1`. Definir diferencias terminales según arreglo y `ΔT_lm=(ΔT_a−ΔT_b)/ln(ΔT_a/ΔT_b)`. Si las diferencias son casi iguales, usar el límite estable `ΔT_lm→ΔT_a`; evitar división `0/0` numérica. Si hay cruce o inversión de temperaturas que invalida configuración/modelo, explicarlo.

### Método efectividad–NTU

`C_h=ṁ_h c_{p,h}`; `C_c=ṁ_c c_{p,c}`; `C_min=min(C_h,C_c)`; `C_max=max(...)`; `C_r=C_min/C_max`; `NTU=UA/C_min`; `Q̇_max=C_min(T_{h,i}−T_{c,i})`; `ε=Q̇/Q̇_max`.

Para **contraflujo, un paso por lado, sin cambio de fase**, `ε=[1−exp(−NTU(1−C_r))]/[1−C_r exp(−NTU(1−C_r))]` para `C_r≠1`, y `ε=NTU/(1+NTU)` para `C_r=1`. Otros arreglos requieren fórmulas diferentes; **no reciclar la de contraflujo para flujo cruzado**.

### Incrustaciones y U

`1/(UA)` se obtiene desde la suma de resistencias térmicas adecuadamente referidas a las áreas de intercambio, incluyendo paredes, películas y factores de incrustación. Distinguir `U_i A_i=U_o A_o` en el mismo intercambiador; `U_i` y `U_o` por separado no tienen por qué coincidir.

## 4.9. Radiación avanzada

**Superficie negra ideal:** `E_b=σT⁴`. **Superficie real opaca gris difusa:** `E≈εσT⁴` dentro del modelo; para equilibrio térmico espectral deben considerarse dependencias y la ley de Kirchhoff bajo las condiciones pertinentes.

**Dos placas planas grandes paralelas**, superficies grises difusas, factores de visión idealizados `F_12≈1`:

`Q̇/A=σ(T_1⁴−T_2⁴)/(1/ε_1+1/ε_2−1)`.

**Un blindaje** intermedio de emisividad `ε_s` en ambas caras, despreciando conducción lateral y con geometría ideal: resolver dos intercambios radiativos en serie; para placas negras externas y blindaje idéntico por ambos lados, `q''_con_escudo=σ(T_1⁴−T_2⁴)/(2/ε_s)`; sin blindaje `q''_sin=σ(T_1⁴−T_2⁴)`. Nunca reducir radiación arbitrariamente por «un porcentaje fijo».

**Factores de visión**: `F_{ij}` fracción de radiación saliente de `i` que llega directamente a `j`; reciprocidad `A_iF_ij=A_jF_ji`; suma `Σ_jF_ij=1` para un recinto cerrado. En geometrías complejas calcular o consultar factores de visión autorizados y verificar estas identidades.

## 4.10. Ebullición, condensación y cambio de fase

El calor sensible cambia temperatura sin cambio de fase idealizado: `Q=mc_p ΔT`. El calor latente implica cambio de fase a condiciones definidas: `Q=m h_fg`, con unidades coherentes. En un intercambiador real, el estado termodinámico y las propiedades a presión dada determinan el valor de `h_fg`; no asumir que `2257 kJ/kg` aplica a cualquier presión.

La **curva de ebullición en estanque** distingue convección natural, ebullición nucleada, cercanía al flujo crítico, transición y película; la selección de correlación es dependiente de régimen y material. No permitir que un selector de potencia atraviese el flujo crítico sin mostrar aviso de seguridad y cambio de física. **Condensación en película** y **por gotas** no tienen el mismo coeficiente, y las correlaciones dependen de geometría, inclinación, propiedades y estado del flujo.

## 4.11. Integración opcional con transferencia de masa

El capítulo 14 del libro incluye difusión y transporte de especies. Crear subsección opcional posterior a Transferencia de Calor, no confundir ambos fenómenos. **Primera ley de Fick** en un medio 1D con difusividad constante: `j_A=-D_AB dc_A/dx` (en un modelo de difusión y marco de referencia especificados). Introducir `Sh`, `Sc` y analogía calor–masa solo cuando el alumnado domine Re/Pr/Nu. La evaporación real acopla balances de calor y masa y requiere datos de presión de vapor y condiciones ambientales: no resolverla con `Q=mc_pΔT` solamente.

---

# 5. FORMULARIO TÉCNICO Y DICCIONARIO DE VARIABLES

| Símbolo | Significado | Unidad SI | Nota decisiva |
|---|---|---|---|
| `Q` | energía térmica transferida | J | no es potencia |
| `Q̇` | tasa de transferencia de calor | W | positivo según convención explícita |
| `q''` | flujo térmico superficial | W/m² | no equivale a `Q̇` sin área |
| `q'''` | generación volumétrica | W/m³ | fuente interna |
| `T`, `T_s`, `T_∞` | temperatura, superficial y del fluido no perturbado | K o °C | Kelvin obligatorio en radiación |
| `k_s`, `k_f` | conductividad de sólido y fluido | W/(m·K) | no confundir con `h` |
| `h` | coeficiente convectivo | W/(m²·K) | condicionado por régimen |
| `ε` | emisividad | adimensional | 0 a 1 |
| `σ` | constante de Stefan–Boltzmann | W/(m²·K⁴) | `5,670374419×10⁻⁸` |
| `ρ` | densidad | kg/m³ | propiedades dependientes de estado |
| `c_p` | calor específico | J/(kg·K) | declarar temperatura de evaluación |
| `α` | difusividad térmica `k/(ρc_p)` | m²/s | propiedad del medio correspondiente |
| `L, r, D` | largo/espesor, radio, diámetro | m | usar geometría correcta |
| `A, A_s, A_c` | área de transferencia/superficie/sección | m² | no confundir entre sí |
| `R_t` | resistencia térmica total | K/W | circuitos térmicos |
| `R''_c` | resistencia de contacto por área | m²·K/W | dividir por área |
| `Bi` | número de Biot | – | criterio de gradientes internos |
| `Fo` | número de Fourier | – | tiempo adimensional |
| `Re,Pr,Nu` | Reynolds, Prandtl, Nusselt | – | correlaciones de convección |
| `Gr,Ra` | Grashof, Rayleigh | – | convección natural |
| `ṁ` | flujo másico | kg/s | usar valor por corriente |
| `C=ṁc_p` | capacidad calorífica de flujo | W/K | intercambiadores |
| `U` | coeficiente global | W/(m²·K) | área de referencia declarada |
| `NTU` | número de unidades de transferencia | – | `UA/C_min` |
| `F_ij` | factor de visión radiativo | – | verifica reciprocidad |
| `η_f`, `ε_f` | eficiencia y efectividad de aleta | – | distintas definiciones |

**Fórmulas mínimas en buscador:** Fourier, Newton, Stefan–Boltzmann, resistencias, temperatura interfacial, calor sensible/latente, Biot, Fourier, solución concentrada, ecuación de calor, diferencias finitas, Reynolds/Prandtl/Nusselt/Grashof/Rayleigh, correlaciones seleccionadas, pérdida de carga auxiliar, LMTD, efectividad-NTU, balance de energía, factor de visión y balances radiativos. Cada ficha debe tener derivación o motivación, unidades, condiciones de validez, ejemplo numérico y mini-prueba.

---


# 6. TALLER DE CERTAMEN: CINCO CASOS REALES DE LA BIBLIOGRAFÍA, DE MENOR A MAYOR DIFICULTAD

**Cambio respecto de la especificación anterior:** el núcleo obligatorio del taller deja de ser un banco genérico. Se concentra en **cinco problemas-guía con datos tomados del libro proporcionado**, cada uno vinculado con un ejemplo, capítulo y página impresos específicos. Los enunciados aquí son **paráfrasis originales**, las soluciones se desarrollan nuevamente y las simulaciones ofrecen variaciones sobre los datos de referencia. Esto no equivale a transcribir el libro ni autoriza publicar sus páginas o figuras.

| Posición | Código / dificultad | Fuente exacta en Çengel, 3.ª ed. | Problema guía | Producto de la simulación |
|---|---|---|---|---|
| 1 | `TC-C01` · Inicial (1/5) | **Ejemplo 1-5**, cap. 1, **p. 19 impresa / p. 45 PDF** | Pérdida por conducción a través de un techo | Potencia, energía acumulada, costo y perfil lineal `T(x)` |
| 2 | `TC-C02` · Básico (2/5) | **Ejemplo 1-10**, cap. 1, **p. 31 / p. 57 PDF** | Convección y radiación simultáneas desde una superficie corporal idealizada | Dos flujos, suma y sensibilidad a `h`, `ε` y temperaturas |
| 3 | `TC-C03` · Intermedio (3/5) | **Ejemplo 3-3**, cap. 3, **pp. 140–141 / pp. 166–167 PDF** | Ventana de doble acristalamiento y resistencias en serie | Cinco resistencias, temperatura en cada interfaz y comparación |
| 4 | `TC-C04` · Intermedio alto (4/5) | **Ejemplo 4-1**, cap. 4, **pp. 222–223 / pp. 248–249 PDF** | Respuesta de un termopar modelado como esfera | Biot, constante de tiempo, curva exponencial y tiempo objetivo |
| 5 | `TC-C05` · Avanzado (5/5) | **Ejemplo 11-4**, cap. 11, **pp. 628–629 / pp. 654–655 PDF** | Dimensionamiento de intercambiador de doble tubo a contraflujo | Balance doble, temperaturas de salida, LMTD, `A`, `L` y factibilidad |

## 6.1. Contrato de presentación de TODO ejercicio

El aula virtual presenta **dos pantallas diferentes, pero conectadas**:

- **Pantalla A — «Aprender la materia»**: introduce el concepto físico y la fórmula con explicación de símbolos, hipótesis, despeje y ejemplo miniatura. Contiene «Ver de dónde sale la fórmula», «Dibujo físico», «Interpretación», «Error típico» y comprobación rápida.
- **Pantalla B — «Resolver certamen»**: enunciado para intentar sin mirar la solución; panel de datos editables; selector de nivel de pista; simulación y esquema; pizarra con todos los pasos; verificación de unidades; pregunta conceptual y variante de análisis de sensibilidad. La teoría se puede abrir al costado, **sin sustituir el ejercicio**.

La pizarra no debe limitarse a presentar la ecuación final. En cada caso debe reproducir este orden: **1. lectura → 2. dibujo → 3. datos → 4. incógnitas → 5. supuestos → 6. concepto/ley → 7. ecuación simbólica → 8. despeje → 9. conversión SI → 10. sustitución con números actuales → 11. resultado → 12. comprobación física y dimensional**. Cuando exista un cálculo auxiliar, crear subpasos en vez de omitirlos. En modo «Certamen» ocultar inicialmente la solución y pedir la respuesta del estudiante.

---

## 6.2. CASO `TC-C01`: ¿Cuánto calor se pierde por el techo?

**Referencia:** datos del **Ejemplo 1-5**, capítulo 1, p. 19. **Nivel:** inicial. **Ley principal:** conducción 1D estacionaria de Fourier. **No** se introduce convección en este caso porque las temperaturas que entrega el libro son temperaturas de las **superficies**, no del aire interior/exterior.

### Datos originales del libro

| Variable | Valor inicial | Unidad | Significado |
|---|---:|---|---|
| `a` | 6 | m | Primera dimensión del techo |
| `b` | 8 | m | Segunda dimensión del techo |
| `L` | 0,25 | m | Espesor del hormigón |
| `k` | 0,8 | W/(m·K) | Conductividad térmica del techo |
| `T_si` | 15 | °C | Temperatura superficial interior |
| `T_se` | 4 | °C | Temperatura superficial exterior |
| `t_h` | 10 | h | Duración de la noche |
| `c_elec` | 0,08 | **USD/kWh** | Tarifa ficticia para este caso, **en dólares como aparece en el libro**, no CLP |

**Objetivos:** determinar la potencia instantánea perdida, la energía total y el costo equivalente; predecir cómo cambian al modificar el espesor. Enunciado propio: *Una cubierta rectangular de hormigón separa dos superficies a distinta temperatura durante una noche. Usando los datos anteriores, calcula el calor que atraviesa la cubierta y cuantifica la energía y su costo eléctrico equivalente.*

### Explicación para alguien que comienza

La temperatura de un lado es mayor, por lo que la energía se transmite hacia el lado más frío. En la conducción, un material de mayor espesor dificulta el paso del calor; mayor área, conductividad o diferencia de temperatura lo facilitan. **Potencia** (W) es energía por segundo; **energía** (Wh o kWh) exige multiplicar por tiempo. Por lo tanto, no se puede cobrar directamente un valor en W: primero se transforma a kWh.

### Desarrollo matemático completo y recalculable

**Paso 1: elegir el modelo.** Hay una pared plana sin generación interna, propiedades uniformes y temperaturas de superficie constantes. Es válida `Qdot = k A (T_si - T_se) / L`. La ley local general es `q''_x = -k dT/dx`, cuyo signo menos muestra el flujo hacia temperaturas decrecientes.

**Paso 2: calcular el área perpendicular al flujo.**

\[
A=a\,b=(6\ \mathrm{m})(8\ \mathrm{m})=48\ \mathrm{m^2}.
\]

**Paso 3: calcular el salto térmico.** `ΔT = 15 − 4 = 11 °C = 11 K` como **diferencia** de temperatura; no se suman 273,15 a un salto térmico.

**Paso 4: demostrar la fórmula.** Si `k` es constante, la temperatura cae linealmente: `dT/dx=(T_se−T_si)/L`. Sustituyendo en Fourier: `Qdot=-kA(T_se−T_si)/L=kA(T_si−T_se)/L`.

**Paso 5: sustituir unidades y números.**

\[
\dot Q=\frac{(0.8\ \mathrm{W/(m\cdot K)})(48\ \mathrm{m^2})(11\ \mathrm K)}{0.25\ \mathrm m}=1689.6\ \mathrm W.
\]

**Paso 6: conversión de potencia.** `1689,6 W ÷ 1000 = 1,6896 kW`.

**Paso 7: energía en diez horas.** `E=1,6896 kW × 10 h = 16,896 kWh` (equivalente a 60,8256 MJ).

**Paso 8: costo eléctrico equivalente.** `C=16,896 kWh × 0,08 USD/kWh = 1,35168 USD ≈ 1,35 USD`.

**Paso 9: construir el gráfico lineal.** Con `x` desde el interior hasta el exterior: `T(x)=15−(11/0,25)x` °C. En `x=0`, `T=15`; en `x=0,125 m`, `T=9,5`; en `x=0,25 m`, `T=4`.

**Paso 10: chequeo dimensional.** `(W/mK × m² × K)/m = W`. Para el costo: `kWh × USD/kWh = USD`.

**Paso 11: chequeo físico.** El calor viaja desde 15 hacia 4 °C, y `Qdot` debe crecer cuando `k`, `A` o el salto aumentan; disminuir si crece `L`.

**Paso 12: informar con precisión.** **Resultado de referencia:** `Qdot=1,6896 kW`, `E=16,896 kWh`, costo aproximado **1,35 USD**. La factura real de calefacción podría diferir: se trata de una contribución aislada, no de toda la vivienda.

### Simulador A — «Techo térmico»

- **Controles:** dimensiones `a,b`, espesor `L`, conductividad `k`, temperaturas superficiales `T_si,T_se`, duración `t_h`, tarifa `c_elec`; todos con ingreso numérico y sliders limitados.
- **Escena:** corte transversal del techo; flechas con flujo orientadas según el gradiente; regla milimetrada y gradiente; indicador de potencia/energía/costo.
- **Gráficos vinculados:** `T(x)`; `Qdot(L)` (curva `1/L`); potencia y energía frente al tiempo.
- **Variación guiada:** si el estudiante aumenta **L de 0,25 a 0,30 m** (modificación didáctica, no dato nuevo del libro), `Qdot` pasa a **1408 W**, `E` a **14,08 kWh** y el costo a **1,1264 USD**; la pizarra debe actualizar cada sustitución.
- **Preguntas certamen:** «¿Cuánto vale el flujo superficial `q''`?» (`35,2 W/m²` en preset); «¿Qué variable tiene dependencia inversa?»; «¿Por qué 11 °C de diferencia equivale a 11 K?».
- **Alertas:** espesor ≤0, área ≤0, conductividad ≤0, tiempo negativo, moneda sin etiqueta, confusión entre `W` y `Wh`. Si se invierte el gradiente térmico, invertir flechas y conservar el signo de flujo en el convenio seleccionado.

---

## 6.3. CASO `TC-C02`: Convección y radiación actuando al mismo tiempo

**Referencia:** datos del **Ejemplo 1-10**, cap. 1, p. 31. **Nivel:** básico. **Leyes:** enfriamiento de Newton y Stefan–Boltzmann. Se modela una **superficie corporal idealizada**; el resultado no es un modelo clínico de termorregulación.

### Datos originales del libro

| Variable | Valor inicial | Unidad |
|---|---:|---|
| `A_s` | 1,6 | m² |
| `T_s` | 29 | °C |
| `T_air` | 20 | °C |
| `T_sur` | 20 | °C (igual al ambiente bajo hipótesis del ejemplo) |
| `h` | 6 | W/(m²·K) |
| `epsilon` | 0,95 | adimensional |
| `sigma` | 5,670374419 × 10⁻⁸ | W/(m²·K⁴), valor físico estandarizado más preciso que el redondeado del texto |

**Objetivos:** separar las contribuciones de dos mecanismos; convertir a Kelvin correctamente; entender por qué el término radiativo es de **cuarta potencia** y no una diferencia lineal de °C.

### Desarrollo completo

**Paso 1: visualizar.** La superficie de 29 °C entrega energía al aire por **convección** y a las paredes circundantes por **radiación**. Aunque el aire se encuentra en el mismo cuarto que las paredes, son dos mecanismos distintos.

**Paso 2: anotar supuestos.** Estado estacionario, superficie aproximadamente isotérmica, medio circundante grande e isótérmico a 20 °C, emisividad gris constante, radiación y convección como sumandos, contacto con piso y evaporación no incluidos.

**Paso 3: definir sentido y ecuaciones.** `Qdot_conv = h A_s (T_s - T_air)`; `Qdot_rad = epsilon sigma A_s (T_s,K^4 - T_sur,K^4)`.

**Paso 4: convertir.** `T_s,K = 29 + 273,15 = 302,15 K`; `T_sur,K = 20+273,15 = 293,15 K`.

**Paso 5: diferencia convectiva.** `ΔT_air=29−20=9 K`.

**Paso 6: convección.**

\[
\dot Q_\mathrm{conv}=6\cdot1.6\cdot9=86.4\ \mathrm W.
\]

**Paso 7: radiación: construir el término físico.** Calcular por separado `302,15⁴`, `293,15⁴` y su diferencia antes de multiplicar por el área y la emisividad. **No elevar 9 K a la cuarta potencia**: la ley usa la diferencia de las cuartas potencias de temperaturas absolutas.

**Paso 8: radiación numérica.**

\[
\dot Q_\mathrm{rad}=0.95(5.670374419\times10^{-8})(1.6)\left(302.15^4-293.15^4\right)\approx81.84\ \mathrm W.
\]

**Paso 9: suma total.** `Qdot_total=86,4 +81,84 =168,24 W ≈168 W`. La diferencia de centésimas respecto de reproducciones redondeadas del libro responde a usar `273,15` y un `σ` más preciso; mostrarlo en metadatos, no como contradicción.

**Paso 10: identificar participación.** Convección ≈ **51,35 %** y radiación ≈ **48,65 %** del total.

**Paso 11: chequeos.** Si `T_s=T_air=T_sur`, ambos términos deben ser cero. Si se anula `epsilon`, desaparece solo la radiación. Si `h=0`, desaparece solo convección. `T(K)` nunca puede ser negativa.

**Paso 12: informe.** `Qdot_conv =86,4 W`, `Qdot_rad≈81,84 W`, `Qdot_total≈168,24 W` bajo el modelo indicado.

### Simulador B — «Superficie con dos mecanismos»

- **Controles:** `A_s`, `T_s`, `T_air`, `T_sur`, `h`, `epsilon`; selector de visualización a Kelvin/°C. El selector solo cambia la presentación, **no los valores físicos**.
- **Escena:** cuerpo/sólido esquemático con flechas de convección hacia el aire y ondas de radiación hacia paredes; termómetros en ambos entornos.
- **Gráficos:** barras independientes de `Qdot_conv`, `Qdot_rad`, `Qdot_total`; curva total en función de `T_s`; sensibilidad a `h` y `epsilon`.
- **Variación guiada:** al subir **h de 6 a 10 W/(m²·K)**, la convección cambia de `86,4` a `144 W`, pero la radiación queda en `≈81,84 W` bajo las mismas temperaturas: total `≈225,84 W`.
- **Alertas:** `epsilon∉[0,1]`, temperaturas absolutas inválidas, tratar `T_air` como `T_sur` cuando se editan por separado, presentar radiación sin `T(K)`.
- **Razonamiento de certamen:** «Si el aire cambia de temperatura pero las paredes permanecen a 20 °C, ¿qué término cambia directamente?». El alumno debe justificar, no adivinar.

---

## 6.4. CASO `TC-C03`: Ventana de doble vidrio y cinco resistencias térmicas

**Referencia:** datos del **Ejemplo 3-3**, cap. 3, pp. 140–141. **Nivel:** intermedio. **Leyes:** conducción plana, convección en caras y asociación de resistencias en **serie**. Los coeficientes `h_i` y `h_o` del ejemplo **ya incluyen efectos radiativos efectivos**; **no agregar un nuevo término de radiación** con esos mismos valores.

### Datos originales del libro

| Variable | Valor | Unidad | Comentario |
|---|---:|---|---|
| `H` | 0,8 | m | Alto de ventana |
| `B` | 1,5 | m | Ancho |
| `L_g1 = L_g2` | 0,004 | m | Cada hoja de vidrio tiene 4 mm |
| `k_g` | 0,78 | W/(m·K) | Vidrio |
| `L_air` | 0,010 | m | Espacio de 10 mm |
| `k_air` | 0,026 | W/(m·K) | Aire estancado, valor de modelo |
| `T_inf_i` | 20 | °C | Aire interior |
| `T_inf_o` | −10 | °C | Aire exterior |
| `h_i` | 10 | W/(m²·K) | Coeficiente interior efectivo |
| `h_o` | 40 | W/(m²·K) | Coeficiente exterior efectivo |

### Desarrollo completo

**Paso 1: dibujar** de izquierda a derecha: `aire interior → película convectiva interior → vidrio 1 → espacio de aire quieto → vidrio 2 → película convectiva exterior → aire exterior`.

**Paso 2: hipótesis.** Estacionario; flujo unidimensional; misma área en todas las capas; aire del hueco tratado como **conducción pura** en condiciones del ejemplo; sin infiltración; propiedades constantes y sin puentes térmicos. El valor `k_air` no convierte automáticamente a un hueco real en un medio sin convección.

**Paso 3: área.** `A=0,8×1,5=1,20 m²`.

**Paso 4: definir resistencias.**

\[
R_{i}=\frac{1}{h_iA},\quad R_{g1}=\frac{L_{g1}}{k_gA},\quad R_{aire}=\frac{L_{air}}{k_{air}A},\quad R_{g2}=\frac{L_{g2}}{k_gA},\quad R_o=\frac{1}{h_oA}.
\]

**Paso 5: película interior.** `R_i=1/(10×1,2)=0,0833333 K/W`.

**Paso 6: primera hoja.** `R_g1=0,004/(0,78×1,2)=0,00427350 K/W`.

**Paso 7: aire.** `R_air=0,010/(0,026×1,2)=0,32051282 K/W`.

**Paso 8: segunda hoja.** `R_g2=0,00427350 K/W`.

**Paso 9: película exterior.** `R_o=1/(40×1,2)=0,0208333 K/W`.

**Paso 10: serie.** `R_total=0,0833333+0,0042735+0,3205128+0,0042735+0,0208333=0,4332265 K/W`.

**Paso 11: salto térmico.** `ΔT=20−(−10)=30 K`; el estudiante debe practicar la resta de un número negativo.

**Paso 12: potencia transferida.**

\[
\dot Q=\frac{30\ \mathrm K}{0.4332265\ \mathrm{K/W}}=69.2478\ \mathrm W\approx69.2\ \mathrm W.
\]

**Paso 13: temperatura del vidrio en la cara interior.** `T_s,i=T_inf,i−Qdot R_i=20−69,2478×0,0833333=14,2293 °C`.

**Paso 14: temperaturas de interfaces sucesivas.** Restar `Qdot×R` en el recorrido: después de vidrio 1 `≈13,9334 °C`; después del hueco de aire `≈−8,2614 °C`; después de vidrio 2 `≈−8,5573 °C`; al superar película exterior se llega a `−10 °C`. El motor debe calcularlas sin guardar temperaturas prefijadas.

**Paso 15: balance.** Cada tramo transporta los mismos `≈69,25 W` en serie. La suma de caídas `Σ(Qdot R_j)` tiene que ser **30 K** dentro de tolerancia.

**Paso 16: interpretación.** La mayor resistencia del preset es el aire del hueco (≈74,0 % del total), por eso una cámara estanca disminuye el intercambio bajo las hipótesis del ejercicio.

### Simulador C — «Ventana multicapa»

- **Controles:** dimensiones; `h_i,h_o`; espesores y conductividades de ambos vidrios y cámara; `T_inf_i`, `T_inf_o`. **Botón Restaurar Ejemplo 3-3**.
- **Escena:** corte lateral 2D/3D técnico con cinco bandas/resistencias etiquetadas y nodos térmicos; escala de temperatura y barras proporcionales a resistencia.
- **Gráficos:** `T(x)` con segmentos de pendiente distinta en cada medio sólido y **saltos de temperatura en las resistencias convectivas** como elementos de borde; diagrama `R` acumulada con `T(R)=T_inf_i−Qdot R`; potencia frente al espesor.
- **Variación guiada:** aumentar *solo* el espesor de cámara a `L_air=0,020 m` reduce `Qdot` a ≈`39,80 W` **según el modelo de conducción pura**. La interfaz debe advertir: «En cámaras más anchas podría aparecer convección natural; este modelo deja de ser automáticamente representativo» y permitir volver al valor de referencia.
- **Preguntas:** ¿cuál resistencia domina? ¿qué ocurre con `R_i` al duplicar `h_i`? ¿por qué la temperatura interior del vidrio está por debajo de la del aire de la habitación?
- **Alertas:** no contar cuatro resistencias cuando en realidad hay **cinco**; no sumar radiación dos veces; no crear automáticamente interpolaciones de propiedades no disponibles.

---

## 6.5. CASO `TC-C04`: Tiempo de respuesta de un termopar

**Referencia:** datos del **Ejemplo 4-1**, cap. 4, pp. 222–223. **Nivel:** intermedio-alto. **Principio:** sistema de capacidad concentrada cuando `Bi << 0,1` con `L_c=V/A_s`, solución exponencial de balance de energía.

### Datos originales del libro

| Variable | Valor | Unidad | Nota |
|---|---:|---|---|
| `D` | 1 | mm | Diámetro de unión esférica; convertir a `0,001 m` |
| `k` | 35 | W/(m·K) | Conductividad del material de unión |
| `rho` | 8500 | kg/m³ | Densidad |
| `cp` | 320 | J/(kg·K) | Calor específico |
| `h` | 210 | W/(m²·K) | Coeficiente convectivo gas–unión |
| `target` | 99 | % | Porcentaje de respuesta al cambio térmico |
| `T_initial` | 0 | °C | **Ilustración numérica usada por el texto** |
| `T_gas` | 100 | °C | **Ilustración numérica usada por el texto** |

### Desarrollo completo

**Paso 1: pregunta física.** Una unión pequeña detecta rápido un cambio brusco de temperatura, pero su temperatura no salta instantáneamente a la del gas. Deseamos el tiempo para recorrer el **99 % del salto inicial**.

**Paso 2: modelo de energía.** Para el sólido con temperatura interna uniforme: `rho V cp (dT/dt)=h A_s(T_gas−T)`. Es un balance de almacenamiento frente a convección; **no** es la ecuación para un sólido con gradientes interiores grandes.

**Paso 3: geometría de esfera.** `V=πD³/6`; `A_s=πD²`; por tanto `L_c=V/A_s=D/6`.

**Paso 4: conversión.** `D=1 mm=0,001 m`; `L_c=0,001/6=0,000166667 m`.

**Paso 5: Biot.**

\[
Bi=\frac{hL_c}{k}=\frac{210(0.000166667)}{35}=0.0010.
\]

**Paso 6: evaluar régimen.** `Bi=0,001 <0,1`; el modelo concentrado es apropiado en este preset. Si al modificar `D`, `h`, `k` el valor supera el criterio, **bloquear la fórmula concentrada como solución válida** y recomendar un modelo transitorio distribuido.

**Paso 7: separar variables.** A partir de `dT/dt=[h/(rho cp L_c)](T_gas−T)`, integrar desde `T_i` hasta `T(t)` y desde `0` hasta `t`. Se obtiene

\[
\frac{T(t)-T_{gas}}{T_i-T_{gas}}=e^{-bt},\qquad b=\frac{h}{\rho c_p L_c}.
\]

**Paso 8: calcular `b`.**

\[
b=\frac{210}{8500(320)(0.001/6)}\approx0.4632353\ \mathrm{s^{-1}}.
\]

**Paso 9: traducir «99 %».** Si respondió `99 %`, falta `1 %` de la diferencia inicial: `f_remanente = 1−0,99 = 0,01`.

**Paso 10: despeje logarítmico.** `0,01=exp(−bt)` ⇒ `ln(0,01)=−bt` ⇒ `t=−ln(0,01)/b`.

**Paso 11: resultado.** `t≈9,9413 s ≈10 s` (redondeo del libro). Constante de tiempo `tau=1/b≈2,1587 s`.

**Paso 12: ilustración de temperaturas.** Para `T_i=0°C` y `T_gas=100°C`, a `t≈9,9413 s` se cumple `T(t)=100+(0−100)×0,01=99°C`.

**Paso 13: validar límites.** En `t=0`, `T=T_i`; cuando `t→∞`, `T→T_gas`. Si `h` aumenta con todo lo demás constante, el proceso es más rápido; si `rho` o `cp` aumenta, más lento.

**Paso 14: informar precisión.** La conducción por alambres y la radiación se desprecian en el ejercicio; en instrumentación real pueden afectar la respuesta.

### Simulador D — «Termopar y capacidad concentrada»

- **Controles:** diámetro, `k`, `rho`, `cp`, `h`, `T_i`, `T_gas`, meta de respuesta `target` (de 50 % hasta menos de 100 %), tiempo de reproducción.
- **Escena:** esfera pequeña bañada por flujo de gas, temperatura y cambio de color; si el tamaño del objeto se altera, la masa y área deben actualizarse usando geometría real.
- **Gráficos:** `T(t)` analítico, línea horizontal `T_gas`, banda del porcentaje objetivo, `Bi` en etiqueta y `tau`.
- **Variación guiada:** si `D=2 mm` manteniendo los demás datos (modificación del estudiante), `Bi=0,002` y el tiempo para 99 % aumenta a `≈19,8826 s`. Toda la expresión de `L_c`, `b`, `tau` y el logaritmo cambia.
- **Alertas:** `target=100 %` implica tiempo matemático infinito y **no** debe generarse `ln(0)`; temperaturas válidas; dimensión `D>0`; `Bi≥0,1`; no confundir un factor restante de `0,01` con `1 %` de temperatura absoluta.

---

## 6.6. CASO `TC-C05`: Diseño de intercambiador de calor a contraflujo

**Referencia:** datos del **Ejemplo 11-4**, capítulo 11, pp. 628–629; el mismo caso se revisa en el **Ejemplo 11-8** con el método efectividad–NTU (pp. 639–640). **Nivel:** avanzado. **Principios:** primera ley para volúmenes de control, balance en ambas corrientes, capacidad calorífica y **diferencia de temperatura media logarítmica (LMTD)**.

### Datos originales del libro

| Variable | Valor | Unidad | Significado |
|---|---:|---|---|
| `m_c` | 1,2 | kg/s | Caudal másico corriente fría |
| `cp_c` | 4,18 | kJ/(kg·K) | Calor específico de agua fría |
| `Tc_in` | 20 | °C | Entrada fría |
| `Tc_out_target` | 80 | °C | Salida fría requerida |
| `m_h` | 2 | kg/s | Caudal másico de agua geotérmica |
| `cp_h` | 4,31 | kJ/(kg·K) | Calor específico de fluido caliente |
| `Th_in` | 160 | °C | Entrada caliente |
| `D_inner` | 1,5 | cm | Diámetro del tubo delgado; convertir a 0,015 m |
| `U` | 640 | W/(m²·K) | Coeficiente global, referido al área de intercambio |
| `flow_mode` | Contraflujo | — | Configuración requerida |

**Objetivos:** dimensionar la longitud necesaria para calentar agua de 20 a 80 °C; mostrar físicamente por qué el tubo simple resulta muy largo; evaluar qué cambiaría con otro `U`, diámetro o caudal. **No** usar temperaturas de salida inventadas: deben resultar del balance, o ser un objetivo explícito como el `Tc_out_target`.

### Desarrollo completo

**Paso 1: esquema.** Dos corrientes fluyen en sentidos opuestos separadas por una pared delgada. La corriente geotérmica entra a 160 °C y cede energía; la corriente fría entra a 20 °C y alcanza 80 °C.

**Paso 2: supuestos.** Estacionario, sin pérdidas exteriores, sin cambio de fase, calores específicos constantes, sin trabajo, sin incrustación, variaciones de energía cinética/potencial despreciables, `U` uniforme, resistencia de pared despreciable según el enunciado.

**Paso 3: convertir antes de usar.** `cp_c=4180 J/(kg·K)`; `cp_h=4310 J/(kg·K)`; `D=0,015 m`.

**Paso 4: capacidad calorífica de corrientes.** `C_c=m_c cp_c=1,2×4180=5016 W/K`; `C_h=m_h cp_h=2×4310=8620 W/K`.

**Paso 5: potencia requerida por el agua fría.**

\[
\dot Q=C_c(T_{c,out}-T_{c,in})=5016(80-20)=300960\ \mathrm W=300.96\ \mathrm{kW}.
\]

**Paso 6: balance en caliente.** Sin pérdidas, `Qdot=C_h(Th_in−Th_out)`.

**Paso 7: despeje temperatura caliente de salida.**

\[
T_{h,out}=T_{h,in}-\frac{\dot Q}{C_h}=160-\frac{300960}{8620}=125.08585\ ^\circ\mathrm C.
\]

**Paso 8: definir extremos para contraflujo.** `ΔT_1 = Th_in−Tc_out=160−80=80 K`; `ΔT_2=Th_out−Tc_in=125,08585−20=105,08585 K`. Elegir consistentemente extremos opuestos del equipo.

**Paso 9: comprobar que no existe cruce térmico local en los extremos.** Ambos saltos son mayores que cero. Si uno vale cero o es negativo, el problema deja de admitir una solución finita de LMTD para esa meta con este modelo.

**Paso 10: deducir sentido de LMTD.** La fuerza impulsora térmica no es uniforme a lo largo del equipo. Integrando `dQdot = U (Th−Tc) dA` bajo hipótesis constantes se obtiene

\[
\Delta T_{lm}=\frac{\Delta T_2-\Delta T_1}{\ln(\Delta T_2/\Delta T_1)}.
\]

**Paso 11: calcular media logarítmica.**

\[
\Delta T_{lm}=\frac{105.08585-80}{\ln(105.08585/80)}\approx91.97345\ \mathrm K.
\]

**Paso 12: área requerida.** `Qdot = U A ΔT_lm` ⇒ `A=Qdot/(U ΔT_lm)`.

**Paso 13: sustituir.**

\[
A=\frac{300960}{640(91.97345)}\approx5.11289\ \mathrm{m^2}.
\]

**Paso 14: geometría de tubo delgado.** `A=πDL` ⇒ `L=A/(πD)`.

**Paso 15: longitud.** `L=5,11289/[π(0,015)]≈108,50 m ≈109 m` (redondeo del libro).

**Paso 16: verificar energía.** Caliente pierde `8620(160−125,08585)=300960 W`, igual al calor recibido por el frío.

**Paso 17: verificar dimensiones.** `A: W /[(W/(m²K)) K] = m²`; `L: m²/m = m`.

**Paso 18: interpretación ingenieril.** Más de 100 m de longitud para un solo tubo es poco práctico; el curso debe comparar conceptualmente configuraciones compactas o de múltiples pasos. El módulo no debe inventar el número de tubos ni su precio.

**Paso 19: vínculo de profundización.** Con `C_min=5016 W/K`, `C_max=8620 W/K`, `C_r≈0,58190`; `Qmax=C_min(160−20)=702240 W`; `efectividad=300960/702240≈0,42857`. La pestaña «Método NTU» resolverá el mismo estado con fórmula de contraflujo y deberá recuperar un área coherente con LMTD dentro de tolerancias.

### Simulador E — «Intercambiador de doble tubo a contraflujo»

- **Controles:** caudales, temperaturas de entrada, temperatura objetivo de salida fría, `cp` de ambas corrientes, `U`, diámetro, modo contraflujo (preset bloqueado para la comparación libro); selector alternativo paralelo solo si se implementa su fórmula correctamente.
- **Escena:** tubería coaxial cutaway con fluidos en direcciones opuestas; callouts `T_in/T_out`, colores relativos, flechas; indicador de área de transferencia, longitud del tubo y potencia.
- **Gráficos:** perfiles de temperaturas de corriente caliente/fría según área axial (con modelo de capacidad constante y balance distribuido), diferencias de extremo, `ΔT_lm`, curvas de `L(U)` y de efectividad frente a `NTU`.
- **Variación guiada:** si `U=800 W/(m²·K)` pero las temperaturas requeridas y los caudales permanecen iguales, `A≈4,09031 m²` y `L≈86,7991 m` (en lugar de 108,50 m). Los balances energéticos deben permanecer iguales en este problema **de dimensionamiento por temperatura objetivo**.
- **Régimen inválido:** si `Th_in ≤ Tc_out_target` o `Th_out ≤ Tc_in`, no mostrar una longitud positiva inventada. Explicar que el estado propuesto viola el acercamiento térmico para esta configuración.
- **Numerología prohibida:** no asumir que la diferencia de temperatura media es una simple media aritmética; no interpretar `cp_h` de agua geotérmica como `cp_c`; no invertir temperaturas finales según la configuración.

---

# 7. BANCO DE ACTIVIDADES DERIVADAS (SIN REEMPLAZAR LOS CINCO CASOS)

Para que el aprendizaje no sea una sucesión de solo cinco respuestas memorizables, cada caso proporciona **cuatro capas de práctica** creadas alrededor de los números del ejemplo original:

1. **Práctica idéntica al libro**: resolver con los datos fuente; botón restaurar; comparación con resultado base.
2. **Práctica de un solo cambio**: modificar una entrada controlada e identificar el impacto sobre cada fórmula y conclusión.
3. **Práctica inversa de diseño**: por ejemplo determinar `L` para una potencia objetivo, calcular `k` requerido, despejar `epsilon`, deducir espesor de aislación, o determinar `U` máximo/minimo para un área disponible. Estos son **ejercicios derivados propios**, no ejemplos adicionales del libro.
4. **Modo certamen cronometrable local**: enunciado y formulario de resolución sin ver pizarra hasta que el estudiante lo solicite; evaluación por método, unidades, sustitución, resultado e interpretación, no únicamente por número final.

## 7.1. Ruta de evaluación del alumno

| Hito | Lo que se comprueba | Caso principal | Evidencia mínima |
|---|---|---|---|
| A | Entiende diferencia entre energía y potencia | C01 | Reconoce `W`, `kW`, `kWh`; muestra unidades |
| B | Separa mecanismos simultáneos | C02 | Calcula `Q_conv` y `Q_rad` sin convertir mal temperaturas |
| C | Construye circuito de resistencias | C03 | Identifica 5 resistencias y 5 caídas asociadas |
| D | Decide si modelo transitorio simplificado es aplicable | C04 | Calcula `Bi` antes de resolver tiempo |
| E | Resuelve balances acoplados de un equipo industrial | C05 | Conserva energía y valida acercamiento térmico |

**Rúbrica por ejercicio (100 puntos):** comprensión/diagrama 10; datos y unidades 15; selección del modelo y supuestos 15; desarrollo algebraico 15; sustitución y cálculo 20; verificación 15; interpretación 10. Permitir respuestas equivalentes y tolerancias numéricas; no castigar diferente redondeo físicamente correcto.

## 7.2. Conexiones con teoría que deben existir, sin crear más casos principales

La vista **Cátedra de transferencia de calor** mantendrá todas las unidades del libro: Fourier, ecuación de difusión, generación interna, cilindros/esferas, aletas, aislamiento, Biot/Fourier, diferencias finitas, Reynolds/Prandtl/Nusselt/Rayleigh, convección forzada y natural, ebullición/condensación, LMTD/NTU, radiación, factores de visión y transferencia de masa como ampliación. Cada página de teoría tendrá una frase que indique **qué caso la utiliza** y qué futuros problemas podrían agregarse. No atribuir a la cátedra de MEC110 una asignatura nueva que no figure en el plan real.

---

# 8. SIMULADORES: COMPORTAMIENTO CIENTÍFICO OBLIGATORIO

## 8.1. Interacción unificada de las cinco pantallas

**Diagrama de estados:** `presetOriginal → validarEntradas → calcularDependencias → comprobarDominio → emitirResultado → renderizarPizarra+Escena+Gráficos → permitirExportar`. Cualquier control editado genera una nueva versión del resultado; el estado anterior no se muestra como vigente.

El slider controla entradas **reales**, no posiciones cosméticas. Cambiar `L` del techo exige recalcular `Q`, `E`, costo y curva; cambiar `epsilon` exige modificar radiación y total; cambiar `k_air` altera las cinco caídas y temperaturas de interfaz; cambiar `h` del termopar altera Bi, tau y tiempos; cambiar `U` cambia área y longitud del intercambiador.

**Comportamiento al actualizar:**

- Mostrar valor actual, unidad, rango válido, sugerencia y origen («dato del ejemplo», «modificado por estudiante»).
- Mostrar flechas/marcas en el campo que cambió y **destacar en la pizarra las líneas recalculadas**.
- Conservar precisión numérica interna (doble precisión), redondear al visualizar; permitir «mostrar más decimales».
- No dejar «resultado antiguo» debajo de un preset nuevo o un valor inválido. Ante error: congelar animación y mostrar diagnóstico claro.
- Mantener una sola fuente de verdad matemática. El dibujo **consume** resultados del motor, nunca calcula independientemente.
- Permitir reproducir animación, pausa, avance de paso, exportación de solución y **Restaurar datos del libro**.

## 8.2. Requisitos visuales por laboratorio

| Caso | Ilustración técnica | Gráficos sincronizados | Resultado en callouts |
|---|---|---|---|
| C01 | Cubierta con sección transversal y flechas de Fourier | `T(x)`, `Q(L)`, energía-tiempo | `k`, `L`, `ΔT`, `Qdot`, costo |
| C02 | Superficie expuesta a aire y paredes circundantes | Curva `Q(T_s)`, barras conv/rad | `h`, `ε`, `T_K`, `Qconv/Qrad` |
| C03 | Doble vidrio en corte con sus cinco resistencias | `T(x)` y `T(R)` | `R_i,R_g,R_gap,R_g,R_o`, `Qdot` y nodos |
| C04 | Esfera termopar y gas con lectura dinámica | `T(t)` y umbral objetivo | `Bi`, `tau`, `t_99`, `T(t)` |
| C05 | Intercambiador coaxial a contraflujo, flechas opuestas | `T_c(x)`, `T_h(x)`, `L(U)`, LMTD | `m`, `cp`, `Qdot`, `T_out`, `A`, `L` |

Los mapas de color muestran magnitud o temperatura **con leyenda numerada**. Nunca presentar un campo 3D/CFD como si hubiera sido resuelto a partir de Navier–Stokes si el simulador está usando un circuito de resistencias o una expresión analítica. Vistas SVG cutaway son suficientes cuando representan fielmente el modelo.

## 8.3. «Pizarra del Profesor»: contrato por nodo

Cada línea de cálculo debe tener:

```ts
type CalculationStep = {
  id: string;
  position: number;
  label: string;                 // Ej. «Resistencia del aire»
  law: string;                   // Ley física de origen
  why: string;                   // Explicación breve entendible
  formulaLatex: string;          // Simbólica y legible
  substitutionLatex: string;     // Valores actuales, no texto fijo
  value: number | null;          // Resultado antes de redondear
  unit: string;
  dependencies: string[];        // Nodos de los que depende
  assumptions: string[];
  validity: 'ok'|'warning'|'blocked';
  errorCode?: string;
};
```

La fórmula simbólica siempre está visible en modo explicación, pero puede mantenerse oculta al comenzar una prueba. Para las variables introducir diccionario emergente: nombre, significado físico, unidades, valor actual, signo, procedencia. Cualquier fórmula larga admite «¿cómo se despejó?» con pasos algebraicos expandibles.

## 8.4. Esquema de datos interoperable

```ts
type Parameter = {
  id: string;
  label: string;
  value: number;
  unit: string;
  domain: { min?: number; max?: number; minExclusive?: boolean; maxExclusive?: boolean };
  source: 'book_preset'|'student_modified';
  explanation: string;
};
type SourceReference = {
  author: 'Yunus A. Çengel';
  title: 'Transferencia de calor y masa: un enfoque práctico';
  edition: '3.ª';
  chapter: number;
  exampleId: string;
  printedPages: string;
  pdfPages: string;
};
type ExerciseCase = {
  id: 'TC-C01'|'TC-C02'|'TC-C03'|'TC-C04'|'TC-C05';
  title: string;
  difficulty: 1|2|3|4|5;
  source: SourceReference;
  premise: string;
  assumptions: string[];
  inputs: Record<string, Parameter>;
  result: Record<string, number | string | null>;
  steps: CalculationStep[];
  checks: { id: string; passed: boolean; explanation: string }[];
  visualization: { type: string; nodeIds: string[]; chartIds: string[] };
  status: 'valid'|'warning'|'invalid';
};
```

**Separar fuente de datos y origen de formulación:** `source.exampleId` identifica qué datos y caso se consultaron; las derivaciones y la redacción de la plataforma son originales. Guardar historial temporal de acciones del estudiante **solo con consentimiento y política de privacidad**; el motor de cálculo debe poder ejecutarse sin cuenta.

---

# 9. MOTOR DE CÁLCULO: FÓRMULAS, ERRORES Y PRUEBAS DE REFERENCIA

## 9.1. Algoritmo recomendado por caso

```ts
function evaluateCase(input: ExerciseCase['inputs']): Evaluation {
  // 1) Convertir toda entrada SI a unidades canónicas.
  // 2) Validar finitud, dominio, geometría, signos y restricciones de modelo.
  // 3) Resolver nodos en orden topológico con operaciones numéricas puras.
  // 4) Generar paso LaTeX por nodo desde datos, no desde strings precalculados.
  // 5) Aplicar auditoría dimensional, balances y límites.
  // 6) Publicar un único objeto inmutable de estado para UI y gráficas.
  // 7) Si algo falla, entregar error explicativo sin fingir convergencia.
}
```

**C01** `A=a*b; deltaT=Tsi-Tse; Qdot=k*A*deltaT/L; kW=Qdot/1000; EkWh=kW*tHours; cost=EkWh*unitCost`. Temperaturas pueden invertirse: `Qdot` firmado; pérdida monetaria por módulo o interpretación contextual explícita.

**C02** `TsK=TsC+273.15; TsurK=TsurC+273.15; conv=h*A*(TsC-TairC); rad=eps*sigma*A*(TsK**4-TsurK**4); total=conv+rad`. No etiquetar los términos como **pérdida** si el signo es negativo; decir ganancia neta.

**C03** `A=H*B; R=[1/(hi*A),Lg1/(kg1*A),Lgap/(kgap*A),Lg2/(kg2*A),1/(ho*A)]; Rt=sum(R); Q=(Tin-Tout)/Rt; states=[Tin]; for r of R: states.push(states[-1]-Q*r)`. Chequear `states[-1]≈Tout`, y que potencia idéntica atraviesa cada tramo; si `Lgap` cambia suficientemente como para afectar hipótesis, advertir.

**C04** `Lc=D/6; Bi=h*Lc/k; if Bi>=0.1 → invalid_lumped; b=h/(rho*cp*Lc); tau=1/b; f=1-target/100; time=-ln(f)/b; T(t)=Tgas+(Ti-Tgas)*exp(-b*t)`; si `target=100`, informar límite infinito, no un número `NaN`.

**C05** `Cc=mc*cpc; Ch=mh*cph; Q=Cc*(Tcout-Tcin); Thout=Thin-Q/Ch; dt1=Thin-Tcout; dt2=Thout-Tcin; valid=dt1>0 && dt2>0 && Q>=0; lmtd=logMean(dt1,dt2); A=Q/(U*lmtd); L=A/(pi*D)`; usar `logMean` estable cuando los dos extremos son casi iguales: `LMTD≈dt1≈dt2`.

## 9.2. Matriz de regresión de valores base calculados de forma independiente

| Caso | Magnitudes de salida en preset | Referencia verificable y redondeo |
|---|---|---|
| C01 | `A=48 m²`, `Qdot=1689,6 W`, `E=16,896 kWh`, `costo=1,35168 USD` | Ej. 1-5 imprime ≈1690 W, 16,9 kWh, 1,35 USD |
| C02 | `Qconv=86,4 W`, `Qrad≈81,84 W`, `Qtotal≈168,24 W` | Ej. 1-10 imprime ≈86,4 W, ≈81,7 W, ≈168 W; varía por constantes/redondeos |
| C03 | `Rt≈0,43322650 K/W`, `Qdot≈69,24784 W`, `Tsuperficie_i≈14,22935 °C` | Ej. 3-3 imprime ≈0,4332 K/W, ≈69,2 W, ≈14,2 °C |
| C04 | `Bi=0,001`, `b≈0,4632353 s⁻¹`, `t99≈9,94132 s` | Ej. 4-1 imprime ≈0,001, ≈0,462 s⁻¹, ≈10 s |
| C05 | `Qdot=300960 W`, `Thout≈125,08585 °C`, `LMTD≈91,97345 K`, `A≈5,11289 m²`, `L≈108,50 m` | Ej. 11-4 imprime ≈301 kW, ≈125 °C, ≈91,9 K, ≈5,12 m², ≈109 m |

**Tolerancias sugeridas:** caso base potencia/temperatura `rtol=1e-7, atol=1e-8` con valores calculados de forma independiente; comparación con tablas/resultados redondeados de libro utilizar tolerancia coherente con cifras impresas y **registrar diferencias esperadas**. En cada corrida comprobar invariantes y unidades, no solo valores finales.

## 9.3. Pruebas de variaciones y límites

| Caso | Cambio controlado | Afirmación que debe cumplir |
|---|---|---|
| C01 | Duplicar `L` | `Qdot` y `E` caen a la mitad si lo demás es constante |
| C01 | Invertir `Tsi` y `Tse` | Cambia signo, flechas y descripción, pero magnitud es igual |
| C02 | `epsilon=0` | `Qrad=0` sin afectar `Qconv` |
| C02 | `Ts=Tair=Tsur` | Todas las potencias netas son cero |
| C03 | Eliminar efecto de película con `hi→∞` | `Ri→0`, caída de cara interior se aproxima a 0 |
| C03 | Variar `Lgap` | Se recalculan las cinco temperaturas de nodo, no solo `Qdot` |
| C04 | `Bi≥0,1` | Advertencia o bloqueo científico del modelo concentrado |
| C04 | `target→100 %` | `t→∞`; nunca `NaN` ni valor finito fabricado |
| C05 | Incrementar `U` manteniendo temperaturas objetivo | `Qdot` no cambia; `A` y `L` disminuyen |
| C05 | Acercamiento térmico ≤0 | No resolver con LMTD como si fuera válido |

## 9.4. Redondeo y trazabilidad

- **Fuente primaria para presets:** Çengel 3.ª edición, números de los cinco ejemplos identificados. Anotar en el código página impresa y de PDF y quién verificó la extracción.
- **Constantes de referencia:** usar `σ=5.670374419e-8` del SI (no los 5.67e-8 redondeados del libro); guardar `sourceValue` cuando el texto da constante más corta.
- **Unidades canónicas internas:** m, m², W, J, s, K para temperaturas absolutas y K para diferencias; `c_p` en J/(kg·K); `h` W/(m²·K), `U` W/(m²·K).
- **Presentación:** permitir ingresar °C, mm, cm, kJ/kg K, kW y h; convertir a SI bajo una capa explícita que aparezca en la pizarra.
- **Colisiones de nombres:** `k` conductividad, `σ` Stefan–Boltzmann, `b` tasa de enfriamiento y `U` coeficiente global; no reutilizarlos en distintos significados dentro del mismo cálculo.
- **Independencia:** el motor no importa Canvas/React; la UI no realiza operaciones de termodinámica en los componentes de presentación.

---

# 10. ESPECIFICACIÓN DE INTERFAZ PARA «FLUIDOTERMO LAB»

## 10.1. Navegación sin romper el resto

```text
FluidoTermo Lab
├── Mecánica de Fluidos                   [conservar intacta]
├── Termodinámica                        [conservar intacta]
├── Transferencia de Calor               [módulo nuevo]
│   ├── Aprender la materia              [teoría de capítulos 1–13]
│   ├── Taller de Certamen               [5 casos del libro, fácil → avanzado]
│   ├── Simuladores                      [5 laboratorios vinculados a 5 casos]
│   ├── Formulario / Diccionario         [leyes, variables, unidades y dominios]
│   ├── Tu progreso                      [opcional y privado]
│   └── Bibliografía y método            [fuente, supuestos y origen de cifras]
└── Acceso y Administración              [capa futura, independiente]
```

**Regla de arquitectura:** separar `subjectId`, `lessonId` y `exerciseId`; no vincular una vista a nombres de archivos hardcodeados. Al cambiar de asignatura no perder el trabajo que ya está guardado localmente en el módulo activo (si el usuario autorizó persistencia).

## 10.2. Lenguaje visual profesional

- **Superficie:** laboratorio científico oscuro `#0a1120` / `#0f172a`, tarjetas azul pizarra `#142236`, bordes discretos; tipografía legible y fórmulas MathJax/KaTeX.
- **Asignatura:** marca «Transferencia de Calor» con acentos ámbar/teal; no mezclar colores físicos con categorías: usar escala térmica azul→rojo **siempre acompañada de valores y unidades**.
- **Barra principal:** asignaturas, ruta «Teoría / Certámenes / Laboratorios», progreso, búsqueda y menú para accesibilidad.
- **Escritorio:** esquema a la izquierda; inputs a la derecha; abajo gráfica y **Pizarra del Profesor** expandible con pasos seleccionables.
- **Móvil:** componentes apilados; botones táctiles; no esconder el resultado detrás de un hover; slider con campo numérico alternativo.
- **Accesibilidad:** WCAG 2.2 AA objetivo, teclado, textos alternativos de simulaciones, colores complementados por etiquetas, reducción de movimiento y foco visible.
- **Rendimiento:** throttling/debounce visual con resultados correctos; animación `requestAnimationFrame`, fórmulas memoizadas y offscreen para cálculos complejos; sin enviar datos personales a servicios externos por defecto.

## 10.3. Modo certamen genuino

Primero se ve: situación, esquema, datos, incógnita, calculadora simple, formulario de procedimiento. El estudiante puede introducir `ΔT`, `A`, `Qdot`, etc. y pulsar «Comprobar este paso». La app evalúa **unidades y razonamiento**, entrega pistas progresivas sin revelar solución completa a la primera, y luego permite «Ver desarrollo del profesor». Se pueden revisar errores típicos y reconstruir de dónde salió cada fórmula.

---

# 11. CRITERIOS DE ACEPTACIÓN (DEFINICIÓN DE «TERMINADO»)

**No afirmar que el módulo está completo hasta superar estos controles:**

- [ ] Navegación a transferencia de calor añadida sin romper Mecánica de Fluidos ni Termodinámica.
- [ ] Las clases de teoría principales están navegables, con fórmulas, definiciones, unidades y advertencias de validez.
- [ ] Existen **exactamente cinco casos principales** con los datos correctos y fuente de cada uno.
- [ ] El botón «Restaurar datos del libro» restituye todos los inputs de cada caso.
- [ ] Cada caso contiene un mínimo de 12 pasos matemáticos y explicaciones sin fórmulas ocultas.
- [ ] Al mover controles se actualizan **todos** los resultados, sustituciones, escenas y curvas.
- [ ] Ningún caso usa valores «de demostración» fingiendo que provinieron del libro; las variantes se rotulan.
- [ ] C01 reproduce ≈1,69 kW; C02 ≈168 W; C03 ≈69,2 W; C04 ≈10 s; C05 ≈109 m.
- [ ] C02 nunca evalúa `T^4` con °C y C04 valida Bi antes de utilizar su aproximación.
- [ ] C03 calcula cinco resistencias y C05 comprueba aproximación térmica y balances de masa/energía.
- [ ] Todas las fórmulas tienen unidades, definiciones, hipótesis y mecanismo físico.
- [ ] Funcionan los modos «Comenzar desde cero», «Practicar guiado», «Certamen», «Explorar simulador».
- [ ] Tests de regresión de módulos antiguos, unitarios del motor y pruebas visuales pasan.
- [ ] Las figuras son propias y **no** se sirve públicamente el PDF original ni tablas/figuras completas protegidas.

---

# 12. PLAN DE IMPLEMENTACIÓN PARA IA CON LÍMITE DE TOKENS

La primera experiencia previa con Google AI Studio produjo errores de límite de tokens. Por ello **no pegar este documento completo como un único mensaje en una sesión saturada**. Usarlo como contrato de referencia en archivo del proyecto y trabajar en 7 entregas **pequeñas** y verificables:

1. Auditoría del repositorio y arquitectura de asignaturas; preservación de módulos existentes.
2. Motor científico sin UI, tipos, conversión SI, tests de cinco casos base.
3. Componentes reutilizables de pizarra, fuente bibliográfica, slider, diagnóstico y gráficos.
4. Teoría y laboratorio C01 + C02, validación de cálculos y accesibilidad.
5. Laboratorio C03 + C04, resaltando resistencias y límite Biot.
6. Laboratorio C05 + modo de certamen y balance de energía.
7. Integración, regresiones, optimización móvil, pruebas automáticas, documentación y entrega.

**Cada fase:** la IA debe inspeccionar código existente, modificar el mínimo número de módulos, aportar lista de archivos, ejecutables de prueba, valores verificados, pendientes y errores; nunca declarar «todo listo» sin evidencia. No crear autenticación ni base de datos sin que el usuario lo solicite en la fase de administración.

---

# 13. REFERENCIAS, LÍMITES DE REUTILIZACIÓN Y FUENTES

- **Fuente principal:** Çengel, Yunus A., *Transferencia de calor y masa: un enfoque práctico*, **3.ª ed.**, McGraw-Hill, 2007. Documento aportado por el usuario. Ubicaciones: Ej. 1-5 p. 19; Ej. 1-10 p. 31; Ej. 3-3 pp. 140–141; Ej. 4-1 pp. 222–223; Ej. 11-4 pp. 628–629, con PDF página impresa+26. Las lecciones teóricas se sustentan en capítulos 1–13 y el capítulo 14 amplía transferencia de masa.
- **Complemento conceptual:** Çengel y Boles, *Termodinámica*, 7.ª ed., otro archivo aportado. Se utiliza para vincular balances de energía y propiedades; no se reproducen ejercicios adicionales aquí.
- **Diferencia entre fuente y producción propia:** los **datos base** de cinco casos se recuperaron del texto aportado, los desarrollos pedagógicos y el diseño de simulaciones son una **elaboración original** a partir de principios físicos. Las cifras más precisas proceden de recálculo independiente con fórmulas y constantes indicadas.
- **Para difundir la web:** citar bibliografía, redactar enunciados propios, crear esquemas propios y verificar permiso/licencia antes de redistribuir tablas, figuras, problemas completos, fotografías o el PDF. Una referencia al libro no concede derechos de reproducción.

**Aspectos que conviene personalizar o verificar:** nombre definitivo de la asignatura según malla de la universidad; versión real del código que se integrará; permisos de uso de figuras y propiedades; límites de sliders tras validación científica; tolerancias acordadas para evaluación, y si el modo certamen guardará progreso sin autenticación o mediante una futura cuenta.
