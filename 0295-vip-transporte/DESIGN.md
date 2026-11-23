# 0295 VIP Transporte Ejecutivo: sistema de diseño

Vista previa de prospección (prompt-43). Datos de flota, rutas y precios de ejemplo; WhatsApp real.
Todo sale de `datos/*.json` con `_generadores/traslados.py` (sirve también para Prince Tours y otros negocios de traslados: cambian los JSON y el tema CSS).

## Concepto: "Carta de navegación"
La web se lee como una carta de ruta: la isla de Margarita en línea fina, rutas doradas punteadas que se dibujan y puntos que avanzan. Ejecutivo y sereno: azul noche para la cabecera, el pie y los acentos; marfil para leer.

## Referencias (qué tomé de cada una)
- **Blacklane**: el buscador de traslado como primer elemento útil debajo de la portada, con desde, hasta y fecha.
- **Innmotion (Awwwards, Portugal)**: fotos de flota grandes y a sangre en vez de tarjetas chicas.
- **Bell & Shanks ("The Art of Arrival")**: tono de llegada; el recibimiento en el aeropuerto como momento central (de ahí el letrero con nombre).
- **Arbutus Chauffeur**: una página por servicio, lista de servicios corta y sin ruido.
- **Shuttlelane**: tabla de tarifas por ruta y vehículo, legible de un vistazo.

## Diferencias con las últimas 5 (registro-rotacion)
Cotomaya (olas, atardecer, petróleo y coral), Faraona (reloj de sol, verde y medallones), Vistas de Oriana (láminas de herbario, hora del día), Oasis (curvas de nivel, caprasimo), Quinta Miami (neón). Aquí: cartografía náutica, azul noche + marfil + dorado arena, Gloock + Archivo, sin olas, sin curvas de nivel, sin medallones.

## Colores (contraste medido ≥ 4,5:1 en texto)
| Nombre | Hex | Uso |
|---|---|---|
| noche | #0F1E33 | cabecera, pie, portada, secciones de acento |
| noche-2 | #172B46 | tarjetas sobre noche |
| marfil | #F6F1E6 | fondo de lectura |
| marfil-2 | #ECE4D3 | bandas alternas, bordes suaves |
| tinta | #17202E | texto sobre marfil (14,5:1) |
| tinta-suave | #4A5363 | texto secundario sobre marfil (6,9:1) |
| dorado | #D2AE62 | botón principal (texto noche, 8:1), líneas de ruta, bordes de 1 px |
| dorado-oscuro | #7A5B1E | texto dorado sobre marfil (5,6:1) |
| plata | #BAC2CC | acento sobre noche (texto 9,3:1) |
| turquesa | #3BC2BA | acento puntual sobre noche (el mar) |
| turquesa-oscuro | #127A74 | turquesa sobre marfil (4,6:1) |

## Tipografía
- **Gloock** (títulos): serif de contraste alto con presencia, solo peso 400. Escala 1,25: 15 / 19 / 24 / 30 / 38 / 48 / 60 / 76.
- **Archivo** (texto y datos): sans técnico; ancho 100 para texto, 112 para cifras y precios (tabular).
- Nada de mayúsculas sostenidas en etiquetas; nada de monoespaciada.

## Espacios, radios, sombras
- Base 8 px; secciones 72 px (teléfono) a 120 px (computadora).
- Radios por jerarquía: botones 999 px (píldora), fotos 4 px, hoja del cotizador 20 px arriba. Sin radio único para todo.
- Sombras solo en lo que flota (hoja, visor, barra de abajo): `0 18px 40px -18px rgba(15,30,51,.45)`.

## Motivo
Líneas de ruta finas y punteadas en dorado (divisores y fondos sutiles), puntos de origen y destino como anillos. Las estrellas del logo solo en un detalle fino del pie. Como máximo un trazo animado por pantalla en el teléfono.

## Componentes
Cabecera azul noche con la insignia en círculo marfil; barra de abajo (Inicio, Flota, Rutas, Cotizar, WhatsApp); mapa de la isla con rutas; tablero de rutas; tarjetas de vehículo a sangre; comparador; filtros en la URL con panel "Filtrar"; visor a pantalla completa; cotizador (hoja en el teléfono, modal en computadora, completo en cotizar.html); pestañas de políticas; acordeón de preguntas.

## Firma y novedades
- **Firma "La ruta se dibuja"**: la ruta dorada se traza sobre el mapa y un punto la recorre (portada y cada ficha de ruta). En el teléfono, una sola vez al cargar.
- **Novedad 1: el vehículo se llena en vivo**: en el cotizador, la planta del vehículo muestra los asientos y el maletero ocupándose con cada + y −; si no caben, recomienda el siguiente.
- **Novedad 2: el letrero de recibimiento**: si pide letrero, ve en vivo el cartel con su nombre como lo verá al salir del aeropuerto.
- Además: tablero de rutas con precio desde, flota en galería horizontal que avanza al bajar (solo computadora), pasos de "Cómo funciona" unidos por una línea que se dibuja, comparador que resalta el vehículo que le sirve.

## Páginas (24) frente a Cotomaya (15 archivos, 7 plantillas con fichas por parámetro)
| Página | Lleva |
|---|---|
| index.html | portada con mapa y ruta, cotizador rápido, tablero de rutas, flota, servicios, cómo funciona, lo que cuidamos, cierre |
| flota.html | filtros en la URL, contador, tarjetas, comparador |
| vehiculo-sedan / -camioneta / -van | galería con visor, datos, ideal para, precios por ruta, mini cotizador, otros vehículos |
| rutas.html | mapa con todas las rutas, filtro por origen, tabla de precios (tarjetas en el teléfono) |
| ruta-<id> (6) | mapa con su ruta dibujada, precios por vehículo, qué incluye, cotizar, otras rutas |
| servicios.html | cada servicio con foto, para quién y cotizar |
| servicio-<id> (6) | detalle, cómo funciona, vehículos sugeridos, preguntas, cotizar |
| la-isla.html | los lugares que cubrimos y un recorrido sugerido (lugares reales) |
| empresas.html | convenios, formulario que arma el WhatsApp |
| galeria.html | mosaico con filtros y visor |
| cotizar.html | cotizador completo, políticas en pestañas, preguntas en acordeón |
| contacto.html | WhatsApp, zona, horario de ejemplo, último llamado |
