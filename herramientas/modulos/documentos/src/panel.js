// La página del panel (/admin): un HTML corto con la configuración del cliente, más app.js y app.css.
// app.js, pdf.js y app.css se importan como texto (regla "Text" en el wrangler.jsonc del cliente).
import APP_JS from "./cliente/app.js";
import APP_CSS from "./cliente/app.css";
import PDF_JS from "./cliente/pdf.js";
import { esc } from "./util.js";

// Versión de los archivos para que el teléfono no se quede con uno viejo (cambia cuando cambia el contenido).
function huella(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
const VERSION = huella(APP_JS + APP_CSS + PDF_JS);

const CDN = "https://cdn.jsdelivr.net https://cdn.sheetjs.com";
const CSP = [
  "default-src 'self'",
  `script-src 'self' ${CDN}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${CDN}`,
  `worker-src 'self' blob: ${CDN}`,
  "frame-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export function archivo(ruta, v) {
  const cache = v === VERSION ? "public, max-age=31536000, immutable" : "no-cache";
  const comun = { "cache-control": cache, "x-content-type-options": "nosniff", "x-robots-tag": "noindex, nofollow" };
  if (ruta === "/admin/app.js") return new Response(APP_JS, { headers: { ...comun, "content-type": "text/javascript; charset=utf-8" } });
  if (ruta === "/admin/pdf.js") return new Response(PDF_JS, { headers: { ...comun, "content-type": "text/javascript; charset=utf-8" } });
  if (ruta === "/admin/app.css") return new Response(APP_CSS, { headers: { ...comun, "content-type": "text/css; charset=utf-8" } });
  return null;
}

export function manifiesto(conf) {
  const p = conf.panel || {}, ic = p.iconos || {}, col = p.colores || {};
  const m = {
    name: p.nombre || "Panel de documentos", short_name: p.nombre || "Panel", lang: "es-VE",
    id: "/admin", start_url: "/admin", scope: "/admin", display: "standalone",
    background_color: col.fondo || "#FFFFFF", theme_color: col.tema || "#000000",
    icons: [
      ic["192"] && { src: ic["192"], sizes: "192x192", type: "image/png", purpose: "any" },
      ic["512"] && { src: ic["512"], sizes: "512x512", type: "image/png", purpose: "any" },
      ic.maskable && { src: ic.maskable, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ].filter(Boolean),
  };
  return new Response(JSON.stringify(m), {
    headers: { "content-type": "application/manifest+json; charset=utf-8", "cache-control": "no-cache", "x-robots-tag": "noindex, nofollow" },
  });
}

// Service worker mínimo: no guarda nada (el panel siempre trabaja con la red), solo permite instalarlo.
export function sw() {
  const js = 'self.addEventListener("install",function(){self.skipWaiting()});self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});self.addEventListener("fetch",function(){});';
  return new Response(js, {
    headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-cache", "service-worker-allowed": "/admin", "x-robots-tag": "noindex, nofollow" },
  });
}

/** Lo que el navegador necesita de la configuración (nada secreto: todo esto sale en los PDF). */
function confPublica(conf) {
  return {
    agencia: conf.agencia, panel: conf.panel, pdf: conf.pdf, moneda: conf.moneda,
    documentos: conf.documentos, etiquetas: conf.etiquetas, listas: conf.listas,
  };
}

export function panel(conf, cabeceras) {
  const p = conf.panel || {}, col = p.colores || {}, ic = p.iconos || {};
  const datos = JSON.stringify(confPublica(conf)).replace(/</g, "\\u003c");
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.nombre || "Panel de documentos")}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${esc(col.tema || "#000")}">
<meta name="color-scheme" content="only light">
<link rel="manifest" href="/admin/manifest.webmanifest">
<link rel="icon" href="${esc(ic.favicon || "/favicon.ico")}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${esc(ic.apple || ic["192"] || "")}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${esc(p.nombre || "Panel")}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="${esc(p.fuentes_url || "")}" rel="stylesheet">
<style>:root{--tema:${esc(col.tema)};--fondo:${esc(col.fondo)};--papel:${esc(col.papel)};--tinta:${esc(col.tinta)};--suave:${esc(col.suave)};--linea:${esc(col.linea)};--linea-f:${esc(col.linea_fuerte)};--campo:${esc(col.campo)};--acento:${esc(col.acento)};--foco:${esc(col.foco)};--c1:${esc(col.c1)};--c2:${esc(col.c2)};--c3:${esc(col.c3)};--grad:linear-gradient(115deg,${esc(col.c1)} 0%,${esc(col.c2)} 52%,${esc(col.c3)} 100%);--f-tit:"${esc(p.f_tit || "system-ui")}","Segoe UI",system-ui,sans-serif;--f-txt:"${esc(p.f_txt || "system-ui")}","Segoe UI",system-ui,sans-serif}</style>
<link rel="stylesheet" href="/admin/app.css?v=${VERSION}">
<script type="application/json" id="conf">${datos}</script>
<script src="/admin/pdf.js?v=${VERSION}" defer></script>
<script src="/admin/app.js?v=${VERSION}" defer></script>
</head>
<body>
<div id="demo" class="demo" hidden>Demostración con datos de ejemplo</div>
<header class="cab">
 <div class="cab-in">
  <a class="cab-marca" href="#/" aria-label="Inicio">
   <img class="cab-logo" src="${esc(p.logo_claro || "")}" alt="${esc(conf.agencia.nombre_corto)}" width="${Number(p.logo_ancho) || 960}" height="${Number(p.logo_alto) || 243}">
   <span class="cab-txt">Documentos</span>
  </a>
  <nav class="nav" id="nav" aria-label="Secciones" hidden></nav>
 </div>
</header>
<main id="app" tabindex="-1">
 <noscript><p class="error">Para usar el panel hace falta tener JavaScript activado en el navegador.</p></noscript>
 <p class="cargando">Cargando…</p>
</main>
<div class="aviso" id="aviso" role="status" aria-live="polite"></div>
</body>
</html>`;
  return new Response(html, {
    headers: {
      ...cabeceras, "content-type": "text/html; charset=utf-8",
      // no-transform: que Cloudflare no le inserte su script de estadísticas al panel privado
      "cache-control": "no-cache, no-transform",
      "content-security-policy": CSP, "x-frame-options": "DENY",
    },
  });
}
