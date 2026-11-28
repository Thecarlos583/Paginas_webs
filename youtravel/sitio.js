/* Agencias de viajes · JS común. Todo el contenido ya viene escrito en el HTML:
   esto solo arma mensajes de WhatsApp, filtra y mueve. Nada retiene el scroll. Cada parte va protegida. */
(function () {
  "use strict";
  function safe(fn, n) { try { fn(); } catch (err) { if (window.console) console.warn("[" + n + "]", err); } }
  // las páginas que arma el Worker de Novedades (/novedades/<slug>) marcan la raíz del sitio: data-raiz="/"
  var RAIZ = document.documentElement.getAttribute("data-raiz") || "";
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var D = {};
  try { D = JSON.parse(($("#datos-agencia") || {}).textContent || "{}"); } catch (e) { D = {}; }
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function paquete(id) { for (var i = 0; i < (D.paquetes || []).length; i++) if (D.paquetes[i].id === id) return D.paquetes[i]; return null; }
  function destinoNombre(id) { var x = (D.destinos || []).filter(function (d) { return d.id === id; })[0]; return x ? x.nombre : id; }
  function destinoId(nombre) { var x = (D.destinos || []).filter(function (d) { return d.nombre === nombre || d.id === nombre; })[0]; return x ? x.id : ""; }
  function waUrl(t) { return "https://wa.me/" + D.wa + "?text=" + encodeURIComponent(t); }
  function abrirWa(t) { var u = waUrl(t); var w = window.open(u, "_blank"); if (w) { try { w.opener = null; } catch (e) {} } else { location.href = u; } }
  function dinero(n) { return (D.moneda || "US$") + " " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function hoyISO() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function fecha(iso) { if (!iso) return null; var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +(p[2] || 1)); }
  function mas(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function diaMes(d, conAnio) { return d.getDate() + " de " + MESES[d.getMonth()] + (conAnio ? " de " + d.getFullYear() : ""); }
  function rango(a, b) {
    var este = new Date().getFullYear();
    if (a.getFullYear() !== b.getFullYear()) return "del " + diaMes(a, true) + " al " + diaMes(b, true);
    var anio = a.getFullYear() !== este;
    if (a.getMonth() === b.getMonth()) return "del " + a.getDate() + " al " + diaMes(b, anio);
    return "del " + diaMes(a, false) + " al " + diaMes(b, anio);
  }
  function unDia(d) { return "el " + diaMes(d, d.getFullYear() !== new Date().getFullYear()); }
  function personas(ad, ni) {
    var t = ad + (ad === 1 ? " adulto" : " adultos");
    if (ni > 0) t += " y " + ni + (ni === 1 ? " niño" : " niños");
    return t;
  }

  /* ---------- listas de meses (los próximos 12) ---------- */
  function initMeses() {
    $$("select[data-meses]").forEach(function (sel) {
      if (sel.options.length > 1) return;
      var d = new Date(); d.setDate(1);
      for (var i = 0; i < 12; i++) {
        var o = document.createElement("option"), m = d.getMonth() + 1;
        o.value = d.getFullYear() + "-" + (m < 10 ? "0" + m : m);
        o.textContent = MESES[d.getMonth()].charAt(0).toUpperCase() + MESES[d.getMonth()].substring(1) + " " + d.getFullYear();
        sel.appendChild(o); d.setMonth(d.getMonth() + 1);
      }
    });
  }

  /* ---------- menú del teléfono ---------- */
  function initMenu() {
    var m = $("#menu-movil"), b = $("[data-menu]"); if (!m || !b) return;
    function abrir() { m.hidden = false; document.documentElement.classList.add("menu-abierto", "hoja-abierta"); b.setAttribute("aria-expanded", "true"); var c = $("[data-menu-cerrar]", m); if (c) c.focus(); }
    function cerrar() { m.hidden = true; document.documentElement.classList.remove("menu-abierto", "hoja-abierta"); b.setAttribute("aria-expanded", "false"); b.focus(); }
    b.addEventListener("click", abrir);
    $$("[data-menu-cerrar]", m).forEach(function (x) { x.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !m.hidden) cerrar(); });
  }

  /* ---------- cotizadores ---------- */
  function initCotizador(f) {
    var hoy = hoyISO();
    $$("[data-fecha]", f).forEach(function (i) { i.min = hoy; });
    $$("[data-mes]", f).forEach(function (i) { i.min = hoy.slice(0, 7); });
    function val(n) { var el = f.elements[n]; if (!el) return ""; if (el.length && !el.tagName) { for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value; return ""; } return (el.value || "").trim(); }
    function servicio() { return val("servicio") || "paquete"; }
    function mostrar() {
      var s = servicio();
      $$("[data-para]", f).forEach(function (b) { b.hidden = b.getAttribute("data-para") !== s; });
      var pe = $("[data-personas]", f); if (pe) pe.hidden = s === "grupo";
      var vuelta = $("[data-vuelta]", f); if (vuelta) vuelta.hidden = val("b_tipo") === "solo ida";
      estimar(); limpiarAviso();
    }
    function num(n) { var x = parseInt(val(n), 10); return isNaN(x) ? 0 : x; }
    function estimar() {
      var box = $("[data-estimado]", f); if (!box) return;
      var p = paquete(val("paquete"));
      if (servicio() !== "paquete" || !p || !D.precios) { box.hidden = true; return; }
      var gente = Math.max(1, num("adultos") + num("ninos"));
      $("[data-est-monto]", box).textContent = dinero(p.precio * gente) + (gente > 1 ? " para " + gente : " para 1 persona");
      box.hidden = false;
    }
    function limpiarAviso() { var a = $("[data-aviso]", f); if (a) a.textContent = ""; $$(".campo.error", f).forEach(function (c) { c.classList.remove("error"); }); }
    function falta(nombre, texto) {
      var el = f.elements[nombre], a = $("[data-aviso]", f);
      if (a) a.textContent = texto;
      if (el && el.closest) { var c = el.closest(".campo"); if (c) c.classList.add("error"); try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); } }
      return null;
    }
    /* steppers */
    $$("[data-stepper]", f).forEach(function (s) {
      var inp = $("input", s), min = +inp.min || 0, max = +inp.max || 60;
      function poner(v) { inp.value = Math.max(min, Math.min(max, v)); inp.dispatchEvent(new Event("input", { bubbles: true })); }
      $("[data-menos]", s).addEventListener("click", function () { poner((+inp.value || 0) - 1); });
      $("[data-mas]", s).addEventListener("click", function () { poner((+inp.value || 0) + 1); });
      inp.addEventListener("change", function () { poner(+inp.value || min); });
    });
    /* fechas encadenadas */
    function cadena(a, b) {
      var A = f.elements[a], B = f.elements[b]; if (!A || !B) return;
      A.addEventListener("change", function () { B.min = A.value || hoy; if (B.value && A.value && B.value <= A.value) B.value = ""; });
    }
    cadena("b_ida", "b_vuelta"); cadena("h_entrada", "h_salida");
    f.addEventListener("change", mostrar);
    f.addEventListener("input", function () { estimar(); });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); limpiarAviso();
      var m = mensaje(); if (m) abrirWa(m);
    });
    function cola(t) { var n = val("nota"); return t + (n ? "\n\nAlgo más: " + n : ""); }
    function mensaje() {
      var s = servicio(), S = D.saludo || "Hola", ad = num("adultos"), ni = num("ninos"), gente = personas(ad, ni), hoyD = fecha(hoy);
      if (s !== "grupo" && ad < 1) return falta("adultos", "Indique al menos un adulto.");
      if (s === "paquete") {
        var p = paquete(val("paquete"));
        if (!p) return falta("paquete", "Elija el paquete que quiere cotizar.");
        if (!val("p_salida")) return falta("p_salida", "Elija la fecha de salida, aunque sea aproximada.");
        var a = fecha(val("p_salida")); if (a < hoyD) return falta("p_salida", "Esa fecha ya pasó. Elija una fecha próxima.");
        return cola(S + ", quiero cotizar un paquete: " + p.nombre + ", " + rango(a, mas(a, p.noches)) + ", " + gente + ".");
      }
      if (s === "boletos") {
        var o = val("b_origen"), de = val("b_destino"), tipo = val("b_tipo") || "ida y vuelta";
        if (!o) return falta("b_origen", "Escriba desde dónde sale.");
        if (!de) return falta("b_destino", "Escriba a dónde quiere volar.");
        if (!val("b_ida")) return falta("b_ida", "Elija la fecha de ida.");
        var ida = fecha(val("b_ida")); if (ida < hoyD) return falta("b_ida", "Esa fecha ya pasó. Elija una fecha próxima.");
        if (tipo === "solo ida") return cola(S + ", quiero cotizar boletos aéreos: de " + o + " a " + de + ", solo ida, " + unDia(ida) + ", " + gente + ".");
        if (!val("b_vuelta")) return falta("b_vuelta", "Elija la fecha de vuelta, o marque solo ida.");
        var vu = fecha(val("b_vuelta")); if (vu < ida) return falta("b_vuelta", "La vuelta debe ser después de la ida.");
        return cola(S + ", quiero cotizar boletos aéreos: de " + o + " a " + de + ", ida y vuelta, " + rango(ida, vu) + ", " + gente + ".");
      }
      if (s === "hotel") {
        var hd = val("h_destino");
        if (!hd) return falta("h_destino", "Escriba la ciudad o la playa donde quiere el hotel.");
        if (!val("h_entrada")) return falta("h_entrada", "Elija la fecha de entrada.");
        if (!val("h_salida")) return falta("h_salida", "Elija la fecha de salida.");
        var en = fecha(val("h_entrada")), sa = fecha(val("h_salida"));
        if (en < hoyD) return falta("h_entrada", "Esa fecha ya pasó. Elija una fecha próxima.");
        if (sa <= en) return falta("h_salida", "La salida debe ser después de la entrada.");
        var noches = Math.round((sa - en) / 864e5);
        return cola(S + ", quiero cotizar hotel en " + hd + ": " + rango(en, sa) + " (" + noches + (noches === 1 ? " noche" : " noches") + "), " + gente + ".");
      }
      if (s === "traslado") {
        if (!val("t_desde")) return falta("t_desde", "Escriba desde dónde lo buscamos.");
        if (!val("t_hasta")) return falta("t_hasta", "Escriba a dónde lo llevamos.");
        if (!val("t_fecha")) return falta("t_fecha", "Elija la fecha del traslado.");
        var tf = fecha(val("t_fecha")); if (tf < hoyD) return falta("t_fecha", "Esa fecha ya pasó. Elija una fecha próxima.");
        return cola(S + ", quiero cotizar un traslado: desde " + val("t_desde") + " hasta " + val("t_hasta") + ", " + unDia(tf) + ", " + gente + ".");
      }
      if (s === "grupo") {
        var gd = val("g_destino"), gp = num("g_personas"), gm = val("g_mes"), gt = (val("g_tipo") || "grupo").toLowerCase();
        if (!gd) return falta("g_destino", "Escriba a dónde quiere ir el grupo.");
        if (gp < 6) return falta("g_personas", "Los viajes de grupo son desde 6 personas.");
        var cuando = "fecha por definir";
        if (gm) { var md = fecha(gm + "-01"); cuando = "en " + MESES[md.getMonth()] + " de " + md.getFullYear(); }
        return cola(S + ", quiero cotizar un viaje de grupo (" + gt + "): " + gd + ", " + cuando + ", " + gp + " personas.");
      }
      return null;
    }
    f._preparar = function (o) {
      o = o || {};
      if (o.servicio && f.elements.servicio && f.elements.servicio.length) {
        $$('input[name="servicio"]', f).forEach(function (r) { r.checked = r.value === o.servicio; });
      }
      if (o.paquete && f.elements.paquete && f.elements.paquete.tagName === "SELECT") f.elements.paquete.value = o.paquete;
      if (o.destinoNombre) ["b_destino", "h_destino", "g_destino"].forEach(function (n) { if (f.elements[n]) f.elements[n].value = o.destinoNombre; });
      if (o.personas && f.elements.adultos) f.elements.adultos.value = Math.max(1, Math.min(60, o.personas));
      if (o.personas && f.elements.g_personas && o.personas >= 6) f.elements.g_personas.value = o.personas;
      if (o.tipoGrupo && f.elements.g_tipo) f.elements.g_tipo.value = o.tipoGrupo;
      mostrar();
    };
    mostrar();
  }
  function initCotizadores() { $$("form[data-cot]").forEach(initCotizador); }

  /* opciones a partir de un botón o de la URL */
  function opciones(desde) {
    var o = {};
    var get = desde.get ? function (k) { return desde.get(k); } : function (k) { return desde.getAttribute("data-" + k); };
    var s = get("servicio"), d = get("destino"), p = get("paquete"), n = get("personas");
    if (s) o.servicio = s;
    if (p) { o.paquete = p; o.servicio = o.servicio || "paquete"; }
    if (d) {
      var id = destinoId(d) || d; o.destinoNombre = destinoNombre(id);
      if (!p && (!s || s === "paquete")) {
        var px = (D.paquetes || []).filter(function (x) { return x.destino === id; })[0];
        if (px) { o.servicio = "paquete"; o.paquete = px.id; } else { o.servicio = o.servicio || "boletos"; }
      }
    }
    if (n) o.personas = parseInt(n, 10) || 0;
    return o;
  }

  /* ---------- hoja del cotizador ---------- */
  function initHoja() {
    var dlg = $("[data-hoja]");
    $$("[data-cotizar]").forEach(function (b) {
      b.addEventListener("click", function (ev) {
        if (!dlg || typeof dlg.showModal !== "function") return; // sigue el enlace a cotizar.html
        ev.preventDefault();
        var f = $("form[data-cot]", dlg); if (f && f._preparar) f._preparar(opciones(b));
        dlg.showModal(); document.documentElement.classList.add("hoja-abierta");
        var m = $("#menu-movil"); if (m && !m.hidden) { m.hidden = true; document.documentElement.classList.remove("menu-abierto"); }
      });
    });
    if (!dlg) return;
    function cerrar() { dlg.close(); }
    $$("[data-hoja-cerrar]", dlg).forEach(function (x) { x.addEventListener("click", cerrar); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) cerrar(); });
    dlg.addEventListener("close", function () { document.documentElement.classList.remove("hoja-abierta"); });
  }
  function initCotizarURL() {
    if (!document.body.classList.contains("p-cotizar")) return;
    var q = new URLSearchParams(location.search), f = $(".cot-pagina form[data-cot]");
    if (f && f._preparar && (q.get("servicio") || q.get("destino") || q.get("paquete") || q.get("personas"))) f._preparar(opciones(q));
  }
  function initGrupos() {
    var f = $("#form-grupo form[data-cot]"); if (!f) return;
    $$("[data-tipo-grupo]").forEach(function (a) {
      a.addEventListener("click", function () { if (f._preparar) f._preparar({ tipoGrupo: a.getAttribute("data-tipo-grupo") }); });
    });
  }

  /* ---------- buscador rápido ---------- */
  function initBuscador() {
    var f = $("[data-buscador]"); if (!f) return;
    f.addEventListener("submit", function (ev) {
      var amb = f.elements.ambito.value, de = f.elements.destino.value, pe = f.elements.personas.value;
      ev.preventDefault();
      var q = new URLSearchParams();
      if (amb === "boletos") { q.set("servicio", "boletos"); if (de) q.set("destino", de); if (pe) q.set("personas", pe); location.href = RAIZ + "cotizar.html?" + q.toString(); return; }
      if (amb) q.set("ambito", amb); if (de) q.set("destino", de); if (pe && +pe > 1) q.set("personas", pe);
      location.href = RAIZ + "paquetes.html" + (q.toString() ? "?" + q.toString() : "");
    });
  }

  /* ---------- filtros del catálogo ---------- */
  function initFiltros() {
    var f = $("[data-filtros]"), lista = $("[data-lista]"); if (!f || !lista) return;
    var tarj = $$(".tp", lista), vacio = $("[data-vacio]"), velo = null, btnAbrir = $("[data-filtros-abrir]");
    var q = new URLSearchParams(location.search);
    ["ambito", "duracion"].forEach(function (k) { var v = q.get(k) || ""; $$('input[name="' + k + '"]', f).forEach(function (r) { r.checked = r.value === v; }); });
    if (q.get("destino")) f.elements.destino.value = q.get("destino");
    if (q.get("personas")) f.elements.personas.value = Math.min(10, parseInt(q.get("personas"), 10) || 0) || "";
    function v(n) { var el = f.elements[n]; if (el.length && !el.tagName) { for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value; return ""; } return el.value; }
    function aplicar(guardar) {
      var amb = v("ambito"), de = v("destino"), du = v("duracion"), pe = parseInt(v("personas"), 10) || 0, n = 0;
      tarj.forEach(function (t) {
        var dias = +t.getAttribute("data-dias"), ok = true;
        if (amb && t.getAttribute("data-ambito") !== amb) ok = false;
        if (de && (" " + t.getAttribute("data-destino") + " ").indexOf(" " + de + " ") < 0) ok = false;
        if (du === "corta" && dias > 4) ok = false;
        if (du === "media" && (dias < 5 || dias > 7)) ok = false;
        if (du === "larga" && dias < 8) ok = false;
        if (pe && +t.getAttribute("data-personas") < pe) ok = false;
        t.classList.toggle("oculto", !ok); if (ok) n++;
      });
      $$("[data-contador]").forEach(function (c) { c.textContent = n; });
      $$("[data-contador-btn]").forEach(function (c) { c.textContent = n; });
      var txt = $("[data-contador-txt]"); if (txt) txt.textContent = n === 1 ? "paquete" : "paquetes";
      if (vacio) vacio.hidden = n > 0;
      var activos = [amb, de, du, pe ? "x" : ""].filter(Boolean).length, nb = $("[data-filtros-n]");
      if (nb) { nb.textContent = activos; nb.hidden = !activos; }
      if (guardar) {
        var u = new URLSearchParams(location.search);
        [["ambito", amb], ["destino", de], ["duracion", du], ["personas", pe || ""]].forEach(function (x) { if (x[1]) u.set(x[0], x[1]); else u.delete(x[0]); });
        u.delete("fecha");
        history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u.toString() : ""));
      }
    }
    f.addEventListener("change", function () { aplicar(true); });
    f.addEventListener("reset", function () { setTimeout(function () { aplicar(true); }, 0); });
    $$("[data-limpiar]").forEach(function (b) { if (b.type !== "reset") b.addEventListener("click", function () { f.reset(); }); });
    function abrir() { f.classList.add("abierto"); velo = document.createElement("div"); velo.className = "velo-filtros"; velo.addEventListener("click", cerrar); document.body.appendChild(velo); document.documentElement.classList.add("hoja-abierta"); if (btnAbrir) btnAbrir.setAttribute("aria-expanded", "true"); }
    function cerrar() { f.classList.remove("abierto"); if (velo) velo.remove(); velo = null; document.documentElement.classList.remove("hoja-abierta"); if (btnAbrir) { btnAbrir.setAttribute("aria-expanded", "false"); } }
    if (btnAbrir) btnAbrir.addEventListener("click", abrir);
    $$("[data-filtros-cerrar]", f).forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && f.classList.contains("abierto")) cerrar(); });
    aplicar(false);
  }

    /* ---------- visor de fotos ---------- */
  function initVisor() {
    var v = $("[data-visor]"), botones = $$("[data-visor-abrir]"); if (!v || !botones.length) return;
    var caja = $("[data-visor-foto]", v), grupo = [], i = 0, ultimo = null;
    function url(b) { return (b.getAttribute("data-foto") || "").replace("{w}", innerWidth > 1000 ? "1280" : "960"); }
    function mostrar() {
      var b = grupo[i]; caja.innerHTML = "";
      var im = document.createElement("img"); im.src = url(b); im.alt = b.getAttribute("data-alt") || ""; caja.appendChild(im);
      $("[data-visor-tit]", v).textContent = b.getAttribute("data-tit") || "";
      $("[data-visor-num]", v).textContent = (i + 1) + " / " + grupo.length;
    }
    function abrir(b) {
      var g = b.getAttribute("data-grupo");
      grupo = botones.filter(function (x) { return x.getAttribute("data-grupo") === g && !(x.closest(".oculto")); });
      i = Math.max(0, grupo.indexOf(b)); ultimo = b; v.hidden = false; document.documentElement.classList.add("hoja-abierta"); mostrar();
      $("[data-visor-cerrar]", v).focus();
    }
    function cerrar() { v.hidden = true; caja.innerHTML = ""; document.documentElement.classList.remove("hoja-abierta"); if (ultimo) ultimo.focus(); }
    function paso(n) { i = (i + n + grupo.length) % grupo.length; mostrar(); }
    botones.forEach(function (b) { b.addEventListener("click", function () { abrir(b); }); });
    $("[data-visor-cerrar]", v).addEventListener("click", cerrar);
    $("[data-visor-ant]", v).addEventListener("click", function () { paso(-1); });
    $("[data-visor-sig]", v).addEventListener("click", function () { paso(1); });
    caja.addEventListener("click", function (ev) { if (ev.target === caja) cerrar(); });
    document.addEventListener("keydown", function (ev) {
      if (v.hidden) return;
      if (ev.key === "Escape") cerrar(); if (ev.key === "ArrowLeft") paso(-1); if (ev.key === "ArrowRight") paso(1);
    });
    var x0 = null;
    caja.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    caja.addEventListener("touchend", function (ev) { if (x0 === null) return; var dx = ev.changedTouches[0].clientX - x0; if (Math.abs(dx) > 45) paso(dx < 0 ? 1 : -1); x0 = null; });
  }

    /* ---------- destinos: cinta que avanza sola y despacio, sin fin (nunca retiene el scroll) ---------- */
  function initCarrusel() {
    var sec = $("[data-carrusel]"); if (!sec) return;
    var pista = $("[data-pista]", sec), ant = $("[data-carr-ant]", sec), sig = $("[data-carr-sig]", sec);
    var VEL = 24; /* px por segundo: despacio, para leer cada destino */
    var encima = false, visible = false, pausaHasta = 0, pos = 0, ultimo = -1, t0 = 0, ancho = 0;
    var originales = [].slice.call(pista.children);
    /* copia decorativa al final para que la cinta no se acabe; solo con movimiento */
    if (!reducido && originales.length > 1) {
      originales.forEach(function (li) {
        var c = li.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.classList.add("des-copia");
        [].forEach.call(c.querySelectorAll("a, button"), function (a) { a.setAttribute("tabindex", "-1"); });
        pista.appendChild(c);
      });
      pista.classList.add("deriva");
    }
    function medir() { var c = $(".des-copia", pista); ancho = c ? c.offsetLeft - originales[0].offsetLeft : 0; }
    function paso() { var it = $(".des-item", pista); return it ? it.offsetWidth + (parseFloat(getComputedStyle(pista).columnGap) || 14) : 300; }
    function pausar(ms) { pausaHasta = Date.now() + (ms || 4000); }
    function ir(n) {
      pausar(5000);
      if (ancho) {
        if (n < 0 && pista.scrollLeft < paso()) pista.scrollLeft += ancho;
        pista.scrollBy({ left: n * paso(), behavior: "smooth" });
        return;
      }
      var max = pista.scrollWidth - pista.clientWidth - 4;
      if (n > 0 && pista.scrollLeft >= max) pista.scrollTo({ left: 0, behavior: reducido ? "auto" : "smooth" });
      else if (n < 0 && pista.scrollLeft <= 4) pista.scrollTo({ left: max + 4, behavior: reducido ? "auto" : "smooth" });
      else pista.scrollBy({ left: n * paso(), behavior: reducido ? "auto" : "smooth" });
    }
    function cuadro(t) {
      var dt = t0 ? Math.min(t - t0, 64) : 0; t0 = t;
      if (ancho && visible && !encima && !document.hidden && Date.now() > pausaHasta) {
        /* si la persona la movió, seguir desde donde la dejó */
        if (ultimo < 0 || Math.abs(pista.scrollLeft - ultimo) > 2) pos = pista.scrollLeft;
        pos += VEL * dt / 1000;
        if (pos >= ancho) pos -= ancho;
        pista.scrollLeft = pos; ultimo = pista.scrollLeft;
      } else ultimo = -1;
      requestAnimationFrame(cuadro);
    }
    /* se pausa mientras la tocan, la arrastran o usan las flechas, y sigue sola a los 4 segundos */
    ["pointerdown", "touchstart", "touchmove", "wheel", "keydown"].forEach(function (t) { pista.addEventListener(t, function () { pausar(); }, { passive: true }); });
    pista.addEventListener("focusin", function () { pausar(8000); });
    pista.addEventListener("mouseenter", function () { encima = true; });
    pista.addEventListener("mouseleave", function () { encima = false; pausar(1200); });
    if (ant) ant.addEventListener("click", function () { ir(-1); });
    if (sig) sig.addEventListener("click", function () { ir(1); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.2 }).observe(pista);
    else visible = true;
    if (!reducido && originales.length > 1) {
      medir(); addEventListener("resize", medir); addEventListener("load", medir);
      requestAnimationFrame(cuadro);
    }
    /* arrastre con el mouse en la computadora */
    var x0 = null, s0 = 0, movio = false;
    pista.addEventListener("pointerdown", function (ev) { if (ev.pointerType !== "mouse") return; x0 = ev.clientX; s0 = pista.scrollLeft; movio = false; });
    addEventListener("pointermove", function (ev) { if (x0 === null) return; pausar(); var dx = ev.clientX - x0; if (Math.abs(dx) > 5) { movio = true; pista.classList.add("arrastrando"); pista.scrollLeft = s0 - dx; } });
    addEventListener("pointerup", function () { x0 = null; setTimeout(function () { pista.classList.remove("arrastrando"); }, 0); });
    pista.addEventListener("click", function (ev) { if (movio) { ev.preventDefault(); movio = false; } }, true);
  }

  /* ---------- avioncito de "Así de sencillo": recorre su ruta solo, una vez, al aparecer ---------- */
  function initAvion() {
    var sec = $("[data-ruta-avion]"); if (!sec) return;
    var caja = $(".como-ruta", sec), avion = $("[data-avion]", sec), p = reducido ? 1 : 0, hecho = false;
    function svgVisible() { return $$(".como-svg", sec).filter(function (s) { return getComputedStyle(s).display !== "none"; })[0]; }
    function poner() {
      var svg = svgVisible(); if (!svg) return;
      var path = $("[data-trazo]", svg), L = path.getTotalLength(), vb = svg.viewBox.baseVal;
      path.style.strokeDasharray = L + " " + L; path.style.strokeDashoffset = (L * (1 - p)).toFixed(1);
      var sx = svg.clientWidth / vb.width, sy = svg.clientHeight / vb.height;
      var a = path.getPointAtLength(L * p), b = path.getPointAtLength(Math.min(L, L * p + 2)), c = path.getPointAtLength(Math.max(0, L * p - 2));
      var ang = Math.atan2((b.y - c.y) * sy, (b.x - c.x) * sx) * 180 / Math.PI;
      var so = svg.getBoundingClientRect(), co = caja.getBoundingClientRect();
      avion.style.transform = "translate(" + (so.left - co.left + a.x * sx - 20).toFixed(1) + "px," + (so.top - co.top + a.y * sy - 20).toFixed(1) + "px) rotate(" + ang.toFixed(1) + "deg)";
    }
    function volar() {
      if (hecho) return; hecho = true;
      var t0 = null, dur = 900;
      function cuadro(t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / dur); p = 1 - Math.pow(1 - k, 3); poner(); if (k < 1) requestAnimationFrame(cuadro); }
      requestAnimationFrame(cuadro);
    }
    addEventListener("resize", poner);
    poner();
    if (reducido || !("IntersectionObserver" in window)) { p = 1; poner(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { volar(); io.disconnect(); } }, { threshold: 0.45 });
    io.observe(caja);
  }

  /* ---------- video de la portada: vertical en el teléfono, 16:9 en la computadora ---------- */
  function initVideo() {
    var v = $(".por-video"); if (!v) return;
    var c = navigator.connection || {};
    if (reducido || c.saveData || /2g/.test(c.effectiveType || "")) return;
    var tel = innerWidth < 900, src = v.getAttribute(tel ? "data-video-tel" : "data-video-pc") || v.getAttribute("data-video-pc") || "";
    if (!src) return;
    var pos = v.getAttribute(tel ? "data-poster-tel" : "data-poster-pc"); if (pos) v.poster = pos;
    v.src = src;
    v.addEventListener("canplay", function () { v.classList.add("lista"); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }, { once: true });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }); }).observe(v);
  }

  /* ---------- la maleta: el aro se llena ---------- */
  function initMaleta() {
    var m = $("[data-maleta]"); if (!m) return;
    var clave = "maleta-" + m.getAttribute("data-maleta"), items = $$("[data-mal-item]", m);
    var aro = $("[data-mal-aro]", m), cuenta = $("[data-mal-cuenta]", m), fin = $("[data-mal-fin]", m);
    var guardado = []; try { guardado = JSON.parse(localStorage.getItem(clave) || "[]"); } catch (e) {}
    items.forEach(function (i) { i.checked = guardado.indexOf(i.value) >= 0; });
    function pintar(guardar) {
      var marcados = items.filter(function (i) { return i.checked; }), pct = items.length ? marcados.length / items.length : 0;
      aro.style.strokeDashoffset = (100 - pct * 100).toFixed(1);
      cuenta.textContent = marcados.length + "/" + items.length;
      if (fin) fin.hidden = pct < 1;
      if (guardar) try { localStorage.setItem(clave, JSON.stringify(marcados.map(function (i) { return i.value; }))); } catch (e) {}
    }
    items.forEach(function (i) { i.addEventListener("change", function () { pintar(true); }); });
    pintar(false);
  }

  /* ---------- pestañas ---------- */
  function initTabs() {
    $$("[data-tabs]").forEach(function (t) {
      var tabs = $$('[role="tab"]', t);
      function elegir(tab, foco) {
        tabs.forEach(function (x) { var on = x === tab; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute("aria-controls")).hidden = !on; });
        if (foco) tab.focus();
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { elegir(tab); });
        tab.addEventListener("keydown", function (ev) {
          if (ev.key === "ArrowRight") { ev.preventDefault(); elegir(tabs[(i + 1) % tabs.length], true); }
          if (ev.key === "ArrowLeft") { ev.preventDefault(); elegir(tabs[(i - 1 + tabs.length) % tabs.length], true); }
        });
      });
    });
  }

  /* ---------- instalar como app ---------- */
  function initApp() {
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      addEventListener("load", function () { navigator.serviceWorker.register(RAIZ + "sw.js").catch(function () {}); });
    }
    var caja = $("[data-instalar]"), btn = $("[data-instalar-btn]"), ios = $("[data-ios]"), ya = $("[data-instalada]");
    var standalone = (matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
    var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (caja) {
      if (standalone) { if (ya) ya.hidden = false; if (ios) ios.hidden = true; }
      else if (!esIOS && ios) ios.hidden = true;
    }
    var aviso = null;
    addEventListener("beforeinstallprompt", function (ev) { ev.preventDefault(); aviso = ev; if (btn) btn.hidden = false; });
    if (btn) btn.addEventListener("click", function () {
      if (!aviso) return; aviso.prompt();
      aviso.userChoice.then(function (r) { if (r.outcome === "accepted") { btn.hidden = true; if (ya) ya.hidden = false; } aviso = null; });
    });
    addEventListener("appinstalled", function () { if (btn) btn.hidden = true; if (ya) ya.hidden = false; });
  }

  /* [novedades] */
  /* ---------- compartir un artículo de Novedades: menú del teléfono si existe; si no, WhatsApp ---------- */
  function initCompartir() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-compartir]"), function (b) {
      if (!navigator.share) return;
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        navigator.share({ title: b.getAttribute("data-titulo"), url: b.getAttribute("data-url") }).catch(function () {});
      });
    });
  }
  /* [/novedades] */

  function initPausa() {
    document.addEventListener("visibilitychange", function () { document.body.classList.toggle("pausado", document.hidden); });
  }

  safe(initMeses, "meses");
  safe(initMenu, "menu");
  safe(initCotizadores, "cotizadores");
  safe(initHoja, "hoja");
  safe(initCotizarURL, "cotizar-url");
  safe(initGrupos, "grupos");
  safe(initBuscador, "buscador");
  safe(initFiltros, "filtros");
    safe(initVisor, "visor");
    safe(initCarrusel, "carrusel");
  safe(initAvion, "avion");
  safe(initVideo, "video");
  safe(initMaleta, "maleta");
  safe(initTabs, "tabs");
  safe(initApp, "app");
  /* [novedades] */
  safe(initCompartir, "compartir");
  /* [/novedades] */
  safe(initPausa, "pausa");
})();
