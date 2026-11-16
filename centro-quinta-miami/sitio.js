/* Centro Quinta Miami · JS clásico, solo adorna: sin JS la página se lee completa y los botones van a WhatsApp */
(function () {
  "use strict";
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function seguro(nombre, fn) { try { fn(); } catch (err) { if (window.console) console.warn("[Quinta Miami] " + nombre + ":", err); } }

  var D = {};
  try { D = JSON.parse($("#datos-sitio").textContent); } catch (err) { return; }
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var html = document.documentElement;

  function waUrl(t) { return "https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(t); }
  function unirY(l) { return l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " y " + l[l.length - 1]; }
  function dos(n) { return (n < 10 ? "0" : "") + n; }
  function hoyISO() { var d = new Date(); return d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate()); }
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function fechaBonita(iso) {
    var p = iso.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()] + " de " + d.getFullYear();
  }
  function horaBonita(v) {
    var p = v.split(":"), h = +p[0];
    return (h % 12 || 12) + ":" + p[1] + (h < 12 ? " a. m." : " p. m.");
  }
  function minutos(v) { var p = v.split(":"); return +p[0] * 60 + +p[1]; }

  /* ---------- Barra de abajo: aparece cuando los botones de la portada quedan atrás ---------- */
  seguro("barra", function () {
    var barra = $("[data-barra]"), ref = $(".portada-botones");
    if (!barra || !ref || !("IntersectionObserver" in window)) { if (barra) barra.classList.add("ver"); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (x) { barra.classList.toggle("ver", !x.isIntersecting && x.boundingClientRect.top < 0); });
    }).observe(ref);
  });

  /* ---------- Tarjetas de vidrio: brillo que sigue el dedo y leve inclinación con ratón ---------- */
  seguro("tarjetas", function () {
    var fino = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches && !quieto;
    $$(".paquete").forEach(function (t) {
      var quitar = null;
      function mover(ev) {
        var r = t.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        t.style.setProperty("--x", (x * 100).toFixed(1) + "%");
        t.style.setProperty("--y", (y * 100).toFixed(1) + "%");
        if (fino) {
          t.style.setProperty("--ry", ((x - .5) * 7).toFixed(2) + "deg");
          t.style.setProperty("--rx", ((.5 - y) * 5).toFixed(2) + "deg");
        }
        t.classList.add("toca");
        clearTimeout(quitar);
      }
      function soltar(ev) {
        var demora = ev && ev.pointerType === "touch" ? 700 : 0;
        clearTimeout(quitar);
        quitar = setTimeout(function () { t.classList.remove("toca"); t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); }, demora);
      }
      t.addEventListener("pointerdown", mover);
      t.addEventListener("pointermove", function (ev) { if (ev.pointerType !== "touch") mover(ev); });
      t.addEventListener("pointerleave", soltar);
      t.addEventListener("pointerup", function (ev) { if (ev.pointerType === "touch") soltar(ev); });
      t.addEventListener("pointercancel", soltar);
    });
  });

  /* ---------- Cotizador con invitación en vivo ---------- */
  var cotizador = null;
  seguro("cotizador", function () {
    var dlg = $("#cotizador"); if (!dlg) return;
    var form = $(".cot-form", dlg), aviso = $("[data-aviso]", dlg), enviar = $("[data-enviar]", dlg);
    var campos = D.campos, desde = null, antes = {};
    var fecha = $('input[type="date"]', form);
    if (fecha) fecha.min = hoyISO();

    function nodo(id) { return $('[data-campo="' + id + '"]', form); }
    function valor(c) {
      var el = nodo(c.id); if (!el) return "";
      if (c.tipo === "paquete") { var r = $("input:checked", el); return r ? r.value : ""; }
      if (c.tipo === "casillas") return $$("input:checked", el).map(function (x) { return x.value; });
      if (c.tipo === "numero") { var n = parseInt($("input", el).value, 10); return isNaN(n) ? 0 : n; }
      var i = $("input, select, textarea", el); return i ? String(i.value).trim() : "";
    }
    function valores() { var v = {}; campos.forEach(function (c) { v[c.id] = valor(c); }); return v; }
    function vacio(c, x) { return c.tipo === "casillas" ? !x.length : c.tipo === "numero" ? !(x > 0) : !x; }
    function texto(c, x, v) {
      if (vacio(c, x)) return "";
      if (c.tipo === "paquete") { var p = D.paquetes.filter(function (y) { return y.id === x; })[0]; return p ? p.nombre : x; }
      if (c.tipo === "fecha") return fechaBonita(x);
      if (c.tipo === "hora") {
        var t = horaBonita(x), horas = campos.filter(function (y) { return y.tipo === "hora"; });
        if (horas.length > 1 && c.id === horas[horas.length - 1].id) {
          var ini = v[horas[0].id];
          if (ini && minutos(x) < minutos(ini)) t += " (del día siguiente)";
        }
        return t;
      }
      if (c.tipo === "numero") return c.unidad ? x + " " + (x === 1 ? c.unidad[0] : c.unidad[1]) : String(x);
      if (c.tipo === "casillas") return unirY(x);
      return x;
    }
    function pintar() {
      var v = valores();
      campos.forEach(function (c) {
        var li = $('[data-linea="' + c.id + '"]', dlg); if (!li) return;
        var t = texto(c, v[c.id], v), muestra = t || (c.obligatorio ? "Por elegir" : "Si desea");
        if (c.tipo === "texto" && t.length > 90) muestra = t.slice(0, 88) + "…";
        var fuerte = $("[data-valor]", li);
        if (fuerte.textContent !== muestra) {
          fuerte.textContent = muestra;
          if (antes[c.id] !== undefined && !quieto) { li.classList.remove("cambia"); void li.offsetWidth; li.classList.add("cambia"); }
        }
        antes[c.id] = muestra;
        li.classList.toggle("vacio", !t);
      });
      return v;
    }
    /* Contadores + y − */
    $$(".campo-numero", form).forEach(function (el) {
      var i = $("input", el), min = +el.dataset.min || 0, max = +el.dataset.max || 999, paso = +el.dataset.paso || 1;
      function poner(n) { i.value = Math.max(min, Math.min(max, n)); limpiar(el); pintar(); }
      $("[data-menos]", el).addEventListener("click", function () { var n = parseInt(i.value, 10) || 0; poner(n % paso ? n - (n % paso) : n - paso); });
      $("[data-mas]", el).addEventListener("click", function () { var n = parseInt(i.value, 10) || 0; poner(n - (n % paso) + paso); });
      i.addEventListener("change", function () { poner(parseInt(i.value, 10) || 0); });
    });
    function limpiar(el) { el.classList.remove("falta"); $$("[aria-invalid]", el).forEach(function (x) { x.removeAttribute("aria-invalid"); }); }
    form.addEventListener("input", function (ev) {
      var el = ev.target.closest("[data-campo]"); if (el) limpiar(el);
      if (!$(".falta", form) && aviso.classList.contains("error")) { aviso.textContent = ""; aviso.className = "cot-aviso"; }
      pintar();
    });
    form.addEventListener("change", pintar);
    form.addEventListener("submit", function (ev) { ev.preventDefault(); });

    function abrir(paquete, boton) {
      desde = boton || document.activeElement;
      if (paquete) { var r = $('input[name="paquete"][value="' + paquete + '"]', form); if (r) { r.checked = true; limpiar(nodo("paquete")); } }
      aviso.textContent = ""; aviso.className = "cot-aviso";
      pintar();
      if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
      html.classList.add("hoja-abierta");
      $(".cot-cuerpo", dlg).scrollTop = 0;
    }
    function cerrar() { if (dlg.close) dlg.close(); else { dlg.removeAttribute("open"); alCerrar(); } }
    function alCerrar() { html.classList.remove("hoja-abierta"); if (desde && desde.focus) desde.focus({ preventScroll: true }); }
    dlg.addEventListener("close", alCerrar);
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) cerrar(); });
    $("[data-cerrar]", dlg).addEventListener("click", cerrar);

    enviar.addEventListener("click", function (ev) {
      var v = pintar(), falta = [], primero = null, nota = "";
      campos.forEach(function (c) {
        if (c.obligatorio && vacio(c, v[c.id])) {
          falta.push(c.etiqueta.charAt(0).toLowerCase() + c.etiqueta.slice(1));
          var el = nodo(c.id); el.classList.add("falta");
          $$("input, select, textarea", el).forEach(function (x) { x.setAttribute("aria-invalid", "true"); });
          if (!primero) primero = $("input, select, textarea", el);
        }
      });
      var horas = campos.filter(function (c) { return c.tipo === "hora"; });
      if (horas.length > 1 && v[horas[0].id] && v[horas[0].id] === v[horas[1].id]) {
        nota = "La hora de fin no puede ser la misma de inicio.";
        nodo(horas[1].id).classList.add("falta");
        if (!primero) primero = $("select", nodo(horas[1].id));
      }
      if (falta.length || nota) {
        ev.preventDefault();
        var t = falta.length ? (falta.length === 1 ? "Solo nos falta un dato para cotizarle: " : "Para cotizarle nos faltan: ") + unirY(falta) + "." : "";
        aviso.textContent = (t + " " + nota).trim();
        aviso.className = "cot-aviso error";
        if (primero) { primero.focus({ preventScroll: true }); primero.scrollIntoView({ block: "center", behavior: quieto ? "auto" : "smooth" }); }
        return;
      }
      var lineas = [D.saludo, ""];
      campos.forEach(function (c) {
        var t = texto(c, v[c.id], v); if (!t) return;
        lineas.push(c.en_mensaje + ": " + (c.tipo === "numero" ? String(v[c.id]) : t));
      });
      enviar.href = waUrl(lineas.join("\n"));
      aviso.textContent = "Listo: le abrimos WhatsApp con su cotización. Si no se abrió, toque el botón otra vez.";
      aviso.className = "cot-aviso listo";
    });

    document.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-cotizar]"); if (!b) return;
      ev.preventDefault(); abrir(b.getAttribute("data-cotizar"), b);
    });
    if (location.hash === "#cotizar") abrir("");
    cotizador = { abrir: abrir };
    window.QuintaMiami = cotizador;
  });

  /* ---------- Visor de galería y flyers ---------- */
  seguro("visor", function () {
    var dlg = $("#visor"); if (!dlg || !dlg.showModal) return;
    var img = $(".visor-img", dlg), pie = $("[data-visor-pie]", dlg), lista = [], i = 0, desde = null;
    function mostrar() { var it = lista[i]; img.src = it.src; img.alt = it.alt; pie.textContent = it.titulo || it.alt; }
    function abrir(l, k, b) { lista = l; i = k; desde = b; dlg.classList.toggle("uno", l.length < 2); mostrar(); dlg.showModal(); html.classList.add("hoja-abierta"); }
    function mover(d) { if (lista.length < 2) return; i = (i + d + lista.length) % lista.length; mostrar(); }
    var fotos = $$("[data-visor]").map(function (b) { return { src: b.dataset.visor, alt: b.dataset.alt }; });
    $$("[data-visor]").forEach(function (b, k) { b.addEventListener("click", function () { abrir(fotos, k, b); }); });
    $$("[data-flyer]").forEach(function (b) {
      b.addEventListener("click", function () { abrir([{ src: b.dataset.flyer, alt: "Flyer de " + b.dataset.titulo, titulo: b.dataset.titulo }], 0, b); });
    });
    $("[data-cerrar]", dlg).addEventListener("click", function () { dlg.close(); });
    $("[data-ant]", dlg).addEventListener("click", function () { mover(-1); });
    $("[data-sig]", dlg).addEventListener("click", function () { mover(1); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { html.classList.remove("hoja-abierta"); img.removeAttribute("src"); if (desde) desde.focus({ preventScroll: true }); });
    dlg.addEventListener("keydown", function (ev) { if (ev.key === "ArrowLeft") mover(-1); if (ev.key === "ArrowRight") mover(1); });
    var x0 = null;
    dlg.addEventListener("pointerdown", function (ev) { x0 = ev.clientX; });
    dlg.addEventListener("pointerup", function (ev) { if (x0 !== null && Math.abs(ev.clientX - x0) > 50) mover(ev.clientX < x0 ? 1 : -1); x0 = null; });
  });

  /* ---------- Espacios en computadora: la sección se fija y la galería avanza de lado al bajar (GSAP) ---------- */
  seguro("espacios", function () {
    if (quieto || !window.matchMedia || !matchMedia("(min-width: 1024px)").matches) return;
    var sec = $(".espacios"), fijo = $(".espacios-fijo"), pista = $(".espacios-pista"), carril = $(".espacios-carril");
    if (!sec || !pista) return;
    function cargar(src) {
      return new Promise(function (ok, mal) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = mal; document.head.appendChild(s); });
    }
    var cdn = "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/";
    cargar(cdn + "gsap.min.js").then(function () { return cargar(cdn + "ScrollTrigger.min.js"); }).then(function () {
      var g = window.gsap, ST = window.ScrollTrigger; if (!g || !ST) return;
      g.registerPlugin(ST);
      sec.classList.add("fijada");
      var cab = function () { return $(".cabecera").offsetHeight; };
      fijo.style.height = "calc(100vh - " + cab() + "px)";
      var dist = function () {
        var pad = parseFloat(getComputedStyle(carril).paddingLeft) || 0;
        return Math.max(0, pista.scrollWidth + pad * 2 - window.innerWidth);
      };
      if (dist() < 40) { sec.classList.remove("fijada"); fijo.style.height = ""; return; }
      g.to(pista, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: fijo, start: function () { return "top " + cab(); }, end: function () { return "+=" + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true }
      });
    }).catch(function () { sec.classList.remove("fijada"); fijo.style.height = ""; });
  });
})();
