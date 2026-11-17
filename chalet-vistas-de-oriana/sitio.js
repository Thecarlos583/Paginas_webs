/* Chalet Vistas de Oriana. Todo el contenido sale de datos/*.json.
   En línea se leen los JSON frescos; con doble clic (file://) se usa la copia que va dentro de la página. */
(function () {
  "use strict";
  var raiz = document.documentElement;
  raiz.classList.add("js");
  var params = new URLSearchParams(location.search);
  var HORNEAR = params.has("hornear");
  var QUIETO = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var D = {};
  try { D = JSON.parse(document.getElementById("datos-chalet").textContent); } catch (err) { D = {}; }

  function aviso(m) { if (window.console) console.warn("[Vistas de Oriana] " + m); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function ico(n, c) { return '<svg class="' + (c || "ico") + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function lleno(v) { return v != null && String(v).trim() !== ""; }
  var ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

  /* ---------- Fotos: Unsplash se pide en WebP y al tamaño justo; las del chalet se usan tal cual ---------- */
  function foto(url, w, h) {
    if (!url) return "";
    if (url.indexOf("https://images.unsplash.com/") !== 0) return url;
    return url + "?w=" + w + "&q=70&fm=webp&fit=crop" + (h ? "&h=" + h : "");
  }
  function srcset(url, anchos, prop) {
    if (url.indexOf("https://images.unsplash.com/") !== 0) return "";
    return anchos.map(function (w) { return foto(url, w, prop ? Math.round(w * prop) : 0) + " " + w + "w"; }).join(", ");
  }
  function img(f, w, prop, sizes, extra) {
    var ss = srcset(f.foto, [w / 2 | 0, w, w * 2], prop);
    return '<img src="' + esc(foto(f.foto, w, prop ? Math.round(w * prop) : 0)) + '"' + (ss ? ' srcset="' + esc(ss) + '" sizes="' + sizes + '"' : "") +
      ' width="' + w + '" height="' + Math.round(w * (prop || 0.66)) + '" alt="' + esc(f.alt || "") + '" loading="lazy" decoding="async"' + (extra || "") + ">";
  }

  /* ---------- WhatsApp ---------- */
  function cfg() { return D.config || {}; }
  function linkWA(msg) { return "https://wa.me/" + (cfg().whatsapp || "") + "?text=" + encodeURIComponent(msg || cfg().mensaje_whatsapp || ""); }
  function aplicarConfig() {
    var c = cfg();
    $$("[data-wa]").forEach(function (a) { a.href = linkWA(a.getAttribute("data-wa-msg") || ""); });
    if (lleno(c.logo)) $$("[data-logo]").forEach(function (i) { i.src = c.logo; });
    var ig = (c.instagram || "").replace(/^@/, "").trim();
    $$("[data-instagram]").forEach(function (s) {
      s.innerHTML = ig ? '<a class="pie-red" href="https://www.instagram.com/' + esc(ig) + '/" target="_blank" rel="noopener noreferrer">' + ico("instagram") + "@" + esc(ig) + "</a>" : "";
    });
    var fp = $("[data-foto-portada]");
    if (fp && lleno(c.foto_portada) && fp.getAttribute("data-origen") !== c.foto_portada) {
      if (c.foto_portada.indexOf("https://images.unsplash.com/") !== 0) { fp.removeAttribute("srcset"); fp.src = c.foto_portada; }
    }
    /* Video de la portada: si config.json trae video_portada, va dentro del círculo (no en teléfono con ahorro de datos) */
    var vista = $("[data-vista]");
    var ahorro = navigator.connection && navigator.connection.saveData;
    if (vista && lleno(c.video_portada) && !ahorro && !QUIETO && !$("video", vista)) {
      var v = document.createElement("video");
      v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.preload = "metadata";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
      v.src = c.video_portada;
      vista.appendChild(v);
    }
  }

  /* ---------- Pintar secciones ---------- */
  function datosHab(h) {
    var d = [];
    if (lleno(h.personas)) d.push(ico("personas") + "<span>" + esc(h.personas) + "</span>");
    if (lleno(h.cama)) d.push(ico("cama") + "<span>" + esc(h.cama) + "</span>");
    if (lleno(h.vista)) d.push(ico("vista", "ico ico-violeta") + "<span>" + esc(h.vista) + "</span>");
    return d.length ? '<ul class="datos-hab">' + d.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" : "";
  }
  function habitacionesValidas() {
    var vistos = {};
    return (D.habitaciones || []).filter(function (h, i) {
      if (!h || !lleno(h.id) || !lleno(h.nombre)) { aviso("La habitación #" + (i + 1) + " no tiene id o nombre: no se muestra."); return false; }
      if (vistos[h.id]) { aviso("El id \"" + h.id + "\" está repetido en habitaciones.json."); return false; }
      if (h.activa === false) return false;
      vistos[h.id] = 1; return true;
    });
  }
  function lamina(h, i) {
    var f = (h.fotos && h.fotos[0]) || { foto: "", alt: "" };
    var url = "habitacion.html?id=" + encodeURIComponent(h.id);
    return '<article class="lamina">' +
      '<a class="lamina-foto" href="' + url + '" tabindex="-1" aria-hidden="true"><span class="lamina-mascara">' + img(f, 600, 1.25, "(min-width: 900px) 30vw, 92vw") + "</span></a>" +
      '<div class="lamina-texto">' +
      '<p class="lamina-num">Lámina ' + (ROMANOS[i] || i + 1) + "</p>" +
      '<h3 class="lamina-nombre"><a href="' + url + '">' + esc(h.nombre) + "</a></h3>" +
      (lleno(h.linea) ? '<p class="lamina-linea">' + esc(h.linea) + "</p>" : "") +
      datosHab(h) +
      '<div class="lamina-botones">' +
      '<a class="enlace" href="' + url + '">Ver habitación</a>' +
      '<button class="boton boton-naranja boton-chico" type="button" data-cotizar data-habitacion="' + esc(h.id) + '">Consultar disponibilidad</button>' +
      "</div></div></article>";
  }
  function pintar(clave, html) { var el = $('[data-pinta="' + clave + '"]'); if (el) el.innerHTML = html; return el; }

  function pintarTodo() {
    var habs = habitacionesValidas();
    pintar("habitaciones", habs.map(lamina).join(""));

    var c = cfg();
    pintar("momentos", (c.momentos || []).map(function (m, i) {
      return '<figure class="momento">' + img(m, 720, 1.2, "(min-width: 900px) 34vw, 78vw") +
        '<figcaption><span class="momento-hora">' + (i + 1) + " de " + c.momentos.length + "</span><strong>" + esc(m.titulo) + "</strong>" + esc(m.texto) + "</figcaption></figure>";
    }).join(""));

    var s = D.servicios || {};
    pintar("servicios-nota", esc(s.nota || ""));
    pintar("servicios", (s.lista || []).filter(function (x) { return x && lleno(x.nombre); }).map(function (x) {
      return "<li>" + ico(x.icono || "hoja", "ico ico-serv") + "<span>" + esc(x.nombre) + "</span></li>";
    }).join(""));

    pintar("galeria", (c.galeria || []).map(function (g, i) {
      return '<button class="mosaico-item" type="button" data-visor="galeria" data-i="' + i + '" aria-label="Ver en grande: ' + esc(g.alt) + '">' + img(g, 700, i % 5 === 0 ? 1.3 : 0.8, "(min-width: 900px) 33vw, 50vw") + "</button>";
    }).join(""));

    pintar("preguntas", (D.preguntas || []).filter(function (p) { return p && lleno(p.pregunta); }).map(function (p, i) {
      return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(p.pregunta) + '<span class="acordeon-signo" aria-hidden="true"></span></summary><p>' + esc(p.respuesta) +
        ' <a href="' + esc(linkWA("Hola Chalet Vistas de Oriana, tengo una pregunta: " + p.pregunta)) + '" data-wa data-wa-msg="' + esc("Hola Chalet Vistas de Oriana, tengo una pregunta: " + p.pregunta) + '" target="_blank" rel="noopener noreferrer">Escribir</a></p></details>';
    }).join(""));

    pintarFicha(habs);

    var sel = $("[data-lista-habitaciones]");
    if (sel) sel.innerHTML = '<option value="">Todavía no sé</option>' + habs.map(function (h) { return '<option value="' + esc(h.id) + '">' + esc(h.nombre) + "</option>"; }).join("");
    aplicarConfig();
  }

  function pintarFicha(habs) {
    var ficha = $('[data-pinta="ficha"]');
    if (!ficha) return;
    var id = params.get("id");
    var h = null, pos = -1;
    habs.forEach(function (x, i) { if (x.id === id) { h = x; pos = i; } });
    if (!h) {
      if (HORNEAR) { ficha.setAttribute("data-hornear", "no"); pintar("otras", habs.map(lamina).join("")); return; }
      location.replace("index.html#habitaciones");
      return;
    }
    document.title = h.nombre + " | Chalet Vistas de Oriana";
    var fotos = (h.fotos || []).filter(function (f) { return f && lleno(f.foto); });
    var incluye = (h.incluye || []).filter(lleno);
    var msg = "Hola Chalet Vistas de Oriana, quiero información de la " + h.nombre + ".";
    ficha.innerHTML =
      '<div class="ficha-fotos">' +
      '<div class="carrusel" tabindex="0" aria-label="Fotos de ' + esc(h.nombre) + ', deslice para ver más">' +
      fotos.map(function (f, i) {
        return '<button class="carrusel-foto" type="button" data-visor="ficha" data-i="' + i + '" aria-label="Ver en grande: ' + esc(f.alt) + '">' +
          img(f, 1200, 0.75, "(min-width: 900px) 58vw, 100vw", i === 0 ? ' fetchpriority="high"' : "").replace(i === 0 ? ' loading="lazy"' : "@@", "") + "</button>";
      }).join("") + "</div>" +
      (fotos.length > 1 ? '<div class="carrusel-puntos" aria-hidden="true">' + fotos.map(function (_, i) { return "<span" + (i ? "" : ' class="activo"') + "></span>"; }).join("") + "</div>" +
        '<button class="carrusel-flecha carrusel-ant" type="button" aria-label="Foto anterior">' + ico("izq") + "</button>" +
        '<button class="carrusel-flecha carrusel-sig" type="button" aria-label="Foto siguiente">' + ico("der") + "</button>" : "") +
      "</div>" +
      '<div class="ficha-texto">' +
      '<p class="lamina-num">Lámina ' + (ROMANOS[pos] || pos + 1) + "</p>" +
      "<h1>" + esc(h.nombre) + "</h1>" +
      (lleno(h.linea) ? '<p class="ficha-linea">' + esc(h.linea) + "</p>" : "") +
      (lleno(h.descripcion) ? "<p>" + esc(h.descripcion) + "</p>" : "") +
      datosHab(h) +
      (incluye.length ? '<h2 class="ficha-sub">Incluye</h2><ul class="ficha-incluye">' + incluye.map(function (x) { return "<li>" + ico("hoja") + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="ficha-botones">' +
      '<button class="boton boton-naranja" type="button" data-cotizar data-habitacion="' + esc(h.id) + '">Consultar disponibilidad</button>' +
      '<a class="boton boton-claro" href="' + esc(linkWA(msg)) + '" data-wa data-wa-msg="' + esc(msg) + '" target="_blank" rel="noopener noreferrer">' + ico("whatsapp") + "Preguntar por WhatsApp</a>" +
      "</div>" +
      (h.ejemplo ? '<p class="nota-ref">Habitación y fotos de referencia. Se reemplazan por las del chalet.</p>' : "") +
      "</div>";
    pintar("otras", habs.filter(function (x) { return x.id !== h.id; }).map(function (x) { return lamina(x, habs.indexOf(x)); }).join(""));
    carrusel(ficha);
  }

  function carrusel(cont) {
    var pista = $(".carrusel", cont); if (!pista) return;
    var puntos = $$(".carrusel-puntos span", cont);
    function ir(d) { pista.scrollBy({ left: d * pista.clientWidth, behavior: QUIETO ? "auto" : "smooth" }); }
    var a = $(".carrusel-ant", cont), s = $(".carrusel-sig", cont);
    if (a) a.addEventListener("click", function () { ir(-1); });
    if (s) s.addEventListener("click", function () { ir(1); });
    pista.addEventListener("scroll", function () {
      var i = Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth));
      puntos.forEach(function (p, k) { p.classList.toggle("activo", k === i); });
    }, { passive: true });
  }

  /* ---------- Cotizador ---------- */
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function fecha(s) { var p = (s || "").split("-"); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function rango(a, b) {
    var hoy = new Date().getFullYear();
    var ya = a.getFullYear() !== b.getFullYear() || a.getFullYear() !== hoy;
    var t1 = a.getDate() + (a.getMonth() !== b.getMonth() || a.getFullYear() !== b.getFullYear() ? " de " + MESES[a.getMonth()] : "") + (a.getFullYear() !== b.getFullYear() ? " de " + a.getFullYear() : "");
    var t2 = b.getDate() + " de " + MESES[b.getMonth()] + (ya ? " de " + b.getFullYear() : "");
    return "del " + t1 + " al " + t2;
  }
  function noches(a, b) { return Math.round((b - a) / 86400000); }

  function iniciarCotizador() {
    var cot = $("#cotizador"); if (!cot) return;
    var form = $("form", cot), selH = $("[data-lista-habitaciones]", cot);
    var lleg = $('[name="llegada"]', cot), sal = $('[name="salida"]', cot);
    var txtN = $("[data-noches]", cot), err = $("[data-error]", cot);
    var ultimoFoco = null;
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    lleg.min = iso(hoy);
    function manana(d) { var x = new Date(d); x.setDate(x.getDate() + 1); return x; }
    function actualizar() {
      var a = fecha(lleg.value), b = fecha(sal.value);
      sal.min = iso(a ? manana(a) : manana(hoy));
      if (a && b && b <= a) { sal.value = ""; b = null; }
      var n = a && b ? noches(a, b) : 0;
      txtN.textContent = n > 0 ? "🌙 " + n + (n === 1 ? " noche" : " noches") : "";
      err.textContent = "";
    }
    lleg.addEventListener("change", actualizar);
    sal.addEventListener("change", actualizar);
    $$("[data-contador]", cot).forEach(function (c) {
      var out = $("output", c), min = +c.getAttribute("data-min");
      $$("[data-paso]", c).forEach(function (b) {
        b.addEventListener("click", function () {
          var v = Math.max(min, Math.min(20, (+out.value || +out.textContent) + +b.getAttribute("data-paso")));
          out.value = v; out.textContent = v;
        });
      });
    });
    function abrir(idHab) {
      ultimoFoco = document.activeElement;
      if (idHab != null) selH.value = idHab;
      cot.hidden = false;
      document.body.classList.add("con-modal");
      requestAnimationFrame(function () { cot.classList.add("abierto"); });
      setTimeout(function () { (idHab ? lleg : selH).focus({ preventScroll: true }); }, 60);
    }
    function cerrar() {
      cot.classList.remove("abierto");
      document.body.classList.remove("con-modal");
      setTimeout(function () { cot.hidden = true; if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus({ preventScroll: true }); }, QUIETO ? 0 : 280);
    }
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-cotizar]");
      if (b) { ev.preventDefault(); abrir(b.getAttribute("data-habitacion") || (params.get("id") && $(".p-ficha") ? params.get("id") : "")); }
      if (ev.target.closest && ev.target.closest("[data-cerrar]")) cerrar();
    });
    document.addEventListener("keydown", function (ev) {
      if (cot.hidden) return;
      if (ev.key === "Escape") cerrar();
      if (ev.key === "Tab") {
        var f = $$("button, select, input, textarea, [href]", cot).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
        else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var a = fecha(lleg.value), b = fecha(sal.value);
      if (!a) { err.textContent = "Elija la fecha de llegada, por favor."; lleg.focus(); return; }
      if (a < hoy) { err.textContent = "La llegada no puede ser un día que ya pasó."; lleg.focus(); return; }
      if (!b) { err.textContent = "Elija la fecha de salida, por favor."; sal.focus(); return; }
      if (b <= a) { err.textContent = "La salida tiene que ser después de la llegada."; sal.focus(); return; }
      var ad = +$('[data-contador="adultos"] output', cot).textContent, ni = +$('[data-contador="ninos"] output', cot).textContent;
      var opt = selH.options[selH.selectedIndex];
      var hab = selH.value ? opt.textContent : "todavía no sé qué habitación";
      var n = noches(a, b);
      var personas = ad + (ad === 1 ? " adulto" : " adultos") + (ni ? " y " + ni + (ni === 1 ? " niño" : " niños") : "");
      var m = "Hola Chalet Vistas de Oriana, quiero consultar disponibilidad: " + hab + ", " + rango(a, b) + " (" + n + (n === 1 ? " noche" : " noches") + "), " + personas + ".";
      var nota = $('[name="nota"]', cot).value.trim();
      if (nota) m += "\nAlgo más: " + nota;
      var url = linkWA(m);
      var w = window.open(url, "_blank", "noopener");
      if (!w) location.href = url;
    });
    window.__cotizar = abrir;
  }

  /* ---------- Visor de fotos ---------- */
  function iniciarVisor() {
    var v = $("#visor"); if (!v) return;
    var im = $("[data-visor-img]", v), tx = $("[data-visor-txt]", v);
    var lista = [], i = 0, foco = null;
    function mostrar() {
      var f = lista[i]; if (!f) return;
      im.src = foto(f.foto, 1600); im.alt = f.alt || ""; tx.textContent = (f.alt || "") + " (" + (i + 1) + " de " + lista.length + ")";
    }
    function cerrar() { v.hidden = true; document.body.classList.remove("con-modal"); if (foco) foco.focus({ preventScroll: true }); }
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-visor]");
      if (b) {
        var cual = b.getAttribute("data-visor");
        if (cual === "galeria") lista = cfg().galeria || [];
        else { var h = habitacionesValidas().filter(function (x) { return x.id === params.get("id"); })[0]; lista = (h && h.fotos) || []; }
        i = +b.getAttribute("data-i") || 0; foco = b;
        mostrar(); v.hidden = false; document.body.classList.add("con-modal"); $(".visor-cerrar", v).focus();
      }
    });
    $(".visor-cerrar", v).addEventListener("click", cerrar);
    $(".visor-ant", v).addEventListener("click", function () { i = (i - 1 + lista.length) % lista.length; mostrar(); });
    $(".visor-sig", v).addEventListener("click", function () { i = (i + 1) % lista.length; mostrar(); });
    v.addEventListener("click", function (ev) { if (ev.target === v || ev.target.tagName === "FIGURE") cerrar(); });
    document.addEventListener("keydown", function (ev) {
      if (v.hidden) return;
      if (ev.key === "Escape") cerrar();
      if (ev.key === "ArrowLeft") $(".visor-ant", v).click();
      if (ev.key === "ArrowRight") $(".visor-sig", v).click();
    });
    var x0 = null;
    v.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    v.addEventListener("touchend", function (ev) {
      if (x0 == null) return; var dx = ev.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) (dx < 0 ? $(".visor-sig", v) : $(".visor-ant", v)).click();
    });
  }

  /* ---------- Movimiento ---------- */
  var ESCRITORIO = window.matchMedia && matchMedia("(min-width: 900px) and (hover: hover)").matches;

  function observar() {
    if (QUIETO || !("IntersectionObserver" in window)) { $$(".divisor, .lamina").forEach(function (el) { el.classList.add("dibujado", "entro"); }); return; }
    /* Espirales divisoras: se dibujan al entrar (en el teléfono, una a la vez: están lejos entre sí) */
    var io = new IntersectionObserver(function (ent) {
      ent.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("dibujado"); io.unobserve(x.target); } });
    }, { threshold: 0.6 });
    $$(".divisor, .ubicacion-espiral").forEach(function (d) { io.observe(d); });
    /* Láminas: entran en cascada y la foto se aclara desde el marco (siempre visibles) */
    if (!ESCRITORIO) {
      var io2 = new IntersectionObserver(function (ent) {
        ent.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("entro"); io2.unobserve(x.target); } });
      }, { threshold: 0.25 });
      $$(".lamina").forEach(function (l) { io2.observe(l); });
    }
  }

  function inclinar() {
    if (QUIETO || !ESCRITORIO) return;
    $$(".lamina").forEach(function (l) {
      l.addEventListener("pointermove", function (ev) {
        var r = l.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
        l.style.transform = "perspective(900px) rotateX(" + (-y * 4).toFixed(2) + "deg) rotateY(" + (x * 4).toFixed(2) + "deg) translateY(-4px)";
      });
      l.addEventListener("pointerleave", function () { l.style.transform = ""; });
    });
  }

  function cargar(src) {
    return new Promise(function (ok, mal) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
  }
  function conGsap() {
    if (QUIETO || !ESCRITORIO || HORNEAR) return;
    var base = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/";
    cargar(base + "gsap.min.js").then(function () { return cargar(base + "ScrollTrigger.min.js"); }).then(function () {
      var g = window.gsap; g.registerPlugin(window.ScrollTrigger);
      /* Láminas en cascada: solo se mueven y la máscara se abre; nunca empiezan escondidas */
      var laminas = $$(".laminas");
      laminas.forEach(function (grupo) {
        var ls = $$(".lamina", grupo);
        g.fromTo(ls, { y: 36 }, { y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12, scrollTrigger: { trigger: grupo, start: "top 85%" } });
        ls.forEach(function (l) { g.fromTo($(".lamina-mascara img", l), { scale: 1.12 }, { scale: 1, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: grupo, start: "top 85%" } }); });
        ls.forEach(function (l) { l.classList.add("entro"); });
      });
      /* Lo que se vive aquí: la franja avanza de lado al bajar */
      var sec = $(".momentos"), pista = $(".momentos-pista");
      if (sec && pista) {
        var dist = function () { return Math.max(0, pista.scrollWidth - pista.clientWidth); };
        if (dist() > 80) {
          sec.classList.add("con-pin");
          g.to(pista, {
            x: function () { return -dist(); }, ease: "none",
            scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true }
          });
        }
      }
    }).catch(function () { aviso("No cargó GSAP: la página sigue igual, sin el movimiento al bajar."); });
  }

  /* ---------- Datos frescos en línea ---------- */
  function leerJSON() {
    if (!/^https?:/.test(location.protocol) || !window.fetch) return Promise.resolve(false);
    var nombres = ["config", "habitaciones", "servicios", "preguntas"];
    return Promise.all(nombres.map(function (n) {
      return fetch("datos/" + n + ".json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(function (e) { aviso("No se pudo leer datos/" + n + ".json (" + e.message + "). Revise comas, comillas y llaves."); return null; });
    })).then(function (res) {
      var cambio = false;
      res.forEach(function (v, i) { if (v) { D[nombres[i]] = v; cambio = true; } });
      return cambio;
    });
  }

  function arrancar() {
    try { pintarTodo(); } catch (e) { aviso("Error al pintar: " + e.message); }
    raiz.dataset.pintado = "1";
    iniciarCotizador();
    iniciarVisor();
    leerJSON().then(function (cambio) {
      if (cambio) { try { pintarTodo(); } catch (e) { aviso("Error al pintar: " + e.message); } }
      observar(); inclinar(); conGsap();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
