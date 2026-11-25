/* Mansión La Faraona · interacción. El contenido ya está escrito en el HTML: esto solo adorna y arma el WhatsApp. */
(function () {
  "use strict";
  var d = document, H = d.documentElement;
  H.classList.add("js");
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  function seguro(f) { try { f(); } catch (err) { if (window.console) console.warn("[Faraona]", err); } }
  var QUIETO = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var AHORRO = !!(navigator.connection && navigator.connection.saveData);
  var PC = function () { return window.matchMedia && matchMedia("(min-width: 1080px)").matches; };
  var DATOS = {};
  seguro(function () { var s = $("#datos-cot"); if (s) DATOS = JSON.parse(s.textContent); });

  function fmt(n) {
    if (DATOS.mostrar === false) return "💬 Consulte la tarifa";
    var ent = Math.floor(n), dec = Math.round((n - ent) * 100);
    var s = String(ent).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return "Ref. " + s + (dec ? "," + (dec < 10 ? "0" : "") + dec : "");
  }
  function waUrl(t) { return "https://wa.me/" + (DATOS.wa || "584142516392") + "?text=" + encodeURIComponent(t); }
  function bloquear(si) { d.body.classList.toggle("bloqueado", si); }

  /* Menú del teléfono */
  seguro(function () {
    var caj = $("#cajon"), btn = $("[data-abrir-cajon]");
    if (!caj || !btn) return;
    function abrir(si) {
      caj.classList.toggle("abierto", si); caj.setAttribute("aria-hidden", si ? "false" : "true");
      btn.setAttribute("aria-expanded", si ? "true" : "false"); bloquear(si);
      if (si) { var c = $(".cerrar", caj); if (c) c.focus(); } else btn.focus();
    }
    btn.addEventListener("click", function () { abrir(true); });
    $$("[data-cerrar-cajon]", caj).forEach(function (b) { b.addEventListener("click", function () { abrir(false); }); });
    d.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && caj.classList.contains("abierto")) abrir(false); });
  });

  /* Videos que cargan al acercarse */
  function cargarVideo(v, ruta) {
    if (QUIETO || AHORRO || v.getAttribute("src")) return;
    v.src = ruta || v.getAttribute("data-src");
    v.addEventListener("playing", function () { v.classList.add("listo"); }, { once: true });
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }
  seguro(function () {
    var pv = $("[data-portada-video]");
    if (pv) cargarVideo(pv, PC() ? pv.getAttribute("data-pc") : pv.getAttribute("data-movil"));
    var vids = $$("video[data-src]");
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { if (!v.getAttribute("src")) cargarVideo(v); else if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (!v.paused) v.pause();
      });
    }, { rootMargin: "300px 0px" });
    vids.forEach(function (v) { io.observe(v); });
  });

  /* Hojas doradas que se dibujan una vez */
  seguro(function () {
    var hs = $$(".hojas.dibujar");
    if (!("IntersectionObserver" in window) || QUIETO) { hs.forEach(function (h) { h.classList.add("visto"); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("visto"); io.unobserve(en.target); } });
    }, { threshold: .6 });
    hs.forEach(function (h) { io.observe(h); });
  });

  /* Contadores + y − */
  function valorDe(c) { return parseInt($("output", c).getAttribute("data-v") || $("output", c).textContent, 10) || 0; }
  function poner(c, n) {
    var min = parseInt(c.getAttribute("data-min") || "0", 10); n = Math.max(min, n);
    var o = $("output", c); o.setAttribute("data-v", n);
    o.textContent = (n === 0 && c.hasAttribute("data-cero")) ? c.getAttribute("data-cero") : n;
    c.dispatchEvent(new CustomEvent("cambio", { bubbles: true }));
  }
  seguro(function () {
    $$("[data-contador]").forEach(function (c) {
      poner(c, valorDe(c));
      $("[data-menos]", c).addEventListener("click", function () { poner(c, valorDe(c) - 1); });
      $("[data-mas]", c).addEventListener("click", function () { poner(c, valorDe(c) + 1); });
    });
  });

  /* Hojas (cotizador y filtros) */
  var ultimoFoco = null;
  function abrirHoja(h, si) {
    if (!h) return;
    if (si) ultimoFoco = d.activeElement;
    h.classList.toggle("abierta", si); h.setAttribute("aria-hidden", si ? "false" : "true"); bloquear(si);
    if (si) { var c = $(".cerrar", h); setTimeout(function () { if (c) c.focus(); }, 60); }
    else if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
    h.dispatchEvent(new CustomEvent(si ? "abierta" : "cerrada"));
  }
  seguro(function () {
    $$(".hoja").forEach(function (h) {
      $$("[data-cerrar-hoja]", h).forEach(function (b) { b.addEventListener("click", function () { abrirHoja(h, false); }); });
    });
    d.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      $$(".hoja.abierta").forEach(function (h) { abrirHoja(h, false); });
    });
  });

  /* Cotizador */
  var HOY = (function () { var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); return t.toISOString().slice(0, 10); })();
  function sumarDia(iso, n) { var t = new Date(iso + "T12:00:00"); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); }
  function fechaLarga(iso) {
    try { return new Date(iso + "T12:00:00").toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return iso; }
  }
  function hab(id) { return (DATOS.habs || []).filter(function (h) { return h.id === id; })[0]; }
  function comidaNombre(id) { var c = (DATOS.comidas || []).filter(function (x) { return x.id === id; })[0]; return c ? c.nombre : id; }
  var NOMBRES = { hospedaje: "Hospedaje", fullday: "Full Day", fullnight: "Full Night", evento: "Evento", temporada: "Plan de temporada", excursion: "Excursión", campamento: "Campamento", membresia: "Membresía corporativa" };
  var NINOS = " · niños de 3 a 8 años, 50 %";

  function Cotizador(f) {
    var self = this; this.f = f; this.que = "";
    this.el = function (n) { return f.elements[n]; };
    $$("[data-que]", f).forEach(function (b) { b.addEventListener("click", function () { self.elegir(b.getAttribute("data-que")); }); });
    ["llegada", "salida", "fecha"].forEach(function (n) { var x = self.el(n); if (x) x.min = HOY; });
    f.addEventListener("change", function () { self.pintar(); });
    f.addEventListener("input", function () { self.pintar(); });
    f.addEventListener("cambio", function () { self.pintar(); });
    f.addEventListener("submit", function (ev) { ev.preventDefault(); self.enviar(); });
  }
  Cotizador.prototype.elegir = function (q) {
    this.que = q;
    $$("[data-que]", this.f).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-que") === q ? "true" : "false"); });
    var conFecha = ["fullday", "fullnight", "evento", "excursion", "campamento"].indexOf(q) > -1;
    $$("[data-g]", this.f).forEach(function (g) { var k = g.getAttribute("data-g"); g.hidden = !(k === q || (k === "fecha" && conFecha)); });
    $("[data-aviso]", this.f).textContent = "";
    this.pintar();
  };
  Cotizador.prototype.preset = function (txt) {
    var p = new URLSearchParams(txt || ""), self = this;
    p.forEach(function (v, k) { if (k !== "que") { var x = self.el(k); if (x) x.value = v; } });
    if (p.get("que")) this.elegir(p.get("que")); else this.pintar();
  };
  Cotizador.prototype.cuenta = function (n) { var c = $('output[name="' + n + '"]', this.f); return c ? (parseInt(c.getAttribute("data-v") || c.textContent, 10) || 0) : 0; };
  Cotizador.prototype.noches = function () {
    var a = this.el("llegada").value, b = this.el("salida").value;
    if (!a || !b) return 0;
    return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
  };
  Cotizador.prototype.referencia = function () {
    var q = this.que, D = DATOS, x;
    if (D.mostrar === false && q) return "💬 Consulte la tarifa";
    if (q === "hospedaje") {
      var h = hab(this.el("hab").value), c = this.el("comida").value; if (!h) return "";
      if (c === "todo-incluido") return h.ti ? fmt(h.ti) + " por 3 días y 2 noches · " + h.nombre + NINOS : "El todo incluido es para habitaciones de 2 a 4 personas. Le enviamos la tarifa de grupo.";
      if (h.grupo) return c === "solo" ? fmt(h.alquiler) + " por noche, alquiler con cocina (mínimo 50 personas y 2 noches)" : fmt(h.grupo[c]) + " por noche el dormitorio, tarifa de grupo (mínimo 50 personas)";
      return fmt(h.tarifas[c]) + " por noche · " + h.nombre + ", " + comidaNombre(c).toLowerCase() + (c !== "solo" ? NINOS : "");
    }
    if (q === "fullday") { x = (D.fd || []).filter(function (p) { return p.id === this.el("fd").value; }, this)[0]; return x ? fmt(x.precio) + " por adulto · " + x.nombre + NINOS : ""; }
    if (q === "fullnight") return fmt(D.fn) + " por adulto · entrada, cena y ambiente musical";
    if (q === "evento") {
      var t = this.el("tipo_ev").value;
      if (t === "Boda" || t === "15 años") return "Plan de bodas y 15 años: " + fmt(D.bodas) + " para 60 personas";
      if (t === "Evento corporativo" || t === "Taller o congreso") return "Promoción salón: " + fmt(D.salon) + " por participante (25 a 50 personas)";
      return "Le enviamos la propuesta según su evento y el número de invitados.";
    }
    if (q === "temporada") {
      x = (D.temps || []).filter(function (p) { return p.id === this.el("temp").value; }, this)[0];
      if (!x) return "Elija la temporada para ver su tarifa.";
      var f0 = x.filas[0];
      return f0.length > 2 ? "Desde " + fmt(f0[1]) + " por 3D/2N en habitación doble · noche adicional " + fmt(f0[2]) + " por persona" : fmt(f0[1]) + " por persona · " + x.nombre;
    }
    if (q === "excursion") return fmt(D.exc.precio) + " por persona, al destino de su preferencia";
    if (q === "campamento") { x = (D.camp || []).filter(function (p) { return p.id === this.el("camp").value; }, this)[0]; return x ? (x.desde ? "Desde " : "") + fmt(x.precio) + " por persona · " + x.nombre : ""; }
    if (q === "membresia") return "Le enviamos por WhatsApp las condiciones de la membresía corporativa";
    return "";
  };
  Cotizador.prototype.pintar = function () {
    var f = this.f, s = this.el("salida"), l = this.el("llegada");
    if (l && s) {
      s.min = l.value ? sumarDia(l.value, 1) : HOY;
      if (l.value && s.value && s.value <= l.value) s.value = sumarDia(l.value, 1);
      var n = this.noches(), out = $(".cot-noches", f);
      if (out) out.textContent = n > 0 ? "🌙 " + n + (n === 1 ? " noche" : " noches") : "";
    }
    $("[data-ref]", f).textContent = this.referencia() || "Elija qué desea para ver la tarifa de referencia.";
  };
  Cotizador.prototype.falta = function () {
    var q = this.que;
    if (!q) return "Elija qué desea: hospedaje, Full Day, evento u otro plan.";
    if (q === "hospedaje" && (!this.el("llegada").value || !this.el("salida").value)) return "Indíquenos la fecha de llegada y la de salida, por favor.";
    if (q === "evento" && !this.el("tipo_ev").value) return "Díganos qué tipo de evento es, por favor.";
    if ((q === "fullday" || q === "fullnight" || q === "evento") && !this.el("fecha").value) return "Falta la fecha: ¿qué día nos visita?";
    if (q === "temporada" && !this.el("temp").value) return "Elija el plan de temporada, por favor.";
    if (q === "excursion" && !this.el("destino").value) return "Elija el destino de la excursión, por favor.";
    return "";
  };
  Cotizador.prototype.mensaje = function () {
    var q = this.que, L = [(DATOS.saludo || "Hola Mansión La Faraona, quiero información") + "."], sel = function (x) { return x.options[x.selectedIndex].text; };
    L.push("Me interesa: " + NOMBRES[q]);
    if (q === "hospedaje") {
      L.push("Habitación: " + sel(this.el("hab")));
      L.push("Plan de comidas: " + sel(this.el("comida")));
      L.push("Llegada: " + fechaLarga(this.el("llegada").value));
      var n = this.noches();
      L.push("Salida: " + fechaLarga(this.el("salida").value) + " (" + n + (n === 1 ? " noche)" : " noches)"));
    }
    if (q === "fullday") L.push("Plan: " + sel(this.el("fd")));
    if (q === "evento") { L.push("Tipo de evento: " + this.el("tipo_ev").value); L.push("Invitados: " + this.cuenta("invitados")); }
    if (q === "temporada") L.push("Plan: " + sel(this.el("temp")));
    if (q === "excursion") L.push("Destino: " + this.el("destino").value);
    if (q === "campamento") L.push("Plan: " + sel(this.el("camp")));
    var fe = this.el("fecha");
    if (["fullday", "fullnight", "evento", "excursion", "campamento"].indexOf(q) > -1 && fe.value) L.push("Fecha: " + fechaLarga(fe.value));
    L.push("Adultos: " + this.cuenta("adultos"));
    var ni = this.cuenta("ninos"); if (ni) L.push("Niños de 3 a 8 años: " + ni);
    var r = this.referencia(); if (r && q !== "membresia") L.push("Tarifa de referencia: " + r);
    var nota = this.el("nota").value.trim(); if (nota) L.push("Nota: " + nota);
    L.push("¿Me confirman la disponibilidad y el total, por favor?");
    return L.join("\n");
  };
  Cotizador.prototype.enviar = function () {
    var av = $("[data-aviso]", this.f), m = this.falta();
    av.textContent = m;
    if (m) { var b = $("button[type=submit]", this.f); if (b && b.animate && !QUIETO) b.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 300 }); return; }
    window.open(waUrl(this.mensaje()), "_blank", "noopener");
  };

  var cotHoja = null;
  seguro(function () {
    $$("[data-cotizador]").forEach(function (f) {
      var c = new Cotizador(f); f._cot = c;
      var caja = f.closest("[data-preset]");
      if (caja) c.preset(caja.getAttribute("data-preset"));
      if (f.closest("#hoja-cot")) cotHoja = c;
    });
    d.addEventListener("click", function (ev) {
      var a = ev.target.closest("[data-cot]");
      if (!a || !cotHoja) return;
      ev.preventDefault();
      cotHoja.f.reset();
      $$("[data-contador]", cotHoja.f).forEach(function (c) { var o = $("output", c); poner(c, parseInt(o.defaultValue || o.getAttribute("data-inicial") || (o.name === "adultos" ? 2 : o.name === "invitados" ? 60 : 0), 10)); });
      cotHoja.que = ""; $$("[data-que]", cotHoja.f).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      $$("[data-g]", cotHoja.f).forEach(function (g) { g.hidden = true; });
      cotHoja.preset(a.getAttribute("data-cot"));
      abrirHoja($("#hoja-cot"), true);
    });
  });

  /* Buscador rápido del inicio */
  seguro(function () {
    var f = $("[data-buscador]"); if (!f) return;
    var que = "hospedaje";
    $$("[data-busca]", f).forEach(function (b) {
      b.addEventListener("click", function () { que = b.getAttribute("data-busca"); $$("[data-busca]", f).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); });
    });
    var fe = $("input[type=date]", f); if (fe) fe.min = HOY;
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var o = $('output[name="personas"]', f), n = o ? (o.getAttribute("data-v") || o.textContent) : "";
      var q = new URLSearchParams(); if (n) q.set("personas", n); if (fe && fe.value) q.set("fecha", fe.value);
      var dest = { hospedaje: "hospedaje.html", fullday: "planes.html", evento: "eventos.html", temporada: "temporadas.html" }[que];
      if (que === "fullday") q.set("tipo", "fullday");
      location.href = dest + (q.toString() ? "?" + q.toString() : "");
    });
  });

  /* Filtros del catálogo de planes */
  seguro(function () {
    var cat = $("[data-catalogo]"); if (!cat) return;
    var filtros = $("[data-filtros]"), panel = $(".panel-filtros"), movil = $("[data-filtros-movil]"), hoja = $("#hoja-filtros");
    var tarjetas = $$(".plan-t", cat), cuenta = $("[data-cuenta]"), vacio = $("[data-vacio]"), rejilla = $("[data-rejilla]");
    var st = { tipo: "", personas: 0, comidas: false };
    var u = new URLSearchParams(location.search);
    st.tipo = u.get("tipo") || ""; st.personas = parseInt(u.get("personas") || "0", 10) || 0; st.comidas = u.get("comidas") === "1";
    var cont = $("[data-contador]", filtros); if (cont) { cont.setAttribute("data-cero", "Cualquiera"); poner(cont, st.personas); }
    var chk = $("[data-f-comidas]", filtros); chk.checked = st.comidas;
    function aplicar(animar) {
      var n = 0, i = 0;
      tarjetas.forEach(function (t) {
        var ok = (!st.tipo || t.getAttribute("data-tipo") === st.tipo) && (!st.comidas || t.getAttribute("data-comidas") === "1") &&
          (!st.personas || (st.personas >= +t.getAttribute("data-pmin") && st.personas <= +t.getAttribute("data-pmax")));
        t.hidden = !ok; if (ok) { n++; t.style.setProperty("--i", i++); }
      });
      $$("[data-f-tipo]", filtros).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-f-tipo") === st.tipo ? "true" : "false"); });
      cuenta.textContent = n === 1 ? "1 plan" : n + " planes";
      vacio.hidden = n > 0;
      var q = new URLSearchParams(); if (st.tipo) q.set("tipo", st.tipo); if (st.personas) q.set("personas", st.personas); if (st.comidas) q.set("comidas", "1");
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
      if (animar && !QUIETO) { rejilla.classList.remove("cascada"); void rejilla.offsetWidth; rejilla.classList.add("cascada"); }
    }
    $$("[data-f-tipo]", filtros).forEach(function (b) { b.addEventListener("click", function () { st.tipo = b.getAttribute("data-f-tipo"); aplicar(true); }); });
    chk.addEventListener("change", function () { st.comidas = chk.checked; aplicar(true); });
    filtros.addEventListener("cambio", function () { st.personas = valorDe(cont); aplicar(true); });
    $$("[data-f-limpiar]").forEach(function (b) { b.addEventListener("click", function () { st = { tipo: "", personas: 0, comidas: false }; chk.checked = false; poner(cont, 0); aplicar(true); }); });
    $("[data-abrir-filtros]").addEventListener("click", function () { movil.appendChild(filtros); abrirHoja(hoja, true); });
    hoja.addEventListener("cerrada", function () { panel.appendChild(filtros); });
    aplicar(true);
  });

  /* Precio que rueda (contador de bomba) */
  function odometro(el, valor) {
    var txt = String(valor), digs = $$(".d", el);
    if (QUIETO || digs.length !== txt.replace(/\D/g, "").length || el.children.length !== txt.length) {
      el.innerHTML = txt.split("").map(function (ch) {
        if (!/\d/.test(ch)) return '<span class="p">' + ch + "</span>";
        var col = ""; for (var k = 0; k < 10; k++) col += "<span>" + k + "</span>";
        return '<span class="d" data-n="0">' + col + "</span>";
      }).join("");
      digs = $$(".d", el);
      void el.offsetWidth;
    }
    var j = 0;
    txt.split("").forEach(function (ch) { if (/\d/.test(ch)) { digs[j].style.transform = "translateY(" + (-ch) + "em)"; j++; } });
    el.setAttribute("aria-label", txt);
  }
  seguro(function () {
    var c = $("[data-comparador]"); if (!c) return;
    var T = JSON.parse(c.getAttribute("data-tarifas")), odo = $("[data-odo]", c);
    var st = { hab: Object.keys(T)[0], com: "desayuno" };
    var nombresCom = {}; $$("[data-c-com]", c).forEach(function (b) { nombresCom[b.getAttribute("data-c-com")] = $("b", b).textContent; });
    function pintar() {
      var h = T[st.hab], v = h[st.com];
      if (DATOS.mostrar === false) odo.textContent = "Consulte"; else odometro(odo, v);
      $("[data-c-que]", c).textContent = h.nombre + " · " + nombresCom[st.com].toLowerCase();
      $("[data-c-inc]", c).textContent = $('[data-c-com="' + st.com + '"]', c).getAttribute("data-inc");
      $("[data-c-btn]", c).setAttribute("data-cot", "que=hospedaje&hab=" + st.hab + "&comida=" + st.com);
      $$("[data-c-hab]", c).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-c-hab") === st.hab ? "true" : "false"); });
      $$("[data-c-com]", c).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-c-com") === st.com ? "true" : "false"); });
    }
    $$("[data-c-hab]", c).forEach(function (b) { b.addEventListener("click", function () { st.hab = b.getAttribute("data-c-hab"); pintar(); }); });
    $$("[data-c-com]", c).forEach(function (b) { b.addEventListener("click", function () { st.com = b.getAttribute("data-c-com"); pintar(); }); });
    pintar();
  });

  /* El día en Faraona: reloj de sol */
  seguro(function () {
    var sec = $("[data-dia]"); if (!sec) return;
    var items = $$(".momento", sec), arco = $("[data-arco]", sec), sol = $("[data-sol]", sec), capas = $$("[data-capa]", sec);
    var pista = $("[data-pista]", sec), horaTxt = $("[data-hora-txt]", sec), pie = $("[data-ventana-pie]", sec);
    var cx = arco ? +arco.getAttribute("data-cx") : 0, cy = arco ? +arco.getAttribute("data-cy") : 0, rx = arco ? +arco.getAttribute("data-rx") : 0, ry = arco ? +arco.getAttribute("data-ry") : 0;
    var activo = -1, pedido = false;
    function medir() { if (pista) sec.style.setProperty("--w", pista.clientWidth + "px"); }
    function actualizar() {
      pedido = false;
      var vh = innerHeight, mitad = vh * .5, i = 0;
      items.forEach(function (it, k) { if (it.getBoundingClientRect().top < mitad) i = k; });
      var a = items[i], b = items[Math.min(i + 1, items.length - 1)];
      var ta = +a.getAttribute("data-t"), tb = +b.getAttribute("data-t");
      var ra = a.getBoundingClientRect().top, rb = b.getBoundingClientRect().top;
      var f = rb > ra ? Math.min(1, Math.max(0, (mitad - ra) / (rb - ra))) : 0;
      var t = ta + (tb - ta) * f;
      sec.style.setProperty("--t", t.toFixed(3));
      var noche = a.hasAttribute("data-noche") || (b.hasAttribute("data-noche") && f > .6);
      var tarde = Math.max(0, (t - .72) / .28); tarde = noche ? 1 : tarde * .35;
      sec.style.setProperty("--tarde", tarde.toFixed(3));
      sec.classList.toggle("noche", noche);
      if (sol) {
        var th = Math.PI + Math.PI * Math.min(1, t) + (noche ? .5 : 0);
        sol.style.transform = "translate(" + (cx + rx * Math.cos(th)).toFixed(1) + "px," + (cy + ry * Math.sin(th)).toFixed(1) + "px)";
        sol.style.opacity = noche ? "0" : "1";
      }
      if (i !== activo) {
        activo = i;
        items.forEach(function (it, k) { it.classList.toggle("activo", k === i); });
        capas.forEach(function (c) { c.classList.toggle("on", +c.getAttribute("data-capa") === i); });
        var vc = capas[i] && $("video", capas[i]); if (vc && PC()) cargarVideo(vc);
        if (horaTxt) horaTxt.textContent = a.getAttribute("data-hora");
        if (pie) pie.textContent = $("h3", a).textContent;
      }
    }
    function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(actualizar); } }
    medir(); actualizar();
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", function () { medir(); pedir(); });
  });

  /* Franja de instalaciones */
  seguro(function () {
    var s = $("[data-franja]"); if (!s) return;
    var p = $("[data-franja-pista]", s);
    var paso = function () { var t = p.firstElementChild; return t ? t.getBoundingClientRect().width + 14 : 300; };
    var a = $("[data-franja-ant]", s), b = $("[data-franja-sig]", s);
    if (a) a.addEventListener("click", function () { p.scrollBy({ left: -paso(), behavior: "smooth" }); });
    if (b) b.addEventListener("click", function () { p.scrollBy({ left: paso(), behavior: "smooth" }); });
    function fijar() {
      if (!window.gsap || !window.ScrollTrigger || QUIETO || !PC()) return;
      gsap.registerPlugin(ScrollTrigger);
      s.classList.add("fijada");
      var dist = function () { return Math.max(0, p.scrollWidth - p.clientWidth + 40); };
      gsap.to(p, { x: function () { return -dist(); }, ease: "none", scrollTrigger: { trigger: s, start: "top top+=" + (parseInt(getComputedStyle(H).getPropertyValue("--cab"), 10) || 76), end: function () { return "+=" + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true } });
    }
    if (d.readyState === "complete") fijar(); else addEventListener("load", fijar);
  });

  /* Mapa aéreo */
  seguro(function () {
    var m = $("[data-mapa]"); if (!m) return;
    var E = JSON.parse(m.getAttribute("data-espacios")), ficha = $("[data-mapa-ficha]", m);
    $$("[data-punto]", m).forEach(function (b, k) {
      if (k === 0) b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-punto"), x = E[id];
        $$("[data-punto]", m).forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        var im = $("img", ficha); im.src = x.foto; im.removeAttribute("srcset"); im.alt = x.nombre;
        $("b", ficha).textContent = x.nombre + (x.cap ? " · " + x.cap : "");
        $("p", ficha).textContent = x.para;
        $("a", ficha).setAttribute("href", "#" + id);
        if (ficha.animate && !QUIETO) ficha.animate([{ opacity: .4, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 350, easing: "ease-out" });
      });
    });
  });

  /* Pestañas de eventos */
  seguro(function () {
    var w = $("[data-pestanas]"); if (!w) return;
    var tabs = $$("[role=tab]", w), linea = $(".linea", w);
    function mover(t) { if (linea) { linea.style.width = "100px"; linea.style.transform = "translateX(" + t.offsetLeft + "px) scaleX(" + (t.offsetWidth / 100) + ")"; } }
    function ir(id, foco) {
      tabs.forEach(function (t) {
        var si = t.getAttribute("aria-controls") === id;
        t.setAttribute("aria-selected", si ? "true" : "false"); t.tabIndex = si ? 0 : -1;
        var p = d.getElementById(t.getAttribute("aria-controls"));
        p.hidden = !si; if (si) { p.classList.remove("entra"); void p.offsetWidth; p.classList.add("entra"); mover(t); if (foco) t.focus(); }
      });
    }
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { ir(t.getAttribute("aria-controls")); history.replaceState(null, "", "#" + t.getAttribute("aria-controls")); });
      t.addEventListener("keydown", function (ev) {
        var n = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        if (n) { ev.preventDefault(); ir(tabs[(k + n + tabs.length) % tabs.length].getAttribute("aria-controls"), true); }
      });
    });
    var h = location.hash.slice(1);
    ir(tabs.some(function (t) { return t.getAttribute("aria-controls") === h; }) ? h : tabs[0].getAttribute("aria-controls"));
    addEventListener("hashchange", function () { var x = location.hash.slice(1); if (d.getElementById(x) && d.getElementById(x).getAttribute("role") === "tabpanel") ir(x); });
    addEventListener("resize", function () { var t = $("[aria-selected=true]", w); if (t) mover(t); });
  });

  /* Galería: filtros */
  seguro(function () {
    var muro = $("[data-muro]"); if (!muro) return;
    $$("[data-g-cat]").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.getAttribute("data-g-cat");
        $$("[data-g-cat]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$("button[data-cat]", muro).forEach(function (it) { it.hidden = !!c && it.getAttribute("data-cat") !== c; });
      });
    });
  });

  /* Visor de fotos y videos */
  seguro(function () {
    var v = $("#visor"); if (!v) return;
    var esc = $("[data-visor-escena]", v), txt = $("[data-visor-txt]", v), cta = $("[data-visor-cuenta]", v);
    var lista = [], i = 0, origen = null;
    function pintar() {
      var it = lista[i];
      esc.innerHTML = "";
      if (it.getAttribute("data-tipo") === "video") {
        var vid = d.createElement("video");
        vid.src = it.getAttribute("data-src"); vid.poster = it.getAttribute("data-poster") || "";
        vid.controls = true; vid.playsInline = true; vid.muted = true; vid.loop = true; vid.autoplay = true; vid.setAttribute("playsinline", "");
        esc.appendChild(vid); var p = vid.play(); if (p && p.catch) p.catch(function () {});
      } else {
        var im = d.createElement("img"); im.src = it.getAttribute("data-src"); im.alt = it.getAttribute("data-alt") || ""; esc.appendChild(im);
      }
      txt.textContent = it.getAttribute("data-alt") || "";
      cta.textContent = (i + 1) + " de " + lista.length;
      $("[data-visor-ant]", v).style.visibility = lista.length > 1 ? "visible" : "hidden";
      $("[data-visor-sig]", v).style.visibility = lista.length > 1 ? "visible" : "hidden";
    }
    function abrir(el) {
      var g = el.getAttribute("data-visor");
      lista = $$('[data-visor="' + g + '"]').filter(function (x) { return !x.hidden && x.offsetParent !== null || x === el; });
      i = Math.max(0, lista.indexOf(el)); origen = el;
      v.classList.add("abierto"); v.setAttribute("aria-hidden", "false"); bloquear(true); pintar();
      $(".cerrar", v).focus();
    }
    function cerrar() { v.classList.remove("abierto"); v.setAttribute("aria-hidden", "true"); esc.innerHTML = ""; bloquear(false); if (origen) origen.focus(); }
    function mover(n) { i = (i + n + lista.length) % lista.length; pintar(); }
    d.addEventListener("click", function (ev) { var el = ev.target.closest("[data-visor]"); if (el && !v.contains(el)) { ev.preventDefault(); abrir(el); } });
    $("[data-cerrar-visor]", v).addEventListener("click", cerrar);
    $("[data-visor-ant]", v).addEventListener("click", function () { mover(-1); });
    $("[data-visor-sig]", v).addEventListener("click", function () { mover(1); });
    d.addEventListener("keydown", function (ev) {
      if (!v.classList.contains("abierto")) return;
      if (ev.key === "Escape") cerrar(); if (ev.key === "ArrowRight") mover(1); if (ev.key === "ArrowLeft") mover(-1);
    });
    var x0 = null;
    esc.addEventListener("pointerdown", function (ev) { x0 = ev.clientX; });
    esc.addEventListener("pointerup", function (ev) { if (x0 === null) return; var dx = ev.clientX - x0; x0 = null; if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1); });
  });

  /* Inclinación 3D leve en computadora */
  seguro(function () {
    if (QUIETO || !(window.matchMedia && matchMedia("(hover: hover) and (min-width: 1080px)").matches)) return;
    $$(".inclina").forEach(function (c) {
      c.addEventListener("pointermove", function (ev) {
        var r = c.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - .5, y = (ev.clientY - r.top) / r.height - .5;
        c.style.setProperty("--ry", (x * 5).toFixed(2) + "deg"); c.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
      });
      c.addEventListener("pointerleave", function () { c.style.setProperty("--ry", "0deg"); c.style.setProperty("--rx", "0deg"); });
    });
  });
})();
