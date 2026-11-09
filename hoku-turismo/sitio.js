/* Hoku Turismo · vista previa. Todo el contenido está en el HTML; esto solo adorna y arma los mensajes. */
(function () {
  "use strict";
  var CONFIG = { whatsapp: "580000000000" };
  var doc = document.documentElement;
  doc.classList.add("js");
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* cabecera con sombra y parallax suave */
  var cab = document.querySelector(".cab");
  var par = [].slice.call(document.querySelectorAll("[data-parallax]"));
  var dest = [].slice.call(document.querySelectorAll(".destino-foto img"));
  var pend = false;
  function mover() {
    pend = false;
    if (cab) cab.classList.toggle("con-sombra", window.scrollY > 8);
    if (quieto) return;
    var vh = window.innerHeight;
    par.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      el.style.transform = "translateY(" + ((r.top + r.height / 2 - vh / 2) * -0.06).toFixed(1) + "px)";
    });
    dest.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      img.style.transform = "translateY(" + (((r.top + r.height / 2) / vh - 1) * 9).toFixed(2) + "%)";
    });
  }
  window.addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(mover); } }, { passive: true });
  mover();

  /* las rayitas de los títulos se estiran al verse (son adorno, el texto siempre está visible) */
  var rayas = document.querySelectorAll(".raya");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("vista"); io.unobserve(x.target); } });
    }, { threshold: 0.6 });
    [].forEach.call(rayas, function (r) { io.observe(r); });
  } else {
    [].forEach.call(rayas, function (r) { r.classList.add("vista"); });
  }

  /* hoja "Más" */
  var hoja = document.getElementById("hoja");
  var abridor = document.querySelector("[data-abrir-hoja]");
  function abrir() {
    hoja.hidden = false; document.body.classList.add("hoja-abierta");
    abridor.setAttribute("aria-expanded", "true");
    var c = hoja.querySelector(".cerrar"); if (c) c.focus();
  }
  function cerrar() {
    hoja.hidden = true; document.body.classList.remove("hoja-abierta");
    abridor.setAttribute("aria-expanded", "false"); abridor.focus();
  }
  if (hoja && abridor) {
    abridor.addEventListener("click", abrir);
    [].forEach.call(hoja.querySelectorAll("[data-cerrar-hoja]"), function (b) { b.addEventListener("click", cerrar); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !hoja.hidden) cerrar(); });
  }

  /* visor de la galería: flechas, teclado y deslizar */
  var visor = document.querySelector(".visor");
  var items = [].slice.call(document.querySelectorAll("[data-visor]"));
  if (visor && items.length) {
    var vimg = visor.querySelector("img"), vtxt = visor.querySelector(".visor-texto"), actual = 0, ultimo = null;
    function ver(i) {
      actual = (i + items.length) % items.length;
      var img = items[actual].querySelector("img");
      vimg.src = img.currentSrc || items[actual].href;
      vimg.alt = img.alt; vtxt.textContent = img.alt;
      vimg.style.animation = "none"; void vimg.offsetWidth; vimg.style.animation = "";
    }
    items.forEach(function (a, i) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); ultimo = a; ver(i); visor.hidden = false;
        document.body.classList.add("hoja-abierta"); visor.querySelector(".visor-cerrar").focus();
      });
    });
    function cerrarVisor() { visor.hidden = true; document.body.classList.remove("hoja-abierta"); if (ultimo) ultimo.focus(); }
    visor.querySelector(".visor-cerrar").addEventListener("click", cerrarVisor);
    visor.querySelector(".visor-ant").addEventListener("click", function () { ver(actual - 1); });
    visor.querySelector(".visor-sig").addEventListener("click", function () { ver(actual + 1); });
    visor.addEventListener("click", function (ev) { if (ev.target === visor) cerrarVisor(); });
    document.addEventListener("keydown", function (ev) {
      if (visor.hidden) return;
      if (ev.key === "Escape") cerrarVisor();
      if (ev.key === "ArrowLeft") ver(actual - 1);
      if (ev.key === "ArrowRight") ver(actual + 1);
    });
    var x0 = null;
    visor.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    visor.addEventListener("touchend", function (ev) {
      if (x0 === null) return;
      var d = ev.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(d) > 45) ver(actual + (d < 0 ? 1 : -1));
    });
  }

  /* la pulsera: plan, fecha y personas, y el mensaje sale escrito */
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function hoyISO() {
    var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  [].forEach.call(document.querySelectorAll("[data-pulsera]"), function (caja) {
    var banda = caja.querySelector(".pulsera"), etiqueta = caja.querySelector(".pulsera-etiqueta");
    var tPlan = caja.querySelector("[data-p-plan]"), tDet = caja.querySelector("[data-p-detalle]");
    var fecha = caja.querySelector("[data-p-fecha]"), out = caja.querySelector("[data-p-personas]");
    var nombre = caja.querySelector("[data-p-nombre]"), total = caja.querySelector("[data-p-total]");
    var enviar = caja.querySelector("[data-p-enviar]"), form = caja.querySelector("form");
    var personas = 2;
    fecha.min = hoyISO();
    function plan() { return caja.querySelector("input[type=radio]:checked"); }
    function fechaLarga() {
      if (!fecha.value) return "";
      var p = fecha.value.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
      return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()];
    }
    function pintar(animar) {
      var p = plan(), fl = fechaLarga();
      tPlan.textContent = p.getAttribute("data-nombre");
      tDet.textContent = (fl ? fl.replace(/^(\w+) /, function (m, a) { return a.slice(0, 3) + " "; }) : "Fecha por escoger") +
        " · " + personas + (personas === 1 ? " persona" : " personas");
      out.textContent = personas;
      total.textContent = "$" + (+p.getAttribute("data-precio") * personas);
      var msg = "Hola, Hoku Turismo. Quiero mi pulsera para este paseo:\n" +
        "Plan: " + p.getAttribute("data-nombre") + "\n" +
        "Fecha: " + (fl || "por definir") + "\n" +
        "Personas: " + personas + "\n" +
        (nombre.value.trim() ? "Mi nombre: " + nombre.value.trim() + "\n" : "") +
        "¿Me envían el presupuesto?";
      enviar.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
      banda.classList.toggle("lista", !!fl);
      if (animar && !quieto) { etiqueta.classList.remove("pop"); void etiqueta.offsetWidth; etiqueta.classList.add("pop"); }
    }
    [].forEach.call(caja.querySelectorAll("input[type=radio]"), function (r) { r.addEventListener("change", function () { pintar(true); }); });
    fecha.addEventListener("change", function () {
      banda.classList.remove("lista"); void banda.offsetWidth; pintar(true);
    });
    nombre.addEventListener("input", function () { pintar(false); });
    caja.querySelector("[data-menos]").addEventListener("click", function () { if (personas > 1) { personas--; pintar(true); } });
    caja.querySelector("[data-mas]").addEventListener("click", function () { if (personas < 40) { personas++; pintar(true); } });
    form.addEventListener("submit", function (ev) { ev.preventDefault(); window.open(enviar.href, "_blank", "noopener"); });
    pintar(false);
  });
})();
