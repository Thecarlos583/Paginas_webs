/* Panel de documentos (/admin). Una sola página; el JS cambia de pantalla según el #.
   Todo lo que escribe la persona se pinta con textContent (nunca como HTML). */
(function () {
  "use strict";

  var CONF = JSON.parse(document.getElementById("conf").textContent);
  var E = CONF.etiquetas, DOCS = CONF.documentos, AG = CONF.agencia, M = CONF.moneda, L = CONF.listas;
  var TIPOS = ["cotizacion", "proforma", "comprobante", "voucher"];
  var CORTO = { cotizacion: "Cotización", proforma: "Proforma", comprobante: "Comprobante", voucher: "Voucher" };
  var MASC = { comprobante: true, voucher: true };
  var NUEVO = { cotizacion: "Nueva cotización", proforma: "Nueva proforma", comprobante: "Nuevo comprobante", voucher: "Nuevo voucher" };
  var PDFMAKE = "https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js";
  var PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
  var PDFJS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  var XLSX_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
  var P = window.DocPDF;

  var app = document.getElementById("app");
  var yo = null, demo = false;

  /* ---------- utilidades ---------- */

  function el(tag, props) {
    var n = document.createElement(tag);
    if (props) for (var k in props) {
      var v = props[k];
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "icono") n.insertAdjacentHTML("afterbegin", ICONOS[v] || "");
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else if (k === "value") n.value = v;
      else if (k === "checked" || k === "disabled" || k === "selected") n[k] = !!v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (var i = 2; i < arguments.length; i++) poner(n, arguments[i]);
    return n;
  }
  function poner(n, x) {
    if (x == null || x === false) return;
    if (Array.isArray(x)) { x.forEach(function (y) { poner(n, y); }); return; }
    n.append(x instanceof Node ? x : document.createTextNode(String(x)));
  }
  function vaciar(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

  var ICONOS = {
    inicio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/></svg>',
    docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="M8.5 13h7M8.5 16.5h5"/></svg>',
    clientes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2"/></svg>',
    ajustes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>',
    mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    menos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    buscar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.6-.5-1-1.1-1.3-1.7-.1-.2 0-.4.1-.5l.4-.4.3-.5v-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.6-1 2.5.1 1.1.5 2.1 1.2 3 1.2 1.7 2.8 3.1 4.7 3.9.5.2 1 .4 1.5.5.6.2 1.2.1 1.7 0 .6-.2 1.1-.6 1.4-1.1.2-.4.2-.8.1-1.2l-.4-.1z"/></svg>',
    bajar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10.5 5 5 5-5"/><path d="M5 20h14"/></svg>',
    imprimir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
    editar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
    atras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    listo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    avion: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 15.5v-1.8l-8-5V3.4a1.4 1.4 0 0 0-2.8 0v5.3l-8 5v1.8l8-2.5v5.3l-2 1.5V21l3.4-1 3.4 1v-1.2l-2-1.5V13z"/></svg>',
    flecha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
  };

  var NUM = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function din(n) { return M.simbolo + " " + NUM.format(Number(n) || 0); }
  function cent(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function aNum(s) {
    if (typeof s === "number") return s;
    var t = String(s == null ? "" : s).trim().replace(/\s/g, "");
    if (!t) return null;
    // "1.234,56" o "1234,56" o "1234.56"
    if (t.indexOf(",") >= 0) t = t.replace(/\./g, "").replace(",", ".");
    var n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  function hoy() { return new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10); }
  function diasEntre(a, b) { return Math.round((new Date(b + "T12:00:00Z") - new Date(a + "T12:00:00Z")) / 864e5); }
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function telWa(t) {
    var d = String(t || "").replace(/\D/g, "");
    if (/^0\d{10}$/.test(d)) return "58" + d.slice(1);
    if (/^4\d{9}$/.test(d)) return "58" + d;
    return d.length >= 10 ? d : "";
  }
  function esTelefono() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)); }
  function saludo() {
    var h = new Date(Date.now() - 4 * 3600 * 1000).getUTCHours();
    return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  }
  function primerNombre(s) { return String(s || "").split(" ")[0]; }

  /* ---------- red ---------- */

  function api(ruta, opc) {
    opc = opc || {};
    var init = { method: opc.method || "GET", credentials: "same-origin", headers: { "x-panel": "1" } };
    if (opc.body !== undefined) { init.headers["content-type"] = "application/json"; init.body = JSON.stringify(opc.body); }
    return fetch("/api/admin/" + ruta, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && d.sesion === false) { yo = null; ir("#/entrar"); throw new Error(d.error || "Su sesión venció."); }
        if (!r.ok) { var e = new Error(d.error || "Algo falló. Intente de nuevo."); e.datos = d; e.estado = r.status; throw e; }
        return d;
      });
    }, function () { throw new Error("No hay conexión. Revise el internet e intente de nuevo."); });
  }

  var scripts = {};
  function cargarScript(url) {
    if (!scripts[url]) scripts[url] = new Promise(function (ok, mal) {
      var s = document.createElement("script"); s.src = url; s.async = true; s.crossOrigin = "anonymous";
      s.onload = ok; s.onerror = function () { delete scripts[url]; mal(new Error("No se pudo cargar una herramienta. Revise el internet.")); };
      document.head.appendChild(s);
    });
    return scripts[url];
  }

  /* ---------- avisos y diálogos ---------- */

  var tAviso;
  function aviso(msg) {
    var a = document.getElementById("aviso");
    a.textContent = msg; a.classList.add("ver");
    clearTimeout(tAviso); tAviso = setTimeout(function () { a.classList.remove("ver"); }, 3800);
  }

  function dialogo(titulo, contenido, botones) {
    var d = el("dialog", { class: "dlg", "aria-labelledby": "dlg-t" });
    var cerrar = function () { d.close(); };
    d.append(el("div", { class: "dlg-in" },
      el("div", { class: "dlg-cab" }, el("h2", { class: "dlg-tit", id: "dlg-t", text: titulo }),
        el("button", { class: "icono-btn", type: "button", "aria-label": "Cerrar", icono: "cerrar", onclick: cerrar })),
      contenido, el("div", { class: "dlg-acc" }, botones || [])));
    d.addEventListener("close", function () { d.remove(); });
    d.addEventListener("click", function (e) { if (e.target === d) cerrar(); });
    document.body.append(d);
    d.showModal();
    return d;
  }

  function confirmar(titulo, texto, si, peligro) {
    return new Promise(function (ok) {
      var d = dialogo(titulo, el("p", { class: "linea", text: texto }), [
        el("button", { class: "btn " + (peligro ? "btn-peligro" : "btn-marca"), type: "button", text: si, onclick: function () { ok(true); d.close(); } }),
        el("button", { class: "btn btn-suave", type: "button", text: "Cancelar", onclick: function () { ok(false); d.close(); } }),
      ]);
      d.addEventListener("close", function () { ok(false); });
    });
  }

  function error(msg) { return el("p", { class: "error", role: "alert", text: msg }); }

  /* ---------- navegación ---------- */

  function ir(h) { if (location.hash === h) pintar(); else location.hash = h; }

  var SECCIONES = [["#/", "Inicio", "inicio"], ["#/documentos", "Documentos", "docs"], ["#/clientes", "Clientes", "clientes"], ["#/ajustes", "Ajustes", "ajustes"]];
  function pintarNav(actual) {
    var nav = document.getElementById("nav");
    nav.hidden = !yo;
    vaciar(nav);
    if (!yo) return;
    SECCIONES.forEach(function (s) {
      var activa = actual === s[0];
      nav.append(el("a", { href: s[0], class: "nav-a" + (activa ? " activa" : ""), "aria-current": activa ? "page" : null, icono: s[2] }, el("span", { text: s[1] })));
    });
  }

  function pantalla(titulo, atras) {
    vaciar(app);
    var v = el("section", { class: "vista" });
    if (atras) v.append(el("a", { class: "atras", href: atras[0], icono: "atras" }, el("span", { text: atras[1] })));
    if (titulo) v.append(el("h1", { class: "tit", text: titulo }));
    app.append(v);
    window.scrollTo(0, 0);
    return v;
  }

  function cargando(v, txt) { var p = el("p", { class: "cargando", text: txt || "Cargando…" }); v.append(p); return p; }

  var limpiezas = [];
  function alSalir(f) { limpiezas.push(f); }

  function pintar() {
    limpiezas.splice(0).forEach(function (f) { try { f(); } catch (e) { /* nada */ } });
    var h = location.hash || "#/";
    if (!yo && h !== "#/entrar") { location.replace("#/entrar"); return; }
    if (yo && h === "#/entrar") { location.replace("#/"); return; }
    var m;
    var base = (h.match(/^#\/[a-z]*/) || ["#/"])[0];
    pintarNav(base === "#/doc" || base === "#/nuevo" ? "#/documentos" : base === "#/cliente" ? "#/clientes" : base);
    if (h === "#/entrar") return vEntrar();
    if (h === "#/" || h === "#") return vInicio();
    if (h === "#/documentos") return vDocumentos();
    if ((m = h.match(/^#\/nuevo\/([a-z]+)(?:\/(\d+))?$/)) && TIPOS.indexOf(m[1]) >= 0) return vEditor(m[1], null, m[2] ? Number(m[2]) : null);
    if ((m = h.match(/^#\/doc\/(\d+)\/editar$/))) return vEditorDe(Number(m[1]));
    if ((m = h.match(/^#\/doc\/(\d+)$/))) return vDoc(Number(m[1]));
    if (h === "#/clientes") return vClientes();
    if ((m = h.match(/^#\/cliente\/(\d+)$/))) return vCliente(Number(m[1]));
    if (h === "#/ajustes") return vAjustes();
    location.replace("#/");
  }

  /* ---------- entrar ---------- */

  function vEntrar() {
    var v = pantalla();
    var usuario = el("input", { class: "entrada", id: "usuario", name: "usuario", autocomplete: "username", autocapitalize: "off", autocorrect: "off", spellcheck: "false", required: true, enterkeyhint: "next" });
    var clave = el("input", { class: "entrada", id: "clave", name: "clave", type: "password", autocomplete: "current-password", autocapitalize: "off", spellcheck: "false", required: true, enterkeyhint: "go" });
    var ver = el("button", { class: "clave-ver", type: "button", "aria-controls": "clave", "aria-pressed": "false", text: "Mostrar", onclick: function () {
      var m = clave.type === "password"; clave.type = m ? "text" : "password"; ver.textContent = m ? "Ocultar" : "Mostrar"; ver.setAttribute("aria-pressed", String(m));
    } });
    var err = el("div");
    var btn = el("button", { class: "btn btn-marca", type: "submit", text: "Entrar" });
    var f = el("form", { class: "pila", novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      vaciar(err);
      if (!usuario.value.trim() || !clave.value) { err.append(error("Escriba su usuario y su contraseña.")); return; }
      btn.disabled = true; btn.textContent = "Entrando…";
      api("entrar", { method: "POST", body: { usuario: usuario.value.trim(), clave: clave.value } }).then(function () {
        return iniciar();
      }).catch(function (e2) {
        err.append(error(e2.message)); btn.disabled = false; btn.textContent = "Entrar"; clave.select();
      });
    } },
      el("div", { class: "campo" }, el("label", { for: "usuario", text: "Usuario" }), usuario),
      el("div", { class: "campo" }, el("label", { for: "clave", text: "Contraseña" }), el("div", { class: "clave-caja" }, clave, ver)),
      err, btn);
    v.classList.add("v-entrar");
    v.append(el("div", { class: "entrar-caja" },
      el("div", { class: "mini-ruta", "aria-hidden": "true" }, TIPOS.map(function (t, i) { return el("span", { class: "mr-p" + (i === 3 ? " mr-fin" : ""), icono: i === 3 ? "avion" : null }); })),
      el("h1", { class: "tit", text: CONF.panel.nombre }),
      el("p", { class: "linea", text: "Cotizaciones, proformas, comprobantes de pago y vouchers de " + AG.nombre_corto + ", con su formato y listos para enviar." }),
      f,
      el("p", { class: "ayuda", text: "La sesión queda abierta 30 días en este equipo." })));
    setTimeout(function () { usuario.focus(); }, 50);
  }

  /* ---------- listas de documentos ---------- */

  function chipTipo(t) { return el("span", { class: "tipo tipo-" + t, text: CORTO[t] }); }

  function filaDoc(d) {
    var monto = d.tipo === "voucher" ? null : d.tipo === "proforma" || d.tipo === "comprobante"
      ? (d.saldo > 0.004 ? el("span", { class: "fd-saldo", text: "Debe " + din(d.saldo) }) : el("span", { class: "fd-pagado", text: "Pagado" }))
      : el("span", { class: "fd-total", text: din(d.total) });
    return el("a", { class: "fd" + (d.estado === "anulado" ? " anulado" : ""), href: "#/doc/" + d.id },
      el("span", { class: "fd-arriba" }, chipTipo(d.tipo), el("span", { class: "fd-num", text: d.numero }), d.estado === "anulado" ? el("span", { class: "fd-anulado", text: "Anulado" }) : null,
        el("span", { class: "fd-fecha", text: P.fecha(d.emision) })),
      el("span", { class: "fd-cli", text: d.cliente }),
      el("span", { class: "fd-abajo" }, el("span", { class: "fd-dest", text: d.destino }), monto));
  }

  function listaDocs(cont, docs, vacio) {
    vaciar(cont);
    if (!docs.length) { cont.append(el("p", { class: "vacio", text: vacio })); return; }
    cont.append(el("div", { class: "lista" }, docs.map(filaDoc)));
  }

  function buscador(ph, alBuscar) {
    var t;
    var inp = el("input", { class: "entrada", type: "search", placeholder: ph, "aria-label": ph, enterkeyhint: "search", autocomplete: "off",
      oninput: function () { clearTimeout(t); t = setTimeout(function () { alBuscar(inp.value.trim()); }, 260); } });
    return el("div", { class: "buscar", icono: "buscar" }, inp);
  }

  /* ---------- inicio ---------- */

  function vInicio() {
    var v = pantalla();
    v.append(el("div", { class: "hola" }, el("h1", { class: "tit", text: saludo() + ", " + primerNombre(yo.nombre) }),
      el("p", { class: "linea", text: yo.rol === "admin" ? "Usted ve todos los documentos de la agencia." : "Aquí ve los documentos que usted hace." })));
    v.append(el("div", { class: "nuevos" },
      el("a", { class: "nuevo nuevo-cot", href: "#/nuevo/cotizacion" },
        el("span", { class: "nuevo-ico", icono: "mas" }), el("span", { class: "nuevo-txt" }, el("strong", { text: NUEVO.cotizacion }), el("span", { text: "Paquetes y boletos" }))),
      ["proforma", "comprobante", "voucher"].map(function (t) {
        return el("a", { class: "nuevo nuevo-" + t, href: "#/nuevo/" + t }, el("span", { class: "nuevo-ico", icono: "mas" }), el("strong", { text: NUEVO[t] }));
      })));
    var res = el("div");
    var tit = el("h2", { class: "sub", text: "Últimos documentos" });
    v.append(buscador("Cliente, número o destino", function (q) {
      tit.textContent = q ? "Resultados" : "Últimos documentos";
      cargar(q);
    }), tit, res);
    function cargar(q) {
      vaciar(res); cargando(res);
      api("documentos?limite=" + (q ? 40 : 8) + (q ? "&q=" + encodeURIComponent(q) : "")).then(function (d) {
        listaDocs(res, d.documentos, q ? "No hay documentos con «" + q + "»." : "Todavía no hay documentos. Empiece con una cotización.");
      }).catch(function (e) { vaciar(res).append(error(e.message)); });
    }
    cargar("");
  }

  /* ---------- todos los documentos ---------- */

  function vDocumentos() {
    var v = pantalla("Documentos");
    var tipo = "", q = "";
    var res = el("div");
    var filtros = el("div", { class: "filtros", role: "group", "aria-label": "Tipo de documento" });
    [["", "Todos"]].concat(TIPOS.map(function (t) { return [t, CORTO[t]]; })).forEach(function (f) {
      filtros.append(el("button", { type: "button", class: "filtro", "aria-pressed": String(f[0] === tipo), text: f[1], onclick: function (e) {
        tipo = f[0];
        filtros.querySelectorAll(".filtro").forEach(function (b) { b.setAttribute("aria-pressed", String(b === e.currentTarget)); });
        cargar();
      } }));
    });
    v.append(buscador("Cliente, número o destino", function (x) { q = x; cargar(); }), filtros, res);
    function cargar() {
      vaciar(res); cargando(res);
      api("documentos?limite=100" + (tipo ? "&tipo=" + tipo : "") + (q ? "&q=" + encodeURIComponent(q) : "")).then(function (d) {
        listaDocs(res, d.documentos, "No hay documentos con ese filtro.");
      }).catch(function (e) { vaciar(res).append(error(e.message)); });
    }
    cargar();
  }

  /* ---------- editor ---------- */

  function modeloVacio(tipo) {
    var cfg = DOCS[tipo];
    var m = {
      emision: hoy(),
      cliente: { id: null, nombre: "", documento: "", telefono: "", correo: "" },
      viaje: { clase: "paquete", destino: "", ida: "", vuelta: "", noches: 0, nochesAMano: false, adultos: 2, ninos: 0, infantes: 0, hotel: "", regimen: "", traslados: "", vuelos: "", confirmacion: "" },
      incluye: [], no_incluye: [],
      renglones: cfg.montos ? [{ descripcion: "Paquete por adulto", cantidad: 2, precio: "", auto: "adultos" }] : [],
      bs: { mostrar: false, tasa: "" },
      validez_dias: cfg.validez_dias || 3,
      notas: "",
    };
    if (tipo === "comprobante") m.pago = { monto: "", fecha: hoy(), metodo: "", referencia: "" };
    return m;
  }

  function modeloDe(doc) {
    var d = JSON.parse(JSON.stringify(doc.datos));
    var m = modeloVacio(doc.tipo);
    m.emision = doc.emision;
    m.cliente = Object.assign(m.cliente, d.cliente);
    m.viaje = Object.assign(m.viaje, d.viaje, { nochesAMano: true });
    m.incluye = d.incluye || []; m.no_incluye = d.no_incluye || [];
    m.renglones = (d.renglones || []).map(function (r) { return { descripcion: r.descripcion, cantidad: r.cantidad, precio: String(r.precio).replace(".", ","), auto: null }; });
    m.bs = { mostrar: !!(d.bs && d.bs.mostrar), tasa: d.bs && d.bs.tasa ? String(d.bs.tasa).replace(".", ",") : "" };
    m.validez_dias = d.validez_dias != null ? d.validez_dias : m.validez_dias;
    m.notas = d.notas || "";
    if (doc.tipo === "comprobante") {
      m.pago = Object.assign({}, d.pago, { monto: d.pago ? String(d.pago.monto).replace(".", ",") : "" });
      m.abonos_previos = d.abonos_previos || [];
    }
    if (doc.tipo === "proforma") m.abonos = d.abonos || [];
    return m;
  }

  function contenidoDe(m) {
    return {
      cliente: m.cliente, viaje: m.viaje, incluye: m.incluye, no_incluye: m.no_incluye,
      renglones: m.renglones.map(function (r) { return { descripcion: r.descripcion, cantidad: aNum(r.cantidad), precio: aNum(r.precio) }; }),
      bs: { mostrar: m.bs.mostrar, tasa: aNum(m.bs.tasa), fecha: m.emision },
      validez_dias: m.validez_dias, notas: m.notas,
      pago: m.pago ? { monto: aNum(m.pago.monto), fecha: m.pago.fecha, metodo: m.pago.metodo, referencia: m.pago.referencia } : undefined,
    };
  }

  function totalDe(m) { return cent(m.renglones.reduce(function (s, r) { return s + cent((aNum(r.cantidad) || 0) * (aNum(r.precio) || 0)); }, 0)); }

  function claveBorrador(tipo, id) { return "doc-borrador:" + yo.id + ":" + (id ? "id:" + id : tipo); }

  function vEditorDe(id) {
    var v = pantalla(null, ["#/doc/" + id, "Volver al documento"]);
    var c = cargando(v);
    api("documentos/" + id).then(function (d) {
      c.remove();
      if (d.documento.estado === "anulado") { v.append(error("Este documento está anulado. No se puede editar.")); return; }
      vEditor(d.documento.tipo, d.documento);
    }).catch(function (e) { c.remove(); v.append(error(e.message)); });
  }

  function vEditor(tipo, doc, clienteId) {
    var cfg = DOCS[tipo];
    var v = pantalla(null, doc ? ["#/doc/" + doc.id, "Volver al documento"] : ["#/", "Inicio"]);
    v.classList.add("v-editor");
    var clave = claveBorrador(tipo, doc && doc.id);
    var m = doc ? modeloDe(doc) : modeloVacio(tipo);
    var recuperado = false;
    try {
      var b = JSON.parse(localStorage.getItem(clave) || "null");
      if (b && b.m && (!doc || b.actualizado === doc.actualizado)) { m = b.m; recuperado = true; }
    } catch (e) { /* borrador dañado: se ignora */ }

    var tGuardar;
    function guardarBorrador() {
      clearTimeout(tGuardar);
      tGuardar = setTimeout(function () {
        try { localStorage.setItem(clave, JSON.stringify({ m: m, actualizado: doc ? doc.actualizado : null, cuando: Date.now() })); } catch (e) { /* sin espacio */ }
      }, 350);
    }
    function cambio() { calcular(); guardarBorrador(); }

    // Campos enlazados al modelo.
    function entrada(obj, k, props) {
      props = props || {};
      var tag = props.multi ? "textarea" : "input";
      var n = el(tag, Object.assign({ class: "llenar" + (props.clase ? " " + props.clase : ""), value: obj[k] == null ? "" : String(obj[k]) }, props.attrs || {}));
      n.addEventListener("input", function () { obj[k] = n.value; if (props.alCambiar) props.alCambiar(n.value); cambio(); });
      return n;
    }
    var nId = 0;
    function fila(etq, control, props) {
      props = props || {};
      var id = "c" + (++nId);
      var ctrl = control.tagName === "INPUT" || control.tagName === "TEXTAREA" || control.tagName === "SELECT" ? control : control.querySelector("input,textarea,select");
      if (ctrl && !ctrl.id) ctrl.id = id;
      return el("div", { class: "fila" + (props.ancha ? " ancha" : "") + (props.clase ? " " + props.clase : "") },
        el(ctrl ? "label" : "span", { class: "fijo", for: ctrl ? ctrl.id : null, text: etq }), control);
    }

    var nodos = {};
    function calcular() {
      if (nodos.total) {
        var t = totalDe(m);
        nodos.total.textContent = din(t);
        m.renglones.forEach(function (r, i) { if (nodos.imp && nodos.imp[i]) nodos.imp[i].textContent = NUM.format(cent((aNum(r.cantidad) || 0) * (aNum(r.precio) || 0))); });
        if (nodos.bs) {
          var tasa = aNum(m.bs.tasa);
          nodos.bs.textContent = m.bs.mostrar && tasa ? "Bs. " + NUM.format(t * tasa) : "";
        }
        if (nodos.saldo) {
          var ab = abonadoDe();
          nodos.abonado.textContent = din(ab);
          nodos.saldo.textContent = din(t - ab);
        }
      }
      if (nodos.valida) nodos.valida.textContent = m.emision ? P.fecha(P.sumarDias(m.emision, Number(m.validez_dias) || 0)) : "";
    }
    function abonadoDe() {
      if (tipo === "proforma") return (m.abonos || []).reduce(function (s, a) { return s + a.monto; }, 0);
      if (tipo === "comprobante") return (m.abonos_previos || []).reduce(function (s, a) { return s + a.monto; }, 0) + (aNum(m.pago.monto) || 0);
      return 0;
    }

    var hoja = el("article", { class: "hoja hoja-" + tipo });

    // Cabecera de la hoja: igual que el PDF.
    var emision = el("input", { class: "llenar llenar-chico", id: "f-emision", type: "date", value: m.emision, max: "2100-12-31" });
    emision.addEventListener("input", function () { m.emision = emision.value || hoy(); cambio(); });
    var meta = el("dl", { class: "hoja-meta" },
      el("div", null, el("dt", { text: E.numero }), doc ? el("dd", { class: "hoja-num", text: doc.numero }) : el("dd", { class: "hoja-num-nuevo", text: "Se asigna al guardar" })),
      el("div", null, el("dt", null, el("label", { for: "f-emision", text: E.emision })), el("dd", null, emision)));
    if (tipo === "cotizacion") {
      var dias = el("input", { class: "llenar llenar-dias", type: "number", inputmode: "numeric", min: "0", max: "90", value: String(m.validez_dias), id: "f-validez" });
      dias.addEventListener("input", function () { m.validez_dias = Math.max(0, Math.min(90, Number(dias.value) || 0)); cambio(); });
      nodos.valida = el("span", { class: "hoja-valida" });
      meta.append(el("div", null, el("dt", null, el("label", { for: "f-validez", text: E.valida_hasta })),
        el("dd", { class: "dd-validez" }, dias, el("span", { class: "fijo-chico", text: "días" }), nodos.valida)));
    }
    hoja.append(el("header", { class: "hoja-cab" },
      el("div", { class: "hoja-ag" },
        el("img", { class: "hoja-logo", src: CONF.pdf.logo, alt: AG.nombre_corto, width: CONF.pdf.logo_ancho, height: CONF.pdf.logo_alto }),
        el("p", { class: "hoja-ag-txt" }, el("span", { text: AG.direccion }), el("span", { text: (AG.telefonos || []).join("   ") }))),
      el("div", { class: "hoja-tit" }, el("h1", { text: cfg.titulo }), meta)));

    if (recuperado) {
      var nota = el("div", { class: "nota" }, el("p", { text: "Recuperamos lo que dejó a medio llenar en este equipo." }),
        el("button", { type: "button", class: "btn-texto", text: "Empezar de cero", onclick: function () {
          localStorage.removeItem(clave); doc ? vEditor(tipo, doc) : vEditor(tipo, null, clienteId);
        } }));
      v.append(nota);
    }
    v.append(el("p", { class: "ayuda ayuda-hoja", text: "Los textos en gris son fijos del formato. Usted solo llena los recuadros." }));

    // Cliente.
    var sug = el("div", { class: "sugerencias", role: "listbox", hidden: true });
    var cDoc = entrada(m.cliente, "documento", { attrs: { autocomplete: "off", autocapitalize: "characters" } });
    var cTel = entrada(m.cliente, "telefono", { attrs: { type: "tel", inputmode: "tel", autocomplete: "off" } });
    var cCorreo = entrada(m.cliente, "correo", { attrs: { type: "email", inputmode: "email", autocomplete: "off", autocapitalize: "off" } });
    var tSug;
    var cNombre = entrada(m.cliente, "nombre", { attrs: { autocomplete: "off", autocapitalize: "words", "aria-autocomplete": "list", role: "combobox", "aria-expanded": "false" }, alCambiar: function (txt) {
      m.cliente.id = null;
      clearTimeout(tSug);
      if (txt.trim().length < 2) { sug.hidden = true; cNombre.setAttribute("aria-expanded", "false"); return; }
      tSug = setTimeout(function () {
        api("clientes?q=" + encodeURIComponent(txt.trim())).then(function (d) {
          vaciar(sug);
          var lista = d.clientes.slice(0, 6);
          if (!lista.length) { sug.hidden = true; cNombre.setAttribute("aria-expanded", "false"); return; }
          lista.forEach(function (c) {
            sug.append(el("button", { type: "button", class: "sug", role: "option", onclick: function () { elegir(c); } },
              el("strong", { text: c.nombre }), el("span", { text: [c.documento, c.telefono].filter(Boolean).join("   ") || "Sin cédula ni teléfono" })));
          });
          sug.append(el("p", { class: "sug-nuevo", text: "Si es un cliente nuevo, siga escribiendo: se guarda solo." }));
          sug.hidden = false; cNombre.setAttribute("aria-expanded", "true");
        }).catch(function () { sug.hidden = true; });
      }, 250);
    } });
    cNombre.addEventListener("blur", function () { setTimeout(function () { sug.hidden = true; cNombre.setAttribute("aria-expanded", "false"); }, 200); });
    function elegir(c) {
      m.cliente = { id: c.id, nombre: c.nombre, documento: c.documento || "", telefono: c.telefono || "", correo: c.correo || "" };
      cNombre.value = m.cliente.nombre; cDoc.value = m.cliente.documento; cTel.value = m.cliente.telefono; cCorreo.value = m.cliente.correo;
      sug.hidden = true; cambio();
      aviso("Datos de " + c.nombre + " cargados.");
    }
    hoja.append(el("section", { class: "hoja-sec" }, el("h2", { class: "sec-tit", text: E.seccion_cliente }),
      el("div", { class: "rejilla" },
        fila(E.cliente, el("div", { class: "con-sug" }, cNombre, sug), { ancha: true }),
        fila(E.documento, cDoc), fila(E.telefono, cTel), fila(E.correo, cCorreo, { ancha: true }))));

    // Viaje.
    var V = m.viaje;
    var clase = el("div", { class: "segmento", role: "radiogroup", "aria-label": E.tipo_viaje });
    [["paquete", "Paquete"], ["boletos", "Boletos"]].forEach(function (o) {
      clase.append(el("button", { type: "button", role: "radio", "aria-checked": String(V.clase === o[0]), text: o[1], onclick: function (e) {
        V.clase = o[0];
        clase.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-checked", String(b === e.currentTarget)); });
        cambio();
      } }));
    });
    var noches = el("input", { class: "llenar llenar-chico", type: "number", inputmode: "numeric", min: "0", max: "365", value: V.noches ? String(V.noches) : "" });
    noches.addEventListener("input", function () { V.noches = Number(noches.value) || 0; V.nochesAMano = true; cambio(); });
    function fechasCambian() {
      if (!V.nochesAMano && V.ida && V.vuelta && V.vuelta >= V.ida) { V.noches = diasEntre(V.ida, V.vuelta); noches.value = String(V.noches); }
    }
    var ida = entrada(V, "ida", { attrs: { type: "date", max: "2100-12-31" }, clase: "llenar-chico", alCambiar: function () { if (vuelta.value && vuelta.value < ida.value) { vuelta.value = ""; V.vuelta = ""; } vuelta.min = ida.value; fechasCambian(); } });
    var vuelta = entrada(V, "vuelta", { attrs: { type: "date", max: "2100-12-31", min: V.ida || null }, clase: "llenar-chico", alCambiar: fechasCambian });

    function contador(k, etq) {
      var n = el("output", { class: "cont-n", text: String(V[k]) });
      var mover = function (d) {
        V[k] = Math.max(0, Math.min(99, (V[k] || 0) + d));
        n.textContent = String(V[k]);
        // Los renglones "por adulto" y "por niño" siguen a la cantidad de pasajeros mientras no se toquen a mano.
        m.renglones.forEach(function (r) { if (r.auto === k) r.cantidad = V[k]; });
        if (k === "ninos" && V.ninos > 0 && cfg.montos && !m.renglones.some(function (r) { return r.auto === "ninos"; }) && m.renglones.some(function (r) { return r.auto === "adultos"; })) {
          m.renglones.push({ descripcion: "Paquete por niño", cantidad: V.ninos, precio: "", auto: "ninos" });
        }
        if (cfg.montos) pintarRenglones();
        cambio();
      };
      return el("div", { class: "contador" }, el("span", { class: "cont-etq", text: etq }),
        el("button", { type: "button", class: "cont-b", "aria-label": "Quitar " + etq.toLowerCase(), icono: "menos", onclick: function () { mover(-1); } }),
        n, el("button", { type: "button", class: "cont-b", "aria-label": "Sumar " + etq.toLowerCase(), icono: "mas", onclick: function () { mover(1); } }));
    }

    function conLista(obj, k, opciones, ph) {
      var id = "dl" + (++nId);
      var inp = entrada(obj, k, { attrs: { list: id, autocomplete: "off", placeholder: ph || "" } });
      return el("div", null, inp, el("datalist", { id: id }, opciones.map(function (o) { return el("option", { value: o }); })));
    }

    var secViaje = el("section", { class: "hoja-sec" }, el("h2", { class: "sec-tit", text: E.seccion_viaje }));
    var rej = el("div", { class: "rejilla" });
    var destinoInp = entrada(V, "destino", { attrs: { autocomplete: "off", autocapitalize: "words" } });
    if (tipo === "voucher") rej.append(fila(E.confirmacion, entrada(V, "confirmacion", { attrs: { autocomplete: "off", autocapitalize: "characters" }, clase: "llenar-codigo" }), { ancha: true }));
    rej.append(
      fila(E.tipo_viaje, clase, { ancha: true }),
      fila(E.destino, destinoInp, { ancha: true }),
      fila(E.ida, ida), fila(E.vuelta, vuelta), fila(E.noches, noches),
      fila(E.pasajeros, el("div", { class: "contadores" }, contador("adultos", "Adultos"), contador("ninos", "Niños"), contador("infantes", "Infantes")), { ancha: true }),
      fila(E.hotel, entrada(V, "hotel", { attrs: { autocomplete: "off", autocapitalize: "words" } }), { ancha: true }),
      fila(E.regimen, conLista(V, "regimen", L.regimen, "Elija o escriba")),
      fila(E.traslados, conLista(V, "traslados", L.traslados, "Elija o escriba")),
      fila(E.vuelos, entrada(V, "vuelos", { multi: true, attrs: { rows: "3", placeholder: "Aerolínea, ruta, fechas y horas (si aplica)" } }), { ancha: true }));
    secViaje.append(rej);
    hoja.append(secViaje);

    // Incluye / no incluye: se arma con un toque.
    function opciones(k, base, titulo) {
      var caja = el("div", { class: "opciones" });
      function dibujar() {
        vaciar(caja);
        var todas = base.slice();
        m[k].forEach(function (x) { if (todas.indexOf(x) < 0) todas.push(x); });
        todas.forEach(function (o) {
          var on = m[k].indexOf(o) >= 0;
          caja.append(el("button", { type: "button", class: "opc", "aria-pressed": String(on), icono: on ? "listo" : null, onclick: function () {
            var i = m[k].indexOf(o);
            if (i >= 0) m[k].splice(i, 1); else m[k].push(o);
            dibujar(); cambio();
          } }, el("span", { text: o })));
        });
        var otro = el("input", { class: "llenar llenar-otro", placeholder: "Otro…", "aria-label": "Agregar otro a " + titulo, enterkeyhint: "done" });
        var agregar = function () { var t = otro.value.trim(); if (t && m[k].indexOf(t) < 0) { m[k].push(t); dibujar(); cambio(); } else otro.value = ""; };
        otro.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); agregar(); } });
        caja.append(el("span", { class: "otro" }, otro, el("button", { type: "button", class: "otro-b", "aria-label": "Agregar", icono: "mas", onclick: agregar })));
      }
      dibujar();
      return el("div", { class: "opc-grupo" }, el("h3", { class: "fijo-sub", text: titulo }), caja);
    }
    hoja.append(el("section", { class: "hoja-sec" }, el("div", { class: "dos" }, opciones("incluye", L.incluye, E.incluye), opciones("no_incluye", L.no_incluye, E.no_incluye))));

    // Pago recibido (comprobante).
    if (tipo === "comprobante") {
      var metodo = el("div", { class: "segmento segmento-envuelve", role: "radiogroup", "aria-label": "Método de pago" });
      L.metodos_pago.forEach(function (o) {
        metodo.append(el("button", { type: "button", role: "radio", "aria-checked": String(m.pago.metodo === o), text: o, onclick: function (e) {
          m.pago.metodo = o;
          metodo.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-checked", String(b === e.currentTarget)); });
          cambio();
        } }));
      });
      var secPago = el("section", { class: "hoja-sec" }, el("h2", { class: "sec-tit", text: E.recibimos }),
        el("div", { class: "rejilla" },
          fila("Monto recibido (" + M.simbolo + ")", entrada(m.pago, "monto", { attrs: { inputmode: "decimal", autocomplete: "off", placeholder: "0,00" }, clase: "llenar-monto" })),
          fila("Fecha del pago", entrada(m.pago, "fecha", { attrs: { type: "date", max: "2100-12-31" }, clase: "llenar-chico" })),
          fila("Método", metodo, { ancha: true }),
          fila("Referencia", entrada(m.pago, "referencia", { attrs: { autocomplete: "off" } }), { ancha: true })));
      if (m.abonos_previos && m.abonos_previos.length) {
        secPago.append(el("p", { class: "ayuda", text: "Pagos anteriores: " + m.abonos_previos.map(function (a) { return din(a.monto) + " (" + P.fecha(a.fecha) + ")"; }).join(", ") + "." }));
      }
      hoja.append(secPago);
    }

    // Montos.
    var cajaRenglones = el("div", { class: "renglones" });
    function pintarRenglones() {
      vaciar(cajaRenglones);
      nodos.imp = [];
      m.renglones.forEach(function (r, i) {
        var desc = entrada(r, "descripcion", { attrs: { "aria-label": E.descripcion + " del renglón " + (i + 1), placeholder: E.descripcion, autocapitalize: "sentences" } });
        var cant = entrada(r, "cantidad", { attrs: { "aria-label": E.cantidad, inputmode: "decimal" }, clase: "llenar-cant", alCambiar: function () { r.auto = null; } });
        var prec = entrada(r, "precio", { attrs: { "aria-label": E.precio + " en " + M.simbolo, inputmode: "decimal", placeholder: "0,00" }, clase: "llenar-monto" });
        nodos.imp[i] = el("output", { class: "imp" });  // sin símbolo: la etiqueta ya dice la moneda
        cajaRenglones.append(el("div", { class: "renglon" }, desc,
          el("div", { class: "renglon-nums" },
            el("label", { class: "rn" }, el("span", { class: "fijo-chico", text: E.cantidad }), cant),
            el("label", { class: "rn rn-precio" }, el("span", { class: "fijo-chico", text: E.precio + " " + M.simbolo }), prec),
            el("span", { class: "rn rn-imp" }, el("span", { class: "fijo-chico", text: E.importe + " " + M.simbolo }), nodos.imp[i]),
            el("button", { type: "button", class: "icono-btn quitar", "aria-label": "Quitar renglón " + (i + 1), icono: "cerrar", onclick: function () { m.renglones.splice(i, 1); pintarRenglones(); cambio(); } }))));
      });
      calcular();
    }
    if (cfg.montos) {
      pintarRenglones();
      nodos.total = el("output", { class: "tot-v" });
      var tot = el("dl", { class: "totales" }, el("div", { class: "tot-total" }, el("dt", { text: E.total }), el("dd", null, nodos.total)));
      if (cfg.pagos) {
        nodos.abonado = el("output"); nodos.saldo = el("output");
        tot.append(el("div", null, el("dt", { text: E.abonado }), el("dd", null, nodos.abonado)),
          el("div", { class: "tot-saldo" }, el("dt", { text: E.saldo }), el("dd", null, nodos.saldo)));
      }
      var bsCaja = el("div", { class: "bs" });
      var tasa = entrada(m.bs, "tasa", { attrs: { inputmode: "decimal", placeholder: "0,00", "aria-label": "Tasa del día en bolívares por dólar" }, clase: "llenar-monto" });
      var tasaFila = el("div", { class: "bs-tasa", hidden: !m.bs.mostrar }, el("label", { class: "fijo", text: "Tasa del día (Bs. por dólar)" }), tasa,
        el("span", { class: "bs-eq" }, el("span", { class: "fijo-chico", text: E.equivalente }), (nodos.bs = el("output"))));
      var chk = el("input", { type: "checkbox", checked: m.bs.mostrar, id: "f-bs" });
      chk.addEventListener("change", function () { m.bs.mostrar = chk.checked; tasaFila.hidden = !chk.checked; if (chk.checked) tasa.focus(); cambio(); });
      bsCaja.append(el("label", { class: "interruptor", for: "f-bs" }, chk, el("span", { text: "Mostrar el equivalente en bolívares" })), tasaFila);
      hoja.append(el("section", { class: "hoja-sec" }, el("h2", { class: "sec-tit", text: E.seccion_montos }), cajaRenglones,
        el("button", { type: "button", class: "btn-texto agregar", icono: "mas", onclick: function () {
          m.renglones.push({ descripcion: "", cantidad: 1, precio: "", auto: null }); pintarRenglones(); cambio();
          var ult = cajaRenglones.querySelectorAll(".renglon"); ult = ult[ult.length - 1]; if (ult) ult.querySelector("input").focus();
        } }, el("span", { text: "Agregar renglón" })),
        tot, bsCaja));
    }

    // Pagos registrados (proforma): solo se muestran; se agregan con "Registrar pago".
    if (tipo === "proforma") {
      var ps = el("section", { class: "hoja-sec" }, el("h2", { class: "sec-tit", text: E.seccion_pagos }));
      if (m.abonos && m.abonos.length) {
        ps.append(el("ul", { class: "pagos" }, m.abonos.map(function (a) {
          return el("li", null, el("span", { text: P.fecha(a.fecha) + "  " + (a.metodo || "") + (a.referencia ? ", ref. " + a.referencia : "") }), el("strong", { text: din(a.monto) }));
        })));
      } else ps.append(el("p", { class: "ayuda", text: "Todavía no hay pagos. Después de guardar, use «Registrar pago» y sale el comprobante." }));
      hoja.append(ps);
    }

    hoja.append(el("section", { class: "hoja-sec" }, fila(E.notas, entrada(m, "notas", { multi: true, attrs: { rows: "3", placeholder: "Opcional" } }), { ancha: true })));
    if (cfg.condiciones && cfg.condiciones.length) {
      hoja.append(el("section", { class: "hoja-sec hoja-cond" }, el("h2", { class: "sec-tit", text: E.condiciones }),
        el("ol", null, cfg.condiciones.map(function (c) { return el("li", { text: c }); }))));
    }
    hoja.append(el("footer", { class: "hoja-pie", text: CONF.pdf.pie }));
    v.append(hoja);
    calcular();

    var err = el("div", { class: "err-guardar" });
    var btn = el("button", { class: "btn btn-marca", type: "button", text: doc ? "Guardar cambios y ver PDF" : "Guardar y ver PDF", onclick: guardar });
    v.append(el("div", { class: "barra-guardar" }, err, btn));

    if (clienteId && !recuperado) {
      api("clientes/" + clienteId).then(function (d) { elegir(d.cliente); }).catch(function () { /* sin cliente */ });
    }

    function guardar() {
      vaciar(err);
      var falta = !m.cliente.nombre.trim() ? [cNombre, "Falta el nombre del cliente."] : !V.destino.trim() ? [destinoInp, "Falta el destino."] : null;
      if (falta) { err.append(error(falta[1])); if (falta[0]) { falta[0].focus(); falta[0].scrollIntoView({ block: "center", behavior: "smooth" }); } return; }
      if (tipo === "comprobante" && !(aNum(m.pago.monto) > 0)) { err.append(error("Escriba el monto del pago recibido.")); return; }
      btn.disabled = true; btn.textContent = "Guardando…";
      var cuerpo = { tipo: tipo, emision: m.emision, contenido: contenidoDe(m) };
      (doc ? api("documentos/" + doc.id, { method: "PUT", body: cuerpo }) : api("documentos", { method: "POST", body: cuerpo })).then(function (r) {
        clearTimeout(tGuardar);
        localStorage.removeItem(clave);
        aviso(doc ? "Cambios guardados en " + r.numero + "." : CORTO[tipo] + " " + r.numero + (MASC[tipo] ? " guardado." : " guardada."));
        ir("#/doc/" + r.id);
      }).catch(function (e) {
        btn.disabled = false; btn.textContent = doc ? "Guardar cambios y ver PDF" : "Guardar y ver PDF";
        err.append(error(e.message + (e.estado >= 500 || !e.estado ? " Lo que escribió sigue guardado en este equipo." : "")));
      });
    }
  }

  /* ---------- ver documento ---------- */

  var pdfmakeListo = null;
  function cargarPdfmake() {
    if (!pdfmakeListo) pdfmakeListo = cargarScript(PDFMAKE).then(function () { window.pdfMake.fonts = P.fuentes(CONF); return window.pdfMake; });
    pdfmakeListo.catch(function () { pdfmakeListo = null; });
    return pdfmakeListo;
  }
  var pdfjsListo = null;
  function cargarPdfjs() {
    if (!pdfjsListo) pdfjsListo = import(PDFJS).then(function (mod) { mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; return mod; });
    pdfjsListo.catch(function () { pdfjsListo = null; });
    return pdfjsListo;
  }

  function hacerPDF(doc) {
    return cargarPdfmake().then(function (pm) {
      return new Promise(function (ok, mal) {
        try { pm.createPdf(P.armar(doc, CONF)).getBuffer(function (b) { ok(new Uint8Array(b)); }); } catch (e) { mal(e); }
      });
    });
  }

  function pintarPaginas(caja, bytes) {
    return cargarPdfjs().then(function (pdfjs) {
      return pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise.then(function (pdf) {
        vaciar(caja);
        var cadena = Promise.resolve();
        for (var i = 1; i <= pdf.numPages; i++) (function (n) {
          cadena = cadena.then(function () {
            return pdf.getPage(n).then(function (pag) {
              var ancho = Math.max(280, caja.clientWidth);
              var base = pag.getViewport({ scale: 1 });
              var esc = (ancho / base.width) * Math.min(2.5, window.devicePixelRatio || 1);
              var vp = pag.getViewport({ scale: esc });
              var cv = el("canvas", { class: "pagina", width: String(Math.floor(vp.width)), height: String(Math.floor(vp.height)), "aria-label": "Página " + n + " de " + pdf.numPages });
              caja.append(cv);
              return pag.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
            });
          });
        })(i);
        return cadena;
      });
    });
  }

  function vDoc(id) {
    var v = pantalla(null, ["#/documentos", "Documentos"]);
    v.classList.add("v-doc");
    var c = cargando(v);
    api("documentos/" + id).then(function (r) {
      c.remove();
      dibujarDoc(v, r.documento, r.cadena);
    }).catch(function (e) { c.remove(); v.append(error(e.message)); });
  }

  function ruta(doc, cadena) {
    var caja = el("ol", { class: "ruta", "aria-label": "Ruta del documento" });
    var hasta = -1;
    TIPOS.forEach(function (t, i) { if (cadena.some(function (x) { return x.tipo === t && x.estado === "activo"; })) hasta = i; });
    TIPOS.forEach(function (t, i) {
      var docs = cadena.filter(function (x) { return x.tipo === t; });
      var actual = doc.tipo === t;
      var li = el("li", { class: "parada" + (i <= hasta ? " hecha" : "") + (actual ? " actual" : ""), "aria-current": actual ? "step" : null },
        el("span", { class: "punto", "aria-hidden": "true", icono: actual ? "avion" : null }),
        el("span", { class: "p-tipo", text: CORTO[t] }));
      var nums = el("span", { class: "p-nums" });
      if (!docs.length) nums.append(el("span", { class: "p-falta", text: "Pendiente" }));
      docs.forEach(function (x) {
        nums.append(x.id === doc.id ? el("span", { class: "p-num esta", text: x.numero })
          : el("a", { class: "p-num" + (x.estado === "anulado" ? " anulado" : ""), href: "#/doc/" + x.id, text: x.numero }));
      });
      li.append(nums);
      caja.append(li);
    });
    return caja;
  }

  function dibujarDoc(v, doc, cadena) {
    var cfg = DOCS[doc.tipo];
    var d = doc.datos;
    var puede = yo.rol === "admin" || doc.usuario_id === yo.id;
    var activo = doc.estado === "activo";

    var cab = el("div", { class: "doc-cab" },
      activo ? null : el("div", { class: "doc-cab-arriba" }, el("span", { class: "fd-anulado", text: "Anulado" })),
      el("h1", { class: "tit" }, cfg.titulo + " ", el("span", { class: "tit-num", text: doc.numero })),
      el("p", { class: "doc-linea" }, el("a", { href: "#/cliente/" + doc.cliente_id, text: d.cliente.nombre }), d.viaje.destino ? ", " + d.viaje.destino : ""));
    v.append(cab, ruta(doc, cadena));

    var lado = el("div", { class: "doc-lado" });
    var mas = el("div", { class: "doc-mas" });
    var hojaPdf = el("div", { class: "pdf-marco" });
    var paginas = el("div", { class: "paginas" }, el("p", { class: "cargando", text: "Preparando el PDF…" }));
    hojaPdf.append(paginas);
    v.append(el("div", { class: "doc-cuerpo" }, lado, el("div", { class: "doc-pdf" }, hojaPdf), mas));

    // Siguiente paso de la cadena.
    var sig = el("div", { class: "siguiente" });
    if (activo && puede) {
      if (doc.tipo === "cotizacion") sig.append(botonPaso("Convertir en proforma", "Sale lista con los mismos datos.", function (b) { convertir(doc, b); }));
      if (doc.tipo === "proforma") sig.append(botonPaso("Registrar pago", doc.saldo > 0.004 ? "Saldo pendiente " + din(doc.saldo) + ". Sale el comprobante." : "Ya está pagada completa.", function () { dlgPago(doc); }, !(doc.saldo > 0.004)));
      if (doc.tipo === "comprobante") {
        sig.append(botonPaso("Emitir voucher", "Con los datos del viaje, sin montos.", function (b) { convertir(doc, b); }));
        if (doc.saldo > 0.004) sig.append(el("button", { type: "button", class: "btn btn-borde", text: "Registrar otro pago (debe " + din(doc.saldo) + ")", onclick: function () { dlgPago(doc); } }));
      }
    }

    var estadoPdf = { bytes: null, url: null, archivo: null };
    var bDesc = el("button", { type: "button", class: "btn btn-borde", icono: "bajar", disabled: true, onclick: descargar }, el("span", { text: "Descargar PDF" }));
    var bWa = el("button", { type: "button", class: "btn btn-wa", icono: "wa", disabled: true, onclick: compartir }, el("span", { text: "Compartir por WhatsApp" }));
    var bImp = el("button", { type: "button", class: "btn btn-borde", icono: "imprimir", disabled: true, onclick: imprimir }, el("span", { text: "Imprimir" }));
    var acciones = el("div", { class: "acciones" }, bWa, el("div", { class: "acc-dos" }, bDesc, bImp));

    var otras = el("div", { class: "otras" });
    if (activo && puede) otras.append(el("a", { class: "btn btn-suave", href: "#/doc/" + doc.id + "/editar", icono: "editar" }, el("span", { text: "Editar" })));
    otras.append(el("a", { class: "btn btn-suave", href: "#/cliente/" + doc.cliente_id, icono: "clientes" }, el("span", { text: "Ficha del cliente" })));
    if (activo && puede) otras.append(el("button", { type: "button", class: "btn btn-suave btn-rojo", text: "Anular", onclick: function () {
      confirmar("¿Anular " + doc.numero + "?", "El documento queda guardado con la marca «Anulado» y su número no se vuelve a usar." + (doc.tipo === "comprobante" ? " El pago sale de la proforma y el saldo vuelve a subir." : ""), "Anular documento", true).then(function (si) {
        if (!si) return;
        api("documentos/" + doc.id + "/anular", { method: "POST", body: {} }).then(function () { aviso(doc.numero + " quedó anulado."); vDoc(doc.id); }).catch(function (e) { aviso(e.message); });
      });
    } }));

    var info = el("dl", { class: "doc-info" },
      el("div", null, el("dt", { text: "Asesor" }), el("dd", { text: doc.asesor || "" })),
      el("div", null, el("dt", { text: E.emision }), el("dd", { text: P.fecha(doc.emision) })),
      cfg.montos ? el("div", null, el("dt", { text: E.total }), el("dd", { text: din(doc.total) })) : null,
      cfg.pagos ? el("div", null, el("dt", { text: E.saldo }), el("dd", { class: doc.saldo > 0.004 ? "debe" : "", text: din(doc.saldo) })) : null);
    lado.append(sig, acciones);
    mas.append(info, otras);

    hacerPDF(doc).then(function (bytes) {
      estadoPdf.bytes = bytes;
      var blob = new Blob([bytes], { type: "application/pdf" });
      estadoPdf.url = URL.createObjectURL(blob);
      estadoPdf.archivo = new File([blob], P.nombreArchivo(doc), { type: "application/pdf" });
      alSalir(function () { URL.revokeObjectURL(estadoPdf.url); });
      bDesc.disabled = bWa.disabled = bImp.disabled = false;
      return pintarPaginas(paginas, bytes).catch(function (e) {
        console.error(e);
        vaciar(paginas).append(el("p", { class: "nota", text: "La vista previa no se pudo mostrar en este navegador, pero el PDF está listo: use Descargar o Compartir." }));
      });
    }).catch(function (e) {
      console.error(e);
      vaciar(paginas).append(error("No se pudo preparar el PDF. Revise el internet y vuelva a abrir el documento."));
    });

    function bajarArchivo() {
      var a = el("a", { href: estadoPdf.url, download: estadoPdf.archivo.name });
      document.body.append(a); a.click(); a.remove();
    }
    function descargar() { bajarArchivo(); aviso("Se descargó " + estadoPdf.archivo.name + "."); }
    function mensaje() {
      return "Buen día, " + primerNombre(d.cliente.nombre) + ". Le envío su " + cfg.titulo.toLowerCase() + " " + doc.numero +
        (d.viaje.destino ? " (" + d.viaje.destino + ")" : "") + ". " + AG.nombre_corto + ".";
    }
    function compartir() {
      var f = estadoPdf.archivo;
      if (esTelefono() && navigator.canShare && navigator.canShare({ files: [f] })) {
        navigator.share({ files: [f], title: cfg.titulo + " " + doc.numero, text: mensaje() }).catch(function (e) {
          if (e && e.name !== "AbortError") aviso("No se pudo abrir la hoja de compartir. Use Descargar PDF.");
        });
        return;
      }
      // Computadora: baja el PDF y abre WhatsApp Web con el mensaje listo para adjuntarlo.
      var tel = telWa(d.cliente.telefono);
      window.open("https://wa.me/" + tel + "?text=" + encodeURIComponent(mensaje()), "_blank", "noopener");
      bajarArchivo();
      aviso("Se descargó el PDF. Adjúntelo en el chat de WhatsApp que se abrió.");
    }
    function imprimir() {
      if (esTelefono()) { window.open(estadoPdf.url, "_blank"); return; }
      var fr = el("iframe", { class: "imprimir-marco", src: estadoPdf.url, title: "Imprimir" });
      fr.onload = function () {
        try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { window.open(estadoPdf.url, "_blank"); }
      };
      document.body.append(fr);
      alSalir(function () { fr.remove(); });
    }
  }

  function botonPaso(txt, sub, accion, apagado) {
    var b = el("button", { type: "button", class: "paso", disabled: apagado, onclick: function () { accion(b); } },
      el("span", { class: "paso-txt" }, el("strong", { text: txt }), el("span", { text: sub })), el("span", { class: "paso-ico", icono: "flecha" }));
    return b;
  }

  function convertir(doc, b) {
    b.disabled = true;
    api("documentos/" + doc.id + "/convertir", { method: "POST", body: {} }).then(function (r) {
      var t = doc.tipo === "cotizacion" ? "proforma" : "voucher";
      aviso(r.existia ? "Ya existía " + r.numero + ". Se lo mostramos." : r.numero + (MASC[t] ? " quedó listo" : " quedó lista") + " con los mismos datos.");
      ir("#/doc/" + r.id);
    }).catch(function (e) { b.disabled = false; aviso(e.message); });
  }

  function dlgPago(doc) {
    var saldo = doc.saldo;
    var monto = el("input", { class: "llenar llenar-monto", id: "p-monto", inputmode: "decimal", value: NUM.format(saldo), autocomplete: "off" });
    var fecha = el("input", { class: "llenar llenar-chico", id: "p-fecha", type: "date", value: hoy(), max: "2100-12-31" });
    var ref = el("input", { class: "llenar", id: "p-ref", autocomplete: "off" });
    var met = "";
    var metodo = el("div", { class: "segmento segmento-envuelve", role: "radiogroup", "aria-label": "Método de pago" });
    L.metodos_pago.forEach(function (o) {
      metodo.append(el("button", { type: "button", role: "radio", "aria-checked": "false", text: o, onclick: function (e) {
        met = o; metodo.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-checked", String(x === e.currentTarget)); });
      } }));
    });
    var queda = el("p", { class: "ayuda" });
    var err = el("div");
    function calc() { var n = aNum(monto.value) || 0; queda.textContent = "Después de este pago queda debiendo " + din(Math.max(0, saldo - n)) + "."; }
    monto.addEventListener("input", calc); calc();
    var btn = el("button", { type: "button", class: "btn btn-marca", text: "Registrar pago y ver comprobante", onclick: function () {
      vaciar(err);
      var n = aNum(monto.value);
      if (!(n > 0)) { err.append(error("Escriba el monto recibido.")); monto.focus(); return; }
      if (n > saldo + 0.004) { err.append(error("El monto pasa del saldo pendiente (" + din(saldo) + ").")); monto.focus(); return; }
      btn.disabled = true; btn.textContent = "Registrando…";
      api("documentos/" + doc.id + "/pago", { method: "POST", body: { pago: { monto: n, fecha: fecha.value, metodo: met, referencia: ref.value } } }).then(function (r) {
        d.close(); aviso("Pago registrado. Comprobante " + r.numero + "."); ir("#/doc/" + r.id);
      }).catch(function (e) { btn.disabled = false; btn.textContent = "Registrar pago y ver comprobante"; err.append(error(e.message)); });
    } });
    var d = dialogo("Registrar pago", el("div", { class: "pila" },
      el("p", { class: "linea", text: "Saldo pendiente de " + doc.numero + ": " + din(saldo) + "." }),
      el("div", { class: "campo" }, el("label", { for: "p-monto", text: "Monto recibido (" + M.simbolo + ")" }), monto),
      el("div", { class: "campo" }, el("label", { for: "p-fecha", text: "Fecha del pago" }), fecha),
      el("div", { class: "campo" }, el("span", { class: "etq", text: "Método" }), metodo),
      el("div", { class: "campo" }, el("label", { for: "p-ref", text: "Referencia (opcional)" }), ref),
      queda, err), [btn]);
    setTimeout(function () { monto.select(); }, 60);
  }

  /* ---------- clientes ---------- */

  function vClientes() {
    var v = pantalla("Clientes");
    var res = el("div");
    v.append(el("p", { class: "linea", text: "Se guardan solos al hacer un documento." }), buscador("Nombre, cédula o teléfono", cargar), res);
    function cargar(q) {
      vaciar(res); cargando(res);
      api("clientes" + (q ? "?q=" + encodeURIComponent(q) : "")).then(function (d) {
        vaciar(res);
        if (!d.clientes.length) { res.append(el("p", { class: "vacio", text: q ? "No hay clientes con «" + q + "»." : "Todavía no hay clientes. Aparecen aquí al hacer el primer documento." })); return; }
        res.append(el("div", { class: "lista" }, d.clientes.map(function (c) {
          return el("a", { class: "fc", href: "#/cliente/" + c.id },
            el("span", { class: "fc-nom", text: c.nombre }),
            el("span", { class: "fc-datos", text: [c.documento, c.telefono].filter(Boolean).join("   ") || "Sin cédula ni teléfono" }),
            el("span", { class: "fc-abajo" }, el("span", { text: c.documentos === 1 ? "1 documento" : c.documentos + " documentos" }),
              c.saldo > 0.004 ? el("span", { class: "fd-saldo", text: "Debe " + din(c.saldo) }) : null));
        })));
      }).catch(function (e) { vaciar(res).append(error(e.message)); });
    }
    cargar("");
  }

  function vCliente(id) {
    var v = pantalla(null, ["#/clientes", "Clientes"]);
    var c0 = cargando(v);
    api("clientes/" + id).then(function (r) {
      c0.remove();
      var c = r.cliente;
      v.append(el("div", { class: "cli-cab" },
        el("h1", { class: "tit", text: c.nombre }),
        el("dl", { class: "cli-datos" },
          el("div", null, el("dt", { text: E.documento }), el("dd", { text: c.documento || "Sin registrar" })),
          el("div", null, el("dt", { text: E.telefono }), el("dd", null, c.telefono ? el("a", { href: "https://wa.me/" + telWa(c.telefono), target: "_blank", rel: "noopener", text: c.telefono }) : "Sin registrar")),
          el("div", null, el("dt", { text: E.correo }), el("dd", { text: c.correo || "Sin registrar" }))),
        el("button", { type: "button", class: "btn-texto", icono: "editar", onclick: function () { dlgCliente(c); } }, el("span", { text: "Editar datos" }))));
      v.append(el("div", { class: "cli-saldo" + (c.saldo > 0.004 ? " debe" : "") },
        el("span", { class: "fijo", text: c.saldo > 0.004 ? "Debe" : "Saldo" }), el("strong", { text: c.saldo > 0.004 ? din(c.saldo) : "Al día" })));
      v.append(el("a", { class: "btn btn-marca", href: "#/nuevo/cotizacion/" + c.id, icono: "mas" }, el("span", { text: "Nueva cotización para " + primerNombre(c.nombre) })));

      // Sus documentos en orden, agrupados por viaje (cada cadena es un viaje).
      v.append(el("h2", { class: "sub", text: "Sus documentos" }));
      if (!r.documentos.length) { v.append(el("p", { class: "vacio", text: "Todavía no tiene documentos" + (yo.rol === "admin" ? "." : " suyos.") })); return; }
      var grupos = [], porCadena = {};
      r.documentos.slice().sort(function (a, b) { return a.creado - b.creado; }).forEach(function (d) {
        var k = d.cadena_id || d.id;
        if (!porCadena[k]) { porCadena[k] = { docs: [], ultimo: 0 }; grupos.push(porCadena[k]); }
        porCadena[k].docs.push(d); porCadena[k].ultimo = Math.max(porCadena[k].ultimo, d.creado);
      });
      grupos.sort(function (a, b) { return b.ultimo - a.ultimo; });
      v.append(el("div", { class: "viajes" }, grupos.map(function (g) {
        return el("div", { class: "viaje" }, el("p", { class: "viaje-tit", text: g.docs[0].destino || "Viaje" }),
          el("ol", { class: "viaje-docs" }, g.docs.map(function (d) { return el("li", null, filaDoc(d)); })));
      })));
    }).catch(function (e) { c0.remove(); v.append(error(e.message)); });
  }

  function dlgCliente(c) {
    var campos = {};
    var cuerpo = el("div", { class: "pila" });
    [["nombre", E.cliente], ["documento", E.documento], ["telefono", E.telefono], ["correo", E.correo], ["direccion", "Dirección"]].forEach(function (f) {
      campos[f[0]] = el("input", { class: "llenar", id: "dc-" + f[0], value: c[f[0]] || "", autocomplete: "off", type: f[0] === "correo" ? "email" : f[0] === "telefono" ? "tel" : "text" });
      cuerpo.append(el("div", { class: "campo" }, el("label", { for: "dc-" + f[0], text: f[1] }), campos[f[0]]));
    });
    var err = el("div"); cuerpo.append(err);
    var btn = el("button", { type: "button", class: "btn btn-marca", text: "Guardar datos", onclick: function () {
      vaciar(err); btn.disabled = true;
      var body = {}; for (var k in campos) body[k] = campos[k].value;
      api("clientes/" + c.id, { method: "PUT", body: body }).then(function () { d.close(); aviso("Datos guardados."); vCliente(c.id); })
        .catch(function (e) { btn.disabled = false; err.append(error(e.message)); });
    } });
    var d = dialogo("Datos del cliente", cuerpo, [btn]);
  }

  /* ---------- ajustes ---------- */

  var instalar = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); instalar = e; });

  function vAjustes() {
    var v = pantalla("Ajustes");
    v.append(el("section", { class: "bloque" }, el("h2", { class: "sub", text: "Su cuenta" }),
      el("p", { class: "linea" }, el("strong", { text: yo.nombre }), "  ", el("span", { class: "rol", text: yo.rol === "admin" ? "Administrador" : "Asesor" })),
      el("p", { class: "ayuda", text: "Usuario: " + yo.usuario }),
      el("button", { type: "button", class: "btn btn-borde", text: "Cambiar mi contraseña", onclick: dlgClave })));

    if (yo.rol === "admin") {
      var lista = el("div", { class: "usuarios" });
      v.append(el("section", { class: "bloque" }, el("h2", { class: "sub", text: "Usuarios" }),
        el("p", { class: "ayuda", text: "El Asesor hace documentos y ve solo los suyos. El Administrador ve todo y crea usuarios." }),
        lista, el("button", { type: "button", class: "btn btn-borde", icono: "mas", onclick: function () { dlgUsuario(cargarUsuarios); } }, el("span", { text: "Crear usuario" }))));
      var cargarUsuarios = function () {
        vaciar(lista); cargando(lista);
        api("usuarios").then(function (d) {
          vaciar(lista);
          d.usuarios.forEach(function (u) {
            var acc = el("div", { class: "u-acc" });
            if (u.id !== yo.id) {
              acc.append(el("button", { type: "button", class: "btn-texto", text: "Nueva contraseña", onclick: function () {
                confirmar("¿Nueva contraseña para " + u.nombre + "?", "Se le cierra la sesión en todos sus equipos y le damos una contraseña nueva para que se la pase.", "Generar contraseña").then(function (si) {
                  if (!si) return;
                  api("usuarios/" + u.id, { method: "POST", body: { nueva_clave: true } }).then(function (r) { mostrarClave(u.usuario, r.clave); }).catch(function (e) { aviso(e.message); });
                });
              } }), el("button", { type: "button", class: "btn-texto" + (u.activo ? " btn-rojo" : ""), text: u.activo ? "Desactivar" : "Activar", onclick: function () {
                api("usuarios/" + u.id, { method: "POST", body: { activo: !u.activo } }).then(function () { aviso(u.activo ? u.nombre + " ya no puede entrar." : u.nombre + " puede entrar de nuevo."); cargarUsuarios(); }).catch(function (e) { aviso(e.message); });
              } }));
            }
            lista.append(el("div", { class: "u" + (u.activo ? "" : " inactivo") },
              el("div", { class: "u-txt" }, el("strong", { text: u.nombre }), el("span", { text: u.usuario + "   " + (u.rol === "admin" ? "Administrador" : "Asesor") + (u.activo ? "" : "   Desactivado") + "   " + (u.documentos === 1 ? "1 documento" : u.documentos + " documentos") })), acc));
          });
        }).catch(function (e) { vaciar(lista).append(error(e.message)); });
      };
      cargarUsuarios();

      var bResp = el("button", { type: "button", class: "btn btn-borde", icono: "bajar", onclick: function () { respaldo(bResp); } }, el("span", { text: "Descargar respaldo" }));
      v.append(el("section", { class: "bloque" }, el("h2", { class: "sub", text: "Respaldo" }),
        el("p", { class: "ayuda", text: "Un archivo de Excel con todos los clientes, documentos, renglones y pagos. Guárdelo en su computadora o en su correo de vez en cuando." }), bResp));
    }

    var inst = el("section", { class: "bloque" }, el("h2", { class: "sub", text: "Tenerlo en la pantalla de inicio" }));
    if (instalar) inst.append(el("button", { type: "button", class: "btn btn-borde", text: "Instalar " + CONF.panel.nombre, onclick: function () { instalar.prompt(); instalar = null; } }));
    else inst.append(el("p", { class: "ayuda", text: /iPhone|iPad/i.test(navigator.userAgent)
      ? "En el iPhone: toque Compartir en Safari y luego «Agregar a inicio»."
      : "En Android: abra el menú de Chrome (los tres puntos) y toque «Instalar aplicación» o «Agregar a la pantalla principal»." }));
    v.append(inst);

    v.append(el("button", { type: "button", class: "btn btn-suave", text: "Salir del panel", onclick: function () {
      api("salir", { method: "POST", body: {} }).catch(function () { /* igual sale */ }).then(function () { yo = null; ir("#/entrar"); });
    } }));
  }

  function mostrarClave(usuario, clave) {
    var d = dialogo("Contraseña lista", el("div", { class: "pila" },
      el("p", { class: "linea", text: "Pásele estos datos a la persona. La contraseña no se vuelve a mostrar." }),
      el("dl", { class: "clave-lista" }, el("div", null, el("dt", { text: "Usuario" }), el("dd", { text: usuario })),
        el("div", null, el("dt", { text: "Contraseña" }), el("dd", { class: "clave-txt", text: clave })))), [
      el("button", { type: "button", class: "btn btn-marca", text: "Copiar los datos", onclick: function () {
        var t = "Panel: " + location.origin + "/admin\nUsuario: " + usuario + "\nContraseña: " + clave;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { aviso("Datos copiados."); }, function () { aviso("Cópielos a mano, por favor."); });
      } }),
      el("button", { type: "button", class: "btn btn-suave", text: "Listo", onclick: function () { d.close(); } })]);
  }

  function dlgUsuario(despues) {
    var nombre = el("input", { class: "llenar", id: "u-nombre", autocomplete: "off", autocapitalize: "words" });
    var usuario = el("input", { class: "llenar", id: "u-usuario", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
    var tocado = false;
    usuario.addEventListener("input", function () { tocado = true; });
    nombre.addEventListener("input", function () { if (!tocado) usuario.value = norm(nombre.value).replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 30); });
    var rol = "asesor";
    var seg = el("div", { class: "segmento", role: "radiogroup", "aria-label": "Rol" });
    [["asesor", "Asesor"], ["admin", "Administrador"]].forEach(function (o) {
      seg.append(el("button", { type: "button", role: "radio", "aria-checked": String(o[0] === rol), text: o[1], onclick: function (e) {
        rol = o[0]; seg.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-checked", String(b === e.currentTarget)); });
      } }));
    });
    var err = el("div");
    var btn = el("button", { type: "button", class: "btn btn-marca", text: "Crear usuario", onclick: function () {
      vaciar(err); btn.disabled = true;
      api("usuarios", { method: "POST", body: { nombre: nombre.value, usuario: usuario.value, rol: rol } }).then(function (r) {
        d.close(); despues(); mostrarClave(r.usuario, r.clave);
      }).catch(function (e) { btn.disabled = false; err.append(error(e.message)); });
    } });
    var d = dialogo("Crear usuario", el("div", { class: "pila" },
      el("div", { class: "campo" }, el("label", { for: "u-nombre", text: "Nombre" }), nombre),
      el("div", { class: "campo" }, el("label", { for: "u-usuario", text: "Usuario para entrar" }), usuario),
      el("div", { class: "campo" }, el("span", { class: "etq", text: "Rol" }), seg),
      el("p", { class: "ayuda", text: "La contraseña la generamos al crear el usuario." }), err), [btn]);
    setTimeout(function () { nombre.focus(); }, 60);
  }

  function dlgClave() {
    var actual = el("input", { class: "llenar", id: "k-actual", type: "password", autocomplete: "current-password" });
    var nueva = el("input", { class: "llenar", id: "k-nueva", type: "password", autocomplete: "new-password", minlength: "8" });
    var err = el("div");
    var btn = el("button", { type: "button", class: "btn btn-marca", text: "Cambiar contraseña", onclick: function () {
      vaciar(err); btn.disabled = true;
      api("clave", { method: "POST", body: { actual: actual.value, nueva: nueva.value } }).then(function () { d.close(); aviso("Contraseña cambiada. Se cerró la sesión en sus otros equipos."); })
        .catch(function (e) { btn.disabled = false; err.append(error(e.message)); });
    } });
    var d = dialogo("Cambiar mi contraseña", el("div", { class: "pila" },
      el("div", { class: "campo" }, el("label", { for: "k-actual", text: "Contraseña actual" }), actual),
      el("div", { class: "campo" }, el("label", { for: "k-nueva", text: "Contraseña nueva (al menos 8 caracteres)" }), nueva), err), [btn]);
  }

  function respaldo(b) {
    b.disabled = true;
    Promise.all([api("respaldo"), cargarScript(XLSX_URL)]).then(function (r) {
      var d = r[0], X = window.XLSX;
      var tipoTxt = function (t) { return DOCS[t].titulo; };
      var clientes = d.clientes.map(function (c) { return { "N.º": c.id, Nombre: c.nombre, "Cédula o RIF": c.documento, "Teléfono": c.telefono, Correo: c.correo, "Dirección": c.direccion }; });
      var docs = [], renglones = [], pagos = [];
      d.documentos.forEach(function (x) {
        var v = x.datos.viaje;
        docs.push({ "Número": x.numero, Tipo: tipoTxt(x.tipo), Estado: x.estado === "anulado" ? "Anulado" : "Activo", "Emisión": x.emision, Cliente: x.cliente,
          "Cédula o RIF": x.datos.cliente.documento, Destino: v.destino, Salida: v.ida, Regreso: v.vuelta, Adultos: v.adultos, "Niños": v.ninos, Infantes: v.infantes,
          Hotel: v.hotel, "Régimen": v.regimen, Total: x.total, Abonado: x.abonado, Saldo: x.saldo, Asesor: x.asesor });
        (x.datos.renglones || []).forEach(function (rr) { renglones.push({ "Número": x.numero, "Descripción": rr.descripcion, Cantidad: rr.cantidad, Precio: rr.precio, Importe: cent(rr.cantidad * rr.precio) }); });
        if (x.tipo === "comprobante" && x.datos.pago) {
          var p = x.datos.pago;
          pagos.push({ Comprobante: x.numero, Estado: x.estado === "anulado" ? "Anulado" : "Activo", Cliente: x.cliente, Fecha: p.fecha, "Método": p.metodo, Referencia: p.referencia, Monto: p.monto });
        }
      });
      var libro = X.utils.book_new();
      X.utils.book_append_sheet(libro, X.utils.json_to_sheet(clientes), "Clientes");
      X.utils.book_append_sheet(libro, X.utils.json_to_sheet(docs), "Documentos");
      X.utils.book_append_sheet(libro, X.utils.json_to_sheet(renglones), "Renglones");
      X.utils.book_append_sheet(libro, X.utils.json_to_sheet(pagos), "Pagos");
      X.writeFile(libro, "respaldo-" + norm(AG.nombre_corto).replace(/[^a-z0-9]+/g, "") + "-" + hoy() + ".xlsx");
      aviso("Respaldo descargado.");
    }).catch(function (e) { aviso(e.message); }).then(function () { b.disabled = false; });
  }

  /* ---------- arranque ---------- */

  function iniciar() {
    return api("yo").then(function (d) {
      yo = d.usuario; demo = !!d.demo;
      document.getElementById("demo").hidden = !demo;
      if (location.hash === "#/") pintar(); else location.replace("#/");
    });
  }

  window.addEventListener("hashchange", pintar);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin" }).catch(function () { /* sin instalar */ });
  fetch("/api/admin/yo", { credentials: "same-origin", headers: { "x-panel": "1" } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && d.usuario) { yo = d.usuario; demo = !!d.demo; document.getElementById("demo").hidden = !demo; }
    pintar();
  }, function () {
    vaciar(app).append(error("No hay conexión. Revise el internet y recargue la página."));
  });
})();
