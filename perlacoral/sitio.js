/* Posada PerlaCoral · todo el contenido está en el HTML; esto solo adorna y arma mensajes. */
(function () {
  "use strict";
  var WA = "580000000000";
  var NOMBRE = "Posada PerlaCoral";
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn) { try { fn(); } catch (err) { if (window.console) console.warn(err); } }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function enlaceWa(msg) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg); }

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

  /* el botón flotante aparece al bajar (en teléfono la portada ya trae WhatsApp) */
  safe(function () {
    var b = document.body;
    function ver() { b.classList.toggle("js-arriba", window.scrollY < 420); }
    ver(); window.addEventListener("scroll", ver, { passive: true });
  });

  /* lustre de nácar: el brillo de las perlas sigue el dedo, el cursor y el scroll */
  safe(function () {
    if (quieto) return;
    var raiz = document.documentElement, pend = false, bx = 0, by = 0;
    function pintar() { pend = false; raiz.style.setProperty("--bx", bx.toFixed(2)); raiz.style.setProperty("--by", by.toFixed(2)); }
    function pedir() { if (!pend) { pend = true; requestAnimationFrame(pintar); } }
    window.addEventListener("pointermove", function (ev) {
      bx = (ev.clientX / window.innerWidth) * 2 - 1; by = (ev.clientY / window.innerHeight) * 2 - 1; pedir();
    }, { passive: true });
    window.addEventListener("scroll", function () { bx = Math.sin(window.scrollY / 260); pedir(); }, { passive: true });
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
        c.style.setProperty("--py", (Math.max(-1, Math.min(1, p)) * -22).toFixed(1) + "px");
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

  /* el collar: cada perla es un día */
  var DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  var LETRA = ["D", "L", "M", "M", "J", "V", "S"];
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function corta(d) { return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()]; }

  $$("[data-collar]").forEach(function (collar) {
    safe(function () {
      var cont = collar.querySelector("[data-hilos]");
      var resumen = collar.querySelector("[data-resumen]");
      var enviar = collar.querySelector("[data-enviar]");
      var salida_personas = collar.querySelector("[data-personas]");
      var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
      var personas = 2, llegada = -1, salida = -1, dias = [], hilos = [];
      cont.innerHTML = "";

      for (var f = 0; f < 3; f++) {
        var hilo = document.createElement("div"); hilo.className = "hilo";
        var ini = new Date(hoy); ini.setDate(hoy.getDate() + f * 7);
        var fin = new Date(hoy); fin.setDate(hoy.getDate() + f * 7 + 6);
        var mes = document.createElement("span"); mes.className = "hilo-mes";
        mes.textContent = ini.getMonth() === fin.getMonth() ? MESES[ini.getMonth()] : MESES[ini.getMonth()] + " y " + MESES[fin.getMonth()];
        if (f > 0 && ini.getMonth() === new Date(hoy.getTime() + (f * 7 - 1) * 864e5).getMonth())
          mes.textContent = ini.getMonth() === fin.getMonth() ? "" : "llega " + MESES[fin.getMonth()];
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "hilo-cuerda"); svg.setAttribute("aria-hidden", "true");
        var base = document.createElementNS("http://www.w3.org/2000/svg", "path"); base.setAttribute("class", "base");
        var lleno = document.createElementNS("http://www.w3.org/2000/svg", "path"); lleno.setAttribute("class", "lleno");
        svg.appendChild(base); svg.appendChild(lleno);
        var fila = document.createElement("div"); fila.className = "hilo-perlas";
        for (var i = 0; i < 7; i++) {
          var n = f * 7 + i;
          var d = new Date(hoy); d.setDate(hoy.getDate() + n);
          var b = document.createElement("button"); b.type = "button"; b.className = "dia"; b.dataset.n = n;
          b.style.setProperty("--y", (Math.sin(Math.PI * (i + 0.5) / 7) * 9).toFixed(1) + "px");
          b.setAttribute("aria-label", corta(d));
          b.innerHTML = '<i class="perla"><span>' + d.getDate() + "</span></i><small>" + LETRA[d.getDay()] + "</small>";
          fila.appendChild(b); dias.push({ fecha: d, boton: b });
        }
        hilo.appendChild(mes); hilo.appendChild(svg); hilo.appendChild(fila); cont.appendChild(hilo);
        hilos.push({ el: hilo, base: base, lleno: lleno, desde: f * 7 });
      }

      function hab() {
        var r = collar.querySelector('input[name="hab"]:checked');
        return { nombre: r.dataset.nombre, precio: +r.dataset.precio, cap: +r.dataset.cap };
      }

      function centros(h) {
        var caja = h.el.getBoundingClientRect();
        return $$(".perla", h.el).map(function (p) {
          var r = p.getBoundingClientRect();
          return { x: r.left - caja.left + r.width / 2, y: r.top - caja.top + r.height / 2 };
        });
      }
      function linea(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1); }).join(" "); }
      function cuerdas() {
        hilos.forEach(function (h) {
          var c = centros(h); if (!c.length) return;
          var w = h.el.clientWidth;
          h.base.setAttribute("d", linea([{ x: 0, y: c[0].y - 7 }].concat(c, [{ x: w, y: c[6].y - 7 }])));
          var a = llegada, z = salida >= 0 ? salida : -1, d = "";
          if (a >= 0 && z > a) {
            var i0 = Math.max(a, h.desde), i1 = Math.min(z, h.desde + 6);
            if (i0 <= i1 && !(a > h.desde + 6) && !(z < h.desde)) {
              var pts = c.slice(i0 - h.desde, i1 - h.desde + 1);
              if (a < h.desde) pts.unshift({ x: 0, y: c[0].y - 7 });
              if (z > h.desde + 6) pts.push({ x: w, y: c[6].y - 7 });
              d = linea(pts);
            }
          }
          h.lleno.setAttribute("d", d);
        });
      }

      function pintar() {
        dias.forEach(function (o, n) {
          o.boton.classList.toggle("llegada", n === llegada);
          o.boton.classList.toggle("salida", n === salida);
          o.boton.classList.toggle("noche", llegada >= 0 && salida > llegada && n > llegada && n < salida);
          o.boton.setAttribute("aria-pressed", n === llegada || n === salida ? "true" : "false");
        });
        cuerdas();
        var h = hab(), msg, txt;
        salida_personas.textContent = personas;
        if (llegada < 0) {
          txt = "Elija el día de llegada.";
          msg = "Hola, " + NOMBRE + ". Quisiera consultar disponibilidad en la habitación " + h.nombre + " para " + personas + " personas. Fecha: ___.";
        } else if (salida < 0) {
          txt = "Llega el <b>" + corta(dias[llegada].fecha) + "</b>. Ahora toque el día que se va.";
          msg = "Hola, " + NOMBRE + ". Quisiera reservar la habitación " + h.nombre + " llegando el " + corta(dias[llegada].fecha) + ", para " + personas + " personas. ¿Tienen disponibilidad?";
        } else {
          var noches = salida - llegada, total = noches * h.precio;
          txt = "<b>" + noches + (noches === 1 ? " noche" : " noches") + "</b> en la " + h.nombre + ", del " + corta(dias[llegada].fecha) +
            " al " + corta(dias[salida].fecha) + ". Estimado de ejemplo: <b>$" + total + "</b>.";
          msg = "Hola, " + NOMBRE + ". Quisiera reservar la habitación " + h.nombre + " del " + corta(dias[llegada].fecha) + " al " +
            corta(dias[salida].fecha) + " (" + noches + (noches === 1 ? " noche" : " noches") + "), para " + personas + " personas. ¿Tienen disponibilidad?";
        }
        if (personas > h.cap) txt += " Para " + personas + " personas le conviene la Familiar.";
        resumen.innerHTML = txt;
        enviar.href = enlaceWa(msg);
      }

      dias.forEach(function (o, n) {
        o.boton.addEventListener("click", function () {
          if (llegada < 0 || salida >= 0 || n <= llegada) { llegada = n; salida = -1; }
          else { salida = n; }
          pintar();
        });
      });
      $$('input[name="hab"]', collar).forEach(function (r) { r.addEventListener("change", pintar); });
      collar.querySelector("[data-menos]").addEventListener("click", function () { if (personas > 1) { personas--; pintar(); } });
      collar.querySelector("[data-mas]").addEventListener("click", function () { if (personas < 10) { personas++; pintar(); } });
      pintar();
      if ("ResizeObserver" in window) new ResizeObserver(function () { cuerdas(); }).observe(cont);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(cuerdas);
      window.addEventListener("load", cuerdas);
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
      img.src = f.getAttribute("src"); img.alt = f.alt; txt.textContent = f.alt;
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
      if (v("llegada")) {
        var p = v("llegada").split("-"), d = new Date(+p[0], +p[1] - 1, +p[2], 12);
        partes.push("Quisiera llegar el " + corta(d) + ".");
      } else partes.push("Fecha de llegada: ___.");
      partes.push("Noches: " + (v("noches") || "___") + ". Personas: " + (v("personas") || "___") + ".");
      if (v("mensaje")) partes.push(v("mensaje"));
      boton.href = enlaceWa(partes.join(" "));
    }
    form.addEventListener("input", armar);
    form.addEventListener("submit", function (ev) { ev.preventDefault(); armar(); window.open(boton.href, "_blank", "noopener"); });
    armar();
  });
})();
