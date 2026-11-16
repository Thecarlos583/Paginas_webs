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

  /* Emojis: uno al inicio de títulos, listas y datos clave (aparte, aria-hidden, para que no se lean en voz alta) */
  function emoji(e) { return '<span class="emoji" aria-hidden="true">' + e + "</span>"; }
  var RE_EMOJI = null;
  try { RE_EMOJI = new RegExp("^(\\p{Extended_Pictographic}\\uFE0F?)\\s+(.*)$", "u"); } catch (err) { /* navegador viejo: sin separar */ }
  function conEmoji(t) {
    var m = RE_EMOJI && String(t || "").match(RE_EMOJI);
    return m ? emoji(m[1]) + esc(m[2]) : esc(t);
  }
  var EMOJIS = [[/desayuno/i, "☕"], [/jacuzzi/i, "🛁"], [/mesa de pool|billar/i, "🎱"], [/piscina/i, "🏊"], [/muelle|capit/i, "⚓"],
    [/playa|frente al mar|vista al mar/i, "🏖️"], [/aire/i, "❄️"], [/wifi/i, "📶"], [/\btv\b|smart tv/i, "📺"], [/cocina/i, "🍳"],
    [/parrill|kiosco/i, "🔥"], [/planta el/i, "⚡"], [/estacionamiento|puesto/i, "🚗"], [/mascota/i, "🐶"], [/agua/i, "💧"],
    [/jard|verde/i, "🌳"], [/lavadora/i, "🧺"], [/restaurante|comida/i, "🍽️"], [/hamaca/i, "🌴"], [/terraza|tumbona/i, "☀️"],
    [/ducha|baño/i, "🚿"], [/ascensor/i, "🏢"], [/vigilancia|cámara/i, "🔒"], [/infantil|niños/i, "🧒"], [/cava|hielo/i, "🧊"],
    [/brindis/i, "🥂"], [/música/i, "🎶"], [/sol/i, "🌅"], [/cayo/i, "🏝️"], [/trabajo/i, "💻"], [/lencer/i, "🛏️"]];
  function emojiDe(t) {
    for (var i = 0; i < EMOJIS.length; i++) if (EMOJIS[i][0].test(t)) return EMOJIS[i][1];
    return "✅";
  }
  function listaEmoji(items, clase) {
    return '<ul class="lista-emoji ' + (clase || "") + '">' + items.map(function (x) { return "<li>" + emoji(emojiDe(x)) + esc(x) + "</li>"; }).join("") + "</ul>";
  }
  /* Dato corto con emoji: "👥 32" (el lector de pantalla oye "32 personas") */
  function dato(e, visible, completo) {
    return '<span title="' + esc(completo) + '">' + emoji(e) + esc(visible) + (completo !== visible ? '<span class="sr"> (' + esc(completo) + ")</span>" : "") + "</span>";
  }
  function tarifa() { return '<p class="tarifa">' + conEmoji(document.body.getAttribute("data-tarifa") || "💬 Consulte la tarifa para su fecha") + "</p>"; }

  /* ------------------------------------------------------------ datos */
  var CFG = {}, D = null;
  var RESPALDO_CFG = {
    marca: "Cotomaya Venezuela", whatsapp_principal: "584145991961", redes: {}, categorias: {}, tipos: {},
    mensajes: { general: "Hola Cotomaya, requiero información" }
  };
  /* Número principal (whatsapp_principal). Se acepta el nombre viejo "whatsapp" por si alguien lo deja */
  function numeroWa(n) { return String(n || "").replace(/\D/g, ""); }
  function waUrl(texto, numero) { return "https://wa.me/" + numeroWa(numero || CFG.whatsapp_principal || CFG.whatsapp || RESPALDO_CFG.whatsapp_principal) + "?text=" + encodeURIComponent(texto); }
  function msg(clave, vars) {
    var m = (CFG.mensajes || {})[clave] || (CFG.mensajes || {}).general || RESPALDO_CFG.mensajes.general;
    return rellenar(m, vars || {});
  }
  function nombreTipo(t, varios) { var x = (CFG.tipos || {})[t]; return x ? (varios ? x.plural : x.singular) : (t || ""); }
  function categoria(c) { return (CFG.categorias || {})[c] || { nombre: c ? "Categoría " + c : "", descripcion: "" }; }
  /* El título de Airbnb se parte en el primer | o •: arriba el título, abajo el resto (sin cambiar palabras) */
  function partes(n) {
    n = String(n || "");
    var m = n.search(/[|•]/);
    if (m < 1) return [n.trim(), ""];
    return [n.slice(0, m).trim(), n.slice(m + 1).trim()];
  }

  function bajar(nombre, defecto) {
    return fetch("datos/" + nombre + ".json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("respuesta " + r.status); return r.json(); })
      .catch(function (err) { aviso("No se pudo leer datos/" + nombre + ".json (" + err.message + "). Revise que el archivo exista y que el JSON esté bien escrito (comas, comillas y llaves)."); return defecto; });
  }

  var OBLIG_PROP = ["id", "nombre", "tipo", "categoria", "ambito", "destino", "zona", "capacidad", "habitaciones", "resumen", "fotos"];
  var OBLIG_TOUR = ["id", "nombre", "ambito", "duracion"];
  function validar(d) {
    /* destinos.json: { ambitos: [ { id, nombre, destinos: [ { id, nombre, zonas: [ { id, nombre } ] } ] } ] } */
    var crudo = d.destinos;
    if (Array.isArray(crudo)) crudo = { ambitos: [{ id: "nacional", nombre: "Nacionales", destinos: crudo }] };
    var ambitos = lista((crudo || {}).ambitos), porAmbito = {}, porDestino = {}, porZona = {}, zonas = [], destinos = [];
    ambitos = ambitos.filter(function (a, i) {
      if (!a || !a.id) { aviso("El ámbito #" + (i + 1) + " de destinos.json no tiene id: no se muestra."); return false; }
      a.nombre = a.nombre || a.id; porAmbito[a.id] = a;
      a.destinos = lista(a.destinos).filter(function (x, j) {
        if (!x || !x.id || !x.nombre) { aviso("En destinos.json, el país #" + (j + 1) + " de \"" + a.nombre + "\" no tiene id o nombre: no se muestra."); return false; }
        x.ambito = a.id; porDestino[x.id] = x; destinos.push(x);
        x.zonas = lista(x.zonas).map(function (z) { return typeof z === "string" ? { id: z, nombre: z } : z; }).filter(function (z, k) {
          if (!z || !z.id) { aviso("En destinos.json, la zona #" + (k + 1) + " de " + x.nombre + " no tiene id: no se muestra."); return false; }
          if (porZona[z.id]) { aviso("En destinos.json, la zona \"" + z.id + "\" está repetida: se usa la primera."); return false; }
          z.nombre = z.nombre || z.id; z.destino = x.id; z.ambito = a.id; z.proximamente = z.proximamente === true;
          porZona[z.id] = z; zonas.push(z); return true;
        });
        return true;
      });
      return true;
    });
    function revisar(cosa, archivo, oblig, i, vistos) {
      var nom = (cosa && (cosa.nombre || cosa.id)) || "#" + (i + 1);
      if (!cosa || !cosa.id) { aviso("En " + archivo + ", el elemento " + nom + " no tiene id: no se muestra."); return false; }
      if (vistos[cosa.id]) { aviso("En " + archivo + ", el id \"" + cosa.id + "\" está repetido: se muestra solo el primero."); return false; }
      vistos[cosa.id] = 1;
      /* Lo que falte se deduce de la zona */
      var z = porZona[cosa.zona];
      if (z) { if (!cosa.destino) cosa.destino = z.destino; if (!cosa.ambito) cosa.ambito = z.ambito; }
      oblig.forEach(function (c) { if (vacio(cosa[c])) aviso("En " + archivo + ", a \"" + nom + "\" le falta el campo \"" + c + "\"."); });
      if (cosa.destino && !porDestino[cosa.destino]) aviso("En " + archivo + ", \"" + nom + "\" usa el destino \"" + cosa.destino + "\", que no existe en destinos.json.");
      if (cosa.zona && !z) aviso("En " + archivo + ", \"" + nom + "\" usa la zona \"" + cosa.zona + "\", que no existe en destinos.json.");
      if (cosa.ambito && !porAmbito[cosa.ambito]) aviso("En " + archivo + ", \"" + nom + "\" tiene el ámbito \"" + cosa.ambito + "\": debe ser nacional o internacional.");
      return true;
    }
    function fotosDe(x) {
      var fotos = [], alts = [];
      lista(x.fotos).forEach(function (f) {
        var r = f && typeof f === "object" ? (f.archivo || f.url || "") : f;
        if (!r) return;
        fotos.push(r); alts.push(f && typeof f === "object" ? (f.alt || "") : "");
      });
      x.fotos = fotos; x.alts = alts;
    }
    var vp = {}, inactivas = [];
    d.propiedades = lista(d.propiedades).filter(function (p, i) {
      if (!revisar(p, "propiedades.json", OBLIG_PROP, i, vp)) return false;
      if (p.tipo && !(CFG.tipos || {})[p.tipo]) aviso("En propiedades.json, \"" + p.nombre + "\" tiene el tipo \"" + p.tipo + "\", que no está en config.json (villa, casa, apartamento, townhouse, penthouse o habitacion).");
      if (p.categoria && !(CFG.categorias || {})[p.categoria]) aviso("En propiedades.json, \"" + p.nombre + "\" tiene la categoría \"" + p.categoria + "\", que no está en config.json (A, B o C).");
      p.nombre = p.nombre || p.id;
      fotosDe(p); p.incluye = lista(p.incluye); p.enlaces = p.enlaces || {};
      p.videos = lista(p.videos).filter(function (v) { return v && v.archivo; });
      if (p.videos.length > 5) { aviso("\"" + p.nombre + "\" tiene " + p.videos.length + " videos: se muestran los primeros 5."); p.videos = p.videos.slice(0, 5); }
      p.capacidad = +p.capacidad || 0; p.habitaciones = +p.habitaciones || 0; p.banos = +p.banos || 0;
      p.carpeta = "fotos/propiedades/";  /* las rutas traen la carpeta: "casa-aurora-tucacas/01.webp" */
      if (p.activa === false || p.pausada === true) { inactivas.push(p); return false; }
      return true;
    });
    var vt = {};
    d.tours = lista(d.tours).filter(function (t, i) {
      if (!revisar(t, "tours.json", OBLIG_TOUR, i, vt)) return false;
      if (t.activa === false || t.pausada === true) return false;
      t.nombre = t.nombre || t.id; fotosDe(t); t.incluye = lista(t.incluye);
      t.carpeta = "fotos/tours/";
      return true;
    });
    d.ambitos = ambitos; d.destinos = destinos; d.zonas = zonas; d.inactivas = inactivas;
    d.porAmbito = porAmbito; d.porDestino = porDestino; d.porZona = porZona;
    d.hayEjemplo = d.propiedades.concat(d.tours).some(function (x) { return x.ejemplo === true; });
    return d;
  }
  /* embarcaciones.json: [ { id, nombre, tipo, capacidad, descripcion, incluye, zona, fotos, videos } ] */
  function validarBarcos(lista_) {
    var vistos = {};
    return lista(lista_).filter(function (b, i) {
      if (!b || !b.id || !b.nombre) { aviso("En embarcaciones.json, el bloque #" + (i + 1) + " no tiene id o nombre: no se muestra."); return false; }
      if (vistos[b.id]) { aviso("En embarcaciones.json, el id \"" + b.id + "\" está repetido."); return false; }
      vistos[b.id] = 1;
      if (b.activa === false) return false;
      var fotos = [], alts = [];
      lista(b.fotos).forEach(function (f) { var r = f && typeof f === "object" ? f.archivo : f; if (r) { fotos.push(r); alts.push(f.alt || ""); } });
      b.fotos = fotos; b.alts = alts; b.incluye = lista(b.incluye).filter(Boolean);
      b.videos = lista(b.videos).filter(function (v) { return v && v.archivo; });
      b.carpeta = "fotos/embarcaciones/";
      return true;
    });
  }
  function nombreZona(d, id) { var z = d.porZona[id]; return z ? z.nombre : (id || ""); }
  function deZona(d, id) { return d.propiedades.filter(function (p) { return p.zona === id; }); }
  function destacadasPrimero(a, b) { return (b.destacada === true) - (a.destacada === true); }
  /* Foto de una zona: la suya, o la primera foto de una propiedad de esa zona */
  function fotoZona(d, z) {
    if (z.foto) return { r: z.foto, carpeta: "fotos/", alt: "" };
    /* Prefiere una foto de afuera (piscina, playa, exterior) de una propiedad destacada */
    var props = deZona(d, z.id).filter(function (x) { return x.fotos.length; }).sort(destacadasPrimero);
    var GUSTA = ["Piscina", "Exterior", "Jardín", "Playa y mar", "Terraza"];
    for (var g = 0; g < GUSTA.length; g++) {
      for (var i = 0; i < props.length; i++) {
        var k = props[i].alts.indexOf(GUSTA[g]);
        if (k > -1) return { r: props[i].fotos[k], carpeta: props[i].carpeta, alt: GUSTA[g] };
      }
    }
    var p = props[0];
    return p ? { r: p.fotos[0], carpeta: p.carpeta, alt: p.alts[0] || "" } : null;
  }

  function cargar() {
    if (D) return D;
    D = bajar("config", RESPALDO_CFG).then(function (cfg) {
      CFG = cfg || RESPALDO_CFG;
      return Promise.all([bajar("destinos", { ambitos: [] }), bajar("propiedades", []), bajar("tours", []), bajar("embarcaciones", [])]);
    }).then(function (r) { var d = validar({ destinos: r[0], propiedades: r[1], tours: r[2] }); d.embarcaciones = validarBarcos(r[3]); return d; });
    return D;
  }

  /* Cuando no se pudo leer nada (por ejemplo, al abrir el archivo directo sin servidor) */
  function sinDatos(caja) {
    if (!caja) return;
    caja.innerHTML = '<div class="vacio"><h3>No pudimos cargar la información</h3><p>Escríbanos por WhatsApp y con gusto le enviamos las opciones disponibles.</p>' +
      botonWa("Escribir por WhatsApp", msg("general")) + "</div>";
  }

  /* ------------------------------------------------------------ piezas que se repiten */
  function etiquetaEjemplo(x) { return x.ejemplo === true ? '<span class="ejemplo">Ejemplo</span>' : ""; }
  function botonWa(texto, mensaje, clase) {
    return '<a class="boton ' + (clase || "") + '" href="' + esc(waUrl(mensaje)) + '" target="_blank" rel="noopener">' + icono("wa") + "<span>" + esc(texto) + "</span></a>";
  }

  /* Tarjeta de propiedad: hasta 5 fotos que se deslizan con el dedo (o con flechas en la computadora) */
  var FOTOS_TARJETA = 5;
  function tarjeta(d, p, sizes) {
    var url = "propiedad.html?id=" + encodeURIComponent(p.id);
    var cat = categoria(p.categoria), t = partes(p.nombre);
    var datos = [], todo = [p.nombre, p.resumen].concat(p.incluye).join(" ");
    if (p.capacidad) datos.push(dato("👥", String(p.capacidad), plural(p.capacidad, "persona", "personas")));
    if (p.habitaciones) datos.push(dato("🛏️", String(p.habitaciones), plural(p.habitaciones, "habitación", "habitaciones")));
    if (p.banos) datos.push(dato("🚿", String(p.banos).replace(".", ","), String(p.banos).replace(".", ",") + (p.banos === 1 ? " baño" : " baños")));
    if (/piscina/i.test(todo)) datos.push(dato("🏊", "Piscina", "Piscina"));
    if (/playa|frente al mar/i.test(todo)) datos.push(dato("🏖️", "Playa", "Playa"));
    var fotos = p.fotos.slice(0, FOTOS_TARJETA), n = fotos.length;
    var sz = sizes || "(min-width:900px) 30vw, 88vw";
    var pista = n ? '<span class="t-pista" data-t-pista>' + fotos.map(function (r, k) {
      return img(r, p.carpeta, k ? "" : (p.alts[0] || ""), sz, 600);
    }).join("") + "</span>" : '<span class="sin-foto">' + icono("camara") + "</span>";
    var puntos = n > 1 ? '<span class="t-puntos" aria-hidden="true">' + fotos.map(function (_, k) { return "<i" + (k ? "" : ' class="on"') + "></i>"; }).join("") + "</span>" +
      '<button type="button" class="t-flecha t-ant" data-t-mover="-1" aria-label="Foto anterior">' + icono("izq") + "</button>" +
      '<button type="button" class="t-flecha t-sig" data-t-mover="1" aria-label="Foto siguiente">' + icono("der") + "</button>" : "";
    return '<article class="tarjeta">' +
      '<div class="tarjeta-foto"><a class="t-enlace" href="' + url + '" tabindex="-1" aria-hidden="true">' + pista + "</a>" + puntos +
      etiquetaEjemplo(p) + (cat.nombre ? '<span class="tarjeta-cat">' + esc(cat.nombre) + "</span>" : "") + "</div>" +
      '<div class="tarjeta-texto">' +
      '<p class="tarjeta-tipo">' + esc(nombreTipo(p.tipo)) + " · " + esc(nombreZona(d, p.zona)) + "</p>" +
      '<h3><a href="' + url + '">' + esc(t[0]) + "</a></h3>" + (t[1] ? '<p class="tarjeta-sub">' + esc(t[1]) + "</p>" : "") +
      (p.resumen ? '<p class="tarjeta-resumen">' + esc(p.resumen) + "</p>" : "") +
      '<p class="tarjeta-datos">' + datos.join("") + "</p>" +
      '<div class="tarjeta-acciones">' + botonWa("Consultar disponibilidad", msg("propiedad", { propiedad: p.nombre, zona: nombreZona(d, p.zona) }), "boton-reserva") +
      '<a class="enlace tarjeta-ver" href="' + url + '">Ver fotos y detalles' + icono("flecha") + "</a></div>" +
      "</div></article>";
  }
  /* Fotos dentro de las tarjetas: los puntos siguen la foto; flechas en la computadora */
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-t-mover]"); if (!b) return;
    ev.preventDefault();
    var pista = $("[data-t-pista]", b.parentNode); if (!pista) return;
    var n = pista.children.length, i = Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth)) + (+b.getAttribute("data-t-mover"));
    i = (i + n) % n;
    pista.scrollTo({ left: i * pista.clientWidth, behavior: quieto ? "auto" : "smooth" });
  });
  document.addEventListener("scroll", function (ev) {
    var pista = ev.target;
    if (!pista.matches || !pista.matches("[data-t-pista]")) return;
    var i = Math.round(pista.scrollLeft / Math.max(1, pista.clientWidth));
    $$(".t-puntos i", pista.closest(".tarjeta-foto")).forEach(function (p, k) { p.classList.toggle("on", k === i); });
  }, true);

  function tarjetaTour(t) {
    var incl = t.incluye.length ? listaEmoji(t.incluye) : "";
    var precio = tarifa();  /* sin precios: cambian por temporada y fin de semana, se consultan por WhatsApp */
    return '<article class="tour"><span class="tour-velo" aria-hidden="true"></span>' +
      '<div class="tour-foto">' + (t.fotos[0] ? img(t.fotos[0], t.carpeta, t.alts[0] || "", "(min-width:900px) 30vw, 84vw", 600) : "") + etiquetaEjemplo(t) +
      (t.duracion ? '<span class="tour-dur">' + icono("reloj") + esc(t.duracion) + "</span>" : "") + "</div>" +
      '<div class="tour-texto"><h3>' + esc(t.nombre) + "</h3>" + (t.resumen ? "<p>" + esc(t.resumen) + "</p>" : "") + incl + precio +
      botonWa("Consultar disponibilidad", msg("tour", { tour: t.nombre }), "boton-reserva") +
      "</div></article>";
  }
  /* Bloque "Muy pronto": nunca tarjetas inventadas */
  function muyPronto(titulo, texto, mensaje, boton) {
    return '<div class="pronto"><span class="pronto-sello">Muy pronto</span><h3>' + esc(titulo) + "</h3><p>" + esc(texto) + "</p>" +
      botonWa(boton || "Preguntar por WhatsApp", mensaje, "boton-wa") + "</div>";
  }

  /* ------------------------------------------------------------ lo común a todas las páginas */
  function comun(d) {
    /* Número y mensajes de WhatsApp desde config.json */
    $$("[data-wa]").forEach(function (a) {
      if (a.dataset.wa === "general") a.href = waUrl(msg("general"));
      if (a.dataset.wa === "secundario") {
        if (!CFG.whatsapp_secundario) { a.hidden = true; return; }
        a.href = waUrl(msg("general"), CFG.whatsapp_secundario);
      }
    });
    $$("[data-wa-visible]").forEach(function (s) { var v = CFG.whatsapp_principal_visible || CFG.whatsapp_visible; if (v) s.textContent = v; });
    $$("[data-wa2-visible]").forEach(function (s) { if (CFG.whatsapp_secundario_visible) s.textContent = CFG.whatsapp_secundario_visible; });
    $$("[data-wa2-etiqueta]").forEach(function (s) { if (CFG.etiqueta_whatsapp_secundario) s.textContent = CFG.etiqueta_whatsapp_secundario; });
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
    /* Logo: si config.json trae "logo" (por ejemplo "fotos/logo.webp"), reemplaza el nombre escrito */
    if (CFG.logo) $$("[data-logo]").forEach(function (i) { if (i.getAttribute("src") !== CFG.logo) i.src = CFG.logo; });
    /* Video de la portada (config.json → video_portada): si existe, va de fondo con las olas encima */
    var vp = $("[data-video-portada]"), red = navigator.connection;
    if (vp && CFG.video_portada && !quieto && !(red && red.saveData)) {
      var v = document.createElement("video");
      v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.preload = "metadata";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      v.addEventListener("loadeddata", function () { vp.closest("[data-portada]").classList.add("con-video"); });
      v.src = CFG.video_portada; vp.appendChild(v);
      var pv = v.play(); if (pv && pv.catch) pv.catch(function () {});
    }
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

  /* ------------------------------------------------------------ páginas */
  var PAGINAS = {};

  /* ---- Inicio ---- */
  /* Portada: las fotos se relevan solas, despacio */
  safe(function () {
    var caja = $("[data-relevo]"); if (!caja) return;
    var capas = $$("[data-capa]", caja), i = 0;
    if (capas.length > 1 && !quieto) {
      capas.forEach(function (c) { c.loading = "eager"; });
      setInterval(function () {
        var sig = (i + 1) % capas.length;
        /* Con internet lento, espera a que la siguiente foto termine de bajar: nunca deja la portada a oscuras */
        if (document.hidden || !capas[sig].complete || !capas[sig].naturalWidth) return;
        capas[i].classList.remove("activa");
        capas[sig].classList.add("activa");
        i = sig;
      }, 6500);
    }
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

  /* Tarjeta de zona (destinos nacionales e internacionales). Las de "próximamente" llevan su etiqueta */
  function tarjetaZona(d, z) {
    var f = fotoZona(d, z), n = deZona(d, z.id).length, x = d.porDestino[z.destino];
    return '<a class="destino' + (z.proximamente ? " destino-pronto" : "") + '" href="destino.html?z=' + encodeURIComponent(z.id) + '"><span class="borde-oro" aria-hidden="true"></span>' +
      (f ? img(f.r, f.carpeta, "", "(min-width:900px) 34vw, 84vw", 1600) : '<span class="destino-sinfoto" aria-hidden="true">' + icono("ola") + "</span>") +
      '<span class="destino-texto">' + (z.proximamente ? '<span class="pronto-sello">Próximamente</span>' : "") +
      "<strong>" + esc(z.nombre) + "</strong>" + (z.descripcion ? "<small>" + esc(z.descripcion) + "</small>" : "") +
      '<span class="destino-zonas"><span>' + esc(x ? x.nombre : "") + "</span>" + (n ? "<span>" + plural(n, "propiedad", "propiedades") + "</span>" : "") + "</span></span></a>";
  }
  /* Al final de los internacionales: cualquier otro país se cotiza con los servicios de viaje */
  function tarjetaOtroPais() {
    return '<a class="destino destino-viajes" href="viajes.html"><span class="borde-oro" aria-hidden="true"></span><span class="destino-viajes-ic" aria-hidden="true">' + icono("avion") + "</span>" +
      '<span class="destino-texto"><strong>¿Viaja a otro país?</strong><small>Boletos aéreos, hoteles en todo el mundo, tours y renta de vehículos. Le cotizamos por WhatsApp.</small>' +
      '<span class="destino-zonas"><span>Servicios de viaje</span></span></span></a>';
  }
  /* Destinos agrupados: Nacionales e Internacionales */
  function bloquesAmbitos(d, titulo) {
    return d.ambitos.map(function (a) {
      var zs = d.zonas.filter(function (z) { return z.ambito === a.id; });
      if (!zs.length) return "";
      zs.sort(function (x, y) { return (x.proximamente === true) - (y.proximamente === true) || deZona(d, y.id).length - deZona(d, x.id).length; });
      return '<div class="ambito-bloque"><div class="ambito-cabeza"><' + titulo + ">" + esc(a.nombre) + "</" + titulo + ">" +
        '<span class="ambito-paises">' + a.destinos.map(function (x) { return '<a href="destino.html?d=' + encodeURIComponent(x.id) + '">' + esc(x.nombre) + "</a>"; }).join("") + "</span></div>" +
        '<div class="rejilla-destinos deslizable">' + zs.map(function (z) { return tarjetaZona(d, z); }).join("") +
        (a.id === "internacional" ? tarjetaOtroPais() : "") + "</div></div>";
    }).join("");
  }
  function pintarDestinos(d) {
    $$("[data-destinos-lista]").forEach(function (c) { if (d.zonas.length) c.innerHTML = bloquesAmbitos(d, c.getAttribute("data-titulo") || "h3"); });
  }
  function pintarTours(caja, lista, ambito) {
    if (!caja) return;
    caja.classList.remove("cargando");
    var a = (ambito && D && ambito) || "";
    caja.innerHTML = lista.length ? lista.map(tarjetaTour).join("") :
      muyPronto("Tours " + (ambito === "internacional" ? "internacionales" : "nacionales"),
        "Muy pronto. Escríbanos y le contamos.",
        msg("tours_pronto", { ambito: ambito === "internacional" ? "internacionales" : "nacionales" }));
  }
  /* Opciones de zona según el ámbito elegido (sin zonas "próximamente" ni zonas vacías) */
  function opcionesZona(d, sel, ambito, actual) {
    var zs = d.zonas.filter(function (z) { return (!ambito || z.ambito === ambito) && deZona(d, z.id).length; });
    sel.innerHTML = '<option value="">Todas las zonas</option>' + zs.map(function (z) { return '<option value="' + esc(z.id) + '">' + esc(z.nombre) + "</option>"; }).join("");
    sel.value = zs.some(function (z) { return z.id === actual; }) ? actual : "";
  }

  PAGINAS.inicio = function (d) {
    pintarDestinos(d);
    pintarTours($("[data-tours-inicio]"), d.tours.filter(function (t) { return t.ambito === "nacional"; }).slice(0, 3), "nacional");
    /* Buscador: las zonas cambian según Nacional o Internacional */
    var pase = $("[data-pase]");
    if (pase) {
      var amb = $("[data-pase-ambito]", pase), zon = $("[data-pase-zona]", pase);
      opcionesZona(d, zon, amb.value, "");
      amb.addEventListener("change", function () { opcionesZona(d, zon, amb.value, zon.value); });
    }
    /* Accesos por tipo: solo los tipos que tienen propiedades, con foto y cantidad */
    var tipos = $("[data-tipos]");
    if (tipos && d.propiedades.length) {
      tipos.innerHTML = Object.keys(CFG.tipos || {}).map(function (t) {
        var de = d.propiedades.filter(function (p) { return p.tipo === t; });
        if (!de.length) return "";
        var f = de.filter(function (p) { return p.fotos.length; }).sort(destacadasPrimero)[0] || {};
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
      else caja.innerHTML = dest.slice(0, 6).map(function (p) { return tarjeta(d, p); }).join("");
    }
  };

  /* ---- Catálogo ---- */
  var CLAVES = ["ambito", "zona", "tipo", "categoria", "personas"];
  PAGINAS.hospedajes = function (d) {
    var res = $("[data-resultados]"), cuenta = $("[data-cuenta-cat]"), activos = $("[data-activos]");
    var panel = $("[data-filtros]"), form = $("[data-form-filtros]"), abrir = $("[data-abrir-filtros]");
    var nFil = $("[data-n-filtros]"), verN = $("[data-ver-n]"), zonaSel = $("[data-f-zona]"), ayuda = $("[data-f-cat-ayuda]");
    var pestanas = $$("[data-pestana]");
    res.classList.remove("cargando");
    if (!d.propiedades.length) { cuenta.textContent = "Sin propiedades por ahora"; sinDatos(res); return; }

    var f = {};
    CLAVES.forEach(function (k) { f[k] = param(k); });
    /* Enlaces viejos con ?destino=: se pasan al ámbito de ese país */
    if (!f.ambito && param("destino") && d.porDestino[param("destino")]) f.ambito = d.porDestino[param("destino")].ambito;
    if (f.ambito && !d.porAmbito[f.ambito]) f.ambito = "";
    if (f.zona && d.porZona[f.zona] && !f.ambito) f.ambito = d.porZona[f.zona].ambito;
    if (f.personas && !(+f.personas > 0)) f.personas = "";

    function chips(caja, nombre, opciones) {
      caja.innerHTML = opciones.map(function (o) {
        return '<label class="chip"><input type="radio" name="' + nombre + '" value="' + esc(o[0]) + '"><span>' + esc(o[1]) + "</span></label>";
      }).join("");
    }
    var tiposUsados = Object.keys(CFG.tipos || {}).filter(function (t) { return d.propiedades.some(function (p) { return p.tipo === t; }); });
    var catsUsadas = Object.keys(CFG.categorias || {}).filter(function (c) { return d.propiedades.some(function (p) { return p.categoria === c; }); });
    chips($("[data-f-tipo]"), "tipo", [["", "Todos"]].concat(tiposUsados.map(function (t) { return [t, nombreTipo(t, true)]; })));
    chips($("[data-f-categoria]"), "categoria", [["", "Todas"]].concat(catsUsadas.map(function (c) { return [c, categoria(c).nombre]; })));

    function marcar() {
      ["tipo", "categoria"].forEach(function (k) {
        $$('input[name="' + k + '"]', form).forEach(function (i) { i.checked = i.value === f[k]; });
      });
      opcionesZona(d, zonaSel, f.ambito, f.zona);
      f.zona = zonaSel.value;
      pestanas.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.pestana === f.ambito ? "true" : "false"); });
      var on = $('[data-pestana][aria-pressed="true"]'), linea = $("[data-pestana-linea]");
      if (on && linea) { linea.style.width = on.offsetWidth + "px"; linea.style.transform = "translateX(" + on.offsetLeft + "px)"; }
      var c = f.categoria && categoria(f.categoria);
      ayuda.hidden = !(c && c.descripcion);
      if (c && c.descripcion) ayuda.textContent = c.descripcion;
    }
    var listo = false;
    var cont = contador($("[data-f-personas]"), function (n) {
      if (!listo) return;
      f.personas = n ? String(n) : ""; aplicar();
    });
    cont.poner(f.personas || 0);
    listo = true;

    function coincide(p) {
      return (!f.ambito || p.ambito === f.ambito) && (!f.zona || p.zona === f.zona) && (!f.tipo || p.tipo === f.tipo) &&
        (!f.categoria || p.categoria === f.categoria) && (!f.personas || p.capacidad >= +f.personas);
    }
    function etiqueta(k) {
      if (k === "ambito") { var a = d.porAmbito[f.ambito]; return a ? a.nombre : f.ambito; }
      if (k === "zona") return nombreZona(d, f.zona);
      if (k === "tipo") return nombreTipo(f.tipo, true);
      if (k === "categoria") return categoria(f.categoria).nombre;
      if (k === "personas") return "Desde " + plural(+f.personas, "persona", "personas");
      return f[k];
    }
    function aplicar() {
      marcar();
      /* URL compartible con los filtros */
      var q = new URLSearchParams();
      CLAVES.forEach(function (k) { if (f[k]) q.set(k, f[k]); });
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q.toString() : ""));
      var lista = d.propiedades.filter(coincide).sort(destacadasPrimero);
      var n = lista.length, txt = plural(n, "propiedad", "propiedades");
      cuenta.innerHTML = "<b>" + n + "</b>" + (n === 1 ? "propiedad" : "propiedades");
      verN.textContent = n ? "Ver " + txt : "Sin resultados";
      var usados = CLAVES.filter(function (k) { return f[k] && k !== "ambito"; });
      nFil.hidden = !usados.length; nFil.textContent = usados.length;
      activos.innerHTML = usados.map(function (k) {
        return '<button type="button" class="activo-chip" data-quitar="' + k + '" aria-label="Quitar filtro ' + esc(etiqueta(k)) + '">' + esc(etiqueta(k)) + icono("cerrar") + "</button>";
      }).join("") + (usados.length > 1 ? '<button type="button" class="limpiar" data-limpiar>Limpiar todo</button>' : "");
      if (n) {
        res.innerHTML = lista.map(function (p) { return tarjeta(d, p, "(min-width:1200px) 26vw, (min-width:900px) 34vw, 88vw"); }).join("");
      } else {
        /* Si la zona elegida abre pronto, se dice así; si no, mensaje amable */
        var pz = f.zona && d.porZona[f.zona];
        res.innerHTML = pz && pz.proximamente ? muyPronto(pz.nombre, pz.descripcion || "Muy pronto tendremos hospedajes aquí.", msg("proximamente", { zona: pz.nombre }), "Quiero saber cuando abra") :
          '<div class="vacio"><h3>No encontramos propiedades con esos filtros</h3><p>Pruebe quitando alguno, o escríbanos y le buscamos opciones.</p><div class="botones">' +
          '<button type="button" class="boton boton-claro" data-limpiar>Limpiar filtros</button>' + botonWa("Escribir por WhatsApp", msg("sin_resultados")) + "</div></div>";
      }
    }
    form.addEventListener("change", function (ev) {
      var t = ev.target;
      if (t.name in f) f[t.name] = t.value;
      aplicar();
    });
    pestanas.forEach(function (b) {
      b.addEventListener("click", function () { f.ambito = b.dataset.pestana; f.zona = ""; aplicar(); });
    });
    window.addEventListener("resize", marcar);
    document.addEventListener("click", function (ev) {
      var q = ev.target.closest("[data-quitar]"), l = ev.target.closest("[data-limpiar]");
      if (q) { f[q.dataset.quitar] = ""; if (q.dataset.quitar === "personas") cont.poner(0); aplicar(); }
      if (l) { CLAVES.forEach(function (k) { if (k !== "ambito") f[k] = ""; }); cont.poner(0); aplicar(); }
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
  function abrirVisor(fotos, carpeta, alts, inicio) {
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
      return '<figure><img data-src="' + esc(fotoUrl(r, carpeta, 1600)) + '" alt="' + esc(alts[k] || "Foto " + (k + 1) + " de " + fotos.length) + '" decoding="async"></figure>';
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
  var PLATAFORMAS = [["airbnb", "Airbnb"], ["booking", "Booking"], ["expedia", "Expedia"], ["agoda", "Agoda"], ["tripadvisor", "TripAdvisor"]];
  function rutaVideo(r) { return /^https?:\/\//.test(r) || /^fotos\//.test(r) ? r : "fotos/propiedades/" + r; }
  function youtube(u) {
    var m = String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{6,})/);
    return m ? m[1] : "";
  }
  function altFoto(p, k) {
    var a = p.alts[k] && p.alts[k] !== "Foto de la propiedad" ? p.alts[k] : nombreTipo(p.tipo);
    return a + " en " + nombreZona(D_ACTUAL, p.zona) + ", foto " + (k + 1) + " de " + p.fotos.length;
  }
  var D_ACTUAL = null;
  function noDisponible(caja, titulo, texto) {
    caja.innerHTML = '<div class="contenedor no-existe"><h1>' + esc(titulo) + "</h1><p>" + esc(texto) + "</p>" +
      '<div class="botones"><a class="boton boton-claro" href="hospedajes.html">Ver hospedajes' + icono("flecha") + "</a>" +
      botonWa("Escribir por WhatsApp", msg("general")) + "</div></div>";
  }
  PAGINAS.propiedad = function (d) {
    D_ACTUAL = d;
    var caja = $("[data-ficha]"), id = param("id");
    var p = d.propiedades.filter(function (x) { return x.id === id; })[0];
    if (!p) {
      var pausada = d.inactivas.filter(function (x) { return x.id === id; })[0];
      document.title = "Propiedad no disponible · " + (CFG.marca || "Cotomaya Venezuela");
      if (pausada) {
        noDisponible(caja, "Esta propiedad no está disponible por ahora", "Vea las demás o escríbanos y le buscamos otra.");
        aviso("La propiedad \"" + id + "\" tiene \"activa\": false en propiedades.json: no se muestra.");
      } else {
        noDisponible(caja, "No encontramos esa propiedad", "Puede que ya no esté disponible. Vea las demás o escríbanos.");
        if (!id) aviso("propiedad.html necesita ?id= en la dirección (por ejemplo propiedad.html?id=casa-aurora-tucacas).");
        else aviso("No existe una propiedad con id \"" + id + "\" en propiedades.json.");
      }
      return;
    }
    document.title = p.nombre + " · " + (CFG.marca || "Cotomaya Venezuela");
    var md = $('meta[name="description"]'); if (md && p.resumen) md.setAttribute("content", p.resumen);
    var cat = categoria(p.categoria), dest = d.porDestino[p.destino], zona = nombreZona(d, p.zona), amb = d.porAmbito[p.ambito];
    var mensaje = msg("propiedad", { propiedad: p.nombre, zona: zona });

    /* Galería: en el teléfono se desliza con el dedo; en la computadora, mosaico de 5 y visor con todas */
    var n = p.fotos.length, gal = "";
    if (n) {
      gal = '<div class="galeria"><div class="tira-galeria"><div class="tira" data-tira>' + p.fotos.map(function (r, k) {
        return '<button type="button" data-foto="' + k + '" aria-label="Ver foto ' + (k + 1) + ' de ' + n + ' en grande">' +
          img(r, p.carpeta, altFoto(p, k), k ? "(min-width:900px) 25vw, 100vw" : "(min-width:900px) 50vw, 100vw", k ? 600 : 1600, k ? "" : ' fetchpriority="high" loading="eager"') + "</button>";
      }).join("") + "</div>" +
        (n > 1 ? '<span class="tira-cuenta" data-tira-cuenta>1 / ' + n + "</span>" : "") +
        '<button type="button" class="tira-todas" data-todas>' + icono("camara") + (n > 1 ? "Ver las " + n + " fotos" : "Ver foto") + "</button></div>" +
        (n > 1 ? '<div class="minis" data-minis>' + p.fotos.map(function (r, k) {
          return '<button type="button" data-mini="' + k + '" aria-label="Foto ' + (k + 1) + '"' + (k ? "" : ' aria-current="true"') + ">" + img(r, p.carpeta, "", "74px", 600) + "</button>";
        }).join("") + "</div>" : "") + "</div>";
    }

    /* Datos */
    var datos = '<dl class="datos-ficha">' +
      "<div><dt>" + emoji("🏡") + "Tipo</dt><dd>" + esc(nombreTipo(p.tipo)) + "</dd></div>" +
      (p.capacidad ? "<div><dt>" + emoji("👥") + "Personas</dt><dd>" + p.capacidad + "</dd></div>" : "") +
      (p.habitaciones ? "<div><dt>" + emoji("🛏️") + "Habitaciones</dt><dd>" + p.habitaciones + "</dd></div>" : "") +
      (p.banos ? "<div><dt>" + emoji("🚿") + "Baños</dt><dd>" + String(p.banos).replace(".", ",") + "</dd></div>" : "") +
      '<div class="ancho"><dt>' + emoji("📍") + "Zona</dt><dd>" + esc(zona) + (dest ? ", " + esc(dest.nombre) : "") + "</dd></div>" +
      (cat.nombre ? '<div class="ancho dato-cat"><dt>Categoría</dt><dd><span class="sello-cat">' + esc(cat.nombre) + "</span></dd>" + (cat.descripcion ? "<p>" + esc(cat.descripcion) + "</p>" : "") + "</div>" : "") +
      "</dl>";

    /* Reserva: solo las plataformas con enlace, y siempre WhatsApp */
    var plats = PLATAFORMAS.filter(function (x) { return p.enlaces[x[0]]; });
    var reserva = '<aside class="reserva" aria-label="Reservar">' + "<h2>" + emoji("📅") + "Reservar</h2>" + tarifa() +
      (plats.length ? "<p>Reserve en la plataforma que prefiera:</p><div class=\"plataformas\">" + plats.map(function (x) {
        return '<a class="plat plat-' + x[0] + '" href="' + esc(p.enlaces[x[0]]) + '" target="_blank" rel="noopener">Reservar en ' + x[1] + "<small>Abre " + x[1] + "</small></a>";
      }).join("") + '</div><p class="reserva-o">o directo con nosotros</p>' : "<p>Escríbanos con sus fechas y le confirmamos la disponibilidad.</p>") +
      botonWa("Consultar disponibilidad", mensaje, "boton-reserva") +
      (p.ubicacion_maps ? '<a class="boton boton-claro" href="' + esc(p.ubicacion_maps) + '" target="_blank" rel="noopener">' + icono("mapa") + "<span>Ver en Google Maps</span></a>" : "") +
      "</aside>";

    /* Videos (hasta 5): no se descargan hasta que le dan play */
    var videos = p.videos.length ? '<section class="ficha-bloque"><h2>' + emoji("🎬") + 'Videos</h2><div class="videos">' + p.videos.map(function (v, k) {
      var portada = v.portada ? '<img src="' + esc(rutaVideo(v.portada)) + '" alt="" loading="lazy" decoding="async" width="640" height="360">' : "";
      return '<div class="video"><button type="button" class="video-play" data-video="' + esc(rutaVideo(v.archivo)) + '" data-portada="' + esc(v.portada ? rutaVideo(v.portada) : "") + '" aria-label="Reproducir video ' + (k + 1) + '">' + portada + "<i>" + icono("play") + "</i></button></div>";
    }).join("") + "</div></section>" : "";

    var incluye = p.incluye.length ? '<section class="ficha-bloque"><h2>' + emoji("✅") + "Qué incluye</h2>" + listaEmoji(p.incluye, "incluye") + "</section>" : "";
    var nota = p.nota ? '<p class="nota-ficha">' + icono("info") + "<span>" + esc(p.nota) + "</span></p>" : "";
    var desc = p.descripcion || p.resumen;
    var texto = desc ? '<section class="ficha-bloque ficha-texto"><h2>' + emoji("🏡") + "La propiedad</h2>" + String(desc).split(/\n+/).map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("") + "</section>" : "";

    /* Otras en la misma zona (o en el mismo país) */
    var otras = d.propiedades.filter(function (x) { return x.id !== p.id && x.zona === p.zona; }).sort(destacadasPrimero), tituloOtras = "Otras en " + zona, filtro = "zona=" + encodeURIComponent(p.zona);
    if (!otras.length) { otras = d.propiedades.filter(function (x) { return x.id !== p.id && x.destino === p.destino; }).sort(destacadasPrimero); tituloOtras = "Otras en " + (dest ? dest.nombre : "este destino"); filtro = "ambito=" + encodeURIComponent(p.ambito); }
    var bloqueOtras = otras.length ? '<section class="seccion oscuro"><div class="contenedor"><div class="titulo-fila"><h2>' + emoji("🏡") + esc(tituloOtras) + '</h2><a class="enlace" href="hospedajes.html?' + filtro + '">Ver todas' + icono("flecha") + "</a></div>" +
      '<div class="rejilla-tarjetas deslizable">' + otras.slice(0, 3).map(function (x) { return tarjeta(d, x); }).join("") + "</div></div></section>" : "";

    caja.innerHTML = '<div class="contenedor ficha-cabeza"><nav class="migas" aria-label="Ruta"><a href="hospedajes.html">Hospedajes</a><span aria-hidden="true">/</span>' +
      (amb ? '<a href="hospedajes.html?ambito=' + encodeURIComponent(p.ambito) + '">' + esc(amb.nombre) + '</a><span aria-hidden="true">/</span>' : "") +
      '<a href="destino.html?z=' + encodeURIComponent(p.zona) + '">' + esc(zona) + "</a></nav>" +
      "<h1>" + esc(p.nombre) + (p.ejemplo === true ? ' <span class="ejemplo ejemplo-ficha">Ejemplo</span>' : "") + "</h1>" +
      '<p class="ficha-sub">' + esc(nombreTipo(p.tipo)) + " · " + esc(zona) + (cat.nombre ? ' · <span class="sello-cat">' + esc(cat.nombre) + "</span>" : "") + "</p></div>" +
      gal + '<div class="contenedor ficha-cuerpo"><div class="ficha-izq">' + datos + nota + texto + incluye + videos + "</div>" + reserva + "</div>" + bloqueOtras;

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
      var alts = p.fotos.map(function (_, k) { return altFoto(p, k); });
      $$("[data-foto]", tira).forEach(function (b) { b.addEventListener("click", function () { abrirVisor(p.fotos, p.carpeta, alts, +b.dataset.foto); }); });
      $("[data-todas]", caja).addEventListener("click", function () { abrirVisor(p.fotos, p.carpeta, alts, window.innerWidth >= 900 ? 0 : actual); });
      if (minis) $$("[data-mini]", minis).forEach(function (b) {
        b.addEventListener("click", function () { tira.scrollTo({ left: +b.dataset.mini * tira.clientWidth, behavior: quieto ? "auto" : "smooth" }); });
      });
    }
    $$("[data-video]", caja).forEach(function (b) {
      b.addEventListener("click", function () {
        var src = b.dataset.video, yt = youtube(src), cont = b.parentNode, el;
        if (yt) {
          el = document.createElement("iframe");
          el.src = "https://www.youtube-nocookie.com/embed/" + yt + "?autoplay=1&rel=0"; el.title = "Video de la propiedad";
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


  /* ---- Destinos: lista, un país (?d=) o una zona (?z=) ---- */
  PAGINAS.destino = function (d) {
    var idD = param("d"), idZ = param("z"), caja = $("[data-destino]");
    var tit = $("[data-cabeza-titulo]"), lead = $("[data-cabeza-lead]"), chips = $("[data-zonas]");
    function cabeza(t, l, f) {
      tit.textContent = t; lead.textContent = l || "";
      document.title = t + " · " + (CFG.marca || "Cotomaya Venezuela");
      if (f) { var im = $("[data-cabeza] img"); im.removeAttribute("srcset"); im.src = fotoUrl(f.r, f.carpeta, 1600); im.alt = f.alt || ""; }
    }
    function rejilla(props) {
      return '<div class="rejilla-tarjetas">' + props.sort(destacadasPrimero).map(function (p) { return tarjeta(d, p); }).join("") + "</div>";
    }
    function seccion(clase, titulo, enlace, cuerpo) {
      return '<section class="seccion ' + clase + '"><div class="contenedor"><div class="titulo-fila"><h2>' + esc(titulo) + "</h2>" + (enlace || "") + "</div>" + cuerpo + "</div></section>";
    }
    function bloqueTours(tours, donde) {
      return tours.length ? seccion("seccion-azul", "Tours y paseos en " + donde, '<a class="enlace" href="tours.html">Ver todos' + icono("flecha") + "</a>",
        '<div class="rejilla-tours deslizable">' + tours.map(tarjetaTour).join("") + "</div>") : "";
    }
    var z = idZ && d.porZona[idZ], x = idD && d.porDestino[idD];
    if ((idZ && !z) || (idD && !x)) aviso("No existe " + (idZ ? "la zona \"" + idZ : "el destino \"" + idD) + "\" en destinos.json.");

    if (z) {
      var pais = d.porDestino[z.destino], props = deZona(d, z.id);
      cabeza(z.nombre, z.descripcion, fotoZona(d, z));
      chips.innerHTML = (pais ? '<a class="zona-chip" href="destino.html?d=' + encodeURIComponent(pais.id) + '">' + icono("globo") + esc(pais.nombre) + "</a>" : "") +
        (props.length ? '<a class="zona-chip" href="hospedajes.html?zona=' + encodeURIComponent(z.id) + '">' + icono("filtro") + "Filtrar en el catálogo</a>" : "");
      chips.hidden = false;
      var otras = d.zonas.filter(function (o) { return o.id !== z.id && o.ambito === z.ambito; });
      var tours = d.tours.filter(function (t) { return t.zona === z.id; });
      caja.innerHTML =
        (z.proximamente && !props.length
          ? '<section class="seccion seccion-clara"><div class="contenedor">' + muyPronto(z.nombre, z.descripcion || "Muy pronto tendremos hospedajes aquí.", msg("proximamente", { zona: z.nombre }), "Quiero saber cuando abra") + "</div></section>"
          : seccion(props.length ? "oscuro" : "seccion-clara", "Hospedajes en " + z.nombre, "", props.length ? rejilla(props) :
            '<div class="vacio"><p>Pronto publicaremos hospedajes aquí. Escríbanos y le contamos qué tenemos.</p>' + botonWa("Preguntar por WhatsApp", msg("zona", { zona: z.nombre })) + "</div>")) +
        bloqueTours(tours, z.nombre) +
        (otras.length ? seccion("seccion-clara", "Otras zonas", "", '<div class="rejilla-destinos deslizable">' + otras.map(function (o) { return tarjetaZona(d, o); }).join("") + "</div>") : "");
      return;
    }
    if (x) {
      var zs = x.zonas, propsX = d.propiedades.filter(function (p) { return p.destino === x.id; });
      var conFoto = zs.map(function (o) { return fotoZona(d, o); }).filter(Boolean)[0];
      cabeza(x.nombre, x.descripcion, x.foto ? { r: x.foto, carpeta: "fotos/" } : conFoto);
      chips.innerHTML = zs.map(function (o) {
        return '<a class="zona-chip" href="destino.html?z=' + encodeURIComponent(o.id) + '">' + icono("mapa") + esc(o.nombre) + (o.proximamente ? " <em>pronto</em>" : "") + "</a>";
      }).join("");
      chips.hidden = !zs.length;
      caja.innerHTML =
        (zs.length ? seccion("seccion-clara", "Zonas en " + x.nombre, "", '<div class="rejilla-destinos deslizable">' + zs.map(function (o) { return tarjetaZona(d, o); }).join("") + "</div>") : "") +
        (propsX.length ? seccion("oscuro", "Hospedajes en " + x.nombre, '<a class="enlace" href="hospedajes.html?ambito=' + encodeURIComponent(x.ambito) + '">Filtrar' + icono("flecha") + "</a>", rejilla(propsX)) : "") +
        bloqueTours(d.tours.filter(function (t) { return t.destino === x.id; }), x.nombre);
      return;
    }
    /* Sin parámetros (o uno que no existe): todos los destinos */
    caja.innerHTML = '<section class="seccion seccion-clara"><div class="contenedor">' + bloquesAmbitos(d, "h2") + "</div></section>";
  };

  /* ---- Tours: Nacionales e Internacionales ---- */
  PAGINAS.tours = function (d) {
    $$("[data-tours-ambito]").forEach(function (caja) {
      var a = caja.getAttribute("data-tours-ambito");
      pintarTours(caja, d.tours.filter(function (t) { return t.ambito === a; }), a);
      if (caja.classList.contains("pila-tours")) pilaTours(caja);
    });
  };

  /* ---- Cómo reservar: las plataformas que de verdad tienen enlaces ---- */
  PAGINAS.reservar = function (d) {
    var caja = $("[data-plats-usadas]"); if (!caja) return;
    var usadas = PLATAFORMAS.filter(function (x) { return d.propiedades.some(function (p) { return p.enlaces[x[0]]; }); });
    if (usadas.length) caja.innerHTML = usadas.map(function (x) { return "<span>" + x[1] + "</span>"; }).join("");
  };


  /* ---- Servicios de viaje: tarjetas desde datos/servicios-viaje.json y mini formulario que arma el WhatsApp ---- */
  var NOTA_VIAJE = { id: "nota", tipo: "nota", etiqueta: "¿Algo más que debamos saber?", en_mensaje: "Comentarios" };
  function dosDig(n) { return (n < 10 ? "0" : "") + n; }
  function isoDia(d) { return d.getFullYear() + "-" + dosDig(d.getMonth() + 1) + "-" + dosDig(d.getDate()); }
  function hoyISO() { return isoDia(new Date()); }
  function ahoraISO() { var d = new Date(); return isoDia(d) + "T" + dosDig(d.getHours()) + ":" + dosDig(d.getMinutes()); }
  function diaSiguiente(iso) { var p = iso.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2] + 1); return isoDia(d); }
  function fechaBonita(v) {
    var p = v.split("T"), f = p[0].split("-"), t = f[2] + "/" + f[1] + "/" + f[0];
    if (p[1]) { var h = p[1].split(":"), hh = +h[0]; t += ", " + (hh % 12 || 12) + ":" + h[1] + (hh < 12 ? " a. m." : " p. m."); }
    return t;
  }
  function edadTexto(v) { return v === "0" ? "menos de 1 año" : v === "1" ? "1 año" : v + " años"; }
  function unirY(l) { return l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " y " + l[l.length - 1]; }
  function svgViaje(s, tam) {
    return '<svg class="ic" width="' + tam + '" height="' + tam + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (s.icono || "") + "</svg>";
  }
  function msgViaje(s) { return msg("viaje", { servicio: s.en_mensaje || s.nombre }); }
  function servicioValido(s, i) {
    if (!s || !s.id || !s.nombre) { aviso("En servicios-viaje.json, el servicio #" + (i + 1) + " no tiene id o nombre: no se muestra."); return false; }
    s.campos = lista(s.campos).filter(function (f, k) {
      if (!f || !f.id || !f.tipo) { aviso("En servicios-viaje.json, el campo #" + (k + 1) + " de \"" + s.nombre + "\" no tiene id o tipo."); return false; }
      return true;
    });
    return true;
  }
  function tarjetaServicio(s) {
    return '<a class="servicio" href="' + esc(waUrl(msgViaje(s))) + '" target="_blank" rel="noopener" data-servicio="' + esc(s.id) + '" id="s-' + esc(s.id) + '">' +
      '<span class="servicio-ic">' + svgViaje(s, 26) + '</span><span class="servicio-texto"><strong>' + esc(s.nombre) + "</strong><small>" + esc(s.descripcion || "") + "</small></span>" +
      '<span class="servicio-ir">Cotizar' + icono("flecha") + "</span></a>";
  }

  function campoViaje(f) {
    var id = "hv-" + f.id, req = f.obligatorio ? '<b aria-hidden="true">*</b>' : "";
    var etq = esc(f.etiqueta || f.id) + req;
    var reqAttr = f.obligatorio ? " required aria-required=\"true\"" : "";
    var abre = '<div class="campo-v campo-' + esc(f.tipo) + '" data-campo="' + esc(f.id) + '">';
    switch (f.tipo) {
      case "opciones":
        return '<fieldset class="campo-v campo-opciones" data-campo="' + esc(f.id) + '"><legend>' + etq + '</legend><div class="segmento">' +
          lista(f.opciones).map(function (o, k) {
            var marcado = f.defecto ? o === f.defecto : k === 0;
            return '<label><input type="radio" name="' + esc(f.id) + '" value="' + esc(o) + '"' + (marcado ? " checked" : "") + "><span>" + esc(o) + "</span></label>";
          }).join("") + "</div></fieldset>";
      case "numero":
        var def = f.defecto != null ? +f.defecto : (+f.minimo || 0);
        return abre + '<span class="etq" id="' + id + '-t">' + etq + '</span><div class="contador-p" role="group" aria-labelledby="' + id + '-t">' +
          '<button type="button" data-menos aria-label="Uno menos">−</button><output data-cuenta aria-live="polite">' + def + "</output>" +
          '<button type="button" data-mas aria-label="Uno más">+</button></div><input type="hidden" name="' + esc(f.id) + '" value="' + def + '"></div>';
      case "edades":
        return abre + '<span class="etq">' + esc(f.etiqueta || "Edades") + '<b aria-hidden="true">*</b></span><div class="edades" data-edades></div></div>';
      case "nota":
        return abre + '<label for="' + id + '">' + etq + '</label><textarea id="' + id + '" name="' + esc(f.id) + '" rows="3" maxlength="400" placeholder="Opcional"></textarea></div>';
      case "fecha":
      case "fecha_hora":
        return abre + '<label for="' + id + '">' + etq + '</label><input id="' + id + '" name="' + esc(f.id) + '" type="' + (f.tipo === "fecha" ? "date" : "datetime-local") + '"' + reqAttr + "></div>";
      default:
        return abre + '<label for="' + id + '">' + etq + '</label><input id="' + id + '" name="' + esc(f.id) + '" type="text" maxlength="80" autocomplete="off"' +
          (f.ayuda ? ' placeholder="' + esc(f.ayuda) + '"' : "") + reqAttr + "></div>";
    }
  }

  function hojaViaje(servicios) {
    var dlg = $("[data-hoja-viaje]"); if (!dlg) return null;
    var form = $("[data-hv-form]", dlg), cajaCampos = $("[data-hv-campos]", dlg), avisoV = $("[data-hv-aviso]", dlg), enviar = $("[data-hv-enviar]", dlg);
    var s = null, campos = [], desde = null;

    function valores() {
      var v = {};
      campos.forEach(function (f) {
        var el = $('[data-campo="' + f.id + '"]', form);
        if (f.tipo === "opciones") { var r = $("input:checked", el); v[f.id] = r ? r.value : ""; }
        else if (f.tipo === "edades") v[f.id] = $$("select", el).map(function (x) { return x.value; });
        else { var i = $('[name="' + f.id + '"]', el); v[f.id] = i ? String(i.value).trim() : ""; }
      });
      return v;
    }
    function aplica(f, v) {
      if (!f.si) return true;
      var x = v[f.si.campo];
      if ("es" in f.si) return x === f.si.es;
      if ("mayor_que" in f.si) return +x > +f.si.mayor_que;
      return true;
    }
    function minimo(f, v) {
      var base = f.tipo === "fecha" ? hoyISO() : ahoraISO(), ref = v[f.no_antes_de || f.despues_de];
      if (ref) {
        var r = f.despues_de && f.tipo === "fecha" ? diaSiguiente(ref) : ref;
        if (r > base) base = r;
      }
      return base;
    }
    /* Muestra lo que aplica, pone el tope de las fechas y arma las edades */
    function repasar() {
      var v = valores();
      campos.forEach(function (f) {
        var el = $('[data-campo="' + f.id + '"]', form);
        el.hidden = !aplica(f, v);
        if (f.tipo === "fecha" || f.tipo === "fecha_hora") {
          var i = $("input", el), m = minimo(f, v);
          i.min = m;
          if (i.value && i.value < m) { i.value = ""; v[f.id] = ""; }
        }
        if (f.tipo === "edades") {
          var n = Math.max(0, +v[f.segun] || 0), caja = $("[data-edades]", el), antes = v[f.id];
          if (caja.children.length !== n) {
            var ops = '<option value="">Edad</option><option value="0">Menos de 1 año</option>';
            for (var k = 1; k <= 17; k++) ops += '<option value="' + k + '">' + (k === 1 ? "1 año" : k + " años") + "</option>";
            var html = "";
            for (var j = 0; j < n; j++) html += '<label class="edad"><span>Niño ' + (j + 1) + '</span><select name="' + esc(f.id) + "-" + j + '">' + ops + "</select></label>";
            caja.innerHTML = html;
            $$("select", caja).forEach(function (sel, j) { if (antes[j]) sel.value = antes[j]; });
          }
        }
      });
    }
    function contadores() {
      $$(".campo-numero", form).forEach(function (el) {
        var f = campos.filter(function (x) { return x.id === el.dataset.campo; })[0];
        var out = $("[data-cuenta]", el), campo = $("input", el), min = +f.minimo || 0, max = +f.maximo || 30;
        function poner(n) { campo.value = n; out.textContent = f.unidad ? plural(n, f.unidad[0], f.unidad[1]) : n; repasar(); }
        $("[data-menos]", el).addEventListener("click", function () { if (+campo.value > min) poner(+campo.value - 1); });
        $("[data-mas]", el).addEventListener("click", function () { if (+campo.value < max) poner(+campo.value + 1); });
        if (f.unidad) out.textContent = plural(+campo.value, f.unidad[0], f.unidad[1]);
      });
    }
    function abrir(serv, boton) {
      s = serv; desde = boton || document.activeElement;
      campos = s.campos.concat([NOTA_VIAJE]);
      $("[data-hv-titulo]", dlg).textContent = s.nombre;
      $("[data-hv-ic]", dlg).innerHTML = svgViaje(s, 24);
      cajaCampos.innerHTML = campos.map(campoViaje).join("");
      avisoV.textContent = ""; avisoV.className = "hv-aviso";
      contadores(); repasar();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      document.documentElement.classList.add("hoja-abierta");
      cajaCampos.scrollTop = 0;
      history.replaceState(null, "", "#" + s.id);
    }
    function cerrar() { if (dlg.close) dlg.close(); else { dlg.removeAttribute("open"); alCerrar(); } }
    function alCerrar() {
      document.documentElement.classList.remove("hoja-abierta");
      history.replaceState(null, "", location.pathname + location.search);
      if (desde && desde.focus) desde.focus();
    }
    dlg.addEventListener("close", alCerrar);
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) cerrar(); });
    $("[data-hv-cerrar]", dlg).addEventListener("click", cerrar);
    form.addEventListener("input", function (ev) {
      var el = ev.target.closest("[data-campo]");
      if (el) { el.classList.remove("falta"); $$("[aria-invalid]", el).forEach(function (x) { x.removeAttribute("aria-invalid"); }); }
      if (!$(".falta", form)) { avisoV.textContent = ""; avisoV.className = "hv-aviso"; }
      repasar();
    });
    form.addEventListener("change", repasar);
    form.addEventListener("submit", function (ev) { ev.preventDefault(); });

    enviar.addEventListener("click", function (ev) {
      if (!s) { ev.preventDefault(); return; }
      repasar();
      var v = valores(), falta = [], mal = [], primero = null;
      campos.forEach(function (f) {
        var el = $('[data-campo="' + f.id + '"]', form);
        if (el.hidden) return;
        var vacioF = f.tipo === "edades" ? v[f.id].some(function (x) { return x === ""; }) : (f.obligatorio && !v[f.id]);
        var fueraDeRango = (f.tipo === "fecha" || f.tipo === "fecha_hora") && v[f.id] && v[f.id] < minimo(f, v);
        if (vacioF) falta.push(f.etiqueta || f.id);
        if (fueraDeRango) mal.push(f.etiqueta || f.id);
        if (vacioF || fueraDeRango) {
          el.classList.add("falta");
          $$("input, select, textarea", el).forEach(function (x) { if (!x.value || fueraDeRango) x.setAttribute("aria-invalid", "true"); });
          if (!primero) primero = $("input:not([type=hidden]), select, textarea", el);
        }
      });
      if (falta.length || mal.length) {
        ev.preventDefault();
        var t = falta.length ? (falta.length === 1 ? "Solo nos falta un dato para cotizarle: " : "Nos faltan estos datos para cotizarle: ") + unirY(falta) + "." : "";
        if (mal.length) t += (t ? " " : "") + "Revise " + unirY(mal) + ": no puede ser una fecha pasada ni anterior a la otra.";
        avisoV.textContent = t; avisoV.className = "hv-aviso hv-error";
        if (primero) { primero.focus(); if (primero.scrollIntoView) primero.scrollIntoView({ block: "center", behavior: quieto ? "auto" : "smooth" }); }
        return;
      }
      var lineas = [msgViaje(s)];
      campos.forEach(function (f) {
        var el = $('[data-campo="' + f.id + '"]', form), x = v[f.id];
        if (el.hidden) return;
        if (f.tipo === "numero") { if (!+x) return; x = f.unidad ? plural(+x, f.unidad[0], f.unidad[1]) : x; }
        else if (f.tipo === "edades") x = unirY(x.map(edadTexto));
        else if (f.tipo === "fecha" || f.tipo === "fecha_hora") x = x ? fechaBonita(x) : "";
        if (!x) return;
        lineas.push((f.en_mensaje || f.etiqueta || f.id) + ": " + x);
      });
      enviar.href = waUrl(lineas.join("\n"));
      avisoV.textContent = "Listo: le abrimos WhatsApp. Si no abrió, toque de nuevo.";
      avisoV.className = "hv-aviso hv-listo";
    });
    return { abrir: abrir };
  }

  function servicios(cb) {
    var incrustado = datos("[data-servicios-datos]");
    bajar("servicios-viaje", null).then(function (j) {
      var l = j ? (Array.isArray(j) ? j : j.servicios) : incrustado;
      cb(lista(l).filter(servicioValido));
    });
  }
  PAGINAS.viajes = function () {
    servicios(function (l) {
      if (!l.length) return;
      var caja = $("[data-servicios]");
      caja.innerHTML = l.map(tarjetaServicio).join("");
      var hoja = hojaViaje(l); if (!hoja) return;
      caja.addEventListener("click", function (ev) {
        var a = ev.target.closest("[data-servicio]"); if (!a) return;
        var s = l.filter(function (x) { return x.id === a.dataset.servicio; })[0]; if (!s) return;
        ev.preventDefault(); hoja.abrir(s, a);
      });
      var h = location.hash.replace("#", ""), pedido = l.filter(function (x) { return x.id === h; })[0];
      if (pedido) hoja.abrir(pedido, $('[data-servicio="' + h + '"]'));
      window.addEventListener("hashchange", function () {
        var x = location.hash.replace("#", ""), s = l.filter(function (y) { return y.id === x; })[0];
        if (s && !$("[data-hoja-viaje]").open) hoja.abrir(s, $('[data-servicio="' + x + '"]'));
      });
    });
  };
  /* En el inicio, los accesos a cada servicio salen del mismo JSON */
  function viajesInicio() {
    var caja = $("[data-servicios-inicio]"); if (!caja) return;
    servicios(function (l) {
      if (!l.length) return;
      caja.innerHTML = l.map(function (s) { return '<li><a href="viajes.html#' + encodeURIComponent(s.id) + '">' + svgViaje(s, 22) + "<span>" + esc(s.nombre) + "</span></a></li>"; }).join("");
    });
  }


  /* ================================================================
     Movimiento premium. Regla de oro: todo empieza visible y legible;
     esto solo mueve, escala o aclara. Solo transform y opacity.
     ================================================================ */
  var finoMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var pc = window.matchMedia("(min-width: 900px)");

  /* Portada: el sol se hunde y las tres olas se separan al bajar (paralaje leve) */
  safe(function () {
    var port = $("[data-atardecer]"); if (!port || quieto || !pc.matches) return;  /* en el teléfono, quietos: así nunca se cruzan con los botones */
    var capas = $$("[data-vel]", port), pend = false;
    function pintar() {
      pend = false;
      var y = window.scrollY;
      if (y > window.innerHeight * 1.3) return;
      capas.forEach(function (c) { c.style.transform = "translate3d(0," + (y * +c.getAttribute("data-vel")).toFixed(1) + "px,0)"; });
    }
    window.addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(pintar); } }, { passive: true });
    pintar();
  });

  /* Destinos: un brillo dorado recorre el borde al tocar la tarjeta */
  safe(function () {
    if (quieto) return;
    document.addEventListener("pointerdown", function (ev) {
      var d = ev.target.closest && ev.target.closest(".destino"); if (!d) return;
      d.classList.remove("brilla"); void d.offsetWidth; d.classList.add("brilla");
    }, { passive: true });
    document.addEventListener("animationend", function (ev) {
      if (ev.animationName !== "brillo-borde") return;
      var d = ev.target.closest(".destino"); if (d) d.classList.remove("brilla");
    });
  });

  /* Propiedades sobre petróleo: en la computadora se inclinan un poco siguiendo el mouse */
  safe(function () {
    if (!finoMouse || quieto) return;
    var actual = null, ev0 = null, pend = false;
    function soltar() { if (actual) { actual.style.transform = ""; actual.classList.remove("inclinada"); actual = null; } }
    function pintar() {
      pend = false;
      var t = ev0.target.closest && ev0.target.closest(".oscuro .tarjeta");
      if (t !== actual) soltar();
      if (!t || !pc.matches) return;
      var r = t.getBoundingClientRect(), x = (ev0.clientX - r.left) / r.width - .5, y = (ev0.clientY - r.top) / r.height - .5;
      t.style.transform = "perspective(900px) rotateX(" + (-y * 6).toFixed(2) + "deg) rotateY(" + (x * 7).toFixed(2) + "deg) translateY(-6px)";
      t.classList.add("inclinada"); actual = t;
    }
    document.addEventListener("pointermove", function (ev) { ev0 = ev; if (!pend) { pend = true; requestAnimationFrame(pintar); } }, { passive: true });
    document.addEventListener("mouseout", function (ev) { if (!ev.relatedTarget) soltar(); });
    window.addEventListener("scroll", soltar, { passive: true });
  });

  /* Galerías de destinos: flechas en la computadora (en el teléfono se desliza con el dedo) */
  function flechasGaleria() {
    $$(".rejilla-destinos").forEach(function (g) {
      var cab = g.previousElementSibling;
      if (!cab || $(".galeria-flechas", cab) || g.children.length < 2) return;
      var nav = document.createElement("div");
      nav.className = "galeria-flechas";
      nav.innerHTML = '<button type="button" data-g="-1" aria-label="Destinos anteriores">' + icono("izq") + '</button><button type="button" data-g="1" aria-label="Más destinos">' + icono("der") + "</button>";
      cab.appendChild(nav);
      nav.addEventListener("click", function (ev) {
        var b = ev.target.closest("[data-g]"); if (!b) return;
        g.scrollBy({ left: +b.getAttribute("data-g") * g.clientWidth * .8, behavior: quieto ? "auto" : "smooth" });
      });
    });
  }

  /* Divisores con forma de ola: cada bloque que cambia de color recibe la franja de olas de la portada
     (plantilla data-ola-plantilla, un solo componente) con el color del bloque anterior */
  function fondo(el) {
    var c = getComputedStyle(el).backgroundColor;
    return /rgba\(0, 0, 0, 0\)|transparent/.test(c) ? getComputedStyle(document.body).backgroundColor : c;
  }
  function anterior(el) {
    var p = el.previousElementSibling;
    while (p && /^(SCRIPT|TEMPLATE|NOSCRIPT|DIALOG)$/.test(p.tagName)) p = p.previousElementSibling;
    if (!p && el.parentElement && el.parentElement !== document.body) return anterior(el.parentElement);
    if (p && !p.matches("section, .pie, .zona-catalogo")) { var s = $$("section, .zona-catalogo", p); if (s.length) p = s[s.length - 1]; }
    return p;
  }
  function olas() {
    $$("main section.seccion, main .zona-catalogo, main .cierre, .pie").forEach(function (b) {
      if ($(":scope > .ola-banda.arriba", b)) return;
      var p = anterior(b); if (!p || p.offsetHeight < 40 || $(":scope > .ola-banda.abajo", p)) return;
      var c = fondo(p); if (c === fondo(b) && getComputedStyle(b).backgroundImage === "none") return;
      var t = $("template[data-ola-plantilla]"); if (!t) return;
      var o = t.content.firstElementChild.cloneNode(true);
      $("[data-ola-fondo]", o).style.fill = c;
      b.insertBefore(o, b.firstChild);
    });
    olasVivas();
  }

  /* Como máximo una ola animada por pantalla: solo se mueve la más visible; las demás quedan quietas */
  function olasVivas() {
    var todas = $$(".ola-anima");
    if (quieto || !todas.length || !("IntersectionObserver" in window)) return;
    var vis = new Map();
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) vis.set(en.target, en.intersectionRatio); else vis.delete(en.target); });
      var mejor = null, r = -1;
      vis.forEach(function (v, k) { if (v > r) { r = v; mejor = k; } });
      todas.forEach(function (o) { o.classList.toggle("viva", o === mejor); });
    }, { threshold: [0, .2, .4, .6, .8, 1] });
    todas.forEach(function (o) { io.observe(o); });
  }

  /* Mapa de destinos: un punto que late por zona (datos/destinos.json → coordenadas). Las zonas muy juntas se agrupan */
  function pintarMapa(d) {
    var marco = $("[data-mapa-marco]"); if (!marco) return;
    var caja = $("[data-mapa-puntos]", marco), ds = marco.dataset;
    var lon0 = +ds.lon0, lat1 = +ds.lat1, k = +ds.k, W = +ds.ancho, H = +ds.alto;
    var pts = d.zonas.filter(function (z) { return Array.isArray(z.coordenadas) && z.coordenadas.length === 2; }).map(function (z) {
      var x = (+z.coordenadas[1] - lon0) * k, y = (lat1 - +z.coordenadas[0]) * k;
      if (!(x >= 0 && y >= 0 && x <= W && y <= H)) { aviso("La zona \"" + z.nombre + "\" queda fuera del mapa de destinos (solo Venezuela y Colombia)."); return null; }
      return { z: z, x: x, y: y };
    }).filter(Boolean);
    var grupos = [];
    pts.forEach(function (p) {
      var g = grupos.filter(function (g) { return Math.abs(g.x - p.x) < 36 && Math.abs(g.y - p.y) < 36; })[0];
      if (!g) { grupos.push({ x: p.x, y: p.y, l: [p] }); return; }
      g.l.push(p); g.x += (p.x - g.x) / g.l.length; g.y += (p.y - g.y) / g.l.length;
    });
    function corto(n) { return String(n).split(",")[0]; }
    caja.innerHTML = grupos.map(function (g, i) {
      var estilo = ' style="left:' + (g.x / W * 100).toFixed(2) + "%;top:" + (g.y / H * 100).toFixed(2) + "%;--d:" + (i * .5).toFixed(1) + 's"';
      if (g.l.length === 1) {
        var z = g.l[0].z;
        return '<a class="mapa-punto' + (z.proximamente ? " punto-pronto" : "") + '" href="destino.html?z=' + encodeURIComponent(z.id) + '"' + estilo + "><i></i><span>" +
          esc(corto(z.nombre)) + (z.proximamente ? " <em>Pronto</em>" : "") + "</span></a>";
      }
      var pais = d.porDestino[g.l[0].z.destino];
      return '<div class="mapa-grupo' + (g.x / W > .6 ? " a-la-izq" : "") + '"' + estilo + '><a class="mapa-punto solo" href="destino.html' + (pais ? "?d=" + encodeURIComponent(pais.id) : "") + '" aria-label="' + esc(pais ? pais.nombre : "Destinos") + '"><i></i></a><ul>' +
        g.l.map(function (p) { return '<li><a href="destino.html?z=' + encodeURIComponent(p.z.id) + '">' + esc(corto(p.z.nombre)) + "</a></li>"; }).join("") + "</ul></div>";
    }).join("");
  }

  /* Tours y yates: en la computadora las tarjetas se apilan al bajar (GSAP + ScrollTrigger, solo ahí) */
  function cargarScript(src) {
    return new Promise(function (ok, mal) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
  }
  function pilaTours(caja) {
    var tours = $$(".tour", caja);
    tours.forEach(function (t, i) { t.style.setProperty("--i", i); });
    if (quieto || tours.length < 2 || !pc.matches) return;
    var gs = window.gsap ? Promise.resolve() : cargarScript("assets/js/gsap.min.js").then(function () { return cargarScript("assets/js/ScrollTrigger.min.js"); });
    gs.then(function () {
      var gsap = window.gsap; if (!gsap || !window.ScrollTrigger) return;
      gsap.registerPlugin(window.ScrollTrigger);
      tours.forEach(function (t, i) {
        var sig = tours[i + 1]; if (!sig) return;
        var st = { trigger: sig, start: "top bottom", end: "top " + (100 + (i + 1) * 22) + "px", scrub: .5 };
        gsap.to(t, { scale: .92, ease: "none", scrollTrigger: st });
        gsap.to($(".tour-velo", t), { opacity: .4, ease: "none", scrollTrigger: { trigger: sig, start: st.start, end: st.end, scrub: .5 } });
      });
    }).catch(function () { /* sin GSAP: las tarjetas igual se apilan con CSS */ });
  }

  /* Yates y lanchas: una tarjeta por embarcación (fotos y videos en el mismo carrusel), sin precio */
  function tarjetaBarco(b) {
    var slides = b.fotos.map(function (r, k) { return img(r, b.carpeta, b.alts[k] || "", "(min-width:900px) 30vw, 88vw", 600); })
      .concat(b.videos.map(function (v) {
        return '<video class="t-video" muted loop playsinline preload="none" aria-label="Video a bordo de la ' + esc(b.nombre) + '" data-src="' + esc(b.carpeta + v.archivo) + '"' +
          (v.portada ? ' poster="' + esc(b.carpeta + v.portada) + '"' : "") + "></video>";
      }));
    var n = slides.length;
    var puntos = n > 1 ? '<span class="t-puntos" aria-hidden="true">' + slides.map(function (_, k) { return "<i" + (k ? "" : ' class="on"') + "></i>"; }).join("") + "</span>" +
      '<button type="button" class="t-flecha t-ant" data-t-mover="-1" aria-label="Foto anterior">' + icono("izq") + "</button>" +
      '<button type="button" class="t-flecha t-sig" data-t-mover="1" aria-label="Foto siguiente">' + icono("der") + "</button>" : "";
    var datos = [];
    if (b.capacidad) datos.push(dato("👥", String(b.capacidad), plural(+b.capacidad || b.capacidad, "persona", "personas")));
    if (b.zona) datos.push(dato("📍", b.zona.charAt(0).toUpperCase() + b.zona.slice(1), b.zona));
    return '<article class="tarjeta tarjeta-barco" id="' + esc(b.id) + '">' +
      '<div class="tarjeta-foto"><span class="t-enlace">' + (n ? '<span class="t-pista" data-t-pista>' + slides.join("") + "</span>" : '<span class="sin-foto">' + icono("camara") + "</span>") + "</span>" + puntos +
      (b.tipo ? '<span class="tarjeta-cat">' + esc(b.tipo.charAt(0).toUpperCase() + b.tipo.slice(1)) + "</span>" : "") + "</div>" +
      '<div class="tarjeta-texto"><h3>' + emoji("⛵") + esc(b.nombre) + "</h3>" + (b.descripcion ? '<p class="tarjeta-resumen">' + esc(b.descripcion) + "</p>" : "") +
      (datos.length ? '<p class="tarjeta-datos">' + datos.join("") + "</p>" : "") + (b.incluye.length ? listaEmoji(b.incluye) : "") + tarifa() +
      '<div class="tarjeta-acciones">' + botonWa("Consultar disponibilidad", msg("embarcacion", { nombre: b.nombre, zona: b.zona || "Morrocoy" }), "boton-reserva") + "</div>" +
      "</div></article>";
  }
  function pintarBarcos(d) {
    $$("[data-embarcaciones]").forEach(function (caja) {
      caja.classList.remove("cargando");
      caja.innerHTML = d.embarcaciones.length ? d.embarcaciones.map(tarjetaBarco).join("") :
        muyPronto("Muy pronto, yates y lanchas", "Escríbanos y le contamos qué embarcaciones tenemos.", msg("general"));
    });
    videosDiferidos();
  }
  /* Videos que cargan solo al acercarse a la pantalla. Con ahorro de datos (o movimiento reducido) queda solo la portada */
  function videosDiferidos() {
    var red = navigator.connection, ahorro = red && red.saveData;
    var vids = $$("video[data-src]");
    if (!vids.length || ahorro || quieto || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (!v.src) { v.src = v.dataset.src; v.load(); }
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
        } else if (v.src) v.pause();
      });
    }, { rootMargin: "300px 0px" });
    vids.forEach(function (v) { io.observe(v); });
  }

  if (!window.fetch || !window.Promise) return;
  cargar().then(function (d) {
    safe(viajesInicio);
    safe(function () { comun(d); });
    if (PAGINAS[PAGINA]) safe(function () { PAGINAS[PAGINA](d); });
    safe(function () { pintarMapa(d); });
    safe(function () { pintarBarcos(d); });
    safe(flechasGaleria);
    safe(olas);
  });
})();
