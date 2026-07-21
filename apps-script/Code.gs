/**
 * RECEPTOR DE DATOS DEL EXPERIMENTO — Google Apps Script
 *
 * Cómo instalarlo (una sola vez, ~10 minutos):
 * 1. Crea una hoja de cálculo nueva en Google Sheets (sheets.google.com).
 * 2. En la hoja: Extensiones → Apps Script. Borra el código de ejemplo
 *    y pega este archivo completo.
 * 3. Botón "Implementar" → "Nueva implementación" → tipo "Aplicación web".
 *      - Ejecutar como: Tú (tu cuenta)
 *      - Quién tiene acceso: "Cualquier usuario"   ← importante
 * 4. Autoriza los permisos cuando lo pida.
 * 5. Copia la URL que termina en /exec y pégala en js/config.js
 *    en ENDPOINT_URL.
 *
 * Cada participante que termina agrega una fila a la pestaña "datos":
 * columnas de resumen listas para análisis + el JSON completo al final.
 */

const NOMBRE_HOJA = "datos";

const COLUMNAS = [
  "fechaRegistro", "id", "grupo", "grupoNombre", "factorFeedback",
  "nombre", "edad",
  "kwhReal1", "costoReal1", "costoMostrado1", "estimacion1", "errorPct1",
  "aparatoTop1", "cuartoTop1", "seguridad1",
  "kwhReal2", "costoReal2", "costoMostrado2", "estimacion2", "errorPct2",
  "aparatoTop2", "cuartoTop2", "seguridad2",
  "cambioConsumoPct", "inicioSesion", "finSesion",
  "jsonCompleto",
];

function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);
    const hoja = obtenerHoja();
    hoja.appendRow([
      new Date(),
      datos.id, datos.grupo, datos.grupoNombre, datos.factorFeedback,
      datos.participante.nombre, datos.participante.edad,
      datos.resumen.kwhReal1, datos.resumen.costoReal1, datos.resumen.costoMostrado1,
      datos.resumen.estimacion1, datos.resumen.errorPct1,
      datos.examen1.aparatoTop, datos.examen1.cuartoTop, datos.examen1.seguridad,
      datos.resumen.kwhReal2, datos.resumen.costoReal2, datos.resumen.costoMostrado2,
      datos.resumen.estimacion2, datos.resumen.errorPct2,
      datos.examen2.aparatoTop, datos.examen2.cuartoTop, datos.examen2.seguridad,
      datos.resumen.cambioConsumoPct, datos.inicioSesion, datos.finSesion,
      JSON.stringify(datos),
    ]);
    return ContentService.createTextOutput("ok");
  } catch (err) {
    // Registrar el error en una pestaña aparte para no perder el envío
    const hojaErr = obtenerHoja("errores");
    hojaErr.appendRow([new Date(), String(err), e && e.postData ? e.postData.contents : ""]);
    return ContentService.createTextOutput("error");
  }
}

function obtenerHoja(nombre) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const nombreFinal = nombre || NOMBRE_HOJA;
  let hoja = libro.getSheetByName(nombreFinal);
  if (!hoja) {
    hoja = libro.insertSheet(nombreFinal);
    if (nombreFinal === NOMBRE_HOJA) {
      hoja.appendRow(COLUMNAS);
      hoja.setFrozenRows(1);
    }
  }
  return hoja;
}
