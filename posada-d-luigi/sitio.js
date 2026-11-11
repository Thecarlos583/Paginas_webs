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

  /* botón flotante: aparece al bajar; la ola del logo gira con el scroll */
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

  /* la rueda: cada tramo es una noche, la ola del centro da una vuelta por noche */
  $$("[data-rueda]").forEach(function (rueda) {
    safe(function () {
      var NS = "http://www.w3.org/2000/svg", N = 7, R = 88, GAP = 4;
      var aro = rueda.querySelector("[data-aro]");
      var ola = rueda.querySelector("[data-ola]");
      var num = rueda.querySelector("[data-num]"), pal = rueda.querySelector("[data-pal]");
      var resumen = rueda.querySelector("[data-resumen]"), enviar = rueda.querySelector("[data-enviar]");
      var salidaP = rueda.querySelector("[data-personas]"), llegadaI = rueda.querySelector("[data-llegada]");
      var botones = $$("[data-noche]", rueda);
      var noches = 2, personas = 2, vueltas = 0, llenos = [], nums = [];

      function punto(a, r) { var rad = (a - 90) * Math.PI / 180; return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)]; }
      function arco(a0, a1) {
        var p0 = punto(a0, R), p1 = punto(a1, R);
        return "M" + p0[0].toFixed(2) + " " + p0[1].toFixed(2) + " A" + R + " " + R + " 0 0 1 " + p1[0].toFixed(2) + " " + p1[1].toFixed(2);
      }
      for (var i = 0; i < N; i++) {
        var a0 = i * 360 / N + GAP / 2, a1 = (i + 1) * 360 / N - GAP / 2;
        var base = document.createElementNS(NS, "path"); base.setAttribute("d", arco(a0, a1)); base.setAttribute("class", "seg seg-base");
        base.dataset.n = i + 1;
        var lleno = document.createElementNS(NS, "path"); lleno.setAttribute("d", arco(a0, a1)); lleno.setAttribute("class", "seg seg-lleno");
        lleno.style.transitionDelay = (i * 60) + "ms";
        var c = punto((a0 + a1) / 2, R);
        var t = document.createElementNS(NS, "text"); t.setAttribute("x", c[0].toFixed(1)); t.setAttribute("y", (c[1] + 3).toFixed(1));
        t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "seg-num"); t.textContent = i + 1;
        aro.appendChild(base); aro.appendChild(lleno); aro.appendChild(t);
        llenos.push(lleno); nums.push(t);
        base.addEventListener("click", function (ev) { elegir(+ev.currentTarget.dataset.n); });
      }

      var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
      if (llegadaI) {
        var iso = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
        llegadaI.min = iso(hoy);
      }

      function hab() {
        var r = rueda.querySelector('input[type="radio"]:checked');
        return { nombre: r.dataset.nombre, precio: +r.dataset.precio, cap: +r.dataset.cap };
      }
      function pintar() {
        llenos.forEach(function (l, i) { l.classList.toggle("on", i < noches); });
        nums.forEach(function (t, i) { t.classList.toggle("on", i < noches); });
        botones.forEach(function (b) {
          var n = +b.dataset.noche;
          b.setAttribute("aria-pressed", n === noches ? "true" : "false");
          b.classList.toggle("dentro", n < noches);
        });
        if (ola) ola.style.setProperty("--vuelta", (vueltas * 360 + noches * (360 / N)) + "deg");
        num.textContent = noches; pal.textContent = noches === 1 ? "noche" : "noches";
        salidaP.textContent = personas;
        var h = hab(), total = noches * h.precio, txtN = noches + (noches === 1 ? " noche" : " noches");
        var fecha = llegadaI && llegadaI.value ? fechaInput(llegadaI.value) : null;
        var txt = "<b>" + txtN + "</b> en la " + h.nombre;
        var msg = "Hola, " + NOMBRE + ". Quisiera reservar la habitación " + h.nombre + ", " + txtN + ", para " + personas + (personas === 1 ? " persona" : " personas");
        if (fecha) {
          var sale = new Date(fecha); sale.setDate(fecha.getDate() + noches);
          txt += ", del " + corta(fecha) + " al " + corta(sale);
          msg += ", llegando el " + corta(fecha) + " y saliendo el " + corta(sale) + ". ¿Tienen disponibilidad?";
        } else {
          msg += ". Fecha de llegada: ___. ¿Tienen disponibilidad?";
        }
        txt += ". Estimado de ejemplo: <b>$" + total + "</b>.";
        if (personas > h.cap) txt += " Para " + personas + " personas le conviene la Familiar.";
        resumen.innerHTML = txt;
        enviar.href = enlaceWa(msg);
      }
      function elegir(n) {
        if (n === noches) return;
        if (n < noches) vueltas += 1; /* al bajar, la ola sigue girando hacia adelante */
        noches = n; pintar();
      }
      botones.forEach(function (b) { b.addEventListener("click", function () { elegir(+b.dataset.noche); }); });
      $$('input[type="radio"]', rueda).forEach(function (r) { r.addEventListener("change", pintar); });
      if (llegadaI) llegadaI.addEventListener("change", pintar);
      rueda.querySelector("[data-menos]").addEventListener("click", function () { if (personas > 1) { personas--; pintar(); } });
      rueda.querySelector("[data-mas]").addEventListener("click", function () { if (personas < 10) { personas++; pintar(); } });
      pintar();
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
