/* Mansión La Faraona · cálculos del portal de afiliados (DEMOSTRACIÓN).
   Sin pantalla ni navegador: solo números y textos, para poder probarlo aparte
   (node faraona_afiliados_pruebas.js). Todo se cuenta en céntimos para que el total sea exacto.
   Generado desde contexto-claude-code/_generadores/faraona_afiliados_calculo.js */
(function (raiz) {
  "use strict";

  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  function cent(n) { return Math.round(Number(n || 0) * 100); }

  function dinero(c) {
    var neg = c < 0; c = Math.abs(Math.round(c));
    var ent = Math.floor(c / 100), dec = c % 100;
    var s = String(ent).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (neg ? "-" : "") + "Ref. " + s + "," + (dec < 10 ? "0" : "") + dec;
  }

  function aFecha(iso) { var p = String(iso).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function valida(iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso || "") && !isNaN(aFecha(iso)); }
  function diasEntre(a, b) { return Math.round((aFecha(b) - aFecha(a)) / 864e5); }

  function fecha(iso, conDia) {
    if (!valida(iso)) return "";
    var d = new Date(aFecha(iso));
    var t = d.getUTCDate() + " de " + MESES[d.getUTCMonth()] + " de " + d.getUTCFullYear();
    return conDia ? DIAS[d.getUTCDay()] + " " + t : t;
  }

  function fechaCorta(iso) {
    if (!valida(iso)) return "";
    var d = new Date(aFecha(iso));
    return d.getUTCDate() + " " + MESES[d.getUTCMonth()].slice(0, 3) + ". " + d.getUTCFullYear();
  }

  function normCodigo(t) {
    var s = String(t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    var m = s.match(/^([A-Z]+)(\d+)$/);
    return m ? m[1] + "-" + m[2] : s;
  }
  function normDoc(t) { return String(t || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }

  /* Busca por código y cédula o RIF. Devuelve el afiliado o null (mismo resultado si falla
     cualquiera de los dos, para no revelar cuál estuvo mal). */
  function buscar(lista, codigo, documento) {
    var c = normCodigo(codigo), d = normDoc(documento);
    if (!c || !d) return null;
    for (var i = 0; i < (lista || []).length; i++) {
      var a = lista[i];
      if (normCodigo(a.codigo) === c && normDoc(a.documento) === d) return a;
    }
    return null;
  }

  function consumido(a) {
    var s = 0; (a.consumos || []).forEach(function (x) { s += cent(x.monto); }); return s;
  }
  function saldo(a) { return Math.max(0, cent(a.pagado) - consumido(a)); }

  function vigencia(a, hoy) {
    var total = Math.max(1, diasEntre(a.compra, a.vence));
    var quedan = diasEntre(hoy, a.vence);
    return { total: total, quedan: Math.max(0, quedan), vencida: quedan < 0, usados: Math.min(1, Math.max(0, (total - quedan) / total)) };
  }

  function buscarId(lista, id) {
    for (var i = 0; i < (lista || []).length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  function pctDe(reglas, cat) { return (reglas.descuentos && reglas.descuentos[cat]) || 0; }

  /* El precio normal y con descuento de un renglón de la tabla congelada. */
  function conDescuento(precio, pct) {
    var n = cent(precio); return { normal: n, final: n - Math.round(n * pct / 100) };
  }

  function plural(n, uno, varios) { return n + " " + (n === 1 ? uno : varios); }

  /* pedido = { desde, hasta, adultos, ninos,
       estadia: { hab, cantidad, comida } | null,
       fullday: { plan, dias } | null,
       salon:   { id, dias } | null,
       comida:  [ { id, cant } ] | null }                                             */
  function cotizar(a, reglas, pedido, hoy) {
    var P = a.precios || {}, lineas = [], avisos = [];
    var adultos = Math.max(0, parseInt(pedido.adultos, 10) || 0);
    var ninos = Math.max(0, parseInt(pedido.ninos, 10) || 0);
    var personas = adultos + ninos;
    var desde = pedido.desde, hasta = pedido.hasta || pedido.desde;
    var noches = (valida(desde) && valida(hasta)) ? diasEntre(desde, hasta) : 0;
    var factorN = reglas.ninos_factor == null ? 0.5 : reglas.ninos_factor;

    function agregar(cat, que, detalle, normal) {
      var pct = pctDe(reglas, cat);
      var desc = Math.round(normal * pct / 100);
      lineas.push({ cat: cat, que: que, detalle: detalle, normal: normal, pct: pct, descuento: desc, total: normal - desc,
                    saldo: (reglas.saldo_cubre || []).indexOf(cat) >= 0 });
    }

    if (!valida(desde)) avisos.push("Elija la fecha de inicio.");
    else {
      if (hoy && diasEntre(hoy, desde) < 0) avisos.push("La fecha de inicio ya pasó.");
      if (diasEntre(desde, hasta) < 0) avisos.push("La fecha final no puede ser antes de la de inicio.");
      if (diasEntre(a.vence, hasta) > 0) avisos.push("Su membresía vence el " + fecha(a.vence) + ". Los días posteriores se cotizan con la tarifa del momento.");
    }

    if (pedido.estadia) {
      var h = buscarId(P.alojamiento, pedido.estadia.hab);
      var cant = Math.max(1, parseInt(pedido.estadia.cantidad, 10) || 1);
      if (!h) avisos.push("Elija el tipo de habitación.");
      else if (noches < 1) avisos.push("Para la estadía, la salida debe ser al menos un día después de la llegada.");
      else {
        var det = plural(cant, "habitación", "habitaciones") + ", " + plural(noches, "noche", "noches");
        agregar("alojamiento", h.nombre, det, cent(h.noche) * cant * noches);
        var com = pedido.estadia.comida;
        if (com && com !== "solo" && h.comidas && h.comidas[com] != null) {
          var nom = (reglas.comidas_hospedaje && reglas.comidas_hospedaje[com]) || com;
          agregar("comida", "Comidas del hospedaje: " + nom.replace(/^Con /, "").toLowerCase(), det, cent(h.comidas[com]) * cant * noches);
        }
        if (personas > h.capacidad * cant) avisos.push("Son " + personas + " personas y " + plural(cant, "habitación", "habitaciones") + " de " + h.nombre.replace(/^Habitación /, "") + " alcanzan para " + (h.capacidad * cant) + ". Agregue otra habitación.");
      }
    }

    if (pedido.fullday) {
      var f = buscarId(P.entradas, pedido.fullday.plan);
      var dias = Math.max(1, parseInt(pedido.fullday.dias, 10) || 1);
      if (!f) avisos.push("Elija el plan de Full Day.");
      else if (adultos < 1 && ninos < 1) avisos.push("Indique cuántas personas van.");
      else {
        var nF = cent(f.precio) * adultos * dias + Math.round(cent(f.precio) * factorN) * ninos * dias;
        var detF = plural(adultos, "adulto", "adultos") + (ninos ? " y " + plural(ninos, "niño", "niños") : "") + (dias > 1 ? ", " + dias + " días" : "");
        agregar(f.cat || "entradas", f.nombre, detF, nF);
      }
    }

    if (pedido.salon) {
      var s = buscarId(P.salones, pedido.salon.id);
      var diasS = Math.max(1, parseInt(pedido.salon.dias, 10) || 1);
      if (!s) avisos.push("Elija el salón o el plan de evento.");
      else if (s.por === "evento") {
        agregar(s.cat || "planes", s.nombre, s.detalle + (diasS > 1 ? ", " + diasS + " días" : ""), cent(s.precio) * diasS);
      } else {
        var cobro = Math.max(personas, s.minimo || 1);
        if (s.capacidad && personas > s.capacidad) avisos.push(s.nombre + " tiene capacidad para " + s.capacidad + " personas.");
        var detS = (s.horas ? s.horas + " horas, " : "") + plural(cobro, "persona", "personas") + (cobro > personas ? " (mínimo del espacio)" : "") + (diasS > 1 ? ", " + diasS + " días" : "");
        agregar(s.cat || "salones", s.nombre, detS, cent(s.precio) * cobro * diasS);
      }
    }

    (pedido.comida || []).forEach(function (it) {
      var c = buscarId(P.comida, it.id), n = parseInt(it.cant, 10) || 0;
      if (c && n > 0) agregar("comida", c.nombre, n + " × " + dinero(cent(c.precio)), cent(c.precio) * n);
    });

    var normal = 0, total = 0, cubrible = 0;
    lineas.forEach(function (l) { normal += l.normal; total += l.total; if (l.saldo) cubrible += l.total; });
    var disp = saldo(a);
    var cubierto = Math.min(disp, cubrible);
    if (!lineas.length && !avisos.length) avisos.push("Elija al menos un servicio.");
    return { lineas: lineas, avisos: avisos, noches: noches, personas: personas, adultos: adultos, ninos: ninos,
             normal: normal, ahorro: normal - total, total: total, cubrible: cubrible,
             saldo: disp, cubierto: cubierto, porPagar: total - cubierto, saldoDespues: disp - cubierto };
  }

  function rangoTexto(pedido, r) {
    var d = pedido.desde, h = pedido.hasta || pedido.desde;
    if (!valida(d)) return "";
    if (d === h || !valida(h)) return "el " + fecha(d, true);
    return "del " + fecha(d, true) + " al " + fecha(h, true) + (r.noches > 0 ? " (" + plural(r.noches, "noche", "noches") + ")" : "");
  }

  /* El mensaje ordenado que se manda por WhatsApp. */
  function mensaje(a, reglas, pedido, r) {
    var L = [];
    L.push("Hola Mansión La Faraona, soy afiliado y le envío mi cotización desde el portal.");
    L.push("");
    L.push("Afiliado: " + a.nombre + " (" + a.tipo_nombre + ")");
    L.push("Código: " + a.codigo);
    L.push("Fechas: " + rangoTexto(pedido, r));
    L.push("Personas: " + plural(r.adultos, "adulto", "adultos") + (r.ninos ? " y " + plural(r.ninos, "niño", "niños") + " de 3 a 8 años" : ""));
    L.push("");
    L.push("Lo que elegí:");
    r.lineas.forEach(function (l, i) {
      L.push((i + 1) + ". " + l.que + " (" + l.detalle + "): " + dinero(l.normal) + (l.pct ? ", con " + l.pct + " % de descuento: " + dinero(l.total) : ""));
    });
    L.push("");
    L.push("Precio normal: " + dinero(r.normal));
    L.push("Con mis descuentos: " + dinero(r.total) + " (ahorro de " + dinero(r.ahorro) + ")");
    L.push("Cubierto con mi saldo: " + dinero(r.cubierto) + " (saldo actual " + dinero(r.saldo) + ", me quedaría " + dinero(r.saldoDespues) + ")");
    L.push("Por pagar: " + dinero(r.porPagar));
    if (pedido.nota && String(pedido.nota).trim()) { L.push(""); L.push("Nota: " + String(pedido.nota).trim()); }
    L.push("");
    L.push("Precios congelados el " + fecha(a.compra) + ". " + (reglas.iva || "No incluye IVA."));
    L.push("(Demostración del portal con datos de ejemplo)");
    return L.join("\n");
  }

  var API = { cent: cent, dinero: dinero, fecha: fecha, fechaCorta: fechaCorta, valida: valida, diasEntre: diasEntre, normCodigo: normCodigo, normDoc: normDoc,
              buscar: buscar, consumido: consumido, saldo: saldo, vigencia: vigencia, conDescuento: conDescuento, pctDe: pctDe,
              cotizar: cotizar, mensaje: mensaje, rangoTexto: rangoTexto, plural: plural };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.FaraonaCalculo = API;
})(this);
