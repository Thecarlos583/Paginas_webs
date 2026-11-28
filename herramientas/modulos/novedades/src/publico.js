// Lo que ve el público: /novedades, /novedades/<slug>, las fotos y el sitemap.
// Las páginas se arman en el servidor sobre la plantilla del sitio (novedades.html, con el mismo menú y pie),
// así WhatsApp y Google leen el título, el subtítulo y la foto de cada artículo.
import { SLUG_OK, ID_OK, esc, fechaISO, fechaLarga, origenPublico, parrafos } from "./util.js";
import { articulo, publicados } from "./datos.js";

const WA_SVG = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 2.2A9.7 9.7 0 0 0 3.7 16.9L2.3 21.8l5-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3z"/></svg>';
const ICO = {
  atras: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  flecha: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  compartir: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v6a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-6M12 3.5v12M7.5 8 12 3.5 16.5 8"/></svg>',
};

const HTML_CAB = { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin" };

export function urlFoto(a) {
  return a.foto ? `/novedades/foto/${a.foto.id}.${a.foto.ext}` : null;
}

function marcaSinFoto(c) {
  return `<span class="nov-marca" aria-hidden="true"><img src="${esc(c.logo_claro || c.logo)}" alt="" width="${c.logo_ancho || 960}" height="${c.logo_alto || 243}" decoding="async"></span>`;
}

function tarjeta(a, c, grande = false, nivel = "h2") {
  const href = "/novedades/" + a.slug;
  const foto = a.foto
    ? `<img src="${urlFoto(a)}" alt="" width="${a.foto.ancho}" height="${a.foto.alto}" loading="${grande ? "eager" : "lazy"}" decoding="async">`
    : marcaSinFoto(c);
  return `<article class="nov-t${grande ? " nov-t-grande" : ""}">
 <a class="nov-t-foto" href="${href}" tabindex="-1" aria-hidden="true">${foto}</a>
 <div class="nov-t-cuerpo">
  <p class="nov-fecha"><time datetime="${fechaISO(a.fecha)}">${fechaLarga(a.fecha)}</time></p>
  <${nivel} class="nov-t-tit"><a href="${href}">${esc(a.titulo)}</a></${nivel}>
  ${a.subtitulo ? `<p class="nov-t-sub">${esc(a.subtitulo)}</p>` : ""}
  <span class="nov-t-ir">Leer ${ICO.flecha}</span>
 </div>
</article>`;
}

function listaHTML(lista, c) {
  if (!lista.length) return `<p class="nov-vacio">${esc(c.texto_vacio || "Muy pronto, novedades de viajes.")}</p>`;
  return `<div class="nov-rej">${lista.map((a, i) => tarjeta(a, c, i === 0)).join("\n")}</div>`;
}

/** Trae una página del sitio (de los archivos estáticos del Worker). */
async function estatico(env, req, ruta) {
  return env.ASSETS.fetch(new Request(new URL(ruta, req.url), { headers: { accept: "text/html" } }));
}

/** Las rutas relativas de la plantilla (estilos.css, img/logo.webp, contacto.html) pasan a absolutas (/estilos.css),
 *  porque los artículos viven en /novedades/<slug> y no en la raíz. */
class Absolutas {
  element(el) {
    for (const at of ["href", "src", "poster"]) {
      const v = el.getAttribute(at);
      if (v && relativa(v)) el.setAttribute(at, "/" + v.replace(/^\.\//, ""));
    }
    const ss = el.getAttribute("srcset");
    if (ss) el.setAttribute("srcset", ss.split(",").map((p) => { const t = p.trim(); return relativa(t) ? "/" + t : t; }).join(", "));
  }
}
function relativa(v) {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(v);
}

class Raiz {
  element(el) { el.setAttribute("data-raiz", "/"); }
}

export async function paginaLista(req, env, c) {
  const plantilla = await estatico(env, req, c.plantilla || "/novedades.html");
  if (!plantilla.ok) return new Response("Falta la plantilla de Novedades.", { status: 500 });
  const lista = await publicados(env);
  const html = listaHTML(lista, c);
  const r = new HTMLRewriter()
    .on("html", new Raiz())
    .on("[data-novedades]", { element(el) { el.setInnerContent(html, { html: true }); } })
    .transform(plantilla);
  return new Response(r.body, { status: 200, headers: HTML_CAB });
}

function metas(c, base, a, canonica) {
  const img = a.foto ? `${base}/novedades/compartir/${a.foto.id}.jpg` : base + (c.imagen_compartir || "/img/compartir.jpg");
  const titulo = `${a.titulo} · ${c.nombre_corto}`;
  const ld = {
    "@context": "https://schema.org", "@type": "NewsArticle", headline: a.titulo, description: a.subtitulo,
    image: [img], datePublished: fechaISO(a.publicado_en || a.creado), dateModified: fechaISO(a.actualizado),
    author: { "@type": "Organization", name: c.nombre }, publisher: { "@type": "Organization", name: c.nombre },
    mainEntityOfPage: canonica,
  };
  return `
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(c.nombre)}">
<meta property="og:locale" content="es_VE">
<meta property="og:title" content="${esc(a.titulo)}">
<meta property="og:description" content="${esc(a.subtitulo)}">
<meta property="og:url" content="${esc(base + "/novedades/" + a.slug)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:secure_url" content="${esc(img)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(a.titulo)}">
<meta property="article:published_time" content="${fechaISO(a.publicado_en || a.creado)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${esc(canonica)}">
${c.indexar === false ? '<meta name="robots" content="noindex, nofollow">' : ""}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
}

function articuloHTML(a, c, base, otras) {
  const url = base + "/novedades/" + a.slug;
  const msg = (c.msg_cotizar || "Hola, vi su publicación «{titulo}» y quiero información.").replace("{titulo}", a.titulo);
  const cotizar = `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(msg)}`;
  const compartir = `https://wa.me/?text=${encodeURIComponent(a.titulo + "\n" + url)}`;
  const foto = a.foto
    ? `<figure class="nov-art-foto"><img src="${urlFoto(a)}" alt="" width="${a.foto.ancho}" height="${a.foto.alto}" decoding="async" fetchpriority="high"></figure>`
    : `<figure class="nov-art-foto nov-art-foto-marca">${marcaSinFoto(c)}</figure>`;
  const fecha = a.publicado_en || a.creado;
  return `<article class="nov-art">
 <header class="contenedor nov-art-cab">
  <a class="nov-volver" href="/novedades">${ICO.atras}Novedades</a>
  <p class="nov-fecha"><time datetime="${fechaISO(fecha)}">${fechaLarga(fecha)}</time></p>
  <h1 class="nov-art-tit">${esc(a.titulo)}</h1>
  ${a.subtitulo ? `<p class="nov-art-sub">${esc(a.subtitulo)}</p>` : ""}
  <a class="btn btn-borde btn-chico nov-compartir" href="${esc(compartir)}" target="_blank" rel="noopener" data-compartir data-titulo="${esc(a.titulo)}" data-url="${esc(url)}">${ICO.compartir}<span>Compartir</span></a>
 </header>
 <div class="contenedor nov-art-medio">${foto}</div>
 <div class="contenedor nov-art-texto">
  ${parrafos(a.cuerpo)}
  <div class="nov-art-fin">
   <p class="nov-art-fin-txt">${esc(c.texto_fin || "¿Le interesa? Escríbanos y le damos todos los detalles.")}</p>
   <a class="btn btn-wa" href="${esc(cotizar)}" target="_blank" rel="noopener">${WA_SVG}<span>Cotizar este viaje</span></a>
  </div>
 </div>
</article>
${otras.length ? `<section class="nov-otras" aria-labelledby="nov-otras-tit">
 <div class="contenedor">
  <h2 id="nov-otras-tit" class="sec-tit-chico">Otras novedades</h2>
  <div class="nov-rej nov-rej-otras">${otras.map((x) => tarjeta(x, c, false, "h3")).join("\n")}</div>
  <div class="botones botones-centro"><a class="btn btn-borde" href="/novedades">Ver todas las novedades ${ICO.flecha}</a></div>
 </div>
</section>` : ""}`;
}

function noEncontradoHTML() {
  return `<section class="contenedor nov-no">
 <h1 class="sec-tit">No encontramos esta publicación</h1>
 <p class="sec-linea">Puede que la hayan quitado o que el enlace esté incompleto.</p>
 <div class="botones"><a class="btn btn-marca" href="/novedades">Ver las novedades ${ICO.flecha}</a></div>
</section>`;
}

export async function paginaArticulo(req, env, c, slug) {
  const a = SLUG_OK.test(slug) ? await articulo(env, slug) : null;
  const plantilla = await estatico(env, req, c.plantilla || "/novedades.html");
  if (!plantilla.ok) return new Response("Falta la plantilla de Novedades.", { status: 500 });
  const base = origenPublico(req, c);

  if (!a || a.estado !== "publicado") {
    const r = new HTMLRewriter()
      .on("html", new Raiz())
      .on("[href],[src],[srcset],[poster]", new Absolutas())
      .on("title", { element(el) { el.setInnerContent(`Publicación no encontrada · ${c.nombre_corto}`); } })
      .on('meta[name="robots"]', { element(el) { el.remove(); } })
      .on("meta[charset]", { element(el) { el.after('\n<meta name="robots" content="noindex">', { html: true }); } })
      .on("main", { element(el) { el.setInnerContent(noEncontradoHTML(), { html: true }); } })
      .transform(plantilla);
    return new Response(r.body, { status: 404, headers: HTML_CAB });
  }

  const otras = (await publicados(env)).filter((x) => x.slug !== a.slug).slice(0, 3);
  const canonica = (c.dominio ? "https://" + c.dominio : base) + "/novedades/" + a.slug;
  const r = new HTMLRewriter()
    .on("html", new Raiz())
    .on("[href],[src],[srcset],[poster]", new Absolutas())
    .on("title", { element(el) { el.setInnerContent(`${a.titulo} · ${c.nombre_corto}`); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute("content", a.subtitulo || a.titulo); } })
    .on('meta[property^="og:"], link[rel="canonical"], meta[name="robots"], meta[name^="twitter:"]', { element(el) { el.remove(); } })
    .on("meta[charset]", { element(el) { el.after(metas(c, base, a, canonica), { html: true }); } })
    .on("body", { element(el) { el.setAttribute("class", "p-novedades p-novedad"); } })
    .on("main", { element(el) { el.setInnerContent(articuloHTML(a, c, base, otras), { html: true }); } })
    .transform(plantilla);
  return new Response(r.body, { status: 200, headers: HTML_CAB });
}

/** Fotos guardadas en KV. Cada foto nueva lleva un id nuevo, así que se pueden guardar en caché un año. */
export async function imagen(req, env, ctx, prefijo, id) {
  if (!ID_OK.test(id)) return new Response("No encontrado", { status: 404 });
  const cache = caches.default;
  const clave = new Request(new URL(req.url).toString(), { method: "GET" });
  const enCache = await cache.match(clave);
  if (enCache) return enCache;
  const { value, metadata } = await env.NOVEDADES.getWithMetadata(prefijo + id, "arrayBuffer");
  if (!value) return new Response("No encontrado", { status: 404 });
  const r = new Response(value, {
    headers: {
      "content-type": (metadata && metadata.tipo) || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
  ctx.waitUntil(cache.put(clave, r.clone()));
  return r;
}

/** sitemap.xml del sitio + un <url> por cada artículo publicado. */
export async function sitemap(req, env, c) {
  const r = await env.ASSETS.fetch(new Request(new URL("/sitemap.xml", req.url)));
  let xml = r.ok ? await r.text() : '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n';
  const base = c.dominio ? "https://" + c.dominio : new URL(req.url).origin;
  const filas = (await publicados(env)).map((a) =>
    ` <url><loc>${esc(base + "/novedades/" + a.slug)}</loc><lastmod>${fechaISO(a.actualizado).slice(0, 10)}</lastmod></url>`).join("\n");
  xml = xml.replace("</urlset>", (filas ? filas + "\n" : "") + "</urlset>");
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
}
