/* Service worker sencillo: guarda las páginas de la agencia para abrir rápido.
   Páginas: primero la red (para ver siempre lo último) y, sin conexión, la copia guardada.
   CSS, JS e íconos: la copia guardada (cambian de nombre con ?v= en cada versión).
   Fotos y videos de otros sitios: no se tocan (los maneja el navegador). */
var CACHE = "agencia-01bdf0c9";
var ARCHIVOS = ["./", "index.html", "paquetes.html", "destinos.html", "servicios.html", "grupos.html", "galeria.html", "cotizar.html", "contacto.html", "creditos.html", "paquete-aruba.html", "paquete-los-roques.html", "paquete-isla-de-margarita.html", "paquete-canaima-salto-angel.html", "paquete-panama.html", "paquete-curazao.html", "paquete-morrocoy.html", "paquete-merida-andes.html", "paquete-cartagena.html", "paquete-madrid-paris.html", "estilos.css?v=01bdf0c9", "sitio.js?v=01bdf0c9", "manifest.webmanifest", "img/favicon-32.png"];

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ARCHIVOS.map(function (a) { return c.add(a).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k.indexOf("agencia-") === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  var esPagina = req.mode === "navigate" || /\.html$|\/$/.test(url.pathname);
  if (esPagina) {
    ev.respondWith(
      fetch(req).then(function (r) {
        var copia = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
        return r;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match("./index.html"); });
      })
    );
    return;
  }
  ev.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (resp) {
        if (resp.ok) { var copia = resp.clone(); caches.open(CACHE).then(function (c) { c.put(req, copia); }); }
        return resp;
      });
    })
  );
});
