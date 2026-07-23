// ============================================================
// APLICACIÓN DEL EXPERIMENTO
// Flujo: consentimiento → juego 1 → examen 1 → retroalimentación
//        → juego 2 (planeación) → examen 2 → retroalimentación → fin
// ============================================================

// ------------------------------------------------------------
// Textos que quizá quieras editar (consentimiento, instrucciones)
// ------------------------------------------------------------
const TEXTOS = {
  titulo: "Estudio de consumo energético en el hogar",
  institucion: "Instituto Tecnológico de Sonora (ITSON) — Maestría en Ciencias de la Ingeniería, Tópico VI",
  consentimiento: `Este estudio forma parte de un proyecto de investigación de la <strong>Maestría en
    Ciencias de la Ingeniería (Tópico VI)</strong> del Instituto Tecnológico de Sonora (ITSON).
    Su objetivo es conocer el comportamiento y la percepción de las personas respecto a su
    consumo de energía eléctrica en el hogar, con el fin de generar conocimiento útil para el
    diseño de estrategias de ahorro energético.
    <br><br>
    Tu participación consiste en recrear tu rutina diaria de uso de energía eléctrica dentro de
    un departamento virtual, y responder algunas preguntas sobre tu percepción de gasto antes y
    después de recibir información sobre tu consumo estimado. La sesión se realiza de una sola
    vez, sin actividades adicionales, y dura aproximadamente entre 15 y 25 minutos.
    <br><br>
    Toda la información que proporciones —tus respuestas, la rutina que registres y los datos
    generales que compartas— es <strong>estrictamente confidencial</strong> y se usará
    <strong>únicamente con fines académicos</strong>, como parte de un trabajo de investigación
    de maestría. Los resultados se analizarán y reportarán de forma grupal y anónima; en ningún
    caso se publicará tu nombre ni información que permita identificarte de manera individual.
    <br><br>
    Tu participación es <strong>completamente voluntaria</strong>: puedes dejar de participar en
    cualquier momento, sin ninguna consecuencia, simplemente cerrando esta página. No existen
    riesgos asociados con tu participación.`,
  instrucciones1: `Piensa en el día de <strong>ayer</strong>. Vas a recrear cómo usaste la
    energía eléctrica ese día en un departamento virtual. El día está dividido en 4 fases:
    <strong>mañana, tarde, noche y sueño</strong>. En cada fase, prende con los interruptores
    los aparatos que usaste, indica cuántas horas los usaste, y en el caso del aire
    acondicionado también a qué temperatura lo pusiste. No hay respuestas correctas o
    incorrectas: responde como realmente fue tu día.`,
  instrucciones2: `Ya viste cuánto gastaste ayer. Ahora <strong>planea cómo será tu día de
    mañana</strong>: decide cómo usarás la energía eléctrica en el mismo departamento, con lo
    que acabas de aprender. De nuevo: mañana, tarde, noche y sueño. Responde con honestidad
    cómo planeas que sea tu día — no lo que "deberías" hacer, sino lo que realmente harás.`,
  cierre: `¡Gracias por participar! Tus respuestas se han registrado. Al finalizar el estudio
    completo, el equipo de investigación te compartirá información adicional sobre los
    resultados y los detalles del experimento.`,
};

// ------------------------------------------------------------
// Estado global y persistencia
// ------------------------------------------------------------
const CLAVE_LS = "expEnergia_v1";

function nuevoEstado() {
  const params = new URLSearchParams(location.search);
  let g = (params.get("g") || CONFIG.GRUPO_DEFAULT).toUpperCase();
  if (!CONFIG.GRUPOS[g]) g = CONFIG.GRUPO_DEFAULT;
  return {
    id: "P" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    grupo: g,
    paso: 0,
    participante: {},
    juego1: { rutina: {}, semanales: {} },
    juego2: { rutina: {}, semanales: {} },
    examen1: {},
    examen2: {},
    resultados: {},   // cálculos reales y mostrados, se llena en feedback
    tiempos: {},      // marca de tiempo de entrada a cada pantalla
    inicioSesion: new Date().toISOString(),
  };
}

function cargarEstado() {
  try {
    const crudo = localStorage.getItem(CLAVE_LS);
    if (crudo) {
      const st = JSON.parse(crudo);
      // Si la liga trae un grupo distinto al guardado, es una sesión nueva
      const params = new URLSearchParams(location.search);
      const g = (params.get("g") || CONFIG.GRUPO_DEFAULT).toUpperCase();
      if (st.grupo === g && st.paso > 0 && st.paso < PASOS.length - 1) return st;
    }
  } catch (e) { /* estado corrupto: empezar de cero */ }
  return nuevoEstado();
}

function guardarEstado() {
  localStorage.setItem(CLAVE_LS, JSON.stringify(state));
}

// ------------------------------------------------------------
// Definición del flujo de pantallas
// ------------------------------------------------------------
const PASOS = [
  { id: "consent",    titulo: "Bienvenida",          render: rConsentimiento },
  { id: "instr1",     titulo: "Instrucciones",       render: () => rInstrucciones(1) },
  { id: "juego1",     titulo: "El día de ayer",      render: () => rJuego("juego1") },
  { id: "semanales1", titulo: "Uso semanal",         render: () => rSemanales("juego1") },
  { id: "examen1",    titulo: "Cuestionario",        render: () => rExamen("examen1") },
  { id: "feedback1",  titulo: "Tus resultados",      render: () => rFeedback(1) },
  { id: "instr2",     titulo: "¿Cómo será mañana?",  render: () => rInstrucciones(2) },
  { id: "juego2",     titulo: "El día de mañana",    render: () => rJuego("juego2") },
  { id: "semanales2", titulo: "Uso semanal planeado", render: () => rSemanales("juego2") },
  { id: "examen2",    titulo: "Cuestionario final",  render: () => rExamen("examen2") },
  { id: "feedback2",  titulo: "Resultados del plan", render: () => rFeedback(2) },
  { id: "final",      titulo: "Fin",                 render: rFinal },
];

// El estado se inicializa aquí porque cargarEstado() necesita PASOS
let state = cargarEstado();

function irA(indice) {
  state.paso = indice;
  const pasoId = PASOS[indice].id;
  if (!state.tiempos[pasoId]) state.tiempos[pasoId] = new Date().toISOString();
  guardarEstado();
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function avanzar() { irA(Math.min(state.paso + 1, PASOS.length - 1)); }

// ------------------------------------------------------------
// Render principal
// ------------------------------------------------------------
const app = document.getElementById("app");

function render() {
  const paso = PASOS[state.paso];
  document.getElementById("progreso-relleno").style.width =
    Math.round((state.paso / (PASOS.length - 1)) * 100) + "%";
  document.getElementById("progreso-etiqueta").textContent =
    paso.titulo + " · paso " + (state.paso + 1) + " de " + PASOS.length;
  app.innerHTML = "";
  const pantalla = document.createElement("div");
  pantalla.className = "pantalla activa";
  pantalla.appendChild(paso.render());
  app.appendChild(pantalla);
}

// Utilidad para crear nodos con HTML
function nodo(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div;
}

const fmtPesos = n => "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtKwh = n => n.toLocaleString("es-MX", { maximumFractionDigits: 1 }) + " kWh";
const aparatoPorId = id => CONFIG.APARATOS.find(a => a.id === id);
const cuartoPorId = id => CONFIG.CUARTOS.find(c => c.id === id);

// ------------------------------------------------------------
// Pantalla: consentimiento
// ------------------------------------------------------------
function rConsentimiento() {
  const d = nodo(`
    <h1>${TEXTOS.titulo}</h1>
    <p>${TEXTOS.institucion}</p>
    <div class="tarjeta">
      <h2>Consentimiento informado</h2>
      <p>${TEXTOS.consentimiento}</p>
      <label for="c-nombre">Nombre completo</label>
      <input type="text" id="c-nombre" autocomplete="name" placeholder="Tu nombre">
      <label for="c-edad">Edad</label>
      <input type="number" id="c-edad" min="15" max="99" placeholder="Tu edad">
      <div class="check-linea">
        <input type="checkbox" id="c-acepta">
        <span>He leído la información anterior y <strong>acepto participar voluntariamente</strong> en este estudio.</span>
      </div>
      <div class="botonera">
        <button class="btn-primario" id="c-continuar" disabled>Comenzar</button>
      </div>
    </div>
  `);
  const nombre = d.querySelector("#c-nombre");
  const edad = d.querySelector("#c-edad");
  const acepta = d.querySelector("#c-acepta");
  const btn = d.querySelector("#c-continuar");

  const validar = () => {
    btn.disabled = !(nombre.value.trim().length >= 3 && edad.value && acepta.checked);
  };
  [nombre, edad, acepta].forEach(el => el.addEventListener("input", validar));

  btn.addEventListener("click", () => {
    state.participante = {
      nombre: nombre.value.trim(),
      edad: Number(edad.value),
      acepta: true,
      fechaConsentimiento: new Date().toISOString(),
    };
    avanzar();
  });
  return d;
}

// ------------------------------------------------------------
// Pantalla: instrucciones (juego 1 o 2)
// ------------------------------------------------------------
function rInstrucciones(numJuego) {
  const texto = numJuego === 1 ? TEXTOS.instrucciones1 : TEXTOS.instrucciones2;
  const titulo = numJuego === 1 ? "Recrea el día de ayer" : "¿Cómo será tu día de mañana?";
  const d = nodo(`
    <h1>${titulo}</h1>
    <div class="tarjeta">
      <p>${texto}</p>
      <div class="aviso aviso-fuerte">Este departamento representa <strong>únicamente tu consumo
        personal</strong>: prende solo los aparatos que usaste (o usarás) tú, no los que haya
        usado el resto de las personas con las que vives. Al final, cuando te pregunten cuánto
        crees que pagarías de luz, responde pensando en <strong>tu gasto individual</strong>, no
        en el recibo total de tu casa.</div>
      <div class="aviso">El <strong>refrigerador</strong> siempre está conectado, no necesitas prenderlo.</div>
      <div class="botonera">
        <button class="btn-primario" id="i-continuar">Entendido, continuar</button>
      </div>
    </div>
  `);
  d.querySelector("#i-continuar").addEventListener("click", avanzar);
  return d;
}

// ------------------------------------------------------------
// Pantalla: juego (recorre las 4 fases del día)
// ------------------------------------------------------------
function rJuego(claveJuego) {
  const juego = state[claveJuego];
  if (juego.faseActual === undefined) juego.faseActual = 0;

  const cont = document.createElement("div");
  dibujarFase();
  return cont;

  function dibujarFase() {
    const fase = CONFIG.FASES[juego.faseActual];
    if (!juego.rutina[fase.id]) juego.rutina[fase.id] = {};
    const ajustes = juego.rutina[fase.id];

    const pasosHtml = CONFIG.FASES.map((f, i) => {
      const cls = i < juego.faseActual ? "hecho" : (i === juego.faseActual ? "actual" : "");
      return `<div class="paso ${cls}" title="${f.nombre}"></div>`;
    }).join("");

    cont.innerHTML = `
      <div class="fase-pasos">${pasosHtml}</div>
      <div class="fase-cabecera fase-${fase.id}">
        <div class="icono">${fase.icono}</div>
        <div>
          <h2 style="margin:0">${fase.nombre}</h2>
          <div class="rango">${fase.rango} · máximo ${fase.horas} horas por aparato</div>
        </div>
      </div>
      <div class="cuartos" id="j-cuartos"></div>
      <div class="botonera">
        ${juego.faseActual > 0
          ? '<button class="btn-secundario" id="j-atras">← Fase anterior</button>'
          : '<button class="btn-secundario" id="j-atras-pantalla">← Atrás</button>'}
        <button class="btn-primario" id="j-siguiente">
          ${juego.faseActual < CONFIG.FASES.length - 1 ? "Siguiente fase →" : "Terminar el día"}
        </button>
      </div>
    `;

    const zonaCuartos = cont.querySelector("#j-cuartos");
    for (const cuarto of CONFIG.CUARTOS) {
      if (cuarto.fases && !cuarto.fases.includes(fase.id)) continue;
      const aparatos = CONFIG.APARATOS.filter(a => a.cuarto === cuarto.id && a.tipo !== "semanal");
      if (!aparatos.length) continue;
      const card = document.createElement("div");
      card.className = "cuarto";
      card.innerHTML = `<div class="cuarto-titulo"><span>${cuarto.icono}</span> ${cuarto.nombre}</div>`;
      aparatos.forEach(ap => card.appendChild(filaAparato(ap, fase, ajustes)));
      zonaCuartos.appendChild(card);
    }

    const btnAtras = cont.querySelector("#j-atras");
    if (btnAtras) btnAtras.addEventListener("click", () => {
      juego.faseActual--;
      guardarEstado();
      dibujarFase();
      window.scrollTo({ top: 0 });
    });

    const btnAtrasPantalla = cont.querySelector("#j-atras-pantalla");
    if (btnAtrasPantalla) btnAtrasPantalla.addEventListener("click", () => irA(state.paso - 1));

    cont.querySelector("#j-siguiente").addEventListener("click", () => {
      if (juego.faseActual < CONFIG.FASES.length - 1) {
        juego.faseActual++;
        guardarEstado();
        dibujarFase();
        window.scrollTo({ top: 0 });
      } else {
        delete juego.faseActual;
        guardarEstado();
        avanzar();
      }
    });
  }

  // Una fila de aparato con su switch y controles
  function filaAparato(ap, fase, ajustes) {
    if (!ajustes[ap.id]) {
      ajustes[ap.id] = ap.tipo === "siempre"
        ? { on: true }
        : { on: false, horas: 1, temp: ap.tempDefault, minutos: 5 };
    }
    const aj = ajustes[ap.id];

    const div = document.createElement("div");
    div.className = "aparato";

    if (ap.tipo === "siempre") {
      div.innerHTML = `
        <div class="aparato-fila">
          <span class="icono">${ap.icono}</span>
          <span class="nombre">${ap.nombre}</span>
          <span class="siempre-on">SIEMPRE ENCENDIDO</span>
        </div>`;
      return div;
    }

    div.innerHTML = `
      <div class="aparato-fila">
        <span class="icono">${ap.icono}</span>
        <span class="nombre">${ap.nombre}</span>
        <label class="switch">
          <input type="checkbox" ${aj.on ? "checked" : ""}>
          <span class="pista-sw"></span>
        </label>
      </div>
      <div class="aparato-controles ${aj.on ? "visible" : ""}"></div>
    `;

    const chk = div.querySelector("input[type=checkbox]");
    const zonaCtrl = div.querySelector(".aparato-controles");

    function dibujarControles() {
      zonaCtrl.innerHTML = "";
      if (ap.tipo === "horas" || ap.tipo === "ac") {
        zonaCtrl.appendChild(controlRango("Horas de uso", 0.5, fase.horas, 0.5, aj.horas,
          v => { aj.horas = v; guardarEstado(); }, v => v + " h"));
      }
      if (ap.tipo === "ac") {
        zonaCtrl.appendChild(controlRango("Temperatura", ap.tempMin, ap.tempMax, 1, aj.temp,
          v => { aj.temp = v; guardarEstado(); }, v => v + " °C"));
      }
      if (ap.tipo === "minutos") {
        zonaCtrl.appendChild(controlRango("Minutos de uso", 1, ap.maxMinutos, 1, aj.minutos,
          v => { aj.minutos = v; guardarEstado(); }, v => v + " min"));
      }
    }

    chk.addEventListener("change", () => {
      aj.on = chk.checked;
      zonaCtrl.classList.toggle("visible", aj.on);
      if (aj.on) dibujarControles();
      guardarEstado();
    });
    if (aj.on) dibujarControles();
    return div;
  }

  function controlRango(etiqueta, min, max, paso, valor, alCambiar, formato) {
    const linea = document.createElement("div");
    linea.className = "control-linea";
    linea.innerHTML = `
      <label>${etiqueta}</label>
      <input type="range" min="${min}" max="${max}" step="${paso}" value="${valor}">
      <span class="valor">${formato(valor)}</span>
    `;
    const rango = linea.querySelector("input");
    const val = linea.querySelector(".valor");
    rango.addEventListener("input", () => {
      const v = Number(rango.value);
      val.textContent = formato(v);
      alCambiar(v);
    });
    return linea;
  }
}

// ------------------------------------------------------------
// Pantalla: preguntas de uso semanal (lavadora, plancha…)
// ------------------------------------------------------------
function rSemanales(claveJuego) {
  const juego = state[claveJuego];
  const esPlan = claveJuego === "juego2";
  const semanalesAp = CONFIG.APARATOS.filter(a => a.tipo === "semanal");

  const d = nodo(`
    <h1>Aparatos de uso ocasional</h1>
    <div class="tarjeta">
      <p>${esPlan
        ? "Estos aparatos no se usan a diario. Indica cuántas veces <strong>planeas usarlos</strong> la próxima semana."
        : "Estos aparatos no se usan a diario. Indica cuántas veces <strong>los usaste</strong> en la última semana."}</p>
      <div id="s-preguntas"></div>
      <div class="botonera">
        <button class="btn-secundario" id="s-atras">← Atrás</button>
        <button class="btn-primario" id="s-continuar">Continuar</button>
      </div>
    </div>
  `);

  const zona = d.querySelector("#s-preguntas");
  for (const ap of semanalesAp) {
    if (juego.semanales[ap.id] === undefined) juego.semanales[ap.id] = 0;
    const verbo = esPlan ? ap.verboPlan : ap.verboReal;
    const bloque = nodo(`
      <label>${ap.icono} ${ap.pregunta.replace("{verbo}", verbo)}</label>
      <div class="control-linea">
        <input type="range" min="0" max="${ap.maxUsos}" step="1" value="${juego.semanales[ap.id]}">
        <span class="valor">${juego.semanales[ap.id]} veces</span>
      </div>
    `);
    const rango = bloque.querySelector("input");
    const val = bloque.querySelector(".valor");
    rango.addEventListener("input", () => {
      juego.semanales[ap.id] = Number(rango.value);
      val.textContent = rango.value + " veces";
      guardarEstado();
    });
    zona.appendChild(bloque);
  }

  d.querySelector("#s-atras").addEventListener("click", () => irA(state.paso - 1));
  d.querySelector("#s-continuar").addEventListener("click", avanzar);
  return d;
}

// ------------------------------------------------------------
// Pantalla: examen de percepción
// ------------------------------------------------------------
function rExamen(claveExamen) {
  const esSegundo = claveExamen === "examen2";
  // El aire acondicionado se excluye de la pregunta 2: siempre es tan
  // dominante que la pregunta se volvía obvia y no medía percepción real.
  const opcionesAparato = CONFIG.APARATOS
    .filter(a => a.tipo !== "ac")
    .map(a => `<option value="${a.id}">${a.icono} ${a.nombre}</option>`).join("");
  const opcionesCuarto = CONFIG.CUARTOS
    .map(c => `<option value="${c.id}">${c.icono} ${c.nombre}</option>`).join("");
  const likert = Array.from({ length: CONFIG.ESCALA_SEGURIDAD }, (_, i) => {
    const v = i + 1;
    const caption = v === 1 ? "Nada seguro" : v === CONFIG.ESCALA_SEGURIDAD ? "Muy seguro" : "&nbsp;";
    return `<label><span class="likert-caption">${caption}</span><input type="radio" name="e-seguridad" value="${v}"><span class="likert-num">${v}</span></label>`;
  }).join("");

  const d = nodo(`
    <h1>${esSegundo ? "Cuestionario final" : "Cuestionario"}</h1>
    <div class="tarjeta">
      <p>Sin hacer cuentas exactas, responde según tu intuición sobre
         ${esSegundo ? "la rutina que acabas de planear" : "la rutina que acabas de recrear"}.</p>

      <label>1. Si todos los días fueran como ese, ¿cuánto crees que pagarías de luz <strong>al mes</strong>,
        en pesos? (solo por <strong>tu consumo individual</strong>, no el total de tu casa)</label>
      <input type="number" id="e-pesos" min="0" step="1" inputmode="numeric" placeholder="Ej. 800">

      <label>2. Sin contar el aire acondicionado, ¿qué aparato crees que gastó <strong>más energía</strong>?</label>
      <select id="e-aparato"><option value="" disabled selected>Elige un aparato…</option>${opcionesAparato}</select>

      <label>3. ¿En qué cuarto crees que se gastó <strong>más energía</strong>?</label>
      <select id="e-cuarto"><option value="" disabled selected>Elige un cuarto…</option>${opcionesCuarto}</select>

      <label>4. ¿Qué tan seguro(a) estás de tus respuestas?</label>
      <div class="likert">${likert}</div>

      <div class="botonera">
        <button class="btn-primario" id="e-continuar" disabled>Ver mis resultados</button>
      </div>
    </div>
  `);

  const pesos = d.querySelector("#e-pesos");
  const aparato = d.querySelector("#e-aparato");
  const cuarto = d.querySelector("#e-cuarto");
  const btn = d.querySelector("#e-continuar");

  const validar = () => {
    const seg = d.querySelector("input[name=e-seguridad]:checked");
    btn.disabled = !(pesos.value !== "" && Number(pesos.value) >= 0 && aparato.value && cuarto.value && seg);
  };
  d.addEventListener("input", validar);

  btn.addEventListener("click", () => {
    state[claveExamen] = {
      estimacionPesos: Number(pesos.value),
      aparatoTop: aparato.value,
      cuartoTop: cuarto.value,
      seguridad: Number(d.querySelector("input[name=e-seguridad]:checked").value),
      fecha: new Date().toISOString(),
    };
    avanzar();
  });
  return d;
}

// ------------------------------------------------------------
// Histograma de horas de uso por cuarto (para la retroalimentación)
// ------------------------------------------------------------
function nodoHistogramaHoras(horasPorAparato) {
  const cont = document.createElement("div");
  let cuartoActivo = CONFIG.CUARTOS[0].id;
  dibuja();
  return cont;

  function dibuja() {
    const aparatos = CONFIG.APARATOS
      .filter(a => a.cuarto === cuartoActivo && ["horas", "ac", "minutos"].includes(a.tipo))
      .sort((a, b) => (horasPorAparato[b.id] || 0) - (horasPorAparato[a.id] || 0));
    const max = Math.max(1, ...aparatos.map(a => horasPorAparato[a.id] || 0));
    const barrasHtml = aparatos.map(a => {
      const h = horasPorAparato[a.id] || 0;
      const alto = Math.max(2, (h / max) * 100);
      return `
        <div class="hist-barra">
          <div class="hist-valor">${Math.round(h)} h</div>
          <div class="hist-pista"><div class="hist-relleno" style="height:${alto}%"></div></div>
          <div class="hist-etiqueta">${a.icono}<br>${a.nombre}</div>
        </div>`;
    }).join("");

    cont.innerHTML = `
      <div class="hist-tabs">
        ${CONFIG.CUARTOS.map(c => `
          <button type="button" class="hist-tab ${c.id === cuartoActivo ? "activo" : ""}" data-cuarto="${c.id}">
            ${c.icono} ${c.nombre}
          </button>`).join("")}
      </div>
      <div class="hist-grafico">
        ${barrasHtml || '<p>Este cuarto no tuvo aparatos encendidos.</p>'}
      </div>
      <p class="hist-nota">Horas de uso al mes, estimadas a partir de tu rutina diaria.</p>
    `;

    cont.querySelectorAll(".hist-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        cuartoActivo = btn.dataset.cuarto;
        dibuja();
      });
    });
  }
}

// ------------------------------------------------------------
// Pantalla: retroalimentación (aquí actúa la manipulación del grupo)
// ------------------------------------------------------------
function rFeedback(numJuego) {
  const claveJuego = "juego" + numJuego;
  const claveExamen = "examen" + numJuego;
  const juego = state[claveJuego];
  const examen = state[claveExamen];
  const factor = CONFIG.GRUPOS[state.grupo].factor;

  // Cálculo real (se guarda) y cifras mostradas (con el factor del grupo)
  const real = Engine.calcular(juego.rutina, juego.semanales);
  const mostrado = Engine.aplicarFactor(real, factor);
  const topMostrado = Engine.mayores(mostrado);
  // El aire acondicionado casi siempre es el más gastador, así que para
  // calificar la pregunta 2 (que ya lo excluye como opción) se usa el
  // top sin contar los aparatos de tipo "ac"
  const topSinAC = Engine.mayores(mostrado, { excluirTipoAparato: "ac" });

  state.resultados["real" + numJuego] = {
    porAparato: real.porAparato, porCuarto: real.porCuarto,
    porAparatoPesos: real.porAparatoPesos, porCuartoPesos: real.porCuartoPesos,
    totalKwh: real.totalKwh, costoMes: real.costoMes,
  };
  state.resultados["mostrado" + numJuego] = {
    totalKwh: mostrado.totalKwh, costoMes: mostrado.costoMes, factor,
  };
  guardarEstado();

  const aciertoAparato = examen.aparatoTop === topSinAC.aparatoId;
  const aciertoCuarto = examen.cuartoTop === topMostrado.cuartoId;
  const apTop = aparatoPorId(topSinAC.aparatoId);
  const cuTop = cuartoPorId(topMostrado.cuartoId);

  // Diferencia entre lo que el participante estimó y lo que el juego calculó
  const diffPesos = examen.estimacionPesos - mostrado.costoMes;
  const diffPct = (diffPesos / mostrado.costoMes) * 100;
  const seExcedio = diffPesos > 0;

  // Mensaje persuasivo: comparación contra un hogar de referencia
  const ref = CONFIG.REFERENCIA_HOGAR;
  const refCosto = Engine.costoMensual(ref.kwhMes);
  const refDiffPct = ((mostrado.totalKwh - ref.kwhMes) / ref.kwhMes) * 100;
  const gastaMas = refDiffPct > 0;
  const maxBarraRef = Math.max(mostrado.totalKwh, ref.kwhMes) || 1;

  const barras = (kwhObj, pesosObj, nombrePorId, topId) => {
    const entradas = Object.entries(kwhObj).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const max = entradas.length ? entradas[0][1] : 1;
    return entradas.map(([id, v]) => `
      <div class="barra-item ${id === topId ? "top" : ""}">
        <div class="fila-txt"><span>${nombrePorId(id)}</span><span>${fmtKwh(v)} · <strong>${fmtPesos(pesosObj[id])}</strong></span></div>
        <div class="pista-b"><div class="relleno-b" style="width:${Math.max(3, (v / max) * 100)}%"></div></div>
      </div>`).join("");
  };

  const horasPorAparato = Engine.horasPorAparato(juego.rutina);

  const d = nodo(`
    <h1>${numJuego === 1 ? "Tus resultados" : "Resultados de tu plan"}</h1>

    <div class="tarjeta gran-cifra">
      <div class="sub">Con esa rutina, gastarías durante el verano aproximadamente</div>
      <div class="monto">${fmtPesos(mostrado.costoMes)} <span class="monto-sub">al mes</span></div>
      <div class="sub">${fmtKwh(mostrado.totalKwh)} al mes · ${CONFIG.TARIFA.nombre}</div>
    </div>

    <div class="tarjeta">
      <h2>¿Qué tan alto es tu gasto?</h2>
      <div class="barra-item">
        <div class="fila-txt"><span>Tú</span><span>${fmtKwh(mostrado.totalKwh)}</span></div>
        <div class="pista-b"><div class="relleno-b" style="width:${Math.max(3, (mostrado.totalKwh / maxBarraRef) * 100)}%"></div></div>
      </div>
      <div class="barra-item">
        <div class="fila-txt"><span>${ref.etiqueta}</span><span>${fmtKwh(ref.kwhMes)}</span></div>
        <div class="pista-b"><div class="relleno-b gris" style="width:${Math.max(3, (ref.kwhMes / maxBarraRef) * 100)}%"></div></div>
      </div>
      <p class="nudge-mensaje">
        Gastas <span class="${gastaMas ? "fallo" : "acierto"}">${Math.abs(Math.round(refDiffPct))}% ${gastaMas ? "más" : "menos"}</span>
        que ${ref.etiqueta} (${fmtPesos(refCosto)} al mes).
      </p>
    </div>

    <div class="tarjeta">
      <h2>Tu estimación vs. el cálculo</h2>
      <div class="comparacion">
        <div class="caja"><div class="num">${fmtPesos(examen.estimacionPesos)}</div><div class="txt">Tu estimación</div></div>
        <div class="caja"><div class="num">${fmtPesos(mostrado.costoMes)}</div><div class="txt">Cálculo del juego</div></div>
      </div>
      <p>
        ${seExcedio ? "Sobreestimaste" : "Subestimaste"} tu gasto por
        <strong>${fmtPesos(Math.abs(diffPesos))}</strong>
        (<strong>${Math.abs(Math.round(diffPct))}%</strong> ${seExcedio ? "por encima" : "por debajo"} de lo real).
      </p>
      <p>Durante los ${CONFIG.MESES_VERANO} meses de verano, con esta rutina gastarías en total aproximadamente
        <strong>${fmtPesos(mostrado.costoMes * CONFIG.MESES_VERANO)}</strong>.
      </p>
      <p>Dijiste que el aparato más gastador era
        <strong>${aparatoPorId(examen.aparatoTop).nombre}</strong> —
        <span class="${aciertoAparato ? "acierto" : "fallo"}">${aciertoAparato ? "¡Correcto!" : "en realidad fue " + apTop.nombre}</span>.
      </p>
      <p>Dijiste que el cuarto más gastador era
        <strong>${cuartoPorId(examen.cuartoTop).nombre}</strong> —
        <span class="${aciertoCuarto ? "acierto" : "fallo"}">${aciertoCuarto ? "¡Correcto!" : "en realidad fue " + cuTop.nombre}</span>.
      </p>
    </div>

    <div class="tarjeta">
      <h2>Consumo por aparato</h2>
      ${barras(mostrado.porAparato, mostrado.porAparatoPesos, id => aparatoPorId(id).icono + " " + aparatoPorId(id).nombre, topMostrado.aparatoId)}
    </div>

    <div class="tarjeta">
      <h2>Consumo por cuarto</h2>
      ${barras(mostrado.porCuarto, mostrado.porCuartoPesos, id => cuartoPorId(id).icono + " " + cuartoPorId(id).nombre, topMostrado.cuartoId)}
    </div>

    <div class="tarjeta">
      <h2>¿Cuántas horas tuviste cada aparato prendido?</h2>
      <div id="f-histograma"></div>
    </div>

    <div class="botonera">
      <button class="btn-primario" id="f-continuar">
        ${numJuego === 1 ? "Continuar con la segunda parte →" : "Finalizar →"}
      </button>
    </div>
  `);

  d.querySelector("#f-histograma").appendChild(nodoHistogramaHoras(horasPorAparato));
  d.querySelector("#f-continuar").addEventListener("click", avanzar);
  return d;
}

// ------------------------------------------------------------
// Pantalla final: agradecimiento y envío de datos
// ------------------------------------------------------------
function rFinal() {
  // Debriefing: los grupos B/C recibieron cifras alteradas en su
  // retroalimentación sin saberlo. Aquí, al terminar su sesión, se les
  // revela la manipulación y se les da su dato real, como exige la
  // ética de investigación cuando se usa engaño.
  const factor = CONFIG.GRUPOS[state.grupo].factor;
  const r = state.resultados;
  const debriefingHtml = factor !== 1 ? `
    <div class="tarjeta debriefing">
      <h2>Antes de que te vayas — una aclaración importante</h2>
      <p>Como parte del diseño de este estudio, las cifras de gasto que viste en tu
        retroalimentación fueron <strong>modificadas intencionalmente</strong>: se te mostró un
        <strong>${Math.round(Math.abs(factor - 1) * 100)}% ${factor > 1 ? "más alto" : "más bajo"}</strong>
        de lo que en realidad gastarías, sin decírtelo en ese momento.</p>
      <p>Esto se hizo para poder comparar cómo cambia el comportamiento de las personas cuando
        reciben información distinta sobre su consumo, incluso si esa información no es exacta.
        Es una técnica común y aceptada en estudios de comportamiento, y no representa ningún
        riesgo para ti.</p>
      <p>Estas son tus cifras <strong>reales</strong>, sin modificar:</p>
      <div class="comparacion">
        ${r.real1 ? `<div class="caja"><div class="num">${fmtPesos(r.real1.costoMes)}</div><div class="txt">Juego 1 — se te mostró ${fmtPesos(r.mostrado1.costoMes)}</div></div>` : ""}
        ${r.real2 ? `<div class="caja"><div class="num">${fmtPesos(r.real2.costoMes)}</div><div class="txt">Juego 2 — se te mostró ${fmtPesos(r.mostrado2.costoMes)}</div></div>` : ""}
      </div>
      <p>Gracias por tu comprensión y por tu participación. Si tienes dudas sobre esta parte del
        estudio, puedes preguntarle directamente al equipo de investigación.</p>
    </div>
  ` : "";

  const d = nodo(`
    <h1>¡Terminaste! 🎉</h1>
    ${debriefingHtml}
    <div class="tarjeta">
      <p>${TEXTOS.cierre}</p>
      <p class="estado-envio" id="f-estado">Enviando tus respuestas…</p>
      <div class="botonera">
        <button class="btn-secundario" id="f-descargar" style="display:none">Descargar mis respuestas</button>
      </div>
    </div>
  `);

  const estado = d.querySelector("#f-estado");
  const btnDescargar = d.querySelector("#f-descargar");
  const payload = armarPayload();

  // El envío se intenta una sola vez por sesión
  if (!state.enviado) {
    enviarDatos(payload).then(ok => {
      state.enviado = ok;
      guardarEstado();
      if (ok) {
        estado.textContent = "✔ Tus respuestas se enviaron correctamente. Ya puedes cerrar esta página.";
        estado.classList.add("ok");
      } else {
        estado.textContent = "No se pudieron enviar automáticamente. Por favor descarga el archivo y envíaselo al investigador.";
        estado.classList.add("error");
        btnDescargar.style.display = "inline-block";
      }
    });
  } else {
    estado.textContent = "✔ Tus respuestas ya fueron enviadas. Gracias.";
    estado.classList.add("ok");
  }

  btnDescargar.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `respuestas_${state.id}.json`;
    a.click();
  });

  return d;
}

// Estructura final que recibe el investigador
function armarPayload() {
  const r = state.resultados;
  return {
    version: 1,
    id: state.id,
    grupo: state.grupo,
    grupoNombre: CONFIG.GRUPOS[state.grupo].nombre,
    factorFeedback: CONFIG.GRUPOS[state.grupo].factor,
    participante: state.participante,
    inicioSesion: state.inicioSesion,
    finSesion: new Date().toISOString(),
    tiempos: state.tiempos,
    juego1: { rutina: state.juego1.rutina, semanales: state.juego1.semanales },
    juego2: { rutina: state.juego2.rutina, semanales: state.juego2.semanales },
    examen1: state.examen1,
    examen2: state.examen2,
    resultados: r,
    // Resumen plano, listo para análisis
    resumen: {
      costoReal1: r.real1?.costoMes, costoMostrado1: r.mostrado1?.costoMes,
      costoReal2: r.real2?.costoMes, costoMostrado2: r.mostrado2?.costoMes,
      kwhReal1: r.real1?.totalKwh, kwhReal2: r.real2?.totalKwh,
      estimacion1: state.examen1.estimacionPesos, estimacion2: state.examen2.estimacionPesos,
      errorPct1: r.real1 ? ((state.examen1.estimacionPesos - r.real1.costoMes) / r.real1.costoMes * 100) : null,
      errorPct2: r.real2 ? ((state.examen2.estimacionPesos - r.real2.costoMes) / r.real2.costoMes * 100) : null,
      cambioConsumoPct: (r.real1 && r.real2) ? ((r.real2.totalKwh - r.real1.totalKwh) / r.real1.totalKwh * 100) : null,
    },
  };
}

async function enviarDatos(payload) {
  if (!CONFIG.ENDPOINT_URL) return false;
  try {
    await fetch(CONFIG.ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script no devuelve CORS; el envío sí llega
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (e) {
    return false;
  }
}

// ------------------------------------------------------------
// Arranque
// ------------------------------------------------------------
irA(state.paso);
