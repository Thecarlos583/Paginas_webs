// Ayudante de Node para los scripts .ps1 del módulo de documentos.
// El SQL se escribe directo a un archivo en UTF-8: si PowerShell 5.1 captura la salida de Node, daña las tildes.
//   node d1.mjs clave                                              -> imprime una contraseña nueva
//   node d1.mjs sql-demo <archivo> <clave-demo> <clave-asesora>   -> SQL: borra todo, usuarios y cliente de ejemplo, modo demo
//   node d1.mjs sql-real <archivo> <usuario> "<nombre>" <clave>   -> SQL: borra todo y crea el Administrador real
//   node d1.mjs demo <url> <usuario> <clave> <usuario2> <clave2>  -> llena la demostración usando la API real del panel
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { claveNueva, hashClave } from "../src/util.js";

const [, , orden, ...args] = process.argv;
const sql = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const BORRAR = fs.readFileSync(fileURLToPath(new URL("./borrar-todo.sql", import.meta.url)), "utf8");

async function usuario(u, nombre, rol, clave) {
  return `INSERT INTO usuarios (usuario, nombre, rol, clave, activo, creado) VALUES (${sql(u.toLowerCase())}, ${sql(nombre)}, ${sql(rol)}, ${sql(await hashClave(clave))}, 1, ${Date.now()});`;
}

if (orden === "clave") {
  console.log(claveNueva());
} else if (orden === "sql-demo") {
  const [archivo, c1, c2] = args;
  const ahora = Date.now();
  fs.writeFileSync(archivo, [
    BORRAR,
    await usuario("demo", "Patricia (demostración)", "admin", c1),
    await usuario("maria.demo", "María (ejemplo)", "asesor", c2),
    `INSERT INTO clientes (nombre, documento, telefono, correo, busqueda, creado, actualizado) VALUES ('Carolina Vargas (ejemplo)', 'V-00000004', '0416-000-0004', '', 'carolina vargas ejemplo v 00000004 04160000004', ${ahora}, ${ahora});`,
    "UPDATE ajustes SET valor = '1' WHERE clave = 'demo';",
  ].join("\n"), "utf8");
} else if (orden === "sql-real") {
  const [archivo, u, nombre, clave] = args;
  if (!u || !nombre || !clave) { console.error("Faltan datos: usuario, nombre y clave."); process.exit(1); }
  fs.writeFileSync(archivo, [BORRAR, await usuario(u, nombre, "admin", clave)].join("\n"), "utf8");
} else if (orden === "demo") {
  await demo(...args);
} else {
  console.error("Órdenes: clave, sql-demo, sql-real, demo");
  process.exit(1);
}

async function sesion(url, usuario, clave) {
  const r = await fetch(url + "/api/admin/entrar", {
    method: "POST", headers: { "content-type": "application/json", "x-panel": "1", origin: url },
    body: JSON.stringify({ usuario, clave }),
  });
  if (!r.ok) throw new Error(`No se pudo entrar como ${usuario}: ${(await r.json()).error}`);
  const cookie = r.headers.get("set-cookie").split(";")[0];
  return async (ruta, metodo = "GET", cuerpo) => {
    const x = await fetch(url + "/api/admin/" + ruta, {
      method: metodo, headers: { cookie, "content-type": "application/json", "x-panel": "1", origin: url },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const d = await x.json();
    if (!x.ok) throw new Error(`${metodo} ${ruta}: ${d.error}`);
    return d;
  };
}

function dias(n) {
  return new Date(Date.now() - 4 * 3600 * 1000 + n * 864e5).toISOString().slice(0, 10);
}

async function demo(url, usuario, clave, usuario2, clave2) {
  url = url.replace(/\/$/, "");
  const yo = await sesion(url, usuario, clave);

  // 1. Los Roques: toda la cadena (cotización, proforma, comprobante con pago parcial y voucher).
  const roques = await yo("documentos", "POST", {
    tipo: "cotizacion", emision: dias(-6),
    contenido: {
      cliente: { nombre: "Andreína Salazar (ejemplo)", documento: "V-00000001", telefono: "0414-000-0001", correo: "andreina@ejemplo.com" },
      viaje: { clase: "paquete", destino: "Los Roques", ida: "2026-12-18", vuelta: "2026-12-21", noches: 3, adultos: 2, ninos: 0, infantes: 0,
        hotel: "Posada frente al mar (ejemplo)", regimen: "Pensión completa", traslados: "Aeropuerto-hotel-aeropuerto",
        vuelos: "Puerto Ordaz - Maiquetía - Los Roques, ida el 18/12 y regreso el 21/12 (horarios por confirmar)." },
      incluye: ["Boleto aéreo ida y vuelta", "Traslado aeropuerto-hotel-aeropuerto", "Alojamiento", "Pensión completa", "Excursiones indicadas", "Asistencia de la agencia durante el viaje"],
      no_incluye: ["Impuesto de entrada al parque", "Propinas", "Gastos personales"],
      renglones: [
        { descripcion: "Paquete Los Roques, 3 noches, por adulto", cantidad: 2, precio: 780 },
        { descripcion: "Boleto Puerto Ordaz - Maiquetía, ida y vuelta", cantidad: 2, precio: 180 },
      ],
      bs: { mostrar: false }, validez_dias: 3,
      notas: "Excursiones a cayos cercanos incluidas según el clima del día.",
    },
  });
  const proforma = await yo(`documentos/${roques.id}/convertir`, "POST", {});
  const pago = await yo(`documentos/${proforma.id}/pago`, "POST", { pago: { monto: 1000, fecha: dias(-3), metodo: "Zelle", referencia: "4821 (ejemplo)" } });
  const voucher = await yo(`documentos/${pago.id}/convertir`, "POST", {});
  const v = (await yo(`documentos/${voucher.id}`)).documento;
  await yo(`documentos/${voucher.id}`, "PUT", { emision: v.emision, contenido: { ...v.datos, viaje: { ...v.datos.viaje, confirmacion: "LRQ-58214" } } });

  // 2. Canaima: cotización sola.
  await yo("documentos", "POST", {
    tipo: "cotizacion", emision: dias(-1),
    contenido: {
      cliente: { nombre: "Luis Mendoza (ejemplo)", documento: "V-00000003", telefono: "0424-000-0003" },
      viaje: { clase: "paquete", destino: "Canaima y Salto Ángel", ida: "2027-02-12", vuelta: "2027-02-14", noches: 2, adultos: 2,
        hotel: "Campamento en la laguna (ejemplo)", regimen: "Pensión completa", traslados: "Aeropuerto-hotel-aeropuerto",
        vuelos: "Puerto Ordaz - Canaima, ida y vuelta en avioneta." },
      incluye: ["Boleto aéreo ida y vuelta", "Alojamiento", "Pensión completa", "Excursiones indicadas"],
      no_incluye: ["Impuesto de entrada al parque", "Propinas", "Gastos personales"],
      renglones: [{ descripcion: "Paquete Canaima, 3 días y 2 noches, por adulto", cantidad: 2, precio: 650 }],
      validez_dias: 3, notas: "La excursión en curiara al Salto Ángel depende del nivel del río.",
    },
  });

  // 3. Margarita: la hace la asesora de ejemplo (para probar que un Asesor no ve lo de otro).
  const otra = await sesion(url, usuario2, clave2);
  await otra("documentos", "POST", {
    tipo: "cotizacion", emision: dias(0),
    contenido: {
      cliente: { nombre: "Familia Rodríguez (ejemplo)", documento: "V-00000002", telefono: "0412-000-0002" },
      viaje: { clase: "paquete", destino: "Isla de Margarita", ida: "2027-01-05", vuelta: "2027-01-09", noches: 4, adultos: 2, ninos: 2,
        hotel: "Hotel en Playa El Agua (ejemplo)", regimen: "Todo incluido", traslados: "Aeropuerto-hotel-aeropuerto" },
      incluye: ["Boleto aéreo ida y vuelta", "Traslado aeropuerto-hotel-aeropuerto", "Alojamiento", "Todo incluido"],
      no_incluye: ["Seguro de viaje", "Excursiones opcionales", "Gastos personales"],
      renglones: [
        { descripcion: "Paquete por adulto, 4 noches", cantidad: 2, precio: 520 },
        { descripcion: "Paquete por niño, 4 noches", cantidad: 2, precio: 290 },
        { descripcion: "Boleto Puerto Ordaz - Porlamar, ida y vuelta", cantidad: 4, precio: 120 },
      ],
      bs: { mostrar: true, tasa: 300, fecha: dias(0) }, validez_dias: 3,
    },
  });
  console.log("Demostración lista: 3 cotizaciones, 1 proforma, 1 comprobante y 1 voucher.");
}
