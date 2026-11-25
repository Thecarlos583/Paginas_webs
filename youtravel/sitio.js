/* Agencias de viajes · JS común. Todo el contenido ya viene escrito en el HTML:
   esto solo arma mensajes de WhatsApp, filtra, compara y mueve. Cada parte va protegida. */
(function () {
  "use strict";
  function safe(fn, n) { try { fn(); } catch (err) { if (window.console) console.warn("[" + n + "]", err); } }
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
      if (amb === "boletos") { q.set("servicio", "boletos"); if (de) q.set("destino", de); if (pe) q.set("personas", pe); location.href = "cotizar.html?" + q.toString(); return; }
      if (amb) q.set("ambito", amb); if (de) q.set("destino", de); if (pe && +pe > 1) q.set("personas", pe);
      location.href = "paquetes.html" + (q.toString() ? "?" + q.toString() : "");
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

  /* ---------- comparador ---------- */
  function initComparador() {
    var cajas = $$("[data-comparar]"); if (!cajas.length) return;
    var bandeja = $("[data-cmp-bandeja]"), dlg = $("[data-cmp-dlg]"), pista = $("[data-cmp-pista]");
    var q = new URLSearchParams(location.search), elegidos = (q.get("comparar") || "").split(",").filter(paquete).slice(0, 3);
    function pintar(guardar) {
      cajas.forEach(function (c) {
        c.checked = elegidos.indexOf(c.value) >= 0;
        c.disabled = !c.checked && elegidos.length >= 3;
        var t = c.closest(".tp"); if (t) t.classList.toggle("en-cmp", c.checked);
      });
      if (bandeja) { bandeja.hidden = elegidos.length === 0; $("[data-cmp-n]", bandeja).textContent = elegidos.length; $("[data-cmp-abrir]", bandeja).disabled = elegidos.length < 2; }
      if (guardar) { var u = new URLSearchParams(location.search); if (elegidos.length) u.set("comparar", elegidos.join(",")); else u.delete("comparar"); history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u.toString() : "")); }
    }
    cajas.forEach(function (c) {
      c.addEventListener("change", function () {
        var i = elegidos.indexOf(c.value);
        if (c.checked && i < 0) elegidos.push(c.value); if (!c.checked && i >= 0) elegidos.splice(i, 1);
        pintar(true);
      });
    });
    function esc(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }
    function abrir() {
      if (!dlg || elegidos.length < 2) return;
      var todos = {}; elegidos.forEach(function (id) { paquete(id).incluye.forEach(function (k) { todos[k] = 1; }); });
      var claves = Object.keys(todos);
      pista.style.setProperty("--n", elegidos.length);
      pista.innerHTML = elegidos.map(function (id, i) {
        var p = paquete(id), foto = (D.fotos[p.foto] || "").replace("{w}", "500");
        var inc = claves.map(function (k) {
          var si = p.incluye.indexOf(k) >= 0;
          return '<li class="' + (si ? "cmp-si" : "cmp-no") + '"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (si ? '<path d="m5 12.5 4.5 4.5L19 7.5"/>' : '<path d="M5 12h14"/>') + "</svg>" + esc(D.etiquetas[k] || k) + (si ? "" : " (no)") + "</li>";
        }).join("");
        var pr = D.precios ? "desde " + dinero(p.precio) + " por persona" : "Consulte la tarifa";
        return '<article class="cmp-col" style="--i:' + i + '"><img src="' + esc(foto) + '" alt="" loading="lazy"><h3>' + esc(p.nombre) + "</h3><dl>" +
          '<div class="cmp-fila"><dt>Tipo</dt><dd>' + (p.ambito === "nacional" ? "Nacional" : "Internacional · " + esc(p.region)) + "</dd></div>" +
          '<div class="cmp-fila"><dt>Duración</dt><dd>' + p.dias + " días, " + p.noches + " noches</dd></div>" +
          '<div class="cmp-fila"><dt>Salida</dt><dd>' + esc(p.salida) + "</dd></div>" +
          '<div class="cmp-fila"><dt>Precio de ejemplo</dt><dd><strong>' + pr + "</strong></dd></div>" +
          '<div class="cmp-fila"><dt>Incluye</dt><dd><ul>' + inc + "</ul></dd></div></dl>" +
          '<a class="btn btn-tinta btn-chico" href="paquete-' + esc(p.id) + '.html">Ver paquete</a></article>';
      }).join("");
      dlg.showModal(); document.documentElement.classList.add("hoja-abierta");
    }
    if (bandeja) {
      $("[data-cmp-abrir]", bandeja).addEventListener("click", abrir);
      $("[data-cmp-vaciar]", bandeja).addEventListener("click", function () { elegidos = []; pintar(true); });
    }
    if (dlg) {
      $("[data-cmp-cerrar]", dlg).addEventListener("click", function () { dlg.close(); });
      dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
      dlg.addEventListener("close", function () { document.documentElement.classList.remove("hoja-abierta"); });
    }
    pintar(false);
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

  /* ---------- galería con filtros ---------- */
  function initGaleria() {
    var f = $("[data-gal-filtros]"), m = $("[data-mosaico]"); if (!f || !m) return;
    f.addEventListener("change", function () {
      var c = (f.querySelector("input:checked") || {}).value || "";
      $$(".mos-item", m).forEach(function (li) { li.classList.toggle("oculto", !!c && li.getAttribute("data-cat") !== c); });
    });
  }

  /* ---------- destinos: galería horizontal fijada (computadora) ---------- */
  function initHorizontal() {
    var sec = $("[data-horizontal]"); if (!sec) return;
    var fijo = $(".destinos-h-fijo", sec), pista = $("[data-pista]", sec);
    var mq = matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
    var dist = 0, activo = false, pend = false;
    function cab() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cab-alto")) || 76; }
    function medir() {
      activo = mq.matches && !reducido && innerHeight >= 600;
      sec.classList.toggle("h-activo", activo);
      if (!activo) { sec.style.height = ""; pista.style.transform = ""; return; }
      pista.style.transform = "";
      dist = Math.max(0, pista.scrollWidth - fijo.clientWidth);
      sec.style.height = (fijo.offsetHeight + dist * 0.7) + "px";
      mover();
    }
    function mover() {
      pend = false; if (!activo) return;
      var r = sec.getBoundingClientRect(), total = sec.offsetHeight - fijo.offsetHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, (cab() - r.top) / total)) : 0;
      pista.style.transform = "translate3d(" + (-dist * p).toFixed(1) + "px,0,0)";
    }
    addEventListener("scroll", function () { if (!pend && activo) { pend = true; requestAnimationFrame(mover); } }, { passive: true });
    addEventListener("resize", medir);
    if (mq.addEventListener) mq.addEventListener("change", medir);
    addEventListener("load", medir);
    medir();
    /* flechas y arrastre cuando no está fijada */
    var ant = $("[data-carr-ant]", sec), sig = $("[data-carr-sig]", sec);
    function des(n) { var item = $(".des-item", pista); var w = item ? item.offsetWidth + 14 : 300; pista.scrollBy({ left: n * w, behavior: reducido ? "auto" : "smooth" }); }
    if (ant) ant.addEventListener("click", function () { des(-1); });
    if (sig) sig.addEventListener("click", function () { des(1); });
    var x0 = null, s0 = 0, movio = false;
    pista.addEventListener("pointerdown", function (ev) { if (activo || ev.pointerType !== "mouse") return; x0 = ev.clientX; s0 = pista.scrollLeft; movio = false; });
    addEventListener("pointermove", function (ev) { if (x0 === null) return; var dx = ev.clientX - x0; if (Math.abs(dx) > 5) { movio = true; pista.classList.add("arrastrando"); pista.scrollLeft = s0 - dx; } });
    addEventListener("pointerup", function () { x0 = null; setTimeout(function () { pista.classList.remove("arrastrando"); }, 0); });
    pista.addEventListener("click", function (ev) { if (movio) { ev.preventDefault(); movio = false; } }, true);
  }

  /* ---------- avioncito por la ruta de "Así de sencillo" ---------- */
  function initAvion() {
    var sec = $("[data-ruta-avion]"); if (!sec) return;
    var caja = $(".como-ruta", sec), avion = $("[data-avion]", sec), pend = false;
    function svgVisible() { return $$(".como-svg", sec).filter(function (s) { return getComputedStyle(s).display !== "none"; })[0]; }
    function mover() {
      pend = false;
      var svg = svgVisible(); if (!svg) return;
      var path = $("[data-trazo]", svg), L = path.getTotalLength(), vb = svg.viewBox.baseVal;
      var r = sec.getBoundingClientRect(), vh = innerHeight;
      var p = reducido ? 1 : Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height * 0.75)));
      path.style.strokeDasharray = L + " " + L; path.style.strokeDashoffset = (L * (1 - p)).toFixed(1);
      var sx = svg.clientWidth / vb.width, sy = svg.clientHeight / vb.height;
      var a = path.getPointAtLength(L * p), b = path.getPointAtLength(Math.min(L, L * p + 2)), c = path.getPointAtLength(Math.max(0, L * p - 2));
      var ang = Math.atan2((b.y - c.y) * sy, (b.x - c.x) * sx) * 180 / Math.PI;
      var so = svg.getBoundingClientRect(), co = caja.getBoundingClientRect();
      avion.style.transform = "translate(" + (so.left - co.left + a.x * sx - 20).toFixed(1) + "px," + (so.top - co.top + a.y * sy - 20).toFixed(1) + "px) rotate(" + ang.toFixed(1) + "deg)";
    }
    addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(mover); } }, { passive: true });
    addEventListener("resize", mover);
    mover();
  }

  /* ---------- video de la portada (solo computadora y buena conexión) ---------- */
  function initVideo() {
    var v = $(".por-video"); if (!v) return;
    var c = navigator.connection || {};
    if (reducido || c.saveData || /2g/.test(c.effectiveType || "") || innerWidth < 900) return;
    v.src = v.getAttribute("data-video");
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
      addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
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
  safe(initComparador, "comparador");
  safe(initVisor, "visor");
  safe(initGaleria, "galeria");
  safe(initHorizontal, "horizontal");
  safe(initAvion, "avion");
  safe(initVideo, "video");
  safe(initMaleta, "maleta");
  safe(initTabs, "tabs");
  safe(initApp, "app");
  safe(initPausa, "pausa");
})();
