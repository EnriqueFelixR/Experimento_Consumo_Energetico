// ============================================================
// MOTOR DE CÁLCULO
// Convierte la rutina capturada en el juego a kWh mensuales y
// pesos MXN según la tarifa configurada en config.js.
//
// Estructura de entrada:
//   rutina = { faseId: { aparatoId: { on, horas, temp, minutos } } }
//   semanales = { aparatoId: usosPorSemana }
// ============================================================

const Engine = {

  // kWh que consume UN aparato en UNA fase de la rutina
  kwhAparatoFase(aparato, ajuste) {
    if (!ajuste || !ajuste.on) return 0;
    switch (aparato.tipo) {
      case "horas":
        return (aparato.watts / 1000) * (ajuste.horas || 0);
      case "ac":
        return (aparato.watts / 1000) * (ajuste.horas || 0) * cicloTrabajoAC(ajuste.temp ?? aparato.tempDefault);
      case "minutos":
        return (aparato.watts / 1000) * ((ajuste.minutos || 0) / 60);
      default:
        return 0;
    }
  },

  // Consumo mensual completo. Devuelve desglose por aparato, por
  // cuarto, total en kWh y costo en pesos.
  calcular(rutina, semanales) {
    const porAparato = {};
    const porCuarto = {};
    CONFIG.CUARTOS.forEach(c => porCuarto[c.id] = 0);

    for (const ap of CONFIG.APARATOS) {
      let kwhMes = 0;

      if (ap.tipo === "siempre") {
        kwhMes = ap.kwhDia * CONFIG.DIAS_MES;
      } else if (ap.tipo === "semanal") {
        const usos = (semanales && semanales[ap.id]) || 0;
        kwhMes = usos * ap.kwhUso * CONFIG.SEMANAS_MES;
      } else {
        let kwhDia = 0;
        for (const fase of CONFIG.FASES) {
          const ajuste = rutina?.[fase.id]?.[ap.id];
          kwhDia += this.kwhAparatoFase(ap, ajuste);
        }
        kwhMes = kwhDia * CONFIG.DIAS_MES;
      }

      porAparato[ap.id] = kwhMes;
      porCuarto[ap.cuarto] += kwhMes;
    }

    const totalKwh = Object.values(porAparato).reduce((a, b) => a + b, 0);
    const costoMes = this.costoMensual(totalKwh);
    return {
      porAparato,
      porCuarto,
      totalKwh,
      costoMes,
      porAparatoPesos: this.distribuirCosto(porAparato, totalKwh, costoMes),
      porCuartoPesos: this.distribuirCosto(porCuarto, totalKwh, costoMes),
    };
  },

  // Reparte un costo total en pesos entre las entradas de un desglose
  // en kWh, en proporción a su consumo (así la suma de las partes
  // siempre da el total, aunque la tarifa sea por escalones)
  distribuirCosto(porItem, totalKwh, costoTotal) {
    const out = {};
    for (const [id, kwh] of Object.entries(porItem)) {
      out[id] = totalKwh > 0 ? (kwh / totalKwh) * costoTotal : 0;
    }
    return out;
  },

  // Horas de uso al mes por aparato (solo aparatos con switch: tipo
  // "horas"/"ac"/"minutos"). Se usa para el histograma de horas en la
  // retroalimentación; no se ve afectado por el factor del grupo.
  horasPorAparato(rutina) {
    const out = {};
    for (const ap of CONFIG.APARATOS) {
      if (!["horas", "ac", "minutos"].includes(ap.tipo)) continue;
      let horasDia = 0;
      for (const fase of CONFIG.FASES) {
        const ajuste = rutina?.[fase.id]?.[ap.id];
        if (!ajuste || !ajuste.on) continue;
        horasDia += ap.tipo === "minutos" ? (ajuste.minutos || 0) / 60 : (ajuste.horas || 0);
      }
      out[ap.id] = horasDia * CONFIG.DIAS_MES;
    }
    return out;
  },

  // Costo mensual en pesos aplicando los escalones de la tarifa
  costoMensual(kwh) {
    let restante = kwh;
    let costo = CONFIG.TARIFA.cargoFijo;
    let piso = 0;
    for (const esc of CONFIG.TARIFA.escalones) {
      const enEscalon = Math.min(restante, esc.hastaKwh - piso);
      if (enEscalon <= 0) break;
      costo += enEscalon * esc.precio;
      restante -= enEscalon;
      piso = esc.hastaKwh;
    }
    return costo;
  },

  // Aparato y cuarto con mayor consumo (para la retroalimentación
  // y para calificar los exámenes de percepción).
  // opts.excluirTipoAparato: excluye del cálculo los aparatos de ese
  // tipo (ej. "ac", para que la pregunta del examen no sea obvia).
  mayores(resultado, opts = {}) {
    const excluirTipo = opts.excluirTipoAparato;
    const entradasAparato = Object.entries(resultado.porAparato).filter(([id]) => {
      if (!excluirTipo) return true;
      const ap = CONFIG.APARATOS.find(a => a.id === id);
      return ap.tipo !== excluirTipo;
    });
    const topAparato = entradasAparato.sort((a, b) => b[1] - a[1])[0];
    const topCuarto = Object.entries(resultado.porCuarto)
      .sort((a, b) => b[1] - a[1])[0];
    return {
      aparatoId: topAparato[0], aparatoKwh: topAparato[1],
      cuartoId: topCuarto[0],   cuartoKwh: topCuarto[1],
    };
  },

  // Aplica el factor del grupo experimental a un resultado para
  // producir las cifras QUE SE MUESTRAN (los datos reales no se tocan)
  aplicarFactor(resultado, factor) {
    const escala = obj => Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, v * factor])
    );
    const porAparato = escala(resultado.porAparato);
    const porCuarto = escala(resultado.porCuarto);
    const totalKwh = resultado.totalKwh * factor;
    // El costo se recalcula sobre los kWh escalados (no se multiplica
    // directo) para que respete los escalones de la tarifa.
    const costoMes = this.costoMensual(totalKwh);
    return {
      porAparato,
      porCuarto,
      totalKwh,
      costoMes,
      porAparatoPesos: this.distribuirCosto(porAparato, totalKwh, costoMes),
      porCuartoPesos: this.distribuirCosto(porCuarto, totalKwh, costoMes),
    };
  },
};
