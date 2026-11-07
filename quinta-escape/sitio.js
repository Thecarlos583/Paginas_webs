/* Quinta Escape. Lo que se cambia a mano está en CONFIG. */
var CONFIG = {
  /* Enlace de Google Maps: por confirmar con la ubicación del dueño. Cámbielo solo aquí. */
  mapa: "https://www.google.com/maps/search/?api=1&query=Playa%20Corrales%2C%20Chirimena%2C%20Miranda%2C%20Venezuela",
  mapaEmbebido: "https://maps.google.com/maps?q=Playa%20Corrales%2C%20Chirimena%2C%20Miranda%2C%20Venezuela&z=14&output=embed",
  whatsapp: "584142773926",
  tarifaFinde: 480,      /* viernes a domingo, hasta 8 personas */
  incluidas: 8,
  adicional: 60,         /* por persona, por fin de semana */
  maximo: 14,
  /* Fechas que se tratan como temporada alta en el armador. Navidad y fin de año: rango por confirmar con el dueño. */
  navidadDesde: [12, 20],
  navidadHasta: [1, 6],
  lat: 10.62, lon: -66.17
};

(function () {
  "use strict";
  function safe(fn, nombre) { try { fn(); } catch (e) { if (window.console) console.warn(nombre, e); } }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function dia0(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function suma(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function deIso(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function largo(d) { return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()]; }
  function noches(a, b) { return Math.round((dia0(b) - dia0(a)) / 864e5); }

  /* Pascua (Meeus) para ubicar carnaval y Semana Santa */
  function pascua(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mes - 1, dia);
  }
  function temporada(d) {
    d = dia0(d);
    var y = d.getFullYear(), p = pascua(y), mes = d.getMonth() + 1, n = d.getDate();
    if (d >= suma(p, -51) && d <= suma(p, -46)) return "Carnaval";
    if (d >= suma(p, -9) && d <= p) return "Semana Santa";
    var desde = CONFIG.navidadDesde, hasta = CONFIG.navidadHasta;
    if ((mes === desde[0] && n >= desde[1]) || (mes === hasta[0] && n <= hasta[1])) return "Navidad y fin de año";
    return "";
  }
  function temporadaEn(a, b) {
    for (var d = dia0(a); d <= b; d = suma(d, 1)) { var t = temporada(d); if (t) return t; }
    return "";
  }

  /* Logo: si existe fotos/logo.webp, reemplaza el nombre escrito */
  function initLogo() {
    var img = new Image();
    img.onload = function () {
      $$(".marca").forEach(function (m) {
        var i = new Image(); i.src = img.src; i.alt = "Quinta Escape";
        m.textContent = ""; m.appendChild(i);
      });
    };
    img.src = "fotos/logo.webp";
  }

  function initMapa() {
    $$("[data-mapa]").forEach(function (a) { a.href = CONFIG.mapa; });
    var b = $("[data-cargar-mapa]");
    if (b) b.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = CONFIG.mapaEmbebido; f.title = "Mapa de Playa Corrales, Chirimena"; f.loading = "lazy";
      b.parentNode.appendChild(f); b.remove();
    });
  }

  function initHoja() {
    var hoja = $(".hoja"), fondo = $(".fondo-hoja");
    if (!hoja) return;
    var quien = null;
    function abrir(e) {
      e.preventDefault(); quien = e.currentTarget;
      hoja.classList.add("abierta"); fondo.classList.add("abierta");
      var c = $("[data-cerrar-hoja]", hoja); if (c) c.focus();
    }
    function cerrar() {
      hoja.classList.remove("abierta"); fondo.classList.remove("abierta");
      if (quien) quien.focus();
    }
    $$("[data-abrir-hoja]").forEach(function (b) { b.addEventListener("click", abrir); });
    $$("[data-cerrar-hoja]").forEach(function (b) { b.addEventListener("click", cerrar); });
    fondo.addEventListener("click", cerrar);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && hoja.classList.contains("abierta")) cerrar(); });
    var y0 = null;
    hoja.addEventListener("touchstart", function (e) { y0 = hoja.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    hoja.addEventListener("touchend", function (e) { if (y0 !== null && e.changedTouches[0].clientY - y0 > 70) cerrar(); }, { passive: true });
  }

  /* Portada: las fotos se relevan solas, solo si se ve */
  function initPortada() {
    var caja = $(".portada-fotos"); if (!caja) return;
    var fotos = $$("img", caja), i = 0, visible = true;
    if (fotos.length < 2 || quieto) return;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: .05 }).observe(caja);
    setInterval(function () {
      if (!visible || document.hidden) return;
      var sig = fotos[(i + 1) % fotos.length];
      if (!sig.complete) return;
      fotos[i].classList.remove("ve"); i = (i + 1) % fotos.length; sig.classList.add("ve");
    }, 6500);
  }

  /* Paralaje suave en las fotos grandes */
  function initParalaje() {
    var els = $$("[data-paralaje]");
    if (!els.length || quieto) return;
    var pend = false;
    function pinta() {
      pend = false;
      var alto = window.innerHeight;
      els.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > alto) return;
        var p = (r.top + r.height / 2 - alto / 2) / (alto + r.height);
        el.style.transform = "translate3d(0," + (-6 + p * -10).toFixed(2) + "%,0)";
      });
    }
    window.addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(pinta); } }, { passive: true });
    window.addEventListener("resize", pinta); pinta();
  }

  /* Firma: el armador con las 14 franjas */
  function initArmador() {
    $$("[data-armador]").forEach(function (caja) {
      var st = { personas: CONFIG.incluidas, mascotas: 0, llegada: null, salida: null };
      var franjas = $$(".franjas i", caja), num = $("[data-num]", caja), pie = $("[data-pie]", caja), aviso = $("[data-aviso]", caja),
        boton = $("[data-wa]", caja), outP = $("[data-personas]", caja), outM = $("[data-mascotas]", caja),
        chips = $(".chips", caja), fechas = $(".fechas", caja), inL = $("[data-llegada]", caja), inS = $("[data-salida]", caja);
      var hoy = dia0(new Date());

      function cuenta() {
        var r = { precio: null, pie: "", avisos: [] }, p = st.personas, a = st.llegada, b = st.salida;
        var base = CONFIG.tarifaFinde + Math.max(0, p - CONFIG.incluidas) * CONFIG.adicional;
        if (!a || !b) {
          r.precio = base; r.pie = "fin de semana de viernes a domingo";
          if (p <= 2) r.avisos.push("Las parejas se reciben de lunes a jueves en temporada baja, con algunas excepciones. Pregúntenos por su fecha.");
        } else {
          var n = noches(a, b), t = temporadaEn(a, suma(b, -1)), finde = a.getDay() === 5 && b.getDay() === 0 && n === 2;
          var semana = n > 0 && a.getDay() >= 1 && a.getDay() <= 4 && b.getDay() >= 2 && b.getDay() <= 5 && n <= 4;
          if (n <= 0) r.avisos.push("La salida debe ser después de la llegada.");
          else if (n === 1) r.avisos.push("El mínimo es de 2 noches: si entran una sola noche, igual se pagan las 2.");
          if (t) r.avisos.push(t + " tiene tarifa distinta. Se la confirmamos por WhatsApp.");
          else if (finde) {
            r.precio = base; r.pie = "por este fin de semana";
            if (p <= 2) { r.precio = null; r.avisos.push("Las parejas se reciben de lunes a jueves en temporada baja, con algunas excepciones. Pregúntenos por esta fecha."); }
          } else if (semana) r.avisos.push("De lunes a jueves en temporada baja hay tarifas reducidas. Se las cotizamos por WhatsApp.");
          else if (n >= 2) r.avisos.push("Estas fechas se cotizan por WhatsApp.");
        }
        if (st.mascotas > 0) r.avisos.push("Cada mascota lleva un pago extra, que se confirma por WhatsApp.");
        if (p >= CONFIG.maximo) r.avisos.push("Son 14 camas: ese es el máximo de la casa.");
        return r;
      }
      function mensaje(r) {
        var t = "Hola, quisiera un presupuesto para Quinta Escape.\n";
        t += st.llegada && st.salida ? "Fechas: del " + largo(st.llegada) + " al " + largo(st.salida) + ".\n" : "Fechas: por definir.\n";
        t += "Personas: " + st.personas + ".\n";
        if (st.mascotas) t += "Mascotas: " + st.mascotas + ".\n";
        if (r.precio !== null && st.llegada) t += "En la web me sale una referencia de $" + r.precio + ".\n";
        return t + "¿Tienen disponibilidad?";
      }
      function pinta() {
        franjas.forEach(function (f, i) { f.classList.toggle("on", i < st.personas); });
        outP.textContent = st.personas; if (outM) outM.textContent = st.mascotas;
        $("[data-menos]", caja).disabled = st.personas <= 1;
        $("[data-mas]", caja).disabled = st.personas >= CONFIG.maximo;
        var r = cuenta();
        num.textContent = r.precio !== null ? "$" + r.precio : "Se consulta";
        num.classList.toggle("consulta", r.precio === null);
        pie.textContent = r.precio !== null ? r.pie : "por WhatsApp";
        aviso.hidden = !r.avisos.length; aviso.textContent = r.avisos.join(" ");
        boton.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(mensaje(r));
      }
      function marcar(b) { $$(".chip", caja).forEach(function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); }); }

      /* Próximos tres fines de semana y "Otras fechas" */
      var v = suma(hoy, (5 - hoy.getDay() + 7) % 7 || 7);
      for (var i = 0; i < 3; i++) (function (viernes) {
        var dom = suma(viernes, 2), b = document.createElement("button");
        b.type = "button"; b.className = "chip"; b.setAttribute("aria-pressed", "false");
        b.textContent = viernes.getDate() + (viernes.getMonth() === dom.getMonth() ? "" : " " + MESES[viernes.getMonth()].slice(0, 3)) + " al " + dom.getDate() + " " + MESES[dom.getMonth()].slice(0, 3);
        b.addEventListener("click", function () {
          var ya = b.getAttribute("aria-pressed") === "true";
          marcar(ya ? null : b); st.llegada = ya ? null : viernes; st.salida = ya ? null : dom;
          fechas.hidden = true; pinta();
        });
        chips.appendChild(b);
      })(suma(v, i * 7));
      var otra = document.createElement("button");
      otra.type = "button"; otra.className = "chip"; otra.textContent = "Otras fechas"; otra.setAttribute("aria-pressed", "false");
      otra.addEventListener("click", function () { marcar(otra); fechas.hidden = false; st.llegada = inL.value ? deIso(inL.value) : null; st.salida = inS.value ? deIso(inS.value) : null; pinta(); inL.focus(); });
      chips.appendChild(otra);
      fechas.hidden = true;
      inL.min = iso(hoy); inS.min = iso(suma(hoy, 1));
      inL.addEventListener("change", function () {
        st.llegada = inL.value ? deIso(inL.value) : null;
        if (st.llegada) { inS.min = iso(suma(st.llegada, 1)); if (!inS.value || deIso(inS.value) <= st.llegada) { inS.value = iso(suma(st.llegada, 2)); st.salida = deIso(inS.value); } }
        pinta();
      });
      inS.addEventListener("change", function () { st.salida = inS.value ? deIso(inS.value) : null; pinta(); });

      $("[data-menos]", caja).addEventListener("click", function () { st.personas = Math.max(1, st.personas - 1); pinta(); });
      $("[data-mas]", caja).addEventListener("click", function () { st.personas = Math.min(CONFIG.maximo, st.personas + 1); pinta(); });
      var mM = $("[data-mascota-menos]", caja), mP = $("[data-mascota-mas]", caja);
      if (mM) mM.addEventListener("click", function () { st.mascotas = Math.max(0, st.mascotas - 1); pinta(); });
      if (mP) mP.addEventListener("click", function () { st.mascotas = Math.min(6, st.mascotas + 1); pinta(); });
      pinta();
    });
  }

  function initDias() {
    var tabs = $$(".dias-tabs button"); if (!tabs.length) return;
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        tabs.forEach(function (o) { o.setAttribute("aria-selected", o === t ? "true" : "false"); });
        $$(".dia").forEach(function (d, k) { d.hidden = k !== i; });
      });
    });
  }

  /* Hora del amanecer en Corrales (ecuación del amanecer, hora de Venezuela) */
  function amanecer(fecha) {
    var rad = Math.PI / 180, lat = CONFIG.lat, lon = CONFIG.lon;
    var J = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12) / 864e5 + 2440587.5;
    var n = Math.round(J - 2451545 + 0.0008), Js = n - lon / 360;
    var M = (357.5291 + 0.98560028 * Js) % 360, C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    var L = (M + C + 180 + 102.9372) % 360, Jt = 2451545 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
    var dec = Math.asin(Math.sin(L * rad) * Math.sin(23.44 * rad));
    var w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec))) / rad;
    var ms = (Jt - w / 360 - 2440587.5) * 864e5 - 4 * 36e5;
    var d = new Date(ms), h = d.getUTCHours(), m = d.getUTCMinutes();
    return (h % 12 || 12) + ":" + ("0" + m).slice(-2) + (h < 12 ? " a. m." : " p. m.");
  }
  function initHoy() {
    var cajas = $$("[data-hoy]"); if (!cajas.length) return;
    var hora = amanecer(suma(new Date(), 1));
    cajas.forEach(function (c) { var s = $("[data-sol]", c); if (s) s.textContent = hora; });
    if (!window.fetch) return;
    var u = "https://marine-api.open-meteo.com/v1/marine?latitude=" + CONFIG.lat + "&longitude=" + CONFIG.lon + "&current=wave_height,sea_surface_temperature&timezone=America%2FCaracas";
    fetch(u).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.current) return;
      var o = d.current.wave_height, t = d.current.sea_surface_temperature;
      cajas.forEach(function (c) {
        var lo = $("[data-olas]", c), lt = $("[data-agua]", c), f = $("[data-fuente]", c);
        if (lo && o !== null && o !== undefined) { $("b", lo).textContent = String(o.toFixed(1)).replace(".", ",") + " m"; lo.hidden = false; }
        if (lt && t !== null && t !== undefined) { $("b", lt).textContent = Math.round(t) + " °C"; lt.hidden = false; }
        if (f) f.hidden = false;
      });
    }).catch(function () {});
  }

  function initColores() {
    var bs = $$(".colores button");
    bs.forEach(function (b) {
      function elegir() { bs.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); }); }
      b.addEventListener("click", elegir);
      b.addEventListener("mouseenter", elegir);
    });
  }

  /* Calendario de ejemplo. No está conectado a nada: las fechas son de muestra. */
  function initCalendario() {
    var caja = $("[data-calendario]"); if (!caja) return;
    var hoy = dia0(new Date()), mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1), primero = new Date(mes);
    var titulo = $("[data-cal-titulo]", caja), rejilla = $("[data-cal-mes]", caja), dice = $("[data-cal-dice]", caja), ant = $("[data-cal-ant]", caja), sig = $("[data-cal-sig]", caja);
    function estado(d) {
      if (d < hoy) return "pasada";
      if (temporada(d)) return "consulta";
      var sem = Math.floor((d.getTime() / 864e5 + 3) / 7), w = d.getDay();
      if ((w === 5 || w === 6 || w === 0) && sem % 3 !== 1) return "ocupada";
      if (sem % 5 === 2 && w >= 2 && w <= 3) return "ocupada";
      return "libre";
    }
    var TXT = { libre: "aparece libre en este ejemplo.", ocupada: "aparece ocupada en este ejemplo.", consulta: "es temporada alta en este ejemplo: se consulta por WhatsApp." };
    function pinta() {
      titulo.textContent = MESES[mes.getMonth()].charAt(0).toUpperCase() + MESES[mes.getMonth()].slice(1) + " " + mes.getFullYear();
      rejilla.textContent = "";
      var hueco = (mes.getDay() + 6) % 7, total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
      for (var h = 0; h < hueco; h++) rejilla.appendChild(document.createElement("span"));
      for (var n = 1; n <= total; n++) (function (n) {
        var d = new Date(mes.getFullYear(), mes.getMonth(), n), e = estado(d), b = document.createElement("button");
        b.type = "button"; b.textContent = n; b.className = e;
        if (e === "pasada") b.disabled = true;
        b.setAttribute("aria-label", largo(d) + ", " + (e === "pasada" ? "ya pasó" : TXT[e]));
        b.addEventListener("click", function () {
          $$("button", rejilla).forEach(function (o) { o.classList.remove("elegida"); });
          b.classList.add("elegida");
          dice.textContent = "El " + largo(d) + " " + TXT[e];
        });
        rejilla.appendChild(b);
      })(n);
      ant.disabled = mes <= primero;
      sig.disabled = (mes.getFullYear() - primero.getFullYear()) * 12 + mes.getMonth() - primero.getMonth() >= 5;
    }
    ant.addEventListener("click", function () { mes = new Date(mes.getFullYear(), mes.getMonth() - 1, 1); pinta(); });
    sig.addEventListener("click", function () { mes = new Date(mes.getFullYear(), mes.getMonth() + 1, 1); pinta(); });
    pinta();
  }

  /* Galería: filtros y visor */
  function initGaleria() {
    var items = $$(".galeria li"); if (!items.length) return;
    var filtros = $$(".filtros button"), visor = $(".visor"), img = $("img", visor), pie = $("p", visor), cuenta = $("[data-cuenta]", visor), actual = 0, lista = items, quien = null;
    filtros.forEach(function (f) {
      f.addEventListener("click", function () {
        filtros.forEach(function (o) { o.setAttribute("aria-pressed", o === f ? "true" : "false"); });
        var c = f.getAttribute("data-filtro");
        items.forEach(function (li) { li.hidden = c !== "todas" && li.getAttribute("data-cat") !== c; });
        lista = items.filter(function (li) { return !li.hidden; });
      });
    });
    function ver(i) {
      actual = (i + lista.length) % lista.length;
      var f = $("img", lista[actual]);
      img.src = f.getAttribute("data-grande"); img.alt = f.alt; pie.textContent = f.alt;
      cuenta.textContent = (actual + 1) + " de " + lista.length;
    }
    function cerrar() { visor.hidden = true; document.body.style.overflow = ""; if (quien) quien.focus(); }
    items.forEach(function (li) {
      $("button", li).addEventListener("click", function (e) {
        quien = e.currentTarget; ver(lista.indexOf(li)); visor.hidden = false; document.body.style.overflow = "hidden"; $("[data-v-cerrar]", visor).focus();
      });
    });
    $("[data-v-cerrar]", visor).addEventListener("click", cerrar);
    $("[data-v-ant]", visor).addEventListener("click", function () { ver(actual - 1); });
    $("[data-v-sig]", visor).addEventListener("click", function () { ver(actual + 1); });
    document.addEventListener("keydown", function (e) {
      if (visor.hidden) return;
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowLeft") ver(actual - 1);
      if (e.key === "ArrowRight") ver(actual + 1);
    });
    var x0 = null, y0 = null;
    visor.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    visor.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) ver(actual + (dx < 0 ? 1 : -1));
      else if (dy > 90) cerrar();
      x0 = null;
    }, { passive: true });
  }

  /* El botón flotante no tapa el botón de la portada mientras este se ve */
  function initFlotante() {
    var f = $(".flotante"), h = $(".portada-txt .boton");
    if (!f || !h || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (e) { f.classList.toggle("escondido", e[0].isIntersecting); }, { threshold: 0 }).observe(h);
  }

  safe(initFlotante, "flotante");
  safe(initLogo, "logo"); safe(initMapa, "mapa"); safe(initHoja, "hoja"); safe(initPortada, "portada"); safe(initParalaje, "paralaje");
  safe(initArmador, "armador"); safe(initDias, "dias"); safe(initHoy, "hoy"); safe(initColores, "colores"); safe(initCalendario, "calendario"); safe(initGaleria, "galeria");
})();
