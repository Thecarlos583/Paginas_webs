// Módulo de documentos (agencia de Carlos): /admin y /api/admin/ dentro del Worker de la web del cliente.
// conDocumentos(config, siguiente) envuelve otro Worker (por ejemplo el de Novedades) sin cambiarlo:
// lo que no es /admin ni /api/admin/ pasa tal cual al siguiente (o a los archivos de la web si no hay otro).
import { api } from "./api.js";
import { archivo, manifiesto, panel, sw } from "./panel.js";
import { json } from "./util.js";

const NOINDEX = { "x-robots-tag": "noindex, nofollow", "x-content-type-options": "nosniff", "referrer-policy": "same-origin" };

export function conDocumentos(conf, siguiente) {
  return {
    async fetch(req, env, ctx) {
      const ruta = new URL(req.url).pathname;
      const esApi = ruta.startsWith("/api/admin/");
      const esPanel = ruta === "/admin" || ruta.startsWith("/admin/");
      if (!esApi && !esPanel) return siguiente ? siguiente.fetch(req, env, ctx) : env.ASSETS.fetch(req);

      try {
        if (esApi) return await api(req, env, ruta, conf);
        if (req.method !== "GET" && req.method !== "HEAD") return new Response("Método no permitido", { status: 405, headers: NOINDEX });
        if (ruta === "/admin/") return Response.redirect(new URL("/admin", req.url).toString(), 301);
        if (ruta === "/admin") return panel(conf, NOINDEX);
        if (ruta === "/admin/manifest.webmanifest") return manifiesto(conf);
        if (ruta === "/admin/sw.js") return sw();
        const a = archivo(ruta, new URL(req.url).searchParams.get("v"));
        if (a) return a;
        return new Response("No encontrado", { status: 404, headers: { ...NOINDEX, "content-type": "text/plain; charset=utf-8" } });
      } catch (e) {
        console.error(e && e.stack ? e.stack : e);
        if (esApi) return json({ error: "Algo falló de nuestro lado. Lo que estaba escribiendo sigue guardado en este equipo: intente de nuevo en un momento." }, 500);
        return new Response("Algo falló. Intente de nuevo en un momento.", { status: 500, headers: { ...NOINDEX, "content-type": "text/plain; charset=utf-8" } });
      }
    },
  };
}
