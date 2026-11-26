// API del panel de documentos (/api/admin/...). Cada consulta revisa la sesión y el rol:
// el Administrador ve todo; el Asesor solo los documentos de los que es responsable.
import {
  COOKIE, SESION_DIAS, aleatorio, claveCorrecta, claveNueva, cookieSesion, fechaValida, hashClave,
  hoyVE, json, leerCookie, limpiar, norm, sha256,
} from "./util.js";
import { SIGUIENTE, TIPOS, idCorto, limpiarContenido } from "./contenido.js";

const INTENTOS = 5;
const ESPERA_MS = 15 * 60 * 1000;
const MAX_CUERPO = 96 * 1024;
const USUARIO_OK = /^[a-z0-9._-]{3,30}$/;

// La configuración del cliente queda guardada con la petición, para no pasarla por todas las funciones.
const CONF = new WeakMap();

class Aviso extends Error {
  constructor(msg, estado = 400, extra = {}) { super(msg); this.estado = estado; this.extra = extra; }
}

export async function api(req, env, ruta, conf) {
  const db = env.DOCUMENTOS;
  const metodo = req.method;
  CONF.set(req, conf);
  try {
    if (metodo !== "GET") {
      // Escrituras solo desde el propio panel: misma página de origen y cabecera propia.
      const origen = req.headers.get("origin");
      if (req.headers.get("x-panel") !== "1" || (origen && origen !== new URL(req.url).origin)) throw new Aviso("Solicitud no permitida.", 403);
      if (Number(req.headers.get("content-length") || 0) > MAX_CUERPO) throw new Aviso("El documento es demasiado largo.", 413);
    }

    if (ruta === "/api/admin/entrar" && metodo === "POST") return await entrar(req, db);
    if (ruta === "/api/admin/salir" && metodo === "POST") return await salir(req, db);

    const yo = await sesion(req, db);
    if (!yo && ruta === "/api/admin/yo") return json({ usuario: null });
    if (!yo) return json({ error: "Su sesión venció. Entre de nuevo.", sesion: false }, 401);

    if (ruta === "/api/admin/yo") return json({ usuario: yo, demo: await esDemo(db) });

    if (ruta === "/api/admin/documentos") {
      if (metodo === "GET") return await listarDocs(req, db, yo);
      if (metodo === "POST") return await nuevoDoc(req, db, yo);
    }
    let m = ruta.match(/^\/api\/admin\/documentos\/(\d{1,9})(?:\/(convertir|pago|anular))?$/);
    if (m) {
      const id = Number(m[1]);
      if (!m[2] && metodo === "GET") return await verDoc(db, yo, id);
      if (!m[2] && metodo === "PUT") return await editarDoc(req, db, yo, id);
      if (m[2] === "convertir" && metodo === "POST") return await convertir(db, yo, id, conf);
      if (m[2] === "pago" && metodo === "POST") return await registrarPago(req, db, yo, id);
      if (m[2] === "anular" && metodo === "POST") return await anular(db, yo, id);
    }

    if (ruta === "/api/admin/clientes" && metodo === "GET") return await listarClientes(req, db, yo);
    m = ruta.match(/^\/api\/admin\/clientes\/(\d{1,9})$/);
    if (m && metodo === "GET") return await verCliente(db, yo, Number(m[1]));
    if (m && metodo === "PUT") return await editarCliente(req, db, Number(m[1]));

    if (ruta === "/api/admin/clave" && metodo === "POST") return await cambiarClave(req, db, yo);

    if (ruta.startsWith("/api/admin/usuarios") || ruta === "/api/admin/respaldo") {
      if (yo.rol !== "admin") throw new Aviso("Esta parte es solo para el administrador.", 403);
      if (ruta === "/api/admin/respaldo" && metodo === "GET") return await respaldo(db);
      if (ruta === "/api/admin/usuarios" && metodo === "GET") return await listarUsuarios(db);
      if (ruta === "/api/admin/usuarios" && metodo === "POST") return await crearUsuario(req, db);
      m = ruta.match(/^\/api\/admin\/usuarios\/(\d{1,9})$/);
      if (m && metodo === "POST") return await cambiarUsuario(req, db, yo, Number(m[1]));
    }
    return json({ error: "No encontrado." }, 404);
  } catch (e) {
    if (e instanceof Aviso) return json({ error: e.message, ...e.extra }, e.estado);
    throw e;
  }
}

async function cuerpo(req) {
  try { return await req.json(); } catch { throw new Aviso("No se pudo leer lo que envió. Intente de nuevo."); }
}

/* ---------- sesión ---------- */

async function sesion(req, db) {
  const valor = leerCookie(req, COOKIE);
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(valor)) return null;
  const r = await db.prepare(
    `SELECT u.id, u.usuario, u.nombre, u.rol FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token = ? AND s.vence > ? AND u.activo = 1`,
  ).bind(await sha256(valor), Date.now()).first();
  return r || null;
}

async function esDemo(db) {
  const r = await db.prepare("SELECT valor FROM ajustes WHERE clave = 'demo'").first();
  return !!(r && r.valor === "1");
}

async function entrar(req, db) {
  const d = await cuerpo(req);
  const usuario = String(d.usuario || "").trim().toLowerCase().slice(0, 40);
  const ip = req.headers.get("cf-connecting-ip") || "local";
  const clave = `${ip}|${usuario}`;
  const ahora = Date.now();

  const bloq = await db.prepare("SELECT hasta FROM intentos WHERE clave = ?").bind(clave).first();
  if (bloq && bloq.hasta > ahora) {
    const min = Math.max(1, Math.ceil((bloq.hasta - ahora) / 60000));
    throw new Aviso(`Por seguridad, espere ${min} ${min === 1 ? "minuto" : "minutos"} antes de intentar de nuevo.`, 429, { bloqueado: true });
  }

  const u = usuario ? await db.prepare("SELECT id, usuario, nombre, rol, clave, activo FROM usuarios WHERE usuario = ?").bind(usuario).first() : null;
  const ok = await claveCorrecta(d.clave, u && u.activo ? u.clave : "");
  if (ok) {
    const token = aleatorio(32);
    await db.batch([
      db.prepare("DELETE FROM intentos WHERE clave = ?").bind(clave),
      db.prepare("DELETE FROM sesiones WHERE vence < ?").bind(ahora),
      db.prepare("INSERT INTO sesiones (token, usuario_id, vence) VALUES (?, ?, ?)").bind(await sha256(token), u.id, ahora + SESION_DIAS * 864e5),
    ]);
    return json({ ok: true, usuario: { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol } }, 200,
      { "set-cookie": cookieSesion(token, SESION_DIAS * 86400) });
  }

  const r = await db.prepare(
    `INSERT INTO intentos (clave, n, hasta, vence) VALUES (?1, 1, 0, ?2)
     ON CONFLICT (clave) DO UPDATE SET n = CASE WHEN intentos.vence < ?3 THEN 1 ELSE intentos.n + 1 END, vence = ?2
     RETURNING n`,
  ).bind(clave, ahora + ESPERA_MS, ahora).first();
  if (r.n >= INTENTOS) {
    await db.prepare("UPDATE intentos SET n = 0, hasta = ? WHERE clave = ?").bind(ahora + ESPERA_MS, clave).run();
    throw new Aviso("Por seguridad, espere 15 minutos antes de intentar de nuevo.", 429, { bloqueado: true });
  }
  const quedan = INTENTOS - r.n;
  throw new Aviso(`Usuario o contraseña incorrectos. ${quedan === 1 ? "Le queda 1 intento." : `Le quedan ${quedan} intentos.`}`, 401);
}

async function salir(req, db) {
  const valor = leerCookie(req, COOKIE);
  if (valor) await db.prepare("DELETE FROM sesiones WHERE token = ?").bind(await sha256(valor)).run();
  return json({ ok: true }, 200, { "set-cookie": cookieSesion("", 0) });
}

/* ---------- documentos ---------- */

// Filtro de permisos: el Administrador ve todo, el Asesor solo lo suyo.
const PUEDE = "(?1 = 'admin' OR d.usuario_id = ?2)";

function filaCorta(r) {
  return {
    id: r.id, tipo: r.tipo, numero: r.numero, estado: r.estado, emision: r.emision, cliente_id: r.cliente_id,
    cliente: r.cliente_nombre, destino: r.destino, total: r.total, abonado: r.abonado, saldo: r.saldo,
    asesor: r.asesor || "", creado: r.creado,
  };
}

async function listarDocs(req, db, yo) {
  const u = new URL(req.url);
  const q = norm(u.searchParams.get("q") || "").slice(0, 60);
  const tipo = TIPOS.includes(u.searchParams.get("tipo")) ? u.searchParams.get("tipo") : "";
  const limite = Math.min(100, Math.max(1, Number(u.searchParams.get("limite")) || 30));
  const binds = [yo.rol, yo.id];
  let donde = PUEDE;
  if (tipo) { binds.push(tipo); donde += ` AND d.tipo = ?${binds.length}`; }
  for (const palabra of q.split(" ").filter(Boolean).slice(0, 5)) {
    binds.push(`%${palabra}%`);
    donde += ` AND d.busqueda LIKE ?${binds.length}`;
  }
  binds.push(limite);
  const { results } = await db.prepare(
    `SELECT d.*, u.nombre AS asesor FROM documentos d LEFT JOIN usuarios u ON u.id = d.usuario_id
     WHERE ${donde} ORDER BY d.creado DESC LIMIT ?${binds.length}`,
  ).bind(...binds).all();
  return json({ documentos: results.map(filaCorta) });
}

async function docVisible(db, yo, id) {
  const r = await db.prepare(
    `SELECT d.*, u.nombre AS asesor FROM documentos d LEFT JOIN usuarios u ON u.id = d.usuario_id WHERE d.id = ?3 AND ${PUEDE}`,
  ).bind(yo.rol, yo.id, id).first();
  if (!r) throw new Aviso("Ese documento no existe o no tiene permiso para verlo.", 404);
  return { ...filaCorta(r), usuario_id: r.usuario_id, origen_id: r.origen_id, cadena_id: r.cadena_id, actualizado: r.actualizado, datos: JSON.parse(r.datos) };
}

async function cadenaDe(db, yo, doc) {
  const { results } = await db.prepare(
    `SELECT d.id, d.tipo, d.numero, d.estado, d.origen_id, d.emision FROM documentos d WHERE d.cadena_id = ?3 AND ${PUEDE} ORDER BY d.creado`,
  ).bind(yo.rol, yo.id, doc.cadena_id || doc.id).all();
  return results;
}

async function verDoc(db, yo, id) {
  const doc = await docVisible(db, yo, id);
  return json({ documento: doc, cadena: await cadenaDe(db, yo, doc) });
}

function puedeEditar(yo, doc) {
  return yo.rol === "admin" || doc.usuario_id === yo.id;
}

function limpiarDocumento(v) {
  return limpiar(v, 30).toUpperCase().replace(/\s+/g, "");
}

/** Guarda o actualiza el cliente del documento y devuelve su id. */
async function guardarCliente(db, c, yo) {
  const ahora = Date.now();
  const documento = limpiarDocumento(c.documento);
  const busqueda = `${norm(c.nombre)} ${norm(documento)} ${String(c.telefono || "").replace(/\D/g, "")}`.trim();
  let id = null;
  if (c.id) {
    const r = await db.prepare("SELECT id FROM clientes WHERE id = ?").bind(c.id).first();
    if (r) id = r.id;
  }
  if (!id && documento) {
    const r = await db.prepare("SELECT id FROM clientes WHERE documento = ?").bind(documento).first();
    if (r) id = r.id;
  }
  if (!id) {
    const { results } = await db.prepare("SELECT id, nombre FROM clientes WHERE busqueda LIKE ? LIMIT 20").bind(norm(c.nombre) + "%").all();
    const igual = results.find((x) => norm(x.nombre) === norm(c.nombre));
    if (igual) id = igual.id;
  }
  if (id) {
    await db.prepare(
      `UPDATE clientes SET nombre = ?2, documento = CASE WHEN ?3 = '' THEN documento ELSE ?3 END,
       telefono = CASE WHEN ?4 = '' THEN telefono ELSE ?4 END, correo = CASE WHEN ?5 = '' THEN correo ELSE ?5 END,
       busqueda = ?6, actualizado = ?7 WHERE id = ?1`,
    ).bind(id, c.nombre, documento, c.telefono, c.correo, busqueda, ahora).run();
    return id;
  }
  const r = await db.prepare(
    `INSERT INTO clientes (nombre, documento, telefono, correo, busqueda, creado_por, creado, actualizado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  ).bind(c.nombre, documento, c.telefono, c.correo, busqueda, yo.id, ahora, ahora).first();
  return r.id;
}

function textoBusqueda(datos) {
  return norm(`${datos.cliente.nombre} ${datos.cliente.documento} ${datos.viaje.destino} ${datos.viaje.hotel}`);
}

/**
 * Crea un documento con su número. El número sale del contador en la misma transacción que el INSERT
 * (D1 hace las escrituras una tras otra), y "numero" es UNIQUE: dos personas guardando a la vez nunca reciben el mismo.
 */
async function crearDoc(db, { tipo, contenido, emision, yo, usuarioId, origenId = null, cadenaId = null }, conf, previas = []) {
  const { datos, total, abonado, saldo } = limpiarContenido(tipo, contenido);
  datos.cliente.id = await guardarCliente(db, datos.cliente, yo);
  datos.cliente.documento = limpiarDocumento(datos.cliente.documento);
  const prefijo = (conf.documentos[tipo] && conf.documentos[tipo].prefijo) || tipo.slice(0, 3).toUpperCase();
  const ahora = Date.now();
  const res = await db.batch([
    ...previas,
    db.prepare("UPDATE contadores SET n = n + 1 WHERE tipo = ?").bind(tipo),
    db.prepare(
      `INSERT INTO documentos (tipo, numero, cliente_id, usuario_id, creado_por, origen_id, cadena_id, emision,
         cliente_nombre, destino, total, abonado, saldo, datos, busqueda, creado, actualizado)
       SELECT ?1, ?2 || '-' || printf('%04d', n), ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14,
         ?15 || ' ' || lower(?2) || ' ' || printf('%04d', n), ?16, ?16
       FROM contadores WHERE tipo = ?1 RETURNING id, numero`,
    ).bind(tipo, prefijo, datos.cliente.id, usuarioId, yo.id, origenId, cadenaId, emision || hoyVE(),
      datos.cliente.nombre, datos.viaje.destino, total, abonado, saldo, JSON.stringify(datos), textoBusqueda(datos), ahora),
    db.prepare("UPDATE documentos SET cadena_id = id WHERE cadena_id IS NULL"),
  ]);
  const fila = res[previas.length + 1].results[0];
  return { id: fila.id, numero: fila.numero };
}

async function nuevoDoc(req, db, yo) {
  const d = await cuerpo(req);
  if (!TIPOS.includes(d.tipo)) throw new Aviso("Tipo de documento desconocido.");
  try {
    const hecho = await crearDoc(db, { tipo: d.tipo, contenido: sinPagosAjenos(d.tipo, d.contenido), emision: fechaValida(d.emision), yo, usuarioId: yo.id }, CONF.get(req));
    return json({ ok: true, ...hecho });
  } catch (e) { throw comoAviso(e); }
}


function comoAviso(e) {
  if (e instanceof Aviso) return e;
  if (e instanceof Error && !/D1_|SQLITE|constraint/i.test(e.message) && e.message.length < 140) return new Aviso(e.message);
  return e;
}

/** En una proforma los pagos solo entran con "Registrar pago"; nunca escritos a mano en el formulario. */
function sinPagosAjenos(tipo, contenido) {
  const c = { ...(contenido || {}) };
  if (tipo === "proforma") c.abonos = [];
  if (tipo === "comprobante") c.abonos_previos = [];
  return c;
}

async function editarDoc(req, db, yo, id) {
  const doc = await docVisible(db, yo, id);
  if (!puedeEditar(yo, doc)) throw new Aviso("No puede editar este documento.", 403);
  if (doc.estado === "anulado") throw new Aviso("Este documento está anulado. No se puede editar.");
  const d = await cuerpo(req);
  const contenido = { ...(d.contenido || {}) };
  // Los pagos ya registrados no se tocan desde el formulario.
  if (doc.tipo === "proforma") contenido.abonos = doc.datos.abonos || [];
  if (doc.tipo === "comprobante") {
    contenido.abonos_previos = doc.datos.abonos_previos || [];
    if (contenido.pago && doc.datos.pago) contenido.pago = { ...contenido.pago, id: doc.datos.pago.id };
  }
  let lim;
  try { lim = limpiarContenido(doc.tipo, contenido); } catch (e) { throw comoAviso(e); }
  const { datos, total, abonado, saldo } = lim;
  datos.cliente.id = await guardarCliente(db, datos.cliente, yo);
  datos.cliente.documento = limpiarDocumento(datos.cliente.documento);
  const emision = fechaValida(d.emision) || doc.emision;
  const ahora = Date.now();
  const sentencias = [
    db.prepare(
      `UPDATE documentos SET cliente_id = ?2, emision = ?3, cliente_nombre = ?4, destino = ?5, total = ?6, abonado = ?7, saldo = ?8,
         datos = ?9, busqueda = ?10 || ' ' || lower(replace(numero, '-', ' ')), actualizado = ?11 WHERE id = ?1`,
    ).bind(id, datos.cliente.id, emision, datos.cliente.nombre, datos.viaje.destino, total, abonado, saldo, JSON.stringify(datos), textoBusqueda(datos), ahora),
  ];
  // Si se corrige el pago de un comprobante, se corrige también en su proforma.
  if (doc.tipo === "comprobante" && doc.origen_id) {
    const p = await proformaDe(db, doc.origen_id);
    if (p) {
      const abonos = (p.datos.abonos || []).map((a) => (a.id === datos.pago.id ? datos.pago : a));
      sentencias.push(sentenciaProforma(db, p, abonos, ahora));
    }
  }
  await db.batch(sentencias);
  return json({ ok: true, id, numero: doc.numero });
}

async function proformaDe(db, id) {
  const r = await db.prepare("SELECT * FROM documentos WHERE id = ? AND tipo = 'proforma' AND estado = 'activo'").bind(id).first();
  return r ? { ...r, datos: JSON.parse(r.datos) } : null;
}

function sentenciaProforma(db, p, abonos, ahora) {
  let lim;
  try { lim = limpiarContenido("proforma", { ...p.datos, abonos }); } catch (e) { throw comoAviso(e); }
  return db.prepare("UPDATE documentos SET abonado = ?2, saldo = ?3, datos = ?4, actualizado = ?5 WHERE id = ?1")
    .bind(p.id, lim.abonado, lim.saldo, JSON.stringify(lim.datos), ahora);
}

async function convertir(db, yo, id, conf) {
  const doc = await docVisible(db, yo, id);
  if (!puedeEditar(yo, doc)) throw new Aviso("No puede convertir este documento.", 403);
  if (doc.estado === "anulado") throw new Aviso("Este documento está anulado.");
  const destino = doc.tipo === "cotizacion" ? "proforma" : doc.tipo === "comprobante" ? "voucher" : null;
  if (!destino) throw new Aviso(doc.tipo === "proforma" ? "Para seguir, registre un pago." : "El voucher es el último documento de la cadena.");
  // Un toque de más no crea dos documentos: si ya existe el siguiente, se devuelve ese.
  const ya = destino === "proforma"
    ? await db.prepare("SELECT id, numero FROM documentos WHERE origen_id = ? AND tipo = 'proforma' AND estado = 'activo' LIMIT 1").bind(doc.id).first()
    : await db.prepare("SELECT id, numero FROM documentos WHERE cadena_id = ? AND tipo = 'voucher' AND estado = 'activo' LIMIT 1").bind(doc.cadena_id || doc.id).first();
  if (ya) return json({ ok: true, id: ya.id, numero: ya.numero, existia: true });
  const contenido = { ...doc.datos };
  delete contenido.abonos; delete contenido.abonos_previos; delete contenido.pago;
  try {
    const hecho = await crearDoc(db, { tipo: destino, contenido, yo, usuarioId: doc.usuario_id, origenId: doc.id, cadenaId: doc.cadena_id || doc.id }, conf);
    return json({ ok: true, ...hecho });
  } catch (e) { throw comoAviso(e); }
}

async function registrarPago(req, db, yo, id) {
  const doc = await docVisible(db, yo, id);
  if (!puedeEditar(yo, doc)) throw new Aviso("No puede registrar pagos en este documento.", 403);
  if (doc.estado === "anulado") throw new Aviso("Este documento está anulado.");
  if (doc.tipo !== "proforma" && doc.tipo !== "comprobante") throw new Aviso("Los pagos se registran desde la proforma.");
  const d = await cuerpo(req);
  const pago = { ...(d.pago || {}), id: idCorto() };
  if (!fechaValida(pago.fecha)) pago.fecha = hoyVE();

  const ahora = Date.now();
  let base = doc, previos, previas = [];
  const p = doc.tipo === "proforma" ? doc : doc.origen_id ? await proformaDe(db, doc.origen_id) : null;
  if (p) {
    base = p;
    previos = p.datos.abonos || [];
    previas = [sentenciaProforma(db, p, [...previos, pago], ahora)];
  } else {
    previos = [...(doc.datos.abonos_previos || []), doc.datos.pago].filter(Boolean);
  }
  const contenido = { ...base.datos, abonos_previos: previos, pago };
  delete contenido.abonos;
  try {
    const hecho = await crearDoc(db, {
      tipo: "comprobante", contenido, yo, usuarioId: base.usuario_id, origenId: base.id, cadenaId: base.cadena_id || base.id,
    }, CONF.get(req), previas);
    return json({ ok: true, ...hecho });
  } catch (e) { throw comoAviso(e); }
}

async function anular(db, yo, id) {
  const doc = await docVisible(db, yo, id);
  if (!puedeEditar(yo, doc)) throw new Aviso("No puede anular este documento.", 403);
  if (doc.estado === "anulado") return json({ ok: true });
  const ahora = Date.now();
  const sentencias = [db.prepare("UPDATE documentos SET estado = 'anulado', actualizado = ? WHERE id = ?").bind(ahora, id)];
  // Si se anula un comprobante, su pago sale de la proforma y el saldo vuelve a subir.
  if (doc.tipo === "comprobante" && doc.origen_id && doc.datos.pago) {
    const p = await proformaDe(db, doc.origen_id);
    if (p) sentencias.push(sentenciaProforma(db, p, (p.datos.abonos || []).filter((a) => a.id !== doc.datos.pago.id), ahora));
  }
  await db.batch(sentencias);
  return json({ ok: true });
}

/* ---------- clientes ---------- */

// Lo que debe un cliente: el saldo de sus proformas activas (las cotizaciones todavía no son deuda).
const SALDO = `(SELECT COALESCE(SUM(d.saldo), 0) FROM documentos d WHERE d.cliente_id = c.id AND d.tipo = 'proforma' AND d.estado = 'activo' AND ${PUEDE})`;
const CUANTOS = `(SELECT COUNT(*) FROM documentos d WHERE d.cliente_id = c.id AND ${PUEDE})`;

async function listarClientes(req, db, yo) {
  const q = norm(new URL(req.url).searchParams.get("q") || "").slice(0, 60);
  const binds = [yo.rol, yo.id];
  let donde = "1 = 1";
  for (const palabra of q.split(" ").filter(Boolean).slice(0, 5)) {
    binds.push(`%${palabra}%`);
    donde += ` AND c.busqueda LIKE ?${binds.length}`;
  }
  const { results } = await db.prepare(
    `SELECT c.id, c.nombre, c.documento, c.telefono, c.correo, ${SALDO} AS saldo, ${CUANTOS} AS documentos
     FROM clientes c WHERE ${donde} ORDER BY c.actualizado DESC LIMIT 60`,
  ).bind(...binds).all();
  return json({ clientes: results });
}

async function verCliente(db, yo, id) {
  const c = await db.prepare(`SELECT c.*, ${SALDO} AS saldo FROM clientes c WHERE c.id = ?3`).bind(yo.rol, yo.id, id).first();
  if (!c) throw new Aviso("Ese cliente no existe.", 404);
  const { results } = await db.prepare(
    `SELECT d.*, u.nombre AS asesor FROM documentos d LEFT JOIN usuarios u ON u.id = d.usuario_id
     WHERE d.cliente_id = ?3 AND ${PUEDE} ORDER BY d.emision DESC, d.creado DESC LIMIT 200`,
  ).bind(yo.rol, yo.id, id).all();
  delete c.busqueda;
  return json({ cliente: c, documentos: results.map((r) => ({ ...filaCorta(r), cadena_id: r.cadena_id })) });
}

async function editarCliente(req, db, id) {
  const d = await cuerpo(req);
  const nombre = limpiar(d.nombre, 120);
  if (!nombre) throw new Aviso("Falta el nombre del cliente.");
  const documento = limpiarDocumento(d.documento), telefono = limpiar(d.telefono, 30);
  const r = await db.prepare(
    `UPDATE clientes SET nombre = ?2, documento = ?3, telefono = ?4, correo = ?5, direccion = ?6, busqueda = ?7, actualizado = ?8 WHERE id = ?1 RETURNING id`,
  ).bind(id, nombre, documento, telefono, limpiar(d.correo, 120), limpiar(d.direccion, 200),
    `${norm(nombre)} ${norm(documento)} ${telefono.replace(/\D/g, "")}`.trim(), Date.now()).first();
  if (!r) throw new Aviso("Ese cliente no existe.", 404);
  return json({ ok: true });
}

/* ---------- usuarios ---------- */

async function cambiarClave(req, db, yo) {
  if (yo.usuario === "demo" && (await esDemo(db))) throw new Aviso("En la demostración no se puede cambiar la contraseña.");
  const d = await cuerpo(req);
  const nueva = String(d.nueva || "");
  if ([...nueva].length < 8) throw new Aviso("La contraseña nueva debe tener al menos 8 caracteres.");
  if (nueva.length > 100) throw new Aviso("La contraseña nueva es demasiado larga.");
  const u = await db.prepare("SELECT clave FROM usuarios WHERE id = ?").bind(yo.id).first();
  if (!(await claveCorrecta(d.actual, u && u.clave))) throw new Aviso("La contraseña actual no es correcta.");
  await db.batch([
    db.prepare("UPDATE usuarios SET clave = ? WHERE id = ?").bind(await hashClave(nueva), yo.id),
    db.prepare("DELETE FROM sesiones WHERE usuario_id = ? AND token <> ?").bind(yo.id, await sha256(leerCookie(req, COOKIE))),
  ]);
  return json({ ok: true });
}

async function listarUsuarios(db) {
  const { results } = await db.prepare(
    `SELECT u.id, u.usuario, u.nombre, u.rol, u.activo, (SELECT COUNT(*) FROM documentos d WHERE d.usuario_id = u.id) AS documentos
     FROM usuarios u ORDER BY u.rol, u.nombre`,
  ).all();
  return json({ usuarios: results });
}

async function crearUsuario(req, db) {
  const d = await cuerpo(req);
  const nombre = limpiar(d.nombre, 60);
  const usuario = String(d.usuario || "").trim().toLowerCase();
  const rol = d.rol === "admin" ? "admin" : "asesor";
  if (!nombre) throw new Aviso("Falta el nombre.");
  if (!USUARIO_OK.test(usuario)) throw new Aviso("El usuario debe tener de 3 a 30 letras sin tildes ni espacios (puede usar números, punto o guion).");
  const ya = await db.prepare("SELECT id FROM usuarios WHERE usuario = ?").bind(usuario).first();
  if (ya) throw new Aviso("Ese usuario ya existe. Elija otro.");
  const clave = claveNueva();
  await db.prepare("INSERT INTO usuarios (usuario, nombre, rol, clave, activo, creado) VALUES (?, ?, ?, ?, 1, ?)")
    .bind(usuario, nombre, rol, await hashClave(clave), Date.now()).run();
  return json({ ok: true, usuario, clave });
}

async function cambiarUsuario(req, db, yo, id) {
  const d = await cuerpo(req);
  const u = await db.prepare("SELECT id, usuario FROM usuarios WHERE id = ?").bind(id).first();
  if (!u) throw new Aviso("Ese usuario no existe.", 404);
  if (id === yo.id && (d.activo === false || d.rol)) throw new Aviso("No puede desactivarse ni cambiarse el rol a usted mismo.");
  if (u.usuario === "demo" && (await esDemo(db))) throw new Aviso("El usuario de la demostración no se puede cambiar.");
  const sentencias = [];
  let clave;
  if (typeof d.activo === "boolean") {
    sentencias.push(db.prepare("UPDATE usuarios SET activo = ? WHERE id = ?").bind(d.activo ? 1 : 0, id));
    if (!d.activo) sentencias.push(db.prepare("DELETE FROM sesiones WHERE usuario_id = ?").bind(id));
  }
  if (d.rol === "admin" || d.rol === "asesor") sentencias.push(db.prepare("UPDATE usuarios SET rol = ? WHERE id = ?").bind(d.rol, id));
  if (d.nueva_clave === true) {
    clave = claveNueva();
    sentencias.push(db.prepare("UPDATE usuarios SET clave = ? WHERE id = ?").bind(await hashClave(clave), id));
    sentencias.push(db.prepare("DELETE FROM sesiones WHERE usuario_id = ?").bind(id));
  }
  if (!sentencias.length) throw new Aviso("No hay cambios.");
  await db.batch(sentencias);
  return json({ ok: true, clave });
}

async function respaldo(db) {
  const [cl, docs, us] = await db.batch([
    db.prepare("SELECT id, nombre, documento, telefono, correo, direccion, creado FROM clientes ORDER BY id"),
    db.prepare("SELECT d.*, u.nombre AS asesor FROM documentos d LEFT JOIN usuarios u ON u.id = d.usuario_id ORDER BY d.id"),
    db.prepare("SELECT id, usuario, nombre, rol, activo FROM usuarios ORDER BY id"),
  ]);
  return json({
    generado: Date.now(),
    clientes: cl.results,
    documentos: docs.results.map((r) => ({ ...filaCorta(r), origen_id: r.origen_id, cadena_id: r.cadena_id, datos: JSON.parse(r.datos) })),
    usuarios: us.results,
  });
}
