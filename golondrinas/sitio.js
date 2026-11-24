(function () {
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "https://wa.me/584145111950";
  function safe(fn, n) { try { fn(); } catch (e) { console.warn("[" + n + "]", e); } }
  function q(s, c) { return (c || document).querySelector(s); }
  function qa(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function ver(el, fn, opciones) {
    if (!("IntersectionObserver" in window)) { fn(true); return null; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { fn(x.isIntersecting, io); }); }, opciones || {});
    io.observe(el);
    return io;
  }

  /* En iPhone, :active solo responde si hay un oyente de toque: así botones y tarjetas se hunden al tocarlos */
  document.addEventListener("touchstart", function () {}, { passive: true });

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

  /* Visor: las fotos se deslizan con el dedo, se asientan una por una y se cierra deslizando hacia abajo */
  function initVisor() {
    var dlg = q("#visor");
    if (!dlg) return;
    var pista = q("#visor-pista"), pie = q("#visor-pie"), ant = q("#visor-ant"), sig = q("#visor-sig"), grupo = [], i = 0, origen = null;
    var fondo = document.createElement("div"); fondo.className = "visor-fondo"; dlg.insertBefore(fondo, dlg.firstChild);
    function imgs() { return qa("img", pista); }
    function cargarCerca() { imgs().forEach(function (im, k) { if (Math.abs(k - i) <= 1 && !im.getAttribute("src")) im.src = im.getAttribute("data-src"); }); }
    function pintar() {
      var b = grupo[i];
      pie.textContent = (b.getAttribute("data-pie") || "") + (grupo.length > 1 ? "  ·  " + (i + 1) + " de " + grupo.length : "");
      ant.disabled = i === 0; sig.disabled = i === grupo.length - 1;
    }
    function abrir(b) {
      origen = b;
      var cont = b.closest("[data-grupo]") || document;
      grupo = qa(".ampliar", cont).filter(function (x) { return !x.hidden && x.offsetParent !== null; });
      if (grupo.indexOf(b) < 0) grupo = [b];
      i = grupo.indexOf(b);
      pista.innerHTML = grupo.map(function () { return '<figure class="visor-foto"><img alt="" decoding="async"></figure>'; }).join("");
      imgs().forEach(function (im, k) { im.alt = q("img", grupo[k]).alt; im.setAttribute("data-src", grupo[k].getAttribute("data-grande")); });
      ant.hidden = sig.hidden = grupo.length < 2;
      cargarCerca(); pintar();
      pista.style.transform = ""; fondo.style.opacity = "";
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      pista.scrollLeft = i * pista.clientWidth;
    }
    function cerrar() {
      if (dlg.close) dlg.close(); else dlg.removeAttribute("open");
      pista.innerHTML = "";
      if (origen) origen.focus({ preventScroll: true });
    }
    function ir(d) {
      var k = Math.max(0, Math.min(grupo.length - 1, i + d));
      pista.scrollTo({ left: k * pista.clientWidth, behavior: reducido ? "auto" : "smooth" });
    }
    var pend = false;
    pista.addEventListener("scroll", function () {
      if (pend) return; pend = true;
      requestAnimationFrame(function () {
        pend = false;
        var k = Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth));
        if (k !== i && grupo[k]) { i = k; pintar(); cargarCerca(); }
      });
    }, { passive: true });
    qa(".ampliar").forEach(function (b) { b.addEventListener("click", function () { abrir(b); }); });
    ant.addEventListener("click", function () { ir(-1); });
    sig.addEventListener("click", function () { ir(1); });
    q("#visor-cerrar").addEventListener("click", cerrar);
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); cerrar(); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") ir(1); if (e.key === "ArrowLeft") ir(-1); });
    dlg.addEventListener("click", function (e) { if (e.target.classList && e.target.classList.contains("visor-foto")) cerrar(); });
    /* deslizar hacia abajo para cerrar */
    var x0 = 0, y0 = 0, modo = null, dy = 0;
    pista.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; modo = null; dy = 0; pista.style.transition = "none"; }, { passive: true });
    pista.addEventListener("touchmove", function (e) {
      var dx = e.touches[0].clientX - x0; dy = e.touches[0].clientY - y0;
      if (!modo) { if (Math.abs(dx) > 8 || Math.abs(dy) > 8) modo = dy > 0 && Math.abs(dy) > Math.abs(dx) * 1.2 ? "bajar" : "lado"; }
      if (modo === "bajar") {
        var t = Math.max(0, dy);
        pista.style.transform = "translate3d(0," + t + "px,0) scale(" + (1 - Math.min(t / 2000, 0.12)) + ")";
        fondo.style.opacity = String(Math.max(0.15, 1 - t / 420));
      }
    }, { passive: true });
    pista.addEventListener("touchend", function () {
      if (modo !== "bajar") return;
      pista.style.transition = "transform .24s ease, opacity .24s ease";
      fondo.style.transition = "opacity .24s ease";
      if (dy > 110) {
        pista.style.transform = "translate3d(0,100vh,0)"; fondo.style.opacity = "0";
        setTimeout(function () { pista.style.transition = fondo.style.transition = ""; cerrar(); }, 230);
      } else { pista.style.transform = ""; fondo.style.opacity = ""; }
      modo = null;
    });
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

  /* Video de la cascada: se pide solo cuando su sección está por verse; el marco toma la forma del video.
     Para cambiarlo basta con reemplazar video/cascada.mp4. */
  function initVideo() {
    var v = q("#video-cascada"), b = q("#video-pausa"), marco = q("#marco-cascada");
    if (!v) return;
    var pausado = reducido;
    function estado() { b.setAttribute("aria-pressed", pausado ? "true" : "false"); b.setAttribute("aria-label", pausado ? "Reproducir el video" : "Pausar el video"); }
    v.addEventListener("loadedmetadata", function () { if (v.videoWidth && v.videoHeight) { marco.style.setProperty("--ratio", v.videoWidth + " / " + v.videoHeight); marco.classList.toggle("horizontal", v.videoWidth > v.videoHeight); } });
    v.addEventListener("loadeddata", function () { marco.classList.add("listo"); });
    function cargar() { if (!v.getAttribute("src")) { v.preload = reducido ? "metadata" : "auto"; v.src = v.getAttribute("data-src"); } }
    function jugar() { cargar(); if (!pausado) { var p = v.play(); if (p && p.catch) p.catch(function () { pausado = true; estado(); }); } }
    estado();
    ver(marco, function (dentro) { if (dentro) jugar(); else if (v.getAttribute("src")) v.pause(); }, { rootMargin: "300px 0px" });
    b.addEventListener("click", function () { pausado = !v.paused ? true : false; if (pausado) v.pause(); else jugar(); estado(); });
  }

  /* Mapa de la ruta: la línea se dibuja cuando el mapa entra en pantalla */
  function initMapa() {
    var m = q("#mapa-ruta");
    if (!m) return;
    if (reducido) { m.classList.add("dibujar"); return; }
    ver(m, function (dentro, io) { if (dentro) { m.classList.add("dibujar"); if (io) io.disconnect(); } }, { threshold: 0.35 });
  }

  /* Transición entre páginas cuando el navegador no tiene View Transitions */
  function initTransiciones() {
    if (!document.documentElement.classList.contains("vt-alterna")) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== "_self") return;
      var u;
      try { u = new URL(a.getAttribute("href"), location.href); } catch (x) { return; }
      if (u.origin !== location.origin || !/(\.html|\/)$/.test(u.pathname)) return;
      if (u.pathname === location.pathname && u.hash) return;
      e.preventDefault();
      document.documentElement.classList.add("saliendo");
      setTimeout(function () { location.href = u.href; }, 170);
    });
    window.addEventListener("pageshow", function (e) { if (e.persisted) document.documentElement.classList.remove("saliendo"); });
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

  /* Video de la posada (Inicio): sin autoplay; el MP4 se pide solo al darle play. */
  function initVideoPosada() {
    var v = q("#video-posada"), b = q("#vp-play");
    if (!v || !b) return;
    b.hidden = false;
    b.addEventListener("click", function () { b.hidden = true; v.muted = false; var p = v.play(); if (p && p.catch) p.catch(function () { b.hidden = false; }); });
    v.addEventListener("play", function () { b.hidden = true; });
    v.addEventListener("ended", function () { b.hidden = false; });
  }

  /* Mapa de Google: se carga solo al tocar "Ver mapa", para no hacer lenta la página */
  function initMapaCarga() {
    qa("[data-ver-mapa]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var caja = a.closest(".mapa-carga");
        if (!caja || caja.classList.contains("cargado")) return;
        ev.preventDefault();
        var f = document.createElement("iframe");
        f.title = "Mapa de Google con la ubicación de la posada";
        f.setAttribute("loading", "lazy");
        f.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
        f.setAttribute("allowfullscreen", "");
        f.src = caja.getAttribute("data-embed");
        caja.appendChild(f);
        caja.classList.add("cargado");
        f.focus();
      });
    });
  }

  /* Detalles al entrar en pantalla (prompt-45b). Todo empieza visible: solo se mueve o se termina de dibujar.
     Sin IntersectionObserver o con movimiento reducido, no se hace nada y todo queda quieto. */
  function alVer(els, inicial, despues, umbral) {
    if (reducido || !("IntersectionObserver" in window) || !els.length) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) {
        if (!x.isIntersecting) return;
        io.unobserve(x.target);
        requestAnimationFrame(function () { x.target.classList.add("vivo"); });
        if (despues) setTimeout(function () { x.target.classList.remove(inicial, "vivo"); }, despues);
      });
    }, { threshold: umbral || 0.25, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { el.classList.add(inicial); io.observe(el); });
  }
  function initDetalles() {
    alVer(qa(".puntos"), "preparado", 0, 0.3);
    alVer(qa(".divisor"), "preparado", 0, 0.6);
    alVer(qa(".espacio-fotos .ampliar, .cabanas-fotos .ampliar, .duende-foto .ampliar, .par-fotos .ampliar, .ampliar.foto-alta, .tarjeta-foto"), "revela", 1600, 0.2);
  }

  /* Galería de experiencias: en computadora avanza de lado al bajar; en el teléfono se desliza con el dedo */
  function initTiraHorizontal() {
    if (reducido) return;
    var mq = window.matchMedia("(min-width: 900px)");
    var tiras = qa(".tira-rutas").filter(function (t) { return t.children.length > 3; });
    if (!tiras.length) return;
    var pend = false;
    function mover() {
      pend = false;
      var vh = window.innerHeight;
      tiras.forEach(function (t) {
        if (!t.classList.contains("horizontal")) return;
        var r = t.getBoundingClientRect(), extra = t.scrollWidth - t.clientWidth;
        var p = (vh - r.top) / (vh + r.height);
        p = Math.max(0, Math.min(1, (p - 0.15) / 0.6));
        t.style.transform = "translate3d(" + (-p * extra).toFixed(1) + "px,0,0)";
      });
    }
    function pedir() { if (!pend) { pend = true; requestAnimationFrame(mover); } }
    function aplicar() {
      tiras.forEach(function (t) {
        t.classList.toggle("horizontal", mq.matches);
        var sec = t.closest(".seccion");
        if (sec) sec.classList.toggle("sec-horizontal", mq.matches);
        if (!mq.matches) t.style.transform = "";
      });
      pedir();
    }
    aplicar();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", aplicar);
    /* con teclado: si una foto recibe el foco, la tira se corre para que quede a la vista */
    tiras.forEach(function (t) {
      t.addEventListener("focusin", function (e) {
        if (!t.classList.contains("horizontal")) return;
        var b = e.target.getBoundingClientRect();
        if (b.right > window.innerWidth || b.left < 0) { t.style.transform = "translate3d(" + (-(e.target.offsetLeft)) + "px,0,0)"; }
      });
    });
  }

  safe(initMenu, "menu");
  safe(initDetalles, "detalles");
  safe(initTiraHorizontal, "tira-horizontal");
  safe(initMapaCarga, "mapa-carga");
  safe(initVisor, "visor");
  safe(initFiltro, "filtro");
  safe(initVideo, "video");
  safe(initVideoPosada, "video-posada");
  safe(initMapa, "mapa");
  safe(initTransiciones, "transiciones");
  safe(initArmador, "armador");
})();
