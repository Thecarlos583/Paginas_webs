# YouTravel Agencia de Viajes · DESIGN.md

Web de la clienta (Puerto Ordaz). Desde el 26-11 (prompt-48c): logo real, letras de la marca, datos reales y sin precios. Generada con `contexto-claude-code/herramientas/agencias/agencia.py youtravel`. Los datos viven en `datos/*.json`; el diseño, en `herramientas/agencias/temas/youtravel.css`.

## Idea
En esta página, **la "o" del logo (un aro con un avioncito)** se vuelve **la ventana por donde se asoma cada viaje**: la portada se abre desde el aro, el aro se llena mientras usted arma su maleta y las rutas curvas salen de él.

Prueba del competidor: otra agencia de Puerto Ordaz no tiene un aro en su nombre; la idea solo sirve aquí.

## Referencias (qué tomo de cada una)
- **Black Tomato** (blacktomato.com): destinos como capítulos grandes de foto con una sola línea; nada de tarjetas pequeñas.
- **Explore Worldwide** (explore.co.uk): ficha de viaje con itinerario día por día plegable y "qué incluye / qué no" lado a lado.
- **Intrepid Travel** (intrepidtravel.com): filtros del catálogo como chips con contador de resultados en vivo.
- **Awwwards, sitios de aerolíneas y viajes** (categoría Travel): titulares geométricos enormes, mucho blanco y un solo color vivo.
- **Godly / landings.dev**: botones con un degradado fino como firma de marca y sombras casi nulas.

## Últimas 5 (no parecerse)
Oasis (Caprasimo, arena y turquesa, mapa de senderos), Faraona (Brygada, verde y dorado, reloj de sol), Vistas de Oriana (Italiana, hora del día), 0295 VIP (Gloock, azul noche, carta de navegación), Villa 52 (Federo, piscina art déco). Esta: **blanco luminoso + casi negro azulado + degradado turquesa a violeta**, sans geométrico grueso, sin serif, sin papel ni crema.

## Tipografía (letras de la marca, 48c)
- Títulos: **Montserrat** 700/800. Botones y etiquetas con peso: Montserrat 600.
- Texto: **Questrial** (solo tiene 400; no se le simula negrita).
- Acento: **Satisfy** (Google Fonts), la más parecida a Sprint LP, que no llegó. Solo en acentos cortos: debajo del nombre de cada destino y de cada paquete, y el lema en el pie. Nunca en párrafos, botones ni menús; nunca menor de 22 px.
- Patrón de la marca: título en Montserrat, debajo el lugar en script y una etiqueta pequeña en Questrial ("Los Roques" / *Archipiélago* / NACIONAL).

## Botones (48c)
Un solo sistema: principal con el degradado, secundario con contorno, WhatsApp en verde. 52 px de alto, radio redondo, texto en una línea, se encogen a 0,97 al tocar. En el teléfono van a lo ancho, uno debajo del otro, con 12 px.

## Colores (contraste medido)
| Uso | Color | Contraste |
|---|---|---|
| Fondo principal (blanco cálido) | #FAF9F7 | |
| Fondo alterno (gris muy claro) | #F0F1F4 | |
| Tinta (la del logo) | #0B1C23 | 16,4:1 sobre #FAF9F7 |
| Texto suave | #4A5168 | 7,6:1 |
| Sección oscura | #141A2E con texto #F4F5F8 | 15,6:1 |
| Degradado de marca | #0B7F8C → #6B3FD6 | texto blanco 4,9:1 y 6,2:1 |
| Turquesa claro (solo trazos sobre oscuro) | #3FD0D4 | 9,8:1 sobre #141A2E |
| WhatsApp | #157F45 con texto blanco | 5,0:1 |

El degradado solo vive en: el botón principal, el aro, una línea fina por pantalla y un número grande. Nunca en bloques enteros.

## Forma
- Radios: fotos y tarjetas **24 px**; botones y chips **redondos del todo** (eco del aro).
- Sombras: casi ninguna; solo lo que flota (hoja del cotizador, visor, barra de abajo).
- Motivo: rutas curvas finas que salen de un aro (SVG generado), como divisores y fondos sutiles. En el teléfono, máximo una animada por pantalla.

## Páginas (20) frente a Cotomaya (15)
| YouTravel | Lleva | En Cotomaya |
|---|---|---|
| index.html | Portada "El aro se abre", buscador rápido, tablero de paquetes destacados, destinos en galería horizontal (fijada en PC), servicios, "Cómo funciona" con el avioncito, cierre | index |
| paquetes.html | Catálogo: filtros (ámbito, destino, duración, personas) en la URL, panel "Filtrar" en el teléfono, contador, vacío amable, **comparador** de 2 o 3 | hospedajes |
| paquete-<id>.html (11) | Galería con visor, itinerario día por día, incluye/no incluye, precio, mini cotizador, **la maleta**, otros paquetes | propiedad |
| destinos.html | 12 destinos reales (6 nacionales, 6 internacionales) con foto grande, una línea y sus paquetes | destino, cayos |
| servicios.html | 6 servicios con foto; boletos con su mini formulario | viajes |
| grupos.html | Empresa, graduación, familia y amigos, con formulario que arma el WhatsApp | (no tiene) |
| galeria.html | Mosaico con filtros (playas, montaña, ciudades, internacional) y visor | galeria |
| cotizar.html | Cotizador completo, políticas en pestañas, preguntas en acordeón | reservar |
| contacto.html | WhatsApp, C.C. Portofino, "Cómo llegar" (Google Maps), horario de ejemplo, instalar en el teléfono | contacto, como-llegar |
| creditos.html | Autores y licencias de cada foto y del video | creditos |

## Firma y momentos
1. **El aro se abre** (firma): el aro se dibuja con su degradado y desde su centro se abre en círculo el video de la playa (PC) o la foto (teléfono), una sola vez al cargar.
2. **Destinos en galería horizontal** que avanza al bajar (solo computadora; en el teléfono, carrusel normal).
3. **El avioncito** recorre una ruta curva mientras se baja por "Cómo funciona".
4. **Comparador** con transición (tarjetas que se deslizan en el teléfono).
5. **Novedad: "Su maleta"**: lista de equipaje según el tipo de viaje; cada cosa marcada llena el aro con el degradado (se guarda en el teléfono).

## Instalable
`manifest.webmanifest`, `sw.js` (guarda las páginas para abrir rápido), íconos 192/512 y "maskable". Botón "Instalar en su teléfono" en contacto, solo cuando el navegador lo permite; nota para iPhone.
