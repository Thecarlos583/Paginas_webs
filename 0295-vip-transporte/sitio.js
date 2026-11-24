/* Webs de traslados: todo el contenido ya viene en el HTML; esto solo agrega movimiento y herramientas. */
(function () {
  "use strict";
  function safe(fn, nombre) { try { fn(); } catch (e) { console.warn("[" + nombre + "]", e); } }
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var REDUCIDO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PC = window.matchMedia("(min-width: 1000px) and (hover: hover) and (pointer: fine)");
  var DATOS = {};
  try { DATOS = JSON.parse(($("#datos-cotizador") || {}).textContent || "{}"); } catch (e) { DATOS = {}; }
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function hoyISO() {
    var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  function fechaTexto(iso) {
    if (!iso) return "";
    var p = iso.split("-"); var y = +p[0], m = +p[1], d = +p[2];
    return d + " de " + MESES[m - 1] + (y !== new Date().getFullYear() ? " de " + y : "");
  }
  function horaTexto(h) {
    if (!h) return "";
    var p = h.split(":"); var hh = +p[0], mm = p[1] || "00";
    var suf = hh < 12 ? "a. m." : "p. m."; var h12 = hh % 12 || 12;
    return h12 + ":" + mm + " " + suf;
  }
  function plural(n, uno, varios) { return n + " " + (n === 1 ? uno : varios); }
  function dinero(v) { return (DATOS.moneda || "$") + v; }
  function zona(id) { return (DATOS.zonas || []).filter(function (z) { return z.id === id; })[0]; }
  function vehiculo(id) { return (DATOS.vehiculos || []).filter(function (v) { return v.id === id; })[0]; }
  function recomendado(n, m) {
    var lista = (DATOS.vehiculos || []).slice().sort(function (a, b) { return a.pasajeros - b.pasajeros; });
    for (var i = 0; i < lista.length; i++) if (lista[i].pasajeros >= n && lista[i].maletas >= m) return lista[i];
    return null;
  }
  function precioRuta(a, b, vid) {
    var r = (DATOS.rutas || []).filter(function (x) { return (x.desde === a && x.hasta === b) || (x.desde === b && x.hasta === a); })[0];
    return r ? r.precios[vid] : null;
  }
  function wa(msg) { return "https://wa.me/" + DATOS.whatsapp + "?text=" + encodeURIComponent(msg); }

  /* ---------------- menú, pausa, fechas, horario ---------------- */
  function initMenu() {
    var btn = $(".cab-menu"), menu = $("#menu-movil");
    if (!btn || !menu) return;
    function cerrar() {
      btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-label", "Abrir menú");
      menu.classList.remove("abierto"); document.body.classList.remove("sin-scroll");
      setTimeout(function () { if (!menu.classList.contains("abierto")) menu.hidden = true; }, 280);
    }
    btn.addEventListener("click", function () {
      if (menu.classList.contains("abierto")) return cerrar();
      menu.hidden = false; btn.setAttribute("aria-expanded", "true"); btn.setAttribute("aria-label", "Cerrar menú");
      document.body.classList.add("sin-scroll");
      requestAnimationFrame(function () { menu.classList.add("abierto"); });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("abierto")) cerrar(); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", cerrar); });
  }
  function initPausa() {
    document.addEventListener("visibilitychange", function () { document.body.classList.toggle("pausado", document.hidden); });
  }
  function initFechas() {
    var hoy = hoyISO();
    $$('input[type="date"]').forEach(function (i) { i.min = hoy; });
  }
  function initHorario() {
    var d = String(new Date().getDay());
    $$(".horario li").forEach(function (li) {
      if ((li.getAttribute("data-dias") || "").split(",").indexOf(d) > -1) li.classList.add("hoy");
    });
  }

  /* ---------------- contadores + y − ---------------- */
  function initContadores() {
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-contador] [data-paso]");
      if (!b) return;
      var inp = b.parentNode.querySelector("input");
      var v = (parseInt(inp.value, 10) || 0) + parseInt(b.getAttribute("data-paso"), 10);
      v = Math.max(+inp.min || 0, Math.min(+inp.max || 99, v));
      inp.value = v;
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    });
    document.addEventListener("change", function (e) {
      var inp = e.target;
      if (!inp.closest || !inp.closest("[data-contador]")) return;
      var v = parseInt(inp.value, 10);
      if (isNaN(v)) v = +inp.min || 0;
      inp.value = Math.max(+inp.min || 0, Math.min(+inp.max || 99, v));
    });
  }

  /* ---------------- la ruta se dibuja: un punto la recorre ---------------- */
  function initRutas() {
    $$(".mapa").forEach(function (fig) {
      var path = $(".m-ruta.m-animar", fig), movil = $(".m-movil", fig);
      if (!path || !movil || REDUCIDO || !path.getTotalLength) return;
      var largo = path.getTotalLength();
      var p0 = path.getPointAtLength(0);
      movil.setAttribute("transform", "translate(" + p0.x + " " + p0.y + ")");
      var inicio = null, DUR = 2400, ESPERA = 350, fin = false;
      function poner(t) {
        var k = 1 - Math.pow(1 - t, 3);
        var p = path.getPointAtLength(largo * k);
        movil.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")");
      }
      function paso() {
        if (fin) return;
        var t = (performance.now() - inicio - ESPERA) / DUR;
        if (t >= 1) { fin = true; poner(1); return; }
        if (t > 0) poner(t);
        requestAnimationFrame(paso);
      }
      inicio = performance.now(); requestAnimationFrame(paso);
      setTimeout(function () { if (!fin) { fin = true; poner(1); } }, ESPERA + DUR + 600);
    });
  }

  /* ---------------- flota en pista ---------------- */
  function initPista() {
    var pista = $("[data-pista]");
    if (!pista) return;
    function paso(dir) {
      var item = $(".pista-item", pista);
      pista.scrollBy({ left: dir * (item ? item.getBoundingClientRect().width + 20 : 300), behavior: "smooth" });
    }
    var a = $("[data-pista-ant]"), s = $("[data-pista-sig]");
    if (a) a.addEventListener("click", function () { paso(-1); });
    if (s) s.addEventListener("click", function () { paso(1); });
    if (!PC.matches || REDUCIDO) return;
    cargar("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js", function () {
      cargar("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js", function () {
        if (!window.gsap || !window.ScrollTrigger) return;
        gsap.registerPlugin(ScrollTrigger);
        var sec = pista.closest(".flota-sec");
        var dist = function () { return Math.max(0, pista.scrollWidth - window.innerWidth); };
        if (dist() < 40) return;
        sec.classList.add("fijada");
        gsap.to(pista, { x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      });
    });
  }
  function cargar(url, listo) {
    var s = document.createElement("script"); s.src = url; s.async = true; s.onload = listo;
    s.onerror = function () { console.warn("[gsap] no cargó", url); };
    document.head.appendChild(s);
  }

  /* ---------------- cómo funciona: la línea se dibuja ---------------- */
  function initPasos() {
    var l = $(".pasos-linea");
    if (!l || REDUCIDO || !("IntersectionObserver" in window) || !PC.matches) return;
    l.classList.add("listo");
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { l.classList.add("dibujada"); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(l);
    setTimeout(function () { l.classList.add("dibujada"); }, 9000);
  }

  /* ---------------- inclinación 3D en computadora ---------------- */
  function initInclinar() {
    if (!PC.matches || REDUCIDO) return;
    $$(".tarjeta-veh, .ruta-veh").forEach(function (t) {
      t.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        t.style.transform = "perspective(900px) rotateX(" + (-y * 4).toFixed(2) + "deg) rotateY(" + (x * 5).toFixed(2) + "deg) translateY(-4px)";
      });
      t.addEventListener("pointerleave", function () { t.style.transform = ""; });
    });
  }

  /* ---------------- filtros de la flota (en la URL) ---------------- */
  function initFiltrosFlota() {
    var caja = $("[data-filtros]");
    if (!caja) return;
    var tarjetas = $$(".resultados .tarjeta-veh"), cont = $("[data-contador-res]"), vacio = $("[data-vacio]");
    var p = $('input[name="pasajeros"]', caja), m = $('input[name="maletas"]', caja);
    var q = new URLSearchParams(location.search);
    if (q.get("pasajeros")) p.value = Math.max(1, Math.min(12, +q.get("pasajeros") || 1));
    if (q.get("maletas")) m.value = Math.max(0, Math.min(10, +q.get("maletas") || 0));
    var sv = q.get("servicio") || "";
    $$('input[name="servicio"]', caja).forEach(function (r) { r.checked = r.value === sv; });
    function aplicar() {
      var np = +p.value || 1, nm = +m.value || 0;
      var s = ($('input[name="servicio"]:checked', caja) || {}).value || "";
      var n = 0;
      tarjetas.forEach(function (t) {
        var ok = +t.getAttribute("data-pasajeros") >= np && +t.getAttribute("data-maletas") >= nm &&
          (!s || t.getAttribute("data-servicios").split(" ").indexOf(s) > -1);
        t.hidden = !ok; if (ok) n++;
      });
      cont.textContent = n === 0 ? "Ningún vehículo" : plural(n, "vehículo", "vehículos");
      vacio.hidden = n > 0;
      var u = new URLSearchParams();
      if (np > 1) u.set("pasajeros", np);
      if (nm > 0) u.set("maletas", nm);
      if (s) u.set("servicio", s);
      history.replaceState(null, "", location.pathname + (u.toString() ? "?" + u : "") + location.hash);
    }
    caja.addEventListener("input", aplicar); caja.addEventListener("change", aplicar);
    $$("[data-filtros-limpiar]").forEach(function (b) {
      b.addEventListener("click", function () {
        p.value = 1; m.value = 0;
        $$('input[name="servicio"]', caja).forEach(function (r) { r.checked = r.value === ""; });
        aplicar();
      });
    });
    var abrir = $(".filtrar-btn"), fondo = document.createElement("div");
    fondo.className = "fondo-filtros"; document.body.appendChild(fondo);
    function cerrar() { caja.classList.remove("abierto"); fondo.classList.remove("visible"); if (abrir) abrir.setAttribute("aria-expanded", "false"); }
    if (abrir) abrir.addEventListener("click", function () {
      caja.classList.add("abierto"); fondo.classList.add("visible"); abrir.setAttribute("aria-expanded", "true");
      var f = $("button, input", caja); if (f) f.focus();
    });
    fondo.addEventListener("click", cerrar);
    $$("[data-filtros-cerrar]").forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
    aplicar();
  }

  /* ---------------- comparador: marca el que le sirve ---------------- */
  function initComparador() {
    var comp = $("[data-comparador]");
    if (!comp) return;
    var inp = $('input[name="cuantos"]');
    var cols = $$(".comp-col", comp);
    function marcar() {
      var n = +inp.value || 1, elegido = null;
      cols.slice().sort(function (a, b) { return a.getAttribute("data-pasajeros") - b.getAttribute("data-pasajeros"); })
        .forEach(function (c) { if (!elegido && +c.getAttribute("data-pasajeros") >= n) elegido = c; });
      cols.forEach(function (c) {
        c.classList.toggle("recomendado", c === elegido);
        c.classList.toggle("no-cabe", +c.getAttribute("data-pasajeros") < n);
      });
      if (elegido && window.innerWidth < 1000) comp.scrollTo({ left: elegido.offsetLeft - 20, behavior: REDUCIDO ? "auto" : "smooth" });
    }
    inp.addEventListener("input", marcar);
    marcar();
  }

  /* ---------------- rutas: filtro por origen + mapa ---------------- */
  function initRutasFiltro() {
    var caja = $("[data-filtro-origen]");
    if (!caja) return;
    var filas = $$(".tablero-rutas .tablero-fila"), trs = $$(".tabla-precios tbody tr"), tarj = $$(".precio-tarjeta"), paths = $$(".mapa-rutas .m-ruta-fondo");
    var q = new URLSearchParams(location.search).get("desde") || "";
    $$("input", caja).forEach(function (r) { r.checked = r.value === q; });
    function aplicar() {
      var d = ($("input:checked", caja) || {}).value || "";
      filas.concat(trs, tarj).forEach(function (f) { f.hidden = !!d && f.getAttribute("data-desde") !== d; });
      paths.forEach(function (p) { p.classList.toggle("apagada", !!d && p.getAttribute("data-desde") !== d); p.classList.toggle("activa", !!d && p.getAttribute("data-desde") === d); });
      history.replaceState(null, "", location.pathname + (d ? "?desde=" + d : ""));
    }
    caja.addEventListener("change", aplicar);
    filas.forEach(function (f) {
      var id = (f.getAttribute("href") || "").replace(/^ruta-|\.html$/g, "");
      var p = paths.filter(function (x) { return x.getAttribute("data-ruta") === id; })[0];
      if (!p) return;
      var on = function () { p.classList.add("activa"); f.classList.add("foco"); };
      var off = function () { if (!($("input:checked", caja) || {}).value) p.classList.remove("activa"); f.classList.remove("foco"); };
      f.addEventListener("mouseenter", on); f.addEventListener("focus", on);
      f.addEventListener("mouseleave", off); f.addEventListener("blur", off);
    });
    aplicar();
  }

  /* ---------------- galería: filtros ---------------- */
  function initGaleriaFiltro() {
    var caja = $("[data-filtro-galeria]");
    if (!caja) return;
    var fotos = $$(".mosaico-foto"), cont = $("[data-contador-gal]");
    var q = new URLSearchParams(location.search).get("cat") || "";
    $$("input", caja).forEach(function (r) { r.checked = r.value === q; });
    function aplicar() {
      var c = ($("input:checked", caja) || {}).value || "", n = 0;
      fotos.forEach(function (f) { var ok = !c || f.getAttribute("data-cat") === c; f.hidden = !ok; if (ok) n++; });
      cont.textContent = plural(n, "foto", "fotos");
      history.replaceState(null, "", location.pathname + (c ? "?cat=" + c : ""));
    }
    caja.addEventListener("change", aplicar);
    aplicar();
  }

  /* ---------------- visor a pantalla completa ---------------- */
  function initVisor() {
    var v = $("#visor");
    if (!v) return;
    var imgEl = $("img", v), cap = $("figcaption", v), cuenta = $(".visor-cuenta", v);
    var lista = [], i = 0, antes = null;
    function mostrar() {
      var b = lista[i];
      imgEl.style.opacity = 0;
      imgEl.onload = function () { imgEl.style.opacity = 1; };
      imgEl.src = b.getAttribute("data-grande"); imgEl.alt = b.getAttribute("data-alt") || "";
      cap.textContent = b.getAttribute("data-alt") || "";
      cuenta.textContent = (i + 1) + " de " + lista.length;
      [lista[(i + 1) % lista.length], lista[(i - 1 + lista.length) % lista.length]].forEach(function (x) { if (x) { var im = new Image(); im.src = x.getAttribute("data-grande"); } });
    }
    function abrir(btn) {
      var cont = btn.closest("[data-galeria]") || document;
      lista = $$("[data-visor]", cont).filter(function (b) { return !b.hidden; });
      i = Math.max(0, lista.indexOf(btn)); antes = btn;
      v.hidden = false; document.body.classList.add("sin-scroll"); mostrar(); $(".visor-cerrar", v).focus();
    }
    function cerrar() { v.hidden = true; document.body.classList.remove("sin-scroll"); if (antes) antes.focus(); }
    function mover(d) { i = (i + d + lista.length) % lista.length; mostrar(); }
    document.addEventListener("click", function (e) { var b = e.target.closest("[data-visor]"); if (b) abrir(b); });
    $(".visor-cerrar", v).addEventListener("click", cerrar);
    $(".visor-ant", v).addEventListener("click", function () { mover(-1); });
    $(".visor-sig", v).addEventListener("click", function () { mover(1); });
    v.addEventListener("click", function (e) { if (e.target === v) cerrar(); });
    document.addEventListener("keydown", function (e) {
      if (v.hidden) return;
      if (e.key === "Escape") cerrar(); else if (e.key === "ArrowRight") mover(1); else if (e.key === "ArrowLeft") mover(-1);
    });
    var x0 = null;
    v.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    v.addEventListener("touchend", function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) mover(dx < 0 ? 1 : -1);
    });
  }

  /* ---------------- pestañas de políticas ---------------- */
  function initPestanas() {
    $$("[data-pestanas]").forEach(function (c) {
      var tabs = $$('[role="tab"]', c);
      function activar(t, foco) {
        tabs.forEach(function (x) {
          var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
          $("#" + x.getAttribute("aria-controls")).hidden = !on;
        });
        if (foco) t.focus();
      }
      tabs.forEach(function (t, k) {
        t.addEventListener("click", function () { activar(t); });
        t.addEventListener("keydown", function (e) {
          if (e.key === "ArrowRight") activar(tabs[(k + 1) % tabs.length], true);
          if (e.key === "ArrowLeft") activar(tabs[(k - 1 + tabs.length) % tabs.length], true);
        });
      });
    });
  }

  /* ---------------- cotizador ---------------- */
  function Cotizador(f) {
    var el = f.elements;
    var plantas = $$(".planta", f), cabe = $("[data-cabe]", f), est = $("[data-estimado]", f), aviso = $("[data-aviso]", f);
    var letrero = $("[data-letrero]", f), letNom = $("[data-letrero-nombre]", f);
    function val(n) { var x = el[n]; if (!x) return ""; if (x.length !== undefined && x.tagName !== "SELECT") { var c = Array.prototype.filter.call(x, function (r) { return r.checked; })[0]; return c ? c.value : ""; } return x.value; }
    function marcar(n, v) {
      var x = el[n]; if (!x || v === undefined || v === null || v === "") return;
      if (x.length !== undefined && x.tagName !== "SELECT") { Array.prototype.forEach.call(x, function (r) { r.checked = r.value === v; }); return; }
      if (x.tagName === "SELECT" && !$$("option", x).some(function (o) { return o.value === v; })) return;
      x.value = v;
    }
    function estado() {
      var n = Math.max(1, +val("pasajeros") || 1), m = Math.max(0, +val("maletas") || 0);
      var elegido = vehiculo(val("vehiculo")), rec = recomendado(n, m);
      return { tipo: val("tipo") || "traslado", n: n, m: m, elegido: elegido, rec: rec, veh: elegido || rec };
    }
    function pintar() {
      var s = estado();
      $$("[data-solo]", f).forEach(function (x) { x.hidden = x.getAttribute("data-solo").split(" ").indexOf(s.tipo) < 0; });
      $$("[data-texto-horas]", f).forEach(function (x) { if (!x.dataset.base) x.dataset.base = x.textContent; x.textContent = s.tipo === "horas" ? x.getAttribute("data-texto-horas") : x.dataset.base; });
      $$("[data-texto-evento]", f).forEach(function (x) { if (!x.dataset.base) x.dataset.base = x.textContent; x.textContent = s.tipo === "evento" ? x.getAttribute("data-texto-evento") : x.dataset.base; });
      $$("[data-otro]", f).forEach(function (x) { x.hidden = s.tipo !== "traslado" || val(x.getAttribute("data-otro")) !== "otro"; });
      var vuelta = $("[data-solo-vuelta]", f); if (vuelta) vuelta.hidden = val("viaje") !== "vuelta";
      var conLetrero = el.letrero && el.letrero.checked;
      var cl = $("[data-solo-letrero]", f); if (cl) cl.hidden = !conLetrero;
      if (letrero) letrero.hidden = !conLetrero;
      if (letNom) letNom.textContent = (val("nombre_letrero") || "").trim() || "Su nombre";
      // planta del vehículo
      var vis = s.veh || (DATOS.vehiculos || [])[DATOS.vehiculos.length - 1];
      plantas.forEach(function (p) {
        var on = vis && p.getAttribute("data-vehiculo") === vis.id;
        if (on && !p.classList.contains("visible")) p.classList.add("visible"); else if (!on) p.classList.remove("visible");
        if (!on) return;
        $$(".pl-asiento", p).forEach(function (a) { a.classList.toggle("lleno", +a.getAttribute("data-n") <= s.n); });
        $$(".pl-maleta", p).forEach(function (a) { a.classList.toggle("lleno", +a.getAttribute("data-n") <= s.m); });
      });
      cabe.innerHTML = "";
      if (!s.rec && !s.elegido) {
        cabe.textContent = "Para " + plural(s.n, "pasajero", "pasajeros") + " y " + plural(s.m, "maleta", "maletas") + " le armamos más de un vehículo.";
      } else if (s.elegido && (s.elegido.pasajeros < s.n || s.elegido.maletas < s.m)) {
        cabe.appendChild(document.createTextNode("En " + s.elegido.articulo + " " + s.elegido.nombre.toLowerCase() + " caben " + s.elegido.pasajeros + " pasajeros y " + s.elegido.maletas + " maletas. "));
        if (s.rec) {
          var b = document.createElement("button"); b.type = "button"; b.textContent = "Cambiar a " + s.rec.articulo + " " + s.rec.nombre.toLowerCase();
          b.addEventListener("click", function () { marcar("vehiculo", s.rec.id); pintar(); });
          cabe.appendChild(b);
        } else cabe.appendChild(document.createTextNode("Le armamos más de un vehículo."));
      } else {
        var v = s.veh, st = document.createElement("strong");
        st.textContent = v.nombre;
        if (!s.elegido) cabe.appendChild(document.createTextNode("Le recomendamos: "));
        cabe.appendChild(st);
        cabe.appendChild(document.createTextNode(". Van " + s.n + " de " + v.pasajeros + " asientos y " + s.m + " de " + v.maletas + " maletas."));
      }
      est.textContent = estimado(s).texto;
      f.classList.toggle("con-letrero", !!conLetrero);
    }
    function estimado(s) {
      var v = s.veh;
      if (!DATOS.mostrar_precios) return { texto: "Le confirmamos la tarifa" };
      if (!v || (s.elegido && (s.elegido.pasajeros < s.n || s.elegido.maletas < s.m))) return { texto: "Le confirmamos la tarifa" };
      if (s.tipo === "horas") { var h = Math.max(DATOS.minimo_horas || 1, +val("horas") || 0); return { texto: dinero(v.por_hora * h) + " por " + h + " horas", monto: v.por_hora * h }; }
      if (s.tipo === "recorrido") return { texto: dinero(v.recorrido) + " el día", monto: v.recorrido };
      if (s.tipo === "evento") return { texto: "Según el plan de viajes" };
      var a = val("desde"), b = val("hasta");
      if (!a || !b) return { texto: "Elija la ruta" };
      var p = precioRuta(a, b, v.id);
      if (p === null || p === undefined) return { texto: "Le confirmamos la tarifa" };
      var ida = val("viaje") === "vuelta";
      return { texto: dinero(ida ? p * 2 : p) + (ida ? " ida y vuelta" : " por trayecto"), monto: ida ? p * 2 : p };
    }
    function lugarTxt(campo, modo) {
      var id = val(campo);
      if (id === "otro") { var o = (val(campo + "_otro") || "").trim(); return (modo === "de" ? "de " : "a ") + o; }
      var z = zona(id); return z ? z[modo] : "";
    }
    function faltan(s) {
      var lista = [];
      function pide(n, nombre) {
        var x = el[n]; var vacio = !(val(n) || "").trim();
        var c = x && x.closest ? x.closest(".campo") : null; if (c) c.classList.toggle("falta", vacio);
        if (vacio) lista.push({ n: nombre, el: x });
      }
      $$(".falta", f).forEach(function (c) { c.classList.remove("falta"); });
      if (s.tipo === "traslado") {
        pide("desde", "desde dónde"); if (val("desde") === "otro") pide("desde_otro", "el lugar de salida");
        pide("hasta", "hasta dónde"); if (val("hasta") === "otro") pide("hasta_otro", "el lugar de llegada");
      }
      pide("fecha", "la fecha");
      if (s.tipo === "traslado" || s.tipo === "horas") pide("hora", "la hora");
      if (el.letrero && el.letrero.checked) pide("nombre_letrero", "el nombre del letrero");
      return lista;
    }
    function mensaje(s) {
      var saludo = DATOS.saludo || "Hola", fecha = fechaTexto(val("fecha")), hora = horaTexto(val("hora"));
      var pax = plural(s.n, "pasajero", "pasajeros") + " y " + plural(s.m, "maleta", "maletas"), t;
      if (s.tipo === "traslado") {
        var vuelo = (val("vuelo") || "").trim();
        var esFerry = val("desde") === "punta-de-piedras" || val("hasta") === "punta-de-piedras";
        t = saludo + ", quiero cotizar un traslado: " + lugarTxt("desde", "de") + " " + lugarTxt("hasta", "a") + ", el " + fecha + " a las " + hora + ", " + pax +
          (vuelo ? ", " + (esFerry ? "ferry " : "vuelo ") + vuelo : "") + ".";
        if (val("viaje") === "vuelta") {
          var f2 = val("fecha_regreso"), h2 = val("hora_regreso");
          t += f2 ? " Con regreso el " + fechaTexto(f2) + (h2 ? " a las " + horaTexto(h2) : ".") : " Con regreso (le confirmo la fecha).";
        }
      } else if (s.tipo === "horas") {
        var h = Math.max(DATOS.minimo_horas || 1, +val("horas") || 0);
        t = saludo + ", quiero cotizar el servicio por horas: el " + fecha + " desde las " + hora + ", " + h + " horas, " + pax + ".";
      } else {
        var det = (val("detalle") || "").trim();
        t = saludo + (s.tipo === "evento" ? ", quiero cotizar el transporte para un evento: el " : ", quiero cotizar un recorrido por la isla: el ") + fecha + ", " + pax + "." + (det ? " " + det.replace(/\.?$/, ".") : "");
      }
      t += s.elegido ? " Vehículo: " + s.elegido.nombre.toLowerCase() + "." : " Vehículo: que me recomienden.";
      var extras = $$('input[name="extra"]:checked', f).map(function (x) { return x.value; });
      if (extras.length) t += " Además: " + extras.join(" y ") + ".";
      if (el.letrero && el.letrero.checked) t += " Letrero con el nombre: " + val("nombre_letrero").trim() + ".";
      var notas = (val("notas") || "").trim(); if (notas) t += " Nota: " + notas.replace(/\.?$/, ".");
      var es = estimado(s); if (es.monto) t += " Vi un estimado de " + dinero(es.monto) + " en la página.";
      return t;
    }
    f.addEventListener("input", function (e) {
      pintar();
      if (e.target.name === "nombre_letrero" && letrero) { letrero.classList.remove("cambio"); void letrero.offsetWidth; letrero.classList.add("cambio"); }
      if (e.target.closest(".falta") && (e.target.value || "").trim()) e.target.closest(".falta").classList.remove("falta");
    });
    f.addEventListener("change", pintar);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var s = estado(), falta = faltan(s);
      if (falta.length) {
        var nombres = falta.map(function (x) { return x.n; });
        var txt = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : nombres[0];
        aviso.textContent = "Para cotizar nos falta " + txt + ".";
        aviso.hidden = false;
        if (falta[0].el && falta[0].el.focus) falta[0].el.focus();
        return;
      }
      aviso.hidden = true;
      window.open(wa(mensaje(s)), "_blank", "noopener");
    });
    this.aplicar = function (pre) {
      ["tipo", "desde", "hasta", "fecha", "hora", "vehiculo", "pasajeros", "maletas"].forEach(function (k) {
        if (pre[k] === undefined || pre[k] === null || pre[k] === "") return;
        if (k === "fecha" && pre[k] < hoyISO()) return;
        marcar(k, String(pre[k]));
      });
      aviso.hidden = true; pintar();
    };
    pintar();
  }

  function initCotizadores() {
    var instancias = [];
    $$("form[data-cotizador]").forEach(function (f) { instancias.push({ f: f, c: new Cotizador(f) }); });
    if (!instancias.length) return;
    var q = new URLSearchParams(location.search), pre = {};
    q.forEach(function (v, k) { pre[k] = v; });
    var enPagina = instancias.filter(function (x) { return !x.f.closest(".hoja"); })[0];
    if (enPagina && Object.keys(pre).length) enPagina.c.aplicar(pre);
    var hoja = $("#hoja"), enHoja = instancias.filter(function (x) { return x.f.closest(".hoja"); })[0], antes = null;
    function cerrar() {
      if (!hoja || hoja.hidden) return;
      hoja.classList.remove("abierta"); document.body.classList.remove("sin-scroll");
      setTimeout(function () { hoja.hidden = true; }, 380);
      if (antes) antes.focus();
    }
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-cotizar]");
      if (!t) return;
      var d = { tipo: t.dataset.tipo, desde: t.dataset.desde, hasta: t.dataset.hasta, vehiculo: t.dataset.vehiculo };
      if (hoja && enHoja) {
        e.preventDefault(); antes = t;
        enHoja.c.aplicar(d);
        hoja.hidden = false; document.body.classList.add("sin-scroll");
        requestAnimationFrame(function () { hoja.classList.add("abierta"); });
        setTimeout(function () { var x = $(".hoja-cerrar", hoja); if (x) x.focus(); }, 60);
      } else if (enPagina) {
        e.preventDefault();
        enPagina.c.aplicar(d);
        enPagina.f.scrollIntoView({ behavior: REDUCIDO ? "auto" : "smooth", block: "start" });
      }
    });
    if (hoja) {
      $$("[data-cerrar]", hoja).forEach(function (b) { b.addEventListener("click", cerrar); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
    }
  }

  /* ---------------- formulario de empresas ---------------- */
  function initEmpresa() {
    var f = $("[data-form-empresa]");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var el = f.elements, av = $("[data-aviso]", f), faltan = [];
      [["empresa", "el nombre de la empresa"], ["contacto", "la persona de contacto"]].forEach(function (p) {
        var vacio = !el[p[0]].value.trim(); el[p[0]].closest(".campo").classList.toggle("falta", vacio); if (vacio) faltan.push(p[1]);
      });
      if (faltan.length) { av.textContent = "Nos falta " + faltan.join(" y ") + "."; av.hidden = false; el[faltan.length && !el.empresa.value.trim() ? "empresa" : "contacto"].focus(); return; }
      av.hidden = true;
      var tipo = (f.querySelector('input[name="tipo"]:checked') || {}).value || "empresa";
      var t = (DATOS.saludo || "Hola") + ", quiero un convenio de traslados para " + el.empresa.value.trim() + " (" + tipo + "). Soy " + el.contacto.value.trim() +
        ". Hacemos " + el.cantidad.value.toLowerCase() + " traslados al mes." + (el.rutas.value.trim() ? " Rutas que más usamos: " + el.rutas.value.trim() + "." : "");
      window.open(wa(t), "_blank", "noopener");
    });
  }

  safe(initMenu, "menu");
  safe(initPausa, "pausa");
  safe(initFechas, "fechas");
  safe(initHorario, "horario");
  safe(initContadores, "contadores");
  safe(initRutas, "ruta");
  safe(initPista, "pista");
  safe(initPasos, "pasos");
  safe(initInclinar, "inclinar");
  safe(initFiltrosFlota, "filtros");
  safe(initComparador, "comparador");
  safe(initRutasFiltro, "rutas");
  safe(initGaleriaFiltro, "galeria");
  safe(initVisor, "visor");
  safe(initPestanas, "pestanas");
  safe(initCotizadores, "cotizador");
  safe(initEmpresa, "empresa");
})();
