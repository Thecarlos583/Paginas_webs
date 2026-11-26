// Utilidades del módulo de Novedades: textos, fechas, respuestas y sesión del panel.

export const LIMITES = { titulo: 90, subtitulo: 160, cuerpo: 1500 };
export const RESERVADOS = new Set(["foto", "compartir", "feed", "panel"]);

const ENC = new TextEncoder();
// espacio de ancho cero y separadores de línea de Unicode, armados con códigos para que no queden sueltos en el archivo
const INVISIBLES = new RegExp("[" + String.fromCharCode(0x200b, 0x2028, 0x2029) + "]", "g");

/** Escapa todo lo que escribe la clienta antes de ponerlo en HTML (nada de etiquetas ni scripts). */
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** Largo en caracteres reales (un emoji cuenta 1), igual que el contador del panel. */
export function largo(s) {
  return [...String(s ?? "")].length;
}

/** Limpia un texto: sin caracteres de control; en una línea o con párrafos. */
export function limpiar(s, multilinea = false) {
  let t = String(s ?? "").normalize("NFC").replace(/\r\n?/g, "\n");
  t = t.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").replace(INVISIBLES, "");
  if (multilinea) t = t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  else t = t.replace(/\s+/g, " ");
  return t.trim();
}

/** "Salida a Canaima en diciembre" -> "salida-a-canaima-en-diciembre" */
export function aSlug(titulo) {
  let s = String(titulo).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (s.length > 70) {
    s = s.slice(0, 70);
    const i = s.lastIndexOf("-");
    if (i > 30) s = s.slice(0, i);
    s = s.replace(/-+$/, "");
  }
  return s || "articulo";
}

export const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ID_OK = /^[a-z0-9]{20}$/;

export function idNuevo() {
  const b = crypto.getRandomValues(new Uint8Array(20));
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  return [...b].map((x) => abc[x % 36]).join("");
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Fecha en hora de Venezuela (UTC-4, sin horario de verano): "26 de noviembre de 2026". */
export function fechaLarga(ms) {
  const d = new Date(Number(ms) - 4 * 3600 * 1000);
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

export function fechaISO(ms) {
  return new Date(Number(ms)).toISOString();
}

/** Desarrollo -> párrafos HTML escapados. Línea en blanco = párrafo nuevo; salto simple = <br>. */
export function parrafos(cuerpo) {
  return String(cuerpo || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("\n");
}

export function json(datos, estado = 200, extra = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra },
  });
}

export function b64url(buf) {
  let s = "";
  for (const x of new Uint8Array(buf)) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(clave, datos) {
  const k = await crypto.subtle.importKey("raw", ENC.encode(clave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", k, ENC.encode(datos)));
}

async function sha(texto) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", ENC.encode(texto)));
}

/** Compara la contraseña sin dar pistas por el tiempo de respuesta. */
export async function claveCorrecta(escrita, env) {
  if (!env.PANEL_CLAVE) return false;
  const a = await sha(String(escrita ?? "")), b = await sha(env.PANEL_CLAVE);
  return crypto.subtle.timingSafeEqual(a, b);
}

export const COOKIE = "nov_sesion";
export const SESION_DIAS = 30;

/** La firma usa la contraseña: si se cambia la contraseña, todas las sesiones abiertas se cierran. */
export async function crearSesion(env) {
  const vence = Date.now() + SESION_DIAS * 864e5;
  return `${vence}.${await hmac("sesion:" + env.PANEL_CLAVE, String(vence))}`;
}

export function leerCookie(req, nombre) {
  const c = req.headers.get("cookie") || "";
  for (const parte of c.split(/;\s*/)) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i) === nombre) return parte.slice(i + 1);
  }
  return "";
}

export async function sesionValida(req, env) {
  if (!env.PANEL_CLAVE) return false;
  const v = leerCookie(req, COOKIE);
  const [vence, firma] = v.split(".");
  if (!vence || !firma || !(Number(vence) > Date.now())) return false;
  const buena = await hmac("sesion:" + env.PANEL_CLAVE, vence);
  if (buena.length !== firma.length) return false;
  return crypto.subtle.timingSafeEqual(ENC.encode(buena), ENC.encode(firma));
}

export function cookieSesion(valor, maxEdad) {
  return `${COOKIE}=${valor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxEdad}`;
}

/** Lee la configuración del cliente (vars.CLIENTE en wrangler.jsonc). */
export function cliente(env) {
  const c = typeof env.CLIENTE === "string" ? JSON.parse(env.CLIENTE) : env.CLIENTE;
  return c || {};
}

/** URL pública base: el dominio del cliente si la visita llega por él; si no, el origen de la visita (pruebas). */
export function origenPublico(req, c) {
  const u = new URL(req.url);
  if (c.dominio && (u.hostname === c.dominio || u.hostname === "www." + c.dominio)) return "https://" + c.dominio;
  return u.origin;
}
