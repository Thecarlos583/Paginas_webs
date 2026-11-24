/* Piscinas y centros recreacionales: interacciones (generador piscina.py). JS clásico, sin librerías. */
(function () {
  "use strict";
  var D = window.SITIO || { planes: [], celebra: [] };
  function safe(fn, n) { try { fn(); } catch (err) { if (window.console) console.warn("[sitio " + n + "]", err); } }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finoPC = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function plan(id) { return D.planes.filter(function (p) { return p.id === id; })[0]; }
  function celebra(id) { return D.celebra.filter(function (c) { return c.id === id; })[0]; }
  function dos(n) { return (n < 10 ? "0" : "") + n; }
  function hoyISO() { var d = new Date(); return d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate()); }
  function leerFecha(v) { if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null; var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fechaLarga(d) { return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()]; }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b); }
  function dinero(n) { return (D.moneda || "$") + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function waURL(msg) { return "https://wa.me/" + D.wa + "?text=" + encodeURIComponent(msg); }
  function hora12(h) {
    var m = Math.round(h * 60), hh = Math.floor(m / 60) % 24, mm = m % 60;
    var suf = hh < 12 ? "a.m." : "p.m."; var h12 = hh % 12 || 12;
    return h12 + ":" + dos(mm) + " " + suf;
  }
  function observar(els, fn, margen) {
    if (!("IntersectionObserver" in window)) { els.forEach(fn); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { fn(x.target); io.unobserve(x.target); } });
    }, { rootMargin: margen || "0px 0px -8% 0px", threshold: 0.01 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Salida y puesta del sol (algoritmo de la NOAA, simplificado) */
  function solDelDia(fecha) {
    var inicio = new Date(fecha.getFullYear(), 0, 0);
    var n = Math.round((fecha - inicio) / 864e5);
    var g = 2 * Math.PI / 365 * (n - 1);
    var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var lat = D.lat * Math.PI / 180;
    var ha = Math.acos(Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(dec)) - Math.tan(lat) * Math.tan(dec)) * 180 / Math.PI;
    var sale = 720 - 4 * (D.lon + ha) - eq + D.utc * 60;
    var pone = 720 - 4 * (D.lon - ha) - eq + D.utc * 60;
    return { sale: sale / 60, pone: pone / 60 };
  }

  /* ---------------------------------------------------------------- menú */
  function initMenu() {
    var btn = $(".menu-btn"), menu = $("#menu-movil"); if (!btn || !menu) return;
    function abrir() { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); document.body.classList.add("menu-abierto"); var a = $("a", menu); if (a) a.focus(); }
    function cerrar() { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-abierto"); btn.focus(); }
    btn.addEventListener("click", abrir);
    $$("[data-menu-cerrar]", menu).forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !menu.hidden) cerrar(); });
  }

  function initVideo() {
    var v = $(".portada-video"); if (!v) return;
    var c = navigator.connection || {};
    var pc = matchMedia("(min-width: 900px)").matches;
    var b = $(".btn-brillo"); if (b && !reducido) setTimeout(function () { b.classList.add("destello"); }, 900);
    if (!pc || c.saveData || /2g/.test(c.effectiveType || "") || reducido) return;
    v.src = v.getAttribute("data-video");
    v.addEventListener("playing", function () { v.classList.add("lista"); });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    document.addEventListener("visibilitychange", function () { if (document.hidden) v.pause(); else { var q = v.play(); if (q && q.catch) q.catch(function () {}); } });
  }

  function initPausa() {
    document.addEventListener("visibilitychange", function () { document.body.classList.toggle("pausado", document.hidden); });
    var ds = $$(".divisor.animado"); if (!ds.length || reducido) return;
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { x.target.classList.toggle("en-vista", x.isIntersecting); }); });
    ds.forEach(function (d) { io.observe(d); });
  }

  function initRevela() {
    var rs = $$(".rev"); if (!rs.length) return;
    observar(rs, function (r) { r.classList.add("visto"); }, "0px 0px -12% 0px");
    setTimeout(function () { rs.forEach(function (r) { r.classList.add("visto"); }); }, 6000);
  }

  function initInclina() {
    if (!finoPC || reducido) return;
    $$("[data-inclina]").forEach(function (t) {
      t.addEventListener("pointermove", function (ev) {
        var r = t.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
        t.style.setProperty("--ry", (x * 5).toFixed(2) + "deg");
        t.style.setProperty("--rx", (-y * 4).toFixed(2) + "deg");
      });
      t.addEventListener("pointerleave", function () { t.style.removeProperty("--rx"); t.style.removeProperty("--ry"); });
    });
  }

  /* ---------------------------------------------------------------- franja de sol */
  function svgEl(tag, at, txt) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in at) el.setAttribute(k, at[k]);
    if (txt) el.textContent = txt;
    return el;
  }
  function pintarFranja(form, p, fecha) {
    var caja = $("[data-franja]", form); if (!caja) return;
    var texto = $("[data-franja-texto]", caja), barra = $("[data-franja-barra]", caja);
    while (barra.firstChild) barra.removeChild(barra.firstChild);
    if (!fecha) { texto.textContent = "Elija una fecha y verá a qué hora sale y se pone el sol ese día."; return; }
    var s = solDelDia(fecha);
    var dorada = s.pone - 0.75;
    var t = "El " + fechaLarga(fecha) + " el sol sale a las " + hora12(s.sale) + " y se pone a las " + hora12(s.pone) + ".";
    if (p) {
      t += " Su plan va de " + hora12(p.horas[0]) + " a " + hora12(p.horas[1]) + "; la luz dorada para las fotos empieza a las " + hora12(dorada) + ".";
      if (p.horas[1] > s.pone) t += " Al final ya está oscureciendo.";
    }
    texto.textContent = t;
    var A = 5.5, B = 20, X = function (h) { return 10 + (Math.max(A, Math.min(B, h)) - A) / (B - A) * 300; };
    var svg = svgEl("svg", { viewBox: "0 0 320 62", role: "img", "aria-label": "Horas de sol y horario del plan" });
    svg.appendChild(svgEl("rect", { "class": "f-cielo", x: 10, y: 22, width: 300, height: 14, rx: 7 }));
    svg.appendChild(svgEl("rect", { "class": "f-luz", x: X(s.sale), y: 22, width: X(s.pone) - X(s.sale), height: 14, rx: 7 }));
    svg.appendChild(svgEl("rect", { "class": "f-dorada", x: X(dorada), y: 22, width: X(s.pone) - X(dorada), height: 14 }));
    if (p) svg.appendChild(svgEl("rect", { "class": "f-plan", x: X(p.horas[0]), y: 26, width: X(p.horas[1]) - X(p.horas[0]), height: 6, rx: 3 }));
    [[s.sale, "Sale " + hora12(s.sale).replace(" a.m.", "")], [s.pone, "Se pone " + hora12(s.pone).replace(" p.m.", "")]].forEach(function (m, i) {
      svg.appendChild(svgEl("circle", { "class": "f-sol", cx: X(m[0]), cy: 29, r: 4 }));
      svg.appendChild(svgEl("text", { x: X(m[0]), y: 13, "text-anchor": i ? "end" : "start" }, m[1]));
    });
    [6, 9, 12, 15, 18].forEach(function (h) {
      svg.appendChild(svgEl("line", { "class": "f-marca", x1: X(h), x2: X(h), y1: 38, y2: 42 }));
      svg.appendChild(svgEl("text", { x: X(h), y: 55, "text-anchor": "middle" }, (h % 12 || 12) + (h < 12 ? " a.m." : " p.m.")));
    });
    barra.appendChild(svg);
  }

  /* ---------------------------------------------------------------- armador */
  var armadores = [];
  function initArmador(form) {
    var aviso = $("[data-aviso]", form);
    var fecha = form.elements.fecha;
    if (fecha) { fecha.min = hoyISO(); var guardada = sessionStorage.getItem("pasadia-fecha"); if (guardada && guardada >= fecha.min) fecha.value = guardada; }
    function planSel() {
      var el = form.elements.plan; if (!el) return null;
      if (el.value !== undefined && el.type === "hidden") return plan(el.value);
      var r = $("input[name='plan']:checked", form); return r ? plan(r.value) : null;
    }
    function n(nombre) { var v = parseInt(form.elements[nombre].value, 10); return isNaN(v) ? 0 : v; }
    function poner(nombre, v) { form.elements[nombre].value = Math.max(nombre === "adultos" ? 1 : 0, Math.min(D.max || 60, v)); }
    function avisar(t, bien) { aviso.textContent = t || ""; aviso.classList.toggle("bien", !!bien); }
    function actualizar() {
      var p = planSel();
      var campoCel = $("[data-solo-celebra]", form);
      if (campoCel && form.elements.plan && form.elements.plan.type !== "hidden") campoCel.hidden = !(p && (p.tipo === "celebracion" || p.tipo === "exclusivo"));
      pintarFranja(form, p, leerFecha(fecha && fecha.value));
      var est = $("[data-estimado]", form); if (!est) return;
      var ul = $("[data-estimado-filas]", est), tot = $("[data-estimado-total]", est);
      while (ul.firstChild) ul.removeChild(ul.firstChild);
      function fila(a, b) { var li = document.createElement("li"), x = document.createElement("span"), y = document.createElement("span"); x.textContent = a; y.textContent = b; li.appendChild(x); li.appendChild(y); ul.appendChild(li); }
      if (!p) { fila("Elija un plan", ""); tot.textContent = "…"; return; }
      var ad = n("adultos"), ni = n("ninos"), total = 0;
      if (p.modo === "persona") {
        fila(plural(ad, "adulto", "adultos") + " × " + dinero(p.precio), dinero(ad * p.precio)); total += ad * p.precio;
        if (ni) { fila(plural(ni, "niño", "niños") + " × " + dinero(p.precio_nino), dinero(ni * p.precio_nino)); total += ni * p.precio_nino; }
      } else {
        fila(p.nombre + " (hasta " + p.incluye_personas + ")", dinero(p.precio)); total += p.precio;
        var extra = Math.max(0, ad + ni - p.incluye_personas);
        if (extra) { fila(plural(extra, "persona adicional", "personas adicionales") + " × " + dinero(p.adicional), dinero(extra * p.adicional)); total += extra * p.adicional; }
      }
      tot.textContent = dinero(total);
    }
    $$("[data-contador]", form).forEach(function (c) {
      var inp = $("input", c);
      $("[data-menos]", c).addEventListener("click", function () { poner(inp.name, n(inp.name) - 1); avisar(""); actualizar(); });
      $("[data-mas]", c).addEventListener("click", function () { poner(inp.name, n(inp.name) + 1); avisar(""); actualizar(); });
    });
    form.addEventListener("input", function () { avisar(""); actualizar(); });
    form.addEventListener("change", function () { if (fecha && fecha.value) sessionStorage.setItem("pasadia-fecha", fecha.value); actualizar(); });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var p = planSel(), f = leerFecha(fecha.value), ad = n("adultos"), ni = n("ninos"), tot = ad + ni;
      var hoy = leerFecha(hoyISO());
      if (!p) { avisar("Elija un plan para seguir."); var r = $("input[name='plan']", form); if (r) r.focus(); return; }
      if (!f) { avisar("Falta la fecha: elija el día de su visita."); fecha.focus(); return; }
      if (f < hoy) { avisar("Esa fecha ya pasó. Elija hoy o un día que venga."); fecha.focus(); return; }
      if (ad < 1) { avisar("Indique al menos un adulto."); form.elements.adultos.focus(); return; }
      if (tot > p.max) { avisar(p.nombre + " recibe hasta " + p.max + " personas. Si son más, escríbanos y lo conversamos."); form.elements.adultos.focus(); return; }
      if (tot < p.min) { avisar(p.nombre + " es desde " + p.min + " personas." + (p.tipo === "grupo" ? " Para menos, le sirve el pasadía familiar." : " Si son menos, escríbanos y lo conversamos.")); form.elements.adultos.focus(); return; }
      var msg = D.saludo + ", quiero reservar " + p.con_articulo + " para el " + fechaLarga(f) + ", " + plural(ad, "adulto", "adultos") + (ni ? " y " + plural(ni, "niño", "niños") : "") + ".";
      var c = form.elements.celebra && !($("[data-solo-celebra]", form) || {}).hidden ? celebra(form.elements.celebra.value) : null;
      if (c) msg += " Es " + c.msj + ".";
      var nota = (form.elements.nota.value || "").replace(/\s+/g, " ").trim();
      if (nota) msg += " Nota: " + nota + (/[.!?]$/.test(nota) ? "" : ".");
      avisar("Listo, se abre WhatsApp con su mensaje.", true);
      var w = window.open(waURL(msg), "_blank", "noopener"); if (!w) location.href = waURL(msg);
    });
    var api = {
      form: form,
      llenar: function (o) {
        o = o || {};
        if (o.plan && form.elements.plan && form.elements.plan.type !== "hidden") { var r = $("input[name='plan'][value='" + o.plan + "']", form); if (r) r.checked = true; }
        if (o.tipo && !o.plan && form.elements.plan && form.elements.plan.type !== "hidden") { var pt = D.planes.filter(function (x) { return x.tipo === o.tipo; })[0]; if (pt) { var r2 = $("input[name='plan'][value='" + pt.id + "']", form); if (r2) r2.checked = true; } }
        if (o.celebra && form.elements.celebra) form.elements.celebra.value = o.celebra;
        if (o.fecha && fecha && leerFecha(o.fecha) && o.fecha >= fecha.min) fecha.value = o.fecha;
        if (o.personas) { var k = Math.max(1, Math.min(D.max || 60, parseInt(o.personas, 10) || 0)); if (k) { poner("adultos", k); poner("ninos", 0); } }
        actualizar();
      },
      actualizar: actualizar
    };
    actualizar();
    return api;
  }
  function initArmadores() {
    $$("[data-armador]").forEach(function (f) { armadores.push(initArmador(f)); });
    var q = new URLSearchParams(location.search);
    if (document.body.classList.contains("pag-reservar") && armadores[0]) {
      armadores[0].llenar({ plan: q.get("plan"), tipo: q.get("tipo"), fecha: q.get("fecha"), personas: q.get("personas"), celebra: q.get("celebra") });
    }
    var hoja = $("#hoja"); if (!hoja) return;
    var api = armadores.filter(function (a) { return hoja.contains(a.form); })[0];
    var origen = null;
    function abrir(o) {
      origen = document.activeElement; hoja.hidden = false; document.body.classList.add("trabado");
      if (api) api.llenar(o);
      var primero = $(".hoja-cerrar", hoja); if (primero) primero.focus();
    }
    function cerrar() { hoja.hidden = true; document.body.classList.remove("trabado"); if (origen && origen.focus) origen.focus(); }
    $$("[data-abrir-armador]").forEach(function (b) {
      b.addEventListener("click", function (ev) { ev.preventDefault(); abrir({ plan: b.getAttribute("data-plan"), celebra: b.getAttribute("data-celebra") }); });
    });
    $$("[data-hoja-cerrar]", hoja).forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !hoja.hidden) cerrar(); });
  }

  function initBuscador() {
    var f = $("[data-buscador]"); if (!f) return;
    f.elements.fecha.min = hoyISO();
    f.addEventListener("submit", function () {
      if (f.elements.fecha.value) sessionStorage.setItem("pasadia-fecha", f.elements.fecha.value);
      if (!f.elements.tipo.value) f.elements.tipo.disabled = true;
      if (!f.elements.fecha.value) f.elements.fecha.disabled = true;
    });
  }

  /* ---------------------------------------------------------------- catálogo */
  function initFiltros() {
    var form = $("[data-filtros]"), rej = $("[data-rejilla]"); if (!form || !rej) return;
    var cards = $$(".tarjeta", rej), vacio = $("[data-vacio]"), cuenta = $("[data-cuenta]"), cuentaTxt = $("[data-cuenta-txt]"), cuentaBtn = $("[data-cuenta-boton]");
    var per = form.elements.personas;
    var q = new URLSearchParams(location.search);
    if (q.get("fecha")) sessionStorage.setItem("pasadia-fecha", q.get("fecha"));
    var t0 = q.get("tipo") || ""; var r0 = $("input[name='tipo'][value='" + t0.replace(/[^a-z]/g, "") + "']", form); if (r0) r0.checked = true;
    if (q.get("personas")) per.value = Math.max(0, Math.min(D.max || 60, parseInt(q.get("personas"), 10) || 0));
    function aplicar(guardar) {
      var tipo = ($("input[name='tipo']:checked", form) || {}).value || "", n = parseInt(per.value, 10) || 0, vis = 0;
      cards.forEach(function (c) {
        var ok = (!tipo || c.getAttribute("data-tipo") === tipo) && (!n || (n >= +c.getAttribute("data-min") && n <= +c.getAttribute("data-max")));
        c.hidden = !ok; if (ok) vis++;
      });
      cuenta.textContent = vis; cuentaTxt.textContent = vis === 1 ? "plan" : "planes"; if (cuentaBtn) cuentaBtn.textContent = vis;
      vacio.hidden = vis > 0;
      if (guardar) {
        var u = new URLSearchParams(location.search);
        if (tipo) u.set("tipo", tipo); else u.delete("tipo");
        if (n) u.set("personas", n); else u.delete("personas");
        history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u.toString() : "") + location.hash);
      }
    }
    $$("[data-contador]", form).forEach(function (c) {
      $("[data-menos]", c).addEventListener("click", function () { per.value = Math.max(0, (parseInt(per.value, 10) || 0) - 1); aplicar(true); });
      $("[data-mas]", c).addEventListener("click", function () { per.value = Math.min(D.max || 60, (parseInt(per.value, 10) || 0) + 1); aplicar(true); });
    });
    form.addEventListener("input", function () { aplicar(true); });
    form.addEventListener("submit", function (ev) { ev.preventDefault(); });
    var limpiar = $("[data-filtros-limpiar]");
    if (limpiar) limpiar.addEventListener("click", function () { $("input[name='tipo'][value='']", form).checked = true; per.value = 0; aplicar(true); });
    var abrirB = $("[data-filtrar-abrir]"), velo = null;
    function abrir() { form.classList.add("abierto"); abrirB.setAttribute("aria-expanded", "true"); velo = document.createElement("div"); velo.className = "filtros-velo"; velo.addEventListener("click", cerrar); document.body.appendChild(velo); document.body.classList.add("trabado"); }
    function cerrar() { form.classList.remove("abierto"); abrirB.setAttribute("aria-expanded", "false"); if (velo) velo.remove(); velo = null; document.body.classList.remove("trabado"); }
    if (abrirB) abrirB.addEventListener("click", abrir);
    $$("[data-filtrar-cerrar]", form).forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && form.classList.contains("abierto")) cerrar(); });
    aplicar(false);
  }

  function initComparador() {
    var el = $("[data-comp-elegir]"), comp = $("[data-comparador]"); if (!el || !comp) return;
    function contar() { comp.style.setProperty("--n", Math.max(1, $$(".comp-col:not(.oculto)", comp).length)); }
    $$("input", el).forEach(function (c) {
      c.addEventListener("change", function () {
        var marcados = $$("input:checked", el);
        if (!marcados.length) { c.checked = true; return; }
        var col = $("[data-comp='" + c.value + "']", comp);
        col.classList.toggle("oculto", !c.checked);
        col.classList.remove("entra"); void col.offsetWidth; if (c.checked) col.classList.add("entra");
        $$(".comp-col:not(.oculto)", comp).forEach(function (x) { if (x !== col) { x.classList.remove("entra"); void x.offsetWidth; x.classList.add("entra"); } });
        contar();
      });
    });
    contar();
  }

  /* ---------------------------------------------------------------- visor */
  function initVisor() {
    var v = $("#visor"); if (!v) return;
    var im = $("[data-visor-img]", v), cu = $("[data-visor-cuenta]", v), lista = [], i = 0, origen = null;
    function mostrar() { var b = lista[i]; im.src = b.getAttribute("data-grande"); im.alt = ""; cu.textContent = (i + 1) + " de " + lista.length; }
    function abrir(btn) {
      var g = btn.getAttribute("data-visor");
      lista = $$("[data-visor='" + g + "']").filter(function (b) { var li = b.closest("li"); return !(li && li.hidden); });
      i = Math.max(0, lista.indexOf(btn)); origen = btn; mostrar();
      v.hidden = false; document.body.classList.add("trabado"); $("[data-visor-cerrar]", v).focus();
    }
    function cerrar() { v.hidden = true; im.removeAttribute("src"); document.body.classList.remove("trabado"); if (origen) origen.focus(); }
    function mover(d) { if (!lista.length) return; i = (i + d + lista.length) % lista.length; mostrar(); }
    $$("[data-visor]").forEach(function (b) { b.addEventListener("click", function () { abrir(b); }); });
    $("[data-visor-cerrar]", v).addEventListener("click", cerrar);
    $("[data-visor-ant]", v).addEventListener("click", function () { mover(-1); });
    $("[data-visor-sig]", v).addEventListener("click", function () { mover(1); });
    v.addEventListener("click", function (ev) { if (ev.target === v) cerrar(); });
    document.addEventListener("keydown", function (ev) {
      if (v.hidden) return;
      if (ev.key === "Escape") cerrar(); else if (ev.key === "ArrowLeft") mover(-1); else if (ev.key === "ArrowRight") mover(1);
    });
    var x0 = null;
    v.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    v.addEventListener("touchend", function (ev) { if (x0 === null) return; var dx = ev.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) mover(dx < 0 ? 1 : -1); x0 = null; });
  }

  function initGaleria() {
    var f = $("[data-gal-filtros]"), gal = $("[data-galeria]"); if (!f || !gal) return;
    var items = $$("li", gal), cuenta = $("[data-gal-cuenta]");
    function aplicar(cat, guardar) {
      var n = 0;
      items.forEach(function (li) { var ok = !cat || li.getAttribute("data-cat") === cat; li.hidden = !ok; li.classList.remove("entra"); if (ok) { n++; void li.offsetWidth; li.classList.add("entra"); } });
      cuenta.textContent = n;
      if (guardar) history.replaceState(null, "", location.pathname + (cat ? "?cat=" + cat : ""));
    }
    var c0 = (new URLSearchParams(location.search).get("cat") || "").replace(/[^a-z]/g, "");
    var r0 = $("input[value='" + c0 + "']", f); if (c0 && r0) { r0.checked = true; aplicar(c0, false); }
    $$("input", f).forEach(function (r) { r.addEventListener("change", function () { aplicar(r.value, true); }); });
  }

  function initTabs() {
    $$("[data-tabs]").forEach(function (t) {
      var bs = $$("[role='tab']", t);
      function activar(b, foco) {
        bs.forEach(function (x) { var on = x === b; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; });
        if (foco) b.focus();
      }
      bs.forEach(function (b, k) {
        b.addEventListener("click", function () { activar(b); });
        b.addEventListener("keydown", function (ev) {
          if (ev.key === "ArrowRight") { ev.preventDefault(); activar(bs[(k + 1) % bs.length], true); }
          if (ev.key === "ArrowLeft") { ev.preventDefault(); activar(bs[(k - 1 + bs.length) % bs.length], true); }
        });
      });
    });
  }

  function initTraer() {
    var t = $("[data-traer]"); if (!t) return;
    var cs = $$("input[type='checkbox']", t), clave = "traer-" + (D.wa || "") + location.pathname.split("/").slice(-2, -1)[0];
    var guardado = {}; try { guardado = JSON.parse(localStorage.getItem(clave) || "{}"); } catch (err) { guardado = {}; }
    function pintar() {
      var n = cs.filter(function (c) { return c.checked; }).length;
      $("[data-traer-listos]", t).textContent = n;
      $("[data-traer-barra]", t).style.transform = "scaleX(" + (n / cs.length) + ")";
    }
    cs.forEach(function (c) {
      c.checked = !!guardado[c.value];
      c.addEventListener("change", function () { guardado[c.value] = c.checked; try { localStorage.setItem(clave, JSON.stringify(guardado)); } catch (err) {} pintar(); });
    });
    $("[data-traer-limpiar]", t).addEventListener("click", function () { cs.forEach(function (c) { c.checked = false; }); guardado = {}; try { localStorage.removeItem(clave); } catch (err) {} pintar(); });
    pintar();
  }

  /* ---------------------------------------------------------------- un día en el lugar */
  function initDia() {
    var sec = $("[data-dia]"); if (!sec || reducido) return;
    var mq = matchMedia("(min-width: 960px)");
    var pista = $(".dia-pista", sec), sol = $("[data-dia-sol]", sec), ms = $$(".momento", sec), fs = $$("[data-dia-foto]", sec), linea = $(".dia-linea", sec);
    var actual = -1, pendiente = false;
    function activar(k) {
      if (k === actual) return; actual = k;
      ms.forEach(function (m, j) { m.classList.toggle("activo", j === k); });
      fs.forEach(function (f, j) { f.classList.toggle("activa", j === k); });
    }
    function paso() {
      pendiente = false;
      if (!sec.classList.contains("escena")) return;
      var r = pista.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - vh)));
      var pos = p * (ms.length - 1), k = Math.round(pos);
      activar(k);
      var a = Math.floor(pos), b = Math.min(ms.length - 1, a + 1), t = pos - a;
      var ya = ms[a].offsetTop + 6, yb = ms[b].offsetTop + 6;
      sol.style.setProperty("--sol", (ya + (yb - ya) * t).toFixed(1) + "px");
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(paso); } }
    function modo() { sec.classList.toggle("escena", mq.matches); if (!mq.matches) { ms.forEach(function (m) { m.classList.remove("activo"); }); } else { actual = -1; paso(); } }
    if (mq.addEventListener) mq.addEventListener("change", modo); else if (mq.addListener) mq.addListener(modo);
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    modo();
    if (linea) linea.style.position = "relative";
  }

  function initIndiceInst() {
    var nav = $(".indice-inst"); if (!nav || !("IntersectionObserver" in window)) return;
    var links = $$("a", nav);
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + x.target.id; a.classList.toggle("activo", on);
          if (on) { var ul = a.closest("ul"); ul.scrollTo({ left: a.offsetLeft - 20, behavior: reducido ? "auto" : "smooth" }); }
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    $$(".espacio").forEach(function (s) { io.observe(s); });
  }

  function initDiaSol() {
    var f = $("[data-diasol]"); if (!f) return;
    var fe = f.elements.fecha; fe.min = hoyISO();
    var g = sessionStorage.getItem("pasadia-fecha"); fe.value = g && g >= fe.min ? g : hoyISO();
    function pintar() { pintarFranja(f, plan(f.elements.plan.value), leerFecha(fe.value)); if (fe.value) sessionStorage.setItem("pasadia-fecha", fe.value); }
    f.addEventListener("input", pintar); f.addEventListener("change", pintar); f.addEventListener("submit", function (ev) { ev.preventDefault(); });
    var b = $("[data-abrir-armador]", f); if (b) b.addEventListener("click", function () { b.setAttribute("data-plan", f.elements.plan.value); }, true);
    pintar();
  }

  safe(initMenu, "menu");
  safe(initVideo, "video");
  safe(initPausa, "pausa");
  safe(initRevela, "revela");
  safe(initInclina, "inclina");
  safe(initArmadores, "armador");
  safe(initBuscador, "buscador");
  safe(initFiltros, "filtros");
  safe(initComparador, "comparador");
  safe(initVisor, "visor");
  safe(initGaleria, "galeria");
  safe(initTabs, "tabs");
  safe(initTraer, "traer");
  safe(initDia, "dia");
  safe(initIndiceInst, "indice");
  safe(initDiaSol, "diasol");
})();
