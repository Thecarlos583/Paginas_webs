# ESTADO de Paginas_webs
Actualizado: 16-nov-2026. Contexto del negocio: `%USERPROFILE%\agencia-carlos\AGENTS.md` y `contexto\clientes.md`.

## Qué es
El repo **público** con las webs de clientes, las vistas previas para prospectos y las páginas modelo de la agencia. Cada carpeta es una web estática independiente. Es público a propósito: GitHub Pages gratis solo publica repos públicos. Por eso aquí **nunca** van claves, pagos ni datos privados de clientes.

## Cómo está hecho y cómo se publica
- HTML, CSS y JS sin build. Se construyen siempre con la skill **webs-carlos**: español venezolano, primero el celular y WhatsApp como llamado a la acción.
- Publicación: `git push` a `main` y GitHub Pages la sirve en `https://thecarlos583.github.io/Paginas_webs/<carpeta>/`.
- `vista-previa/<nombre>-<código>/`: vistas previas con dirección difícil de adivinar para mandar a prospectos.
- `vista-previa/rancho-luis-pmfp/` es solo una redirección a chaletrancholuis.com. **No borrarla**: esa dirección se mandó por WhatsApp.
- Cotomaya funciona con datos en JSON (`cotomaya/datos/`); su guía, las herramientas y los datos legales son internos y no se publican (están en `contexto-claude-code/paginas/cotomaya/`). Las fotos se bajan de Airbnb con un script, y la regla es no poner nunca el nombre real de la propiedad ni el de los anfitriones.

## Carpetas y estado
| Carpeta | Qué es | Estado |
|---|---|---|
| cotomaya | Cliente. Catálogo de propiedades A/B/C, Venezuela y Colombia, servicios de viaje, yates y lanchas | 17-nov (prompt-34, versión 17/11): **paleta de la portada que eligió la clienta** en toda la página: turquesa profundo `#134F5D`, respiro `#1C6676`, naranja en botones, coral y dorado en detalles, textos arena (sin negro ni fondos claros). Penthouse de Tucacas y Guacharaca como villa. Base legal: Privacidad y Créditos publicados; Aviso legal y Términos de reserva en borrador hasta tener los datos; política de contenido, referrer, enlaces `noopener noreferrer`, mapa de Google que carga al tocar, herramientas internas fuera de la web. Antes, 16-nov: logo oficial, olas, sin precios, Yates y lanchas, mapa de destinos interactivo. Volver atrás: etiqueta `antes-de-colores-claros` (y antes, `antes-de-premium`) |
| centro-quinta-miami | Vista previa para el prospecto Centro Quinta Miami (espacio para eventos con piscina) | 16-nov (prompt-36): web de neón de 6 páginas (inicio, paquetes, espacios, galería, cotizar, contacto), logo y fachada reales, 6 paquetes del catálogo de WhatsApp sin precios, cotizador con invitación en vivo, datos en `datos/*.json` y generador `contexto-claude-code/_generadores/quinta_miami.py`. Faltan los flyers del catálogo (carpeta `Descargas/quinta-miami-catalogo`), la dirección, fotos reales y el logo con fondo transparente |
| cotomaya-pruebas | Copia de prueba de Cotomaya (noindex, franja "Versión de prueba") | 14-nov: DESIGN.md, 6 animaciones, cargador y pestañas de Uiverse, botones físicos y Spline opcional (escena de ejemplo). Esperando que Carlos decida qué pasa a la real. Lista de qué copiar en su LEEME |
| golondrinas | Cliente (Sanare) | Publicada; fotos reales nuevas el 11-nov. Faltan fotos y videos sin editar |
| quinta-escape | Cliente | Publicada el 7-nov con fotos viejas; ahora hay churuata. Piloto de Cupo |
| hoku-hamaquita / hoku-turismo | Cliente Hoku | Publicadas el 9-nov (hamaquita entregada) |
| villa-campestre | Cliente Villa Gisela | Publicada |
| anubel, villaserena, mi-refugio, villa-santa-marta, agua-viva, tierra-latina, mamamina-lodge, perlacoral, posada-d-luigi, cabanas-el-bosque | Vistas previas para prospectos | Publicadas entre octubre y noviembre |
| casa-solar, el-andanes, espiritu-santo, flor-de-merida, la-solariega, los-aches | Demostraciones de posadas de Mérida (1-oct) | Publicadas |
| modelo-* (hotel, restaurante, spa, dental, tienda, fisioterapia, comida-casera) | Páginas modelo por rubro | Publicadas |
| vista-previa/* | Vistas previas viejas (El Manantial, Fisiosalud, Doña Casilda, Las Ross, etc.) | Publicadas |

## Pendientes, en orden de prioridad
1. Cotomaya: que la clienta revise la paleta turquesa y mande los datos legales (titular, RIF, dirección, correo, horario, anticipo, pagos, cancelación, entrada y salida, normas). Faltan también el logo con fondo transparente, el nombre real y la capacidad de la lancha, y el contrato. Lista y mensaje para la clienta en `contexto-claude-code\clientes\cotomaya\pendientes-web.md`. Para volver a la versión anterior: `git checkout antes-de-colores-claros -- cotomaya` y commit.
   - Cotomaya pruebas: Carlos revisa los toques visuales; lo que le guste se pasa a la real por `_generadores/` (spline_escena vacío). Lo que no, se borra la carpeta. Pagos y acuerdos con cada cliente: solo en `agencia-carlos\contexto\clientes.md` (este repo es público).
2. Golondrinas: cargar las fotos y videos que faltan cuando lleguen. Su video promocional no se sube a redes.
3. Quinta Escape: fotos nuevas con la churuata y el botón de Cupo cuando Cupo salga.
4. Prospectos calientes (Mamamina, D' Luigi, PerlaCoral): ajustar según lo que respondan.
5. La muestra de Posada Las Ross que estaba sin commit en la carpeta vieja quedó en el repo privado `archivo-claude-code/paginas-sin-publicar/las-ross` (sin fotos). No se subió aquí para no publicarla.

## Decisiones importantes
- Cada web debe ser distinta a la anterior, con referencias reales. La vara a superar es chaletrancholuis.com.
- Sin animaciones que van apareciendo al bajar.
- El chalet tiene repo y dominio propios (`chaletrancholuis`).
- Los prompts de cada web están en `agencia-carlos\claude\prompt-*.md`.
