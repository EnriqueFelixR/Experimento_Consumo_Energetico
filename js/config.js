// ============================================================
// CONFIGURACIÓN DEL EXPERIMENTO
// Todo lo que un investigador querría ajustar está en este archivo:
// tarifas, aparatos, potencias, fases, grupos y el endpoint de datos.
// ============================================================

const CONFIG = {

  // URL del Web App de Google Apps Script (ver apps-script/Code.gs y README).
  // Mientras esté vacía, la app ofrece descargar los resultados como archivo.
  ENDPOINT_URL: "https://script.google.com/macros/s/AKfycbyh16cRAt3QqDAg-slmlLoEGRYBsICZy5QLG-TThFGYI6oJggseOkDp47_NNC7ZM7w/exec",

  // ----------------------------------------------------------
  // Grupos experimentales. El grupo se asigna por la liga:
  //   index.html?g=A  → control (feedback real)
  //   index.html?g=B  → experimental (+20%)
  //   index.html?g=C  → experimental (−20%)
  // "factor" multiplica TODAS las cifras mostradas en la
  // retroalimentación (los datos guardados siempre son los reales).
  // ----------------------------------------------------------
  GRUPOS: {
    A: { nombre: "control", factor: 1.0 },
    B: { nombre: "exagerado", factor: 1.2 },
    C: { nombre: "atenuado", factor: 0.8 },
  },
  GRUPO_DEFAULT: "A",

  // ----------------------------------------------------------
  // Tarifa CFE 1F (verano, zona con clima cálido extremo — Sonora).
  // Precios por kWh en escalones de consumo MENSUAL, en pesos MXN.
  // AJUSTA estos valores con un recibo real de CFE antes del estudio:
  // los escalones y precios cambian cada año y por temporada.
  // ----------------------------------------------------------
  TARIFA: {
    nombre: "CFE 1F (temporada de verano)",
    escalones: [
      { hastaKwh: 300,      precio: 0.997 },  // básico
      { hastaKwh: 900,      precio: 1.166 },  // intermedio bajo
      { hastaKwh: 2500,     precio: 1.859 },  // intermedio alto
      { hastaKwh: Infinity, precio: 3.099 },  // excedente
    ],
    cargoFijo: 0, // pesos/mes; déjalo en 0 si solo interesa el consumo
  },

  // ----------------------------------------------------------
  // Fases del día. "horas" = duración máxima asignable en esa fase.
  // ----------------------------------------------------------
  FASES: [
    { id: "manana", nombre: "Mañana", rango: "6:00 – 10:00", horas: 4, icono: "🌅" },
    { id: "tarde",  nombre: "Tarde",  rango: "10:00 – 16:00", horas: 6, icono: "☀️" },
    { id: "noche",  nombre: "Noche",  rango: "16:00 – 22:00", horas: 6, icono: "🌆" },
    { id: "sueno",  nombre: "Sueño",  rango: "22:00 – 6:00",  horas: 8, icono: "🌙" },
  ],

  // "fases": si se define, el cuarto solo aparece en esas fases del
  // juego (por defecto aparece en las 4). Se usa para no mostrar
  // cocina/sala/baño de madrugada, y para que "casa" (exterior /
  // seguridad) solo aparezca en la fase de sueño.
  CUARTOS: [
    { id: "recamara", nombre: "Recámara", icono: "🛏️" },
    { id: "sala",     nombre: "Sala",     icono: "🛋️", fases: ["manana", "tarde", "noche"] },
    { id: "cocina",   nombre: "Cocina",   icono: "🍳", fases: ["manana", "tarde", "noche"] },
    { id: "bano",     nombre: "Baño",     icono: "🚿", fases: ["manana", "tarde", "noche"] },
    { id: "casa",     nombre: "Exterior / Seguridad", icono: "🏡", fases: ["sueno"] },
  ],

  // ----------------------------------------------------------
  // Catálogo de aparatos.
  // tipo:
  //   "horas"    → switch + horas de uso dentro de la fase
  //   "ac"       → como "horas" pero además temperatura (el consumo
  //                real depende del termostato vía cicloTrabajo())
  //   "minutos"  → usos cortos (microondas): minutos por fase
  //   "siempre"  → conectado 24 h (refrigerador); no tiene switch
  //   "semanal"  → no es diario; se pregunta usos/semana al final
  // watts = potencia mientras opera. kwhDia / kwhUso para los tipos
  // que no se calculan por horas.
  // ----------------------------------------------------------
  APARATOS: [
    { id: "ac",         nombre: "Aire acondicionado (recámara)", cuarto: "recamara", tipo: "ac", watts: 1200, icono: "❄️",
      tempMin: 16, tempMax: 30, tempDefault: 24 },
    { id: "ventilador", nombre: "Ventilador",         cuarto: "recamara", tipo: "horas",   watts: 75,   icono: "🌀" },
    { id: "cargador",   nombre: "Cargador de celular", cuarto: "recamara", tipo: "horas",  watts: 7,    icono: "🔌" },
    { id: "luzRecamara", nombre: "Luces (recámara)",  cuarto: "recamara", tipo: "horas",   watts: 20,   icono: "💡" },

    // Segundo aire acondicionado, por si el participante también
    // tiene uno en la sala (no todos los hogares lo tienen ahí)
    { id: "ac_sala",    nombre: "Aire acondicionado (sala)", cuarto: "sala", tipo: "ac",    watts: 1200, icono: "❄️",
      tempMin: 16, tempMax: 30, tempDefault: 24 },
    { id: "tv",         nombre: "Televisión",         cuarto: "sala",     tipo: "horas",   watts: 90,   icono: "📺" },
    { id: "compu",      nombre: "Computadora",        cuarto: "sala",     tipo: "horas",   watts: 150,  icono: "💻" },
    { id: "consola",    nombre: "Consola de videojuegos", cuarto: "sala", tipo: "horas",   watts: 120,  icono: "🎮" },
    { id: "luzSala",    nombre: "Luces (sala)",       cuarto: "sala",     tipo: "horas",   watts: 30,   icono: "💡" },

    { id: "refri",      nombre: "Refrigerador",       cuarto: "cocina",   tipo: "siempre", kwhDia: 1.5, icono: "🧊" },
    { id: "microondas", nombre: "Microondas",         cuarto: "cocina",   tipo: "minutos", watts: 1200, icono: "🍲", maxMinutos: 60 },
    { id: "luzCocina",  nombre: "Luces (cocina)",     cuarto: "cocina",   tipo: "horas",   watts: 20,   icono: "💡" },

    { id: "luzBano",    nombre: "Luces (baño)",       cuarto: "bano",     tipo: "horas",   watts: 10,   icono: "💡" },
    { id: "regadera",   nombre: "Regadera eléctrica", cuarto: "bano",     tipo: "minutos", watts: 4500, icono: "♨️", maxMinutos: 30 },
    { id: "secadora_pelo", nombre: "Secadora de pelo", cuarto: "bano",    tipo: "minutos", watts: 1500, icono: "💨", maxMinutos: 30 },

    // Solo aparecen en la fase de sueño: cosas que la gente deja
    // prendidas toda la noche por seguridad
    { id: "luzPorche",  nombre: "Foco de porche",     cuarto: "casa",     tipo: "horas",   watts: 60,   icono: "💡" },
    { id: "luzPatio",   nombre: "Foco de patio",      cuarto: "casa",     tipo: "horas",   watts: 60,   icono: "💡" },
    { id: "camaras",    nombre: "Cámaras de seguridad", cuarto: "casa",   tipo: "horas",   watts: 15,   icono: "📷" },

    // Aparatos de uso semanal (se preguntan al final del juego)
    { id: "lavadora",   nombre: "Lavadora",           cuarto: "bano",     tipo: "semanal", kwhUso: 0.5, icono: "🧺",
      pregunta: "¿Cuántas veces {verbo} ropa esta semana?", verboReal: "lavaste", verboPlan: "planeas lavar", maxUsos: 14 },
    { id: "plancha",    nombre: "Plancha",            cuarto: "recamara", tipo: "semanal", kwhUso: 0.3, icono: "👔",
      pregunta: "¿Cuántas veces {verbo} esta semana?", verboReal: "planchaste", verboPlan: "planeas planchar", maxUsos: 14 },
  ],

  // Días promedio: para convertir consumo diario y semanal a mensual
  DIAS_MES: 30.4,
  SEMANAS_MES: 4.35,

  // Escala de las preguntas de seguridad en los exámenes
  ESCALA_SEGURIDAD: 5,

  // ----------------------------------------------------------
  // Referencia para el mensaje de comparación en la retroalimentación
  // ("gastas X% más/menos que..."). AJUSTA este valor si consigues un
  // promedio real de la zona (ej. de CFE o de otro estudio); mientras
  // tanto es una estimación razonable de un hogar eficiente en verano.
  // ----------------------------------------------------------
  REFERENCIA_HOGAR: {
    kwhMes: 350,
    etiqueta: "un hogar eficiente promedio en la región durante el verano",
  },

  // Duración de la temporada de verano, para el mensaje de gasto total
  // en la retroalimentación ("durante los X meses de verano...")
  MESES_VERANO: 4,
};

// Fracción del tiempo que el compresor del A/C trabaja según el
// termostato: a 16 °C prácticamente no descansa; a 30 °C casi no enciende.
// Modelo lineal simple, suficiente para fines del experimento.
function cicloTrabajoAC(temp) {
  const duty = 0.35 + (27 - temp) * 0.08;
  return Math.min(1.0, Math.max(0.15, duty));
}
