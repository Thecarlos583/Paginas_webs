(function () {
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = document.body.getAttribute("data-wa") || "https://wa.me/580000000000";
  function safe(fn, nombre) { try { fn(); } catch (e) { console.warn("[" + nombre + "]", e); } }
  function lim(v, a, b) { return v < a ? a : v > b ? b : v; }
  function q(s, c) { return (c || document).querySelector(s); }
  function qa(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function enlaceWA(msg) { return WA + "?text=" + encodeURIComponent(msg); }

  /* Menú del teléfono */
  function initMenu() {
    var btn = q(".hamburguesa"), menu = q("#menu"), cab = q("#cabecera");
    if (!btn || !menu) return;
    function poner(abrir) {
      btn.setAttribute("aria-expanded", abrir ? "true" : "false");
      btn.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
      menu.classList.toggle("abierto", abrir);
      cab.classList.toggle("menu-visible", abrir);
      document.body.classList.toggle("menu-abierto", abrir);
    }
    btn.addEventListener("click", function () { poner(btn.getAttribute("aria-expanded") !== "true"); });
    qa("a", menu).forEach(function (a) { a.addEventListener("click", function () { poner(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") poner(false); });
  }

  /* Cabecera sobre la portada: se vuelve sólida al bajar */
  function initCabecera() {
    var cab = q("#cabecera");
    if (!cab || !cab.classList.contains("sobre-portada")) return;
    var pend = false;
    function revisar() { pend = false; cab.classList.toggle("sobre-portada", window.scrollY <= 60); }
    window.addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(revisar); } }, { passive: true });
    revisar();
  }

  /* Video de portada: solo en computadora, con buena conexión y sin "reducir movimiento" */
  function initVideo() {
    var v = q("#video-portada");
    if (!v) return;
    var con = navigator.connection || {};
    var lenta = con.saveData || /(^|-)2g|3g/.test(con.effectiveType || "");
    if (reducido || lenta || !window.matchMedia("(min-width: 900px)").matches) return;
    v.addEventListener("playing", function () { v.classList.add("listo"); }, { once: true });
    v.src = v.getAttribute("data-video");
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    document.addEventListener("visibilitychange", function () { if (document.hidden) v.pause(); else { var r = v.play(); if (r && r.catch) r.catch(function () {}); } });
  }

  /* Visor de fotos a pantalla completa */
  function initVisor() {
    var dlg = q("#visor");
    if (!dlg) return;
    var img = q("#visor-img"), pie = q("#visor-pie"), ant = q("#visor-ant"), sig = q("#visor-sig"), grupo = [], i = 0;
    function mostrar() { var b = grupo[i]; img.src = b.getAttribute("data-grande"); img.alt = q("img", b).alt; pie.textContent = (b.getAttribute("data-pie") || "") + (grupo.length > 1 ? "  ·  " + (i + 1) + " de " + grupo.length : ""); }
    function abrir(b) {
      var cont = b.closest("[data-grupo]") || document;
      grupo = qa(".ampliar", cont).filter(function (x) { return !x.hidden && x.offsetParent !== null; });
      if (grupo.indexOf(b) < 0) grupo = [b];
      i = grupo.indexOf(b); mostrar();
      ant.hidden = sig.hidden = grupo.length < 2;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    }
    function cerrar() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
    function mover(d) { i = (i + d + grupo.length) % grupo.length; mostrar(); }
    qa(".ampliar").forEach(function (b) { b.addEventListener("click", function () { abrir(b); }); });
    qa("[data-abrir-galeria]").forEach(function (a) { a.addEventListener("click", function (e) { var b = q(".ampliar", q(a.getAttribute("data-abrir-galeria"))); if (b) { e.preventDefault(); abrir(b); } }); });
    ant.addEventListener("click", function () { mover(-1); });
    sig.addEventListener("click", function () { mover(1); });
    q("#visor-cerrar").addEventListener("click", cerrar);
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.classList.contains("visor-caja")) cerrar(); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") mover(1); if (e.key === "ArrowLeft") mover(-1); });
    var x0 = null;
    dlg.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50 && grupo.length > 1) mover(dx < 0 ? 1 : -1); x0 = null; });
  }

  /* Filtro de habitaciones por personas */
  function initFiltroPersonas() {
    var chips = qa("[data-personas]"), filas = qa("[data-cap]"), estado = q("#estado-filtro");
    if (!chips.length) return;
    function aplicar(chip) {
      var n = +chip.getAttribute("data-personas"), visibles = 0;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      filas.forEach(function (f) { var ok = +f.getAttribute("data-cap") >= n; f.hidden = !ok; if (ok) visibles++; });
      if (estado) estado.textContent = n ? (visibles === 1 ? "Para " + chip.getAttribute("data-texto") + " le sirve 1 habitación." : "Para " + chip.getAttribute("data-texto") + " le sirven " + visibles + " habitaciones.") : "Mostrando las 4 habitaciones.";
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { aplicar(c); }); });
  }

  /* Filtro de la galería */
  function initFiltroGaleria() {
    var chips = qa("[data-cat-filtro]"), fotos = qa(".rejilla-galeria .ampliar");
    if (!chips.length) return;
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var cat = c.getAttribute("data-cat-filtro");
        chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
        fotos.forEach(function (f) { f.hidden = cat !== "todas" && f.getAttribute("data-cat") !== cat; });
      });
    });
  }

  /* Armadores de reserva (completo o de una habitación) */
  var dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function leer(v) { var x = v.split("-"); return new Date(+x[0], +x[1] - 1, +x[2], 12); }
  function fecha(d) { return dias[d.getDay()] + " " + d.getDate() + " de " + meses[d.getMonth()]; }
  function initArmadores() {
    var pedido = new URLSearchParams(location.search).get("habitacion");
    qa("form.armador").forEach(function (f) {
      var lleg = q(".js-llegada", f), sal = q(".js-salida", f), cuenta = { adultos: 2, ninos: 0 };
      var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
      var sab = new Date(hoy); sab.setDate(hoy.getDate() + ((6 - hoy.getDay() + 7) % 7 || 7));
      var dom = new Date(sab); dom.setDate(sab.getDate() + 1);
      lleg.min = iso(hoy); lleg.value = iso(sab); sal.value = iso(dom); sal.min = iso(dom);
      if (pedido) { var r0 = q('input[name="cuarto"][value="' + pedido.replace(/[^a-z]/g, "") + '"]', f); if (r0) r0.checked = true; }
      function cuarto() { return q('input[name="cuarto"]:checked', f) || f; }
      function actualizar() {
        var c = cuarto(), cap = +c.getAttribute("data-cap"), precio = +c.getAttribute("data-precio"), articulo = c.getAttribute("data-articulo");
        var a = leer(lleg.value || iso(sab)), b = leer(sal.value || iso(dom));
        if (b <= a) { b = new Date(a); b.setDate(a.getDate() + 1); sal.value = iso(b); }
        sal.min = iso(new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1));
        var noches = Math.round((b - a) / 864e5), total = cuenta.adultos + cuenta.ninos;
        var personas = cuenta.adultos + (cuenta.adultos === 1 ? " adulto" : " adultos") + (cuenta.ninos ? " y " + cuenta.ninos + (cuenta.ninos === 1 ? " niño" : " niños") : "");
        var msg = "Hola, quiero consultar disponibilidad para estas fechas: del " + fecha(a) + " al " + fecha(b) + " (" + noches + (noches === 1 ? " noche" : " noches") + "). Habitación: " + articulo + ". Somos " + personas + ".";
        q(".js-mensaje", f).textContent = msg;
        q(".js-wa", f).href = enlaceWA(msg);
        q(".js-estimado", f).textContent = "Estimado: " + noches + (noches === 1 ? " noche" : " noches") + " × $" + precio + " = $" + (noches * precio) + " (precio de ejemplo).";
        var aviso = "";
        if (total > cap) {
          var opciones = (f.getAttribute("data-alternativas") || "").split("|").filter(Boolean).map(function (t) { var p = t.split(":"); return { articulo: p[0], cap: +p[1] }; });
          qa('input[name="cuarto"]', f).forEach(function (x) { opciones.push({ articulo: x.getAttribute("data-articulo"), cap: +x.getAttribute("data-cap") }); });
          var mayor = opciones.filter(function (o) { return o.cap >= total; }).sort(function (x, y) { return x.cap - y.cap; })[0];
          aviso = articulo.charAt(0).toUpperCase() + articulo.slice(1) + " recibe hasta " + cap + " personas." + (mayor ? " Para " + total + ", le conviene " + mayor.articulo + "." : " Para grupos grandes, escríbanos y le armamos dos habitaciones.");
        }
        q(".js-aviso", f).textContent = aviso;
      }
      qa("[data-cuenta]", f).forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-cuenta"), min = k === "adultos" ? 1 : 0;
          cuenta[k] = lim(cuenta[k] + +b.getAttribute("data-paso"), min, 12);
          q(".js-" + k, f).textContent = cuenta[k];
          actualizar();
        });
      });
      f.addEventListener("change", actualizar);
      f.addEventListener("submit", function (e) { e.preventDefault(); window.open(q(".js-wa", f).href, "_blank", "noopener"); });
      actualizar();
    });
  }

  /* Mensaje desde contacto */
  function initContacto() {
    var f = q("#form-contacto");
    if (!f) return;
    function armar() {
      var nombre = q("#c-nombre", f).value.trim(), motivo = q("#c-motivo", f).value, texto = q("#c-texto", f).value.trim();
      var msg = "Hola, " + (nombre ? "soy " + nombre + ". " : "") + motivo + (texto ? " " + texto : "");
      q("#c-vista", f).textContent = msg;
      q("#c-wa", f).href = enlaceWA(msg);
    }
    f.addEventListener("input", armar);
    f.addEventListener("change", armar);
    f.addEventListener("submit", function (e) { e.preventDefault(); window.open(q("#c-wa", f).href, "_blank", "noopener"); });
    armar();
  }

  safe(initMenu, "menu");
  safe(initCabecera, "cabecera");
  safe(initVideo, "video");
  safe(initVisor, "visor");
  safe(initFiltroPersonas, "filtro-personas");
  safe(initFiltroGaleria, "filtro-galeria");
  safe(initArmadores, "armadores");
  safe(initContacto, "contacto");
})();
