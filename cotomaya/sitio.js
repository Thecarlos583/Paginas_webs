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
      if (p.pausada === true) return false;
      if (p.tipo && !(CFG.tipos || {})[p.tipo]) aviso("En propiedades.json, \"" + p.nombre + "\" tiene el tipo \"" + p.tipo + "\", que no está en config.json (villa, casa, apartamento, townhouse o penthouse).");
      if (p.categoria && !(CFG.categorias || {})[p.categoria]) aviso("En propiedades.json, \"" + p.nombre + "\" tiene la categoría \"" + p.categoria + "\", que no está en config.json.");
      p.nombre = p.nombre || p.id;
      p.fotos = lista(p.fotos); p.incluye = lista(p.incluye); p.enlaces = p.enlaces || {};
      p.videos = lista(p.videos).filter(function (v) { return v && v.archivo; });
      if (p.videos.length > 5) { aviso("\"" + p.nombre + "\" tiene " + p.videos.length + " videos: se muestran los primeros 5."); p.videos = p.videos.slice(0, 5); }
      p.capacidad = +p.capacidad || 0; p.habitaciones = +p.habitaciones || 0; p.banos = +p.banos || 0;
      p.carpeta = "fotos/propiedades/";  /* las rutas traen la carpeta: "villa-la-vizcaya/01.webp" */
      return true;
    });
    var vt = {};
    d.tours = lista(d.tours).filter(function (t, i) {
      if (!revisar(t, "tours.json", OBLIG_TOUR, i, vt)) return false;
      if (t.pausada === true) return false;
      t.nombre = t.nombre || t.id; t.fotos = lista(t.fotos); t.incluye = lista(t.incluye);
      t.carpeta = "fotos/tours/";
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

  function tarjetaDestino(x, d) {
    var n = d.propiedades.filter(function (p) { return p.destino === x.id; }).length;
    return '<a class="destino" href="destino.html?d=' + encodeURIComponent(x.id) + '">' +
      (x.foto ? img(x.foto, "fotos/", "", "(min-width:900px) 50vw, 100vw", 1600) : "") +
      '<span class="destino-texto"><strong>' + esc(x.nombre) + "</strong>" + (x.descripcion ? "<small>" + esc(x.descripcion) + "</small>" : "") +
      '<span class="destino-zonas">' + x.zonas.map(function (z) { return "<span>" + esc(z) + "</span>"; }).join("") +
      (n ? "<span>" + plural(n, "propiedad", "propiedades") + "</span>" : "") + "</span></span></a>";
  }
  function pintarDestinos(d) {
    $$("[data-destinos-lista]").forEach(function (c) { if (d.destinos.length) c.innerHTML = d.destinos.map(function (x) { return tarjetaDestino(x, d); }).join(""); });
  }
  function pintarTours(caja, lista) {
    if (!caja) return;
    caja.classList.remove("cargando");
    caja.innerHTML = lista.length ? lista.map(tarjetaTour).join("") : '<p class="vacio">Pronto publicaremos opciones aquí. Mientras tanto, pregúntenos por WhatsApp.</p>';
  }

  PAGINAS.inicio = function (d) {
    pintarDestinos(d);
    var yates = d.tours.filter(function (t) { return t.tipo === "yate"; });
    pintarTours($("[data-tours-inicio]"), (yates.length ? yates : d.tours).slice(0, 3));
    /* Accesos por tipo: solo los tipos que tienen propiedades, con foto y cantidad */
    var tipos = $("[data-tipos]");
    if (tipos && d.propiedades.length) {
      tipos.innerHTML = Object.keys(CFG.tipos || {}).map(function (t) {
        var de = d.propiedades.filter(function (p) { return p.tipo === t; });
        if (!de.length) return "";
        var f = (de.filter(function (p) { return p.fotos.length; })[0] || {});
        return '<a class="tipo" href="hospedajes.html?tipo=' + encodeURIComponent(t) + '">' + (f.fotos ? img(f.fotos[0], f.carpeta, "", "(min-width:900px) 18vw, 42vw", 600) : "") +
          "<span><strong>" + esc(nombreTipo(t, true)) + "</strong><small>" + plural(de.length, "opción", "opciones") + "</small></span></a>";
      }).join("");
    }
    var caja = $("[data-destacadas]");
    if (caja) {
      var dest = d.propiedades.filter(function (p) { return p.destacada === true; });
      if (!dest.length) dest = d.propiedades.slice(0, 3);
      caja.classList.remove("cargando");
      if (!d.propiedades.length) sinDatos(caja);
      else caja.innerHTML = dest.slice(0, 6).map(function (p) { return tarjeta(p); }).join("");
    }
  };

  /* ---- Catálogo ---- */
  var CLAVES = ["destino", "zona", "tipo", "categoria", "personas"];
  PAGINAS.hospedajes = function (d) {
    var res = $("[data-resultados]"), cuenta = $("[data-cuenta-cat]"), activos = $("[data-activos]");
    var panel = $("[data-filtros]"), form = $("[data-form-filtros]"), abrir = $("[data-abrir-filtros]");
    var nFil = $("[data-n-filtros]"), verN = $("[data-ver-n]"), zonaSel = $("[data-f-zona]"), ayuda = $("[data-f-cat-ayuda]");
    res.classList.remove("cargando");
    if (!d.propiedades.length) { cuenta.textContent = "Sin propiedades por ahora"; sinDatos(res); return; }

    var f = {};
    CLAVES.forEach(function (k) { f[k] = param(k); });
    if (f.personas && !(+f.personas > 0)) f.personas = "";

    function chips(caja, nombre, opciones) {
      caja.innerHTML = opciones.map(function (o) {
        return '<label class="chip"><input type="radio" name="' + nombre + '" value="' + esc(o[0]) + '"><span>' + esc(o[1]) + "</span></label>";
      }).join("");
    }
    var tiposUsados = Object.keys(CFG.tipos || {}).filter(function (t) { return d.propiedades.some(function (p) { return p.tipo === t; }); });
    var catsUsadas = Object.keys(CFG.categorias || {}).filter(function (c) { return d.propiedades.some(function (p) { return p.categoria === c; }); });
    chips($("[data-f-destino]"), "destino", [["", "Todos"]].concat(d.destinos.map(function (x) { return [x.id, x.nombre]; })));
    chips($("[data-f-tipo]"), "tipo", [["", "Todos"]].concat(tiposUsados.map(function (t) { return [t, nombreTipo(t, true)]; })));
    chips($("[data-f-categoria]"), "categoria", [["", "Todas"]].concat(catsUsadas.map(function (c) { return [c, categoria(c).nombre]; })));

    function zonasDe(dest) {
      var z = [];
      d.propiedades.forEach(function (p) { if ((!dest || p.destino === dest) && p.zona && z.indexOf(p.zona) === -1) z.push(p.zona); });
      return z;
    }
    function pintarZonas() {
      var z = zonasDe(f.destino);
      if (f.zona && z.indexOf(f.zona) === -1) f.zona = "";
      zonaSel.innerHTML = '<option value="">Todas las zonas</option>' + z.map(function (x) { return '<option value="' + esc(x) + '">' + esc(x) + "</option>"; }).join("");
      zonaSel.value = f.zona;
    }
    function marcar() {
      ["destino", "tipo", "categoria"].forEach(function (k) {
        $$('input[name="' + k + '"]', form).forEach(function (i) { i.checked = i.value === f[k]; });
      });
      pintarZonas();
      var c = f.categoria && categoria(f.categoria);
      ayuda.hidden = !(c && c.descripcion);
      if (c && c.descripcion) ayuda.textContent = c.descripcion;
    }
    var cont = contador($("[data-f-personas]"), function (n) {
      if (!listo) return;
      f.personas = n ? String(n) : ""; aplicar();
    });
    var listo = false;
    cont.poner(f.personas || 0);
    listo = true;

    function coincide(p) {
      return (!f.destino || p.destino === f.destino) && (!f.zona || p.zona === f.zona) && (!f.tipo || p.tipo === f.tipo) &&
        (!f.categoria || p.categoria === f.categoria) && (!f.personas || p.capacidad >= +f.personas);
    }
    function etiqueta(k) {
      if (k === "destino") { var x = d.porDestino[f.destino]; return x ? x.nombre : f.destino; }
      if (k === "tipo") return nombreTipo(f.tipo, true);
      if (k === "categoria") return categoria(f.categoria).nombre;
      if (k === "personas") return "Desde " + plural(+f.personas, "persona", "personas");
      return f[k];
    }
    function aplicar() {
      /* URL compartible con los filtros */
      var q = new URLSearchParams();
      CLAVES.forEach(function (k) { if (f[k]) q.set(k, f[k]); });
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q.toString() : ""));
      marcar();
      var lista = d.propiedades.filter(coincide);
      lista.sort(function (a, b) { return (b.destacada === true) - (a.destacada === true); });
      var n = lista.length, txt = plural(n, "propiedad", "propiedades");
      cuenta.innerHTML = "<b>" + n + "</b>" + (n === 1 ? "propiedad" : "propiedades");
      verN.textContent = n ? "Ver " + txt : "Sin resultados";
      var usados = CLAVES.filter(function (k) { return f[k]; });
      nFil.hidden = !usados.length; nFil.textContent = usados.length;
      activos.innerHTML = usados.map(function (k) {
        return '<button type="button" class="activo-chip" data-quitar="' + k + '" aria-label="Quitar filtro ' + esc(etiqueta(k)) + '">' + esc(etiqueta(k)) + icono("cerrar") + "</button>";
      }).join("") + (usados.length > 1 ? '<button type="button" class="limpiar" data-limpiar>Limpiar todo</button>' : "");
      if (n) {
        res.innerHTML = lista.map(function (p) { return tarjeta(p, "(min-width:1200px) 26vw, (min-width:900px) 34vw, 88vw"); }).join("");
      } else {
        res.innerHTML = '<div class="vacio"><h3>No encontramos propiedades con esos filtros</h3><p>Pruebe quitando alguno, o escríbanos y le buscamos opciones.</p><div class="botones">' +
          '<button type="button" class="boton boton-claro" data-limpiar>Limpiar filtros</button>' +
          '<a class="boton" href="' + esc(waUrl(msg("sin_resultados"))) + '" target="_blank" rel="noopener">' + icono("wa") + "<span>Escribir por WhatsApp</span></a></div></div>";
      }
    }
    form.addEventListener("change", function (ev) {
      var t = ev.target;
      if (t.name === "destino") { f.destino = t.value; f.zona = ""; }
      else if (t.name in f) f[t.name] = t.value;
      aplicar();
    });
    document.addEventListener("click", function (ev) {
      var q = ev.target.closest("[data-quitar]"), l = ev.target.closest("[data-limpiar]");
      if (q) { f[q.dataset.quitar] = ""; if (q.dataset.quitar === "destino") f.zona = ""; if (q.dataset.quitar === "personas") cont.poner(0); aplicar(); }
      if (l) { CLAVES.forEach(function (k) { f[k] = ""; }); cont.poner(0); aplicar(); }
    });
    /* Panel de filtros en el teléfono */
    var desde = null;
    function mostrar(si) {
      panel.hidden = !si; abrir.setAttribute("aria-expanded", si ? "true" : "false");
      if (window.innerWidth < 900) document.body.style.overflow = si ? "hidden" : "";
      if (si) { desde = document.activeElement; var b = $(".filtros-tope button", panel); if (b) b.focus(); }
      else if (desde && desde.focus) desde.focus();
    }
    abrir.addEventListener("click", function () { mostrar(true); });
    $$("[data-cerrar-filtros]", panel).forEach(function (b) { b.addEventListener("click", function () { mostrar(false); }); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !panel.hidden && window.innerWidth < 900) mostrar(false); });
    aplicar();
  };

  /* ---- Visor de fotos a pantalla completa (deslizar, flechas, Esc). Solo baja las fotos cercanas ---- */
  var visor = null;
  function abrirVisor(fotos, carpeta, nombre, inicio) {
    if (!visor) {
      visor = document.createElement("div");
      visor.className = "visor"; visor.hidden = true;
      visor.setAttribute("role", "dialog"); visor.setAttribute("aria-modal", "true"); visor.setAttribute("aria-label", "Fotos");
      visor.innerHTML = '<div class="visor-tope"><span data-v-cuenta></span><button type="button" data-v-cerrar aria-label="Cerrar fotos">' + icono("cerrar") + "</button></div>" +
        '<div class="visor-pista" data-v-pista></div>' +
        '<button type="button" class="visor-flecha visor-ant" data-v-ant aria-label="Foto anterior">' + icono("izq") + "</button>" +
        '<button type="button" class="visor-flecha visor-sig" data-v-sig aria-label="Foto siguiente">' + icono("der") + "</button>";
      document.body.appendChild(visor);
      var pista = $("[data-v-pista]", visor);
      pista.addEventListener("scroll", function () { if (!visor.hidden) actualizar(); }, { passive: true });
      $("[data-v-cerrar]", visor).addEventListener("click", cerrarVisor);
      $("[data-v-ant]", visor).addEventListener("click", function () { ir(visor.i - 1); });
      $("[data-v-sig]", visor).addEventListener("click", function () { ir(visor.i + 1); });
      document.addEventListener("keydown", function (ev) {
        if (visor.hidden) return;
        if (ev.key === "Escape") cerrarVisor();
        if (ev.key === "ArrowLeft") ir(visor.i - 1);
        if (ev.key === "ArrowRight") ir(visor.i + 1);
      });
    }
    var pista = $("[data-v-pista]", visor);
    visor.n = fotos.length; visor.desde = document.activeElement;
    pista.innerHTML = fotos.map(function (r, k) {
      return '<figure><img data-src="' + esc(fotoUrl(r, carpeta, 1600)) + '" alt="' + esc(nombre + ", foto " + (k + 1) + " de " + fotos.length) + '" decoding="async"></figure>';
    }).join("");
    visor.hidden = false; document.body.style.overflow = "hidden";
    pista.scrollLeft = inicio * pista.clientWidth;
    visor.i = inicio; actualizar(true);
    $("[data-v-cerrar]", visor).focus();
  }
  function actualizar(forzar) {
    var pista = $("[data-v-pista]", visor), i = Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth));
    if (i !== visor.i || forzar) {
      visor.i = i;
      $("[data-v-cuenta]", visor).textContent = (i + 1) + " / " + visor.n;
    }
    $$("img", pista).forEach(function (im, k) { if (Math.abs(k - i) <= 1 && im.dataset.src) { im.src = im.dataset.src; im.removeAttribute("data-src"); } });
  }
  function ir(i) {
    var pista = $("[data-v-pista]", visor);
    i = Math.max(0, Math.min(visor.n - 1, i));
    pista.scrollTo({ left: i * pista.clientWidth, behavior: quieto ? "auto" : "smooth" });
  }
  function cerrarVisor() {
    visor.hidden = true; document.body.style.overflow = "";
    $("[data-v-pista]", visor).innerHTML = "";
    if (visor.desde && visor.desde.focus) visor.desde.focus();
  }

  /* ---- Ficha de propiedad ---- */
  var PLATAFORMAS = [["airbnb", "Airbnb"], ["booking", "Booking"], ["expedia", "Expedia"], ["tripadvisor", "TripAdvisor"]];
  function rutaVideo(r) { return /^https?:\/\//.test(r) || /^fotos\//.test(r) ? r : "fotos/propiedades/" + r; }
  function youtube(u) {
    var m = String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{6,})/);
    return m ? m[1] : "";
  }
  PAGINAS.propiedad = function (d) {
    var caja = $("[data-ficha]"), id = param("id");
    var p = d.propiedades.filter(function (x) { return x.id === id; })[0];
    if (!p) {
      document.title = "Propiedad no encontrada · " + (CFG.marca || "Cotomaya Venezuela");
      caja.innerHTML = '<div class="contenedor no-existe"><h1>No encontramos esa propiedad</h1>' +
        "<p>Puede que ya no esté disponible o que el enlace esté incompleto. Vea las que tenemos o escríbanos.</p>" +
        '<div class="botones"><a class="boton boton-claro" href="hospedajes.html">Ver hospedajes' + icono("flecha") + "</a>" +
        '<a class="boton" href="' + esc(waUrl(msg("general"))) + '" target="_blank" rel="noopener">' + icono("wa") + "<span>Escribir por WhatsApp</span></a></div></div>";
      if (!id) aviso("propiedad.html necesita ?id= en la dirección (por ejemplo propiedad.html?id=villa-la-vizcaya).");
      else aviso("No existe una propiedad con id \"" + id + "\" en propiedades.json.");
      return;
    }
    document.title = p.nombre + " · " + (CFG.marca || "Cotomaya Venezuela");
    var md = $('meta[name="description"]'); if (md && p.resumen) md.setAttribute("content", p.resumen);
    var cat = categoria(p.categoria), dest = d.porDestino[p.destino];
    var mensaje = msg("propiedad", { propiedad: p.nombre, zona: p.zona });

    /* Galería */
    var n = p.fotos.length, gal = "";
    if (n) {
      gal = '<div class="galeria"><div class="tira-galeria"><div class="tira" data-tira>' + p.fotos.map(function (r, k) {
        return '<button type="button" data-foto="' + k + '" aria-label="Ver foto ' + (k + 1) + ' de ' + n + ' en grande">' +
          img(r, p.carpeta, k ? "" : p.nombre, k ? "(min-width:900px) 25vw, 100vw" : "(min-width:900px) 50vw, 100vw", k ? 600 : 1600, k ? "" : ' fetchpriority="high" loading="eager"') + "</button>";
      }).join("") + "</div>" +
        (n > 1 ? '<span class="tira-cuenta" data-tira-cuenta>1 / ' + n + "</span>" : "") +
        '<button type="button" class="tira-todas" data-todas>' + icono("camara") + (n > 1 ? "Ver las " + n + " fotos" : "Ver foto") + "</button></div>" +
        (n > 1 ? '<div class="minis" data-minis>' + p.fotos.map(function (r, k) {
          return '<button type="button" data-mini="' + k + '" aria-label="Foto ' + (k + 1) + '"' + (k ? "" : ' aria-current="true"') + ">" + img(r, p.carpeta, "", "74px", 600) + "</button>";
        }).join("") + "</div>" : "") + "</div>";
    }

    /* Datos */
    var datos = '<dl class="datos-ficha">' +
      "<div><dt>" + icono("casa") + "Tipo</dt><dd>" + esc(nombreTipo(p.tipo)) + "</dd></div>" +
      (p.capacidad ? "<div><dt>" + icono("personas") + "Capacidad</dt><dd>" + plural(p.capacidad, "persona", "personas") + "</dd></div>" : "") +
      (p.habitaciones ? "<div><dt>" + icono("cama") + "Habitaciones</dt><dd>" + p.habitaciones + "</dd></div>" : "") +
      (p.banos ? "<div><dt>" + icono("bano") + "Baños</dt><dd>" + p.banos + "</dd></div>" : "") +
      '<div class="ancho"><dt>' + icono("mapa") + "Zona</dt><dd>" + esc(p.zona) + (dest ? ", " + esc(dest.nombre) : "") + "</dd></div>" +
      (cat.nombre ? '<div class="ancho"><dt>Categoría</dt><dd>' + esc(cat.nombre) + "</dd>" + (cat.descripcion ? "<p>" + esc(cat.descripcion) + "</p>" : "") + "</div>" : "") +
      "</dl>";

    /* Reserva */
    var plats = PLATAFORMAS.filter(function (x) { return p.enlaces[x[0]]; });
    var reserva = '<aside class="reserva" aria-label="Reservar">' + "<h2>Reservar</h2>" +
      (plats.length ? "<p>Reserve en la plataforma que prefiera:</p><div class=\"plataformas\">" + plats.map(function (x) {
        return '<a class="plat plat-' + x[0] + '" href="' + esc(p.enlaces[x[0]]) + '" target="_blank" rel="noopener">Reservar en ' + x[1] + "<small>Abre " + x[1] + "</small></a>";
      }).join("") + '</div><p class="reserva-o">o directo con nosotros</p>' : "<p>Escríbanos con sus fechas y le confirmamos la disponibilidad.</p>") +
      '<a class="boton boton-wa" href="' + esc(waUrl(mensaje)) + '" target="_blank" rel="noopener">' + icono("wa") + "<span>Reservar por WhatsApp</span></a>" +
      (p.ubicacion_maps ? '<a class="boton boton-claro" href="' + esc(p.ubicacion_maps) + '" target="_blank" rel="noopener">' + icono("mapa") + "<span>Ver en Google Maps</span></a>" : "") +
      "</aside>";

    /* Videos (hasta 5): no se descargan hasta que le dan play */
    var videos = p.videos.length ? '<section class="ficha-bloque"><h2>Videos</h2><div class="videos">' + p.videos.map(function (v, k) {
      var portada = v.portada ? '<img src="' + esc(rutaVideo(v.portada)) + '" alt="" loading="lazy" decoding="async" width="640" height="360">' : "";
      return '<div class="video"><button type="button" class="video-play" data-video="' + esc(rutaVideo(v.archivo)) + '" data-portada="' + esc(v.portada ? rutaVideo(v.portada) : "") + '" aria-label="Reproducir video ' + (k + 1) + '">' + portada + "<i>" + icono("play") + "</i></button></div>";
    }).join("") + "</div></section>" : "";

    var incluye = p.incluye.length ? '<section class="ficha-bloque"><h2>Qué incluye</h2><ul class="lista-check incluye">' +
      p.incluye.map(function (x) { return "<li>" + icono("check") + esc(x) + "</li>"; }).join("") + "</ul></section>" : "";
    var desc = p.descripcion || p.resumen;
    var texto = desc ? '<section class="ficha-bloque ficha-texto"><h2>La propiedad</h2>' + String(desc).split(/\n+/).map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("") + "</section>" : "";

    /* Otras en la misma zona (o en el mismo destino) */
    var otras = d.propiedades.filter(function (x) { return x.id !== p.id && x.zona === p.zona; }), tituloOtras = "Otras propiedades en " + p.zona;
    if (!otras.length) { otras = d.propiedades.filter(function (x) { return x.id !== p.id && x.destino === p.destino; }); tituloOtras = "Otras propiedades en " + (dest ? dest.nombre : "este destino"); }
    var bloqueOtras = otras.length ? '<section class="seccion seccion-clara"><div class="contenedor"><div class="titulo-fila"><h2>' + esc(tituloOtras) + '</h2><a class="enlace" href="hospedajes.html?destino=' + encodeURIComponent(p.destino) + '">Ver todas' + icono("flecha") + "</a></div>" +
      '<div class="rejilla-tarjetas deslizable">' + otras.slice(0, 3).map(function (x) { return tarjeta(x); }).join("") + "</div></div></section>" : "";

    caja.innerHTML = '<div class="contenedor ficha-cabeza"><nav class="migas" aria-label="Ruta"><a href="hospedajes.html">Hospedajes</a><span aria-hidden="true">/</span>' +
      '<a href="hospedajes.html?destino=' + encodeURIComponent(p.destino) + '">' + esc(dest ? dest.nombre : p.destino) + "</a></nav>" +
      "<h1>" + esc(p.nombre) + (p.ejemplo === true ? ' <span class="ejemplo ejemplo-ficha">Ejemplo</span>' : "") + "</h1>" +
      '<p class="ficha-sub">' + esc(nombreTipo(p.tipo)) + " · " + esc(p.zona) + (cat.nombre ? " · " + esc(cat.nombre) : "") + "</p></div>" +
      gal + '<div class="contenedor ficha-cuerpo"><div class="ficha-izq">' + datos + texto + incluye + videos + "</div>" + reserva + "</div>" + bloqueOtras;

    /* Interacción de la galería */
    var tira = $("[data-tira]", caja), minis = $("[data-minis]", caja), cuentaT = $("[data-tira-cuenta]", caja);
    if (tira) {
      var actual = 0;
      tira.addEventListener("scroll", function () {
        var i = Math.round(tira.scrollLeft / Math.max(1, tira.clientWidth));
        if (i === actual) return;
        actual = i;
        if (cuentaT) cuentaT.textContent = (i + 1) + " / " + n;
        if (minis) {
          $$("[data-mini]", minis).forEach(function (b, k) { if (k === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
          var b = $('[data-mini="' + i + '"]', minis);
          if (b) minis.scrollTo({ left: b.offsetLeft - minis.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" });
        }
      }, { passive: true });
      $$("[data-foto]", tira).forEach(function (b) { b.addEventListener("click", function () { abrirVisor(p.fotos, p.carpeta, p.nombre, +b.dataset.foto); }); });
      $("[data-todas]", caja).addEventListener("click", function () { abrirVisor(p.fotos, p.carpeta, p.nombre, window.innerWidth >= 900 ? 0 : actual); });
      if (minis) $$("[data-mini]", minis).forEach(function (b) {
        b.addEventListener("click", function () { tira.scrollTo({ left: +b.dataset.mini * tira.clientWidth, behavior: quieto ? "auto" : "smooth" }); });
      });
    }
    $$("[data-video]", caja).forEach(function (b) {
      b.addEventListener("click", function () {
        var src = b.dataset.video, yt = youtube(src), cont = b.parentNode, el;
        if (yt) {
          el = document.createElement("iframe");
          el.src = "https://www.youtube-nocookie.com/embed/" + yt + "?autoplay=1&rel=0"; el.title = "Video de " + p.nombre;
          el.allow = "autoplay; encrypted-media; picture-in-picture"; el.allowFullscreen = true;
          el.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0";
        } else {
          el = document.createElement("video");
          el.controls = true; el.preload = "none"; el.playsInline = true;
          if (b.dataset.portada) el.poster = b.dataset.portada;
          el.src = src;
        }
        cont.replaceChild(el, b);
        if (el.play) { var pr = el.play(); if (pr && pr.catch) pr.catch(function () {}); }
      });
    });
  };

  /* ---- Piezas de la vista previa: el mar hoy, mueva el sol, carta de los cayos y mapa ---- */
  function datos(sel, r) { var n = $(sel, r); return n ? JSON.parse(n.textContent) : null; }
  /* El mar hoy: pronóstico real de Open-Meteo, con texto de respaldo */
  safe(function () {
    var cajas = $$("[data-mar-hoy]"), solHoy = $("[data-sol-hoy]");
    if ((!cajas.length && !solHoy) || !window.fetch) return;
    var LAT = 10.86, LON = -68.24;
    var f1 = fetch("https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON + "&current=wind_speed_10m&daily=sunset&timezone=America%2FCaracas&forecast_days=1").then(function (r) { return r.json(); });
    var f2 = fetch("https://marine-api.open-meteo.com/v1/marine?latitude=" + LAT + "&longitude=" + LON + "&current=wave_height&timezone=America%2FCaracas").then(function (r) { return r.json(); });
    function hora(iso) {
      var p = iso.split("T")[1].split(":"), h = +p[0];
      return (h % 12 || 12) + ":" + p[1] + (h < 12 ? " a. m." : " p. m.");
    }
    f1.then(function (d) {
      var viento = Math.round(d.current.wind_speed_10m), sol = hora(d.daily.sunset[0]);
      cajas.forEach(function (c) {
        $('[data-dato="viento"]', c).textContent = viento + " km/h";
        $('[data-dato="sol"]', c).textContent = sol;
        $("[data-fuente]", c).hidden = false;
      });
      if (solHoy) { solHoy.textContent = "Hoy el sol se pone a las " + sol + " en Tucacas."; solHoy.hidden = false; }
    }).catch(function () {});
    f2.then(function (d) {
      var ola = d.current.wave_height;
      if (typeof ola !== "number") return;
      cajas.forEach(function (c) { $('[data-dato="olas"]', c).textContent = ola.toFixed(1).replace(".", ",") + " m"; });
    }).catch(function () {});
  });

  /* Mueva el sol */
  safe(function () {
    $$("[data-dia]").forEach(function (r) {
      var caja = r.closest(".dia");
      var fotos = $$("[data-dia-foto]", caja), pasos = $$("[data-dia-paso]", caja);
      fotos.forEach(function (f) { f.loading = "eager"; });
      var ultimo = 0;
      function ir() {
        var v = parseFloat(r.value), i = Math.round(v);
        fotos.forEach(function (f, n) {
          var o = Math.max(0, 1 - Math.abs(n - v));
          f.style.opacity = o.toFixed(3);
        });
        if (i !== ultimo) {
          pasos[ultimo].classList.remove("activo");
          pasos[i].classList.add("activo");
          ultimo = i;
        }
      }
      r.addEventListener("input", ir);
      r.addEventListener("change", function () { r.value = Math.round(parseFloat(r.value)); ir(); });
      ir();
    });
  });

  /* Carta de los cayos: la vista vuela hasta el cayo y traza el camino desde Tucacas */
  safe(function () {
    var marco = $("[data-carta]"); if (!marco) return;
    var sec = marco.closest(".carta");
    var cayos = datos("[data-carta-datos]", sec), salida = datos("[data-carta-salida]", sec);
    var mapa = $("[data-carta-mapa]", sec), ruta = $("[data-carta-ruta]", sec);
    var puntos = $$(".punto", sec), fichas = $$(".ficha-cayo", sec);
    var actual = null, ZOOM = 1.9;
    function xy(p) { return [p[0] * 1.5, p[1]]; }
    function trazo(c) {
      var pts = [salida].concat(c.camino, [c.xy]).map(xy), d = "M" + pts[0][0] + " " + pts[0][1];
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        d += " Q" + pts[i][0] + " " + pts[i][1] + " " + mx + " " + my;
      }
      var u = pts[pts.length - 1];
      return d + " L" + u[0] + " " + u[1];
    }
    function encuadrar(c) {
      var w = marco.clientWidth, h = marco.clientHeight;
      var cx = (c.xy[0] + salida[0]) / 2, cy = (c.xy[1] + salida[1]) / 2;
      /* Se acerca lo más posible sin perder Tucacas ni el cayo */
      var ancho = Math.abs(c.xy[0] - salida[0]) + 22, alto = Math.abs(c.xy[1] - salida[1]) + 26;
      var z = Math.max(1, Math.min(ZOOM, 100 / ancho, 100 / alto));
      var tx = Math.min(0, Math.max(w - w * z, w / 2 - cx / 100 * w * z));
      var ty = Math.min(0, Math.max(h - h * z, h / 2 - cy / 100 * h * z));
      mapa.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + z.toFixed(3) + ")";
      mapa.style.setProperty("--contra", (1 / z).toFixed(3));
    }
    function elegir(id) {
      var c = cayos.filter(function (x) { return x.id === id; })[0]; if (!c) return;
      actual = c;
      puntos.forEach(function (p) { p.classList.toggle("activo", p.dataset.cayo === id); });
      fichas.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cayo === id ? "true" : "false"); });
      ruta.setAttribute("d", trazo(c));
      encuadrar(c);
      var foto = $("[data-panel-foto]", sec);
      foto.src = "fotos/" + c.foto + "-600.webp"; foto.alt = c.alt;
      $("[data-panel-nombre]", sec).textContent = c.nombre;
      $("[data-panel-ve]", sec).textContent = c.ve;
      $("[data-panel-hace]", sec).textContent = c.hace;
      $("[data-panel-wa]", sec).href = c.wa;
    }
    puntos.concat(fichas).forEach(function (b) { b.addEventListener("click", function () { elegir(b.dataset.cayo); }); });
    window.addEventListener("resize", function () { if (actual) encuadrar(actual); });
    elegir(cayos[0].id);
  });

  /* Mapa real: carga al acercarse */
  safe(function () {
    var m = $("[data-mapa]"); if (!m) return;
    function poner() {
      if (m.classList.contains("cargado")) return;
      var f = document.createElement("iframe");
      f.src = m.dataset.mapa; f.title = "Mapa de Tucacas, Falcón"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
      m.textContent = ""; m.appendChild(f); m.classList.add("cargado");
    }
    if ("IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { o.disconnect(); poner(); } }, { rootMargin: "400px" });
      o.observe(m);
    } else poner();
  });


  /* ---- Destinos ---- */
  PAGINAS.destino = function (d) {
    var id = param("d"), caja = $("[data-destino]");
    pintarDestinos(d);
    if (!id) return;
    var x = d.porDestino[id];
    if (!x) {
      aviso("No existe el destino \"" + id + "\" en destinos.json.");
      $("[data-cabeza-titulo]").textContent = "No encontramos ese destino";
      $("[data-cabeza-lead]").textContent = "Estos son los destinos donde tenemos hospedajes y tours.";
      return;
    }
    document.title = x.nombre + " · " + (CFG.marca || "Cotomaya Venezuela");
    $("[data-cabeza-titulo]").textContent = x.nombre;
    $("[data-cabeza-lead]").textContent = x.descripcion || "";
    if (x.foto) {
      var im = $("[data-cabeza] img");
      im.removeAttribute("srcset"); im.src = fotoUrl(x.foto, "fotos/", 1600); im.alt = "";
    }
    var z = $("[data-zonas]");
    z.innerHTML = x.zonas.map(function (n) {
      return '<a class="zona-chip" href="hospedajes.html?destino=' + encodeURIComponent(x.id) + "&zona=" + encodeURIComponent(n) + '">' + icono("mapa") + esc(n) + "</a>";
    }).join("");
    z.hidden = !x.zonas.length;
    var props = d.propiedades.filter(function (p) { return p.destino === x.id; });
    var tours = d.tours.filter(function (t) { return t.destino === x.id; });
    var otros = d.destinos.filter(function (o) { return o.id !== x.id; });
    caja.innerHTML =
      '<section class="seccion seccion-clara"><div class="contenedor"><div class="titulo-fila"><h2>Hospedajes en ' + esc(x.nombre) + "</h2>" +
      (props.length ? '<a class="enlace" href="hospedajes.html?destino=' + encodeURIComponent(x.id) + '">Filtrar' + icono("flecha") + "</a>" : "") + "</div>" +
      (props.length ? '<div class="rejilla-tarjetas">' + props.map(function (p) { return tarjeta(p); }).join("") + "</div>"
        : '<div class="vacio"><p>Pronto publicaremos hospedajes aquí. Escríbanos y le contamos qué tenemos.</p><a class="boton" href="' + esc(waUrl(msg("destino", { destino: x.nombre }))) + '" target="_blank" rel="noopener">' + icono("wa") + "<span>Preguntar por WhatsApp</span></a></div>") +
      "</div></section>" +
      (tours.length ? '<section class="seccion agua-2"><div class="contenedor"><div class="titulo-fila"><h2>Tours y paseos en ' + esc(x.nombre) + '</h2><a class="enlace" href="tours.html">Ver todos' + icono("flecha") + '</a></div><div class="rejilla-tours deslizable">' + tours.map(tarjetaTour).join("") + "</div></div></section>" : "") +
      '<section class="seccion seccion-clara"><div class="contenedor combinar" style="margin-top:0"><div><strong>¿Viaja a ' + esc(x.nombre) + "?</strong><p>Díganos fechas y cuántos son, y le enviamos las opciones disponibles.</p></div>" +
      '<a class="boton boton-wa" href="' + esc(waUrl(msg("destino", { destino: x.nombre }))) + '" target="_blank" rel="noopener">' + icono("wa") + "<span>Escribir por WhatsApp</span></a></div>" +
      (otros.length ? '<div class="contenedor" style="margin-top:48px"><h2 style="margin-bottom:18px">Otros destinos</h2><div class="rejilla-destinos">' + otros.map(function (o) { return tarjetaDestino(o, d); }).join("") + "</div></div>" : "") +
      "</section>";
  };

  /* ---- Tours y yates ---- */
  PAGINAS.tours = function (d) {
    pintarTours($('[data-grupo="yate"]'), d.tours.filter(function (t) { return t.tipo === "yate"; }));
    var caja = $("[data-grupos-tours]"), tours = d.tours.filter(function (t) { return t.tipo !== "yate"; });
    var grupos = {};
    tours.forEach(function (t) { (grupos[t.destino] = grupos[t.destino] || []).push(t); });
    var orden = d.destinos.map(function (x) { return x.id; }).concat(Object.keys(grupos).filter(function (k) { return !d.porDestino[k]; }));
    caja.innerHTML = orden.filter(function (k) { return grupos[k]; }).map(function (k) {
      var x = d.porDestino[k];
      return '<div class="grupo-tours"><h2>Tours en ' + esc(x ? x.nombre : k) + '</h2><p>Escríbanos para armar la fecha y el grupo.</p><div class="rejilla-tours deslizable">' + grupos[k].map(tarjetaTour).join("") + "</div></div>";
    }).join("");
  };

  /*@@PAGINAS@@*/

  if (!window.fetch || !window.Promise) return;
  cargar().then(function (d) {
    safe(function () { comun(d); });
    if (PAGINAS[PAGINA]) safe(function () { PAGINAS[PAGINA](d); });
  });
})();
