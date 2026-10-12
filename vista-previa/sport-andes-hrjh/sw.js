/* Guarda una copia de la página para que abra aunque no haya internet.
   - Página y catálogo (html, csv): primero internet; si no hay, la copia guardada.
   - Fotos, fuentes e íconos: la copia guardada al instante y se actualiza por detrás.
   - La hoja de Google no pasa por aquí: la página guarda su última versión por su cuenta. */
var CACHE = "tienda-v1";
// Lo esencial se guarda desde la primera visita; lo demás, a medida que se ve.
var BASICO = ["./", "catalogo-ejemplo.csv", "assets/favicon.svg", "assets/img/portada-700.webp",
  "assets/fuentes/barlow-400.woff2", "assets/fuentes/barlow-600.woff2", "assets/fuentes/barlow-cond-600.woff2",
  "assets/fuentes/barlow-cond-800.woff2", "assets/fuentes/barlow-cond-800i.woff2"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(BASICO.map(function(u){ return c.add(u).catch(function(){}); }));
  }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function guardar(req, res){
  if (res && res.ok) { var copia = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copia); }); }
  return res;
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var contenido = req.mode === "navigate" || /\.(html|csv)$/i.test(url.pathname) || /\/$/.test(url.pathname);
  if (contenido) {
    e.respondWith(fetch(req).then(function(res){ return guardar(req, res); }).catch(function(){
      return caches.match(req, { ignoreSearch: true }).then(function(m){ return m || caches.match("./"); });
    }));
  } else {
    e.respondWith(caches.match(req).then(function(m){
      var red = fetch(req).then(function(res){ return guardar(req, res); }).catch(function(){ return m; });
      return m || red;
    }));
  }
});
