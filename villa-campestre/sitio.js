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
    var btn = q(".hamburguesa"), menu = q("#menu");
    if (!btn || !menu) return;
    function poner(abrir) {
      btn.setAttribute("aria-expanded", abrir ? "true" : "false");
      btn.setAttribute("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
      menu.classList.toggle("abierto", abrir);
      document.body.classList.toggle("menu-abierto", abrir);
    }
    btn.addEventListener("click", function () { poner(btn.getAttribute("aria-expanded") !== "true"); });
    qa("a", menu).forEach(function (a) { a.addEventListener("click", function () { poner(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") poner(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1000) poner(false); });
  }

  /* Titular de portada: palabra por palabra al cargar (sin JS se ve completo) */
  function initTitular() {
    var pals = qa(".titulo-portada .pal");
    if (!pals.length || reducido) return;
    pals.forEach(function (p, i) { p.style.animationDelay = (0.12 + i * 0.11) + "s"; });
    document.documentElement.classList.add("titular-anima");
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

  /* Sello con la hora real del llano (hora de Venezuela) y el momento del día */
  function initSello() {
    var t = q("#sello-texto");
    if (!t) return;
    var partes;
    try {
      partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Caracas", hour: "numeric", minute: "2-digit", hour12: false }).formatToParts(new Date());
    } catch (e) { return; }
    var h = 0, m = 0;
    partes.forEach(function (p) { if (p.type === "hour") h = +p.value % 24; if (p.type === "minute") m = +p.value; });
    var min = h * 60 + m, momento;
    if (min < 300) momento = "noche cerrada: el cielo del llano está lleno de estrellas";
    else if (min < 540) momento = "hora del desayuno criollo y el café colado";
    else if (min < 720) momento = "hora de piscina, antes de que apriete el sol";
    else if (min < 840) momento = "hora del almuerzo bajo los árboles";
    else if (min < 990) momento = "hora de chinchorro, que el sol está pegando";
    else if (min < 1110) momento = "se acerca el atardecer y pasan las garzas";
    else momento = "hora de la cena y del cielo estrellado";
    var h12 = h % 12 || 12, ampm = h < 12 ? "a. m." : "p. m.";
    t.textContent = "Son las " + h12 + ":" + ("0" + m).slice(-2) + " " + ampm + ": " + momento + ".";
  }

  /* Visor de fotos a pantalla completa */
  function initVisor() {
    var dlg = q("#visor");
    if (!dlg) return;
    var img = q("#visor-img"), pie = q("#visor-pie"), ant = q("#visor-ant"), sig = q("#visor-sig"), grupo = [], i = 0;
    function mostrar() { var b = grupo[i]; img.src = b.getAttribute("data-grande"); img.alt = q("img", b).alt; pie.textContent = (b.getAttribute("data-pie") || "") + (grupo.length > 1 ? "  ·  " + (i + 1) + " de " + grupo.length : ""); }
    function abrir(b) {
      var cont = b.closest("[data-grupo]") || document;
      grupo = qa(".ampliar", cont).filter(function (x) { return x.offsetParent !== null; });
      if (grupo.indexOf(b) < 0) grupo = [b];
      i = grupo.indexOf(b); mostrar();
      ant.hidden = sig.hidden = grupo.length < 2;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    }
    function cerrar() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
    function mover(d) { i = (i + d + grupo.length) % grupo.length; mostrar(); }
    qa(".ampliar").forEach(function (b) { b.addEventListener("click", function () { abrir(b); }); });
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
    var chips = qa("[data-personas]"), filas = qa(".fila-hab[data-cap]"), estado = q("#estado-filtro");
    if (!chips.length) return;
    function aplicar(chip) {
      var n = +chip.getAttribute("data-personas"), visibles = 0;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      filas.forEach(function (f) { var ok = +f.getAttribute("data-cap") >= n; f.hidden = !ok; if (ok) visibles++; });
      if (estado) estado.textContent = n ? (visibles === 1 ? "Para " + chip.getAttribute("data-texto") + " le sirve 1 habitación." : "Para " + chip.getAttribute("data-texto") + " le sirven " + visibles + " habitaciones.") : "Mostrando las 4 habitaciones.";
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { aplicar(c); }); });
  }

  /* Agenda del día llanero */
  function initAgenda() {
    var raiz = q(".agenda");
    if (!raiz) return;
    var tabs = qa(".momento-tab", raiz), paneles = qa(".momento", raiz), lista = q(".js-mi-dia", raiz), vacio = q(".js-vacio", raiz), enlace = q(".js-dia-wa", raiz);
    var elegidos = {};
    paneles.forEach(function (p) { elegidos[p.getAttribute("data-id")] = true; });
    raiz.classList.add("activa");
    q(".momentos-tabs", raiz).setAttribute("role", "tablist");
    tabs.forEach(function (t) { t.setAttribute("role", "tab"); });
    paneles.forEach(function (p) { p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "tab-" + p.getAttribute("data-id")); });
    function abrir(id, foco) {
      tabs.forEach(function (t) { var si = t.getAttribute("data-momento") === id; t.setAttribute("aria-selected", si ? "true" : "false"); t.tabIndex = si ? 0 : -1; if (si && foco) t.focus(); });
      paneles.forEach(function (p) { var si = p.getAttribute("data-id") === id; p.hidden = !si; if (si) raiz.setAttribute("data-luz", p.getAttribute("data-luz")); });
    }
    function armar() {
      var modo = (q('input[name="modo"]:checked', raiz) || {}).value || "noche";
      var nombres = [], items = "";
      paneles.forEach(function (p) {
        var id = p.getAttribute("data-id"), si = !!elegidos[id];
        var b = q(".js-elegir", p); b.setAttribute("aria-pressed", si ? "true" : "false");
        var t = q('.momento-tab[data-momento="' + id + '"]', raiz); t.classList.toggle("elegido", si);
        if (si) { nombres.push(p.getAttribute("data-nombre").toLowerCase()); items += "<li><b>" + p.getAttribute("data-hora") + "</b>" + p.getAttribute("data-nombre") + "</li>"; }
      });
      lista.innerHTML = items;
      vacio.hidden = nombres.length > 0;
      var txt = nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1] : (nombres[0] || "lo que me recomienden");
      var msg = "Hola, quiero pasar un día llanero en Posada Villa Campestre con " + txt + ". " + (modo === "noche" ? "Me quedo a dormir: ¿qué habitación me recomiendan?" : "Es para un pasadía, sin dormir.");
      enlace.href = enlaceWA(msg);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { abrir(t.getAttribute("data-momento")); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (d) { e.preventDefault(); abrir(tabs[(i + d + tabs.length) % tabs.length].getAttribute("data-momento"), true); }
      });
    });
    qa(".js-elegir", raiz).forEach(function (b) { b.addEventListener("click", function () { var id = b.getAttribute("data-id"); elegidos[id] = !elegidos[id]; armar(); }); });
    qa('input[name="modo"]', raiz).forEach(function (r) { r.addEventListener("change", armar); });
    abrir(tabs[0].getAttribute("data-momento"));
    armar();
  }

  /* Armadores de reserva: habitación o pasadía */
  var dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function leer(v) { var x = v.split("-"); return new Date(+x[0], +x[1] - 1, +x[2], 12); }
  function fecha(d) { return dias[d.getDay()] + " " + d.getDate() + " de " + meses[d.getMonth()]; }
  function initArmadores() {
    var pedido = new URLSearchParams(location.search).get("habitacion");
    qa("form.armador").forEach(function (f) {
      var lleg = q(".js-llegada", f), sal = q(".js-salida", f), cajaSal = q(".js-caja-salida", f), cuenta = { adultos: 2, ninos: 0 };
      var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
      var sab = new Date(hoy); sab.setDate(hoy.getDate() + ((6 - hoy.getDay() + 7) % 7 || 7));
      var dom = new Date(sab); dom.setDate(sab.getDate() + 1);
      lleg.min = iso(hoy); lleg.value = iso(sab); sal.value = iso(dom); sal.min = iso(dom);
      if (pedido) { var r0 = q('input[name="cuarto"][value="' + pedido.replace(/[^a-z]/g, "") + '"]', f); if (r0) r0.checked = true; }
      function cuarto() { return q('input[name="cuarto"]:checked', f) || f; }
      function actualizar() {
        var c = cuarto(), tipo = c.getAttribute("data-tipo") || "habitacion", cap = +c.getAttribute("data-cap"), precio = +c.getAttribute("data-precio"), articulo = c.getAttribute("data-articulo");
        var pasadia = tipo === "pasadia";
        cajaSal.hidden = pasadia;
        q(".js-txt-llegada", f).textContent = pasadia ? "Día" : "Llegada";
        q(".js-leyenda-fechas", f).textContent = pasadia ? "Fecha" : "Fechas";
        var a = leer(lleg.value || iso(sab)), b = leer(sal.value || iso(dom));
        if (b <= a) { b = new Date(a); b.setDate(a.getDate() + 1); sal.value = iso(b); }
        sal.min = iso(new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1));
        var noches = Math.round((b - a) / 864e5), total = cuenta.adultos + cuenta.ninos;
        var personas = cuenta.adultos + (cuenta.adultos === 1 ? " adulto" : " adultos") + (cuenta.ninos ? " y " + cuenta.ninos + (cuenta.ninos === 1 ? " niño" : " niños") : "");
        var msg, est;
        if (pasadia) {
          var pn = +c.getAttribute("data-precio-nino");
          msg = "Hola, quiero reservar un pasadía en Posada Villa Campestre para el " + fecha(a) + ". Somos " + personas + ".";
          est = "Estimado: " + cuenta.adultos + " × $" + precio + (cuenta.ninos ? " + " + cuenta.ninos + " × $" + pn : "") + " = $" + (cuenta.adultos * precio + cuenta.ninos * pn) + " (precio de ejemplo).";
        } else {
          msg = "Hola, quiero consultar disponibilidad en Posada Villa Campestre del " + fecha(a) + " al " + fecha(b) + " (" + noches + (noches === 1 ? " noche" : " noches") + "). Habitación: " + articulo + ". Somos " + personas + ".";
          est = "Estimado: " + noches + (noches === 1 ? " noche" : " noches") + " × $" + precio + " = $" + (noches * precio) + " (precio de ejemplo).";
        }
        q(".js-mensaje", f).textContent = msg;
        q(".js-wa", f).href = enlaceWA(msg);
        q(".js-estimado", f).textContent = est;
        var aviso = "";
        if (!pasadia && total > cap) {
          var opciones = (f.getAttribute("data-alternativas") || "").split("|").filter(Boolean).map(function (t) { var p = t.split(":"); return { articulo: p[0], cap: +p[1] }; });
          qa('input[name="cuarto"][data-tipo="habitacion"]', f).forEach(function (x) { opciones.push({ articulo: x.getAttribute("data-articulo"), cap: +x.getAttribute("data-cap") }); });
          var mayor = opciones.filter(function (o) { return o.cap >= total; }).sort(function (x, y) { return x.cap - y.cap; })[0];
          aviso = articulo.charAt(0).toUpperCase() + articulo.slice(1) + " recibe hasta " + cap + " personas." + (mayor ? " Para " + total + ", le conviene " + mayor.articulo + "." : " Para grupos grandes, escríbanos y le armamos dos habitaciones.");
        }
        q(".js-aviso", f).textContent = aviso;
      }
      qa("[data-cuenta]", f).forEach(function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-cuenta"), min = k === "adultos" ? 1 : 0;
          cuenta[k] = lim(cuenta[k] + +b.getAttribute("data-paso"), min, 30);
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
  safe(initTitular, "titular");
  safe(initVideo, "video");
  safe(initSello, "sello");
  safe(initVisor, "visor");
  safe(initFiltroPersonas, "filtro-personas");
  safe(initAgenda, "agenda");
  safe(initArmadores, "armadores");
  safe(initContacto, "contacto");
})();
