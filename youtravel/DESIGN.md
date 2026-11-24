# YouTravel Agencia de Viajes · DESIGN.md

Vista previa de prospección (prompt 48). C.C. Portofino, Puerto Ordaz, estado Bolívar. WhatsApp real +58 424 957 2232.
Generada con `contexto-claude-code/herramientas/agencias/generar.py` (sirve también para PF Travels y las próximas agencias: cambian los JSON de `datos/` y el tema).

## Referencias (qué se toma de cada una)
| Referencia | Qué se toma |
|---|---|
| Black Tomato (blacktomato.com) | Portada de una sola idea fuerte y titular corto; los viajes se presentan por "sensación" antes que por precio. Aquí: un solo titular y el aro como protagonista. |
| Jacada Travel (jacadatravel.com) | Itinerario día por día muy limpio, con fotos grandes y el "qué incluye" en una lista corta. Aquí: fichas con línea de tiempo vertical. |
| Original Travel (originaltravel.co.uk) | Buscador por tipo de viaje y destino antes del catálogo. Aquí: buscador rápido montado bajo la portada que lleva a Paquetes o a Cotizar con los datos puestos. |
| Remote Lands (remotelands.com) | Destinos en tarjetas grandes a sangre, con una línea y los viajes que lo incluyen. Aquí: página Destinos y galería horizontal en el inicio. |
| Galerías Godly / Land-book (categoría viajes) | Tipografía geométrica muy gruesa con mucho aire blanco y un solo color vivo en detalles. Aquí: League Spartan 800 + el degradado del aro solo en detalles. |

## Diferencia con las últimas 5 (registro-rotacion.md)
Casa Club Villa 52 (abismo turquesa + dorado, Federo), 0295 VIP (azul noche + dorado, Gloock, carta de navegación), Oasis (arena + turquesa, Caprasimo, mapa de senderos), Mansión La Faraona (verde + crema, Brygada), Vistas de Oriana (luz por hora, Italiana).
YouTravel cambia los tres ejes: **fondo blanco cálido luminoso** (ninguna de las 5), **sans geométrica gruesa** (todas las anteriores usan serif o display), y la **firma del pase de abordar** (ninguna usa formas de boleto).

## Frase de la idea
En esta página, **el aro con el avión del logo** se vuelve **la ventana por donde se abre cada viaje** (portada) y **el pase de abordar** se vuelve **la forma de cada paquete y del cotizador**.

## Colores (contraste medido sobre blanco cálido #FAF8F4)
| Uso | Color | Contraste |
|---|---|---|
| Fondo principal (blanco cálido) | `#FAF8F4` | |
| Fondo alterno (gris muy claro) | `#EEF1F2` | |
| Tinta: títulos y texto (casi negro azulado del logo) | `#0C1C23` | 16,9:1 |
| Texto secundario | `#3D4B53` | 8,4:1 |
| Sección oscura (noche del logo) | `#0F2029`, texto `#F4F6F8` | 15,6:1 |
| Degradado del aro (solo detalles: línea fina, aro, números grandes) | `#3ED3C2` → `#8A55D6` | decorativo |
| Botón principal (degradado profundo, texto blanco) | `#0B7F76` → `#6B3FC0` | 4,9:1 y 6,8:1 |
| Texto de acento (enlaces, etiquetas) | `#0B7F76` | 4,6:1 |
| WhatsApp (verde profundo, texto blanco) | `#0F7A43` | 5,5:1 |
| Etiqueta "Ejemplo" | `#5B4A9E` sobre `#EEEAF8` | 6,9:1 |

Nunca bloques enteros con el degradado; nunca negro puro.

## Tipografía (Google Fonts por CDN)
- Títulos: **League Spartan** 700 y 800 (geométrica gruesa, combina con "youtravel"), interletra -0,02em.
- Texto: **Kumbh Sans** 400, 500 y 700, 16 px mínimo, números tabulares en precios y fechas.
- Escala: 14 / 16 / 20 / clamp(28–44) / clamp(40–88). Titulares de 2 líneas máximo.

## Espacios, radios y sombras
- Márgenes laterales: 20 px en el teléfono, 40 px en tableta, contenedor de 1200 px.
- Separación entre secciones: 72 px en el teléfono, 128–168 px en computadora.
- Radios: el **pase** (18 px con dos muescas redondas en la línea de corte) y botones en píldora. Fotos con 14 px. Nada más.
- Sombras: solo lo que flota (menú abierto, hoja del cotizador, visor, botón de WhatsApp). Las tarjetas se separan por tono, no por sombra.

## Motivo de marca
Rutas curvas finas (1,5 px) que salen de un aro: divisores entre secciones, fondo de la sección "Cómo funciona" y del pie. En el teléfono, máximo una ruta animada por pantalla.

## Escena firma: "El aro se abre"
Portada oscura (noche del logo). El aro del logo se dibuja con su degradado (stroke-dashoffset) y, desde su centro, se abre en círculo (solo `transform`) la foto/video de un ala de avión sobre las nubes hasta llenar la portada. En computadora, video corto de nubes desde la ventana de un avión (Wikimedia Commons, 480p, ~770 KB, con póster); en el teléfono y con ahorro de datos, solo la foto. Una sola vez al cargar. Con movimiento reducido: todo abierto y quieto desde el inicio. El texto se ve desde el primer instante.

## Novedad (no está en el registro)
**El pase de abordar en vivo:** el cotizador arma, mientras se llena, un pase con origen y destino en códigos reales de aeropuerto (PZO → LRV), fechas, pasajeros y servicio; el talón muestra el estimado con precios de ejemplo. Lo que se ve en el pase es lo que llega por WhatsApp.

## Momentos wow
1. El aro se abre (portada).
2. Galería horizontal de destinos que avanza al bajar (solo computadora, GSAP + ScrollTrigger por CDN).
3. Un avioncito que recorre una ruta curva mientras se baja por "Cómo funciona".
4. Comparador de paquetes: los pases se acomodan lado a lado con transición (en el teléfono, tarjetas que se deslizan).
5. El pase de abordar en vivo del cotizador.

## Componentes
Cabecera con logo y menú (hamburguesa en el teléfono) · barra de abajo en el teléfono (Inicio, Paquetes, Destinos, Cotizar, WhatsApp) · pase de paquete · buscador rápido · filtros (panel "Filtrar" en el teléfono) · comparador · galería con visor a pantalla completa · itinerario día por día · pestañas de políticas · acordeón de preguntas · hoja del cotizador (sube desde abajo en el teléfono, modal en computadora) · botón "Instalar en su teléfono" · pie con el aviso de ejemplo.

## Páginas (9 + 8 fichas + créditos = 18) y comparación con Cotomaya
| Página | Qué lleva |
|---|---|
| `index.html` | El aro se abre, buscador rápido, paquetes destacados, destinos en galería horizontal, servicios, Cómo funciona con avioncito, cierre con WhatsApp |
| `paquetes.html` | Catálogo de 8 paquetes, filtros en la URL (tipo, destino, duración, personas), contador, mensaje si no hay resultados, comparador de 2 o 3 |
| `paquete-<id>.html` (8) | Galería con visor, itinerario día por día, incluye / no incluye, precio de ejemplo, mini cotizador con el paquete elegido, otros paquetes |
| `destinos.html` | Nacionales e internacionales: foto grande, una línea y los paquetes que lo incluyen |
| `servicios.html` | 6 servicios con foto, para qué sirve y botón a cotizar; boletos aéreos con mini formulario |
| `grupos.html` | Viajes de empresa, graduación y familiares, formulario corto a WhatsApp |
| `galeria.html` | Mosaico con filtros (playas, montaña, ciudades, internacional) y visor |
| `cotizar.html` | Cotizador completo con el pase en vivo, políticas en pestañas, preguntas en acordeón |
| `contacto.html` | WhatsApp, C.C. Portofino, Cómo llegar (Google Maps), horario de ejemplo, Instalar en su teléfono, último llamado |
| `creditos.html` | Créditos de las fotos de Wikimedia Commons (licencias CC) |

Cotomaya: 16 páginas HTML (inicio, hospedajes, ficha de propiedad, destinos, cayos, paseos, tours, viajes, yates y lanchas, galería, reservar, cómo llegar, contacto, créditos, privacidad), catálogo con filtros, fichas con galería y visor, cotizador por WhatsApp. YouTravel: **18 páginas** con catálogo con filtros en la URL, comparador (Cotomaya no tiene), fichas con itinerario, galería con visor, cotizador con pase en vivo y se instala como app (Cotomaya no).
