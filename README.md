# Experimento: percepción del gasto energético en el hogar

Aplicación web autocontenida para el experimento de la maestría (ITSON).
Cada participante recibe una liga, y en una sola sesión pasa por:

**Consentimiento → Juego 1 (recrear su último miércoles) → Cuestionario 1 →
Retroalimentación → Juego 2 (planear su próximo miércoles) → Cuestionario 2 →
Retroalimentación → Envío de datos.**

## Grupos experimentales (por liga)

| Liga | Grupo | Retroalimentación mostrada |
|------|-------|---------------------------|
| `index.html?g=A` | Control | Gasto real calculado |
| `index.html?g=B` | Exagerado | Cifras infladas **+20%** |
| `index.html?g=C` | Atenuado | Cifras reducidas **−20%** (grupo opcional) |

Los **datos guardados siempre son los reales**; el factor solo altera lo que
se muestra en pantalla. El grupo queda registrado en cada envío.

## Estructura del proyecto

```
index.html            Página única con todo el flujo
css/styles.css        Estilos (responsivo: celular y computadora)
js/config.js          ⚙ TODO LO AJUSTABLE: tarifas CFE, aparatos y potencias,
                      fases, grupos, y la URL del receptor de datos
js/engine.js          Motor de cálculo (kWh y pesos, tarifa por escalones)
js/app.js             Flujo de pantallas, juego, exámenes, retroalimentación
apps-script/Code.gs   Receptor de datos para Google Sheets (instrucciones dentro)
docs/especificacion.md  Diseño experimental, hipótesis y modelo de consumo
```

## Puesta en marcha

### 1. Probar en tu computadora
Abre `index.html` en el navegador (doble clic basta). Agrega `?g=B` a la URL
para probar el grupo experimental.

Para reiniciar una sesión de prueba: consola del navegador (F12) →
`localStorage.clear()` → recargar.

### 2. Conectar Google Sheets
Sigue las instrucciones que están al inicio de `apps-script/Code.gs`.
Al final pega la URL `/exec` en `ENDPOINT_URL` dentro de `js/config.js`.
Mientras `ENDPOINT_URL` esté vacía, la app ofrece descargar un archivo JSON
con las respuestas (útil para pruebas).

### 3. Publicar en GitHub Pages
1. Crea un repositorio en GitHub (p. ej. `experimento-energia`).
2. Sube todos los archivos del proyecto.
3. En el repositorio: Settings → Pages → Source: rama `main`, carpeta `/ (root)`.
4. La liga queda como `https://TU-USUARIO.github.io/experimento-energia/`.
5. Manda a cada grupo su liga con el parámetro: `...?g=A` o `...?g=B`.

### 4. Antes de aplicar el estudio
- [ ] Verifica los precios de la tarifa en `js/config.js` contra un recibo CFE real.
- [ ] Ajusta los textos de consentimiento en `js/app.js` (constante `TEXTOS`)
      con los datos de tu comité de ética / director de tesis.
- [ ] Haz un piloto completo con 1–2 personas y revisa que la fila llegue a la hoja.
- [ ] Prepara el *debriefing*: a los grupos B/C se les debe informar al final
      del estudio que sus cifras fueron modificadas (requisito ético estándar
      en experimentos con engaño).

## Datos que recibe el investigador

Cada sesión agrega una fila con: identificador, grupo, participante, kWh y
costo reales de cada juego, cifras mostradas, estimaciones del participante,
error de percepción (%), aparato/cuarto que creyó más gastador, seguridad
(1–5), cambio de consumo entre juegos (%), duración de cada pantalla y el
JSON completo con cada switch, hora y temperatura elegidos.
