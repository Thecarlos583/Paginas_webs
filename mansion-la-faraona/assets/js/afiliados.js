/* Mansión La Faraona · portal de afiliados (DEMOSTRACIÓN).
   Lee datos/afiliados.json (o la copia incrustada si se abre con doble clic) y guarda la sesión
   en este navegador. Los números los hace afiliados-calculo.js.
   Generado desde contexto-claude-code/_generadores/faraona_afiliados.js */
(function () {
  "use strict";
  var d = document, C = window.FaraonaCalculo;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  function seguro(f) { try { f(); } catch (err) { if (window.console) console.warn("[Portal]", err); } }
  var portal = $("[data-portal]");
  if (!portal || !C) return;

  var CLAVE = "faraona-portal-demo";
  var QUIETO = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "584142516392";
  seguro(function () { var s = $("#datos-cot"); if (s) WA = JSON.parse(s.textContent).wa || WA; });
  var HOY = (function () { var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); return t.toISOString().slice(0, 10); })();
  function sumar(iso, n) { var t = new Date(iso + "T12:00:00"); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function waUrl(t) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); }
  var $m = C.dinero;

  var DATOS = null, AF = null, R = null;

  /* ---------- Datos: el archivo JSON; si no se puede leer, la copia incrustada ---------- */
  function incrustado() { var s = $("#afiliados-datos"); return s ? JSON.parse(s.textContent) : { afiliados: [], reglas: {} }; }
  function cargar(listo) {
    if (/^https?:$/.test(location.protocol) && window.fetch) {
      fetch("datos/afiliados.json", { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(listo, function () { listo(incrustado()); });
    } else listo(incrustado());
  }

  /* ---------- Entrada ---------- */
  var form = $("[data-entrar]"), aviso = $("[data-entrar-aviso]"), carnet = $("[data-carnet]");
  function mostrar(dentro) {
    $$("[data-fuera]").forEach(function (x) { x.hidden = dentro; });
    $$("[data-dentro]").forEach(function (x) { x.hidden = !dentro; });
    var frente = $(".cara--frente"), dorso = $("[data-dorso]");
    carnet.classList.toggle("volteado", dentro);
    dorso.setAttribute("aria-hidden", dentro ? "false" : "true");
    frente.setAttribute("aria-hidden", dentro ? "true" : "false");
    if ("inert" in frente) frente.inert = dentro;
  }
  function entrar(a, animar) {
    AF = a;
    try { localStorage.setItem(CLAVE, JSON.stringify({ c: a.codigo, d: a.documento })); } catch (e) {}
    if (!animar || QUIETO) carnet.classList.add("sin-giro");
    pintarPanel(); prepararCot(); mostrar(true);
    setTimeout(function () { carnet.classList.remove("sin-giro"); }, 50);
    if (animar) { var h = $("[data-a-nombre]"); h.setAttribute("tabindex", "-1"); setTimeout(function () { h.focus({ preventScroll: true }); }, QUIETO ? 0 : 700); }
  }
  function salir() {
    AF = null;
    try { localStorage.removeItem(CLAVE); } catch (e) {}
    form.reset(); aviso.textContent = "";
    mostrar(false);
    window.scrollTo({ top: 0, behavior: QUIETO ? "auto" : "smooth" });
    setTimeout(function () { form.elements.codigo.focus({ preventScroll: true }); }, QUIETO ? 0 : 700);
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var c = form.elements.codigo.value, doc = form.elements.documento.value;
    if (!c.trim() || !doc.trim()) { aviso.textContent = "Escriba su código de afiliado y su cédula o RIF."; return; }
    var a = C.buscar(DATOS.afiliados, c, doc);
    if (!a) { aviso.textContent = "No encontramos un afiliado con ese código y esa cédula o RIF. Revise los datos o escríbanos por WhatsApp."; return; }
    aviso.textContent = ""; entrar(a, true);
  });
  $$("[data-prueba]").forEach(function (b) {
    b.addEventListener("click", function () {
      form.elements.codigo.value = b.getAttribute("data-prueba");
      form.elements.documento.value = b.getAttribute("data-doc");
      aviso.textContent = "";
      form.querySelector("[type=submit]").focus();
      if (window.innerWidth < 900) carnet.scrollIntoView({ behavior: QUIETO ? "auto" : "smooth", block: "center" });
    });
  });
  $("[data-salir]").addEventListener("click", salir);

  /* ---------- Panel ---------- */
  function pintarPanel() {
    var v = C.vigencia(AF, HOY);
    $("[data-a-tipo]").textContent = AF.tipo_nombre + " afiliada desde el " + C.fecha(AF.compra);
    if (AF.tipo === "persona") $("[data-a-tipo]").textContent = "Afiliado desde el " + C.fecha(AF.compra);
    $("[data-c-tipo]").textContent = AF.tipo_nombre;
    $("[data-c-nombre]").textContent = AF.nombre;
    $("[data-c-codigo]").textContent = AF.codigo;
    $("[data-c-compra]").textContent = C.fechaCorta(AF.compra);
    $("[data-c-vence]").textContent = C.fechaCorta(AF.vence);
    $("[data-c-dias]").textContent = v.vencida ? "Membresía vencida" : (v.quedan === 1 ? "Le queda 1 día de vigencia" : "Le quedan " + v.quedan + " días de vigencia");
    $("[data-c-linea]").style.transform = "scaleX(" + (1 - v.usados).toFixed(3) + ")";
    var sal = C.saldo(AF);
    $("[data-a-saldo]").textContent = $m(sal);
    $("[data-a-pagado]").textContent = "de " + $m(C.cent(AF.pagado)) + " que pagó";
    barras(0);
    var cons = AF.consumos || [];
    $("[data-consumos]").innerHTML = cons.length ? cons.map(function (x) {
      return '<li><time datetime="' + esc(x.fecha) + '">' + esc(C.fecha(x.fecha)) + '</time><span>' + esc(x.detalle) + '</span><b>' + esc($m(C.cent(x.monto))) + '</b></li>';
    }).join("") + '<li class="total"><span>Total consumido</span><b>' + esc($m(C.consumido(AF))) + '</b></li>'
      : '<li class="vacio">Todavía no tiene consumos. Su saldo completo está disponible.</li>';
    $("[data-p-intro]").textContent = "Copia del catálogo del " + C.fecha(AF.compra) + ". Se mantienen hasta el " + C.fecha(AF.vence) + ", aunque la tarifa cambie. Ya tienen su descuento aplicado.";
    pintarPrecios();
  }

  function barras(previo) {
    var pag = C.cent(AF.pagado) || 1, usado = C.consumido(AF);
    $$("[data-barra]").forEach(function (b) {
      $(".usado", b).style.width = (100 * Math.min(1, usado / pag)).toFixed(2) + "%";
      $(".previo", b).style.width = (100 * Math.min(1, previo / pag)).toFixed(2) + "%";
      b.setAttribute("aria-label", "Consumido " + $m(usado) + (previo ? ", esta cotización usaría " + $m(previo) : "") + ", disponible " + $m(C.saldo(AF) - previo) + " de " + $m(pag));
    });
  }

  function fila(nombre, detalle, precio, cat) {
    var pct = C.pctDe(R, cat), x = C.conDescuento(precio, pct);
    return '<li><div><b>' + esc(nombre) + '</b>' + (detalle ? '<small>' + esc(detalle) + '</small>' : '') + '</div>' +
      '<span class="pp-precio">' + (pct ? '<s aria-label="Precio normal">' + esc($m(x.normal)) + '</s>' : '') + '<strong>' + esc($m(x.final)) + '</strong></span>' +
      (pct ? '<em class="pp-pct">' + pct + ' %</em>' : '<em class="pp-pct pp-pct--no">Sin descuento</em>') + '</li>';
  }
  function pintarPrecios() {
    var P = AF.precios, CH = R.comidas_hospedaje || {};
    $('[data-pp="alojamiento"]').innerHTML = P.alojamiento.map(function (h) {
      var extras = Object.keys(h.comidas || {}).map(function (k) {
        var x = C.conDescuento(h.comidas[k], C.pctDe(R, "comida"));
        return '<span><i>' + esc((CH[k] || k).replace(/^Con /, "").replace(/^./, function (z) { return z.toUpperCase(); })) + '</i><span><s>' + esc($m(x.normal)) + '</s> ' + esc($m(x.final)) + '</span></span>';
      }).join("");
      return fila(h.nombre, "Por noche, hasta " + h.capacidad + " personas", h.noche, "alojamiento").replace("</li>",
        '<div class="pp-sub"><b>Comidas por noche, ' + C.pctDe(R, "comida") + ' % menos</b>' + extras + '</div></li>');
    }).join("");
    $('[data-pp="entradas"]').innerHTML = P.entradas.map(function (f) { return fila(f.nombre, "Por adulto. " + f.detalle, f.precio, f.cat); }).join("");
    $('[data-pp="salones"]').innerHTML = P.salones.map(function (s) {
      var det = s.por === "evento" ? s.detalle : (s.capacidad ? "Por persona. " + s.detalle + " Capacidad " + s.capacidad + "." : s.detalle);
      return fila(s.nombre + (s.horas ? ", " + s.horas + " horas" : ""), det, s.precio, s.cat);
    }).join("");
    $('[data-pp="comida"]').innerHTML = P.comida.map(function (c) { return fila(c.nombre, c.detalle || c.grupo, c.precio, c.cat); }).join("");
  }

  /* Pestañas de precios */
  seguro(function () {
    var w = $("[data-pp-tabs]"); if (!w) return;
    var tabs = $$("[role=tab]", w);
    function ir(t, foco) {
      tabs.forEach(function (x) {
        var si = x === t; x.setAttribute("aria-selected", si ? "true" : "false"); x.tabIndex = si ? 0 : -1;
        d.getElementById(x.getAttribute("aria-controls")).hidden = !si;
      });
      if (foco) t.focus();
    }
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { ir(t); });
      t.addEventListener("keydown", function (ev) {
        var n = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        if (n) { ev.preventDefault(); ir(tabs[(k + n + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* ---------- Contadores ---------- */
  function valor(c) { return parseInt($("output", c).getAttribute("data-v") || $("output", c).textContent, 10) || 0; }
  function poner(c, n) {
    var min = parseInt(c.getAttribute("data-min") || "0", 10), max = parseInt(c.getAttribute("data-max") || "999", 10);
    n = Math.min(max, Math.max(min, n));
    var o = $("output", c); o.setAttribute("data-v", n); o.textContent = n;
    $("[data-menos]", c).disabled = n <= min; $("[data-mas]", c).disabled = n >= max;
    c.dispatchEvent(new CustomEvent("cambio", { bubbles: true }));
  }
  function contadores(raiz) {
    $$("[data-ct]", raiz).forEach(function (c) {
      if (c._listo) return; c._listo = true;
      $("[data-menos]", c).addEventListener("click", function () { poner(c, valor(c) - 1); });
      $("[data-mas]", c).addEventListener("click", function () { poner(c, valor(c) + 1); });
      poner(c, valor(c));
    });
  }
  function cuenta(f, n) { var o = $('output[name="' + n + '"]', f); return o ? (parseInt(o.getAttribute("data-v") || o.textContent, 10) || 0) : 0; }

  /* ---------- Cotizador ---------- */
  var cf = $("[data-af-form]"), preparado = false;
  function opciones(sel, lista) { sel.innerHTML = lista.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join(""); }
  function prepararCot() {
    var P = AF.precios, CH = R.comidas_hospedaje || {}, pa = C.pctDe(R, "alojamiento");
    var hab = cf.elements.hab.value, plan = cf.elements.plan.value, sal = cf.elements.salon.value;
    opciones(cf.elements.hab, P.alojamiento.map(function (h) { return [h.id, h.nombre.replace(/^Habitación /, "").replace(/^./, function (x) { return x.toUpperCase(); }) + ", hasta " + h.capacidad + " · " + $m(C.conDescuento(h.noche, pa).final)]; }));
    opciones(cf.elements.comida, Object.keys(CH).map(function (k) { return [k, CH[k]]; }));
    opciones(cf.elements.plan, P.entradas.map(function (f) { return [f.id, f.nombre + " · " + $m(C.conDescuento(f.precio, C.pctDe(R, f.cat)).final)]; }));
    cf.elements.salon.innerHTML = '<optgroup label="Espacios, ' + C.pctDe(R, "salones") + ' % menos">' +
      P.salones.filter(function (s) { return s.cat === "salones"; }).map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.nombre + ", " + s.horas + " h · " + $m(C.conDescuento(s.precio, C.pctDe(R, s.cat)).final) + " por persona") + '</option>'; }).join("") +
      '</optgroup><optgroup label="Planes de evento, ' + C.pctDe(R, "planes") + ' % menos">' +
      P.salones.filter(function (s) { return s.cat !== "salones"; }).map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.nombre) + '</option>'; }).join("") + "</optgroup>";
    var pc = C.pctDe(R, "comida"), grupos = {};
    P.comida.forEach(function (c) { (grupos[c.grupo || "Comida"] = grupos[c.grupo || "Comida"] || []).push(c); });
    $("[data-carta]").innerHTML = Object.keys(grupos).map(function (g) {
      return '<div class="af-carta-g"><h4>' + esc(g) + '</h4>' + grupos[g].map(function (c) {
        var x = C.conDescuento(c.precio, pc), id = "af-c-" + c.id;
        return '<div class="af-item"><span id="' + id + '"><b>' + esc(c.nombre) + '</b><small><s>' + esc($m(x.normal)) + '</s> ' + esc($m(x.final)) + '</small></span>' +
          '<div class="contador contador--mini" data-ct data-min="0" data-max="200" data-item="' + esc(c.id) + '"><button type="button" data-menos aria-label="Menos: ' + esc(c.nombre) + '">−</button><output aria-labelledby="' + id + '" aria-live="polite">0</output><button type="button" data-mas aria-label="Más: ' + esc(c.nombre) + '">+</button></div></div>';
      }).join("") + "</div>";
    }).join("");
    contadores(cf);
    if (hab) cf.elements.hab.value = hab;
    if (plan) cf.elements.plan.value = plan;
    if (sal) cf.elements.salon.value = sal;
    if (!preparado) {
      preparado = true;
      cf.elements.desde.min = HOY; cf.elements.hasta.min = HOY;
      var t = new Date(HOY + "T12:00:00"), sab = (6 - t.getDay() + 7) % 7 || 7;
      cf.elements.desde.value = sumar(HOY, sab + 7); cf.elements.hasta.value = sumar(HOY, sab + 9);
      cf.elements.comida.value = "desayuno";
    }
    pintarCot();
  }

  function elegidos() { return $$("[data-necesita]", cf).filter(function (b) { return b.getAttribute("aria-pressed") === "true"; }).map(function (b) { return b.getAttribute("data-necesita"); }); }
  function pedido() {
    var q = elegidos(), el = cf.elements;
    var p = { desde: el.desde.value, hasta: el.hasta.value || el.desde.value, adultos: cuenta(cf, "adultos"), ninos: cuenta(cf, "ninos"), nota: el.nota.value };
    if (q.indexOf("estadia") >= 0) p.estadia = { hab: el.hab.value, cantidad: cuenta(cf, "cantidad"), comida: el.comida.value };
    if (q.indexOf("fullday") >= 0) p.fullday = { plan: el.plan.value, dias: cuenta(cf, "dias_fd") };
    if (q.indexOf("salon") >= 0) p.salon = { id: el.salon.value, dias: cuenta(cf, "dias_salon") };
    if (q.indexOf("comida") >= 0) p.comida = $$("[data-item]", cf).map(function (c) { return { id: c.getAttribute("data-item"), cant: valor(c) }; });
    return p;
  }

  var ULTIMO = null;
  function pintarCot() {
    if (!AF) return;
    var q = elegidos();
    $$("[data-g]", cf).forEach(function (g) { g.hidden = q.indexOf(g.getAttribute("data-g")) < 0; });
    var el = cf.elements;
    if (el.desde.value) el.hasta.min = el.desde.value;
    if (el.desde.value && el.hasta.value && el.hasta.value < el.desde.value) el.hasta.value = el.desde.value;
    var sal = (AF.precios.salones || []).filter(function (x) { return x.id === el.salon.value; })[0];
    $("[data-salon-nota]").textContent = !sal ? "" : sal.por === "evento" ? sal.detalle + "." : (sal.minimo > 1 ? "Se cobra por persona, con un mínimo de " + sal.minimo + " personas. " : "") + (sal.detalle || "");
    var p = pedido(), r = C.cotizar(AF, R, p, HOY);
    ULTIMO = { p: p, r: r };
    $("[data-rango]").textContent = C.valida(p.desde) ? C.rangoTexto(p, r).replace(/^./, function (x) { return x.toUpperCase(); }) : "";
    $("[data-lineas]").innerHTML = r.lineas.length ? r.lineas.map(function (l) {
      return '<li><div><b>' + esc(l.que) + '</b><small>' + esc(l.detalle) + (l.saldo ? " · se paga con su saldo" : "") + '</small></div><span>' +
        (l.pct ? '<s>' + esc($m(l.normal)) + '</s>' : '') + '<strong>' + esc($m(l.total)) + '</strong>' + (l.pct ? '<em>' + l.pct + ' %</em>' : '') + '</span></li>';
    }).join("") : '<li class="vacio">Elija lo que necesita y las fechas para ver el total.</li>';
    $("[data-t-normal]").textContent = $m(r.normal);
    $("[data-t-total]").textContent = $m(r.total);
    $("[data-t-ahorro]").textContent = $m(r.ahorro);
    $("[data-t-saldo]").textContent = (r.cubierto ? "-" : "") + $m(r.cubierto);
    $("[data-t-pagar]").textContent = $m(r.porPagar);
    $("[data-f-pagar]").textContent = $m(r.porPagar);
    $("[data-f-total]").textContent = r.lineas.length ? "Total " + $m(r.total) + ", ahorra " + $m(r.ahorro) : "Elija lo que necesita";
    $("[data-t-queda]").textContent = r.cubierto ? "Le quedaría " + $m(r.saldoDespues) + " de saldo." : (r.saldo ? "Esta cotización no usa su saldo (cubre entradas y habitaciones)." : "Su saldo ya se consumió: le quedan sus descuentos.");
    $(".af-porpagar", d).classList.toggle("cero", r.lineas.length > 0 && r.porPagar === 0);
    barras(r.cubierto);
    $("[data-af-aviso]").textContent = r.avisos.join(" ");
    var btn = $("[data-af-wa]");
    var listo = r.lineas.length > 0 && C.valida(p.desde);
    btn.href = listo ? waUrl(C.mensaje(AF, R, p, r)) : waUrl("Hola Mansión La Faraona, soy afiliado (" + AF.codigo + ") y quiero una cotización.");
    btn.setAttribute("aria-disabled", listo ? "false" : "true");
  }

  seguro(function () {
    $$("[data-necesita]", cf).forEach(function (b) {
      b.addEventListener("click", function () {
        b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
        pintarCot();
      });
    });
    cf.addEventListener("input", pintarCot);
    cf.addEventListener("change", pintarCot);
    cf.addEventListener("cambio", pintarCot);
    cf.addEventListener("submit", function (ev) { ev.preventDefault(); });
    $("[data-af-wa]").addEventListener("click", function (ev) {
      if (this.getAttribute("aria-disabled") === "true") {
        ev.preventDefault();
        $("[data-af-aviso]").textContent = ULTIMO && ULTIMO.r.avisos.length ? ULTIMO.r.avisos.join(" ") : "Elija al menos un servicio y la fecha.";
      }
    });
  });

  /* ---------- Arranque ---------- */
  cargar(function (datos) {
    DATOS = datos; R = datos.reglas || {};
    var s = null;
    try { s = JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch (e) {}
    var a = s && C.buscar(DATOS.afiliados, s.c, s.d);
    if (a) entrar(a, false);
    portal.classList.add("listo");
  });
})();
