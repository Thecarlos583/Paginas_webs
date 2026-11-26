// Panel de la clienta (/panel): pensado para el teléfono. Una sola página; el JS cambia de pantalla.
// Todo lo que escribe la clienta se pinta con textContent (nunca como HTML).
import { LIMITES, esc } from "./util.js";

export function panelManifiesto(c) {
  const ic = c.iconos || {};
  const m = {
    name: c.panel_nombre || "Panel de novedades", short_name: c.panel_nombre || "Panel", lang: "es-VE",
    id: "/panel", start_url: "/panel", scope: "/panel", display: "standalone",
    background_color: (c.colores && c.colores.fondo) || "#FFFFFF", theme_color: (c.colores && c.colores.tema) || "#000000",
    icons: [
      ic["192"] && { src: ic["192"], sizes: "192x192", type: "image/png", purpose: "any" },
      ic["512"] && { src: ic["512"], sizes: "512x512", type: "image/png", purpose: "any" },
      ic.maskable && { src: ic.maskable, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ].filter(Boolean),
  };
  return new Response(JSON.stringify(m), { headers: { "content-type": "application/manifest+json; charset=utf-8", "cache-control": "no-cache" } });
}

// Service worker mínimo del panel: no guarda nada (el panel siempre trabaja con la red), solo permite instalarlo.
export function panelSW() {
  const js = 'self.addEventListener("install",function(){self.skipWaiting()});self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});self.addEventListener("fetch",function(){});';
  return new Response(js, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-cache", "service-worker-allowed": "/panel" } });
}

export function panel(c, seguridad) {
  const col = c.colores || {};
  const datos = {
    nombre: c.nombre_corto, dominio: c.dominio || "", limites: LIMITES,
    imagen_compartir: c.imagen_compartir || "/img/compartir.jpg", logo_claro: c.logo_claro || c.logo,
  };
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(c.panel_nombre || "Panel de novedades")}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${esc(col.tema || "#000")}">
<meta name="color-scheme" content="only light">
<link rel="manifest" href="/panel/manifest.webmanifest">
<link rel="icon" href="${esc((c.iconos && c.iconos.favicon) || "/img/favicon-32.png")}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${esc((c.iconos && c.iconos.apple) || "/img/favicon-180.png")}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${esc(c.panel_nombre || "Panel")}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${esc(c.fuentes_url || "")}" rel="stylesheet">
<style>
:root {
  --tinta: ${col.tinta || "#0B1C23"}; --suave: ${col.suave || "#475A62"}; --fondo: ${col.fondo || "#FAF9F7"}; --fondo-2: ${col.fondo_2 || "#EFF2F3"};
  --linea: ${col.linea || "#E1E6E8"}; --linea-f: ${col.linea_fuerte || "#BFC9CD"}; --acento: ${col.acento_txt || "#0B7F8C"}; --foco: ${col.foco || "rgba(25,183,195,.22)"};
  --grad: ${col.grad || "linear-gradient(115deg,#0B7F8C,#7A3FD0)"}; --wa: #157F45; --wa-osc: #0F6838; --error: #B42323; --aviso: #8A5300;
  --f-tit: "${esc(c.f_tit || "system-ui")}", "Segoe UI", system-ui, sans-serif; --f-txt: "${esc(c.f_txt || "system-ui")}", "Segoe UI", system-ui, sans-serif;
  --suave-mov: cubic-bezier(.22,.61,.36,1);
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; min-height: 100svh; background: var(--fondo); color: var(--tinta); font: 400 17px/1.55 var(--f-txt); -webkit-font-smoothing: antialiased; }
h1, h2, h3 { font-family: var(--f-tit); font-weight: 800; line-height: 1.12; margin: 0; letter-spacing: -.01em; text-wrap: balance; }
p { margin: 0; }
button, input, textarea { font: inherit; color: inherit; }
img { display: block; max-width: 100%; }
[hidden] { display: none !important; }
:focus-visible { outline: 3px solid var(--acento); outline-offset: 2px; }
.cab { position: sticky; top: 0; z-index: 20; background: var(--grad); color: #fff; padding: calc(env(safe-area-inset-top) + 12px) 18px 12px; }
.cab-in { max-width: 600px; margin: 0 auto; display: flex; align-items: center; gap: 12px; min-height: 40px; }
.cab-logo { height: 28px; width: auto; }
.cab-txt { font: 700 15px/1 var(--f-tit); opacity: .92; padding-left: 12px; border-left: 1.5px solid rgba(255,255,255,.45); }
.cab-salir { margin-left: auto; min-height: 40px; padding: 0 14px; border-radius: 999px; border: 0; background: rgba(255,255,255,.16); color: #fff; font: 700 14px/1 var(--f-tit); cursor: pointer; }
main { max-width: 600px; margin: 0 auto; padding: 24px 18px calc(env(safe-area-inset-bottom) + 64px); }
.vista > * + * { margin-top: 18px; }
.tit { font-size: 30px; }
.linea { color: var(--suave); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 56px; padding: 0 22px; border: 0; border-radius: 999px; font: 700 17px/1.1 var(--f-tit); text-decoration: none; cursor: pointer; transition: transform .15s var(--suave-mov), background-color .2s; -webkit-tap-highlight-color: transparent; }
.btn:active { transform: scale(.98); }
.btn[disabled] { opacity: .6; cursor: progress; }
.btn svg { width: 22px; height: 22px; flex: none; }
.btn-marca { background: var(--grad); color: #fff; box-shadow: 0 12px 26px -16px rgba(58,40,160,.8); }
.btn-wa { background: var(--wa); color: #fff; }
.btn-wa:active { background: var(--wa-osc); }
.btn-borde { background: #fff; color: var(--tinta); box-shadow: inset 0 0 0 1.5px var(--tinta); }
.btn-suave { background: transparent; color: var(--acento); min-height: 48px; }
.btn-peligro { background: transparent; color: var(--error); box-shadow: inset 0 0 0 1.5px currentColor; }
.btn-peligro-lleno { background: var(--error); color: #fff; }
.pila { display: grid; gap: 12px; }
.campo { display: grid; gap: 8px; }
.campo label, .etq { font: 700 16px/1.2 var(--f-tit); }
.ayuda { font-size: 15px; color: var(--suave); }
.entrada { width: 100%; min-height: 56px; padding: 14px 16px; border: 1.5px solid var(--linea-f); border-radius: 14px; background: #fff; font-size: 18px; line-height: 1.45; transition: border-color .2s, box-shadow .2s; }
.entrada:focus { outline: none; border-color: var(--acento); box-shadow: 0 0 0 4px var(--foco); }
textarea.entrada { resize: vertical; min-height: 120px; }
textarea.entrada-tit { min-height: 0; resize: none; overflow: hidden; font-family: var(--f-tit); font-weight: 700; }
#f-cuerpo { min-height: 260px; }
.cont { justify-self: end; font-size: 14px; color: var(--suave); font-variant-numeric: tabular-nums; }
.cont.cerca { color: var(--aviso); font-weight: 700; }
.cont.tope { color: var(--error); font-weight: 700; }
.clave-caja { position: relative; }
.clave-caja .entrada { padding-right: 104px; }
.clave-ver { position: absolute; right: 6px; top: 6px; bottom: 6px; padding: 0 14px; border: 0; border-radius: 10px; background: var(--fondo-2); font: 700 14px/1 var(--f-tit); cursor: pointer; }
.error { padding: 14px 16px; border-radius: 14px; background: #FBEAEA; color: var(--error); font-size: 16px; }
.nota { padding: 14px 16px; border-radius: 14px; background: var(--fondo-2); font-size: 16px; }
.nota .btn-suave { min-height: 40px; padding: 0; width: auto; margin-top: 4px; }
.entrar-caja { padding: 28px 22px; border-radius: 26px; background: #fff; border: 1px solid var(--linea); }
.lista-cab { display: flex; align-items: end; justify-content: space-between; gap: 12px; }
.art { padding: 14px; border-radius: 20px; background: #fff; border: 1px solid var(--linea); display: grid; gap: 14px; }
.art-arriba { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 14px; align-items: start; }
.mini { width: 76px; height: 76px; border-radius: 14px; object-fit: cover; background: var(--grad); }
.mini-marca { display: grid; place-items: center; padding: 10px; }
.mini-marca img { width: 100%; height: auto; }
.art-tit { font-size: 18px; font-weight: 700; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.art-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; margin-top: 6px; font-size: 14px; color: var(--suave); }
.chip { display: inline-flex; align-items: center; min-height: 26px; padding: 0 10px; border-radius: 999px; font: 700 13px/1 var(--f-tit); }
.chip-pub { background: #E2F3E8; color: var(--wa); }
.chip-bor { background: var(--fondo-2); color: var(--suave); }
.art-acc { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.art-acc .btn-wa { grid-column: 1 / -1; }
.art-acc .btn { white-space: nowrap; }
@media (max-width: 399px) { .art-acc .btn-borde svg { display: none; } }
.art-acc .btn { min-height: 48px; padding: 0 10px; font-size: 15px; gap: 8px; }
.art-acc .btn svg { width: 18px; height: 18px; }
.art-acc .btn-borde { box-shadow: inset 0 0 0 1.5px var(--linea-f); }
.art-nota { align-self: center; font-size: 14px; line-height: 1.35; color: var(--suave); }
.vacio { padding: 32px 22px; border-radius: 22px; border: 1.5px dashed var(--linea-f); text-align: center; color: var(--suave); }
.foto-caja { display: grid; gap: 12px; }
.foto-prev { width: 100%; aspect-ratio: 1200 / 630; object-fit: cover; border-radius: 16px; background: var(--fondo-2); }
.foto-acc { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.foto-acc .btn { min-height: 48px; font-size: 15px; }
.archivo { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.btn-foto { background: #fff; color: var(--tinta); box-shadow: inset 0 0 0 1.5px var(--linea-f); border-radius: 16px; min-height: 64px; }
.separa { height: 1px; background: var(--linea); margin: 8px 0; }
/* la vista previa imita el chat de WhatsApp, porque ahí es donde la clienta comparte */
.chat { padding: 16px 14px; border-radius: 20px; background: #EFEAE2; }
.burbuja { margin-left: auto; max-width: 340px; padding: 4px 4px 8px; border-radius: 12px 4px 12px 12px; background: #D9FDD3; box-shadow: 0 1px .5px rgba(11,20,26,.13); font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #111B21; }
.wa-tarjeta { border-radius: 8px; overflow: hidden; background: rgba(11,20,26,.05); }
.wa-tarjeta img { width: 100%; aspect-ratio: 1200 / 630; object-fit: cover; background: var(--grad); }
.wa-txt { padding: 8px 10px 10px; display: grid; gap: 3px; }
.wa-tit { font-size: 15px; font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; }
.wa-sub { font-size: 14px; line-height: 1.35; color: #3B4A54; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.wa-dom { font-size: 13px; color: #667781; }
.wa-msj { padding: 8px 8px 0; font-size: 15px; line-height: 1.35; overflow-wrap: anywhere; white-space: pre-line; }
.wa-msj a { color: #027EB5; }
.prev-pag { padding: 20px 18px; border-radius: 20px; background: #fff; border: 1px solid var(--linea); display: grid; gap: 10px; }
.prev-pag .fecha { font-size: 14px; color: var(--suave); }
.prev-pag h3 { font-size: 26px; overflow-wrap: anywhere; }
.prev-pag .sub { font-size: 18px; color: var(--suave); }
.prev-pag img { width: 100%; border-radius: 14px; aspect-ratio: 3 / 2; object-fit: cover; background: var(--grad); }
.prev-pag .cuerpo p + p { margin-top: 12px; }
.prev-pag .cuerpo { overflow-wrap: anywhere; }
.listo-cab { display: grid; gap: 10px; justify-items: start; }
.listo-marca { width: 56px; height: 56px; border-radius: 50%; background: var(--grad); display: grid; place-items: center; color: #fff; animation: aparece .5s var(--suave-mov) both; }
.listo-marca svg { width: 30px; height: 30px; }
@keyframes aparece { from { transform: scale(.6); opacity: 0; } }
.enlace { padding: 14px 16px; border-radius: 14px; background: #fff; border: 1px solid var(--linea); font-size: 16px; overflow-wrap: anywhere; color: var(--acento); }
dialog { width: min(600px, 100%); max-height: 92svh; margin: auto auto 0; padding: 0; border: 0; border-radius: 26px 26px 0 0; background: var(--fondo); color: var(--tinta); }
dialog::backdrop { background: rgba(8, 14, 20, .55); }
dialog[open] { animation: sube .28s var(--suave-mov); }
@keyframes sube { from { transform: translateY(40px); opacity: 0; } }
.dlg-in { padding: 22px 18px calc(env(safe-area-inset-bottom) + 22px); display: grid; gap: 16px; }
.dlg-tit { font-size: 22px; }
.aviso { position: fixed; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 20px); z-index: 50; translate: -50% 0; width: max-content; max-width: calc(100% - 32px); padding: 14px 18px; border-radius: 14px; background: var(--tinta); color: #fff; font-size: 16px; box-shadow: 0 16px 40px -16px rgba(0,0,0,.5); opacity: 0; transform: translateY(12px); transition: opacity .2s, transform .2s; pointer-events: none; }
.aviso.ver { opacity: 1; transform: none; }
.instalar { padding: 16px; border-radius: 18px; background: var(--fondo-2); display: grid; gap: 10px; font-size: 15px; }
.cargando { color: var(--suave); text-align: center; padding: 40px 0; }
@media (min-width: 700px) {
  main { padding-top: 36px; }
  dialog { margin: auto; border-radius: 26px; }
  .tit { font-size: 34px; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
</style>
</head>
<body>
<header class="cab"><div class="cab-in">
 <img class="cab-logo" src="${esc(datos.logo_claro)}" alt="${esc(c.nombre_corto)}" width="${c.logo_ancho || 960}" height="${c.logo_alto || 243}">
 <span class="cab-txt">Novedades</span>
 <button class="cab-salir" type="button" id="salir" hidden>Salir</button>
</div></header>
<main>
<noscript><p class="error">Para usar el panel hace falta tener JavaScript activado en el navegador.</p></noscript>
<p class="cargando" id="cargando">Cargando…</p>

<section class="vista" id="v-entrar" hidden aria-labelledby="t-entrar">
 <div class="entrar-caja pila">
  <h1 class="tit" id="t-entrar">Panel de novedades</h1>
  <p class="linea">Escriba su contraseña para publicar artículos en la página de ${esc(c.nombre_corto)}.</p>
  <form class="pila" id="f-entrar" novalidate>
   <div class="campo">
    <label for="clave">Contraseña</label>
    <div class="clave-caja">
     <input class="entrada" id="clave" name="clave" type="password" autocomplete="current-password" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" required>
     <button class="clave-ver" type="button" id="clave-ver" aria-controls="clave" aria-pressed="false">Mostrar</button>
    </div>
   </div>
   <p class="error" id="entrar-error" role="alert" hidden></p>
   <button class="btn btn-marca" type="submit" id="entrar-btn">Entrar</button>
  </form>
  <p class="ayuda">La sesión queda abierta 30 días en este teléfono.</p>
 </div>
</section>

<section class="vista" id="v-lista" hidden aria-labelledby="t-lista">
 <div class="lista-cab"><h1 class="tit" id="t-lista">Sus artículos</h1></div>
 <a class="btn btn-marca" href="#nuevo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Nuevo artículo</a>
 <div class="pila" id="lista" aria-live="polite"></div>
 <a class="btn btn-suave" href="/novedades" target="_blank" rel="noopener">Ver la página de novedades</a>
 <div class="instalar" id="instalar" hidden>
  <p><strong>Tenga el panel a un toque.</strong> <span id="instalar-txt">Agréguelo a la pantalla de inicio de su teléfono.</span></p>
  <button class="btn btn-borde" type="button" id="instalar-btn" hidden>Agregar a la pantalla de inicio</button>
 </div>
</section>

<section class="vista" id="v-editor" hidden aria-labelledby="t-editor">
 <a class="btn btn-suave" href="#lista" style="justify-content:flex-start;padding:0;width:auto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Volver a sus artículos</a>
 <h1 class="tit" id="t-editor">Nuevo artículo</h1>
 <div class="nota" id="recuperado" hidden><p>Recuperamos lo que estaba escribiendo en este teléfono.</p><button class="btn btn-suave" type="button" id="descartar">Empezar de cero</button></div>
 <form class="pila" id="f-art" novalidate>
  <div class="campo">
   <label for="f-titulo">Título</label>
   <textarea class="entrada entrada-tit" id="f-titulo" name="titulo" rows="2" maxlength="${LIMITES.titulo}" autocomplete="off" autocapitalize="sentences" enterkeyhint="next" aria-describedby="c-titulo"></textarea>
   <span class="cont" id="c-titulo">0 de ${LIMITES.titulo}</span>
  </div>
  <div class="campo">
   <label for="f-subtitulo">Subtítulo</label>
   <span class="ayuda">Una o dos líneas que invitan a leer. Sale debajo del título en WhatsApp.</span>
   <textarea class="entrada" id="f-subtitulo" name="subtitulo" rows="3" maxlength="${LIMITES.subtitulo}" autocapitalize="sentences" aria-describedby="c-subtitulo"></textarea>
   <span class="cont" id="c-subtitulo">0 de ${LIMITES.subtitulo}</span>
  </div>
  <div class="campo">
   <label for="f-cuerpo">Desarrollo</label>
   <span class="ayuda">Un resumen breve. Deje una línea en blanco para empezar otro párrafo.</span>
   <textarea class="entrada" id="f-cuerpo" name="cuerpo" rows="10" maxlength="${LIMITES.cuerpo}" autocapitalize="sentences" aria-describedby="c-cuerpo"></textarea>
   <span class="cont" id="c-cuerpo">0 de ${LIMITES.cuerpo}</span>
  </div>
  <div class="campo">
   <span class="etq" id="e-foto">Foto (opcional)</span>
   <div class="foto-caja">
    <img class="foto-prev" id="foto-prev" alt="Foto elegida" hidden>
    <p class="ayuda" id="foto-ayuda">Si no sube ninguna, se usa la imagen de ${esc(c.nombre_corto)}.</p>
    <label class="btn btn-foto" id="foto-elegir"><input class="archivo" id="f-foto" type="file" accept="image/*" aria-labelledby="e-foto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8.5 5l1.3-2h4.4l1.3 2"/></svg><span id="foto-elegir-txt">Agregar foto</span></label>
    <div class="foto-acc" id="foto-acc" hidden>
     <label class="btn btn-borde"><input class="archivo" id="f-foto-2" type="file" accept="image/*">Cambiar</label>
     <button class="btn btn-peligro" type="button" id="foto-quitar">Quitar foto</button>
    </div>
   </div>
  </div>
  <p class="error" id="art-error" role="alert" hidden></p>
  <div class="separa"></div>
  <button class="btn btn-marca" type="button" id="publicar">Ver cómo queda y publicar</button>
  <button class="btn btn-borde" type="button" id="borrador">Guardar como borrador</button>
  <button class="btn btn-peligro" type="button" id="borrar" hidden>Borrar artículo</button>
 </form>
</section>

<section class="vista" id="v-listo" hidden aria-labelledby="t-listo">
 <div class="listo-cab">
  <span class="listo-marca" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
  <h1 class="tit" id="t-listo" tabindex="-1">Artículo publicado</h1>
  <p class="linea">Ya está en la página. Compártalo así:</p>
 </div>
 <div class="chat" id="listo-chat"></div>
<div class="pila">
  <button class="btn btn-wa" type="button" id="listo-wa"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2A9.7 9.7 0 0 0 3.7 16.9L2.3 21.8l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z"/></svg>Compartir por WhatsApp</button>
  <button class="btn btn-borde" type="button" id="listo-copiar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>Copiar enlace</button>
  <a class="btn btn-suave" id="listo-ver" href="/novedades" target="_blank" rel="noopener">Ver el artículo en la página</a>
  <a class="btn btn-suave" href="#lista">Volver a sus artículos</a>
 </div>
</section>
</main>

<dialog id="d-prev" aria-labelledby="t-prev">
 <div class="dlg-in">
  <h2 class="dlg-tit" id="t-prev">Así se verá en WhatsApp</h2>
  <div class="chat" id="prev-chat"></div>
  <h2 class="dlg-tit">Y así en la página</h2>
  <div class="prev-pag" id="prev-pag"></div>
  <p class="error" id="prev-error" role="alert" hidden></p>
  <button class="btn btn-marca" type="button" id="prev-publicar">Publicar</button>
  <button class="btn btn-borde" type="button" id="prev-volver">Seguir editando</button>
 </div>
</dialog>

<dialog id="d-borrar" aria-labelledby="t-borrar">
 <div class="dlg-in">
  <h2 class="dlg-tit" id="t-borrar">¿Borrar este artículo?</h2>
  <p>Se quita de la página y su enlace deja de funcionar. Esto no se puede deshacer.</p>
  <button class="btn btn-peligro-lleno" type="button" id="borrar-si">Sí, borrar</button>
  <button class="btn btn-borde" type="button" id="borrar-no">Cancelar</button>
 </div>
</dialog>

<div class="aviso" id="aviso" role="status" aria-live="polite"></div>
<script>var CFG = ${JSON.stringify(datos).replace(/</g, "\\u003c")};</script>
<script>${PANEL_JS}</script>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", ...seguridad,
      "content-security-policy": "default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    },
  });
}

// ---------------------------------------------------------------- JS del panel (clásico, sin módulos)
const PANEL_JS = String.raw`
(function () {
  "use strict";
  var $ = function (s) { return document.getElementById(s); };
  var L = CFG.limites;
  var MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  var SIN_RED = "No hay conexión. Su artículo no se perdió, intente de nuevo.";
  var vistas = ["entrar", "lista", "editor", "listo"];
  var ed = null;          // artículo en edición: { slug, estado, foto, nueva, quitar }
  var ultimo = null;      // último publicado (pantalla de listo)
  var articulos = [];

  function largo(s) { return Array.from(s || "").length; }
  function fecha(ms) { var d = new Date(Number(ms) - 4 * 3600 * 1000); return d.getUTCDate() + " de " + MESES[d.getUTCMonth()] + " de " + d.getUTCFullYear(); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function enlace(slug) { return location.origin + "/novedades/" + slug; }
  function dominio() { return CFG.dominio || location.host; }

  function mostrar(v) {
    $("cargando").hidden = true;
    vistas.forEach(function (n) { $("v-" + n).hidden = n !== v; });
    $("salir").hidden = v === "entrar";
    window.scrollTo(0, 0);
  }

  var avisoT;
  function aviso(txt) {
    var a = $("aviso"); a.textContent = txt; a.classList.add("ver");
    clearTimeout(avisoT); avisoT = setTimeout(function () { a.classList.remove("ver"); }, 2600);
  }

  function llamar(metodo, ruta, cuerpo) {
    var op = { method: metodo, headers: { "x-panel": "1" }, credentials: "same-origin" };
    if (cuerpo instanceof FormData) op.body = cuerpo;
    else if (cuerpo) { op.headers["content-type"] = "application/json"; op.body = JSON.stringify(cuerpo); }
    return fetch(ruta, op).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { d._estado = r.status; return d; });
    }, function () { return { _estado: 0, error: SIN_RED }; });
  }

  function mensajeError(d) {
    if (d._estado === 0) return SIN_RED;
    if (d._estado >= 500) return "Algo falló en el servidor. Su artículo no se perdió, intente de nuevo en un momento.";
    return d.error || "Algo falló. Intente de nuevo.";
  }

  // ------------------------------------------------ entrar
  $("clave-ver").addEventListener("click", function () {
    var c = $("clave"), ver = c.type === "password";
    c.type = ver ? "text" : "password"; this.textContent = ver ? "Ocultar" : "Mostrar"; this.setAttribute("aria-pressed", String(ver));
  });
  $("f-entrar").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var err = $("entrar-error"), btn = $("entrar-btn"), clave = $("clave").value;
    if (!clave) { err.textContent = "Escriba su contraseña."; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = "Entrando…"; err.hidden = true;
    llamar("POST", "/api/panel/entrar", { clave: clave }).then(function (d) {
      btn.disabled = false; btn.textContent = "Entrar";
      if (d.ok) { $("clave").value = ""; conSesion = true; ir("#lista", true); return; }
      err.textContent = mensajeError(d); err.hidden = false;
    });
  });
  $("salir").addEventListener("click", function () {
    llamar("POST", "/api/panel/salir").then(function () { conSesion = false; mostrar("entrar"); history.replaceState(null, "", "/panel"); });
  });

  function sesionVencida() {
    mostrar("entrar");
    var err = $("entrar-error");
    err.textContent = "Su sesión venció. Entre de nuevo: lo que estaba escribiendo quedó guardado en este teléfono.";
    err.hidden = false;
  }

  // ------------------------------------------------ lista
  var ICO_ED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>';
  var ICO_CP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
  var ICO_WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2A9.7 9.7 0 0 0 3.7 16.9L2.3 21.8l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z"/></svg>';

  function miniatura(a) {
    if (a.foto) { var i = el("img", "mini"); i.src = "/novedades/foto/" + a.foto.id + "." + a.foto.ext; i.alt = ""; i.loading = "lazy"; return i; }
    var s = el("span", "mini mini-marca"); var l = el("img"); l.src = CFG.logo_claro; l.alt = ""; s.appendChild(l); return s;
  }
  function boton(cls, html, fn) { var b = el("button", "btn " + cls); b.type = "button"; b.innerHTML = html; b.addEventListener("click", fn); return b; }

  function pintarLista() {
    var cont = $("lista"); cont.textContent = "";
    if (!articulos.length) {
      cont.appendChild(el("p", "vacio", "Todavía no hay artículos. Toque «Nuevo artículo» para escribir el primero."));
      return;
    }
    articulos.forEach(function (a) {
      var c = el("article", "art"), arriba = el("div", "art-arriba"), txt = el("div");
      arriba.appendChild(miniatura(a));
      txt.appendChild(el("h2", "art-tit", a.titulo));
      var meta = el("p", "art-meta");
      var pub = a.estado === "publicado";
      meta.appendChild(el("span", "chip " + (pub ? "chip-pub" : "chip-bor"), pub ? "Publicado" : "Borrador"));
      meta.appendChild(el("span", "", fecha(a.fecha)));
      txt.appendChild(meta); arriba.appendChild(txt); c.appendChild(arriba);
      var acc = el("div", "art-acc");
      acc.appendChild(boton("btn-borde", ICO_ED + "<span>Editar</span>", function () { ir("#editar/" + a.slug); }));
      if (pub) {
        acc.appendChild(boton("btn-borde", ICO_CP + "<span>Copiar enlace</span>", function () { copiar(enlace(a.slug)); }));
        acc.appendChild(boton("btn-wa", ICO_WA + "<span>Compartir por WhatsApp</span>", function () { compartirWA(a.titulo, a.slug); }));
      } else {
        acc.appendChild(el("p", "art-nota", "Publíquelo para poder compartirlo."));
      }
      c.appendChild(acc);
      cont.appendChild(c);
    });
  }

  function cargarLista() {
    mostrar("lista");
    $("lista").innerHTML = '<p class="cargando">Cargando sus artículos…</p>';
    llamar("GET", "/api/novedades").then(function (d) {
      if (d._estado === 401) return sesionVencida();
      if (!d.articulos) { $("lista").textContent = ""; $("lista").appendChild(el("p", "error", mensajeError(d))); return; }
      articulos = d.articulos; pintarLista();
    });
  }

  function copiar(txt) {
    function viejo() {
      var t = el("textarea"); t.value = txt; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(t); aviso(ok ? "Enlace copiado" : txt);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { aviso("Enlace copiado"); }, viejo);
    else viejo();
  }
  function compartirWA(titulo, slug) {
    var url = "https://wa.me/?text=" + encodeURIComponent(titulo + "\n" + enlace(slug));
    var a = el("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
  }

  // instalar en la pantalla de inicio
  var pedidoInstalar = null;
  var instalada = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone;
  if (!instalada) {
    $("instalar").hidden = false;
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) $("instalar-txt").textContent = "En Safari, toque el botón Compartir y luego «Agregar a inicio».";
    else $("instalar-txt").textContent = "En el menú del navegador (los tres puntos), toque «Agregar a la pantalla de inicio».";
  }
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); pedidoInstalar = e; $("instalar-btn").hidden = false;
    $("instalar-txt").textContent = "Agréguelo a la pantalla de inicio de su teléfono.";
  });
  $("instalar-btn").addEventListener("click", function () {
    if (!pedidoInstalar) return;
    pedidoInstalar.prompt(); pedidoInstalar.userChoice.then(function () { pedidoInstalar = null; $("instalar").hidden = true; });
  });
  window.addEventListener("appinstalled", function () { $("instalar").hidden = true; });

  // ------------------------------------------------ editor
  var campos = { titulo: $("f-titulo"), subtitulo: $("f-subtitulo"), cuerpo: $("f-cuerpo") };
  var umbral = { titulo: 15, subtitulo: 25, cuerpo: 150 };

  function contar(n) {
    var v = campos[n].value, usado = largo(v), quedan = L[n] - usado, c = $("c-" + n);
    c.classList.toggle("cerca", quedan <= umbral[n] && quedan > 0);
    c.classList.toggle("tope", quedan <= 0);
    c.textContent = quedan <= 0 ? "Llegó al límite de " + L[n] : quedan <= umbral[n] ? "Le quedan " + quedan + " de " + L[n] : usado + " de " + L[n];
  }
  function crecer() {
    var t = campos.cuerpo; t.style.height = "auto"; t.style.height = Math.max(260, t.scrollHeight + 4) + "px";
    var x = campos.titulo; x.style.height = "auto"; x.style.height = (x.scrollHeight + 3) + "px";
  }

  function claveBorrador() { return "nov:borrador:" + (ed && ed.slug ? ed.slug : "nuevo"); }
  var guardarT;
  function guardarLocal() {
    clearTimeout(guardarT);
    guardarT = setTimeout(function () {
      var datos = { titulo: campos.titulo.value, subtitulo: campos.subtitulo.value, cuerpo: campos.cuerpo.value, t: Date.now() };
      try { localStorage.setItem(claveBorrador(), JSON.stringify(datos)); } catch (e) {}
    }, 400);
  }
  function leerLocal() { try { return JSON.parse(localStorage.getItem(claveBorrador()) || "null"); } catch (e) { return null; } }
  function borrarLocal() { try { localStorage.removeItem(claveBorrador()); } catch (e) {} }

  Object.keys(campos).forEach(function (n) {
    campos[n].addEventListener("input", function () {
      // el título va en una sola línea aunque se escriba en un área que crece
      if (n === "titulo" && /\n/.test(campos.titulo.value)) campos.titulo.value = campos.titulo.value.replace(/\s*\n+\s*/g, " ");
      contar(n); if (n !== "subtitulo") crecer(); guardarLocal();
    });
  });
  campos.titulo.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); campos.subtitulo.focus(); } });

  function llenar(d) {
    Object.keys(campos).forEach(function (n) { campos[n].value = (d && d[n]) || ""; contar(n); });
    crecer();
  }

  function pintarFoto() {
    var prev = $("foto-prev"), src = null;
    if (ed.nueva) src = ed.nueva.url;
    else if (ed.foto && !ed.quitar) src = "/novedades/foto/" + ed.foto.id + "." + ed.foto.ext;
    prev.hidden = !src; if (src) prev.src = src;
    $("foto-elegir").hidden = !!src; $("foto-acc").hidden = !src;
    $("foto-ayuda").hidden = !!src;
  }

  function abrirEditor(art) {
    ed = { slug: art ? art.slug : null, estado: art ? art.estado : "nuevo", foto: art ? art.foto : null, nueva: null, quitar: false, actualizado: art ? art.actualizado : 0 };
    $("t-editor").textContent = art ? "Editar artículo" : "Nuevo artículo";
    $("art-error").hidden = true;
    $("borrar").hidden = !art;
    $("borrador").hidden = !!(art && art.estado === "publicado");
    $("publicar").textContent = art && art.estado === "publicado" ? "Ver cómo queda y guardar" : "Ver cómo queda y publicar";
    $("prev-publicar").textContent = art && art.estado === "publicado" ? "Guardar cambios" : "Publicar";
    var local = leerLocal();
    var usarLocal = local && (local.titulo || local.subtitulo || local.cuerpo) && (!art || local.t > (art.actualizado || 0)) &&
      (!art || local.titulo !== art.titulo || local.subtitulo !== art.subtitulo || local.cuerpo !== art.cuerpo);
    llenar(usarLocal ? local : art);
    $("recuperado").hidden = !usarLocal;
    $("recuperado").firstChild.textContent = art ? "Recuperamos los cambios que no alcanzó a guardar en este teléfono." : "Recuperamos lo que estaba escribiendo en este teléfono.";
    $("descartar").textContent = art ? "Descartar esos cambios" : "Empezar de cero";
    pintarFoto();
    mostrar("editor");
    crecer(); // con el editor ya visible, para que mida bien el alto
  }
  $("descartar").addEventListener("click", function () {
    borrarLocal(); $("recuperado").hidden = true;
    var art = ed.slug ? cacheArt[ed.slug] : null; llenar(art);
  });

  var cacheArt = {};
  function cargarEditor(slug) {
    mostrar("editor"); $("t-editor").textContent = "Cargando…";
    llamar("GET", "/api/novedades/" + encodeURIComponent(slug)).then(function (d) {
      if (d._estado === 401) return sesionVencida();
      if (!d.articulo) { aviso(mensajeError(d)); ir("#lista", true); return; }
      cacheArt[slug] = d.articulo; abrirEditor(d.articulo);
    });
  }

  // fotos: se achican en el teléfono antes de subir (WebP, 1600 px de ancho, ~300 KB) + una de 1200 x 630 para WhatsApp
  function cargarImagen(archivo) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(archivo), im = new Image();
      im.onload = function () { ok(im); }; im.onerror = function () { mal(new Error("foto")); }; im.src = url;
    });
  }
  function aBlob(canvas, tipo, q) { return new Promise(function (ok) { canvas.toBlob(ok, tipo, q); }); }
  function lienzo(w, h) { var c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  function prepararFoto(archivo) {
    return cargarImagen(archivo).then(function (im) {
      var w = im.naturalWidth, h = im.naturalHeight;
      if (!w || !h) throw new Error("foto");
      var f = Math.min(1, 1600 / w, 2400 / h), W = Math.round(w * f), H = Math.round(h * f);
      var tipo = "image/webp", MAX = 310 * 1024;
      function intento(W, H, qs) {
        var c = lienzo(W, H); var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.drawImage(im, 0, 0, W, H);
        function prueba(i) {
          return aBlob(c, tipo, qs[i]).then(function (b) {
            if (b && b.type !== tipo) { tipo = "image/jpeg"; return aBlob(c, tipo, qs[i]); }
            return b;
          }).then(function (b) {
            if (!b) throw new Error("foto");
            if (b.size <= MAX || i === qs.length - 1) return { blob: b, ancho: W, alto: H };
            return prueba(i + 1);
          });
        }
        return prueba(0);
      }
      function ciclo(W, H, vuelta) {
        return intento(W, H, [0.82, 0.72, 0.62, 0.52]).then(function (r) {
          if (r.blob.size <= MAX || vuelta >= 4) return r;
          return ciclo(Math.round(W * 0.8), Math.round(H * 0.8), vuelta + 1);
        });
      }
      return ciclo(W, H, 0).then(function (r) {
        // imagen para compartir: 1200 x 630, recortada al centro, JPEG (la que mejor lee WhatsApp)
        var c = lienzo(1200, 630), x = c.getContext("2d");
        var esc = Math.max(1200 / w, 630 / h), dw = w * esc, dh = h * esc;
        x.fillStyle = "#fff"; x.fillRect(0, 0, 1200, 630);
        x.drawImage(im, (1200 - dw) / 2, (630 - dh) / 2, dw, dh);
        return aBlob(c, "image/jpeg", 0.8).then(function (b) {
          return b && b.size > 280 * 1024 ? aBlob(c, "image/jpeg", 0.62) : b;
        }).then(function (b) {
          if (!b) throw new Error("foto");
          URL.revokeObjectURL(im.src);
          return { foto: r.blob, ancho: r.ancho, alto: r.alto, compartir: b, url: URL.createObjectURL(r.blob), urlCompartir: URL.createObjectURL(b) };
        });
      });
    });
  }

  function elegirFoto(input) {
    var archivo = input.files && input.files[0]; input.value = "";
    if (!archivo) return;
    if (archivo.type && !/^image\//.test(archivo.type)) { mostrarError("Ese archivo no es una foto. Elija una imagen."); return; }
    $("foto-elegir-txt").textContent = "Preparando la foto…";
    $("art-error").hidden = true;
    prepararFoto(archivo).then(function (r) {
      ed.nueva = r; ed.quitar = false; $("foto-elegir-txt").textContent = "Agregar foto"; pintarFoto();
    }, function () {
      $("foto-elegir-txt").textContent = "Agregar foto";
      mostrarError("No se pudo abrir esa foto. Pruebe con otra, o tómele una captura de pantalla y súbala.");
    });
  }
  $("f-foto").addEventListener("change", function () { elegirFoto(this); });
  $("f-foto-2").addEventListener("change", function () { elegirFoto(this); });
  $("foto-quitar").addEventListener("click", function () { ed.nueva = null; ed.quitar = true; pintarFoto(); });

  function mostrarError(t) { var e = $("art-error"); e.textContent = t; e.hidden = false; e.scrollIntoView({ block: "center", behavior: "smooth" }); }

  function valores() {
    return { titulo: campos.titulo.value.trim(), subtitulo: campos.subtitulo.value.trim(), cuerpo: campos.cuerpo.value.trim() };
  }
  function faltante(v, publicar) {
    if (!v.titulo) return ["titulo", "Escriba el título."];
    if (publicar && !v.subtitulo) return ["subtitulo", "Escriba el subtítulo."];
    if (publicar && !v.cuerpo) return ["cuerpo", "Escriba el desarrollo."];
    for (var n in L) if (largo(v[n]) > L[n]) return [n, "Ese texto pasa del límite."];
    return null;
  }

  // vista previa: el chat de WhatsApp y la página
  function imagenCompartir() {
    if (ed.nueva) return ed.nueva.urlCompartir;
    if (ed.foto && !ed.quitar) return "/novedades/compartir/" + ed.foto.id + ".jpg";
    return CFG.imagen_compartir;
  }
  function tarjetaWA(destino, titulo, subtitulo, img, url) {
    destino.textContent = "";
    var b = el("div", "burbuja"), t = el("div", "wa-tarjeta"), i = el("img"), tx = el("div", "wa-txt");
    i.src = img; i.alt = "";
    tx.appendChild(el("p", "wa-tit", titulo)); if (subtitulo) tx.appendChild(el("p", "wa-sub", subtitulo)); tx.appendChild(el("p", "wa-dom", dominio()));
    t.appendChild(i); t.appendChild(tx); b.appendChild(t);
    var m = el("p", "wa-msj"); m.appendChild(document.createTextNode(titulo + "\n")); var a = el("a", "", url); a.href = url; a.addEventListener("click", function (e) { e.preventDefault(); }); m.appendChild(a); b.appendChild(m);
    destino.appendChild(b);
  }
  function vistaPrevia() {
    var v = valores(), f = faltante(v, true);
    if (f) { mostrarError(f[1]); campos[f[0]].focus(); return; }
    $("art-error").hidden = true; $("prev-error").hidden = true;
    var url = ed.slug ? enlace(ed.slug) : location.origin + "/novedades/" + slugDe(v.titulo);
    tarjetaWA($("prev-chat"), v.titulo, v.subtitulo, imagenCompartir(), url);
    var p = $("prev-pag"); p.textContent = "";
    p.appendChild(el("p", "fecha", fecha(Date.now())));
    p.appendChild(el("h3", "", v.titulo));
    if (v.subtitulo) p.appendChild(el("p", "sub", v.subtitulo));
    var foto = ed.nueva ? ed.nueva.url : (ed.foto && !ed.quitar ? "/novedades/foto/" + ed.foto.id + "." + ed.foto.ext : null);
    if (foto) { var im = el("img"); im.src = foto; im.alt = ""; p.appendChild(im); }
    var cu = el("div", "cuerpo");
    v.cuerpo.split(/\n{2,}/).forEach(function (par) { if (par.trim()) cu.appendChild(el("p", "", par.trim())); });
    p.appendChild(cu);
    abrirDialogo($("d-prev"));
  }
  function slugDe(t) {
    var s = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (s.length > 70) { s = s.slice(0, 70); var i = s.lastIndexOf("-"); if (i > 30) s = s.slice(0, i); }
    return s || "articulo";
  }
  function abrirDialogo(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  function cerrarDialogo(d) { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }

  $("publicar").addEventListener("click", vistaPrevia);
  $("prev-volver").addEventListener("click", function () { cerrarDialogo($("d-prev")); });
  $("prev-publicar").addEventListener("click", function () { enviar("publicado", this, $("prev-error")); });
  $("borrador").addEventListener("click", function () {
    var v = valores(), f = faltante(v, false);
    if (f) { mostrarError(f[1]); campos[f[0]].focus(); return; }
    enviar("borrador", this, $("art-error"));
  });

  function enviar(estado, btn, cajaError) {
    var v = valores(), fd = new FormData();
    fd.append("titulo", v.titulo); fd.append("subtitulo", v.subtitulo); fd.append("cuerpo", v.cuerpo); fd.append("estado", estado);
    if (ed.nueva) {
      fd.append("foto", ed.nueva.foto, ed.nueva.foto.type === "image/webp" ? "foto.webp" : "foto.jpg");
      fd.append("compartir", ed.nueva.compartir, "compartir.jpg");
      fd.append("foto_ancho", ed.nueva.ancho); fd.append("foto_alto", ed.nueva.alto);
    } else if (ed.quitar) fd.append("quitar_foto", "1");
    var antes = btn.textContent; btn.disabled = true; btn.textContent = estado === "borrador" ? "Guardando…" : "Publicando…";
    cajaError.hidden = true;
    llamar("POST", ed.slug ? "/api/novedades/" + encodeURIComponent(ed.slug) : "/api/novedades", fd).then(function (d) {
      btn.disabled = false; btn.textContent = antes;
      if (d._estado === 401) { cerrarDialogo($("d-prev")); return sesionVencida(); }
      if (!d.ok) { cajaError.textContent = mensajeError(d); cajaError.hidden = false; return; }
      borrarLocal();
      cerrarDialogo($("d-prev"));
      if (estado === "borrador") { aviso("Borrador guardado"); ir("#lista", true); return; }
      ultimo = { titulo: d.articulo.titulo, subtitulo: d.articulo.subtitulo, slug: d.articulo.slug, img: imagenCompartir() };
      ir("#listo", true);
    });
  }

  // borrar
  $("borrar").addEventListener("click", function () { abrirDialogo($("d-borrar")); });
  $("borrar-no").addEventListener("click", function () { cerrarDialogo($("d-borrar")); });
  $("borrar-si").addEventListener("click", function () {
    var b = this; b.disabled = true; b.textContent = "Borrando…";
    llamar("DELETE", "/api/novedades/" + encodeURIComponent(ed.slug)).then(function (d) {
      b.disabled = false; b.textContent = "Sí, borrar"; cerrarDialogo($("d-borrar"));
      if (d._estado === 401) return sesionVencida();
      if (!d.ok) { mostrarError(mensajeError(d)); return; }
      borrarLocal(); aviso("Artículo borrado"); ir("#lista", true);
    });
  });

  // ------------------------------------------------ listo
  function pintarListo() {
    if (!ultimo) return ir("#lista", true);
    var url = enlace(ultimo.slug);
    tarjetaWA($("listo-chat"), ultimo.titulo, ultimo.subtitulo, ultimo.img, url);
   $("listo-ver").href = "/novedades/" + ultimo.slug;
    mostrar("listo");
    $("t-listo").focus({ preventScroll: true });
  }
  $("listo-wa").addEventListener("click", function () { compartirWA(ultimo.titulo, ultimo.slug); });
  $("listo-copiar").addEventListener("click", function () { copiar(enlace(ultimo.slug)); });

  // ------------------------------------------------ rutas (#lista, #nuevo, #editar/<slug>, #listo): el botón atrás del teléfono funciona
  var conSesion = false;
  function ir(h, reemplazar) {
    if (location.hash === h) return rutear();
    if (reemplazar) { history.replaceState(null, "", h); rutear(); } else location.hash = h;
  }
  function rutear() {
    if (!conSesion) return;
    var h = location.hash || "#lista";
    if (h === "#nuevo") return abrirEditor(null);
    if (h.indexOf("#editar/") === 0) return cargarEditor(decodeURIComponent(h.slice(8)));
    if (h === "#listo") return pintarListo();
    cargarLista();
  }
  window.addEventListener("hashchange", function () { if ($("d-prev").open) cerrarDialogo($("d-prev")); rutear(); });

  // inicio
  llamar("GET", "/api/panel/yo").then(function (d) {
    if (d.ok) { conSesion = true; rutear(); return; }
    if (d._estado === 0) { $("cargando").textContent = SIN_RED.replace(" Su artículo no se perdió,", ""); return; }
    mostrar("entrar");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/panel/sw.js", { scope: "/panel" }).catch(function () {}); });
  }
})();
`;
