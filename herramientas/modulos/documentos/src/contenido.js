// Contenido de un documento: lo limpia (nada de HTML, largos máximos) y calcula total, abonado y saldo.
// Todo lo que llega del panel pasa por aquí antes de guardarse.
import { cent, entero, fechaValida, limpiar, numero } from "./util.js";

export const TIPOS = ["cotizacion", "proforma", "comprobante", "voucher"];
// Lo que sigue en la cadena desde cada tipo.
export const SIGUIENTE = { cotizacion: "proforma", proforma: "comprobante", comprobante: "voucher" };

const lista = (v, max, largo) =>
  (Array.isArray(v) ? v : []).map((x) => limpiar(x, largo)).filter(Boolean).slice(0, max)
    .filter((x, i, a) => a.indexOf(x) === i);

function pagoLimpio(p) {
  if (!p || typeof p !== "object") return null;
  const monto = numero(p.monto, 0.01, 10000000);
  if (monto === null) return null;
  return {
    id: /^[A-Za-z0-9_-]{6,24}$/.test(String(p.id || "")) ? String(p.id) : idCorto(),
    fecha: fechaValida(p.fecha) || "",
    monto: cent(monto),
    metodo: limpiar(p.metodo, 40),
    referencia: limpiar(p.referencia, 60),
  };
}

export function idCorto() {
  const b = crypto.getRandomValues(new Uint8Array(9));
  return [...b].map((x) => "abcdefghijkmnpqrstuvwxyz23456789"[x % 32]).join("");
}

/** Devuelve { datos, total, abonado, saldo } o lanza Error con un mensaje para la persona. */
export function limpiarContenido(tipo, e) {
  e = e && typeof e === "object" ? e : {};
  const c = e.cliente || {};
  const v = e.viaje || {};
  const cliente = {
    id: Number.isInteger(c.id) && c.id > 0 ? c.id : null,
    nombre: limpiar(c.nombre, 120),
    documento: limpiar(c.documento, 30),
    telefono: limpiar(c.telefono, 30),
    correo: limpiar(c.correo, 120),
  };
  if (!cliente.nombre) throw new Error("Falta el nombre del cliente.");

  const viaje = {
    clase: v.clase === "boletos" ? "boletos" : "paquete",
    destino: limpiar(v.destino, 120),
    ida: fechaValida(v.ida),
    vuelta: fechaValida(v.vuelta),
    noches: entero(v.noches, 0, 365, 0),
    adultos: entero(v.adultos, 0, 99, 1),
    ninos: entero(v.ninos, 0, 99, 0),
    infantes: entero(v.infantes, 0, 99, 0),
    hotel: limpiar(v.hotel, 120),
    regimen: limpiar(v.regimen, 60),
    traslados: limpiar(v.traslados, 80),
    vuelos: limpiar(v.vuelos, 600, true),
    confirmacion: limpiar(v.confirmacion, 60),
  };
  if (!viaje.destino) throw new Error("Falta el destino.");
  if (viaje.ida && viaje.vuelta && viaje.vuelta < viaje.ida) throw new Error("La fecha de regreso es antes de la salida.");
  if (viaje.adultos + viaje.ninos + viaje.infantes === 0) throw new Error("Indique cuántos pasajeros viajan.");

  const renglones = (Array.isArray(e.renglones) ? e.renglones : []).slice(0, 30).map((r) => ({
    descripcion: limpiar(r && r.descripcion, 160),
    cantidad: numero(r && r.cantidad, 0, 999) ?? 1,
    precio: cent(numero(r && r.precio, 0, 1000000) ?? 0),
  })).filter((r) => r.descripcion || r.precio);
  for (const r of renglones) if (!r.descripcion) throw new Error("Hay un renglón con precio pero sin descripción.");

  const tasa = numero(e.bs && e.bs.tasa, 0.0001, 100000000);
  const bs = { mostrar: !!(e.bs && e.bs.mostrar) && tasa !== null, tasa: tasa ?? null, fecha: fechaValida(e.bs && e.bs.fecha) };
  if (e.bs && e.bs.mostrar && tasa === null) throw new Error("Escriba la tasa del día para mostrar el monto en bolívares.");

  const datos = {
    cliente, viaje,
    incluye: lista(e.incluye, 25, 120),
    no_incluye: lista(e.no_incluye, 25, 120),
    renglones,
    bs,
    validez_dias: entero(e.validez_dias, 0, 90, 3),
    notas: limpiar(e.notas, 1000, true),
  };

  if (tipo === "proforma") datos.abonos = (Array.isArray(e.abonos) ? e.abonos : []).slice(0, 40).map(pagoLimpio).filter(Boolean);
  if (tipo === "comprobante") {
    datos.abonos_previos = (Array.isArray(e.abonos_previos) ? e.abonos_previos : []).slice(0, 40).map(pagoLimpio).filter(Boolean);
    datos.pago = pagoLimpio(e.pago);
    if (!datos.pago) throw new Error("Falta el monto del pago recibido.");
  }

  const total = cent(renglones.reduce((s, r) => s + cent(r.cantidad * r.precio), 0));
  let abonado = 0;
  if (tipo === "proforma") abonado = datos.abonos.reduce((s, p) => s + p.monto, 0);
  if (tipo === "comprobante") abonado = datos.abonos_previos.reduce((s, p) => s + p.monto, 0) + datos.pago.monto;
  abonado = cent(abonado);
  if ((tipo === "proforma" || tipo === "comprobante") && abonado > total + 0.001) {
    throw new Error("Los pagos suman más que el total del documento.");
  }
  const saldo = tipo === "proforma" || tipo === "comprobante" ? cent(total - abonado) : 0;
  return { datos, total, abonado, saldo };
}
