// API del panel: entrar, salir, listar, crear, editar y borrar artículos.
import { LIMITES, RESERVADOS, SLUG_OK, aSlug, claveCorrecta, cookieSesion, crearSesion, idNuevo, json, largo, limpiar, sesionValida, SESION_DIAS } from "./util.js";
import { articulo, borrarArticulo, borrarFotos, guardarArticulo, indice, slugLibre } from "./datos.js";

const INTENTOS = 5;
const ESPERA_SEG = 15 * 60;
const FOTO_MAX = 700 * 1024;
const COMPARTIR_MAX = 400 * 1024;

export async function api(req, env, ruta) {
  const metodo = req.method;

  // Las escrituras solo valen desde el propio panel (mismo origen y cabecera propia).
  if (metodo !== "GET") {
    const origen = req.headers.get("origin");
    if (req.headers.get("x-panel") !== "1" || (origen && origen !== new URL(req.url).origin)) {
      return json({ error: "Solicitud no permitida." }, 403);
    }
  }

  if (ruta === "/api/panel/entrar" && metodo === "POST") return entrar(req, env);
  if (ruta === "/api/panel/salir" && metodo === "POST") {
    return json({ ok: true }, 200, { "set-cookie": cookieSesion("", 0) });
  }

  if (!(await sesionValida(req, env))) return json({ error: "Su sesión venció. Entre de nuevo." }, 401);

  if (ruta === "/api/panel/yo") return json({ ok: true });
  if (ruta === "/api/novedades" && metodo === "GET") return json({ articulos: await indice(env) });
  if (ruta === "/api/novedades" && metodo === "POST") return guardar(req, env, null);

  const m = ruta.match(/^\/api\/novedades\/([a-z0-9-]+)$/);
  if (m && SLUG_OK.test(m[1])) {
    const a = await articulo(env, m[1]);
    if (!a) return json({ error: "Ese artículo ya no existe." }, 404);
    if (metodo === "GET") return json({ articulo: a });
    if (metodo === "POST") return guardar(req, env, a);
    if (metodo === "DELETE") {
      await borrarArticulo(env, a);
      return json({ ok: true });
    }
  }
  return json({ error: "No encontrado." }, 404);
}

async function entrar(req, env) {
  const ip = req.headers.get("cf-connecting-ip") || "sin-ip";
  const bloqueo = await env.NOVEDADES.get("bloqueo:" + ip, "json");
  if (bloqueo && bloqueo.hasta > Date.now()) {
    const min = Math.max(1, Math.ceil((bloqueo.hasta - Date.now()) / 60000));
    return json({ error: `Por seguridad, espere ${min} ${min === 1 ? "minuto" : "minutos"} antes de intentar de nuevo.`, bloqueado: true, minutos: min }, 429);
  }
  let datos = {};
  try { datos = await req.json(); } catch { /* cuerpo vacío */ }

  if (await claveCorrecta(datos.clave, env)) {
    await env.NOVEDADES.delete("fallos:" + ip);
    const valor = await crearSesion(env);
    return json({ ok: true }, 200, { "set-cookie": cookieSesion(valor, SESION_DIAS * 86400) });
  }

  const fallos = ((await env.NOVEDADES.get("fallos:" + ip, "json")) || { n: 0 }).n + 1;
  if (fallos >= INTENTOS) {
    await env.NOVEDADES.put("bloqueo:" + ip, JSON.stringify({ hasta: Date.now() + ESPERA_SEG * 1000 }), { expirationTtl: ESPERA_SEG });
    await env.NOVEDADES.delete("fallos:" + ip);
    return json({ error: "Por seguridad, espere 15 minutos antes de intentar de nuevo.", bloqueado: true, minutos: 15 }, 429);
  }
  await env.NOVEDADES.put("fallos:" + ip, JSON.stringify({ n: fallos }), { expirationTtl: ESPERA_SEG });
  const quedan = INTENTOS - fallos;
  return json({ error: `Contraseña incorrecta. Le ${quedan === 1 ? "queda 1 intento" : `quedan ${quedan} intentos`}.` }, 401);
}

function tipoImagen(b) {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
}

async function leerImagen(archivo, max, soloJpeg) {
  if (!archivo || typeof archivo === "string" || !archivo.size) return null;
  if (archivo.size > max) throw new Error("La foto pesa demasiado. Intente con otra foto.");
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const tipo = tipoImagen(bytes);
  if (!tipo || (soloJpeg && tipo !== "image/jpeg")) throw new Error("Ese archivo no es una foto. Elija una imagen JPG, PNG o WebP.");
  return { bytes, tipo };
}

function entero(v, min, max) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

async function guardar(req, env, previo) {
  let f;
  try { f = await req.formData(); } catch { return json({ error: "No se pudo leer el artículo. Intente de nuevo." }, 400); }

  const titulo = limpiar(f.get("titulo"));
  const subtitulo = limpiar(f.get("subtitulo"));
  const cuerpo = limpiar(f.get("cuerpo"), true);
  const estado = f.get("estado") === "borrador" ? "borrador" : "publicado";

  if (!titulo) return json({ error: "Falta el título." }, 400);
  if (largo(titulo) > LIMITES.titulo) return json({ error: `El título pasa de ${LIMITES.titulo} caracteres.` }, 400);
  if (largo(subtitulo) > LIMITES.subtitulo) return json({ error: `El subtítulo pasa de ${LIMITES.subtitulo} caracteres.` }, 400);
  if (largo(cuerpo) > LIMITES.cuerpo) return json({ error: `El desarrollo pasa de ${LIMITES.cuerpo} caracteres.` }, 400);
  if (estado === "publicado" && (!subtitulo || !cuerpo)) {
    return json({ error: !subtitulo ? "Falta el subtítulo." : "Falta el desarrollo." }, 400);
  }

  let foto, compartir;
  try {
    foto = await leerImagen(f.get("foto"), FOTO_MAX, false);
    compartir = await leerImagen(f.get("compartir"), COMPARTIR_MAX, true);
  } catch (e) {
    return json({ error: e.message }, 400);
  }
  if (foto && !compartir) return json({ error: "No se pudo preparar la foto. Intente elegirla de nuevo." }, 400);

  const ahora = Date.now();
  const a = previo ? { ...previo } : { slug: await slugLibre(env, aSlug(titulo), RESERVADOS), creado: ahora, foto: null };
  Object.assign(a, { titulo, subtitulo, cuerpo, estado, actualizado: ahora });
  if (estado === "publicado" && !a.publicado_en) a.publicado_en = ahora;

  const fotoVieja = a.foto;
  if (foto) {
    const id = idNuevo();
    const ancho = entero(f.get("foto_ancho"), 1, 4000) || 1600;
    const alto = entero(f.get("foto_alto"), 1, 4000) || 1067;
    await env.NOVEDADES.put("foto:" + id, foto.bytes, { metadata: { tipo: foto.tipo } });
    await env.NOVEDADES.put("compartir:" + id, compartir.bytes, { metadata: { tipo: "image/jpeg" } });
    a.foto = { id, ext: foto.tipo === "image/webp" ? "webp" : "jpg", ancho, alto };
  } else if (f.get("quitar_foto") === "1") {
    a.foto = null;
  }

  await guardarArticulo(env, a);
  if (fotoVieja && (!a.foto || a.foto.id !== fotoVieja.id)) await borrarFotos(env, fotoVieja.id);

  return json({ ok: true, articulo: a, ruta: "/novedades/" + a.slug });
}
