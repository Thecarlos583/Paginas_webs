(function () {
  "use strict";
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "https://wa.me/580000000000?text=";
  var NOMBRE = "Cabañas El Bosque";
  function safe(fn, nombre) { try { fn(); } catch (e) { console.warn("[" + nombre + "]", e); } }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* Si existe fotos/logo.webp, reemplaza el nombre escrito */
  function initLogo() {
    var img = new Image();
    img.onload = function () {
      $$(".marca").forEach(function (m) {
        var l = new Image();
        l.src = img.src; l.alt = NOMBRE;
        m.textContent = ""; m.appendChild(l);
      });
    };
    img.src = "fotos/logo.webp";
  }

  /* Una onda en el agua: se crea, se expande y se borra */
  function onda(caja, x, y) {
    if (caja.querySelectorAll(".onda").length > 7) return;
    [0, 260].forEach(function (espera) {
      var o = document.createElement("span");
      o.className = "onda";
      o.setAttribute("aria-hidden", "true");
      o.style.left = x + "px"; o.style.top = y + "px";
      o.style.animationDelay = espera + "ms";
      o.addEventListener("animationend", function () { o.remove(); });
      caja.appendChild(o);
    });
  }

  function initOndas() {
    var fino = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
    $$("[data-agua]").forEach(function (caja) {
      var ultimo = 0, visible = false;
      function aqui(ev) {
        var r = caja.getBoundingClientRect();
        return [ev.clientX - r.left, ev.clientY - r.top];
      }
      caja.addEventListener("pointerdown", function (ev) {
        if (ev.target.closest("a,button,input,label,select")) return;
        var p = aqui(ev); onda(caja, p[0], p[1]);
      });
      if (fino) caja.addEventListener("pointermove", function (ev) {
        var t = Date.now();
        if (t - ultimo < 420) return;
        ultimo = t;
        var p = aqui(ev); onda(caja, p[0], p[1]);
      });
      if (quieto) return;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(caja);
      }
      /* De vez en cuando sube un pez: una onda sola, solo si se ve */
      setInterval(function () {
        if (!visible || document.hidden) return;
        onda(caja, caja.clientWidth * (.12 + Math.random() * .76), caja.clientHeight * (.14 + Math.random() * .6));
      }, 3400);
    });
  }

  /* Un solo bucle para lo que responde al scroll */
  function initScroll() {
    var cab = $("[data-cabecera]");
    var pars = quieto ? [] : $$(".par");
    var pend = false;
    function pintar() {
      pend = false;
      var alto = window.innerHeight, y = window.pageYOffset;
      if (cab) cab.classList.toggle("solida", y > 40);
      pars.forEach(function (im) {
        var r = im.parentNode.getBoundingClientRect();
        if (r.bottom < -80 || r.top > alto + 80) return;
        var t = Math.max(-.5, Math.min(.5, (r.top + r.height / 2 - alto / 2) / (alto + r.height)));
        im.style.setProperty("--y", (-5.4 - t * 10.8).toFixed(2) + "%");
      });
    }
    function pedir() { if (!pend) { pend = true; requestAnimationFrame(pintar); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir, { passive: true });
    pintar();
  }

  /* La foto grande del inicio cambia al pasar por cada cabaña */
  function initMuestras() {
    var caja = $("[data-muestras]");
    if (!caja) return;
    var fotos = $$("img", caja);
    $$("[data-muestra]").forEach(function (f) {
      function ver() {
        var n = +f.getAttribute("data-muestra");
        fotos.forEach(function (im, i) { im.classList.toggle("activa", i === n); });
      }
      f.addEventListener("pointerenter", ver);
      f.addEventListener("focus", ver);
    });
  }

  /* Hoja de más páginas */
  function initHoja() {
    var hoja = $("#hoja"), boton = $("[data-mas]");
    if (!hoja || !boton) return;
    function cerrar() { hoja.hidden = true; document.body.style.overflow = ""; boton.focus(); }
    boton.addEventListener("click", function (ev) {
      ev.preventDefault();
      hoja.hidden = false;
      document.body.style.overflow = "hidden";
      $(".hoja-x", hoja).focus();
    });
    $$("[data-cerrar]", hoja).forEach(function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !hoja.hidden) cerrar(); });
  }

  /* Visor de fotos con deslizar */
  function initVisor() {
    var v = $("#visor"), enlaces = $$("[data-foto]");
    if (!v || !enlaces.length) return;
    var im = $("img", v), pie = $("p", v), i = 0, x0 = null, origen = null;
    function ver(n) {
      i = (n + enlaces.length) % enlaces.length;
      var f = $("img", enlaces[i]);
      im.src = enlaces[i].getAttribute("href"); im.alt = f.alt; pie.textContent = f.alt;
    }
    function cerrar() { v.hidden = true; document.body.style.overflow = ""; if (origen) origen.focus(); }
    enlaces.forEach(function (a, n) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); origen = a; ver(n); v.hidden = false;
        document.body.style.overflow = "hidden"; $(".visor-x", v).focus();
      });
    });
    v.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-v]");
      if (b) { var k = b.getAttribute("data-v"); if (k === "x") cerrar(); else ver(i + (k === "s" ? 1 : -1)); }
      else if (ev.target === v) cerrar();
    });
    document.addEventListener("keydown", function (ev) {
      if (v.hidden) return;
      if (ev.key === "Escape") cerrar();
      if (ev.key === "ArrowRight") ver(i + 1);
      if (ev.key === "ArrowLeft") ver(i - 1);
    });
    v.addEventListener("pointerdown", function (ev) { x0 = ev.clientX; });
    v.addEventListener("pointerup", function (ev) {
      if (x0 === null) return;
      var d = ev.clientX - x0; x0 = null;
      if (Math.abs(d) > 50) ver(i + (d < 0 ? 1 : -1));
    });
  }

  /* Las tres piedras: arman el mensaje y hacen onda al pisarlas */
  function initArmador() {
    var f = $("#armador");
    if (!f) return;
    var fecha = $("#fecha"), caja = $(".cruce"), pasos = $$("[data-paso]");
    var msg = $("#mensaje"), est = $("#estimado"), env = $("#enviar");
    var hoy = new Date();
    fecha.min = hoy.getFullYear() + "-" + ("0" + (hoy.getMonth() + 1)).slice(-2) + "-" + ("0" + hoy.getDate()).slice(-2);
    function pisar(n) {
      var p = pasos[n];
      if (!p) return;
      var a = $(".piedra", p).getBoundingClientRect(), r = caja.getBoundingClientRect();
      p.classList.add("hecho");
      onda(caja, a.left - r.left + a.width / 2, a.top - r.top + a.height / 2);
    }
    function armar() {
      var c = $("input[name=cabana]:checked", f), n = +$("input[name=noches]:checked", f).value;
      var plural = n === 1 ? "1 noche" : n + " noches", t = "Hola, quiero reservar " + c.value + " en " + NOMBRE;
      if (fecha.value) {
        var p = fecha.value.split("-");
        var d = new Date(+p[0], +p[1] - 1, +p[2], 12);
        t += ", llegando el " + d.toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" }) + ", " + plural;
      } else {
        t += ", " + plural;
      }
      t += ". ¿Tienen disponibilidad?";
      msg.textContent = t;
      est.textContent = "Referencia: $" + (+c.getAttribute("data-precio") * n) + " por " + plural + " (precio de ejemplo)";
      env.href = WA + encodeURIComponent(t);
    }
    f.addEventListener("change", function (ev) {
      armar();
      if (ev.target.name === "cabana") pisar(0);
      else { pisar(1); if (fecha.value) setTimeout(function () { pisar(2); }, 380); }
    });
    armar();
  }

  document.addEventListener("visibilitychange", function () { document.body.classList.toggle("pausado", document.hidden); });
  safe(initLogo, "logo");
  safe(initOndas, "ondas");
  safe(initScroll, "scroll");
  safe(initMuestras, "muestras");
  safe(initHoja, "hoja");
  safe(initVisor, "visor");
  safe(initArmador, "armador");
})();
