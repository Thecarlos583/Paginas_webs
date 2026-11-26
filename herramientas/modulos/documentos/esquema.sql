-- Módulo de documentos (cotización, proforma, comprobante de pago y voucher). Cloudflare D1 (SQLite).
-- Instalar:  wrangler d1 execute <base> --remote --file=esquema.sql -c <wrangler.jsonc>
-- Se puede correr de nuevo sin dañar nada (todo es IF NOT EXISTS / INSERT OR IGNORE).

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE COLLATE NOCASE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'asesor')),
  clave TEXT NOT NULL,                 -- pbkdf2$<iteraciones>$<sal>$<hash>, nunca la contraseña
  activo INTEGER NOT NULL DEFAULT 1,
  creado INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sesiones (
  token TEXT PRIMARY KEY,              -- SHA-256 del valor de la cookie (la cookie sola no sirve si se filtra la base)
  usuario_id INTEGER NOT NULL,
  vence INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sesiones_usuario ON sesiones (usuario_id);

CREATE TABLE IF NOT EXISTS intentos (
  clave TEXT PRIMARY KEY,              -- "<ip>|<usuario>"
  n INTEGER NOT NULL,
  hasta INTEGER NOT NULL DEFAULT 0,    -- bloqueado hasta (ms)
  vence INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  documento TEXT NOT NULL DEFAULT '',  -- cédula o RIF
  telefono TEXT NOT NULL DEFAULT '',
  correo TEXT NOT NULL DEFAULT '',
  direccion TEXT NOT NULL DEFAULT '',
  busqueda TEXT NOT NULL DEFAULT '',   -- nombre y documento en minúsculas y sin tildes
  creado_por INTEGER,
  creado INTEGER NOT NULL,
  actualizado INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS clientes_busqueda ON clientes (busqueda);

CREATE TABLE IF NOT EXISTS contadores (
  tipo TEXT PRIMARY KEY,
  n INTEGER NOT NULL
);
INSERT OR IGNORE INTO contadores (tipo, n) VALUES ('cotizacion', 0), ('proforma', 0), ('comprobante', 0), ('voucher', 0);

CREATE TABLE IF NOT EXISTS documentos (
  id INTEGER PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('cotizacion', 'proforma', 'comprobante', 'voucher')),
  numero TEXT NOT NULL UNIQUE,         -- COT-0001: el contador y el UNIQUE impiden que se repita
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'anulado')),
  cliente_id INTEGER,
  usuario_id INTEGER NOT NULL,         -- asesor responsable (el Asesor solo ve los suyos)
  creado_por INTEGER NOT NULL,
  origen_id INTEGER,                   -- el documento del que salió (cotización -> proforma -> comprobante -> voucher)
  cadena_id INTEGER,                   -- el primero de la cadena
  emision TEXT NOT NULL,               -- AAAA-MM-DD, hora de Venezuela
  cliente_nombre TEXT NOT NULL DEFAULT '',
  destino TEXT NOT NULL DEFAULT '',
  total REAL NOT NULL DEFAULT 0,
  abonado REAL NOT NULL DEFAULT 0,
  saldo REAL NOT NULL DEFAULT 0,
  datos TEXT NOT NULL,                 -- JSON con todo el contenido del documento
  busqueda TEXT NOT NULL DEFAULT '',
  creado INTEGER NOT NULL,
  actualizado INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS documentos_usuario ON documentos (usuario_id, creado DESC);
CREATE INDEX IF NOT EXISTS documentos_cliente ON documentos (cliente_id);
CREATE INDEX IF NOT EXISTS documentos_cadena ON documentos (cadena_id);
CREATE INDEX IF NOT EXISTS documentos_creado ON documentos (creado DESC);

CREATE TABLE IF NOT EXISTS ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('demo', '0');
