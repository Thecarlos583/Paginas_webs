/* Hoku Hamaquita · sitio.js (sin dependencias). Todo el contenido ya está en el HTML. */
(function () {
  "use strict";
  var WA = "https://wa.me/580000000000?text=";
  document.documentElement.classList.add("js");
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn(e); } }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function poner(a, msg) { if (a) a.href = WA + encodeURIComponent(msg); }

  // Titular palabra por palabra (solo al cargar)
  safe(function () {
    $all("[data-palabras]").forEach(function (h) {
      var i = 0, frag = document.createDocumentFragment();
      Array.prototype.slice.call(h.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement("span"); s.className = "pal"; s.style.setProperty("--i", i++); s.textContent = p; frag.appendChild(s);
          });
        } else {
          var w = document.createElement("span"); w.className = "pal"; w.style.setProperty("--i", i++); w.appendChild(n.cloneNode(true)); frag.appendChild(w);
        }
      });
      h.textContent = ""; h.appendChild(frag);
    });
  });

  // Hilo que se cose con el scroll + parallax suave
  safe(function () {
    var hilo = document.querySelector(".hilo i");
    var par = $all("[data-paralaje]");
    var pend = false;
    function pintar() {
      pend = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      if (hilo) hilo.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
      par.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        var f = parseFloat(el.getAttribute("data-paralaje")) || 0.06;
        el.style.transform = "translate3d(0," + (-(r.top + r.height / 2 - innerHeight / 2) * f).toFixed(1) + "px,0)";
      });
    }
    function pedir() { if (!pend) { pend = true; requestAnimationFrame(pintar); } }
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
    pintar();
  });

  // Hoja "Más" del teléfono
  safe(function () {
    var b = document.querySelector(".barra-mas"), h = document.getElementById("hoja");
    if (!b || !h) return;
    function abrir(si) { h.hidden = !si; b.setAttribute("aria-expanded", si ? "true" : "false"); if (si) { var a = h.querySelector("a"); if (a) a.focus(); } }
    b.addEventListener("click", function () { abrir(h.hidden); });
    h.addEventListener("click", function (e) { if (e.target === h || e.target.classList.contains("hoja-cerrar")) abrir(false); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !h.hidden) { abrir(false); b.focus(); } });
  });

  // Firma: arme la suya en 3 toques
  safe(function () {
    $all(".armador").forEach(function (box) {
      var img = box.querySelector("[data-arm-foto]"), nom = box.querySelector("[data-arm-nombre]"),
        tal = box.querySelector("[data-arm-talla]"), a = box.querySelector("[data-arm-wa]");
      function actualizar(cambioTela) {
        var e = box.querySelector('input[name$="-est"]:checked'), t = box.querySelector('input[name$="-talla"]:checked');
        if (!e || !t) return;
        nom.textContent = e.value;
        tal.textContent = t.value === "no sé" ? "por medir" : t.value;
        if (cambioTela && img) {
          img.classList.add("cambiando");
          setTimeout(function () {
            img.src = e.getAttribute("data-foto"); img.style.objectPosition = e.getAttribute("data-pos");
            img.classList.remove("cambiando");
          }, 220);
        }
        poner(a, t.value === "no sé"
          ? "Hola, quiero pedir la Hoku Hamaquita " + e.value + ", pero no sé mi talla. ¿Me ayudan a medirla?"
          : "Hola, quiero pedir la Hoku Hamaquita " + e.value + ", talla " + t.value + ".");
      }
      box.addEventListener("change", function (ev) { actualizar(/-est$/.test(ev.target.name)); });
      actualizar(false);
    });
  });

  // Tarjetas de estampados
  safe(function () {
    $all(".est-card").forEach(function (c) {
      var s = c.querySelector("[data-est-talla]"), a = c.querySelector("[data-est-wa]"), n = c.getAttribute("data-est");
      if (!s || !a) return;
      s.addEventListener("change", function () {
        poner(a, s.value === "no sé" ? "Hola, quiero la Hoku Hamaquita " + n + ", pero no sé mi talla." : "Hola, quiero la Hoku Hamaquita " + n + ", talla " + s.value + ".");
      });
    });
  });

  // Cinta métrica de tallas
  safe(function () {
    var box = document.querySelector("[data-cinta]");
    if (!box) return;
    var r = box.querySelector('input[type="range"]'), out = box.querySelector("[data-cinta-valor]"),
      marcas = box.querySelector("[data-cinta-marcas]"), tira = box.querySelector(".cinta-tira"), a = box.querySelector("[data-cinta-wa]");
    var CM = 8, INI = 40;
    for (var cm = INI; cm <= 125; cm += 10) {
      var s = document.createElement("span"); s.textContent = cm; s.style.left = ((cm - INI) * CM) + "px"; marcas.appendChild(s);
    }
    function pintar() {
      var v = parseInt(r.value, 10), f = box.querySelector('input[name="franela"]:checked');
      out.textContent = v;
      marcas.style.transform = "translateX(" + (tira.clientWidth / 2 - (v - INI) * CM) + "px)";
      poner(a, "Hola, mi medida del hombro a la cadera contraria es " + v + " cm y uso talla " + (f ? f.value : "M") + " de franela. ¿Qué talla de Hoku Hamaquita me queda?");
    }
    box.addEventListener("input", pintar);
    box.addEventListener("change", pintar);
    addEventListener("resize", pintar);
    pintar();
  });

  // Pestañas (detalles y posiciones)
  safe(function () {
    $all('[role="tablist"]').forEach(function (lista) {
      var tabs = $all('[role="tab"]', lista);
      function elegir(t, foco) {
        tabs.forEach(function (x) {
          var si = x === t, p = document.getElementById(x.getAttribute("aria-controls"));
          x.setAttribute("aria-selected", si ? "true" : "false"); x.tabIndex = si ? 0 : -1;
          if (p) p.hidden = !si;
        });
        if (foco) t.focus();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { elegir(t); });
        t.addEventListener("keydown", function (e) {
          var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (d) { e.preventDefault(); elegir(tabs[(i + d + tabs.length) % tabs.length], true); }
        });
      });
      var h = location.hash.slice(1), ini = tabs.filter(function (t) { return t.getAttribute("aria-controls") === h; })[0];
      elegir(ini || tabs[0]);
      if (ini) setTimeout(function () { lista.scrollIntoView({ block: "start" }); }, 60);
    });
  });

  // Visor de la galería
  safe(function () {
    var v = document.querySelector(".visor");
    if (!v) return;
    var img = v.querySelector("img"), ultimo = null;
    function cerrar() { v.hidden = true; img.removeAttribute("src"); if (ultimo) ultimo.focus(); }
    $all("[data-visor]").forEach(function (b) {
      b.addEventListener("click", function () { ultimo = b; img.src = b.getAttribute("data-visor"); v.hidden = false; v.querySelector(".visor-cerrar").focus(); });
    });
    v.addEventListener("click", function (e) { if (e.target !== img) cerrar(); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !v.hidden) cerrar(); });
  });

  // Botón de la guía (enlace por confirmar)
  safe(function () {
    $all("[data-guia]").forEach(function (b) {
      var txt = b.textContent;
      b.addEventListener("click", function () {
        b.textContent = "Muy pronto: la guía nueva"; b.classList.add("pronto");
        setTimeout(function () { b.textContent = txt; b.classList.remove("pronto"); }, 2600);
      });
    });
  });
})();
