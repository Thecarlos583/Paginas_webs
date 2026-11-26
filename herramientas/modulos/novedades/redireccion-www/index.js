// Manda www.<dominio> al dominio sin www, con HTTPS, conservando la ruta. Un solo Worker para todos los clientes.
export default {
  fetch(req) {
    const u = new URL(req.url);
    u.hostname = u.hostname.replace(/^www\./, "");
    u.protocol = "https:";
    u.port = "";
    return Response.redirect(u.toString(), 301);
  },
};