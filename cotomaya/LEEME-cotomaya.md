# Cómo mantener la web de Cotomaya

Todo lo que cambia (propiedades, destinos, tours, WhatsApp) vive en la carpeta `datos/`. El diseño no se toca.

- `datos/propiedades.json`: las propiedades.
- `datos/destinos.json`: Nacionales e Internacionales, sus países y las zonas de cada país.
- `datos/tours.json`: los paseos en yate y los tours.
- `datos/config.json`: WhatsApp, redes, logo, categorías, nombres de los tipos y mensajes.
- `datos-fuente/fotos-airbnb.json`: de dónde se bajaron las fotos de cada propiedad (no lo lee la página).

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
- **Tour:** en `tours.json`, copie un bloque. `ambito` es `nacional` o `internacional` (así sale en su grupo de la página de Tours), y `zona` es el `id` de la zona. En `precio_referencia` ponga por ejemplo `$30 por persona`, o `Por confirmar`. Mientras un precio no esté confirmado, deje `"ejemplo": true`: así sale la etiqueta "Ejemplo" y el aviso del pie. Un grupo sin tours muestra "Muy pronto" con un botón de WhatsApp.
- Fotos de tours: guárdelas en `fotos/tours/` y escriba solo el nombre del archivo, o use una ruta que empiece por `fotos/`.

## 5. WhatsApp, redes, logo y categorías

Todo en `datos/config.json`:

- `whatsapp`: el número sin `+` ni espacios (ejemplo `584245180022`). `whatsapp_visible`: como se lee (`+58 424-5180022`).
- `redes`: pegue el enlace de Instagram, Facebook, TikTok o YouTube. Vacía `""` = no se muestra.
- `logo`: cuando haya logo, guárdelo como `fotos/logo.webp` y escriba `"logo": "fotos/logo.webp"`.
- `categorias`: cambie el `nombre` y la `descripcion` de A (Lujo), B (VIP) y C (Standard). La descripción sale en la ficha y en el filtro.
- `mensajes`: el texto que llega por WhatsApp. `{propiedad}`, `{zona}` y `{tour}` se reemplazan solos.

## 6. Colores

Están en `estilos.css`, al principio (`:root`): azul marino, azul claro y dorado, aprobados por la clienta. El dorado claro nunca va como texto sobre blanco: para eso está `--dorado-oscuro`.

## 7. Antes de publicar

1. Abra la web con el servidor local (arriba) y pulse F12 > Consola: si falta un campo o una zona no existe, sale un aviso que dice `[Cotomaya]` con el nombre de la propiedad.
2. Revise en el teléfono (F12 > el ícono del celular): inicio, el catálogo (Nacionales e Internacionales), la ficha nueva y sus botones.
3. Toque los botones de Airbnb, Booking, etc. de las propiedades que cambió.
4. Si `preparar-fotos` o `preparar-video` avisaron que la web pasa de 500 MB, no publique sin hablarlo.
5. Publique como siempre (`publicar.ps1` de la skill webs-carlos). La carpeta `fotos-originales/` no se sube.
