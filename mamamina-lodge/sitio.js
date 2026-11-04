/* Mamamina Lodge · comportamiento. Todo el contenido está en el HTML: esto solo adorna y arma mensajes. */
(function () {
  "use strict";
  var WA = "580000000000";
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* titular palabra por palabra */
  document.querySelectorAll("[data-palabras]").forEach(function (h) {
    var palabras = h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label", h.textContent.trim());
    h.innerHTML = palabras.map(function (p, i) {
      return '<span class="p" aria-hidden="true" style="--i:' + i + '">' + p + "</span>";
    }).join(" ");
  });

  /* hoja del menú */
  var hoja = document.getElementById("hoja-menu");
  var abrir = document.querySelector(".abrir-menu");
  function cerrarHoja() {
    if (!hoja || hoja.hidden) return;
    hoja.classList.remove("abierta");
    abrir.setAttribute("aria-expanded", "false");
    setTimeout(function () { hoja.hidden = true; }, quieto ? 0 : 420);
    abrir.focus();
  }
  if (hoja && abrir) {
    abrir.addEventListener("click", function () {
      hoja.hidden = false;
      abrir.setAttribute("aria-expanded", "true");
      requestAnimationFrame(function () { requestAnimationFrame(function () { hoja.classList.add("abierta"); }); });
      var a = hoja.querySelector("a");
      if (a) setTimeout(function () { a.focus({ preventScroll: true }); }, 50);
    });
    hoja.querySelectorAll("[data-cerrar]").forEach(function (b) { b.addEventListener("click", cerrarHoja); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") cerrarHoja(); });
    /* deslizar hacia abajo para cerrar */
    var panel = hoja.querySelector(".hoja-panel"), y0 = null;
    panel.addEventListener("touchstart", function (ev) { y0 = ev.touches[0].clientY; }, { passive: true });
    panel.addEventListener("touchend", function (ev) {
      if (y0 !== null && ev.changedTouches[0].clientY - y0 > 70 && panel.scrollTop <= 0) cerrarHoja();
      y0 = null;
    });
  }

  /* onda al tocar botones */
  document.addEventListener("pointerdown", function (ev) {
    var b = ev.target.closest(".boton");
    if (!b || quieto) return;
    var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
    var o = document.createElement("span");
    o.className = "onda";
    o.style.cssText = "width:" + d + "px;height:" + d + "px;left:" + (ev.clientX - r.left - d / 2) + "px;top:" + (ev.clientY - r.top - d / 2) + "px";
    b.appendChild(o);
    setTimeout(function () { o.remove(); }, 650);
  });

  /* parallax de fotos y marea de los títulos */
  var moviles = [].slice.call(document.querySelectorAll(".portada-foto img, .foto-marco img"));
  var titulos = [].slice.call(document.querySelectorAll(".titulo-seccion"));
  var olas = [].slice.call(document.querySelectorAll(".ola-sep"));
  var pendiente = false;
  function mover() {
    pendiente = false;
    var alto = window.innerHeight;
    moviles.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > alto) return;
      var centro = (r.top + r.height / 2 - alto / 2) / alto; /* -1 .. 1 */
      var k = img.closest(".portada") ? -0.18 : -0.08;
      img.style.setProperty("--py", (centro * k * r.height).toFixed(1) + "px");
    });
    olas.forEach(function (o) {
      o.style.setProperty("--ox", (-(window.scrollY * 0.16) % (o.getBoundingClientRect().width / 2)).toFixed(1) + "px");
    });
    titulos.forEach(function (t) {
      var r = t.getBoundingClientRect();
      var v = Math.min(1, Math.max(0.25, (alto - r.top) / (alto * 0.6)));
      t.style.setProperty("--marea", v.toFixed(3));
    });
  }
  if (!quieto) {
    window.addEventListener("scroll", function () { if (!pendiente) { pendiente = true; requestAnimationFrame(mover); } }, { passive: true });
    window.addEventListener("resize", mover);
    mover();
  }

  /* portada: las fotos se relevan solas */
  var pase = document.querySelector("[data-pase]");
  if (pase && !quieto) {
    window.addEventListener("load", function () {
      var capas = pase.getAttribute("data-pase").split("|").map(function (src) {
        var i = new Image();
        i.src = src; i.alt = ""; i.className = "pase zoom"; i.setAttribute("aria-hidden", "true");
        pase.insertBefore(i, pase.querySelector(".ola"));
        return i;
      });
      var n = -1;
      setInterval(function () {
        capas.forEach(function (c) { c.classList.remove("activa"); });
        n = n + 1 >= capas.length ? -1 : n + 1;
        if (n >= 0) capas[n].classList.add("activa");
      }, 5500);
    });
  }

  /* un día: avanza solo hasta que la persona lo toque */
  var dia = document.querySelector("[data-dia]");
  if (dia) {
    var tarjetas = [].slice.call(dia.children), linea = document.querySelector(".dia-linea");
    var pintarDia = function () {
      var c = dia.getBoundingClientRect(), mitad = c.left + c.width / 2;
      tarjetas.forEach(function (t) {
        var r = t.getBoundingClientRect();
        var d = Math.min(1, Math.abs(r.left + r.width / 2 - mitad) / r.width);
        t.style.setProperty("--s", (1 - d * 0.06).toFixed(3));
      });
      var total = dia.scrollWidth - dia.clientWidth;
      if (linea && total > 0) linea.style.setProperty("--avance", (0.25 + 0.75 * dia.scrollLeft / total).toFixed(3));
    };
    dia.addEventListener("scroll", function () { requestAnimationFrame(pintarDia); }, { passive: true });
    pintarDia();
    var quieta = 0, paso = 0, enVista = false;
    dia.addEventListener("pointerdown", function () { quieta = Date.now() + 9000; });
    dia.addEventListener("touchstart", function () { quieta = Date.now() + 9000; }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { enVista = e[0].isIntersecting; }, { threshold: 0.4 }).observe(dia);
    }
    if (!quieto) {
      setInterval(function () {
        if (!enVista || Date.now() < quieta || dia.scrollWidth <= dia.clientWidth + 4) return;
        paso = (paso + 1) % tarjetas.length;
        dia.scrollTo({ left: tarjetas[paso].offsetLeft - tarjetas[0].offsetLeft, behavior: "smooth" });
      }, 3600);
    }
  }

  /* mapa: la ruta se traza al verlo y se repite mientras esté a la vista */
  if ("IntersectionObserver" in window) {
    document.querySelectorAll("[data-mapa-vivo]").forEach(function (m) {
      if (quieto) return;
      var reloj = null;
      function jugar() { m.classList.remove("jugar"); void m.getBoundingClientRect(); m.classList.add("jugar"); }
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting && !reloj) { jugar(); reloj = setInterval(jugar, 11000); }
        if (!e[0].isIntersecting && reloj) { clearInterval(reloj); reloj = null; }
      }, { threshold: 0.35 }).observe(m);
    });
    /* el mapa real de Google se pide solo al acercarse */
    document.querySelectorAll("[data-mapa-real]").forEach(function (c) {
      var o = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        o.disconnect();
        var f = document.createElement("iframe");
        f.src = c.getAttribute("data-mapa-real");
        f.title = "Ubicación de Mamamina Lodge en Google Maps";
        f.loading = "lazy";
        f.referrerPolicy = "no-referrer-when-downgrade";
        c.innerHTML = "";
        c.appendChild(f);
      }, { rootMargin: "300px" });
      o.observe(c);
    });
  }

  /* boleto: arma el mensaje de WhatsApp en vivo */
  document.querySelectorAll("[data-boleto]").forEach(function (bol) {
    var form = bol.querySelector("form");
    var enviar = bol.querySelector(".boleto-enviar");
    var cont = {};
    bol.querySelectorAll("[data-contador]").forEach(function (c) {
      var nombre = c.getAttribute("data-contador"), out = c.querySelector("output");
      var min = +c.getAttribute("data-min"), max = +c.getAttribute("data-max");
      cont[nombre] = { el: c, out: out, v: +out.textContent, min: min, max: max };
      var bs = c.querySelectorAll("button");
      bs[0].addEventListener("click", function () { cambiar(nombre, -1); });
      bs[1].addEventListener("click", function () { cambiar(nombre, 1); });
    });
    var hoy = new Date(); hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    var fecha = form.querySelector("input[type=date]");
    fecha.min = hoy.toISOString().slice(0, 10);

    function cambiar(n, d) {
      var c = cont[n];
      c.v = Math.min(c.max, Math.max(c.min, c.v + d));
      c.out.textContent = c.v;
      pintar();
    }
    function fijar(clave, texto) {
      var el = bol.querySelector('[data-b="' + clave + '"]');
      if (el.textContent !== texto) {
        el.textContent = texto;
        el.classList.remove("cambio"); void el.offsetWidth; el.classList.add("cambio");
      }
    }
    function legible(iso) {
      if (!iso) return "";
      var p = iso.split("-");
      var meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
      return +p[2] + " " + meses[+p[1] - 1] + " " + p[0];
    }
    function pintar() {
      var cab = form.querySelector("input[type=radio]:checked");
      var nombre = cab.getAttribute("data-nombre"), precio = +cab.getAttribute("data-precio"), cap = +cab.getAttribute("data-cap");
      var noches = cont.noches.v, personas = cont.personas.v, isl = form.querySelector("input[name=islotes]").checked;
      var llegada = legible(fecha.value);
      fijar("habitacion", nombre);
      fijar("llegada", llegada || "Por elegir");
      fijar("noches", String(noches));
      fijar("personas", String(personas));
      fijar("total", "$" + precio * noches);
      var caney = form.querySelector("input[name=caney]").checked;
      bol.querySelector('[data-b="islotes"]').hidden = !isl;
      bol.querySelector('[data-b="caney"]').hidden = !caney;
      var aviso = bol.querySelector('[data-b="aviso"]');
      aviso.hidden = personas <= cap;
      aviso.textContent = personas > cap ? "Para " + personas + " personas le conviene la habitación familiar o dos habitaciones: se lo confirmamos." : "";
      var msg = "Hola, quiero reservar en Mamamina Lodge.\n" +
        "Habitación: " + nombre + "\n" +
        "Llegada: " + (llegada || "por definir") + "\n" +
        "Noches: " + noches + "\n" +
        "Personas: " + personas +
        (isl ? "\nTambién quiero el paseo a los islotes." : "") +
        (caney ? "\nQuiero reservar un caney para mi grupo." : "") +
        "\n¿Tienen disponible?";
      enviar.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
    }
    form.addEventListener("change", pintar);
    form.addEventListener("input", pintar);
    enviar.addEventListener("click", function () {
      if (quieto) return;
      bol.classList.add("arrancado");
      setTimeout(function () { bol.classList.remove("arrancado"); }, 1300);
    });
    pintar();
  });

  /* galería: filtros y visor */
  var items = [].slice.call(document.querySelectorAll(".g-item"));
  document.querySelectorAll(".filtro").forEach(function (f) {
    f.addEventListener("click", function () {
      var g = f.getAttribute("data-filtro");
      document.querySelectorAll(".filtro").forEach(function (o) {
        o.classList.toggle("activo", o === f);
        o.setAttribute("aria-pressed", o === f ? "true" : "false");
      });
      items.forEach(function (it) { it.hidden = !(g === "Todas" || it.getAttribute("data-grupo") === g); });
    });
  });
  var visor = document.querySelector(".visor");
  if (visor) {
    var img = visor.querySelector("img"), actual = 0, x0 = null, origen = null;
    var visibles = function () { return items.filter(function (it) { return !it.hidden; }); };
    function mostrar(i) {
      var lista = visibles();
      actual = (i + lista.length) % lista.length;
      var b = lista[actual].querySelector(".g-boton");
      img.src = b.getAttribute("data-visor");
      img.alt = b.getAttribute("data-alt");
    }
    function cerrar() { visor.hidden = true; document.body.style.overflow = ""; if (origen) origen.focus(); }
    items.forEach(function (it) {
      it.querySelector(".g-boton").addEventListener("click", function () {
        origen = this;
        visor.hidden = false; document.body.style.overflow = "hidden";
        mostrar(visibles().indexOf(it));
        visor.querySelector(".visor-cerrar").focus();
      });
    });
    visor.querySelector(".visor-cerrar").addEventListener("click", cerrar);
    visor.querySelector(".visor-ant").addEventListener("click", function () { mostrar(actual - 1); });
    visor.querySelector(".visor-sig").addEventListener("click", function () { mostrar(actual + 1); });
    visor.addEventListener("click", function (ev) { if (ev.target === visor) cerrar(); });
    document.addEventListener("keydown", function (ev) {
      if (visor.hidden) return;
      if (ev.key === "Escape") cerrar();
      if (ev.key === "ArrowLeft") mostrar(actual - 1);
      if (ev.key === "ArrowRight") mostrar(actual + 1);
    });
    img.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    img.addEventListener("touchend", function (ev) {
      if (x0 === null) return;
      var dx = ev.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
})();
