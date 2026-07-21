# Especificación del experimento

## Objetivo
Medir cómo la retroalimentación sobre el gasto energético (veraz o alterada)
afecta el comportamiento de consumo y la percepción del gasto en el hogar.

## Diseño
Diseño mixto **2×2 (o 3×2)**: factor entre-sujetos *Grupo* (control /
feedback +20% / feedback −20% opcional) × factor intra-sujetos *Momento*
(Juego 1 vs. Juego 2). n = 10 por grupo.

- **Juego 1 (línea base):** el participante recrea su último miércoles.
- **Retroalimentación:** gasto calculado; en grupos B/C se altera ±20%.
- **Juego 2 (post):** el participante planea su próximo miércoles
  (escenario de planeación con la misma estructura para mantener la
  comparabilidad con el Juego 1).

## Hipótesis

| # | Hipótesis | Variables |
|---|-----------|-----------|
| H1 | La retroalimentación reduce el gasto energético (Juego 2 < Juego 1). | kWh reales juego 1 vs. 2 |
| H2 | Existe un sesgo direccional de percepción, y disminuye tras la retroalimentación. | `errorPct1` vs. `errorPct2` (estimación vs. costo real) |
| H3 | El ajuste de consumo se concentra en los aparatos de mayor gasto (especificidad). | Δ kWh por aparato entre juegos |
| H4 | El feedback exagerado (+20%) produce mayor reducción de consumo que el veraz. | Interacción Grupo × Momento sobre kWh |
| H5 | La segunda estimación se ancla al valor **mostrado**, no al real. | Distancia de `estimacion2` a `costoMostrado1` vs. a `costoReal1` |

## Modelo de consumo

- kWh por aparato = potencia (W) × horas de uso ÷ 1000, sumado por las 4
  fases del día y proyectado al mes (×30.4).
- **Aire acondicionado:** consumo = potencia × horas × ciclo de trabajo del
  compresor, que depende del termostato:
  `duty = 0.35 + (27 − temp) × 0.08`, acotado entre 0.15 y 1.0.
  (A 18 °C el compresor casi no descansa; a 28 °C trabaja poco.)
- **Refrigerador:** carga fija de 1.5 kWh/día (siempre conectado).
- **Semanales** (lavadora, plancha): usos/semana × kWh por uso × 4.35.
- **Costo:** tarifa CFE 1F de verano por escalones (configurable en
  `js/config.js`; verificar contra un recibo real antes del estudio).

## Medidas registradas por participante

- Rutina completa de ambos juegos (cada switch, horas, temperatura, minutos).
- Estimación de costo mensual (pesos), aparato y cuarto percibidos como más
  gastadores, y seguridad (Likert 1–5), antes y después del feedback.
- Consumo real calculado y cifras mostradas (con el factor del grupo).
- Error de percepción: `(estimación − costo real) / costo real × 100`.
- Cambio de consumo: `(kWh2 − kWh1) / kWh1 × 100`.
- Marcas de tiempo de cada pantalla (duración de la sesión y de cada etapa).

## Consideraciones éticas
- Consentimiento informado digital al inicio (nombre, edad, aceptación).
- Los grupos B y C reciben información alterada → se requiere **debriefing**
  al cierre del estudio informando la manipulación y los valores reales.
- Datos identificables (nombre) separables del análisis mediante el `id`.
