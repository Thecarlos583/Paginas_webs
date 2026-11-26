// Guardado en Workers KV (plan gratis).
//   indice            lista corta de todos los artículos (para la portada de Novedades y el panel)
//   art:<slug>        el artículo completo
//   foto:<id>         la foto del artículo (WebP o JPEG, ~300 KB)
//   compartir:<id>    la imagen de 1200 x 630 para WhatsApp y redes (JPEG)
//   fallos:<ip> / bloqueo:<ip>   intentos fallidos de entrar al panel

export async function indice(env) {
  return (await env.NOVEDADES.get("indice", "json")) || [];
}

export async function guardarIndice(env, lista) {
  lista.sort((a, b) => b.fecha - a.fecha);
  await env.NOVEDADES.put("indice", JSON.stringify(lista));
}

export function resumen(a) {
  return {
    slug: a.slug, titulo: a.titulo, subtitulo: a.subtitulo, estado: a.estado,
    fecha: a.publicado_en || a.creado, actualizado: a.actualizado, foto: a.foto || null,
  };
}

export async function articulo(env, slug) {
  return env.NOVEDADES.get("art:" + slug, "json");
}

export async function publicados(env) {
  return (await indice(env)).filter((a) => a.estado === "publicado");
}

export async function guardarArticulo(env, a) {
  await env.NOVEDADES.put("art:" + a.slug, JSON.stringify(a));
  const lista = (await indice(env)).filter((x) => x.slug !== a.slug);
  lista.push(resumen(a));
  await guardarIndice(env, lista);
}

export async function borrarArticulo(env, a) {
  await env.NOVEDADES.delete("art:" + a.slug);
  if (a.foto) await borrarFotos(env, a.foto.id);
  const lista = (await indice(env)).filter((x) => x.slug !== a.slug);
  await guardarIndice(env, lista);
}

export async function borrarFotos(env, id) {
  await Promise.all([env.NOVEDADES.delete("foto:" + id), env.NOVEDADES.delete("compartir:" + id)]);
}

/** Slug libre: si ya existe "salida-a-canaima", usa "salida-a-canaima-2". */
export async function slugLibre(env, base, reservados) {
  let s = base, n = 1;
  while (reservados.has(s) || (await env.NOVEDADES.get("art:" + s)) !== null) {
    n += 1;
    s = `${base}-${n}`;
  }
  return s;
}
