/* Arma el PDF de un documento con pdfmake (texto real, se puede copiar, pesa poco).
   El mismo formato para los cuatro tipos: solo cambia el título y lo que cada tipo muestra (montos, pagos).
   Todo lo que escribe la persona va como texto de pdfmake, nunca como HTML. */
(function () {
  "use strict";

  var NUM = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function num(n) { return NUM.format(Number(n) || 0); }
  function fecha(s) { if (!s) return ""; var p = String(s).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function fechaLarga(s) { if (!s) return ""; var p = String(s).split("-"); return Number(p[2]) + " de " + MESES[Number(p[1]) - 1] + " de " + p[0]; }
  function sumarDias(s, n) {
    var d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + (Number(n) || 0));
    return d.toISOString().slice(0, 10);
  }
  function plural(n, uno, varios) { return n + " " + (n === 1 ? uno : varios); }
  function unir(partes) {
    partes = partes.filter(Boolean);
    if (partes.length < 2) return partes.join("");
    return partes.slice(0, -1).join(", ") + " y " + partes[partes.length - 1];
  }
  function pasajeros(v) {
    return unir([
      v.adultos ? plural(v.adultos, "adulto", "adultos") : "",
      v.ninos ? plural(v.ninos, "niño", "niños") : "",
      v.infantes ? plural(v.infantes, "infante", "infantes") : "",
    ]);
  }
  function importe(r) { return Math.round((Number(r.cantidad) || 0) * (Number(r.precio) || 0) * 100) / 100; }

  function nombreArchivo(doc) {
    var c = String((doc.datos && doc.datos.cliente && doc.datos.cliente.nombre) || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9 ]+/g, "").trim().replace(/\s+/g, " ").slice(0, 40);
    return doc.numero + (c ? " " + c : "") + ".pdf";
  }

  function fuentes(conf) {
    var f = conf.pdf.fuentes;
    return {
      Tit: { normal: f.titulo.normal, bold: f.titulo.bold, italics: f.titulo.normal, bolditalics: f.titulo.bold },
      Txt: { normal: f.texto.normal, bold: f.texto.bold, italics: f.texto.normal, bolditalics: f.texto.bold },
    };
  }

  function armar(doc, conf) {
    var tipo = conf.documentos[doc.tipo];
    var E = conf.etiquetas, A = conf.agencia, col = conf.panel.colores, M = conf.moneda;
    var d = doc.datos, v = d.viaje, c = d.cliente;
    var din = function (n) { return M.simbolo + " " + num(n); };
    var ANCHO = 515;

    var lineas = {
      hLineWidth: function (i, node) { return i === 0 || i === node.table.body.length ? 0 : 0.6; },
      vLineWidth: function () { return 0; },
      hLineColor: function () { return col.linea; },
      paddingLeft: function () { return 0; },
      paddingRight: function (i) { return i === 0 ? 10 : 0; },
      paddingTop: function () { return 4.5; },
      paddingBottom: function () { return 4.5; },
    };

    function pares(lista) {
      lista = lista.filter(function (p) { return p && (p[2] || p[1] !== ""); });
      if (!lista.length) return { text: "" };
      return {
        table: { widths: [78, "*"], body: lista.map(function (p) { return [{ text: p[0], style: "etq" }, { text: String(p[1] || " "), style: "val" }]; }) },
        layout: lineas,
      };
    }
    function seccion(titulo, cuerpo, extra) {
      var s = { stack: [{ text: titulo, style: "secTit" }, cuerpo], margin: [0, 16, 0, 0] };
      if (extra) for (var k in extra) s[k] = extra[k];
      return s;
    }

    var contenido = [];

    // Cabecera: logo y datos de la agencia.
    var datosAg = [{ text: A.nombre, style: "agNombre" }];
    if (A.rif) datosAg.push({ text: "RIF " + A.rif });
    datosAg.push({ text: A.direccion });
    datosAg.push({ text: (A.telefonos || []).join("     ") });
    datosAg.push({ text: [A.correo, A.web].filter(Boolean).join("     ") });
    contenido.push({
      columns: [
        { image: "logo", fit: [170, 46], width: 180 },
        { width: "*", stack: datosAg, alignment: "right", style: "agDatos" },
      ],
    });
    contenido.push({ canvas: [{ type: "rect", x: 0, y: 0, w: ANCHO, h: 3, linearGradient: [col.c1, col.c2, col.c3] }], margin: [0, 14, 0, 18] });

    // Título y datos del documento.
    var meta = [[E.numero, doc.numero], [E.emision, fecha(doc.emision)]];
    if (doc.tipo === "cotizacion" && d.validez_dias) meta.push([E.valida_hasta, fecha(sumarDias(doc.emision, d.validez_dias))]);
    if (doc.asesor) meta.push([E.asesor, doc.asesor]);
    contenido.push({
      columns: [
        { width: "*", stack: [{ text: tipo.titulo, style: "titulo" }, v.destino ? { text: v.destino, style: "bajada" } : { text: "" }] },
        {
          width: 200,
          table: { widths: [86, "*"], body: meta.map(function (p, i) { return [{ text: p[0], style: "etq" }, { text: p[1], style: i === 0 ? "numero" : "val", alignment: "right" }]; }) },
          layout: lineas,
        },
      ],
      columnGap: 24,
    });

    // Cliente.
    contenido.push(seccion(E.seccion_cliente, {
      columns: [
        pares([[E.cliente, c.nombre, true], [E.documento, c.documento, true]]),
        pares([[E.telefono, c.telefono, true], [E.correo, c.correo]]),
      ],
      columnGap: 24,
    }));

    // Viaje.
    var izq = [[E.tipo_viaje, v.clase === "boletos" ? "Boletos" : "Paquete", true], [E.destino, v.destino, true], [E.ida, fecha(v.ida), true], [E.vuelta, fecha(v.vuelta), true]];
    if (v.noches) izq.push([E.noches, String(v.noches)]);
    var der = [[E.pasajeros, pasajeros(v), true], [E.hotel, v.hotel], [E.regimen, v.regimen], [E.traslados, v.traslados]];
    var viaje = [{ columns: [pares(izq), pares(der)], columnGap: 24 }];
    if (v.vuelos) viaje.push({ margin: [0, 6, 0, 0], table: { widths: [78, "*"], body: [[{ text: E.vuelos, style: "etq" }, { text: v.vuelos, style: "val" }]] }, layout: lineas });
    if (doc.tipo === "voucher") {
      viaje.unshift({
        table: { widths: ["*"], body: [[{ stack: [{ text: E.confirmacion, style: "etq" }, { text: v.confirmacion || " ", style: "codigo" }], margin: [12, 8, 12, 8] }]] },
        layout: { hLineWidth: function () { return 0; }, vLineWidth: function () { return 0; }, fillColor: function () { return col.campo; } },
        margin: [0, 0, 0, 8],
      });
    }
    contenido.push(seccion(E.seccion_viaje, { stack: viaje }));

    // Incluye y no incluye.
    if ((d.incluye && d.incluye.length) || (d.no_incluye && d.no_incluye.length)) {
      var lista = function (titulo, items, color) {
        return {
          width: "*",
          stack: [{ text: titulo, style: "subTit" }, items && items.length ? { ul: items, markerColor: color, style: "val", margin: [0, 2, 0, 0] } : { text: "Nada indicado.", style: "etq" }],
        };
      };
      contenido.push({
        columns: [lista(E.incluye, d.incluye, col.c1), lista(E.no_incluye, d.no_incluye, col.suave)],
        columnGap: 24, margin: [0, 16, 0, 0],
      });
    }

    // Pago recibido (comprobante).
    if (doc.tipo === "comprobante" && d.pago) {
      var p = d.pago;
      var frase = "Recibimos de " + c.nombre + (p.fecha ? " el " + fechaLarga(p.fecha) : "") + (p.metodo ? " por " + p.metodo : "") +
        (p.referencia ? ", referencia " + p.referencia : "") + ".";
      contenido.push(seccion(E.recibimos, {
        table: {
          widths: ["*", "auto"],
          body: [[{ text: frase, style: "val", margin: [12, 10, 0, 10] }, { text: din(p.monto), style: "pagoMonto", margin: [0, 7, 12, 7], alignment: "right" }]],
        },
        layout: { hLineWidth: function () { return 0; }, vLineWidth: function () { return 0; }, fillColor: function () { return col.campo; } },
      }));
    }

    // Montos.
    if (tipo.montos) {
      var filas = [[
        { text: E.descripcion, style: "th" }, { text: E.cantidad, style: "th", alignment: "right" },
        { text: E.precio, style: "th", alignment: "right" }, { text: E.importe, style: "th", alignment: "right" },
      ]];
      (d.renglones || []).forEach(function (r) {
        filas.push([{ text: r.descripcion, style: "val" }, { text: String(r.cantidad).replace(".", ","), style: "val", alignment: "right" },
          { text: din(r.precio), style: "val", alignment: "right" }, { text: din(importe(r)), style: "val", alignment: "right" }]);
      });
      if (filas.length === 1) filas.push([{ text: "Sin renglones.", style: "etq", colSpan: 4 }, {}, {}, {}]);
      var total = (d.renglones || []).reduce(function (s, r) { return s + importe(r); }, 0);
      var tot = [[{ text: E.total, style: "totEtq" }, { text: din(total), style: "totVal", alignment: "right" }]];
      if (tipo.pagos) {
        var abonado = doc.tipo === "proforma"
          ? (d.abonos || []).reduce(function (s, a) { return s + a.monto; }, 0)
          : (d.abonos_previos || []).reduce(function (s, a) { return s + a.monto; }, 0) + (d.pago ? d.pago.monto : 0);
        tot.push([{ text: E.abonado, style: "etq" }, { text: din(abonado), style: "val", alignment: "right" }]);
        tot.push([{ text: E.saldo, style: "saldoEtq" }, { text: din(total - abonado), style: "saldoVal", alignment: "right" }]);
      }
      var montos = [
        {
          table: { headerRows: 1, widths: ["*", 40, 82, 88], body: filas },
          layout: {
            hLineWidth: function (i, node) { return i === 0 ? 0 : i === node.table.body.length ? 1 : 0.6; },
            vLineWidth: function () { return 0; },
            hLineColor: function (i, node) { return i === node.table.body.length ? col.tinta : col.linea; },
            fillColor: function (i) { return i === 0 ? col.campo : null; },
            paddingLeft: function (i) { return i === 0 ? 8 : 4; }, paddingRight: function (i, node) { return i === node.table.widths.length - 1 ? 8 : 4; },
            paddingTop: function () { return 5; }, paddingBottom: function () { return 5; },
          },
        },
        {
          columns: [{ width: "*", text: "" }, {
            width: 220,
            table: { widths: ["*", "auto"], body: tot },
            layout: { hLineWidth: function () { return 0; }, vLineWidth: function () { return 0; }, paddingLeft: function () { return 0; }, paddingRight: function (i) { return i === 1 ? 8 : 0; }, paddingTop: function () { return 3; }, paddingBottom: function () { return 3; } },
          }],
          margin: [0, 6, 0, 0],
        },
      ];
      if (d.bs && d.bs.mostrar && d.bs.tasa) {
        var t = Number(d.bs.tasa);
        var txt = E.equivalente + ": Bs. " + num(total * t);
        if (tipo.pagos) txt += ". Saldo: Bs. " + num((total - abonado) * t);
        txt += ". Tasa: Bs. " + num(t) + " por dólar" + (d.bs.fecha || doc.emision ? ", del " + fecha(d.bs.fecha || doc.emision) : "") + ".";
        montos.push({ text: txt, style: "etq", alignment: "right", margin: [0, 6, 8, 0] });
      }
      contenido.push(seccion(E.seccion_montos, { stack: montos }));
    }

    // Pagos registrados.
    if (tipo.pagos) {
      var pagos = doc.tipo === "proforma" ? (d.abonos || []) : (d.abonos_previos || []).concat(d.pago ? [d.pago] : []);
      if (pagos.length) {
        var fp = [[{ text: "Fecha", style: "th" }, { text: "Método", style: "th" }, { text: "Referencia", style: "th" }, { text: "Monto", style: "th", alignment: "right" }]];
        pagos.forEach(function (a) {
          var este = doc.tipo === "comprobante" && d.pago && a.id === d.pago.id;
          fp.push([{ text: fecha(a.fecha), style: este ? "valB" : "val" }, { text: a.metodo || "", style: este ? "valB" : "val" },
            { text: a.referencia || "", style: este ? "valB" : "val" }, { text: din(a.monto), style: este ? "valB" : "val", alignment: "right" }]);
        });
        contenido.push(seccion(E.seccion_pagos, {
          table: { headerRows: 1, widths: [70, "*", "*", 88], body: fp },
          layout: {
            hLineWidth: function (i) { return i === 0 ? 0 : 0.6; }, vLineWidth: function () { return 0; }, hLineColor: function () { return col.linea; },
            fillColor: function (i) { return i === 0 ? col.campo : null; },
            paddingLeft: function (i) { return i === 0 ? 8 : 4; }, paddingRight: function (i, node) { return i === node.table.widths.length - 1 ? 8 : 4; },
            paddingTop: function () { return 5; }, paddingBottom: function () { return 5; },
          },
        }));
      }
    }

    if (d.notas) contenido.push(seccion(E.notas, { text: d.notas, style: "val" }));

    if (tipo.condiciones && tipo.condiciones.length) {
      contenido.push(seccion(E.condiciones, { ol: tipo.condiciones, style: "cond", markerColor: col.suave }, { unbreakable: true }));
    }

    var dd = {
      pageSize: "A4",
      pageMargins: [40, 40, 40, 56],
      info: { title: tipo.titulo + " " + doc.numero, author: A.nombre, subject: tipo.titulo + (v.destino ? ", " + v.destino : ""), creator: A.nombre, producer: A.nombre },
      content: contenido,
      images: { logo: location.origin + conf.pdf.logo },
      footer: function (pag, total) {
        return {
          margin: [40, 18, 40, 0],
          columns: [
            { text: conf.pdf.pie, style: "pie" },
            { text: doc.numero + ", página " + pag + " de " + total, style: "pie", alignment: "right", width: 160 },
          ],
        };
      },
      defaultStyle: { font: "Txt", fontSize: 9.5, color: col.tinta, lineHeight: 1.22 },
      styles: {
        agNombre: { font: "Tit", bold: true, fontSize: 11, color: col.tinta, margin: [0, 0, 0, 2] },
        agDatos: { fontSize: 8, color: col.suave, lineHeight: 1.3 },
        titulo: { font: "Tit", bold: true, fontSize: 26, color: col.tinta, lineHeight: 1 },
        bajada: { font: "Tit", fontSize: 11, color: col.acento, margin: [0, 6, 0, 0] },
        numero: { font: "Tit", bold: true, fontSize: 10.5, color: col.tinta },
        secTit: { font: "Tit", bold: true, fontSize: 9, color: col.acento, margin: [0, 0, 0, 4], characterSpacing: 0.3 },
        subTit: { font: "Tit", bold: true, fontSize: 9, color: col.tinta, margin: [0, 0, 0, 2] },
        etq: { fontSize: 8.5, color: col.suave },
        val: { fontSize: 9.5, color: col.tinta },
        valB: { fontSize: 9.5, color: col.tinta, bold: true },
        th: { font: "Tit", bold: false, fontSize: 8, color: col.suave },
        totEtq: { font: "Tit", bold: true, fontSize: 10 },
        totVal: { font: "Tit", bold: true, fontSize: 10 },
        saldoEtq: { font: "Tit", bold: true, fontSize: 10, color: col.acento },
        saldoVal: { font: "Tit", bold: true, fontSize: 12, color: col.acento },
        pagoMonto: { font: "Tit", bold: true, fontSize: 16, color: col.acento },
        codigo: { font: "Tit", bold: true, fontSize: 15, color: col.tinta, characterSpacing: 0.5 },
        cond: { fontSize: 8, color: col.suave, lineHeight: 1.3 },
        pie: { fontSize: 7.5, color: col.suave },
      },
    };
    if (doc.estado === "anulado") dd.watermark = { text: "Anulado", font: "Tit", bold: true, color: "#B42323", opacity: 0.14, angle: -40 };
    return dd;
  }

  window.DocPDF = { armar: armar, fuentes: fuentes, nombreArchivo: nombreArchivo, fecha: fecha, fechaLarga: fechaLarga, sumarDias: sumarDias, pasajeros: pasajeros, num: num };
})();
