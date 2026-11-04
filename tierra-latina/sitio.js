(function () {
  "use strict";
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "https://wa.me/580000000000?text=";
  function safe(fn, nombre) { try { fn(); } catch (e) { console.warn("[" + nombre + "]", e); } }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* Portón entre páginas: se cierra al salir y se abre al llegar */
  function initPaso() {
    if (quieto) return;
    var raiz = document.documentElement;
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[href]");
      if (!a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      if (a.target === "_blank" || a.hasAttribute("data-foto") || a.hasAttribute("data-parada")) return;
      var ref = a.getAttribute("href");
      if (!/^[a-z-]+\.html/.test(ref)) return;
      var destino = a.href.split("#")[0], aqui = location.href.split("#")[0];
      if (destino === aqui) return;
      ev.preventDefault();
      try { sessionStorage.setItem("tlPaso", "1"); } catch (e) {}
      raiz.classList.remove("viene");
      raiz.classList.add("va");
      setTimeout(function () { location.href = a.href; }, 350);
    });
    window.addEventListener("pageshow", function (ev) {
      if (ev.persisted) { raiz.classList.remove("va", "viene"); }
    });
  }

  /* Fotos que se relevan dentro de la puerta, solo si se ve */
  function initRelevo() {
    var caja = $("[data-relevo]");
    if (!caja || quieto) return;
    var fotos = $$("img", caja), i = 0, visible = true;
    if (fotos.length < 2) return;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(caja);
    }
    setTimeout(function () { fotos.forEach(function (f) { f.loading = "eager"; }); }, 2500);
    setInterval(function () {
      if (!visible || document.hidden) return;
      var sig = (i + 1) % fotos.length;
      if (!fotos[sig].complete) return;
      fotos[i].classList.remove("activa");
      fotos[sig].classList.add("activa");
      i = sig;
    }, 6000);
  }

  /* Un solo bucle para todo lo que responde al scroll */
  function initScroll() {
    var pars = $$("[data-par]").concat($$(".banda-foto"));
    var aleros = $$("[data-alero]"), soles = $$("[data-sol]");
    var ruta = $("[data-ruta]"), lugares = $$("[data-lugar]"), paradas = $$("[data-parada]");
    var pendiente = false;
    function pintar() {
      pendiente = false;
      var alto = window.innerHeight, y = window.pageYOffset;
      if (!quieto) {
        pars.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < -80 || r.top > alto + 80) return;
          var p = (r.top + r.height / 2 - alto / 2) / (alto / 2 + r.height / 2); /* -1 a 1 */
          var v = (-7.5 - p * 7).toFixed(2) + "%";
          
          el.style.setProperty("--par", v);
        });
        aleros.forEach(function (el) { el.style.transform = "translate3d(" + (-(y * .09) % 34).toFixed(1) + "px,0,0)"; });
        soles.forEach(function (el) {
          var r = el.parentNode.getBoundingClientRect();
          if (r.bottom < 0 || r.top > alto) return;
          el.style.transform = "skewX(-14deg) translate3d(" + (r.top * -.12).toFixed(1) + "px,0,0)";
        });
      }
      if (ruta && lugares.length) {
        var linea = alto * .45, prog = 0, activo = -1;
        lugares.forEach(function (l, n) { if (l.getBoundingClientRect().top < linea) activo = n; });
        if (activo >= 0) {
          var a = lugares[activo].getBoundingClientRect();
          var parte = Math.max(0, Math.min(1, (linea - a.top) / Math.max(a.height, 1)));
          prog = Math.min(1, (activo + (activo < lugares.length - 1 ? parte : 0)) / (lugares.length - 1));
        }
        ruta.style.transform = "scaleX(" + prog.toFixed(3) + ")";
        paradas.forEach(function (p, n) {
          p.classList.toggle("pasado", n <= activo);
          p.classList.toggle("ahora", n === activo);
        });
      }
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    pintar();
  }

  /* Hoja "Más" del teléfono */
  function initMas() {
    var abrir = $("[data-mas]"), hoja = $("#hoja-mas"), fondo = $("[data-mas-fondo]"), cerrar = $("[data-mas-cerrar]");
    if (!abrir || !hoja) return;
    function poner(si) {
      hoja.hidden = !si; fondo.hidden = !si;
      abrir.setAttribute("aria-expanded", si ? "true" : "false");
      if (si) { cerrar.focus(); } else { abrir.focus({ preventScroll: true }); }
    }
    abrir.addEventListener("click", function () { poner(hoja.hidden); });
    cerrar.addEventListener("click", function () { poner(false); });
    fondo.addEventListener("click", function () { poner(false); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !hoja.hidden) poner(false); });
    var y0 = null;
    hoja.addEventListener("touchstart", function (ev) { y0 = ev.touches[0].clientY; }, { passive: true });
    hoja.addEventListener("touchend", function (ev) {
      if (y0 !== null && ev.changedTouches[0].clientY - y0 > 60) poner(false);
      y0 = null;
    }, { passive: true });
  }

  /* El llavero: arma el mensaje de reserva */
  function mecer(el, clase) {
    if (!el) return;
    el.classList.remove("mece", "fuerte");
    void el.offsetWidth;
    el.classList.add(clase || "mece");
  }
  function initArmador() {
    var form = $("[data-armador]");
    if (!form) return;
    var llavero = $("[data-llavero]"), boton = $("[data-r-boton]");
    var estado = { noches: 2, personas: 2 };
    var limites = { noches: [1, 30], personas: [1, 12] };
    var ver = { noches: $("[data-r-noches]"), personas: $("[data-r-personas]") };
    var fecha = $("[data-r-fecha]"), mascota = $("[data-r-mascota]");
    function plural(n, uno, varios) { return n + " " + (n === 1 ? uno : varios); }
    function fechaBonita(v) {
      var p = v.split("-");
      return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : "";
    }
    function armar(moverlo) {
      var t = $('input[name="tipo"]:checked', form);
      var precio = +t.getAttribute("data-precio") * estado.noches;
      $("[data-l-tipo]").textContent = t.value;
      $("[data-l-linea1]").textContent = plural(estado.noches, "noche", "noches") + " · " + plural(estado.personas, "persona", "personas");
      $("[data-l-linea2]").textContent = (mascota.checked ? "Con mascota" : "Sin mascota") + (fecha.value ? " · " + fechaBonita(fecha.value).slice(0, 5) : "");
      $("[data-l-precio]").textContent = "$" + precio + " de ejemplo";
      ver.noches.textContent = estado.noches;
      ver.personas.textContent = estado.personas;
      var msg = "Hola, quiero reservar " + t.getAttribute("data-articulo") + " en Posada Tierra Latina.\n" +
        (fecha.value ? "Llegada: " + fechaBonita(fecha.value) + "\n" : "") +
        "Noches: " + estado.noches + "\nPersonas: " + estado.personas +
        "\nMascota: " + (mascota.checked ? "sí" : "no") + "\n¿Tienen disponibilidad?";
      boton.href = WA + encodeURIComponent(msg);
      if (moverlo) mecer(llavero);
    }
    form.addEventListener("change", function () { armar(true); });
    $$("[data-menos],[data-mas-uno]", form).forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-menos") || b.getAttribute("data-mas-uno");
        var d = b.hasAttribute("data-menos") ? -1 : 1;
        estado[k] = Math.max(limites[k][0], Math.min(limites[k][1], estado[k] + d));
        armar(true);
      });
    });
    if (fecha) {
      var hoy = new Date();
      fecha.min = hoy.getFullYear() + "-" + ("0" + (hoy.getMonth() + 1)).slice(-2) + "-" + ("0" + hoy.getDate()).slice(-2);
    }
    boton.addEventListener("click", function () { mecer(llavero, "fuerte"); });
    armar(false);
  }

  /* La placa del collar */
  function initPlaca() {
    var campo = $("[data-m-nombre]");
    if (!campo) return;
    var placa = $("[data-m-placa]"), ver = $("[data-m-ver]"), boton = $("[data-m-boton]"), texto = $("[data-m-texto]");
    var espera;
    campo.addEventListener("input", function () {
      var n = campo.value.replace(/\s+/g, " ").trim().slice(0, 14);
      ver.textContent = n || "Su mascota";
      texto.textContent = n ? "Preguntar por " + n : "Preguntar las condiciones";
      var msg = n ? "Hola, quiero viajar con mi mascota " + n + " a Posada Tierra Latina. ¿Cuáles son las condiciones?"
        : "Hola, quiero viajar con mi mascota a Posada Tierra Latina. ¿Cuáles son las condiciones?";
      boton.href = WA + encodeURIComponent(msg);
      clearTimeout(espera);
      espera = setTimeout(function () { mecer(placa); }, 140);
    });
  }

  /* Visor de la galería */
  function initVisor() {
    var celdas = $$("[data-foto]"), visor = $("[data-visor]");
    if (!celdas.length || !visor) return;
    var img = $("[data-v-img]"), pie = $("[data-v-pie]"), i = 0, x0 = null, y0 = null, ultimo = null;
    function mostrar(n) {
      i = (n + celdas.length) % celdas.length;
      img.src = celdas[i].getAttribute("data-foto");
      img.alt = celdas[i].getAttribute("data-pie");
      pie.textContent = celdas[i].getAttribute("data-pie");
    }
    function cerrar() { visor.hidden = true; document.body.style.overflow = ""; if (ultimo) ultimo.focus({ preventScroll: true }); }
    celdas.forEach(function (c, n) {
      c.addEventListener("click", function (ev) {
        ev.preventDefault();
        ultimo = c; mostrar(n); visor.hidden = false; document.body.style.overflow = "hidden";
        $("[data-v-cerrar]").focus();
      });
    });
    $("[data-v-cerrar]").addEventListener("click", cerrar);
    $("[data-v-ant]").addEventListener("click", function () { mostrar(i - 1); });
    $("[data-v-sig]").addEventListener("click", function () { mostrar(i + 1); });
    visor.addEventListener("click", function (ev) { if (ev.target === visor) cerrar(); });
    document.addEventListener("keydown", function (ev) {
      if (visor.hidden) return;
      if (ev.key === "Escape") cerrar();
      if (ev.key === "ArrowLeft") mostrar(i - 1);
      if (ev.key === "ArrowRight") mostrar(i + 1);
    });
    visor.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; }, { passive: true });
    visor.addEventListener("touchend", function (ev) {
      if (x0 === null) return;
      var dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) mostrar(i + (dx < 0 ? 1 : -1));
      else if (dy > 80) cerrar();
      x0 = null;
    }, { passive: true });
  }

  document.addEventListener("visibilitychange", function () { document.body.classList.toggle("pausado", document.hidden); });

  safe(initPaso, "paso");
  safe(initRelevo, "relevo");
  safe(initScroll, "scroll");
  safe(initMas, "mas");
  safe(initArmador, "armador");
  safe(initPlaca, "placa");
  safe(initVisor, "visor");
})();
