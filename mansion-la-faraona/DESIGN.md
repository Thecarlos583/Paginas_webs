# Mansión La Faraona · diseño

Vista previa de mejora de mansionlafaraona.com, hecha con el material real del negocio (catálogo nuevo, presentación, flyer, fotos y videos). Generador: `contexto-claude-code/_generadores/faraona.py` (+ `faraona_estilos.css`, `faraona_sitio.js`, `faraona_medios.py`).

## Idea
En esta página, **el horario del Full Day (9:00 a 5:00, y la noche de 6 a 12)** se vuelve **un reloj de sol**: el sol dorado recorre un arco con las horas marcadas, y cada hora abre una ventana redonda (la forma de la insignia) con el video real de ese momento. La misma forma redonda enmarca fotos en toda la web.

Prueba del competidor: otro hotel campestre de Carabobo no tiene este horario con estos momentos (coctel, desayuno criollo, parrilla de leña, toro mecánico, tasca de piedra) ni esta insignia.

## Referencias (qué tomo de cada una)
- **Tabacón (Costa Rica):** tarjetas de habitación con foto, una línea y un solo botón; menú que separa estadía de experiencias.
- **Chablé Yucatán (México):** foto a sangre con mucho aire alrededor, tipografía serif fina y textos de una línea.
- **Borgo Santo Pietro (Toscana):** tono campestre de lujo sin recargar: crema, verde y detalles finos; secciones que alternan foto y texto.
- **Hacienda San Gabriel de las Palmas (México):** la hacienda como recorrido por espacios, cada uno con su foto y para qué sirve.
- **Land-book, categoría hoteles:** catálogos con filtros en panel lateral y resultados contados; fichas con tabla de tarifas convertida en tarjetas en el teléfono.

## Distinta a las últimas 5 del registro
| | Faraona | Últimas (Oriana, Quinta Miami, Cotomaya, D' Luigi, PerlaCoral) |
|---|---|---|
| Estructura | catálogo de planes + reloj de sol con videos | herbario, neón, pase de viaje, día sin reloj, collar |
| Fuentes | **Brygada 1918 / Golos Text** | Rosarivo, Yellowtail, Cormorant, Bricolage |
| Paleta | verde campestre, crema y beige, dorado de 1 px | verde botánico con naranja, neón, petróleo con coral |
| Forma | círculo de la insignia (medallones) + esquinas rectas de 3 px | arcos, vidrio, láminas |
| Firma | reloj de sol con ventana redonda de video | sol que cruza el cielo con deslizar (D' Luigi) |
| Novedad | **precio que rueda como contador de bomba** al cambiar de plan de comidas; **mapa aéreo tocable** sobre la foto real del complejo | |

## Colores (contraste medido)
| Nombre | Hex | Uso |
|---|---|---|
| Verde Faraona | `#0D4A33` | cabecera, pie, secciones de acento, botones (texto crema 9,1:1) |
| Verde noche | `#08321F` | pie y capa del video |
| Crema | `#F7F1E3` | fondo general |
| Beige | `#ECE1CB` | secciones alternas |
| Tinta | `#18291F` | texto sobre crema (13,6:1) |
| Dorado | `#B8913F` | líneas de 1 px, íconos, numeración (nunca texto chico sobre crema) |
| Dorado claro | `#DDBB6E` | texto dorado sobre verde (5,7:1) |
| Dorado texto | `#7A5A16` | texto dorado sobre crema (5,7:1) |
| Verde hoja | `#A9C79A` | etiquetas y estados al tocar (texto tinta 8,2:1) |
| WhatsApp | `#0E7A41` | solo el botón de WhatsApp (texto blanco 5,4:1) |
| Atardecer | `#E9A04B` | solo el cielo del Full Night |

Nada negro: lo más oscuro es verde noche.

## Tipografía
- **Brygada 1918** 500/600: títulos. Serif clásica de libro, con presencia, sin aire egipcio de disfraz.
- **Golos Text** 400/500/600: texto, botones, precios (números tabulares).
- Escala: 14 · 16 · 20 · 28 · 44 (móvil) / 14 · 17 · 22 · 34 · 64 (PC). Titulares con `text-wrap: balance`.

## Espacios, radios, sombras
- Ritmo de 8 px. Secciones: 72 px (móvil) / 144 px (PC). Margen lateral 20 px / contenedor de 1200 px.
- Radios: 3 px en tarjetas y botones; 50 % en medallones (fotos redondas). Nada de 12 a 16 px.
- Sombras: solo en lo que flota (hoja del cotizador, visor, barra de abajo). Las tarjetas usan escalón de tono y borde de 1 px.

## Motivo
Hojas de palma en línea dorada fina (SVG propio), como las palmas del catálogo: divisores que se dibujan una vez al entrar (máximo uno animado por pantalla en el teléfono) y esquinas de los bloques de precio. Nada de pirámides ni jeroglíficos.

## Componentes
Cabecera verde con insignia · barra de abajo (Inicio, Hospedaje, Planes, Eventos, WhatsApp) · tarjeta de plan (foto o video, horario, íconos de lo que incluye, "desde", Ver plan) · tabla de tarifas que en el teléfono se vuelve tarjetas · medallón · acordeón · pestañas con transición · visor de fotos y videos · hoja del cotizador (abajo en el teléfono, modal en PC) · contador de precio que rueda · mapa aéreo con puntos.

## Páginas (13 principales + 19 fichas de plan + 4 de habitación = 36)
| Página | Lleva |
|---|---|
| `index.html` | portada con video (horizontal en PC, vertical en el teléfono), buscador rápido, precios de entrada, 6 accesos grandes, reloj de sol "El día en Faraona", instalaciones en galería horizontal, promociones con flyers, quiénes somos, cierre |
| `planes.html` | 10 planes con filtros (tipo, personas, con comidas) en la URL, panel "Filtrar" en el teléfono, contador de resultados |
| `plan-<id>.html` (19) | foto o video, horario, lo que incluye, tabla de tarifas (tarjetas en el teléfono), condiciones, Cotizar este plan, otros planes |
| `hospedaje.html` | 4 tipos de habitación, comparador de planes de comidas con precio que rueda, todo incluido, tarifas de grupos y alquiler plegadas, horarios y descuento |
| `habitacion-<id>.html` (4) | galería con visor y video, capacidad, lo que tiene, tarifa por plan de comidas, mini cotizador, otras habitaciones |
| `eventos.html` | pestañas Sociales / Corporativos / Campamentos con transición, bodas y 15 años, promoción de salón, tarifas de salones, campamentos y día de campo, videos y montajes |
| `temporadas.html` | Carnaval, Semana Santa, Full Day navideño, Nochebuena y Fin de año con tablas, y excursiones de fin de semana |
| `instalaciones.html` | mapa aéreo tocable + recorrido de 17 espacios con foto o video, capacidad y uso, servicios base |
| `servicios.html` | menú de alimentos y bebidas, descorche, brigada de personal, transporte, catering y festejo (todo lo de la web actual) |
| `membresia.html` | membresía corporativa anual, descuentos, obsequio, facilidades de pago en pasos |
| `galeria.html` | mosaico de 42 fotos y videos con filtros y visor a pantalla completa |
| `reservar.html` | cotizador completo, condiciones, reglamento y preguntas frecuentes |
| `contacto.html` | dirección, Cómo llegar, WhatsApp, fijos, correos, redes, RTN y licencia |

**Cotomaya:** 12 páginas visibles (inicio, hospedajes, propiedad, destino, tours, viajes, embarcaciones, galería, reservar, contacto, privacidad, créditos), con las fichas armadas por JavaScript en una sola página `propiedad.html?id=`. **Faraona: 36 archivos HTML con el contenido escrito en cada uno**, más catálogo, comparador, mapa y reloj de sol.
