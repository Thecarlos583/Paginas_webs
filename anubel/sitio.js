/* Fisioterapia: menú, estado abierto, video, mapa del cuerpo y armador de cita */
(function () {
  "use strict";
  function safe(fn) { try { fn(); } catch (err) { if (window.console) console.warn(err); } }
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = document.body.getAttribute("data-wa");
  var BASE = document.body.getAttribute("data-base") || "";

  // Menú
  safe(function () {
    var b = $(".hamburguesa"), m = $("#menu");
    if (!b || !m) return;
    function cerrar() { m.classList.remove("abierto"); b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-label", "Abrir el menú"); }
    b.addEventListener("click", function () {
      var abre = !m.classList.contains("abierto");
      m.classList.toggle("abierto", abre);
      b.setAttribute("aria-expanded", abre ? "true" : "false");
      b.setAttribute("aria-label", abre ? "Cerrar el menú" : "Abrir el menú");
    });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") cerrar(); });
    document.addEventListener("click", function (ev) { if (!ev.target.closest(".pildora")) cerrar(); });
  });

  // Abierto ahora (hora de Venezuela, UTC-4). Lun-vie 8-12 y 13-17, sáb 9-12.
  safe(function () {
    var els = $$("[data-estado]");
    if (!els.length) return;
    var turnos = { 1: [[8, 12], [13, 17]], 2: [[8, 12], [13, 17]], 3: [[8, 12], [13, 17]], 4: [[8, 12], [13, 17]], 5: [[8, 12], [13, 17]], 6: [[9, 12]] };
    var dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    function hora(h) { return h === 12 ? "12:00 m." : (h > 12 ? (h - 12) + ":00 p. m." : h + ":00 a. m."); }
    var vz = new Date(Date.now() - 4 * 3600000);
    var d = vz.getUTCDay(), h = vz.getUTCHours() + vz.getUTCMinutes() / 60;
    var txt, abierto = false, hoy = turnos[d] || [];
    for (var i = 0; i < hoy.length; i++) {
      if (h >= hoy[i][0] && h < hoy[i][1]) { abierto = true; txt = "Abierto ahora · hasta las " + hora(hoy[i][1]); break; }
    }
    if (!abierto) {
      for (var j = 0; j < hoy.length; j++) { if (h < hoy[j][0]) { txt = "Cerrado · abre hoy a las " + hora(hoy[j][0]); break; } }
      if (!txt) {
        for (var k = 1; k <= 7; k++) {
          var dd = (d + k) % 7;
          if (turnos[dd]) { txt = "Cerrado · abre " + (k === 1 ? "mañana" : "el " + dias[dd]) + " a las " + hora(turnos[dd][0][0]); break; }
        }
      }
    }
    els.forEach(function (el) { el.textContent = txt; el.classList.add(abierto ? "abierto" : "cerrado"); });
  });

  // Video de portada: solo si la conexión lo permite
  safe(function () {
    var v = $(".portada-video video");
    if (!v || reducido) return;
    var c = navigator.connection || {};
    if (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")) return;
    var cargar = function () {
      v.src = v.getAttribute("data-src");
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    };
    if (document.readyState === "complete") setTimeout(cargar, 300);
    else window.addEventListener("load", function () { setTimeout(cargar, 300); });
  });

  // Scroll: leve parallax del video y línea de la primera consulta
  safe(function () {
    var arco = $(".portada-video .arco");
    var pasos = $("[data-progreso]");
    if (!arco && !pasos) return;
    var ancho = window.matchMedia("(min-width: 900px)");
    var pend = false;
    if (pasos) pasos.style.setProperty("--p", "0");
    function pintar() {
      pend = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (arco && ancho.matches && !reducido) {
        var y = Math.min(window.scrollY, vh);
        arco.style.transform = "translateY(" + (y * 0.08).toFixed(1) + "px)";
      } else if (arco) { arco.style.transform = ""; }
      if (pasos) {
        var r = pasos.getBoundingClientRect();
        var p = (vh * 0.75 - r.top) / Math.max(r.height, 1);
        pasos.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3));
      }
    }
    function pedir() { if (!pend) { pend = true; requestAnimationFrame(pintar); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    pintar();
    setTimeout(pintar, 400);
  });

  // ¿Dónde le duele?
  safe(function () {
    $$(".mapa").forEach(function (mapa) {
      var botones = $$("[data-zona]", mapa);
      var res = $$(".res", mapa);
      var caja = $(".mapa-res", mapa);
      function mostrar(id, desdePunto) {
        res.forEach(function (r) { r.classList.toggle("visible", r.getAttribute("data-res") === id); });
        botones.forEach(function (b) {
          var si = b.getAttribute("data-zona") === id;
          if (b.classList.contains("punto")) b.classList.toggle("activo", si);
          else b.setAttribute("aria-pressed", si ? "true" : "false");
        });
        if (desdePunto !== undefined && caja && window.innerWidth < 900) {
          var r = caja.getBoundingClientRect();
          var vh = window.innerHeight || document.documentElement.clientHeight;
          if (r.top < 80 || r.top > vh - 120) caja.scrollIntoView({ block: "nearest", behavior: reducido ? "auto" : "smooth" });
        }
      }
      botones.forEach(function (b) {
        b.addEventListener("click", function () { mostrar(b.getAttribute("data-zona"), b.classList.contains("punto")); });
      });
      mostrar("inicio");
    });
  });

  // Armador de cita
  safe(function () {
    var f = $("[data-armador]");
    if (!f) return;
    var datos = JSON.parse(f.getAttribute("data-armador"));
    var burbuja = $("[data-mensaje]"), enviar = $("[data-enviar]"), aviso = $("[data-aviso-sabado]");
    var q = new URLSearchParams(location.search);
    var selServ = f.elements.servicio, selDia = f.elements.dia;
    if (q.get("servicio") && datos.servicios[q.get("servicio")]) selServ.value = q.get("servicio");
    if (q.get("zona") && datos.zonas[q.get("zona")]) f.elements.zona.value = q.get("zona");
    var paquete = q.get("paquete") === "1";

    // Próximos días de atención con fecha (lunes a sábado)
    var nombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    var meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    var mesesL = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    var hoy = new Date(Date.now() - 4 * 3600000);
    var horaHoy = hoy.getUTCHours();
    var ops = [];
    for (var i = 0; ops.length < 7 && i < 10; i++) {
      var dt = new Date(hoy.getTime() + i * 86400000);
      var wd = dt.getUTCDay();
      if (wd === 0) continue;
      if (i === 0 && horaHoy >= (wd === 6 ? 12 : 17)) continue;
      var etq = (i === 0 ? "Hoy, " : i === 1 ? "Mañana, " : "") + nombres[wd].toLowerCase() + " " + dt.getUTCDate() + " " + meses[dt.getUTCMonth()];
      etq = etq.charAt(0).toUpperCase() + etq.slice(1);
      ops.push('<option value="' + nombres[wd].toLowerCase() + " " + dt.getUTCDate() + " de " + mesesL[dt.getUTCMonth()] + '" data-sabado="' + (wd === 6 ? 1 : 0) + '">' + etq + "</option>");
    }
    selDia.innerHTML = ops.join("") + '<option value="otro día (por coordinar)" data-sabado="0">Otro día</option>';

    function valor(n) { var el = f.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ""; }
    function actualizar() {
      var opt = selDia.options[selDia.selectedIndex];
      var sab = opt && opt.getAttribute("data-sabado") === "1";
      var tarde = f.querySelector('input[name="turno"][value="tarde"]');
      tarde.disabled = sab;
      if (sab && tarde.checked) f.querySelector('input[name="turno"][value="mañana"]').checked = true;
      aviso.hidden = !sab;
      var lineas = [BASE];
      lineas.push("Servicio: " + datos.servicios[selServ.value]);
      if (paquete) lineas.push("Me interesa el paquete de 10 sesiones.");
      lineas.push(valor("tipo") === "control" ? "Es una cita de control." : "Es mi primera vez.");
      var z = f.elements.zona.value;
      if (z && datos.zonas[z]) lineas.push("Zona de la molestia: " + datos.zonas[z].toLowerCase());
      lineas.push("Día: " + selDia.value);
      lineas.push("Turno: " + valor("turno"));
      var nom = f.elements.nombre.value.trim();
      if (nom) lineas.push("Nombre del paciente: " + nom);
      var msg = lineas.join("\n");
      burbuja.textContent = msg;
      enviar.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
    }
    f.addEventListener("input", actualizar);
    f.addEventListener("change", actualizar);
    f.addEventListener("submit", function (ev) { ev.preventDefault(); });
    actualizar();
  });
})();
