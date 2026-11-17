/* Chalet Vistas de Oriana. Todo el contenido sale de datos/*.json.
   En línea se leen los JSON frescos; con doble clic (file://) se usa la copia que va dentro de la página. */
(function () {
  "use strict";
  var raiz = document.documentElement;
  raiz.classList.add("js");
  var params = new URLSearchParams(location.search);
  var HORNEAR = params.has("hornear");
  var QUIETO = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ESCRITORIO = window.matchMedia && matchMedia("(min-width: 900px) and (hover: hover)").matches;
  var D = {};
  try { D = JSON.parse(document.getElementById("datos-chalet").textContent); } catch (err) { D = {}; }

  function aviso(m) { if (window.console) console.warn("[Vistas de Oriana] " + m); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function ico(n, c) { return '<svg class="' + (c || "ico") + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }
  function lleno(v) { return v != null && String(v).trim() !== ""; }
  var ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  function romano(i) { return ROMANOS[i] || String(i + 1); }

  /* ---------- Fotos: Unsplash se pide en WebP y al tamaño justo; las del chalet se usan tal cual ---------- */
  function esUnsplash(u) { return String(u).indexOf("https://images.unsplash.com/") === 0; }
  function foto(url, w, h) {
    if (!url) return "";
    if (!esUnsplash(url)) return url;
    return url + "?w=" + w + "&q=70&fm=webp&fit=crop" + (h ? "&h=" + h : "");
  }
  function img(f, w, prop, sizes, extra) {
    var alto = prop ? Math.round(w * prop) : 0;
    var ss = esUnsplash(f.foto) ? [w / 2 | 0, w, w * 2].map(function (a) { return foto(f.foto, a, prop ? Math.round(a * prop) : 0) + " " + a + "w"; }).join(", ") : "";
    return '<img src="' + esc(foto(f.foto, w, alto)) + '"' + (ss ? ' srcset="' + esc(ss) + '" sizes="' + sizes + '"' : "") +
      ' width="' + w + '" height="' + (alto || Math.round(w * 0.66)) + '" alt="' + esc(f.alt || "") + '"' + (extra && extra.indexOf("eager") > -1 ? "" : ' loading="lazy"') + ' decoding="async"' + (extra ? extra.replace("eager", "") : "") + ">";
  }

  /* ---------- WhatsApp y marca ---------- */
  function cfg() { return D.config || {}; }
  function linkWA(msg) { return "https://wa.me/" + (cfg().whatsapp || "") + "?text=" + encodeURIComponent(msg || cfg().mensaje_whatsapp || ""); }
  function abrirWA(msg) { var u = linkWA(msg); var w = window.open(u, "_blank", "noopener"); if (!w) location.href = u; }
  function aplicarConfig() {
    var c = cfg();
    $$("[data-wa]").forEach(function (a) { a.href = linkWA(a.getAttribute("data-wa-msg") || ""); });
    if (lleno(c.logo)) $$("[data-logo]").forEach(function (i) { if (i.getAttribute("src") !== c.logo) i.src = c.logo; });
    var ig = (c.instagram || "").replace(/^@/, "").trim();
    $$("[data-instagram]").forEach(function (s) {
      s.innerHTML = ig ? '<a class="pie-red" href="https://www.instagram.com/' + esc(ig) + '/" target="_blank" rel="noopener noreferrer">' + ico("instagram") + "@" + esc(ig) + "</a>" : "";
    });
    var fp = $("[data-foto-portada]");
    if (fp && lleno(c.foto_portada) && !esUnsplash(c.foto_portada)) { fp.removeAttribute("srcset"); fp.src = c.foto_portada; }
    var vista = $("[data-vista]"), ahorro = navigator.connection && navigator.connection.saveData;
    if (vista && lleno(c.video_portada) && !ahorro && !QUIETO && !$("video", vista)) {
      var v = document.createElement("video");
      v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.preload = "metadata";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
      v.src = c.video_portada; vista.appendChild(v);
    }
  }

  /* ---------- Habitaciones ---------- */
  function habitacionesValidas() {
    var vistos = {};
    return (D.habitaciones || []).filter(function (h, i) {
      if (!h || !lleno(h.id) || !lleno(h.nombre)) { aviso("La habitación #" + (i + 1) + " no tiene id o nombre: no se muestra."); return false; }
      if (vistos[h.id]) { aviso("El id \"" + h.id + "\" está repetido en habitaciones.json."); return false; }
      if (h.activa === false) return false;
      vistos[h.id] = 1; return true;
    });
  }
  function datosHab(h) {
    var d = [];
    if (lleno(h.personas)) d.push(ico("personas") + "<span>" + esc(h.personas) + "</span>");
    if (lleno(h.cama)) d.push(ico("cama") + "<span>" + esc(h.cama) + "</span>");
    if (lleno(h.vista)) d.push(ico("vista", "ico ico-violeta") + "<span>" + esc(h.vista) + "</span>");
    return d.length ? '<ul class="datos-hab">' + d.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" : "";
  }
  function urlHab(h) { return "habitacion.html?id=" + encodeURIComponent(h.id); }
  function fotoHab(h, k) { return (h.fotos && h.fotos[k || 0]) || { foto: "", alt: "" }; }
  function botonConsultar(h, chico) {
    return '<button class="boton boton-naranja' + (chico ? " boton-chico" : "") + '" type="button" data-cotizar data-habitacion="' + esc(h.id) + '">Consultar disponibilidad</button>';
  }
  function lamina(h, i) {
    var url = urlHab(h);
    return '<article class="lamina">' +
      '<a class="lamina-foto" href="' + url + '" tabindex="-1" aria-hidden="true"><span class="lamina-mascara">' + img(fotoHab(h), 600, 1.25, "(min-width: 900px) 30vw, 92vw") + "</span></a>" +
      '<div class="lamina-texto"><p class="lamina-num">Lámina ' + romano(i) + "</p>" +
      '<h3 class="lamina-nombre"><a href="' + url + '">' + esc(h.nombre) + "</a></h3>" +
      (lleno(h.linea) ? '<p class="lamina-linea">' + esc(h.linea) + "</p>" : "") + datosHab(h) +
      '<div class="lamina-botones"><a class="enlace" href="' + url + '">Ver habitación</a>' + botonConsultar(h, true) + "</div></div></article>";
  }
  /* Lámina que se voltea: al frente la foto; al dorso la ficha de herbario */
  function laminaVolteo(h, i) {
    var url = urlHab(h), tags = (h.ideal_para || []).filter(lleno);
    var incluye = (h.incluye || []).filter(lleno);
    var mini = (h.fotos || []).slice(0, 3).map(function (f) { return '<span class="dorso-mini">' + img(f, 200, 1, "120px") + "</span>"; }).join("");
    return '<article class="lamina lamina-v" data-tags="' + esc(tags.join("|")) + '">' +
      '<div class="lamina-giro">' +
      '<div class="lamina-cara lamina-frente">' +
      '<a class="lamina-foto" href="' + url + '" tabindex="-1" aria-hidden="true"><span class="lamina-mascara">' + img(fotoHab(h), 600, 1.25, "(min-width: 900px) 30vw, 92vw") + "</span></a>" +
      '<div class="lamina-texto"><p class="lamina-num">Lámina ' + romano(i) + "</p>" +
      '<h3 class="lamina-nombre"><a href="' + url + '">' + esc(h.nombre) + "</a></h3>" +
      (lleno(h.linea) ? '<p class="lamina-linea">' + esc(h.linea) + "</p>" : "") +
      '<div class="lamina-botones"><button class="enlace enlace-boton" type="button" data-voltear aria-label="Ver al dorso: ' + esc(h.nombre) + '">' + ico("girar") + "Ver al dorso</button>" + botonConsultar(h, true) + "</div></div></div>" +
      '<div class="lamina-cara lamina-dorso" aria-hidden="true" inert>' +
      '<p class="lamina-num">Lámina ' + romano(i) + ", al dorso</p>" +
      '<h3 class="lamina-nombre">' + esc(h.nombre) + "</h3>" +
      (lleno(h.descripcion) ? '<p class="dorso-texto">' + esc(h.descripcion) + "</p>" : "") +
      (tags.length ? '<p class="dorso-sub">Ideal para</p><ul class="etiquetas">' + tags.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
      datosHab(h) +
      (incluye.length ? '<p class="dorso-sub">Incluye</p><ul class="etiquetas">' + incluye.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
      (mini ? '<div class="dorso-fotos">' + mini + "</div>" : "") +
      '<div class="lamina-botones"><a class="enlace" href="' + url + '">Ver fotos y detalles</a>' + botonConsultar(h, true) + "</div>" +
      '<button class="dorso-volver" type="button" data-voltear aria-label="Volver al frente: ' + esc(h.nombre) + '">' + ico("girar") + "Volver al frente</button>" +
      "</div></div></article>";
  }

  /* ---------- Pintar ---------- */
  function pintar(clave, html) { var el = $('[data-pinta="' + clave + '"]'); if (el) el.innerHTML = html; return el; }
  function preguntaHTML(p, i) {
    var m = "Hola Chalet Vistas de Oriana, tengo una pregunta: " + p.pregunta;
    return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(p.pregunta) + '<span class="acordeon-signo" aria-hidden="true"></span></summary><p>' + esc(p.respuesta) +
      ' <a href="' + esc(linkWA(m)) + '" data-wa data-wa-msg="' + esc(m) + '" target="_blank" rel="noopener noreferrer">Escribir</a></p></details>';
  }
  function mosaicoHTML(lista, desde) {
    return lista.map(function (g, i) {
      var prop = [1.3, 0.75, 1, 1.25, 0.8, 1.1][i % 6];
      return '<button class="mosaico-item" type="button" data-visor="' + desde + '" data-i="' + i + '" data-cat="' + esc(g.categoria || "") + '" aria-label="Ver en grande: ' + esc(g.alt) + '">' + img(g, 640, prop, "(min-width: 900px) 33vw, 50vw") + "</button>";
    }).join("");
  }
  function experiencias() { return ((D.experiencias || {}).lista || []).filter(function (x) { return x && lleno(x.id) && lleno(x.nombre); }); }

  function pintarTodo() {
    var habs = habitacionesValidas(), c = cfg();
    pintar("habitaciones", habs.slice(0, 3).map(lamina).join(""));
    pintar("habitaciones-todas", habs.map(laminaVolteo).join(""));
    var tags = [];
    habs.forEach(function (h) { (h.ideal_para || []).forEach(function (t) { if (lleno(t) && tags.indexOf(t) < 0) tags.push(t); }); });
    pintar("filtros", ['<button type="button" class="chip-boton" data-filtro="" aria-pressed="true">Todas</button>'].concat(tags.map(function (t) {
      return '<button type="button" class="chip-boton" data-filtro="' + esc(t) + '" aria-pressed="false">' + esc(t) + "</button>";
    })).join(""));

    pintar("momentos", (c.momentos || []).map(function (m, i) {
      return '<figure class="momento">' + img(m, 720, 1.2, "(min-width: 900px) 34vw, 78vw") +
        '<figcaption><span class="momento-hora">' + (i + 1) + " de " + c.momentos.length + "</span><strong>" + esc(m.titulo) + "</strong>" + esc(m.texto) + "</figcaption></figure>";
    }).join(""));

    var s = D.servicios || {};
    pintar("servicios-nota", esc(s.nota || ""));
    pintar("servicios", (s.lista || []).filter(function (x) { return x && lleno(x.nombre); }).map(function (x) {
      return "<li>" + ico(x.icono || "hoja", "ico ico-serv") + "<span>" + esc(x.nombre) + "</span></li>";
    }).join(""));

    var gal = c.galeria || [];
    pintar("galeria-inicio", mosaicoHTML(gal.slice(0, 6), "galeria"));
    pintar("galeria", mosaicoHTML(gal, "galeria"));
    var cats = c.categorias_galeria || {};
    pintar("filtros-galeria", ['<button type="button" class="chip-boton" data-filtro-galeria="" aria-pressed="true">Todas</button>'].concat(Object.keys(cats).map(function (k) {
      return '<button type="button" class="chip-boton" data-filtro-galeria="' + esc(k) + '" aria-pressed="false">' + esc(cats[k]) + "</button>";
    })).join(""));

    var preg = (D.preguntas || []).filter(function (p) { return p && lleno(p.pregunta); });
    pintar("preguntas-inicio", preg.slice(0, 3).map(preguntaHTML).join(""));
    pintar("preguntas", preg.map(preguntaHTML).join(""));

    var esp = (c.espacios || []).filter(function (x) { return x && lleno(x.titulo); });
    pintar("recorrido-fotos", esp.map(function (x, i) { return '<div class="recorrido-foto' + (i ? "" : " activa") + '" data-paso="' + i + '">' + img(x, 1000, 1.15, "45vw") + "</div>"; }).join(""));
    pintar("recorrido", esp.map(function (x, i) {
      return '<li class="recorrido-paso" data-paso="' + i + '"><span class="recorrido-num">' + (i < 9 ? "0" : "") + (i + 1) + "</span>" +
        '<div class="recorrido-foto-movil">' + img(x, 800, 0.8, "92vw") + "</div>" +
        "<h3>" + esc(x.titulo) + "</h3><p>" + esc(x.texto) + "</p></li>";
    }).join(""));

    var exps = experiencias(), momentosExp = (D.experiencias || {}).momentos || {};
    var porMomento = {};
    exps.forEach(function (x) { if (!porMomento[x.momento]) porMomento[x.momento] = x; });
    pintar("exp-inicio", Object.keys(porMomento).map(function (k) {
      var x = porMomento[k];
      return '<a class="tarjeta-exp" href="experiencias.html">' + img(x, 640, 0.75, "(min-width: 900px) 30vw, 88vw") +
        '<span class="tarjeta-exp-texto"><small>' + esc(momentosExp[k] || k) + "</small><strong>" + esc(x.nombre) + "</strong>" + esc(x.texto) + "</span></a>";
    }).join(""));
    pintar("exp-pestanas", ['<button type="button" role="tab" class="pestana" data-momento="" aria-selected="true">Todo el día</button>'].concat(Object.keys(momentosExp).map(function (k) {
      return '<button type="button" role="tab" class="pestana" data-momento="' + esc(k) + '" aria-selected="false">' + esc(momentosExp[k]) + "</button>";
    })).join(""));
    pintar("exp-lista", exps.map(function (x) {
      return '<article class="exp" data-exp="' + esc(x.id) + '" data-momento="' + esc(x.momento) + '">' + img(x, 360, 0.8, "(min-width: 900px) 14vw, 30vw") +
        '<div class="exp-texto"><small>' + esc(momentosExp[x.momento] || "") + "</small><h3>" + esc(x.nombre) + "</h3><p>" + esc(x.texto) + '</p><div class="exp-dias" data-exp-dias></div></div></article>';
    }).join(""));

    pintar("eleccion", habs.map(function (h, i) {
      return '<label class="eleccion-item"><input type="radio" name="habitacion" value="' + esc(h.id) + '"' + (params.get("habitacion") === h.id ? " checked" : "") + ">" +
        '<span class="eleccion-caja">' + img(fotoHab(h), 300, 0.75, "160px") + '<span class="eleccion-texto"><small>Lámina ' + romano(i) + "</small>" + esc(h.nombre) + "</span></span></label>";
    }).join("") + '<label class="eleccion-item eleccion-nose"><input type="radio" name="habitacion" value=""' + (params.get("habitacion") ? "" : "") + '><span class="eleccion-caja"><span class="eleccion-icono">' + ico("pregunta") + '</span><span class="eleccion-texto"><small>Sin decidir</small>Todavía no sé</span></span></label>');

    pintarFicha(habs);
    var sel = $("[data-lista-habitaciones]");
    if (sel) sel.innerHTML = '<option value="">Todavía no sé</option>' + habs.map(function (h) { return '<option value="' + esc(h.id) + '">' + esc(h.nombre) + "</option>"; }).join("");
    aplicarConfig();
  }

  function camposMini(h) {
    function cont(clave, txt, min, val) {
      return '<div class="campo contador" data-contador="' + clave + '" data-min="' + min + '"><span>' + txt + '</span><div class="contador-fila">' +
        '<button type="button" data-paso="-1" aria-label="' + txt + ': uno menos">' + ico("menos") + '</button><output aria-live="polite">' + val + "</output>" +
        '<button type="button" data-paso="1" aria-label="' + txt + ': uno más">' + ico("mas") + "</button></div></div>";
    }
    return '<form class="mini-armador" data-armador novalidate><input type="hidden" name="habitacion" value="' + esc(h.id) + '">' +
      '<p class="mini-titulo">' + ico("calendario") + "Consulte esta habitación</p>" +
      '<div class="campo-doble"><label class="campo"><span>Llegada</span><input type="date" name="llegada" required></label>' +
      '<label class="campo"><span>Salida</span><input type="date" name="salida" required></label></div>' +
      '<p class="noches" aria-live="polite" data-noches></p>' +
      '<div class="campo-doble">' + cont("adultos", "Adultos", 1, 2) + cont("ninos", "Niños", 0, 0) + "</div>" +
      '<p class="cotizador-error" role="alert" data-error></p>' +
      '<button class="boton boton-naranja boton-ancho" type="submit">' + ico("whatsapp") + "Consultar por WhatsApp</button></form>";
  }

  function pintarFicha(habs) {
    var ficha = $('[data-pinta="ficha"]');
    if (!ficha) return;
    var id = params.get("id"), h = null, pos = -1;
    habs.forEach(function (x, i) { if (x.id === id) { h = x; pos = i; } });
    if (!h) {
      if (HORNEAR) { ficha.setAttribute("data-hornear", "no"); pintar("otras", habs.map(lamina).join("")); return; }
      location.replace("habitaciones.html");
      return;
    }
    document.title = h.nombre + " | Chalet Vistas de Oriana";
    var fotos = (h.fotos || []).filter(function (f) { return f && lleno(f.foto); });
    var incluye = (h.incluye || []).filter(lleno), tags = (h.ideal_para || []).filter(lleno);
    var msg = "Hola Chalet Vistas de Oriana, quiero información de la " + h.nombre + ".";
    ficha.innerHTML =
      '<div class="ficha-fotos"><div class="carrusel" tabindex="0" aria-label="Fotos de ' + esc(h.nombre) + ', deslice para ver más">' +
      fotos.map(function (f, i) {
        return '<button class="carrusel-foto" type="button" data-visor="ficha" data-i="' + i + '" aria-label="Ver en grande: ' + esc(f.alt) + '">' +
          img(f, 1200, 0.75, "(min-width: 900px) 58vw, 100vw", i === 0 ? ' fetchpriority="high" eager' : "") + "</button>";
      }).join("") + "</div>" +
      (fotos.length > 1 ? '<div class="carrusel-puntos" aria-hidden="true">' + fotos.map(function (_, i) { return "<span" + (i ? "" : ' class="activo"') + "></span>"; }).join("") + "</div>" +
        '<button class="carrusel-flecha carrusel-ant" type="button" aria-label="Foto anterior">' + ico("izq") + "</button>" +
        '<button class="carrusel-flecha carrusel-sig" type="button" aria-label="Foto siguiente">' + ico("der") + "</button>" : "") +
      "</div>" +
      '<div class="ficha-texto">' +
      '<nav class="migas" aria-label="Ruta"><a href="habitaciones.html">Habitaciones</a> <span aria-hidden="true">/</span> <span>' + esc(h.nombre) + "</span></nav>" +
      '<p class="lamina-num">Lámina ' + romano(pos) + "</p>" +
      "<h1>" + esc(h.nombre) + "</h1>" +
      (lleno(h.linea) ? '<p class="ficha-linea">' + esc(h.linea) + "</p>" : "") +
      (lleno(h.descripcion) ? '<p class="ficha-desc">' + esc(h.descripcion) + "</p>" : "") +
      datosHab(h) +
      (tags.length ? '<p class="dorso-sub">Ideal para</p><ul class="etiquetas">' + tags.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
      (incluye.length ? '<h2 class="ficha-sub">Incluye</h2><ul class="ficha-incluye">' + incluye.map(function (x) { return "<li>" + ico("hoja") + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
      camposMini(h) +
      '<a class="boton boton-claro boton-ancho" href="' + esc(linkWA(msg)) + '" data-wa data-wa-msg="' + esc(msg) + '" target="_blank" rel="noopener noreferrer">' + ico("whatsapp") + "Preguntar otra cosa</a>" +
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

  /* ---------- Armador de consulta (modal, ficha y página Reservar) ---------- */
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function fecha(s) { var p = (s || "").split("-"); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function rango(a, b) {
    var hoy = new Date().getFullYear();
    var ya = a.getFullYear() !== b.getFullYear() || a.getFullYear() !== hoy;
    var t1 = a.getDate() + (a.getMonth() !== b.getMonth() || a.getFullYear() !== b.getFullYear() ? " de " + MESES[a.getMonth()] : "") + (a.getFullYear() !== b.getFullYear() ? " de " + a.getFullYear() : "");
    return "del " + t1 + " al " + b.getDate() + " de " + MESES[b.getMonth()] + (ya ? " de " + b.getFullYear() : "");
  }
  function noches(a, b) { return Math.round((b - a) / 86400000); }
  function hoyCero() { var h = new Date(); h.setHours(0, 0, 0, 0); return h; }
  function nombreHab(id) { var h = habitacionesValidas().filter(function (x) { return x.id === id; })[0]; return h ? h.nombre : ""; }

  function armador(form) {
    if (form.__armado) return; form.__armado = true;
    var lleg = $('[name="llegada"]', form), sal = $('[name="salida"]', form);
    var txtN = $("[data-noches]", form), err = $("[data-error]", form);
    var hoy = hoyCero(); lleg.min = iso(hoy);
    function manana(d) { var x = new Date(d); x.setDate(x.getDate() + 1); return x; }
    function valor(nombre) {
      var el = form.elements[nombre];
      if (!el) return "";
      if (el.length != null && el.tagName !== "SELECT") { for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value; return null; }
      return el.value;
    }
    function contador(k) { var o = $('[data-contador="' + k + '"] output', form); return o ? +o.textContent : 0; }
    function mensaje() {
      var a = fecha(lleg.value), b = fecha(sal.value);
      if (!a || !b || b <= a) return "";
      var idH = valor("habitacion"), ad = contador("adultos"), ni = contador("ninos"), n = noches(a, b);
      var hab = idH ? nombreHab(idH) : "todavía no sé qué habitación";
      var m = "Hola Chalet Vistas de Oriana, quiero consultar disponibilidad: " + hab + ", " + rango(a, b) + " (" + n + (n === 1 ? " noche" : " noches") + "), " +
        ad + (ad === 1 ? " adulto" : " adultos") + (ni ? " y " + ni + (ni === 1 ? " niño" : " niños") : "") + ".";
      var mot = valor("motivo"), hora = valor("hora"), nota = form.elements.nota ? form.elements.nota.value.trim() : "";
      if (mot) m += "\nMotivo del viaje: " + mot + ".";
      if (hora) m += "\nLlegada aproximada: " + hora.toLowerCase() + ".";
      if (nota) m += "\nAlgo más: " + nota;
      return m;
    }
    function actualizar() {
      var a = fecha(lleg.value), b = fecha(sal.value);
      sal.min = iso(a ? manana(a) : manana(hoy));
      if (a && b && b <= a) { sal.value = ""; b = null; }
      var n = a && b ? noches(a, b) : 0;
      txtN.textContent = n > 0 ? "🌙 " + n + (n === 1 ? " noche" : " noches") : "";
      err.textContent = "";
      var vm = $("[data-vista-mensaje]", form);
      if (vm) { var m = mensaje(); vm.textContent = m || "Complete las fechas para ver su consulta."; vm.classList.toggle("lista", !!m); }
      progreso();
    }
    /* La espiral se completa: cada dato que se llena dibuja un tramo */
    function progreso() {
      var trazo = $("[data-progreso]"); if (!trazo || !form.hasAttribute("data-completo")) return;
      var pasos = [valor("habitacion") !== null, !!lleg.value, !!sal.value, !!valor("motivo"), !!valor("hora")];
      var hechos = pasos.filter(Boolean).length, p = hechos / pasos.length;
      trazo.style.strokeDashoffset = String(1 - p);
      var caja = trazo.closest(".reservar-intro");
      if (caja) caja.classList.toggle("completa", p === 1);
      var t = $("[data-progreso-texto]");
      if (t) t.textContent = p === 0 ? "La espiral se completa con su consulta." : p === 1 ? "¡Lista! Su consulta está completa." : hechos + " de " + pasos.length + " datos listos.";
    }
    form.addEventListener("input", actualizar);
    form.addEventListener("change", actualizar);
    $$("[data-contador]", form).forEach(function (c) {
      var out = $("output", c), min = +c.getAttribute("data-min");
      $$("[data-paso]", c).forEach(function (b) {
        b.addEventListener("click", function () {
          var v = Math.max(min, Math.min(20, +out.textContent + +b.getAttribute("data-paso")));
          out.textContent = v; actualizar();
        });
      });
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var a = fecha(lleg.value), b = fecha(sal.value);
      if (!a) { err.textContent = "Elija la fecha de llegada, por favor."; lleg.focus(); return; }
      if (a < hoy) { err.textContent = "La llegada no puede ser un día que ya pasó."; lleg.focus(); return; }
      if (!b) { err.textContent = "Elija la fecha de salida, por favor."; sal.focus(); return; }
      if (b <= a) { err.textContent = "La salida tiene que ser después de la llegada."; sal.focus(); return; }
      abrirWA(mensaje());
    });
    form.__actualizar = actualizar;
    actualizar();
  }

  function iniciarCotizador() {
    var cot = $("#cotizador"); if (!cot) return;
    var form = $("form", cot), ultimoFoco = null;
    armador(form);
    function abrir(idHab) {
      ultimoFoco = document.activeElement;
      var sel = $("[data-lista-habitaciones]", cot);
      if (idHab != null) sel.value = idHab;
      form.__actualizar();
      cot.hidden = false; document.body.classList.add("con-modal");
      requestAnimationFrame(function () { cot.classList.add("abierto"); });
      setTimeout(function () { (idHab ? $('[name="llegada"]', cot) : sel).focus({ preventScroll: true }); }, 60);
    }
    function cerrar() {
      cot.classList.remove("abierto"); document.body.classList.remove("con-modal");
      setTimeout(function () { cot.hidden = true; if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus({ preventScroll: true }); }, QUIETO ? 0 : 280);
    }
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-cotizar]");
      if (b) { ev.preventDefault(); abrir(b.getAttribute("data-habitacion") || ""); }
      if (ev.target.closest && ev.target.closest("[data-cerrar]")) cerrar();
    });
    atraparFoco(cot, cerrar);
  }
  function atraparFoco(cont, cerrar) {
    document.addEventListener("keydown", function (ev) {
      if (cont.hidden) return;
      if (ev.key === "Escape") cerrar();
      if (ev.key === "Tab") {
        var f = $$("button, select, input, textarea, [href]", cont).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
        else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ---------- Menú "Más" (hoja que sube) ---------- */
  function iniciarMenu() {
    var hoja = $("#hoja-menu"), boton = $("[data-abrir-menu]"); if (!hoja || !boton) return;
    function abrir() { hoja.hidden = false; boton.setAttribute("aria-expanded", "true"); document.body.classList.add("con-modal"); requestAnimationFrame(function () { hoja.classList.add("abierto"); }); var a = $("a", hoja); if (a) a.focus(); }
    function cerrar() { hoja.classList.remove("abierto"); boton.setAttribute("aria-expanded", "false"); document.body.classList.remove("con-modal"); setTimeout(function () { hoja.hidden = true; }, QUIETO ? 0 : 280); boton.focus(); }
    boton.addEventListener("click", abrir);
    $$("[data-cerrar-menu]", hoja).forEach(function (x) { x.addEventListener("click", cerrar); });
    atraparFoco(hoja, cerrar);
  }

  /* ---------- Filtros (habitaciones y galería) y láminas que se voltean ---------- */
  function iniciarFiltros() {
    document.addEventListener("click", function (ev) {
      var f = ev.target.closest && ev.target.closest("[data-filtro]");
      if (f) {
        var t = f.getAttribute("data-filtro"), n = 0;
        $$("[data-filtro]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === f)); });
        $$(".lamina-v").forEach(function (l) { var ok = !t || (l.getAttribute("data-tags") || "").split("|").indexOf(t) > -1; l.hidden = !ok; if (ok) n++; });
        var c = $("[data-cuenta]"); if (c) c.textContent = n + (n === 1 ? " habitación" : " habitaciones") + (t ? " ideales para " + t.toLowerCase() : "");
      }
      var g = ev.target.closest && ev.target.closest("[data-filtro-galeria]");
      if (g) {
        var k = g.getAttribute("data-filtro-galeria");
        $$("[data-filtro-galeria]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === g)); });
        $$('[data-pinta="galeria"] .mosaico-item').forEach(function (it) { it.hidden = !!k && it.getAttribute("data-cat") !== k; });
      }
      var v = ev.target.closest && ev.target.closest("[data-voltear]");
      if (v) {
        var l = v.closest(".lamina-v"), dado = !l.classList.contains("volteada");
        l.classList.toggle("volteada", dado);
        var fr = $(".lamina-frente", l), dr = $(".lamina-dorso", l);
        fr.toggleAttribute("inert", dado); fr.setAttribute("aria-hidden", String(dado));
        dr.toggleAttribute("inert", !dado); dr.setAttribute("aria-hidden", String(!dado));
        setTimeout(function () { var x = $(dado ? ".lamina-dorso .dorso-volver" : ".lamina-frente [data-voltear]", l); if (x) x.focus({ preventScroll: true }); }, QUIETO ? 0 : 350);
      }
    });
    var c = $("[data-cuenta]"); if (c) c.textContent = $$(".lamina-v").length + " habitaciones";
  }

  /* ---------- Visor de fotos y presentación ---------- */
  function listaVisible(cual) {
    if (cual === "galeria") {
      var items = $$('.mosaico-item[data-visor="galeria"]').filter(function (b) { return !b.hidden; });
      return items.map(function (b) { var im = $("img", b); return { foto: (b.__foto || ""), alt: im ? im.alt : "", el: b }; });
    }
    var h = habitacionesValidas().filter(function (x) { return x.id === params.get("id"); })[0];
    return ((h && h.fotos) || []).map(function (f) { return { foto: f.foto, alt: f.alt }; });
  }
  function fotoDeBoton(b) {
    var im = $("img", b), src = im ? (im.currentSrc || im.src) : "";
    return src.split("?")[0];
  }
  function iniciarVisor() {
    var v = $("#visor"); if (!v) return;
    var im = $("[data-visor-img]", v), tx = $("[data-visor-txt]", v), lista = [], i = 0, foco = null;
    function mostrar() { var f = lista[i]; if (!f) return; im.src = foto(f.foto, 1600); im.alt = f.alt || ""; tx.textContent = (f.alt || "") + " (" + (i + 1) + " de " + lista.length + ")"; }
    function cerrar() { v.hidden = true; document.body.classList.remove("con-modal"); if (foco) foco.focus({ preventScroll: true }); }
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-visor]");
      if (!b) return;
      var cual = b.getAttribute("data-visor");
      if (cual === "galeria") {
        var visibles = $$('[data-visor="galeria"]', b.parentNode).filter(function (x) { return !x.hidden; });
        lista = visibles.map(function (x) { return { foto: fotoDeBoton(x), alt: ($("img", x) || {}).alt }; });
        i = visibles.indexOf(b);
      } else { lista = listaVisible("ficha"); i = +b.getAttribute("data-i") || 0; }
      foco = b; mostrar(); v.hidden = false; document.body.classList.add("con-modal"); $(".visor-cerrar", v).focus();
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
    v.addEventListener("touchend", function (ev) { if (x0 == null) return; var dx = ev.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) (dx < 0 ? $(".visor-sig", v) : $(".visor-ant", v)).click(); });
  }

  /* Presentación: pantalla completa, cada foto con un acercamiento lento */
  function iniciarPresentacion() {
    var p = $("#presentacion"), boton = $("[data-presentacion]"); if (!p || !boton) return;
    var caja = $("[data-pres-fotos]", p), txt = $("[data-pres-txt]", p), barra = $("[data-pres-avance]", p);
    var lista = [], i = 0, reloj = null, pausado = false, DUR = 5500;
    function poner() {
      var f = lista[i]; if (!f) return;
      var el = document.createElement("img");
      el.src = foto(f.foto, 1800); el.alt = f.alt || ""; el.className = "pres-img";
      caja.appendChild(el);
      requestAnimationFrame(function () { el.classList.add("activa"); });
      $$(".pres-img", caja).slice(0, -2).forEach(function (x) { x.remove(); });
      var viejas = $$(".pres-img", caja); if (viejas.length > 1) setTimeout(function () { viejas[0].classList.remove("activa"); }, 50);
      txt.textContent = (f.alt || "") + " (" + (i + 1) + " de " + lista.length + ")";
      barra.style.transition = "none"; barra.style.transform = "scaleX(0)";
      if (!pausado) requestAnimationFrame(function () { requestAnimationFrame(function () { barra.style.transition = "transform " + DUR + "ms linear"; barra.style.transform = "scaleX(1)"; }); });
      clearTimeout(reloj); if (!pausado) reloj = setTimeout(function () { i = (i + 1) % lista.length; poner(); }, DUR);
    }
    function abrir() {
      lista = $$('[data-pinta="galeria"] .mosaico-item').filter(function (b) { return !b.hidden; }).map(function (b) { return { foto: fotoDeBoton(b), alt: ($("img", b) || {}).alt }; });
      if (!lista.length) return;
      i = 0; pausado = false; caja.innerHTML = ""; p.hidden = false; document.body.classList.add("con-modal");
      poner(); $('[data-pres="pausa"]', p).focus();
    }
    function cerrar() { clearTimeout(reloj); p.hidden = true; caja.innerHTML = ""; document.body.classList.remove("con-modal"); boton.focus(); }
    boton.addEventListener("click", abrir);
    p.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-pres]"); if (!b) return;
      var a = b.getAttribute("data-pres");
      if (a === "cerrar") cerrar();
      if (a === "sig") { i = (i + 1) % lista.length; poner(); }
      if (a === "ant") { i = (i - 1 + lista.length) % lista.length; poner(); }
      if (a === "pausa") {
        pausado = !pausado;
        b.innerHTML = ico(pausado ? "play" : "pausa"); b.setAttribute("aria-label", pausado ? "Seguir" : "Pausar");
        p.classList.toggle("pausada", pausado); poner();
      }
    });
    atraparFoco(p, cerrar);
    document.addEventListener("keydown", function (ev) {
      if (p.hidden) return;
      if (ev.key === "ArrowRight") { i = (i + 1) % lista.length; poner(); }
      if (ev.key === "ArrowLeft") { i = (i - 1 + lista.length) % lista.length; poner(); }
    });
  }

  /* ---------- Arme su itinerario ---------- */
  function iniciarItinerario() {
    var planEl = $("[data-plan]"); if (!planEl) return;
    if (window.__pintarPlan) { window.__pintarPlan(); return; }
    var dias = 2, plan = { 1: [], 2: [], 3: [] }, porId = {};
    experiencias().forEach(function (x) { porId[x.id] = x; });
    try { var g = JSON.parse(sessionStorage.getItem("oriana-plan") || "null"); if (g && g.plan) { plan = g.plan; dias = g.dias || 2; } } catch (e) {}
    function guardar() { try { sessionStorage.setItem("oriana-plan", JSON.stringify({ plan: plan, dias: dias })); } catch (e) {} }
    function pintarPlan() {
      $$("[data-dias]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-dias") === dias)); });
      var h = "";
      for (var d = 1; d <= dias; d++) {
        h += '<div class="iti-dia"><p class="iti-dia-titulo">Día ' + d + "</p>" + (plan[d].length ? "<ol>" + plan[d].map(function (id) {
          var x = porId[id]; if (!x) return "";
          return "<li><span>" + esc(x.nombre) + '</span><button type="button" data-quitar="' + d + "|" + esc(id) + '" aria-label="Quitar ' + esc(x.nombre) + " del día " + d + '">' + ico("cerrar") + "</button></li>";
        }).join("") + "</ol>" : '<p class="iti-vacio">Agregue algo desde la lista.</p>') + "</div>";
      }
      planEl.innerHTML = h;
      $$("[data-exp-dias]").forEach(function (cont) {
        var id = cont.closest("[data-exp]").getAttribute("data-exp"), b = "";
        for (var d = 1; d <= dias; d++) {
          var ya = plan[d].indexOf(id) > -1;
          b += '<button type="button" class="chip-boton chip-dia" data-agregar="' + d + "|" + esc(id) + '" aria-pressed="' + ya + '">' + (ya ? "✓ " : "+ ") + "Día " + d + "</button>";
        }
        cont.innerHTML = b;
      });
      guardar();
    }
    window.__pintarPlan = function () { porId = {}; experiencias().forEach(function (x) { porId[x.id] = x; }); pintarPlan(); };
    document.addEventListener("click", function (ev) {
      var t = ev.target.closest && ev.target.closest("[data-dias],[data-agregar],[data-quitar],[data-momento][role=tab],[data-enviar-plan]");
      if (!t) return;
      if (t.hasAttribute("data-dias")) { dias = +t.getAttribute("data-dias"); for (var d = dias + 1; d <= 3; d++) plan[d] = []; pintarPlan(); }
      if (t.hasAttribute("data-agregar") || t.hasAttribute("data-quitar")) {
        var par = (t.getAttribute("data-agregar") || t.getAttribute("data-quitar")).split("|"), dd = +par[0], id = par[1], k = plan[dd].indexOf(id);
        if (k > -1) plan[dd].splice(k, 1); else plan[dd].push(id);
        var e = $("[data-plan-error]"); if (e) e.textContent = "";
        pintarPlan();
      }
      if (t.getAttribute("role") === "tab") {
        var m = t.getAttribute("data-momento");
        $$('[role=tab][data-momento]').forEach(function (b) { b.setAttribute("aria-selected", String(b === t)); });
        $$("[data-exp]").forEach(function (x) { x.hidden = !!m && x.getAttribute("data-momento") !== m; });
      }
      if (t.hasAttribute("data-enviar-plan")) {
        var lineas = [], total = 0;
        for (var d2 = 1; d2 <= dias; d2++) {
          var nombres = plan[d2].map(function (id) { return porId[id] ? porId[id].nombre : ""; }).filter(Boolean);
          total += nombres.length;
          if (nombres.length) lineas.push("Día " + d2 + ": " + nombres.join(", ") + ".");
        }
        if (!total) { var er = $("[data-plan-error]"); if (er) er.textContent = "Agregue al menos una experiencia a su plan."; return; }
        abrirWA("Hola Chalet Vistas de Oriana, armé este plan para mi estadía de " + dias + (dias === 1 ? " día" : " días") + ":\n" + lineas.join("\n") + "\n¿Me ayudan a organizarlo?");
      }
    });
    pintarPlan();
  }

  /* ---------- Contacto ---------- */
  function iniciarContacto() {
    var f = $("[data-contacto]"); if (!f) return;
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = f.elements.nombre.value.trim(), m = f.elements.mensaje.value.trim(), err = $("[data-error]", f);
      var tema = ""; $$('[name="tema"]', f).forEach(function (r) { if (r.checked) tema = r.value; });
      if (!n) { err.textContent = "Escriba su nombre, por favor."; f.elements.nombre.focus(); return; }
      if (!m) { err.textContent = "Escriba su mensaje, por favor."; f.elements.mensaje.focus(); return; }
      err.textContent = "";
      abrirWA("Hola Chalet Vistas de Oriana, soy " + n + ". Les escribo sobre: " + tema.toLowerCase() + ".\n" + m);
    });
  }

  /* ---------- Recorrido del chalet: la foto de la izquierda acompaña al texto ---------- */
  function iniciarRecorrido() {
    var pasos = $$(".recorrido-paso"); if (!pasos.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (ent) {
      ent.forEach(function (x) {
        if (!x.isIntersecting) return;
        var k = x.target.getAttribute("data-paso");
        pasos.forEach(function (p) { p.classList.toggle("activo", p === x.target); });
        $$(".recorrido-foto").forEach(function (f) { f.classList.toggle("activa", f.getAttribute("data-paso") === k); });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    pasos.forEach(function (p) { io.observe(p); });
  }

  /* ---------- Movimiento ---------- */
  function observar() {
    var marcas = $$(".divisor, .cierre-espiral");
    if (QUIETO || !("IntersectionObserver" in window)) { marcas.concat($$(".lamina")).forEach(function (el) { el.classList.add("dibujado", "entro"); }); return; }
    var io = new IntersectionObserver(function (ent) {
      ent.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("dibujado"); io.unobserve(x.target); } });
    }, { threshold: 0.6 });
    marcas.forEach(function (d) { io.observe(d); });
    if (!ESCRITORIO) {
      var io2 = new IntersectionObserver(function (ent) {
        ent.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("entro"); io2.unobserve(x.target); } });
      }, { threshold: 0.25 });
      $$(".lamina").forEach(function (l) { io2.observe(l); });
    }
  }
  function inclinar() {
    if (QUIETO || !ESCRITORIO) return;
    $$(".lamina:not(.lamina-v)").forEach(function (l) {
      l.addEventListener("pointermove", function (ev) {
        var r = l.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
        l.style.transform = "perspective(900px) rotateX(" + (-y * 4).toFixed(2) + "deg) rotateY(" + (x * 4).toFixed(2) + "deg) translateY(-4px)";
      });
      l.addEventListener("pointerleave", function () { l.style.transform = ""; });
    });
  }
  function cargar(src) { return new Promise(function (ok, mal) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s); }); }
  function conGsap() {
    if (QUIETO || !ESCRITORIO || HORNEAR) { $$(".lamina").forEach(function (l) { l.classList.add("entro"); }); return; }
    var base = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/";
    cargar(base + "gsap.min.js").then(function () { return cargar(base + "ScrollTrigger.min.js"); }).then(function () {
      var g = window.gsap; g.registerPlugin(window.ScrollTrigger);
      $$(".laminas").forEach(function (grupo) {
        var ls = $$(".lamina", grupo); if (!ls.length) return;
        g.fromTo(ls, { y: 36 }, { y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12, clearProps: "transform", scrollTrigger: { trigger: grupo, start: "top 85%" } });
        ls.forEach(function (l) { var im = $(".lamina-mascara img", l); if (im) g.fromTo(im, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: grupo, start: "top 85%" } }); l.classList.add("entro"); });
      });
      var sec = $(".momentos"), pista = $(".momentos-pista");
      if (sec && pista) {
        var dist = function () { return Math.max(0, pista.scrollWidth - pista.clientWidth); };
        if (dist() > 80) {
          sec.classList.add("con-pin");
          g.to(pista, { x: function () { return -dist(); }, ease: "none",
            scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
        }
      }
    }).catch(function () { aviso("No cargó GSAP: la página sigue igual, sin el movimiento al bajar."); $$(".lamina").forEach(function (l) { l.classList.add("entro"); }); });
  }

  /* ---------- Datos frescos en línea ---------- */
  function leerJSON() {
    if (!/^https?:/.test(location.protocol) || !window.fetch) return Promise.resolve(false);
    var nombres = ["config", "habitaciones", "servicios", "preguntas", "experiencias"];
    return Promise.all(nombres.map(function (n) {
      return fetch("datos/" + n + ".json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(function (e) { aviso("No se pudo leer datos/" + n + ".json (" + e.message + "). Revise comas, comillas y llaves."); return null; });
    })).then(function (res) {
      var cambio = false;
      res.forEach(function (v, i) { if (v && JSON.stringify(v) !== JSON.stringify(D[nombres[i]])) { D[nombres[i]] = v; cambio = true; } });
      return cambio;
    });
  }

  function interactivos() {
    $$("form[data-armador]").forEach(armador);
    iniciarItinerario(); iniciarRecorrido();
    var c = $("[data-cuenta]"); if (c && !c.textContent) c.textContent = $$(".lamina-v").length + " habitaciones";
  }
  function arrancar() {
    try { pintarTodo(); } catch (e) { aviso("Error al pintar: " + e.message); }
    raiz.dataset.pintado = "1";
    if (HORNEAR) return;
    iniciarCotizador(); iniciarMenu(); iniciarFiltros(); iniciarVisor(); iniciarPresentacion(); iniciarContacto();
    interactivos();
    leerJSON().then(function (cambio) {
      if (cambio) { try { pintarTodo(); interactivos(); } catch (e) { aviso("Error al pintar: " + e.message); } }
      observar(); inclinar(); conGsap();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
