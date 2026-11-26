// Utilidades del módulo de documentos: textos, fechas, respuestas, contraseñas y sesión.
// Funciona igual en el Worker y en Node (los scripts de instalación usan hashClave).

const ENC = new TextEncoder();
const INVISIBLES = new RegExp("[" + String.fromCharCode(0x200b, 0x2028, 0x2029, 0xfeff) + "]", "g");

/** Escapa todo antes de ponerlo en HTML (nada de etiquetas ni scripts). */
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** Limpia un texto: sin caracteres de control, recortado al largo máximo. */
export function limpiar(s, max = 200, multilinea = false) {
  let t = String(s ?? "").normalize("NFC").replace(/\r\n?/g, "\n");
  t = t.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").replace(INVISIBLES, "");
  if (multilinea) t = t.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  else t = t.replace(/\s+/g, " ");
  t = t.trim();
  const letras = [...t];
  return letras.length > max ? letras.slice(0, max).join("").trim() : t;
}

/** Para buscar: minúsculas, sin tildes, solo letras, números y espacios. */
export function norm(s) {
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ]+/g, " ").trim();
}

export function json(datos, estado = 200, extra = {}) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
      "x-content-type-options": "nosniff", "x-robots-tag": "noindex, nofollow", ...extra,
    },
  });
}

export function b64url(buf) {
  let s = "";
  for (const x of new Uint8Array(buf)) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function desdeB64url(s) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

export function aleatorio(n = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(n)));
}

export async function sha256(texto) {
  return b64url(await crypto.subtle.digest("SHA-256", ENC.encode(texto)));
}

// PBKDF2 con SHA-256. Las iteraciones quedan guardadas en el hash, así se pueden subir más adelante
// sin dañar las contraseñas viejas. 100 000 es el máximo que permite Cloudflare Workers.
export const ITERACIONES = 100000;

async function derivar(clave, sal, iter) {
  const k = await crypto.subtle.importKey("raw", ENC.encode(clave), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iter }, k, 256));
}

export async function hashClave(clave, iter = ITERACIONES) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${iter}$${b64url(sal)}$${b64url(await derivar(String(clave), sal, iter))}`;
}

function iguales(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

/** Compara sin dar pistas por el tiempo. Si no hay hash (usuario inexistente) calcula igual uno de mentira. */
export async function claveCorrecta(clave, guardado) {
  const partes = String(guardado || "").split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2") {
    await derivar(String(clave ?? ""), new Uint8Array(16), ITERACIONES);
    return false;
  }
  const iter = Number(partes[1]);
  if (!(iter >= 1000 && iter <= ITERACIONES)) return false;
  const calc = await derivar(String(clave ?? ""), desdeB64url(partes[2]), iter);
  return iguales(calc, desdeB64url(partes[3]));
}

/** Contraseña fácil de dictar por teléfono: palabra, cuatro números y palabra (por ejemplo brisa-4721-coral). */
const PALABRAS = ["playa", "coral", "isla", "brisa", "mapa", "ruta", "viaje", "palma", "arena", "ola", "cielo", "valle", "selva", "monte",
  "laguna", "faro", "puerto", "nube", "bahia", "cayo", "duna", "lago", "cumbre", "sabana", "tepuy", "delta", "rio", "costa", "muelle", "vela",
  "brujula", "maleta", "pasaje", "avion", "tren", "puente", "jardin", "mango", "coco", "canela"];

export function claveNueva() {
  const b = crypto.getRandomValues(new Uint32Array(3));
  return `${PALABRAS[b[0] % PALABRAS.length]}-${String(1000 + (b[1] % 9000))}-${PALABRAS[b[2] % PALABRAS.length]}`;
}

export function leerCookie(req, nombre) {
  const c = req.headers.get("cookie") || "";
  for (const parte of c.split(/;\s*/)) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i) === nombre) return parte.slice(i + 1);
  }
  return "";
}

export const COOKIE = "doc_sesion";
export const SESION_DIAS = 30;

export function cookieSesion(valor, maxEdad) {
  return `${COOKIE}=${valor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxEdad}`;
}

/** Hoy en Venezuela (UTC-4, sin horario de verano): "2026-11-26". */
export function hoyVE(ms = Date.now()) {
  return new Date(ms - 4 * 3600 * 1000).toISOString().slice(0, 10);
}

export const FECHA_OK = /^\d{4}-\d{2}-\d{2}$/;

export function fechaValida(s) {
  if (!FECHA_OK.test(String(s || ""))) return "";
  const d = new Date(s + "T12:00:00Z");
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? "" : s;
}

/** Redondeo a céntimos sin errores de coma flotante. */
export function cent(n) {
  return Math.round((Number(n) || 0) * 100 + Number.EPSILON) / 100;
}

export function entero(v, min, max, porDefecto = min) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : porDefecto;
}

export function numero(v, min, max) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
