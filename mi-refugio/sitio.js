(function () {
  var cfg = document.body.dataset;
  var LAT = parseFloat(cfg.lat), LON = parseFloat(cfg.lon), HUSO = parseFloat(cfg.huso);
  var WA = "https://wa.me/" + cfg.wa + "?text=", BASE = cfg.base;
  var CLAVE = "glamping." + cfg.wa + ".experiencias";
  function safe(fn, n) { try { fn(); } catch (e) { console.warn("[" + n + "]", e); } }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* Sol: puesta y salida para una fecha (algoritmo del Almanaque Náutico) */
  function sol(fecha, salida) {
    var rad = Math.PI / 180;
    var n = Math.floor((fecha - new Date(fecha.getFullYear(), 0, 0)) / 864e5);
    var lngHora = LON / 15, t = n + ((salida ? 6 : 18) - lngHora) / 24;
    var M = 0.9856 * t - 3.289;
    var L = (M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634 + 360) % 360;
    var RA = (Math.atan(0.91764 * Math.tan(L * rad)) / rad + 360) % 360;
    RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
    var sinDec = 0.39782 * Math.sin(L * rad), cosDec = Math.cos(Math.asin(sinDec));
    var cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(LAT * rad)) / (cosDec * Math.cos(LAT * rad));
    var H = Math.acos(cosH) / rad;
    if (salida) H = 360 - H;
    var T = H / 15 + RA - 0.06571 * t - 6.622;
    var hora = ((T - lngHora + HUSO) % 24 + 24) % 24;
    return { h: Math.floor(hora), m: Math.floor((hora % 1) * 60) };
  }
  function formato(s) {
    var h = s.h % 12 || 12;
    return h + ":" + (s.m < 10 ? "0" : "") + s.m + (s.h >= 12 ? " p. m." : " a. m.");
  }

  function initSol() {
    function pintar() {
      var ahora = new Date(), p = sol(ahora), manana = new Date(ahora.getTime() + 864e5);
      $$('[data-sol="puesta"]').forEach(function (b) { b.textContent = formato(p); });
      $$('[data-sol="salida-manana"]').forEach(function (b) { b.textContent = formato(sol(manana, true)); });
      var mins = p.h * 60 + p.m - (ahora.getHours() * 60 + ahora.getMinutes()), txt;
      if (mins > 90) txt = "Hoy faltan " + Math.floor(mins / 60) + " h " + (mins % 60) + " min. Desde aquí se ve completo.";
      else if (mins > 0) txt = "Hoy faltan " + mins + " minutos. Es buena hora para ir subiendo.";
      else txt = "Ya pasó el de hoy. El de mañana es a las " + formato(sol(manana)) + ".";
      $$('[data-sol="falta"]').forEach(function (b) { b.textContent = txt; });
    }
    pintar();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) pintar(); });
  }

  /* Video de la portada: solo en pantallas grandes y con buena conexión */
  function initVideo() {
    var v = $(".portada video");
    if (!v) return;
    var c = navigator.connection || {};
    if (c.saveData || /2g|3g/.test(c.effectiveType || "")) return;
    if (!matchMedia("(min-width: 900px)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.src = v.getAttribute("data-video");
    v.addEventListener("playing", function () { v.classList.add("corriendo"); });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }

  function initMenu() {
    var cab = $(".cabecera"), boton = $(".hamburguesa");
    function poner(abrir) {
      cab.classList.toggle("menu-abierto", abrir);
      boton.setAttribute("aria-expanded", abrir ? "true" : "false");
      boton.setAttribute("aria-label", abrir ? "Cerrar el menú" : "Abrir el menú");
    }
    boton.addEventListener("click", function () { poner(!cab.classList.contains("menu-abierto")); });
    $$(".menu a").forEach(function (a) { a.addEventListener("click", function () { poner(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") poner(false); });
  }

  function initCabecera() {
    var cab = $(".cabecera"), flota = $(".wa-flota"), pend = false;
    var tapan = $$(".portada .acciones, .cabeza-pag .acciones, .enviar, .banda-taquilla .acciones");
    function ver(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }
    function pintar() {
      pend = false;
      cab.classList.toggle("solida", window.scrollY > 40);
      flota.classList.toggle("oculto", tapan.some(ver));
    }
    window.addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(pintar); } }, { passive: true });
    pintar();
  }

  /* Tira de fotogramas: flechas en computadora */
  function initTiras() {
    $$(".alojamientos").forEach(function (sec) {
      var tira = $(".tira", sec), ant = $(".ant", sec), sig = $(".sig", sec);
      if (!tira || !ant) return;
      function paso() { var f = $(".fotograma", tira); return f ? f.offsetWidth + 14 : 400; }
      function estado() { ant.disabled = tira.scrollLeft < 8; sig.disabled = tira.scrollLeft + tira.clientWidth > tira.scrollWidth - 8; }
      ant.addEventListener("click", function () { tira.scrollBy({ left: -paso(), behavior: "smooth" }); setTimeout(estado, 500); });
      sig.addEventListener("click", function () { tira.scrollBy({ left: paso(), behavior: "smooth" }); setTimeout(estado, 500); });
      tira.addEventListener("scroll", function () { requestAnimationFrame(estado); }, { passive: true });
      estado();
    });
  }

  /* Experiencias guardadas (cartelera → taquilla) */
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE) || "[]"); } catch (e) { return []; } }
  function guardar(lista) { try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) {} }
  var NOMBRES = {};
  $$(".afiche").forEach(function (a) { NOMBRES[a.getAttribute("data-exp")] = $("h3", a).textContent; });
  $$('input[name="exp"]').forEach(function (c) { NOMBRES[c.value] = c.getAttribute("data-nombre"); });
  var armar = function () {};

  function pintarExperiencias() {
    var lista = leer();
    $$(".afiche").forEach(function (a) {
      var on = lista.indexOf(a.getAttribute("data-exp")) > -1, b = $(".sumar", a);
      a.classList.toggle("elegida", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "En su reserva" : "Agregar";
    });
    $$('input[name="exp"]').forEach(function (c) { c.checked = lista.indexOf(c.value) > -1; });
    var texto = lista.length ? "En su reserva: " + lista.map(function (k) { return NOMBRES[k] || k; }).join(", ") + "." : "Todavía no ha agregado experiencias.";
    $$(".lista-agregadas").forEach(function (p) { p.textContent = texto; });
    armar();
  }
  function alternar(clave) {
    var lista = leer(), i = lista.indexOf(clave);
    if (i > -1) lista.splice(i, 1); else lista.push(clave);
    guardar(lista); pintarExperiencias();
  }
  function initExperiencias() {
    $$(".afiche .sumar").forEach(function (b) {
      b.addEventListener("click", function () { alternar(b.closest(".afiche").getAttribute("data-exp")); });
    });
    $$('input[name="exp"]').forEach(function (c) {
      c.addEventListener("change", function () {
        var lista = leer(), i = lista.indexOf(c.value);
        if (c.checked && i < 0) lista.push(c.value);
        if (!c.checked && i > -1) lista.splice(i, 1);
        guardar(lista); pintarExperiencias();
      });
    });
    pintarExperiencias();
  }

  /* Armador de la reserva (completo en la taquilla, corto en cada alojamiento) */
  function initArmador() {
    var f = $("form.armador");
    if (!f) return;
    var llegada = $("#llegada", f), salida = $("#salida", f), outP = $(".n-personas", f);
    var texto = $(".texto-msg", f), cuenta = $(".cuenta", f), aviso = $(".aviso-cap", f), enviar = $(".enviar", f), solDia = $(".sol-dia", f);
    var personas = 2;
    function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
    function leerF(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
    function corta(v) { var p = v.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
    llegada.min = iso(new Date()); salida.min = iso(new Date(Date.now() + 864e5));
    var pedido = new URLSearchParams(location.search).get("aloj");
    if (pedido) { var r = $('input[name="carpa"][value="' + pedido.replace(/[^a-z-]/g, "") + '"]', f); if (r) r.checked = true; }

    armar = function () {
      var carpa = $('input[name="carpa"]:checked', f);
      var exps = $$('input[name="exp"]:checked', f);
      var noches = (llegada.value && salida.value) ? Math.round((leerF(salida.value) - leerF(llegada.value)) / 864e5) : 0;
      var fechas = "por definir";
      if (noches > 0) fechas = "del " + corta(llegada.value) + " al " + corta(salida.value) + " (" + noches + (noches === 1 ? " noche)" : " noches)");
      else if (llegada.value) fechas = "llegada el " + corta(llegada.value);
      var msg = BASE + fechas + ".\nAlojamiento: " + carpa.getAttribute("data-nombre") + ".\nPersonas: " + personas + ".";
      if (exps.length) msg += "\nExperiencias: " + exps.map(function (e) { return e.getAttribute("data-nombre"); }).join(", ") + ".";
      texto.textContent = msg;
      enviar.href = WA + encodeURIComponent(msg);
      var cap = +carpa.getAttribute("data-cap");
      aviso.textContent = personas > cap ? "Para más de " + cap + " personas le conviene la Carpa familiar." : "";
      solDia.textContent = llegada.value ? "El día que llega, el sol se pone a las " + formato(sol(leerF(llegada.value))) + ", así que trate de subir antes." : "";
      if (noches > 0) {
        var total = noches * +carpa.getAttribute("data-precio");
        exps.forEach(function (e) { total += +e.getAttribute("data-precio") * (e.hasAttribute("data-por-noche") ? noches : 1); });
        cuenta.innerHTML = "Estimado: <b>$" + total + "</b> por " + noches + (noches === 1 ? " noche" : " noches") + ". Precios de ejemplo.";
      } else if (llegada.value && salida.value) {
        cuenta.textContent = "La salida tiene que ser después de la llegada.";
      } else {
        cuenta.textContent = "Elija las fechas para ver un estimado. Precios de ejemplo.";
      }
    };
    llegada.addEventListener("change", function () {
      if (llegada.value) {
        var sig = iso(new Date(leerF(llegada.value).getTime() + 864e5));
        salida.min = sig;
        if (!salida.value || salida.value <= llegada.value) salida.value = sig;
      }
      armar();
    });
    f.addEventListener("change", function () { armar(); });
    f.addEventListener("submit", function (e) { e.preventDefault(); });
    $$(".paso", f).forEach(function (b) {
      b.addEventListener("click", function () { personas = Math.min(8, Math.max(1, personas + +b.getAttribute("data-paso"))); outP.textContent = personas; armar(); });
    });
    armar();
  }

  /* Visor de fotos a pantalla completa */
  function initVisor() {
    var dlg = $("dialog.visor");
    if (!dlg || !dlg.showModal) return;
    var im = $("img", dlg), pie = $(".pie-foto", dlg), num = $(".cuenta-foto", dlg), lista = [], i = 0, ultimo = null, x0 = null;
    function mostrar() {
      var b = lista[i];
      im.src = b.getAttribute("data-full"); im.alt = b.getAttribute("data-alt");
      pie.textContent = b.getAttribute("data-alt"); num.textContent = (i + 1) + " de " + lista.length;
    }
    function mover(d) { i = (i + d + lista.length) % lista.length; mostrar(); }
    $$("[data-visor-grupo]").forEach(function (g) {
      $$(".foto-v", g).forEach(function (b) {
        b.addEventListener("click", function () {
          lista = $$(".foto-v", g).filter(function (x) { return !x.hidden; });
          i = lista.indexOf(b); ultimo = b; mostrar(); dlg.showModal();
        });
      });
    });
    $(".cerrar", dlg).addEventListener("click", function () { dlg.close(); });
    $(".v-ant", dlg).addEventListener("click", function () { mover(-1); });
    $(".v-sig", dlg).addEventListener("click", function () { mover(1); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") mover(-1); if (e.key === "ArrowRight") mover(1); });
    dlg.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
    });
    dlg.addEventListener("close", function () { if (ultimo) ultimo.focus({ preventScroll: true }); });
  }

  /* Filtros de la galería */
  function initFiltros() {
    var botones = $$(".filtro");
    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filtro");
        botones.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$(".mosaico .foto-v").forEach(function (foto) { foto.hidden = f !== "todas" && foto.getAttribute("data-cat") !== f; });
      });
    });
  }

  safe(initSol, "sol");
  safe(initVideo, "video");
  safe(initMenu, "menu");
  safe(initCabecera, "cabecera");
  safe(initTiras, "tiras");
  safe(initArmador, "armador");
  safe(initExperiencias, "experiencias");
  safe(initVisor, "visor");
  safe(initFiltros, "filtros");
})();
