/* Cotomaya Venezuela. Todo el contenido está en el HTML: esto solo adorna. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function safe(f) { try { f(); } catch (err) { if (window.console) console.warn(err); } }
  function datos(sel, r) { var n = $(sel, r); return n ? JSON.parse(n.textContent) : null; }
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Logo: si existe fotos/logo.webp, reemplaza el nombre */
  safe(function () {
    var prueba = new Image();
    prueba.onload = function () {
      $$(".marca-texto").forEach(function (t) {
        var i = new Image(); i.src = prueba.src; i.alt = "Cotomaya Venezuela"; t.replaceWith(i);
      });
    };
    prueba.src = "fotos/logo.webp";
  });

  /* Cabecera, estela de avance y fotos con paralaje */
  safe(function () {
    var cab = $("[data-cabecera]"), estela = $("[data-estela]");
    var capas = $$("[data-paralaje]");
    var pendiente = false;
    function pintar() {
      pendiente = false;
      var y = window.scrollY, alto = document.documentElement.scrollHeight - window.innerHeight;
      if (cab) cab.classList.toggle("solida", y > 60);
      if (estela) estela.style.setProperty("--avance", alto > 0 ? Math.min(1, y / alto).toFixed(4) : 0);
      if (quieto) return;
      capas.forEach(function (c) {
        var r = c.parentElement.getBoundingClientRect();
        if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
        var centro = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        c.style.transform = "translate3d(0," + (centro * -7).toFixed(2) + "%,0)";
      });
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); } }
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    pintar();
  });

  /* Portada: elegir cómo salir cambia la foto, el precio y el mensaje */
  safe(function () {
    var caja = $("[data-portada]"); if (!caja) return;
    var ops = datos("[data-op-datos]", caja);
    var botones = $$("[data-op]", caja), capas = $$("[data-capa]", caja), wa = $("[data-op-wa]", caja);
    capas.forEach(function (c) { c.loading = "eager"; });
    function elegir(id, foco) {
      var o = ops.filter(function (x) { return x.id === id; })[0]; if (!o) return;
      botones.forEach(function (b) {
        var si = b.dataset.op === id;
        b.setAttribute("aria-selected", si ? "true" : "false");
        b.tabIndex = si ? 0 : -1;
        if (si && foco) b.focus();
      });
      capas.forEach(function (c) { c.classList.toggle("activa", c.dataset.capa === id); });
      $("[data-op-nombre]", caja).textContent = o.nombre;
      $("[data-op-precio]", caja).textContent = o.precio;
      $("[data-op-dur]", caja).textContent = o.dur;
      wa.href = o.wa;
    }
    botones.forEach(function (b, i) {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener("click", function () { elegir(b.dataset.op); });
      b.addEventListener("keydown", function (ev) {
        var d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        if (d) { ev.preventDefault(); elegir(botones[(i + d + botones.length) % botones.length].dataset.op, true); }
      });
    });
    /* El botón flotante se esconde mientras el de la portada está a la vista */
    var flot = $("[data-flotante]");
    if (flot && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { flot.classList.toggle("oculto", en[0].isIntersecting); }, { threshold: .35 }).observe(caja);
    }
  });

  /* El mar hoy: pronóstico real de Open-Meteo, con texto de respaldo */
  safe(function () {
    var cajas = $$("[data-mar-hoy]"), solHoy = $("[data-sol-hoy]");
    if ((!cajas.length && !solHoy) || !window.fetch) return;
    var LAT = 10.86, LON = -68.24;
    var f1 = fetch("https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON + "&current=wind_speed_10m&daily=sunset&timezone=America%2FCaracas&forecast_days=1").then(function (r) { return r.json(); });
    var f2 = fetch("https://marine-api.open-meteo.com/v1/marine?latitude=" + LAT + "&longitude=" + LON + "&current=wave_height&timezone=America%2FCaracas").then(function (r) { return r.json(); });
    function hora(iso) {
      var p = iso.split("T")[1].split(":"), h = +p[0];
      return (h % 12 || 12) + ":" + p[1] + (h < 12 ? " a. m." : " p. m.");
    }
    f1.then(function (d) {
      var viento = Math.round(d.current.wind_speed_10m), sol = hora(d.daily.sunset[0]);
      cajas.forEach(function (c) {
        $('[data-dato="viento"]', c).textContent = viento + " km/h";
        $('[data-dato="sol"]', c).textContent = sol;
        $("[data-fuente]", c).hidden = false;
      });
      if (solHoy) { solHoy.textContent = "Hoy el sol se pone a las " + sol + " en Tucacas."; solHoy.hidden = false; }
    }).catch(function () {});
    f2.then(function (d) {
      var ola = d.current.wave_height;
      if (typeof ola !== "number") return;
      cajas.forEach(function (c) { $('[data-dato="olas"]', c).textContent = ola.toFixed(1).replace(".", ",") + " m"; });
    }).catch(function () {});
  });

  /* Mueva el sol */
  safe(function () {
    $$("[data-dia]").forEach(function (r) {
      var caja = r.closest(".dia");
      var fotos = $$("[data-dia-foto]", caja), pasos = $$("[data-dia-paso]", caja);
      fotos.forEach(function (f) { f.loading = "eager"; });
      var ultimo = 0;
      function ir() {
        var v = parseFloat(r.value), i = Math.round(v);
        fotos.forEach(function (f, n) {
          var o = Math.max(0, 1 - Math.abs(n - v));
          f.style.opacity = o.toFixed(3);
        });
        if (i !== ultimo) {
          pasos[ultimo].classList.remove("activo");
          pasos[i].classList.add("activo");
          ultimo = i;
        }
      }
      r.addEventListener("input", ir);
      r.addEventListener("change", function () { r.value = Math.round(parseFloat(r.value)); ir(); });
      ir();
    });
  });

  /* Carta de los cayos: la vista vuela hasta el cayo y traza el camino desde Tucacas */
  safe(function () {
    var marco = $("[data-carta]"); if (!marco) return;
    var sec = marco.closest(".carta");
    var cayos = datos("[data-carta-datos]", sec), salida = datos("[data-carta-salida]", sec);
    var mapa = $("[data-carta-mapa]", sec), ruta = $("[data-carta-ruta]", sec);
    var puntos = $$(".punto", sec), fichas = $$(".ficha-cayo", sec);
    var actual = null, ZOOM = 1.9;
    function xy(p) { return [p[0] * 1.5, p[1]]; }
    function trazo(c) {
      var pts = [salida].concat(c.camino, [c.xy]).map(xy), d = "M" + pts[0][0] + " " + pts[0][1];
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        d += " Q" + pts[i][0] + " " + pts[i][1] + " " + mx + " " + my;
      }
      var u = pts[pts.length - 1];
      return d + " L" + u[0] + " " + u[1];
    }
    function encuadrar(c) {
      var w = marco.clientWidth, h = marco.clientHeight;
      var cx = (c.xy[0] + salida[0]) / 2, cy = (c.xy[1] + salida[1]) / 2;
      /* Se acerca lo más posible sin perder Tucacas ni el cayo */
      var ancho = Math.abs(c.xy[0] - salida[0]) + 22, alto = Math.abs(c.xy[1] - salida[1]) + 26;
      var z = Math.max(1, Math.min(ZOOM, 100 / ancho, 100 / alto));
      var tx = Math.min(0, Math.max(w - w * z, w / 2 - cx / 100 * w * z));
      var ty = Math.min(0, Math.max(h - h * z, h / 2 - cy / 100 * h * z));
      mapa.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + z.toFixed(3) + ")";
      mapa.style.setProperty("--contra", (1 / z).toFixed(3));
    }
    function elegir(id) {
      var c = cayos.filter(function (x) { return x.id === id; })[0]; if (!c) return;
      actual = c;
      puntos.forEach(function (p) { p.classList.toggle("activo", p.dataset.cayo === id); });
      fichas.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cayo === id ? "true" : "false"); });
      ruta.setAttribute("d", trazo(c));
      encuadrar(c);
      var foto = $("[data-panel-foto]", sec);
      foto.src = "fotos/" + c.foto + "-600.webp"; foto.alt = c.alt;
      $("[data-panel-nombre]", sec).textContent = c.nombre;
      $("[data-panel-ve]", sec).textContent = c.ve;
      $("[data-panel-hace]", sec).textContent = c.hace;
      $("[data-panel-wa]", sec).href = c.wa;
    }
    puntos.concat(fichas).forEach(function (b) { b.addEventListener("click", function () { elegir(b.dataset.cayo); }); });
    window.addEventListener("resize", function () { if (actual) encuadrar(actual); });
    elegir(cayos[0].id);
  });

  /* ¿Con quién va? */
  safe(function () {
    var caja = $("[data-plan-caja]"); if (!caja) return;
    var d = datos("[data-plan-datos]", caja), bs = $$("[data-plan]", caja);
    bs.forEach(function (b) {
      b.addEventListener("click", function () {
        var p = d[b.dataset.plan];
        bs.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $("[data-plan-op]", caja).textContent = p.op;
        $("[data-plan-razon]", caja).textContent = p.razon;
        $("[data-plan-foto]", caja).src = "fotos/" + p.foto + "-600.webp";
        $("[data-plan-wa]", caja).href = p.wa;
      });
    });
  });

  /* Hoja Más */
  safe(function () {
    var hoja = $("[data-hoja]"); if (!hoja) return;
    $$("[data-abrir-hoja]").forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); hoja.hidden = false; });
    });
    $$("[data-cerrar-hoja]", hoja).forEach(function (b) { b.addEventListener("click", function () { hoja.hidden = true; }); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") hoja.hidden = true; });
  });

  /* Galería: filtros y visor con el dedo */
  safe(function () {
    var fotos = $$("[data-visor]"); if (!fotos.length) return;
    var caja = $("[data-visor-caja]"), img = $("[data-visor-foto]"), lista = fotos, i = 0, inicioX = null;
    $$("[data-filtro]").forEach(function (b, _, todos) {
      b.addEventListener("click", function () {
        var f = b.dataset.filtro;
        todos.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        fotos.forEach(function (g) { g.hidden = !(f === "todas" || g.dataset.cat === f); });
        lista = fotos.filter(function (g) { return !g.hidden; });
      });
    });
    function ver(n) {
      i = (n + lista.length) % lista.length;
      img.src = lista[i].dataset.visor;
      img.alt = $("img", lista[i]).alt;
    }
    function cerrar() { caja.hidden = true; document.body.style.overflow = ""; }
    fotos.forEach(function (g) {
      g.addEventListener("click", function () {
        ver(lista.indexOf(g)); caja.hidden = false; document.body.style.overflow = "hidden"; $("[data-visor-cerrar]").focus();
      });
    });
    $("[data-visor-cerrar]").addEventListener("click", cerrar);
    $("[data-visor-ant]").addEventListener("click", function () { ver(i - 1); });
    $("[data-visor-sig]").addEventListener("click", function () { ver(i + 1); });
    caja.addEventListener("click", function (ev) { if (ev.target === caja) cerrar(); });
    document.addEventListener("keydown", function (ev) {
      if (caja.hidden) return;
      if (ev.key === "Escape") cerrar();
      if (ev.key === "ArrowLeft") ver(i - 1);
      if (ev.key === "ArrowRight") ver(i + 1);
    });
    caja.addEventListener("touchstart", function (ev) { inicioX = ev.touches[0].clientX; }, { passive: true });
    caja.addEventListener("touchend", function (ev) {
      if (inicioX === null) return;
      var d = ev.changedTouches[0].clientX - inicioX; inicioX = null;
      if (Math.abs(d) > 45) ver(i + (d < 0 ? 1 : -1));
    }, { passive: true });
  });

  /* Mapa real: carga al acercarse */
  safe(function () {
    var m = $("[data-mapa]"); if (!m) return;
    function poner() {
      if (m.classList.contains("cargado")) return;
      var f = document.createElement("iframe");
      f.src = m.dataset.mapa; f.title = "Mapa de Tucacas, Falcón"; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
      m.textContent = ""; m.appendChild(f); m.classList.add("cargado");
    }
    if ("IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { o.disconnect(); poner(); } }, { rootMargin: "400px" });
      o.observe(m);
    } else poner();
  });

  /* Armar el mensaje de reserva */
  safe(function () {
    var caja = $("[data-armador]"); if (!caja) return;
    var fecha = $("[data-a-fecha]", caja), salidaP = $("[data-a-personas]", caja), personas = 2;
    var msg = $("[data-a-mensaje]", caja), total = $("[data-a-total]", caja), wa = $("[data-a-wa]", caja);
    var hoy = new Date(); hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    fecha.min = hoy.toISOString().slice(0, 10);
    function bonita(v) {
      var p = v.split("-");
      var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      return +p[2] + " de " + meses[+p[1] - 1];
    }
    function pintar() {
      var r = $('input[name="op"]:checked', caja);
      var precio = +r.dataset.precio, porPersona = r.dataset.persona === "1";
      salidaP.textContent = personas;
      total.textContent = "$" + (porPersona ? precio * personas : precio);
      var t = "Hola, quisiera reservar " + r.dataset.articulo + " con Cotomaya Venezuela, para " + personas + (personas === 1 ? " persona" : " personas");
      if (fecha.value) t += ", el " + bonita(fecha.value);
      t += ". ¿Me envían el presupuesto?";
      msg.textContent = t;
      wa.href = wa.href.split("?")[0] + "?text=" + encodeURIComponent(t);
    }
    $$('input[name="op"]', caja).forEach(function (r) { r.addEventListener("change", pintar); });
    fecha.addEventListener("change", pintar);
    $("[data-a-menos]", caja).addEventListener("click", function () { if (personas > 1) { personas--; pintar(); } });
    $("[data-a-mas]", caja).addEventListener("click", function () { if (personas < 40) { personas++; pintar(); } });
    pintar();
  });
})();
