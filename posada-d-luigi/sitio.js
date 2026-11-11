/* Posada D' Luigi · todo el contenido está en el HTML; esto solo adorna y arma mensajes. */
(function () {
  "use strict";
  var WA = "580000000000";
  var NOMBRE = "Posada D' Luigi";
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn) { try { fn(); } catch (err) { if (window.console) console.warn(err); } }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function enlaceWa(msg) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg); }
  var DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function corta(d) { return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()]; }
  function fechaInput(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); }

  /* hoja "Más" del teléfono */
  safe(function () {
    var hoja = document.getElementById("hoja");
    var abrir = document.querySelector("[data-abrir-hoja]");
    if (!hoja || !abrir) return;
    function cerrar() { hoja.hidden = true; abrir.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; abrir.focus(); }
    abrir.addEventListener("click", function () {
      hoja.hidden = false; abrir.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden";
      var c = hoja.querySelector(".cerrar"); if (c) c.focus();
    });
    $$("[data-cerrar-hoja]", hoja).forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !hoja.hidden) cerrar(); });
  });

  /* botón flotante: aparece al bajar; el logo gira con el scroll */
  safe(function () {
    var b = document.body, raiz = document.documentElement, pend = false;
    function ver() {
      pend = false;
      b.classList.toggle("js-arriba", b.classList.contains("p-inicio") && window.scrollY < 420);
      if (!quieto) raiz.style.setProperty("--giro", (window.scrollY / 9).toFixed(1));
    }
    ver();
    window.addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(ver); } }, { passive: true });
  });

  /* paralaje suave de las fotos */
  safe(function () {
    if (quieto) return;
    var cajas = $$("[data-paralaje]"), visibles = new Set(), pend = false;
    if (!cajas.length) return;
    function mover() {
      pend = false;
      var alto = window.innerHeight;
      visibles.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var p = (r.top + r.height / 2 - alto / 2) / (alto / 2 + r.height / 2);
        c.style.setProperty("--py", (Math.max(-1, Math.min(1, p)) * -24).toFixed(1) + "px");
      });
    }
    function pedir() { if (!pend) { pend = true; requestAnimationFrame(mover); } }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) visibles.add(en.target); else visibles.delete(en.target); });
        pedir();
      });
      cajas.forEach(function (c) { io.observe(c); });
    } else { cajas.forEach(function (c) { visibles.add(c); }); }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
  });

  /* la marea: se eligen llegada y salida (sin límite) y el agua sube con cada noche */
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function masDias(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  $$("[data-marea]").forEach(function (marea) {
    safe(function () {
      var vaso = marea.querySelector(".marea-vaso");
      var num = marea.querySelector("[data-num]"), pal = marea.querySelector("[data-pal]");
      var resumen = marea.querySelector("[data-resumen]"), enviar = marea.querySelector("[data-enviar]");
      var salidaP = marea.querySelector("[data-personas]");
      var inLlega = marea.querySelector("[data-llegada]"), inSale = marea.querySelector("[data-salida]");
      var personas = 2, nochesAntes = -1;
      var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
      /* propuesta inicial: el próximo viernes, dos noches */
      var vie = masDias(hoy, ((5 - hoy.getDay() + 7) % 7) || 7);
      inLlega.min = iso(hoy); inLlega.value = iso(vie); inSale.min = iso(masDias(vie, 1)); inSale.value = iso(masDias(vie, 2));

      function hab() {
        var r = marea.querySelector('input[type="radio"]:checked');
        return { nombre: r.dataset.nombre, frase: r.dataset.frase, precio: +r.dataset.precio, cap: +r.dataset.cap };
      }
      function noches() {
        if (!inLlega.value || !inSale.value) return 0;
        return Math.max(0, Math.round((fechaInput(inSale.value) - fechaInput(inLlega.value)) / 864e5));
      }
      function pintar() {
        var n = noches(), h = hab();
        /* el agua sube rápido al principio y se acerca al borde sin pasarlo: no hay tope de noches */
        var nivel = n ? 0.16 + 0.72 * (1 - Math.pow(0.82, n)) : 0.08;
        vaso.style.setProperty("--nivel", nivel.toFixed(3));
        if (n !== nochesAntes) {
          num.textContent = n; pal.textContent = n === 1 ? "noche" : "noches";
          num.classList.remove("cambia"); void num.offsetWidth; num.classList.add("cambia");
          nochesAntes = n;
        }
        salidaP.textContent = personas;
        var gente = personas + (personas === 1 ? " persona" : " personas"), txt, msg;
        if (!n) {
          txt = "Elija una salida después de la llegada.";
          msg = "Hola, " + NOMBRE + ". Quisiera consultar disponibilidad en " + h.frase + " para " + gente + ". Fechas: ___.";
        } else {
          var a = fechaInput(inLlega.value), b = fechaInput(inSale.value), tn = n + (n === 1 ? " noche" : " noches");
          txt = "<b>" + tn + "</b> en " + h.frase + ", del " + corta(a) + " al " + corta(b) + ". Estimado de ejemplo: <b>$" + (n * h.precio) + "</b>.";
          msg = "Hola, " + NOMBRE + ". Quisiera reservar " + h.frase + " del " + corta(a) + " al " + corta(b) + " (" + tn + "), para " + gente + ". ¿Tienen disponibilidad?";
        }
        if (personas > h.cap) txt += h.cap >= 6 ? " Para " + gente + ", pregúntenos qué combinación les conviene." : personas > 5 ? " Para " + gente + " le conviene el chalet." : " Para " + gente + " le conviene la Familiar o el chalet.";
        resumen.innerHTML = txt;
        enviar.href = enlaceWa(msg);
      }
      inLlega.addEventListener("change", function () {
        if (!inLlega.value) return pintar();
        var a = fechaInput(inLlega.value), n = noches() || 2;
        inSale.min = iso(masDias(a, 1));
        if (!inSale.value || fechaInput(inSale.value) <= a) inSale.value = iso(masDias(a, n));
        pintar();
      });
      inSale.addEventListener("change", pintar);
      $$('input[type="radio"]', marea).forEach(function (r) { r.addEventListener("change", pintar); });
      marea.querySelector("[data-menos]").addEventListener("click", function () { if (personas > 1) { personas--; pintar(); } });
      marea.querySelector("[data-mas]").addEventListener("click", function () { if (personas < 20) { personas++; pintar(); } });
      pintar();
    });
  });

  /* portada: las fotos se relevan con su marca de avance */
  safe(function () {
    var caja = document.querySelector("[data-pase]");
    if (!caja) return;
    var fotos = $$(".pase-foto", caja), marcas = $$(".pase-marcas li", caja), i = 0;
    if (fotos.length < 2) return;
    function ir(k) {
      fotos[i].classList.remove("activa");
      i = k % fotos.length;
      if (i === 0) marcas.forEach(function (m) { m.classList.remove("vista"); });
      marcas.forEach(function (m, j) { m.classList.toggle("activa", j === i); if (j < i) m.classList.add("vista"); });
      fotos[i].classList.add("activa");
    }
    if (quieto) return;
    setInterval(function () { if (!document.hidden) ir(i + 1); }, 6000);
  });

  /* Un día sin reloj: al deslizar los momentos, el sol cruza el cielo y cae la noche */
  safe(function () {
    var sec = document.querySelector("[data-dia]");
    if (!sec) return;
    var c = sec.querySelector("[data-momentos]"), cielos = $$(".cielo", sec), via = sec.querySelector(".astro-via");
    var sol = sec.querySelector("[data-sol]"), luna = sec.querySelector("[data-luna]"), estrellas = sec.querySelector(".estrellas");
    var tarjetas = $$(".momento", sec), p = 0, meta = 0, pend = false, anim = false;
    function lim(x) { return Math.max(0, Math.min(1, x)); }
    function pintar() {
      pend = false;
      var k = p * (cielos.length - 1), w = via.clientWidth, h = via.clientHeight;
      cielos.forEach(function (el, i) { el.style.opacity = Math.max(0, 1 - Math.abs(k - i)).toFixed(3); });
      var t = lim(p / 0.86), noche = lim((p - 0.78) / 0.2);
      sol.style.setProperty("--ax", (t * w).toFixed(1));
      sol.style.setProperty("--ay", (h * 0.62 - Math.sin(Math.PI * t) * h * 0.5).toFixed(1));
      sol.style.opacity = (1 - lim((p - 0.72) / 0.16)).toFixed(3);
      luna.style.opacity = noche.toFixed(3);
      estrellas.style.opacity = noche.toFixed(3);
    }
    function pedir() { if (!pend) { pend = true; requestAnimationFrame(pintar); } }
    function desliza() { var max = c.scrollWidth - c.clientWidth; return max > 4; }
    c.addEventListener("scroll", function () {
      if (!desliza()) return;
      p = lim(c.scrollLeft / (c.scrollWidth - c.clientWidth)); pedir();
    }, { passive: true });
    /* en computadora no se desliza: el día avanza al pasar el cursor o tocar cada momento */
    function paso() {
      p += (meta - p) * 0.14;
      if (Math.abs(meta - p) < 0.002) { p = meta; anim = false; } else requestAnimationFrame(paso);
      pintar();
    }
    function ir(i) {
      if (desliza()) return;
      meta = i / (tarjetas.length - 1);
      if (quieto) { p = meta; pintar(); return; }
      if (!anim) { anim = true; requestAnimationFrame(paso); }
    }
    tarjetas.forEach(function (t, i) {
      t.addEventListener("pointerenter", function () { ir(i); });
      t.addEventListener("focus", function () { ir(i); });
      t.addEventListener("click", function () { ir(i); });
    });
    window.addEventListener("resize", pedir);
    pintar();
  });

  /* carruseles: la tarjeta del frente crece, las de los lados se achican; la guía avanza */
  $$("[data-carrusel]").forEach(function (c) {
    safe(function () {
      var hijos = Array.prototype.slice.call(c.children), guia = c.parentNode.querySelector("[data-guia]"), pend = false;
      function mover() {
        pend = false;
        var max = c.scrollWidth - c.clientWidth;
        if (guia) {
          var ancho = Math.max(20, 100 * c.clientWidth / c.scrollWidth);
          guia.style.setProperty("--ancho", ancho.toFixed(1) + "%");
          guia.style.setProperty("--x", (max > 0 ? (c.scrollLeft / max) * (100 / ancho * 100 - 100) : 0).toFixed(1) + "%");
        }
        if (max <= 0 || quieto) { hijos.forEach(function (h) { h.style.removeProperty("--s"); h.style.removeProperty("--o"); }); return; }
        var caja = c.getBoundingClientRect(), base = caja.left + 20;
        hijos.forEach(function (h) {
          var r = h.getBoundingClientRect();
          var d = Math.min(1, Math.abs(r.left - base) / r.width);
          h.style.setProperty("--s", (1 - d * 0.08).toFixed(3));
          h.style.setProperty("--o", (1 - d * 0.35).toFixed(3));
        });
      }
      c.addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(mover); } }, { passive: true });
      window.addEventListener("resize", mover);
      mover();
    });
  });

  /* onda al tocar los botones */
  safe(function () {
    if (quieto) return;
    document.addEventListener("pointerdown", function (ev) {
      var b = ev.target.closest && ev.target.closest(".boton");
      if (!b) return;
      var r = b.getBoundingClientRect(), o = document.createElement("span");
      o.className = "onda"; o.style.left = (ev.clientX - r.left) + "px"; o.style.top = (ev.clientY - r.top) + "px";
      b.appendChild(o);
      setTimeout(function () { o.remove(); }, 750);
    });
  });

  /* filtro de habitaciones por personas */
  safe(function () {
    var grupo = document.querySelector("[data-filtro-personas]");
    if (!grupo) return;
    var botones = $$("button", grupo), habs = $$(".hab");
    botones.forEach(function (b) {
      b.addEventListener("click", function () {
        var p = +b.dataset.p;
        botones.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        habs.forEach(function (h) {
          var cap = +h.dataset.cap;
          h.classList.toggle("apagada", p > 0 && (cap < p || cap - p >= 3));
        });
      });
    });
  });

  /* galería: filtros y visor */
  safe(function () {
    var grupo = document.querySelector("[data-filtro-galeria]");
    var items = $$(".g-item");
    if (grupo) {
      var botones = $$("button", grupo);
      botones.forEach(function (b) {
        b.addEventListener("click", function () {
          botones.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          items.forEach(function (it) { it.classList.toggle("oculta", b.dataset.cat !== "todas" && it.dataset.cat !== b.dataset.cat); });
        });
      });
    }
    var caja = document.querySelector("[data-visor-caja]");
    if (!caja) return;
    var img = caja.querySelector("[data-visor-img]"), txt = caja.querySelector("[data-visor-txt]"), actual = 0, origen = null;
    function lista() { return items.filter(function (it) { return !it.classList.contains("oculta"); }); }
    function mostrar(i) {
      var l = lista(); if (!l.length) return;
      actual = (i + l.length) % l.length;
      var f = l[actual].querySelector("img");
      img.src = f.currentSrc || f.getAttribute("src"); img.alt = f.alt; txt.textContent = f.alt;
    }
    function cerrar() { caja.hidden = true; document.body.style.overflow = ""; if (origen) origen.focus(); }
    items.forEach(function (it) {
      it.querySelector("button").addEventListener("click", function (ev) {
        origen = ev.currentTarget; caja.hidden = false; document.body.style.overflow = "hidden";
        mostrar(lista().indexOf(it)); caja.querySelector("[data-visor-cerrar]").focus();
      });
    });
    caja.querySelector("[data-visor-cerrar]").addEventListener("click", cerrar);
    caja.querySelector("[data-visor-ant]").addEventListener("click", function () { mostrar(actual - 1); });
    caja.querySelector("[data-visor-sig]").addEventListener("click", function () { mostrar(actual + 1); });
    caja.addEventListener("click", function (ev) { if (ev.target === caja) cerrar(); });
    document.addEventListener("keydown", function (ev) {
      if (caja.hidden) return;
      if (ev.key === "Escape") cerrar();
      if (ev.key === "ArrowLeft") mostrar(actual - 1);
      if (ev.key === "ArrowRight") mostrar(actual + 1);
    });
    var x0 = null;
    caja.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    caja.addEventListener("touchend", function (ev) {
      if (x0 === null) return;
      var dx = ev.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
    });
  });

  /* formulario de contacto que arma el WhatsApp */
  safe(function () {
    var form = document.querySelector("[data-form-wa]");
    if (!form) return;
    var boton = form.querySelector("[data-form-enviar]");
    function armar() {
      var v = function (n) { return (form.elements[n].value || "").trim(); };
      var partes = ["Hola, " + NOMBRE + "."];
      if (v("nombre")) partes.push("Mi nombre es " + v("nombre") + ".");
      if (v("llegada")) partes.push("Quisiera llegar el " + corta(fechaInput(v("llegada"))) + ".");
      else partes.push("Fecha de llegada: ___.");
      partes.push("Noches: " + (v("noches") || "___") + ". Personas: " + (v("personas") || "___") + ".");
      if (v("mensaje")) partes.push(v("mensaje"));
      boton.href = enlaceWa(partes.join(" "));
    }
    form.addEventListener("input", armar);
    form.addEventListener("submit", function (ev) { ev.preventDefault(); armar(); window.open(boton.href, "_blank", "noopener"); });
    armar();
  });
})();
