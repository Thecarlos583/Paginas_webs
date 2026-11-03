(function () {
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "https://wa.me/584145111950";
  function safe(fn, n) { try { fn(); } catch (e) { console.warn("[" + n + "]", e); } }
  function q(s, c) { return (c || document).querySelector(s); }
  function qa(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

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

  /* Visor de fotos */
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

  /* Filtro de la galería */
  function initFiltro() {
    var chips = qa("[data-cat-filtro]"), fotos = qa(".galeria .ampliar");
    if (!chips.length) return;
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var cat = c.getAttribute("data-cat-filtro");
        chips.forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
        fotos.forEach(function (f) { f.hidden = cat !== "todas" && f.getAttribute("data-cat") !== cat; });
      });
    });
  }

  /* Video de la cascada: en bucle y en silencio; con botón de pausa; quieto si se pide menos movimiento */
  function initVideo() {
    var v = q("#video-cascada"), b = q("#video-pausa");
    if (!v) return;
    function estado(pausado) { b.setAttribute("aria-pressed", pausado ? "true" : "false"); b.setAttribute("aria-label", pausado ? "Reproducir el video" : "Pausar el video"); }
    if (reducido) { v.removeAttribute("autoplay"); v.pause(); estado(true); }
    else { var p = v.play(); if (p && p.catch) p.catch(function () { estado(true); }); }
    b.addEventListener("click", function () { if (v.paused) { var r = v.play(); if (r && r.catch) r.catch(function () {}); estado(false); } else { v.pause(); estado(true); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden) v.pause(); else if (b.getAttribute("aria-pressed") === "false") { var r = v.play(); if (r && r.catch) r.catch(function () {}); } });
  }

  /* Armador del mensaje de reserva */
  var dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function leer(v) { var x = v.split("-"); return new Date(+x[0], +x[1] - 1, +x[2], 12); }
  function fecha(d) { return dias[d.getDay()] + " " + d.getDate() + " de " + meses[d.getMonth()]; }
  function initArmador() {
    var f = q("#armador");
    if (!f) return;
    var hab = q("#r-hab", f), lleg = q("#r-llegada", f), sal = q("#r-salida", f), per = q("#r-personas", f), nom = q("#r-nombre", f);
    var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    var vie = new Date(hoy); vie.setDate(hoy.getDate() + ((5 - hoy.getDay() + 7) % 7 || 7));
    var dom = new Date(vie); dom.setDate(vie.getDate() + 2);
    lleg.min = iso(hoy); lleg.value = iso(vie); sal.value = iso(dom);
    function armar() {
      var a = leer(lleg.value || iso(vie)), b = leer(sal.value || iso(dom));
      if (b <= a) { b = new Date(a); b.setDate(a.getDate() + 1); sal.value = iso(b); }
      sal.min = iso(new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1));
      var n = Math.max(1, Math.min(30, parseInt(per.value, 10) || 1)), noches = Math.round((b - a) / 864e5);
      var h = hab.value, quien = nom.value.trim();
      var msg = "Hola" + (quien ? ", soy " + quien : "") + ". Quiero reservar en la Posada El Rincón de las Golondrinas del " + fecha(a) + " al " + fecha(b) +
        " (" + noches + (noches === 1 ? " noche" : " noches") + "), para " + n + (n === 1 ? " persona" : " personas") + ". " +
        (/recomienden/.test(h) ? "Todavía no sé qué habitación: ¿cuál me recomiendan?" : "Habitación: " + h + ". ¿Está disponible y cuál es la tarifa?");
      q("#r-vista", f).textContent = msg;
      q("#r-wa", f).href = WA + "?text=" + encodeURIComponent(msg);
    }
    f.addEventListener("input", armar);
    f.addEventListener("change", armar);
    f.addEventListener("submit", function (e) { e.preventDefault(); window.open(q("#r-wa", f).href, "_blank", "noopener"); });
    armar();
  }

  safe(initMenu, "menu");
  safe(initVisor, "visor");
  safe(initFiltro, "filtro");
  safe(initVideo, "video");
  safe(initArmador, "armador");
})();
