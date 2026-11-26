# Módulo de Novedades con panel

Sirve para que un cliente publique él mismo, desde el teléfono, artículos cortos (anuncios, noticias). Cada artículo tiene su propio enlace que, al compartirlo por WhatsApp, sale con su título, su subtítulo y su foto. Primer cliente: YouTravel (prompt 48d, 26-11-2026).

Gratis y sin tarjeta: Cloudflare Workers + Workers KV, en plan Free. Nada de R2.

## Cómo funciona

```
visitante ──> dominio del cliente (Cloudflare) ──> Worker "<cliente>"
                                                   ├─ archivos de la web (Paginas_webs/<cliente>, "static assets")
                                                   ├─ /novedades            lista (HTML armado en el servidor)
                                                   ├─ /novedades/<slug>     artículo con su <title>, descripción y Open Graph
                                                   ├─ /novedades/foto/<id>  y /novedades/compartir/<id>.jpg   (fotos en KV)
                                                   ├─ /panel                panel de la clienta (noindex)
                                                   ├─ /api/...              API del panel (con sesión)
                                                   └─ /sitemap.xml          el del sitio + los artículos
```

- **Por qué un Worker y no GitHub Pages:** WhatsApp lee el título y la foto del HTML que devuelve el servidor. Una página estática no puede tener un Open Graph distinto por artículo. Por eso toda la web del cliente se sirve desde el Worker (los archivos estáticos no cuentan como peticiones del Worker; solo las rutas de `run_worker_first` lo hacen).
- **La plantilla:** el Worker no tiene diseño propio. Toma `novedades.html` del sitio (mismo menú, pie y estilos), llena `[data-novedades]` con las tarjetas y, para cada artículo, reemplaza el `<main>` y las etiquetas `<meta>`. Las rutas relativas de la plantilla pasan a absolutas y se marca `<html data-raiz="/">` (el `sitio.js` del generador lo usa para sus enlaces).
- **Guardado (KV):** `indice` (lista corta), `art:<slug>`, `foto:<id>` (WebP o JPEG, unos 300 KB), `compartir:<id>` (JPEG de 1200 x 630 para WhatsApp), `fallos:<ip>` y `bloqueo:<ip>`.
- **Fotos:** el teléfono las achica antes de subirlas (WebP de máximo 1600 px y ~300 KB; si el navegador no sabe hacer WebP, como algunos iPhone, JPEG). Además arma la de 1200 x 630 para compartir. El servidor revisa los bytes: solo acepta WebP o JPEG de verdad.
- **Seguridad:** la contraseña es el secreto `PANEL_CLAVE` del Worker (nunca en el repo). La sesión es una cookie firmada con la contraseña (HttpOnly, Secure, SameSite=Strict) que dura 30 días: si se cambia la contraseña, se cierran todas las sesiones. Después de 5 intentos fallidos desde la misma conexión, hay que esperar 15 minutos. Las escrituras exigen la cabecera `x-panel: 1` y el mismo origen. Todo lo que escribe la clienta se escapa (el panel lo pinta con `textContent`). `/panel` y `/api/` llevan noindex y están bloqueados en `robots.txt`.
- **Enlace del artículo:** `/novedades/<título-en-minúsculas>` (sin tildes, máximo unos 70 caracteres; si se repite, `-2`). Al editar, el enlace no cambia.
- **Límites:** título 90, subtítulo 160, desarrollo 1500 caracteres (`src/util.js`, `LIMITES`).

## Archivos

| Archivo | Qué es |
|---|---|
| `src/index.js` | rutas del Worker |
| `src/api.js` | entrar, salir, crear, editar y borrar |
| `src/publico.js` | lista, artículo, fotos y sitemap |
| `src/panel.js` | el panel (HTML, CSS y JS en un solo archivo) |
| `src/datos.js`, `src/util.js` | guardado en KV, textos, fechas y sesión |
| `clientes/<cliente>/wrangler.jsonc` | **la configuración del cliente**: nombre, dominio, WhatsApp, colores, letras, logo, íconos, imagen por defecto y KV |
| `imagen_marca.py` | arma la imagen por defecto (degradado + logo) |
| `publicar.ps1` | publica un cliente: `.\publicar.ps1 youtravel` |
| `redireccion-www/` | Worker único que manda `www.` al dominio sin `www` (sirve para todos los clientes) |

## Instalar en un cliente nuevo

1. **La web tiene que tener `novedades.html`** con el menú y el pie del sitio y un elemento `data-novedades` donde van las tarjetas, más los estilos `nov-*`.
   - Agencias (generador `contexto-claude-code/herramientas/agencias/agencia.py`): en `datos/config.json` poner `"novedades": true` y `url_publica` con el dominio, y correr el generador. Hace el menú (antes de Contacto), el pie, `novedades.html`, el CSS, el `sitemap.xml` y el `robots.txt`.
   - Otras webs (posadas): copiar una página del sitio como `novedades.html`, vaciar el `<main>` y dejar `<div data-novedades></div>`. Copiar el bloque `/* [novedades] */` de `agencias/base/base.css` y ajustar los colores. Agregar "Novedades" al menú, al pie y al sitemap.
2. **Espacio de guardado:** `wrangler kv namespace create novedades-<cliente>`.
3. **Configuración:** copiar `clientes/youtravel/wrangler.jsonc` a `clientes/<cliente>/` y cambiar `name`, `assets.directory`, el id de KV y todo `vars.CLIENTE`.
4. **Imagen por defecto:** `python imagen_marca.py <logo-claro.png> <sitio>/img/novedades-compartir.jpg "#color1,#color2,#color3"`.
5. **Publicar:** `.\publicar.ps1 <cliente>` (queda en `https://<cliente>.cupo-app.workers.dev` para probar).
6. **Contraseña:** generarla y guardarla en `%USERPROFILE%\secretos\<cliente>-panel.txt`. Subirla con `wrangler secret bulk <archivo.json> -c clientes/<cliente>/wrangler.jsonc`, con un JSON `{"PANEL_CLAVE":"..."}` temporal que se borra después. **No** usar `echo ... | wrangler secret put`: PowerShell agrega un salto de línea y la contraseña queda distinta.
7. **Dominio:** el cliente (o Carlos) agrega el dominio en Cloudflare (plan Free) y cambia los nameservers en Porkbun. Cuando la zona esté activa: descomentar `routes` con `custom_domain: true`, agregar `www.<dominio>` en `redireccion-www/wrangler.jsonc`, publicar los dos y poner `workers_dev: false`. Activar **Always Use HTTPS** en Cloudflare (SSL/TLS > Edge Certificates).

## Cambiar la contraseña

1. Escribir la nueva en `%USERPROFILE%\secretos\<cliente>-panel.txt`.
2. Subirla como en el paso 6. Todas las sesiones abiertas se cierran solas.

## Publicar cambios de la web

La web del cliente ya no se publica con GitHub Pages sino con el Worker: después del `git push` de siempre, correr `.\publicar.ps1 <cliente>`. Si no, el dominio sigue mostrando la versión anterior.

## Límites del plan gratis (para toda la cuenta)

100 000 peticiones al Worker por día (los archivos estáticos no cuentan), 100 000 lecturas de KV y 1000 escrituras de KV por día, y 1 GB de KV. Una publicación son unas 4 escrituras, así que sobra.
