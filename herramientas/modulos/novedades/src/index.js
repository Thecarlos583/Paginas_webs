// Módulo de Novedades (agencia de Carlos): un Cloudflare Worker que sirve la web estática del cliente
// y además /novedades, /novedades/<slug> y /panel. Configuración por cliente: clientes/<cliente>/wrangler.jsonc
import { cliente } from "./util.js";
import { api } from "./api.js";
import { imagen, paginaArticulo, paginaLista, sitemap } from "./publico.js";
import { panel, panelManifiesto, panelSW } from "./panel.js";

const SEGURIDAD = { "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "same-origin" };

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const ruta = url.pathname;
    const c = cliente(env);

    try {
      if (ruta.startsWith("/api/")) return await api(req, env, ruta);

      if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método no permitido", { status: 405 });

      if (ruta === "/" ) return env.ASSETS.fetch(new Request(new URL("/index.html", req.url), req));
      if (ruta === "/sitemap.xml") return await sitemap(req, env, c);

      if (ruta === "/novedades.html" || ruta === "/novedades/") return Response.redirect(new URL("/novedades", req.url).toString(), 301);
      if (ruta === "/novedades") return await paginaLista(req, env, c);
      let m = ruta.match(/^\/novedades\/foto\/([a-z0-9]+)\.(?:webp|jpg)$/);
      if (m) return await imagen(req, env, ctx, "foto:", m[1]);
      m = ruta.match(/^\/novedades\/compartir\/([a-z0-9]+)\.jpg$/);
      if (m) return await imagen(req, env, ctx, "compartir:", m[1]);
      m = ruta.match(/^\/novedades\/([^/]+)\/?$/);
      if (m) {
        if (ruta.endsWith("/")) return Response.redirect(new URL(ruta.slice(0, -1), req.url).toString(), 301);
        return await paginaArticulo(req, env, c, decodeURIComponent(m[1]).toLowerCase());
      }

      if (ruta === "/panel/" ) return Response.redirect(new URL("/panel", req.url).toString(), 301);
      if (ruta === "/panel") return panel(c, SEGURIDAD);
      if (ruta === "/panel/manifest.webmanifest") return panelManifiesto(c);
      if (ruta === "/panel/sw.js") return panelSW();

      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
      if (ruta.startsWith("/api/")) {
        return new Response(JSON.stringify({ error: "Algo falló de nuestro lado. Su artículo no se perdió, intente de nuevo en un momento." }), {
          status: 500, headers: { "content-type": "application/json; charset=utf-8" },
        });
      }
      return new Response("Algo falló. Intente de nuevo en un momento.", { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
  },
};
