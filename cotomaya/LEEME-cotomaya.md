# Cómo mantener la web de Cotomaya

Todo lo que cambia (propiedades, destinos, tours, WhatsApp) vive en la carpeta `datos/`. El diseño no se toca.

- `datos/propiedades.json`: las propiedades.
- `datos/destinos.json`: los países y sus zonas.
- `datos/tours.json`: los paseos en yate y los tours.
- `datos/config.json`: WhatsApp, redes, categorías A, B y C, nombres de los tipos y mensajes.

Los archivos se editan con VS Code. Cuidado con las comas: cada bloque `{ ... }` va separado por coma, y el último no lleva coma.

Para ver la web en su computadora antes de publicar (los datos no cargan abriendo el archivo directo):

```
cd paginas\cotomaya
python -m http.server 8000
```

y abra http://localhost:8000 en el navegador.

## 1. Agregar una propiedad

1. Ponga las fotos originales en una carpeta (la primera, por nombre, será la portada).
2. Abra `datos/propiedades.json`, copie el bloque completo de otra propiedad (desde `{` hasta `}`) y péguelo al final, antes del `]`, con una coma entre los dos bloques.
3. Cambie el `id`: minúsculas y guiones, sin acentos ni espacios (ejemplo: `casa-azul-tucacas`). Es lo que sale en el enlace.
4. Prepare las fotos (las reduce, las numera y las anota solas en el JSON):
   ```
   python herramientas/preparar-fotos.py "C:/ruta/fotos de la casa" casa-azul-tucacas
   ```
5. Si hay videos (hasta 5), uno por uno:
   ```
   python herramientas/preparar-video.py "C:/ruta/video.mp4" casa-azul-tucacas
   ```
6. Llene los campos:
   - `nombre`, `zona` (igual que en `destinos.json`, por ejemplo `Tucacas, Falcón`), `destino` (`venezuela` o `colombia`).
   - `tipo`: `villa`, `casa`, `apartamento`, `townhouse` o `penthouse`.
   - `categoria`: `A`, `B` o `C`.
   - `capacidad`, `habitaciones`, `banos`: números, sin comillas.
   - `resumen` (una o dos líneas para la tarjeta) y `descripcion` (para la ficha).
   - `incluye`: lista entre corchetes, cada cosa entre comillas.
   - `destacada`: `true` si sale en el inicio.
   - `ejemplo`: `false` para las propiedades reales.
   - `ubicacion_maps`: enlace de Google Maps (o `""` para no mostrar el botón).
7. Revise y publique (punto 6).

## 2. Quitar o pausar una propiedad

- Quitar: borre su bloque completo de `propiedades.json` (y la coma que sobre). Puede borrar también su carpeta en `fotos/propiedades/`.
- Pausar sin perder nada: agregue `"pausada": true,` en su bloque. Deja de verse en toda la web (y su enlace muestra "No encontramos esa propiedad"). Para activarla, cámbielo a `false` o bórrelo.

## 3. Enlaces de Airbnb, Booking, Expedia y TripAdvisor

En el bloque de la propiedad, dentro de `enlaces`, pegue el enlace del anuncio entre las comillas:

```
"enlaces": {
  "airbnb": "https://www.airbnb.com/rooms/...",
  "booking": "",
  "expedia": "",
  "tripadvisor": ""
}
```

Si una plataforma queda en `""`, su botón no aparece.

## 4. Agregar un destino o un tour

- Destino: en `destinos.json`, copie el bloque de Colombia y cambie `id` (minúsculas, por ejemplo `panama`), `nombre`, `descripcion`, `foto` y `zonas`. Después, en cada propiedad de ese país, ponga `"destino": "panama"`.
- Tour o paseo: en `tours.json`, copie un bloque. `tipo` es `yate` (sale en "Paseos en yate") o `tour` (sale en "Tours en ..." según su `destino`). En `precio_referencia` ponga por ejemplo `$30 por persona`, o `Por confirmar`.
- Fotos de tours: guárdelas en `fotos/tours/` y escriba solo el nombre del archivo, o use una ruta que empiece por `fotos/`.

## 5. WhatsApp, redes y categorías

Todo en `datos/config.json`:

- `whatsapp`: el número sin `+` ni espacios (ejemplo `584245180022`). `whatsapp_visible`: como se lee (`+58 424-5180022`).
- `redes`: pegue el enlace de Instagram, Facebook, TikTok o YouTube. Vacía `""` = no se muestra.
- `categorias`: cambie el `nombre` y la `descripcion` de A, B y C. La descripción sale en la ficha y en el filtro.
- `mensajes`: el texto que llega por WhatsApp. `{propiedad}`, `{zona}`, `{tour}` y `{destino}` se reemplazan solos.

## 6. Antes de publicar

1. Abra la web con el servidor local (arriba) y pulse F12 > Consola: si falta un campo o un destino no existe, sale un aviso que dice `[Cotomaya]` con el nombre de la propiedad.
2. Revise en el teléfono (F12 > el ícono del celular): inicio, el catálogo, la ficha nueva y sus botones.
3. Toque los botones de Airbnb, Booking, etc. de las propiedades que cambió.
4. Cuando ya no quede nada con `"ejemplo": true`, el aviso "de referencia" del pie se quita solo.
5. Si `preparar-fotos` o `preparar-video` avisaron que la web pasa de 500 MB, no publique sin hablarlo.
6. Publique como siempre (`publicar.ps1` de la skill webs-carlos).
