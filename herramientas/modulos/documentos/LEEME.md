# Módulo de documentos (panel administrativo)

Panel privado en `/admin` para que una agencia haga **cotización, proforma, comprobante de pago y voucher** con su mismo formato, los convierta uno en el siguiente con un toque y los mande en PDF por WhatsApp. Primer cliente: YouTravel (prompt 48e, 26-11-2026). Sirve igual para PF Travels y las próximas agencias: solo cambia la configuración.

**No es facturación fiscal.** Cada PDF lleva al pie "Documento no fiscal. No sustituye la factura." La factura sigue en la forma libre o en lo que exija el SENIAT.

Gratis y sin tarjeta: Cloudflare Workers + D1 (plan Free). Nada de R2.

## Cómo funciona

```
navegador ──> dominio del cliente ──> Worker del cliente
                                       ├─ /admin              el panel (HTML corto + app.js + pdf.js + app.css)
                                       ├─ /api/admin/...      la API (sesión y rol en cada consulta)
                                       └─ todo lo demás        pasa tal cual al Worker de Novedades (o a los archivos de la web)
```

- **Se monta encima del Worker que ya tiene la web.** `clientes/<cliente>/worker.js` hace `conDocumentos(config, novedades)`: lo que no es `/admin` ni `/api/admin/` lo atiende el Worker de Novedades sin ningún cambio. Si la agencia no tiene Novedades, se pasa `null` y lo demás va a los archivos de la web (`env.ASSETS`).
- **Datos en D1** (`esquema.sql`): `usuarios`, `sesiones`, `intentos`, `clientes`, `documentos` (el contenido completo va en JSON en `datos`), `contadores` (numeración) y `ajustes` (modo demostración).
- **Numeración:** `COT-0001`, `PRO-0001`, `CP-0001`, `VOU-0001` (prefijos en la configuración). El número sale del contador en la misma transacción que el INSERT y la columna es UNIQUE: aunque dos personas guarden a la vez, nunca se repite (probado con 10 guardados simultáneos). Un documento anulado conserva su número.
- **La cadena:** cotización → "Convertir en proforma" → "Registrar pago" (sale el comprobante y el pago queda en la proforma) → "Emitir voucher". Cada documento guarda `origen_id` y `cadena_id`. Dos toques seguidos no crean dos documentos. Si se anula un comprobante, su pago sale de la proforma.
- **Lo que debe un cliente** = saldo de sus proformas activas.
- **El PDF se arma en el teléfono o la computadora** con pdfmake (texto real, se puede copiar, pesa ~80 KB). Letras TTF de Fontsource por jsDelivr. La vista previa la pinta pdf.js. Las librerías se cargan solo al abrir un documento; la primera vez tarda un poco más y después quedan en caché.
- **Compartir por WhatsApp:** en el teléfono abre la hoja de compartir del sistema con el PDF; en la computadora descarga el PDF y abre WhatsApp Web con el mensaje listo.
- **Respaldo:** botón "Descargar respaldo" (solo Administrador): un Excel con Clientes, Documentos, Renglones y Pagos (SheetJS por CDN).
- **Borrador en el equipo:** lo que se está llenando se guarda en `localStorage` mientras se escribe; si se cierra la página, al volver aparece "Recuperamos lo que dejó a medio llenar".

## Seguridad

- Usuario y contraseña. Contraseñas con PBKDF2-SHA256 (100 000 iteraciones, el máximo de Workers) y sal propia. Nunca se guardan en claro.
- Sesión: cookie `doc_sesion` aleatoria (HttpOnly, Secure, SameSite=Strict) de 30 días; en D1 solo se guarda su SHA-256. Cambiar la contraseña o desactivar un usuario cierra sus sesiones.
- 5 intentos fallidos (por conexión y usuario) = 15 minutos de espera.
- Roles: **Administrador** ve todo, crea usuarios y descarga el respaldo. **Asesor** hace documentos y ve solo los suyos (un documento ajeno le responde "no existe"). Los clientes (nombre, cédula, teléfono) son de toda la agencia para que el autocompletado sirva; los saldos y documentos que ve un Asesor son solo los suyos.
- Escrituras solo con la cabecera `x-panel: 1` y el mismo origen. Todo se limpia y se recorta en el servidor (`src/contenido.js`) y el panel pinta con `textContent`: nada de HTML ni scripts.
- `/admin` y `/api/admin/` llevan `X-Robots-Tag: noindex` y no están en el sitemap. El panel tiene Content-Security-Policy.
- **No hay secretos del Worker:** las contraseñas viven cifradas en D1. Las de la demo y la del cliente quedan en `%USERPROFILE%\secretos\` (fuera de OneDrive y del repo).

## Archivos

| Archivo | Qué es |
|---|---|
| `src/index.js` | `conDocumentos(config, siguiente)`: rutas `/admin` y `/api/admin/` |
| `src/api.js` | entrar, documentos, convertir, pagos, anular, clientes, usuarios, respaldo |
| `src/contenido.js` | limpia el contenido de un documento y calcula total, abonado y saldo |
| `src/util.js` | textos, fechas, contraseñas (PBKDF2), cookies |
| `src/panel.js` | el HTML del panel, el manifiesto (instalable) y las cabeceras |
| `src/cliente/app.js` | la interfaz (JS clásico) |
| `src/cliente/pdf.js` | arma el PDF (el formato) |
| `src/cliente/app.css` | estilos; colores y letras vienen de la configuración |
| `esquema.sql` | las tablas |
| `clientes/<cliente>/config.json` | **la configuración de la agencia** (ver abajo) |
| `clientes/<cliente>/worker.js` | la entrada del Worker del cliente |
| `instalar.ps1`, `demo.ps1`, `pasar-a-real.ps1` | crear tablas, modo demostración y modo real |
| `scripts/` | ayudantes (Node y SQL) de esos tres |

## Cambiarle el formato a una agencia (`clientes/<cliente>/config.json`)

- `agencia`: nombre, RIF (si está vacío no sale), dirección, teléfonos, correo, web, WhatsApp.
- `documentos.<tipo>`: `titulo` (lo único que cambia entre los cuatro), `prefijo` de la numeración, `validez_dias` (cotización), `montos` (si muestra la tabla de montos; el voucher no), `pagos` (abonos y saldo) y `condiciones` (la lista fija del pie).
- `etiquetas`: los **textos fijos** del formato (Cliente, Cédula o RIF, Destino, Incluye…). Cambiarlos aquí cambia el panel y el PDF a la vez.
- `listas`: lo que sale para marcar con un toque en Incluye y No incluye, y las opciones de régimen, traslados y métodos de pago.
- `panel`: logo claro, íconos, letras (`fuentes_url`, `f_tit`, `f_txt`) y colores (`c1`, `c2`, `c3` forman el degradado).
- `pdf`: logo en **PNG** (pdfmake no lee WebP), letras TTF y el texto del pie.
- Cambios de **orden o de diseño** del PDF: `src/cliente/pdf.js` (función `armar`). Si una agencia necesita un orden distinto, agregar una opción a la configuración en vez de copiar el archivo.

Después de cambiar algo: publicar el Worker del cliente.

## Instalar en una agencia nueva

1. **Configuración:** copiar `clientes/youtravel/` a `clientes/<cliente>/` y cambiar `config.json`.
2. **Base D1:** `wrangler d1 create documentos-<cliente>` (gratis, sin tarjeta).
3. **Worker:**
   - Si ya tiene Novedades: en su `novedades/clientes/<cliente>/wrangler.jsonc` cambiar `main` a `../../../documentos/clientes/<cliente>/worker.js` y agregar, como en YouTravel, `"/admin", "/admin/*"` en `run_worker_first`, la regla `rules` de tipo Text para `**/cliente/*.js` y `**/cliente/*.css`, y el `d1_databases` con `binding: "DOCUMENTOS"`.
   - Si no tiene Novedades: crear `clientes/<cliente>/wrangler.jsonc` aquí (assets de la web, las mismas `rules` y `d1_databases`, `run_worker_first: ["/admin", "/admin/*", "/api/admin/*"]`) y en `worker.js` usar `conDocumentos(config, null)`.
4. **Tablas:** `.\instalar.ps1 <cliente>`
5. **Publicar** el Worker (YouTravel: `..\novedades\publicar.ps1 youtravel`).
6. **Demostración:** `.\demo.ps1 <cliente> -Url https://<dominio>` (borra todo, crea `demo` y una asesora de ejemplo, y carga datos de ejemplo por la API real). Las contraseñas quedan en `%USERPROFILE%\secretos\<cliente>-documentos-demo.txt`. Los datos de ejemplo de `scripts/d1.mjs` son de viajes; para otro rubro, cambiarlos ahí.
7. **Cuando pague (un solo comando):**
   ```
   .\pasar-a-real.ps1 <cliente> -Usuario patricia -Nombre "Patricia ..."
   ```
   Borra los datos y usuarios de ejemplo, reinicia la numeración en 0001, quita la franja de demostración y crea su usuario Administrador con una contraseña nueva (sale en pantalla y queda en `%USERPROFILE%\secretos\<cliente>-documentos.txt`). Ella crea a sus asesores desde Ajustes.

## Pruebas en la computadora

D1 local falla dentro de OneDrive, por eso la base de pruebas va en `%LOCALAPPDATA%\wrangler-local\<cliente>`:

```
cd ..\novedades
wrangler dev -c clientes\youtravel\wrangler.jsonc --persist-to "$env:LOCALAPPDATA\wrangler-local\youtravel"
cd ..\documentos
.\instalar.ps1 youtravel -Local
.\demo.ps1 youtravel -Local -Url http://127.0.0.1:8787
```

## Si algo falla con la base (recuperar D1)

- **Volver atrás en el tiempo (lo primero):** D1 guarda el historial de los últimos 7 días en el plan gratis.
  ```
  wrangler d1 time-travel info documentos-<cliente> --timestamp=2026-11-26T15:00:00Z -c <wrangler.jsonc>
  wrangler d1 time-travel restore documentos-<cliente> --timestamp=2026-11-26T15:00:00Z -c <wrangler.jsonc>
  ```
  Usar una hora de antes del problema (en UTC: hora de Venezuela + 4).
- **Copia completa en SQL:** `wrangler d1 export documentos-<cliente> --remote --output=respaldo.sql -c <wrangler.jsonc>` (guardarla fuera de OneDrive si tiene datos reales). Se restaura en una base nueva con `wrangler d1 execute <base> --remote --file=respaldo.sql`.
- **El Excel del botón "Descargar respaldo"** sirve para consultar y como última copia, pero no se vuelve a cargar solo.

## Límites del plan gratis (para toda la cuenta)

D1: 5 millones de filas leídas y 100 000 escritas por día, 5 GB. Workers: 100 000 peticiones por día. Un documento son unas 5 escrituras: sobra.
