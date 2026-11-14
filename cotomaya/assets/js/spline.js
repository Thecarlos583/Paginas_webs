/* Cotomaya · escena 3D de Spline en la portada (opcional).
   Se enciende poniendo la URL de la escena (.splinecode) en datos/config.json, campo "spline_escena".
   Vacío = no se baja nada y se ve la portada de siempre.
   Reglas: nunca en pantallas de menos de 1024 px (teléfonos y tabletas), nunca con movimiento reducido
   ni con ahorro de datos; se baja después de que la página ya cargó; si algo falla, se queda la foto.
   Va en un archivo aparte de sitio.js para que un navegador viejo que no entienda import() no rompa el resto. */
(function () {
  "use strict";
  var RUNTIME = "https://cdn.jsdelivr.net/npm/@splinetool/runtime@2.0.183/build/runtime.js";
  try {
    var portada = document.querySelector("[data-portada]");
    var mq = window.matchMedia;
    if (!portada || !mq) return;
    var grande = mq("(min-width: 1024px)"), quieto = mq("(prefers-reduced-motion: reduce)");
    var red = navigator.connection;
    if (!grande.matches || quieto.matches) return;
    if (red && (red.saveData || /(^|-)2g$/.test(red.effectiveType || ""))) return;

    var arrancar = function () {
      fetch("datos/config.json", { cache: "no-cache" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (cfg) {
          var url = cfg && typeof cfg.spline_escena === "string" ? cfg.spline_escena.trim() : "";
          if (!/^https:\/\/\S+\.splinecode(\?\S*)?$/.test(url)) return;
          if (!grande.matches || quieto.matches) return;
          var capa = document.createElement("div");
          capa.className = "spline-capa"; capa.setAttribute("aria-hidden", "true");
          var lienzo = document.createElement("canvas");
          capa.appendChild(lienzo);
          portada.appendChild(capa);
          return import(RUNTIME).then(function (m) {
            var app = new m.Application(lienzo);
            return app.load(url).then(function () {
              capa.classList.add("lista");
              /* Pausa la escena cuando la portada no se ve, para no gastar batería */
              if ("IntersectionObserver" in window && typeof app.stop === "function" && typeof app.play === "function") {
                new IntersectionObserver(function (e) { if (e[0].isIntersecting) app.play(); else app.stop(); }).observe(portada);
              }
            });
          }).catch(function () { if (capa.parentNode) capa.parentNode.removeChild(capa); });
        })
        .catch(function () { /* sin escena: se queda la foto */ });
    };
    var despues = function () { (window.requestIdleCallback || function (f) { return setTimeout(f, 300); })(arrancar, { timeout: 2500 }); };
    if (document.readyState === "complete") despues();
    else window.addEventListener("load", despues, { once: true });
  } catch (e) { /* nunca romper la página por la escena */ }
})();
