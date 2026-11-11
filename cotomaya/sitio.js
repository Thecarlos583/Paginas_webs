/* Cotomaya Venezuela. Las propiedades, destinos, tours y datos de la marca viven en datos/*.json.
   Este archivo los lee, los valida (avisa en la consola qué falta) y arma cada página. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function safe(f) { try { f(); } catch (err) { if (window.console) console.warn(err); } }
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PAGINA = document.body.getAttribute("data-pagina") || "";

  /* ------------------------------------------------------------ utilidades */
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function aviso(m) { if (window.console) console.warn("[Cotomaya] " + m); }
  function lista(x) { return Array.isArray(x) ? x : (x ? [x] : []); }
  function vacio(v) { return v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length); }
  function param(n) { return new URLSearchParams(location.search).get(n) || ""; }
  function plural(n, uno, varios) { return n + " " + (n === 1 ? uno : varios); }
  function rellenar(t, vars) { return String(t || "").replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ""; }); }

  /* Ruta de una foto: enlace completo, ruta desde fotos/ o nombre dentro de la carpeta de la propiedad */
  function fotoUrl(r, carpeta, ancho) {
    if (!r) return "";
    if (/^https?:\/\//.test(r)) {
      return /images\.unsplash\.com/.test(r) ? r + (r.indexOf("?") > -1 ? "&" : "?") + "w=" + ancho : r;
    }
    var ruta = /^fotos\//.test(r) ? r : carpeta + r;
    return ancho <= 700 ? ruta.replace(/\.webp$/i, "-600.webp") : ruta;
  }
  /* Si falta la miniatura -600, usa la foto grande */
  document.addEventListener("error", function (ev) {
    var i = ev.target;
    if (i.tagName === "IMG" && i.dataset.grande && i.src.indexOf(i.dataset.grande) === -1) { i.removeAttribute("srcset"); i.src = i.dataset.grande; }
  }, true);
  function img(r, carpeta, alt, sizes, ancho, extra) {
    var chica = fotoUrl(r, carpeta, 600), grande = fotoUrl(r, carpeta, 1600);
    return '<img src="' + esc(ancho > 700 ? grande : chica) + '" srcset="' + esc(chica) + ' 600w, ' + esc(grande) + ' 1600w" sizes="' + esc(sizes) +
      '" width="1200" height="800" alt="' + esc(alt) + '" loading="lazy" decoding="async" data-grande="' + esc(grande) + '"' + (extra || "") + ">";
  }
  function icono(n) { var t = $('template[data-ic="' + n + '"]'); return t ? t.innerHTML : ""; }

  /* ------------------------------------------------------------ datos */
  var CFG = {}, D = null;
  var RESPALDO_CFG = {
    marca: "Cotomaya Venezuela", whatsapp: "584245180022", redes: {}, categorias: {}, tipos: {},
    mensajes: { general: "Hola, quisiera información para reservar con Cotomaya Venezuela." }
  };
  function waUrl(texto) { return "https://wa.me/" + (CFG.whatsapp || RESPALDO_CFG.whatsapp) + "?text=" + encodeURIComponent(texto); }
  function msg(clave, vars) {
    var m = (CFG.mensajes || {})[clave] || (CFG.mensajes || {}).general || RESPALDO_CFG.mensajes.general;
    return rellenar(m, vars || {});
  }
  function nombreTipo(t, varios) { var x = (CFG.tipos || {})[t]; return x ? (varios ? x.plural : x.singular) : (t || ""); }
  function categoria(c) { return (CFG.categorias || {})[c] || { nombre: c ? "Categoría " + c : "", descripcion: "" }; }

  function bajar(nombre, defecto) {
    return fetch("datos/" + nombre + ".json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("respuesta " + r.status); return r.json(); })
      .catch(function (err) { aviso("No se pudo leer datos/" + nombre + ".json (" + err.message + "). Revise que el archivo exista y que el JSON esté bien escrito (comas, comillas y llaves)."); return defecto; });
  }

  var OBLIG_PROP = ["id", "nombre", "tipo", "categoria", "destino", "zona", "capacidad", "habitaciones", "resumen", "fotos"];
  var OBLIG_TOUR = ["id", "nombre", "tipo", "destino", "duracion"];
  function validar(d) {
    var porDestino = {};
    d.destinos = lista(d.destinos).filter(function (x, i) {
      if (!x || !x.id || !x.nombre) { aviso("El destino #" + (i + 1) + " de destinos.json no tiene id o nombre: no se muestra."); return false; }
      x.zonas = lista(x.zonas); porDestino[x.id] = x; return true;
    });
    function revisar(cosa, archivo, oblig, i, vistos) {
      var nom = (cosa && (cosa.nombre || cosa.id)) || "#" + (i + 1);
      if (!cosa || !cosa.id) { aviso("En " + archivo + ", el elemento " + nom + " no tiene id: no se muestra."); return false; }
      if (vistos[cosa.id]) { aviso("En " + archivo + ", el id \"" + cosa.id + "\" está repetido: se muestra solo el primero."); return false; }
      vistos[cosa.id] = 1;
      oblig.forEach(function (c) { if (vacio(cosa[c])) aviso("En " + archivo + ", a \"" + nom + "\" le falta el campo \"" + c + "\"."); });
      if (cosa.destino && !porDestino[cosa.destino]) aviso("En " + archivo + ", \"" + nom + "\" usa el destino \"" + cosa.destino + "\", que no existe en destinos.json.");
      return true;
    }
    var vp = {};
    d.propiedades = lista(d.propiedades).filter(function (p, i) {
      if (!revisar(p, "propiedades.json", OBLIG_PROP, i, vp)) return false;
      if (p.tipo && !(CFG.tipos || {})[p.tipo]) aviso("En propiedades.json, \"" + p.nombre + "\" tiene el tipo \"" + p.tipo + "\", que no está en config.json (villa, casa, apartamento, townhouse o penthouse).");
      if (p.categoria && !(CFG.categorias || {})[p.categoria]) aviso("En propiedades.json, \"" + p.nombre + "\" tiene la categoría \"" + p.categoria + "\", que no está en config.json.");
      p.nombre = p.nombre || p.id;
      p.fotos = lista(p.fotos); p.incluye = lista(p.incluye); p.enlaces = p.enlaces || {};
      p.videos = lista(p.videos).filter(function (v) { return v && v.archivo; });
      if (p.videos.length > 5) { aviso("\"" + p.nombre + "\" tiene " + p.videos.length + " videos: se muestran los primeros 5."); p.videos = p.videos.slice(0, 5); }
      p.capacidad = +p.capacidad || 0; p.habitaciones = +p.habitaciones || 0; p.banos = +p.banos || 0;
      p.carpeta = "fotos/propiedades/" + p.id + "/";
      return true;
    });
    var vt = {};
    d.tours = lista(d.tours).filter(function (t, i) {
      if (!revisar(t, "tours.json", OBLIG_TOUR, i, vt)) return false;
      t.nombre = t.nombre || t.id; t.fotos = lista(t.fotos); t.incluye = lista(t.incluye);
      t.carpeta = "fotos/tours/" + t.id + "/";
      return true;
    });
    d.porDestino = porDestino;
    d.hayEjemplo = d.propiedades.concat(d.tours).some(function (x) { return x.ejemplo === true; });
    return d;
  }

  function cargar() {
    if (D) return D;
    D = bajar("config", RESPALDO_CFG).then(function (cfg) {
      CFG = cfg || RESPALDO_CFG;
      return Promise.all([bajar("destinos", []), bajar("propiedades", []), bajar("tours", [])]);
    }).then(function (r) { return validar({ destinos: r[0], propiedades: r[1], tours: r[2] }); });
    return D;
  }

  /* Cuando no se pudo leer nada (por ejemplo, al abrir el archivo directo sin servidor) */
  function sinDatos(caja) {
    if (!caja) return;
    caja.innerHTML = '<div class="vacio"><h3>No pudimos cargar la información</h3><p>Escríbanos por WhatsApp y con gusto le enviamos las opciones disponibles.</p>' +
      '<a class="boton" href="' + esc(waUrl(msg("general"))) + '" target="_blank" rel="noopener">' + icono("wa") + "<span>Escribir por WhatsApp</span></a></div>";
  }

  /* ------------------------------------------------------------ piezas que se repiten */
  function etiquetaEjemplo(x) { return x.ejemplo === true ? '<span class="ejemplo">Ejemplo</span>' : ""; }

  function tarjeta(p, sizes) {
    var url = "propiedad.html?id=" + encodeURIComponent(p.id);
    var cat = categoria(p.categoria);
    var datos = [];
    if (p.capacidad) datos.push("<span>" + icono("personas") + plural(p.capacidad, "persona", "personas") + "</span>");
    if (p.habitaciones) datos.push("<span>" + icono("cama") + plural(p.habitaciones, "habitación", "habitaciones") + "</span>");
    return '<article class="tarjeta">' +
      '<a class="tarjeta-foto" href="' + url + '" tabindex="-1" aria-hidden="true">' +
      (p.fotos[0] ? img(p.fotos[0], p.carpeta, "", sizes || "(min-width:900px) 30vw, 88vw", 600) : '<span class="sin-foto">' + icono("camara") + "</span>") +
      etiquetaEjemplo(p) + (cat.nombre ? '<span class="tarjeta-cat">' + esc(cat.nombre) + "</span>" : "") + "</a>" +
      '<div class="tarjeta-texto">' +
      '<p class="tarjeta-tipo">' + esc(nombreTipo(p.tipo)) + " · " + esc(p.zona) + "</p>" +
      '<h3><a href="' + url + '">' + esc(p.nombre) + "</a></h3>" +
      (p.resumen ? '<p class="tarjeta-resumen">' + esc(p.resumen) + "</p>" : "") +
      '<p class="tarjeta-datos">' + datos.join("") + "</p>" +
      '<a class="boton boton-chico boton-claro" href="' + url + '">Ver propiedad' + icono("flecha") + "</a>" +
      "</div></article>";
  }

  function tarjetaTour(t) {
    var incl = t.incluye.length ? '<ul class="lista-check">' + t.incluye.map(function (x) { return "<li>" + icono("check") + esc(x) + "</li>"; }).join("") + "</ul>" : "";
    var precio = t.precio_referencia && !/confirmar/i.test(t.precio_referencia)
      ? '<p class="precio"><b>' + esc(t.precio_referencia) + "</b><em>precio de referencia</em></p>"
      : '<p class="precio precio-consulta">Precio por confirmar</p>';
    return '<article class="tour">' +
      '<div class="tour-foto">' + (t.fotos[0] ? img(t.fotos[0], t.carpeta, "", "(min-width:900px) 30vw, 84vw", 600) : "") + etiquetaEjemplo(t) +
      (t.duracion ? '<span class="tour-dur">' + icono("reloj") + esc(t.duracion) + "</span>" : "") + "</div>" +
      '<div class="tour-texto"><h3>' + esc(t.nombre) + "</h3>" + (t.resumen ? "<p>" + esc(t.resumen) + "</p>" : "") + incl + precio +
      '<a class="boton boton-chico" href="' + esc(waUrl(msg("tour", { tour: t.nombre }))) + '" target="_blank" rel="noopener">' + icono("wa") + "<span>Consultar por WhatsApp</span></a>" +
      "</div></article>";
  }

  /* ------------------------------------------------------------ lo común a todas las páginas */
  function comun(d) {
    /* Número y mensajes de WhatsApp desde config.json */
    $$("[data-wa]").forEach(function (a) {
      if (a.dataset.wa === "general") a.href = waUrl(msg("general"));
    });
    $$("[data-wa-visible]").forEach(function (s) { if (CFG.whatsapp_visible) s.textContent = CFG.whatsapp_visible; });
    $$("[data-maps-base]").forEach(function (a) { if (CFG.ubicacion_maps) a.href = CFG.ubicacion_maps; });
    /* Redes: solo las que tengan enlace */
    var redes = CFG.redes || {}, nombres = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube" };
    $$("[data-redes]").forEach(function (caja) {
      Object.keys(redes).forEach(function (k) {
        if (!redes[k]) return;
        var a = document.createElement("a");
        a.href = redes[k]; a.target = "_blank"; a.rel = "noopener";
        a.innerHTML = icono(k === "instagram" ? "instagram" : "globo") + "<span>" + esc(nombres[k] || k) + "</span>";
        caja.appendChild(a);
      });
    });
    /* El aviso de referencia desaparece solo cuando ya no queda nada de ejemplo */
    $$("[data-aviso-ejemplo]").forEach(function (p) { p.hidden = !d.hayEjemplo; });
  }

  /* Cabecera, estela de avance y fotos con paralaje */
  safe(function () {
    var cab = $("[data-cabecera]"), estela = $("[data-estela]");
    var capas = $$("[data-paralaje]"), pendiente = false;
    function pintar() {
      pendiente = false;
      var y = window.scrollY, alto = document.documentElement.scrollHeight - window.innerHeight;
      if (cab) cab.classList.toggle("solida", y > 60);
      if (estela) estela.style.setProperty("--avance", alto > 0 ? Math.min(1, y / alto).toFixed(4) : 0);
      if (quieto) return;
      capas.forEach(function (c) {
        var r = c.parentElement.getBoundingClientRect();
        if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
        var centro = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        c.style.transform = "translate3d(0," + (centro * -7).toFixed(2) + "%,0)";
      });
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    pintar();
  });

  /* Logo: si existe fotos/logo.webp, reemplaza el nombre */
  safe(function () {
    var prueba = new Image();
    prueba.onload = function () {
      $$(".marca-texto").forEach(function (t) { var i = new Image(); i.src = prueba.src; i.alt = "Cotomaya Venezuela"; t.replaceWith(i); });
    };
    prueba.src = "fotos/logo.webp";
  });

  /* ------------------------------------------------------------ páginas */
  var PAGINAS = {};

  /* ---- Inicio ---- */
  /* Portada: las fotos se relevan solas, despacio */
  safe(function () {
    var caja = $("[data-relevo]"); if (!caja) return;
    var capas = $$("[data-capa]", caja), i = 0;
    if (capas.length < 2 || quieto) return;
    capas.forEach(function (c) { c.loading = "eager"; });
    setInterval(function () {
      if (document.hidden) return;
      capas[i].classList.remove("activa");
      i = (i + 1) % capas.length;
      capas[i].classList.add("activa");
    }, 6500);
    /* El botón flotante se esconde mientras los botones de la portada están a la vista */
    var flot = $("[data-flotante]"), port = $("[data-portada]");
    if (flot && port && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { flot.classList.toggle("oculto", en[0].isIntersecting); }, { threshold: .4 }).observe(port);
    }
  });

  /* Contador de personas (sin tope artificial) */
  function contador(caja, alCambiar) {
    var out = $("[data-cuenta]", caja), campo = $("[data-valor]", caja);
    var minimo = +(caja.getAttribute("data-minimo") || 1);
    var n = +(campo ? campo.value : 0) || minimo;
    function pintar() {
      out.textContent = n === 0 ? "Cualquiera" : plural(n, "persona", "personas");
      if (campo) campo.value = n || "";
      if (alCambiar) alCambiar(n);
    }
    $("[data-menos]", caja).addEventListener("click", function () { if (n > minimo) { n--; pintar(); } });
    $("[data-mas]", caja).addEventListener("click", function () { if (n < 99) { n++; pintar(); } });
    pintar();
    return { poner: function (v) { n = Math.max(minimo, +v || minimo); pintar(); } };
  }

  /* Buscador del inicio: el talón se desprende y lleva al catálogo con los filtros en la URL */
  safe(function () {
    var f = $("[data-pase]"); if (!f) return;
    contador($(".campo-personas", f));
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var q = new URLSearchParams();
      $$("select, input[type=hidden]", f).forEach(function (c) { if (c.value) q.set(c.name, c.value); });
      var destino = "hospedajes.html" + (q.toString() ? "?" + q.toString() : "");
      if (quieto) { location.href = destino; return; }
      f.classList.add("arrancado");
      setTimeout(function () { location.href = destino; }, 420);
    });
    window.addEventListener("pageshow", function () { f.classList.remove("arrancado"); });
  });

  PAGINAS.inicio = function (d) {
    var caja = $("[data-destacadas]");
    if (caja) {
      var dest = d.propiedades.filter(function (p) { return p.destacada === true; });
      if (!dest.length) dest = d.propiedades.slice(0, 3);
      caja.classList.remove("cargando");
      if (!d.propiedades.length) sinDatos(caja);
      else caja.innerHTML = dest.slice(0, 6).map(function (p) { return tarjeta(p); }).join("");
    }
  };

  /*@@PAGINAS@@*/

  if (!window.fetch || !window.Promise) return;
  cargar().then(function (d) {
    safe(function () { comun(d); });
    if (PAGINAS[PAGINA]) safe(function () { PAGINAS[PAGINA](d); });
  });
})();
