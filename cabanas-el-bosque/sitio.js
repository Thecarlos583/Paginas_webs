(function () {
  "use strict";
  var quieto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
  var WA = "https://wa.me/580000000000?text=";
  var NOMBRE = "Cabañas El Bosque";
  function safe(fn, nombre) { try { fn(); } catch (e) { console.warn("[" + nombre + "]", e); } }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function vibrar() { if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} } }

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

  /* Onda dibujada: respaldo cuando no hay WebGL */
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

  /* Agua de verdad: un sombreador deforma la foto y sus ondas siguen al dedo */
  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FRAG = [
    "precision mediump float;",
    "uniform sampler2D t;uniform vec2 res;uniform vec2 dib;uniform vec2 ori;uniform float alto;uniform float tiempo;uniform float espejo;uniform float esc;uniform vec3 o[6];",
    "void main(){",
    " vec2 px=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y)/esc;",
    " float prof=clamp(px.y/(res.y/esc),0.,1.);",
    " vec2 d=vec2(0.);",
    " float brillo=0.;",
    " if(espejo>.5){",
    "  float f=.05/(.16+prof);",
    "  d.x=sin(px.y*f*3.+tiempo*1.5)*(1.5+11.*prof)+sin(px.y*f*1.3-tiempo*.9+px.x*.012)*(1.+7.*prof);",
    "  d.y=sin(px.y*f*2.-tiempo*1.1+px.x*.02)*(1.+5.*prof);",
    " }else{",
    "  d=vec2(sin(px.y*.03+tiempo*.8)+sin(px.x*.021-tiempo*.6),cos(px.x*.028+tiempo*.7))*1.6;",
    " }",
    " for(int i=0;i<6;i++){",
    "  float edad=tiempo-o[i].z;",
    "  if(edad<4.&&edad>=0.){",
    "   vec2 v=px-o[i].xy;",
    "   if(espejo>.5)v.y*=2.6;",
    "   float r=length(v)+.001;",
    "   float frente=edad*150.;",
    "   float e=exp(-pow((r-frente)/70.,2.))*exp(-edad*1.1);",
    "   float w=sin((r-frente)*.17)*e;",
    "   d+=v/r*w*13.;",
    "   brillo+=w*.2;",
    "  }",
    " }",
    " vec2 q=px+d;",
    " float y=espejo>.5?alto-q.y:q.y;",
    " vec2 uv=(vec2(q.x,y)-ori)/dib;",
    " vec3 c=texture2D(t,clamp(uv,.002,.998)).rgb;",
    " gl_FragColor=vec4(c+brillo,1.);",
    "}"
  ].join("\n");

  function crearAgua(caja, lienzo) {
    var gl = lienzo.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power", preserveDrawingBuffer: true });
    if (!gl) return null;
    function sh(tipo, txt) { var s = gl.createShader(tipo); gl.shaderSource(s, txt); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr); gl.useProgram(pr);
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ["res", "dib", "ori", "alto", "tiempo", "espejo", "esc", "o"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    var plana = caja.hasAttribute("data-plana");
    var mx = +(caja.getAttribute("data-mx") || 50) / 100, my = +(caja.getAttribute("data-my") || 50) / 100;
    var ondas = new Float32Array(18), siguiente = 0, inicio = performance.now(), visible = false, listo = false, foto = null, pedido = false;
    for (var k = 0; k < 6; k++) ondas[k * 3 + 2] = -99;
    function medir() {
      if (!foto) return;
      var esc = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = lienzo.clientWidth, h = lienzo.clientHeight;
      if (!w || !h) return;
      lienzo.width = Math.round(w * esc); lienzo.height = Math.round(h * esc);
      gl.viewport(0, 0, lienzo.width, lienzo.height);
      var cw = w, ch = h, ox = 0;
      var s = Math.max(cw / foto.width, ch / foto.height);
      var dw = foto.width * s, dh = foto.height * s;
      gl.uniform2f(U.res, lienzo.width, lienzo.height);
      gl.uniform2f(U.dib, dw, dh);
      gl.uniform2f(U.ori, ox + (cw - dw) * mx, (ch - dh) * my);
      gl.uniform1f(U.alto, ch);
      gl.uniform1f(U.espejo, plana ? 0 : 1);
      gl.uniform1f(U.esc, esc);
    }
    function dibujar() {
      gl.uniform1f(U.tiempo, (performance.now() - inicio) / 1000);
      gl.uniform3fv(U.o, ondas);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function pintar() {
      pedido = false;
      if (!listo || !visible || document.hidden) return;
      dibujar();
      if (!quieto) pedir();
    }
    function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(pintar); } }
    var im = new Image();
    im.onload = function () {
      try {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      } catch (e) { return; } /* abierta sin servidor: se queda el respaldo */
      foto = im; listo = true; medir(); dibujar();
      lienzo.classList.add("vivo");
      pedir();
    };
    im.src = caja.getAttribute("data-foto-agua");
    window.addEventListener("resize", function () { if (listo) { medir(); dibujar(); } pedir(); }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) pedir(); }, { rootMargin: "60px" }).observe(caja);
    } else { visible = true; }
    document.addEventListener("visibilitychange", pedir);
    return {
      vivo: function () { return listo; },
      visible: function () { return visible; },
      tocar: function (x, y) {
        var r = siguiente * 3;
        ondas[r] = x; ondas[r + 1] = y; ondas[r + 2] = (performance.now() - inicio) / 1000;
        siguiente = (siguiente + 1) % 6;
        pedir();
      }
    };
  }

  function initAgua() {
    $$("[data-agua]").forEach(function (caja) {
      var lienzo = $(".lienzo", caja), agua = null, ultimo = 0;
      if (lienzo && !window.__sinAgua) { try { agua = crearAgua(caja, lienzo); } catch (e) { console.warn("[agua]", e); } }
      function tocar(ev) {
        var r = caja.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
        if (agua && agua.vivo()) agua.tocar(x, y); else onda(caja, x, y);
      }
      caja.addEventListener("pointerdown", function (ev) {
        if (ev.target.closest("a,button,input,label,select")) return;
        tocar(ev); vibrar();
      });
      caja.addEventListener("pointermove", function (ev) {
        if (!fino && ev.pointerType !== "touch") return;
        var t = Date.now();
        if (t - ultimo < 260) return;
        ultimo = t; tocar(ev);
      });
      if (quieto || !agua) return;
      /* De vez en cuando sube un pez */
      setInterval(function () {
        if (!agua.vivo() || !agua.visible() || document.hidden) return;
        agua.tocar(caja.clientWidth * (.12 + Math.random() * .76), caja.clientHeight * (.1 + Math.random() * .5));
      }, 3800);
    });
  }

  /* Fotos de la portada: se relevan solas si se ven */
  function initRelevo() {
    var caja = $("[data-relevo]");
    if (!caja) return;
    var fotos = $$(".relevo-foto", caja), i = 0, visible = true, flo = $(".flotante");
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (flo) flo.classList.toggle("aparte", en[0].intersectionRatio > .35);
      }, { threshold: [0, .35, .7] }).observe(caja);
    }
    if (quieto || fotos.length < 2) return;
    setTimeout(function () { fotos.forEach(function (f) { f.loading = "eager"; }); }, 2000);
    setInterval(function () {
      if (!visible || document.hidden) return;
      var sig = (i + 1) % fotos.length;
      if (!fotos[sig].complete || !fotos[sig].naturalWidth) return;
      fotos[i].classList.remove("activa"); fotos[sig].classList.add("activa"); i = sig;
    }, 6500);
  }

  /* Temperatura real de la Colonia contra Caracas */
  function initClima() {
    if (!$("[data-chip]") && !$("[data-termo]")) return;
    var datos = null;
    try { var g = JSON.parse(sessionStorage.getItem("elBosqueClima") || "null"); if (g && Date.now() - g.t < 18e5) datos = g.d; } catch (e) {}
    function cielo(c) {
      if (c === 0) return "despejado";
      if (c <= 3) return "con nubes";
      if (c === 45 || c === 48) return "con neblina";
      if (c >= 95) return "con tormenta";
      if (c >= 51) return "con lluvia";
      return "fresco";
    }
    function poner(d) {
      var col = Math.round(d[0].current.temperature_2m), car = Math.round(d[1].current.temperature_2m);
      var min = Math.round(d[0].daily.temperature_2m_min[0]);
      var chip = $("[data-chip]");
      if (chip) chip.textContent = "Ahora en la Colonia: " + col + "° " + cielo(d[0].current.weather_code);
      $$("[data-termo]").forEach(function (t) {
        var dif = car - col;
        if (dif > 0) $("[data-termo-t]", t).textContent = "Hoy hace " + dif + "° menos que en Caracas";
        $("[data-termo-p]", t).textContent = "Por la noche puede bajar a " + min + "°. Traiga abrigo.";
        var b = $("[data-barras]", t);
        b.hidden = false;
        $("[data-v=caracas]", t).textContent = car + "°";
        $("[data-v=colonia]", t).textContent = col + "°";
        var tope = Math.max(car, col, 1);
        $("[data-b=caracas]", t).style.setProperty("--e", (car / tope).toFixed(3));
        $("[data-b=colonia]", t).style.setProperty("--e", (col / tope).toFixed(3));
      });
    }
    if (datos) { poner(datos); return; }
    if (!window.fetch) return;
    fetch("https://api.open-meteo.com/v1/forecast?latitude=10.41,10.49&longitude=-67.29,-66.88&current=temperature_2m,weather_code&daily=temperature_2m_min&forecast_days=1&timezone=America%2FCaracas")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d[1]) return;
        poner(d);
        try { sessionStorage.setItem("elBosqueClima", JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
      }).catch(function () {});
  }

  /* Tarjetas que se deslizan: puntos de avance */
  function initDecks() {
    $$("[data-deck]").forEach(function (d) {
      var padre = d.parentNode, p = $("[data-puntos]", padre) || (d.nextElementSibling && $("[data-puntos]", d.nextElementSibling));
      if (!p) return;
      var n = d.children.length, ultimo = -1;
      for (var i = 0; i < n; i++) p.appendChild(document.createElement("i"));
      function marcar() {
        var w = d.children[0].getBoundingClientRect().width + 12;
        var k = Math.max(0, Math.min(n - 1, Math.round(d.scrollLeft / w)));
        if (k === ultimo) return;
        ultimo = k;
        $$("i", p).forEach(function (x, j) { x.classList.toggle("ya", j === k); });
      }
      d.addEventListener("scroll", marcar, { passive: true });
      marcar();
    });
  }

  /* Historias: avanzan solas si se ven, se tocan a los lados */
  function initHistoria() {
    var h = $("[data-historia]");
    if (!h) return;
    var esc = $$(".escena", h), bar = $$(".progreso i", h), i = 0, visible = false, reloj = null;
    function ir(n) {
      i = (n + esc.length) % esc.length;
      esc.forEach(function (x, j) { x.classList.toggle("activa", j === i); });
      bar.forEach(function (b, j) {
        b.classList.toggle("ya", j < i);
        b.classList.remove("ahora");
      });
      void h.offsetWidth;
      bar[i].classList.add("ahora");
      var im = $("img", esc[(i + 1) % esc.length]); if (im) im.loading = "eager";
      armar();
    }
    function armar() {
      clearTimeout(reloj);
      if (quieto || !visible || document.hidden) return;
      reloj = setTimeout(function () { ir(i + 1); }, 6000);
    }
    $(".alante", h).addEventListener("click", function () { ir(i + 1); vibrar(); });
    $(".atras", h).addEventListener("click", function () { ir(i - 1); vibrar(); });
    function quieta(v) { h.classList.toggle("quieta", v); if (v) clearTimeout(reloj); else armar(); }
    h.addEventListener("pointerdown", function () { quieta(true); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (n) { h.addEventListener(n, function () { quieta(false); }); });
    bar[0].classList.add("ahora");
    if (!("IntersectionObserver" in window)) { visible = true; armar(); return; }
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      h.classList.toggle("quieta", !visible);
      if (visible) armar(); else clearTimeout(reloj);
    }, { threshold: .4 }).observe(h);
    document.addEventListener("visibilitychange", armar);
  }

  /* Un solo bucle para lo que responde al scroll */
  function initScroll() {
    var cab = $("[data-cabecera]");
    var pars = quieto ? [] : $$(".par");
    var pend = false;
    function pintar() {
      pend = false;
      var alto = window.innerHeight, y = window.pageYOffset;
      if (cab) cab.classList.toggle("solida", y > window.innerHeight * .5);
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

  /* Galería: filtros y visor con deslizar */
  function initVisor() {
    var v = $("#visor");
    if (!v) return;
    var todos = $$("[data-foto]"), red = $("[data-galeria]");
    $$("[data-filtro]").forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filtro");
        $$("[data-filtro]").forEach(function (x) { var s = x === b; x.classList.toggle("activo", s); x.setAttribute("aria-pressed", s ? "true" : "false"); });
        todos.forEach(function (a) { a.hidden = !(f === "todas" || a.getAttribute("data-grupo") === f); });
        red.classList.toggle("filtrado", f !== "todas");
      });
    });
    var im = $("img", v), pie = $("p", v), i = 0, x0 = null, origen = null, lista = todos;
    function ver(n) {
      i = (n + lista.length) % lista.length;
      var f = $("img", lista[i]);
      im.src = lista[i].getAttribute("href"); im.alt = f.alt;
      pie.textContent = (i + 1) + " de " + lista.length + " · " + f.alt;
    }
    function cerrar() { v.hidden = true; document.body.style.overflow = ""; if (origen) origen.focus(); }
    todos.forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); origen = a;
        lista = todos.filter(function (x) { return !x.hidden; });
        ver(lista.indexOf(a)); v.hidden = false;
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

  /* Mapa real solo si la persona lo pide */
  function initMapa() {
    var b = $("[data-ver-mapa]");
    if (!b) return;
    b.addEventListener("click", function () {
      var c = b.parentNode, f = document.createElement("iframe");
      f.src = c.getAttribute("data-mapa"); f.title = "Mapa de la Colonia Tovar"; f.loading = "lazy";
      c.textContent = ""; c.appendChild(f);
    });
  }

  /* Reserva: calendario propio y postal que arma el mensaje */
  function initArmador() {
    var f = $("#armador");
    if (!f) return;
    var cal = $("#calendario"), fechaN = $("#fecha"), ayuda = $("#ayuda-fecha");
    var env = $("#enviar"), pf = $("#postal-foto");
    var hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    var mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1, 12), llega = null, sale = null, personas = 2;
    var q = new URLSearchParams(location.search).get("c");
    if (q) { var r0 = $("input[value='" + q.replace(/[^a-z0-9-]/g, "") + "']", f); if (r0) r0.checked = true; }
    function corta(d) { return d.toLocaleDateString("es-VE", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, ""); }
    function larga(d) { return d.toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" }).replace(",", ""); }
    function dibujar() {
      var nombre = mes.toLocaleDateString("es-VE", { month: "long", year: "numeric" });
      nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
      var atras = mes.getFullYear() === hoy.getFullYear() && mes.getMonth() === hoy.getMonth();
      var h = '<div class="cal-cab"><button type="button" data-m="-1" aria-label="Mes anterior"' + (atras ? " disabled" : "") + '>‹</button><span>' + nombre + '</span><button type="button" data-m="1" aria-label="Mes siguiente">›</button></div>';
      h += '<div class="cal-sem" aria-hidden="true"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="cal-dias">';
      var vacios = (mes.getDay() + 6) % 7, dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
      for (var v = 0; v < vacios; v++) h += "<span></span>";
      for (var d = 1; d <= dias; d++) {
        var x = new Date(mes.getFullYear(), mes.getMonth(), d, 12), cl = [];
        if (x.getDay() === 0 || x.getDay() === 6 || x.getDay() === 5) cl.push("finde");
        if (llega && +x === +llega) cl.push("ini");
        if (sale && +x === +sale) cl.push("fin");
        if (llega && sale && x > llega && x < sale) cl.push("medio");
        h += '<button type="button" data-d="' + d + '" class="' + cl.join(" ") + '"' + (x < hoy ? " disabled" : "") + ' aria-label="' + larga(x) + '">' + d + "</button>";
      }
      cal.innerHTML = h + "</div>";
    }
    function armar() {
      var c = $("input[name=cabana]:checked", f);
      var precio = +c.getAttribute("data-precio");
      var noches = llega && sale ? Math.round((sale - llega) / 864e5) : 0;
      if (!llega && fechaN.value) { var p = fechaN.value.split("-"); llega = new Date(+p[0], +p[1] - 1, +p[2], 12); }
      var t = "Hola, quiero reservar " + c.getAttribute("data-articulo") + " en " + NOMBRE;
      if (llega) t += ", llegando el " + larga(llega);
      if (sale) t += " y saliendo el " + larga(sale) + " (" + noches + (noches === 1 ? " noche" : " noches") + ")";
      t += ", para " + personas + (personas === 1 ? " persona" : " personas") + ". ¿Tienen disponibilidad?";
      env.href = WA + encodeURIComponent(t);
      $("#r-cabana").textContent = c.getAttribute("data-nombre");
      $("#r-llega").textContent = llega ? corta(llega) : "Por elegir";
      $("#r-sale").textContent = sale ? corta(sale) : "Por elegir";
      $("#r-gente").textContent = personas;
      $("#r-noches").textContent = noches ? noches + (noches === 1 ? " noche, estimado de ejemplo" : " noches, estimado de ejemplo") : "1 noche, estimado de ejemplo";
      $("#r-total").textContent = "$" + precio * Math.max(noches, 1);
      $("#sello").textContent = llega ? llega.toLocaleDateString("es-VE", { day: "numeric", month: "short" }).replace(".", "") : "Aragua";
      if (pf.getAttribute("src") !== c.getAttribute("data-imagen")) pf.src = c.getAttribute("data-imagen");
      $("#personas").textContent = personas;
    }
    cal.addEventListener("click", function (ev) {
      var b = ev.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-m")) { mes = new Date(mes.getFullYear(), mes.getMonth() + (+b.getAttribute("data-m")), 1, 12); dibujar(); return; }
      var x = new Date(mes.getFullYear(), mes.getMonth(), +b.getAttribute("data-d"), 12);
      if (!llega || sale || x <= llega) { llega = x; sale = null; ayuda.textContent = "Ahora toque el día que se va."; }
      else { sale = x; ayuda.textContent = "Listo. Si quiere cambiarlas, toque otro día."; }
      vibrar(); dibujar(); armar();
    });
    f.addEventListener("change", function () { vibrar(); armar(); });
    $("[data-menos]", f).addEventListener("click", function () { personas = Math.max(1, personas - 1); armar(); });
    $("[data-mas-p]", f).addEventListener("click", function () { personas = Math.min(12, personas + 1); armar(); });
    dibujar(); armar();
    /* En el teléfono el botón flotante no tapa la reserva */
    var flo = $(".flotante");
    if (flo && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { flo.classList.toggle("aparte", en[0].isIntersecting); }).observe(f);
    }
  }

  document.addEventListener("visibilitychange", function () { document.body.classList.toggle("pausado", document.hidden); });
  safe(initLogo, "logo");
  safe(initAgua, "agua");
  safe(initRelevo, "relevo");
  safe(initClima, "clima");
  safe(initDecks, "decks");
  safe(initHistoria, "historia");
  safe(initScroll, "scroll");
  safe(initHoja, "hoja");
  safe(initVisor, "visor");
  safe(initMapa, "mapa");
  safe(initArmador, "armador");
})();
