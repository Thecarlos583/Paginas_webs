# Cómo mantener la web de Cotomaya

Todo lo que cambia (propiedades, destinos, tours, WhatsApp) vive en la carpeta `datos/`. El diseño no se toca.

- `datos/propiedades.json`: las propiedades.
- `datos/destinos.json`: Nacionales e Internacionales, sus países y las zonas de cada país.
- `datos/tours.json`: los paseos en yate y los tours.
- `datos/embarcaciones.json`: los yates y las lanchas (sección "⛵ Yates y lanchas" de Tours).
- `datos/textos.json`: los textos fijos de las páginas (títulos y frases cortas). Después de cambiarlos, Carlos vuelve a generar el sitio.
- `datos/config.json`: WhatsApp, redes, logo, categorías, nombres de los tipos, mensajes y el video de Yates y lanchas.
- `datos-fuente/fotos-airbnb.json`: de dónde se bajaron las fotos de cada propiedad (no lo lee la página).

> **Sin precios en ninguna parte.** Las tarifas cambian por temporada y por fin de semana: todo se consulta por WhatsApp. Donde iría un precio sale "💬 Consulte la tarifa para su fecha" con su botón. No agregue campos de precio.
>
> **Textos cortos:** una o dos líneas en el teléfono, con un emoji al inicio como máximo. Lo largo va como lista corta.

> **Regla de oro de los nombres:** una propiedad **nunca** lleva su nombre real en la web. Solo el nombre de marketing, que es el mismo título que tiene en Airbnb, copiado tal cual. Tampoco van nombres de anfitriones, reseñas, estrellas ni "Superhost".

Los archivos se editan con VS Code. Cuidado con las comas: cada bloque `{ ... }` va separado por coma, y el último no lleva coma.

Para ver la web en su computadora antes de publicar (los datos no cargan abriendo el archivo directo):

```
cd paginas\cotomaya
python -m http.server 8000
```

y abra http://localhost:8000 en el navegador.

## 1. Agregar una propiedad desde un enlace de Airbnb

1. Abra `datos/propiedades.json`, copie el bloque completo de otra propiedad (desde `{` hasta `}`) y péguelo al final, antes del `]`, con una coma entre los dos bloques.
2. Cambie el `id`: minúsculas y guiones, sin acentos ni espacios (ejemplo: `casa-azul-tucacas`). Es lo que sale en el enlace de la ficha.
3. Llene los campos con lo que dice el anuncio:
   - `nombre`: el título del anuncio de Airbnb, copiado igualito (con sus `|` y `•`). En la tarjeta, lo que va antes del primer `|` o `•` sale como título y el resto debajo, en pequeño.
   - `ambito`: `nacional` (Venezuela) o `internacional`.
   - `destino`: el país (`venezuela` o `colombia`) y `zona`: el `id` de la zona en `destinos.json` (`tucacas`, `chichiriviche`, `sanare`, `ciudad-flamingo`, `santa-marta`...).
   - `tipo`: `villa`, `casa`, `apartamento`, `townhouse`, `penthouse` o `habitacion` (habitación con desayuno).
   - `categoria`: `A` (Lujo), `B` (VIP) o `C` (Standard).
   - `capacidad`, `habitaciones`, `banos`: números, sin comillas (`2.5` para dos baños y medio).
   - `resumen` (una línea para la tarjeta), `descripcion` (para la ficha) e `incluye` (lista, cada cosa entre comillas).
   - `nota`: algo corto que el huésped debe saber ("Lencería y toallas no incluidas"). `""` = no se muestra.
   - `destacada`: `true` si sale en el inicio. `activa`: `true`.
   - `enlaces` > `airbnb`: el enlace limpio, por ejemplo `https://www.airbnb.com/rooms/1777764045451326018` (sin lo que viene después del `?`).
4. Saque la lista de fotos del anuncio (hasta 20) y bájelas:
   ```
   python herramientas/bajar-fotos-airbnb.py --leer-anuncio casa-azul-tucacas https://www.airbnb.com/rooms/NUMERO
   python herramientas/bajar-fotos-airbnb.py casa-azul-tucacas
   ```
   La primera línea anota las fotos en `datos-fuente/fotos-airbnb.json`; la segunda las baja a `fotos-originales/` (esa carpeta no se sube), las pasa a WebP y las anota solas en `propiedades.json` con su texto alternativo ("Piscina", "Habitación"...). Si alguna no baja, al final dice cuál.
5. Si la clienta manda las fotos originales, esas mandan sobre las de Airbnb (la primera, por nombre, es la portada):
   ```
   python herramientas/preparar-fotos.py "C:/ruta/fotos de la casa" casa-azul-tucacas
   ```
6. Si hay videos (hasta 5), uno por uno:
   ```
   python herramientas/preparar-video.py "C:/ruta/video.mp4" casa-azul-tucacas
   ```
7. Revise y publique (punto 7).

## 2. Pausar o quitar una propiedad

- Pausar sin perder nada: cambie `"activa": true` por `"activa": false`. Deja de verse en toda la web y su enlace muestra "Esta propiedad no está disponible por ahora". Para volver a mostrarla, póngalo en `true`.
- Quitar para siempre: borre su bloque completo de `propiedades.json` (y la coma que sobre) y su carpeta en `fotos/propiedades/`.

## 3. Enlaces de Airbnb, Booking, Expedia, Agoda y TripAdvisor

En el bloque de la propiedad, dentro de `enlaces`, pegue el enlace del anuncio entre las comillas:

```
"enlaces": {
  "airbnb": "https://www.airbnb.com/rooms/...",
  "booking": "",
  "expedia": "",
  "agoda": "",
  "tripadvisor": ""
}
```

Si una plataforma queda en `""`, su botón no aparece. TripAdvisor hoy solo acepta hoteles, así que normalmente queda vacío. El botón de WhatsApp sale siempre.

## 4. Destinos, zonas y tours

- **Zona nueva** (por ejemplo, otra playa de Falcón): en `destinos.json`, dentro de `zonas` del país, copie un bloque y cambie `id`, `nombre` y `descripcion`. `foto` vacía `""` = usa una foto de las propiedades de esa zona.
- **Quitar el "Próximamente" de Isla Margarita:** en `destinos.json`, en la zona `isla-margarita`, borre `"proximamente": true,` (o póngalo en `false`) y cambie la `descripcion`. Después cargue el apartamento con `"zona": "isla-margarita"`.
- **País nuevo** (por ejemplo, Panamá): en `destinos.json`, dentro del ámbito `internacional`, copie el bloque de Colombia y cambie `id` (`panama`), `nombre`, `descripcion` y `zonas`.
- **Tour:** en `tours.json`, copie un bloque. `ambito` es `nacional` o `internacional` (así sale en su grupo de la página de Tours), y `zona` es el `id` de la zona. No lleva precio: la tarjeta dice "💬 Consulte la tarifa para su fecha" y el botón "Consultar disponibilidad". Mientras el paseo no esté confirmado, deje `"ejemplo": true`: así sale la etiqueta "Ejemplo" y el aviso del pie. Un grupo sin tours muestra "Muy pronto" con un botón de WhatsApp.
- Fotos de tours: guárdelas en `fotos/tours/` y escriba solo el nombre del archivo, o use una ruta que empiece por `fotos/`.

## 4b. Yates y lanchas

En `datos/embarcaciones.json` hay un bloque por embarcación. Para agregar un yate o una lancha, copie un bloque y cámbielo:

- `id`: minúsculas y guiones (`yate-azul`). `nombre`: como se llama (por ahora "Lancha deportiva"; la clienta confirma el nombre real).
- `tipo`: `yate` o `lancha deportiva`. `zona`: por ejemplo `cayos de Morrocoy`.
- `capacidad` (número de personas) e `incluye` (lista corta): si están vacíos, la página no los muestra.
- `descripcion`: una línea.
- `fotos`: en `fotos/embarcaciones/<id>/`, en WebP de 1600 px como máximo, cada una con su `-600.webp` (use `preparar-fotos.py`). `videos`: MP4 sin audio con su portada `.webp` (el mismo `preparar-video.py`, o como dice el prompt 34: H.264, 720 px de alto como máximo, sin audio, `+faststart`).
- El botón "Consultar disponibilidad" manda: "Hola Cotomaya, quiero información de la {nombre} para un paseo por {zona}" (se cambia en `config.json` > `mensajes` > `embarcacion`).

El video de fondo de la cabecera de la sección está en `config.json` > `video_yates` (`archivo` y `portada`). Los videos cargan solo cuando se acercan a la pantalla; con ahorro de datos se ve solo la portada.

## 5. WhatsApp, redes, logo y categorías

Todo en `datos/config.json`:

- `whatsapp_principal`: el número principal sin `+` ni espacios (ejemplo `584145991961`). `whatsapp_principal_visible`: como se lee (`+58 414-5991961`). Lo usan todos los botones de la página.
- `whatsapp_secundario` y `whatsapp_secundario_visible`: el segundo número, que sale en Contacto y en el pie. `etiqueta_whatsapp_secundario`: el texto que va encima (por ahora "Otro número de contacto"). Si deja `whatsapp_secundario` vacío, ese botón desaparece.
- `redes`: pegue el enlace de Instagram, Facebook, TikTok o YouTube. Vacía `""` = no se muestra.
- `logo`: la insignia oficial, `img/logo-cotomaya-160.webp`. El original está en `img/logo-cotomaya-original.jpg`; si la clienta manda el archivo con fondo transparente, se rehacen la insignia y el favicon (`img/favicon-32.png`, `favicon-180.png`, `favicon-512.png`).
- `categorias`: cambie el `nombre` y la `descripcion` de A (Lujo), B (VIP) y C (Standard). La descripción sale en la ficha y en el filtro.
- `mensajes`: el texto que llega por WhatsApp. `{propiedad}`, `{zona}`, `{tour}` y `{nombre}` se reemplazan solos.

## 6. Colores

Están en `estilos.css`, al principio (`:root`), y explicados en `DESIGN.md`: los del logo (turquesa, coral y dorado) más azul marino y naranja, con fondos claros. **Nada de negro:** lo más oscuro es el azul marino `#16305A`. Los botones de reserva van en naranja. El dorado nunca va como texto sobre claro: para eso está `--dorado-oscuro`.

## 7. Antes de publicar

1. Abra la web con el servidor local (arriba) y pulse F12 > Consola: si falta un campo o una zona no existe, sale un aviso que dice `[Cotomaya]` con el nombre de la propiedad.
2. Revise en el teléfono (F12 > el ícono del celular): inicio, el catálogo (Nacionales e Internacionales), la ficha nueva y sus botones.
   Carlos además corre el verificador con `--cruces`: comprueba que nada decorativo ni animado tape textos o botones.
3. Toque los botones de Airbnb, Booking, etc. de las propiedades que cambió.
4. Si `preparar-fotos` o `preparar-video` avisaron que la web pasa de 500 MB, no publique sin hablarlo.
5. Publique como siempre (`publicar.ps1` de la skill webs-carlos). La carpeta `fotos-originales/` no se sube.
