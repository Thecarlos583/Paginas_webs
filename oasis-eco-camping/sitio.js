/* Oasis Eco Camping & Spa · sitio.js (lo copia _generadores/oasis.py). JS clásico: el contenido ya está en el HTML. */
(function () {
  "use strict";
  function safe(fn, nombre) { try { fn(); } catch (err) { if (window.console) console.warn("[Oasis " + nombre + "]", err); } }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REDUCIDO = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINO = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var D = {};
  try { D = JSON.parse(($("#datos-oasis") || {}).textContent || "{}"); } catch (e) { D = {}; }
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var Q = new URLSearchParams(location.search);

  function hoyISO(dias) {
    var d = new Date(); d.setDate(d.getDate() + (dias || 0));
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function leerFecha(v) { if (!v) return null; var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function sumarDias(v, n) { var d = leerFecha(v); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dinero(n) { return (D.moneda || "$") + (Math.round(n * 100) / 100); }
  function forma(id) { return (D.formas || []).filter(function (f) { return f.id === id; })[0]; }
  function waURL(msg) { return "https://wa.me/" + (D.wa || "580000000000") + "?text=" + encodeURIComponent(msg); }
  function observar(els, fn, margen) {
    if (!("IntersectionObserver" in window)) { els.forEach(fn); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { fn(en.target); io.unobserve(en.target); } });
    }, { rootMargin: margen || "0px 0px -8% 0px", threshold: 0.01 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- cabecera y menú */
  function initCabecera() {
    var cab = $("[data-cabecera]"); if (!cab) return;
    var f = function () { cab.classList.toggle("con-borde", window.scrollY > 8); };
    f(); window.addEventListener("scroll", f, { passive: true });
  }
  function initMenu() {
    var btn = $("[data-menu]"), menu = $("#menu-tel"); if (!btn || !menu) return;
    function abrir() { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); document.body.classList.add("menu-abierto"); var a = $("a", menu); if (a) a.focus(); }
    function cerrar() { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-abierto"); btn.focus(); }
    btn.addEventListener("click", abrir);
    $$("[data-menu-cerrar]", menu).forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !menu.hidden) cerrar(); });
  }

  /* ---------- portada: video solo en computadora y sin ahorro de datos */
  function initVideo() {
    var v = $(".portada-video"); if (!v) return;
    var con = navigator.connection || {};
    if (REDUCIDO || con.saveData || !matchMedia("(min-width: 900px)").matches) return;
    v.src = v.getAttribute("data-video");
    v.addEventListener("playing", function () { v.classList.add("lista"); });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    document.addEventListener("visibilitychange", function () { if (document.hidden) v.pause(); else v.play().catch(function () {}); });
    var b = $(".portada .btn-brillo"); if (b) setTimeout(function () { b.classList.add("destello"); }, 900);
  }

  /* ---------- curvas que se dibujan y fotos que se aclaran */
  function initCurvas() {
    var cs = $$("svg.divisor");
    cs.forEach(function (c) { c.setAttribute("data-dibujar", ""); });
    observar(cs, function (c) { c.classList.add("visible"); }, "0px 0px -12% 0px");
    setTimeout(function () { cs.forEach(function (c) { c.classList.add("visible"); }); }, 6000);
  }
  function initRevela() {
    if (REDUCIDO) return;
    var alto = window.innerHeight;
    var rs = $$(".revela").filter(function (r) { return r.getBoundingClientRect().top > alto * 0.9; });
    rs.forEach(function (r) { r.classList.add("listo"); });
    observar(rs, function (r) { r.classList.add("visible"); }, "0px 0px -10% 0px");
    setTimeout(function () { rs.forEach(function (r) { r.classList.add("visible"); }); }, 6000);
  }

  /* ---------- armador de escapada */
  function plural(n, uno, varios) { return n + " " + (n === 1 ? uno : varios); }
  function lista(arr) { return arr.length < 2 ? arr.join("") : arr.slice(0, -1).join(", ") + " y " + arr[arr.length - 1]; }
  function textoFechas(llegada, salida, noches) {
    var a = leerFecha(llegada);
    if (!noches) return "el " + a.getDate() + " de " + MESES[a.getMonth()];
    var b = leerFecha(salida);
    var n = Math.round((b - a) / 86400000);
    var r = a.getMonth() === b.getMonth()
      ? "del " + a.getDate() + " al " + b.getDate() + " de " + MESES[b.getMonth()]
      : "del " + a.getDate() + " de " + MESES[a.getMonth()] + " al " + b.getDate() + " de " + MESES[b.getMonth()];
    return r + " (" + plural(n, "noche", "noches") + ")";
  }

  function initArmador(form) {
    if (form.dataset.listo) return; form.dataset.listo = "1";
    var llegada = form.elements.llegada, salida = form.elements.salida;
    var etqLlegada = $("[data-etq-llegada]", form), cajaSalida = $("[data-solo-noches]", form);
    var cajaCarpa = $("[data-solo-parcela]", form), notasN = $("[data-noches]", form), aviso = $("[data-aviso]", form);
    var estimado = $("[data-estimado]", form);
    var hoy = hoyISO(0);
    llegada.min = hoy; salida.min = hoyISO(1);
    function formaSel() { var r = $("input[name$='-forma']:checked", form); return r ? forma(r.value) : null; }
    function valor(nombre) { return parseInt(form.elements[nombre].value, 10) || 0; }
    function personas() { return valor("adultos") + valor("ninos"); }
    function poner(nombre, n) {
      var c = $("[data-contador='" + nombre + "']", form);
      form.elements[nombre].value = n; $("[data-valor]", c).textContent = n;
    }
    function topes() {
      var f = formaSel(), cap = f ? f.capacidad : 20;
      $$("[data-contador]", form).forEach(function (c) {
        var nombre = c.getAttribute("data-contador"), min = +c.getAttribute("data-min"), v = valor(nombre);
        $("[data-menos]", c).disabled = v <= min;
        $("[data-mas]", c).disabled = personas() >= cap;
      });
    }
    function avisar(t, bien) { aviso.textContent = t || ""; aviso.classList.toggle("bien", !!bien); }
    function actualizar() {
      var f = formaSel();
      var conNoches = !f || f.noches;
      cajaSalida.hidden = !conNoches;
      etqLlegada.textContent = conNoches ? "Llegada" : "Fecha";
      cajaCarpa.hidden = !(f && f.id === "parcela");
      if (llegada.value) {
        salida.min = sumarDias(llegada.value, 1);
        if (salida.value && salida.value <= llegada.value) salida.value = "";
      }
      if (f && personas() > f.capacidad) {
        var sobra = personas() - f.capacidad;
        var n = Math.max(0, valor("ninos") - sobra); sobra -= valor("ninos") - n; poner("ninos", n);
        if (sobra > 0) poner("adultos", Math.max(1, valor("adultos") - sobra));
        avisar("Para " + f.corto + " el máximo es " + f.capacidad + " personas. Si son más, cuéntenoslo en las notas.");
      }
      var noches = 0;
      if (conNoches && llegada.value && salida.value) noches = Math.round((leerFecha(salida.value) - leerFecha(llegada.value)) / 86400000);
      notasN.textContent = noches > 0 ? plural(noches, "noche", "noches") : (f && !f.noches && llegada.value ? "Un solo día, de entrada y salida" : "");
      topes(); pintarEstimado(f, noches);
    }
    function spaSel() { return $$("input[name='spa']:checked", form).map(function (c) { return (D.spa || []).filter(function (s) { return s.id === c.value; })[0]; }).filter(Boolean); }
    function pintarEstimado(f, noches) {
      if (!estimado || !D.precios) return;
      var spa = spaSel();
      var listo = f && llegada.value && (f.noches ? noches > 0 : true);
      if (!listo && !spa.length) { estimado.innerHTML = '<p class="arm-estimado-vacio">El estimado aparece al elegir la forma, las fechas y las personas.</p>'; return; }
      var filas = [], total = 0;
      if (listo) {
        var p = personas(), sub = f.precio * p * (f.noches ? noches : 1);
        total += sub;
        filas.push([f.nombre + ", " + (f.noches ? plural(noches, "noche", "noches") + " para " : "") + plural(p, "persona", "personas"), sub]);
      }
      spa.forEach(function (s) { total += s.precio; filas.push([s.nombre, s.precio]); });
      var ul = document.createElement("ul");
      filas.forEach(function (fl) { var li = document.createElement("li"); var a = document.createElement("span"); a.textContent = fl[0]; var b = document.createElement("span"); b.textContent = dinero(fl[1]); li.appendChild(a); li.appendChild(b); ul.appendChild(li); });
      var t = document.createElement("li"); t.className = "total"; t.innerHTML = "<span>Total estimado</span><strong></strong>"; t.lastChild.textContent = dinero(total); ul.appendChild(t);
      estimado.innerHTML = ""; estimado.appendChild(ul);
      var s = document.createElement("small"); s.textContent = "Estimado con precios de ejemplo" + (spa.length ? " (spa por servicio, una persona)" : "") + "."; estimado.appendChild(s);
    }
    $$("[data-contador]", form).forEach(function (c) {
      var nombre = c.getAttribute("data-contador"), min = +c.getAttribute("data-min");
      $("[data-menos]", c).addEventListener("click", function () { poner(nombre, Math.max(min, valor(nombre) - 1)); avisar(""); actualizar(); });
      $("[data-mas]", c).addEventListener("click", function () {
        var f = formaSel(); if (f && personas() >= f.capacidad) { avisar("Para " + f.corto + " el máximo es " + f.capacidad + " personas."); return; }
        poner(nombre, valor(nombre) + 1); avisar(""); actualizar();
      });
    });
    form.addEventListener("change", function () { avisar(""); actualizar(); });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = formaSel();
      if (!f) { avisar("Elija la forma de hospedaje: parcela, carpa equipada o pasadía."); return; }
      if (!llegada.value) { avisar(f.noches ? "Indique la fecha de llegada." : "Indique la fecha de su pasadía."); llegada.focus(); return; }
      if (llegada.value < hoy) { avisar("Esa fecha ya pasó. Elija una de hoy en adelante."); llegada.focus(); return; }
      if (f.noches && !salida.value) { avisar("Indique la fecha de salida."); salida.focus(); return; }
      if (f.noches && salida.value <= llegada.value) { avisar("La salida tiene que ser después de la llegada."); salida.focus(); return; }
      var carpa = $("input[name$='-carpa']:checked", form);
      if (f.id === "parcela" && !carpa) { avisar("Cuéntenos si trae su propia carpa."); return; }
      var gente = [plural(valor("adultos"), "adulto", "adultos")];
      if (valor("ninos")) gente.push(plural(valor("ninos"), "niño", "niños"));
      var msg = "Hola " + (D.nombre || "Oasis Eco Camping & Spa") + ", quiero reservar: " + f.nombre + ", " +
        textoFechas(llegada.value, salida.value, f.noches) + ", " + lista(gente);
      var spa = spaSel().map(function (s) { return s.nombre_msj; });
      if (spa.length) msg += ", con " + lista(spa);
      msg += ".";
      if (f.id === "parcela") msg += carpa.value === "si" ? " Traigo mi propia carpa." : " No tengo carpa propia, ¿qué me recomiendan?";
      var notas = (form.elements.notas.value || "").replace(/\s+/g, " ").trim();
      if (notas) msg += " Además: " + notas;
      avisar("Listo. Se abre WhatsApp con su mensaje.", true);
      var w = window.open(waURL(msg), "_blank", "noopener");
      if (!w) location.href = waURL(msg);
    });
    form.armador = {
      prellenar: function (o) {
        if (o.forma) { var r = $("input[name$='-forma'][value='" + o.forma + "']", form); if (r) r.checked = true; }
        if (o.fecha && o.fecha >= hoy) { llegada.value = o.fecha; var f = formaSel(); if (f && f.noches && !salida.value) salida.value = sumarDias(o.fecha, 1); }
        if (o.personas) { poner("adultos", Math.max(1, Math.min(20, o.personas))); poner("ninos", 0); }
        actualizar();
      }
    };
    actualizar();
  }
  function initArmadores() {
    $$("[data-armador]").forEach(initArmador);
    var o = { forma: Q.get("forma") || "", fecha: Q.get("fecha") || "", personas: parseInt(Q.get("personas"), 10) || 0 };
    if (o.forma === "glamping") o.forma = "";
    if (o.forma || o.fecha || o.personas) {
      $$("[data-armador]").forEach(function (f) {
        if (f.closest(".hoja")) return;
        var fija = f.querySelector(".arm-forma[hidden]");
        f.armador.prellenar(fija ? { fecha: o.fecha, personas: o.personas } : o);
      });
    }
  }

  /* ---------- hoja del armador (teléfono) / modal (computadora) */
  function initHoja() {
    var hoja = $("#hoja-armador"); if (!hoja) return;
    var panel = $(".hoja-panel", hoja), form = $("[data-armador]", hoja), previo = null;
    function abrir(formaId) {
      previo = document.activeElement;
      hoja.hidden = false; document.body.classList.add("menu-abierto");
      if (form && form.armador) form.armador.prellenar({ forma: formaId || "", fecha: Q.get("fecha") || "", personas: parseInt(Q.get("personas"), 10) || 0 });
      requestAnimationFrame(function () { requestAnimationFrame(function () { hoja.classList.add("abierta"); }); });
      setTimeout(function () { var x = $(".hoja-x", hoja); if (x) x.focus(); }, 60);
    }
    function cerrar() {
      hoja.classList.remove("abierta"); document.body.classList.remove("menu-abierto");
      setTimeout(function () { hoja.hidden = true; if (previo) previo.focus(); }, REDUCIDO ? 0 : 420);
    }
    document.addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-abrir-armador]");
      if (t) { ev.preventDefault(); abrir(t.getAttribute("data-abrir-armador")); }
    });
    $$("[data-hoja-cerrar]", hoja).forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !hoja.hidden) cerrar(); });
    // deslizar hacia abajo para cerrar en el teléfono
    var y0 = null;
    panel.addEventListener("touchstart", function (ev) { y0 = panel.scrollTop <= 0 ? ev.touches[0].clientY : null; }, { passive: true });
    panel.addEventListener("touchend", function (ev) { if (y0 !== null && ev.changedTouches[0].clientY - y0 > 90) cerrar(); y0 = null; });
  }

  /* ---------- buscador rápido de la portada */
  function initBuscador() {
    var b = $("[data-buscador]"); if (!b) return;
    b.elements.fecha.min = hoyISO(0);
    b.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var p = new URLSearchParams();
      ["forma", "fecha", "personas"].forEach(function (k) { if (b.elements[k].value) p.set(k, b.elements[k].value); });
      location.href = "acampar.html" + (p.toString() ? "?" + p : "") + "#t-cat";
    });
  }

  /* ---------- catálogo con filtros en la URL */
  function initFiltros() {
    var form = $("[data-filtros]"); if (!form) return;
    var tarjetas = $$(".cat-lista .tarjeta"), cuenta = $("[data-cuenta]"), vacio = $("[data-vacio]");
    var abrirB = $("[data-filtros-abrir]");
    var f = Q.get("forma") || "", per = Q.get("personas") || "", carpa = Q.get("carpa") === "1", fecha = Q.get("fecha") || "";
    var r = $("input[name='forma'][value='" + f + "']", form); if (r) r.checked = true;
    if (per && $("option[value='" + per + "']", form.elements.personas)) form.elements.personas.value = per;
    form.elements.carpa.checked = carpa; form.elements.fecha.value = fecha;
    function aplicar(guardar) {
      var fs = ($("input[name='forma']:checked", form) || {}).value || "";
      var ps = parseInt(form.elements.personas.value, 10) || 0, cp = form.elements.carpa.checked, n = 0;
      tarjetas.forEach(function (t) {
        var ok = (!fs || t.dataset.forma === fs) && (!ps || +t.dataset.capacidad >= ps) && (!cp || t.dataset.carpa === "1");
        t.hidden = !ok; if (ok) n++;
      });
      cuenta.textContent = n === 1 ? "1 opción" : n + " opciones";
      vacio.hidden = n > 0;
      var ver = $(".filtros-ver", form); if (ver) ver.textContent = n === 1 ? "Ver 1 opción" : "Ver " + n + " opciones";
      var p = new URLSearchParams();
      if (fs) p.set("forma", fs); if (ps) p.set("personas", ps); if (cp) p.set("carpa", "1"); if (form.elements.fecha.value) p.set("fecha", form.elements.fecha.value);
      if (guardar !== false) history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
      // los enlaces a las fichas llevan la fecha y las personas
      var extra = new URLSearchParams(); if (form.elements.fecha.value) extra.set("fecha", form.elements.fecha.value); if (ps) extra.set("personas", ps);
      $$("a[data-con-filtros]").forEach(function (a) { a.href = a.getAttribute("href").split("?")[0] + (extra.toString() ? "?" + extra : ""); });
    }
    form.addEventListener("change", function () { aplicar(); });
    form.addEventListener("submit", function (ev) { ev.preventDefault(); });
    $$("[data-filtros-limpiar]").forEach(function (b) {
      b.addEventListener("click", function () { form.reset(); $("input[name='forma'][value='']", form).checked = true; form.elements.fecha.value = ""; aplicar(); });
    });
    function abrir() { form.classList.add("abierto"); abrirB.setAttribute("aria-expanded", "true"); var x = $(".filtros-x", form); if (x) x.focus(); }
    function cerrar() { form.classList.remove("abierto"); abrirB.setAttribute("aria-expanded", "false"); }
    if (abrirB) abrirB.addEventListener("click", abrir);
    $$("[data-filtros-cerrar]", form).forEach(function (b) { b.addEventListener("click", function () { cerrar(); abrirB.focus(); }); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && form.classList.contains("abierto")) cerrar(); });
    aplicar(false);
  }

  /* ---------- comparador */
  function initComparador() {
    var c = $("[data-comparador]"); if (!c) return;
    var tabs = $$("[data-comp]", c), ind = $(".comp-indicador", c);
    function mover(b) { if (!ind || !b) return; ind.style.width = b.offsetWidth + "px"; ind.style.transform = "translateX(" + b.offsetLeft + "px)"; }
    function activar(id, desplazar) {
      c.dataset.activo = id;
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t.dataset.comp === id ? "true" : "false"); });
      $$("[data-col]", c).forEach(function (el) { el.classList.toggle("resaltada", el.dataset.col === id); });
      mover(tabs.filter(function (t) { return t.dataset.comp === id; })[0]);
      if (desplazar) {
        var card = $(".comp-tarjeta[data-col='" + id + "']", c), car = $(".comp-carrusel", c);
        if (card && car && car.offsetParent) car.scrollTo({ left: card.offsetLeft - car.offsetLeft, behavior: REDUCIDO ? "auto" : "smooth" });
      }
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { activar(t.dataset.comp, true); }); });
    activar(c.dataset.activo, false);
    window.addEventListener("resize", function () { mover($("[aria-selected='true']", c)); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { mover($("[aria-selected='true']", c)); });
  }

  /* ---------- visor de fotos */
  function initVisor() {
    var v = $("#visor"); if (!v) return;
    var im = $("[data-visor-img]", v), pie = $("[data-visor-pie]", v), cuenta = $("[data-visor-cuenta]", v);
    var lista = [], i = 0, previo = null;
    function mostrar(n) {
      i = (n + lista.length) % lista.length;
      var b = lista[i]; im.style.opacity = "0";
      im.onload = function () { im.style.opacity = "1"; };
      im.src = b.getAttribute("data-grande"); im.alt = b.getAttribute("data-pie") || "";
      pie.textContent = b.getAttribute("data-pie") || ""; cuenta.textContent = (i + 1) + " de " + lista.length;
    }
    function cerrar() { v.hidden = true; document.body.classList.remove("menu-abierto"); if (previo) previo.focus(); }
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-visor]"); if (!b) return;
      var grupo = b.closest("[data-visor-grupo]");
      lista = $$("[data-visor]", grupo || document).filter(function (x) { return !x.closest("[hidden]"); });
      previo = b; v.hidden = false; document.body.classList.add("menu-abierto");
      mostrar(lista.indexOf(b)); $("[data-visor-cerrar]", v).focus();
    });
    $("[data-visor-ant]", v).addEventListener("click", function () { mostrar(i - 1); });
    $("[data-visor-sig]", v).addEventListener("click", function () { mostrar(i + 1); });
    $("[data-visor-cerrar]", v).addEventListener("click", cerrar);
    v.addEventListener("click", function (ev) { if (ev.target === v) cerrar(); });
    document.addEventListener("keydown", function (ev) {
      if (v.hidden) return;
      if (ev.key === "Escape") cerrar(); else if (ev.key === "ArrowLeft") mostrar(i - 1); else if (ev.key === "ArrowRight") mostrar(i + 1);
    });
    var x0 = null;
    v.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    v.addEventListener("touchend", function (ev) { if (x0 === null) return; var dx = ev.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) mostrar(i + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* ---------- filtros de la galería */
  function initGaleria() {
    var bs = $$("[data-cat-filtro]"); if (!bs.length) return;
    var items = $$(".mosaico-todo li");
    bs.forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.getAttribute("data-cat-filtro");
        bs.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        items.forEach(function (li) { li.hidden = !!c && li.getAttribute("data-cat") !== c; });
      });
    });
  }

  /* ---------- pestañas de normas */
  function initPestanas() {
    $$("[data-pestanas]").forEach(function (p) {
      var tabs = $$("[role='tab']", p), panels = $$("[role='tabpanel']", p);
      function sel(t, foco) {
        tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on ? "true" : "false"); x.tabIndex = on ? 0 : -1; });
        panels.forEach(function (pn) { pn.hidden = pn.id !== t.getAttribute("aria-controls"); });
        if (foco) t.focus();
      }
      tabs.forEach(function (t, k) {
        t.addEventListener("click", function () { sel(t); });
        t.addEventListener("keydown", function (ev) {
          if (ev.key === "ArrowRight") sel(tabs[(k + 1) % tabs.length], true);
          if (ev.key === "ArrowLeft") sel(tabs[(k - 1 + tabs.length) % tabs.length], true);
        });
      });
      sel(tabs[0]);
    });
  }

  /* ---------- la mochila (novedad): se guarda en el teléfono y dibuja el sendero */
  function initMochila() {
    var m = $("#mochila"); if (!m) return;
    var cs = $$("[data-mochila]", m), cuenta = $("[data-mochila-cuenta]", m), camino = $("[data-sendero]", m);
    var CLAVE = "oasis-mochila";
    var guardado = [];
    try { guardado = JSON.parse(localStorage.getItem(CLAVE) || "[]"); } catch (e) { guardado = []; }
    cs.forEach(function (c) { c.checked = guardado.indexOf(c.value) > -1; });
    function pintar() {
      var n = cs.filter(function (c) { return c.checked; }).length;
      cuenta.textContent = n === cs.length ? "¡Mochila lista! " + n + " de " + cs.length : n + " de " + cs.length + " listos";
      if (camino) camino.style.strokeDashoffset = String(1 - n / cs.length);
      m.classList.toggle("completa", n === cs.length);
      try { localStorage.setItem(CLAVE, JSON.stringify(cs.filter(function (c) { return c.checked; }).map(function (c) { return c.value; }))); } catch (e) {}
    }
    cs.forEach(function (c) { c.addEventListener("change", pintar); });
    var borrar = $("[data-mochila-borrar]", m);
    if (borrar) borrar.addEventListener("click", function () { cs.forEach(function (c) { c.checked = false; }); pintar(); });
    pintar();
  }

  /* ---------- escena firma: de la tarde a las estrellas */
  function initCielo() {
    var s = $(".cielo"); if (!s || !("IntersectionObserver" in window)) return;
    var pasos = $$(".paso", s), fotos = $$(".cielo-foto", s);
    if (!matchMedia("(min-width: 1100px)").matches) return; // en el teléfono cada momento ya trae su color
    function activar(p) {
      pasos.forEach(function (x) { x.classList.toggle("activo", x === p); });
      s.setAttribute("data-cielo", p.getAttribute("data-cielo"));
      var i = p.getAttribute("data-i");
      fotos.forEach(function (f) { f.classList.toggle("activa", f.getAttribute("data-i") === i); });
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) activar(en.target); });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    pasos.forEach(function (p) { io.observe(p); });
    activar(pasos[0]);
  }

  /* ---------- galería horizontal de formas de hospedaje (solo computadora, GSAP por CDN) */
  function cargar(url, cb) { var sc = document.createElement("script"); sc.src = url; sc.async = true; sc.onload = cb; document.head.appendChild(sc); }
  function initHorizontal() {
    var sec = $("[data-horizontal]"); if (!sec || REDUCIDO || !FINO) return;
    var mq = matchMedia("(min-width: 1100px) and (min-height: 700px)"); if (!mq.matches) return;
    cargar("https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js", function () {
      cargar("https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js", function () {
        if (!window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);
        sec.classList.add("horizontal");
        var pista = $(".formas-pista", sec), fijo = $(".formas-fijo", sec);
        var dist = function () { return Math.max(0, pista.scrollWidth - window.innerWidth); };
        gsap.to(pista, {
          x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: fijo, pin: true, start: "top top", end: function () { return "+=" + dist(); }, scrub: 0.6, invalidateOnRefresh: true }
        });
        ScrollTrigger.refresh();
      });
    });
  }

  /* ---------- tarjetas: inclinación leve con mouse y borde turquesa al tocar */
  function initTarjetas() {
    $$("[data-tilt]").forEach(function (t) {
      t.addEventListener("touchstart", function () { $$(".tarjeta.tocada").forEach(function (x) { x.classList.remove("tocada"); }); t.classList.add("tocada"); }, { passive: true });
      if (!FINO || REDUCIDO) return;
      t.addEventListener("mousemove", function (ev) {
        if (t.closest(".horizontal")) return;
        var r = t.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5;
        t.style.transform = "translateY(-6px) perspective(900px) rotateX(" + (-y * 4).toFixed(2) + "deg) rotateY(" + (x * 5).toFixed(2) + "deg)";
      });
      t.addEventListener("mouseleave", function () { t.style.transform = ""; });
    });
  }

  function initPausa() { document.addEventListener("visibilitychange", function () { document.body.classList.toggle("pausado", document.hidden); }); }

  safe(initCabecera, "cabecera"); safe(initMenu, "menú"); safe(initVideo, "video");
  safe(initCurvas, "curvas"); safe(initRevela, "revela"); safe(initArmadores, "armador"); safe(initHoja, "hoja");
  safe(initBuscador, "buscador"); safe(initFiltros, "filtros"); safe(initComparador, "comparador");
  safe(initVisor, "visor"); safe(initGaleria, "galería"); safe(initPestanas, "pestañas"); safe(initMochila, "mochila");
  safe(initCielo, "cielo"); safe(initHorizontal, "horizontal"); safe(initTarjetas, "tarjetas"); safe(initPausa, "pausa");
})();
