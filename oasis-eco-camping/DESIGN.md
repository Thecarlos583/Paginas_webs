# Oasis Eco Camping & Spa · Diseño

Vista previa de prospección (prompt-41). San Sebastián de los Reyes, Aragua. Camping con spa que va a crecer a glamping.
Datos en `datos/*.json`; los HTML los escribe `contexto-claude-code/_generadores/oasis.py`.

## La idea en 4 líneas
- **Concepto:** el mapa de senderos del campamento. Curvas de nivel en línea fina como divisores, fondos y bordes; cada página es una "hoja" del mapa y el visitante siempre sabe dónde está.
- **Fuentes y paleta:** Caprasimo (display redonda, de cartel de parque) + Rethink Sans (texto). Arena clara de fondo, agua turquesa, verde hoja de acento, terracota solo en botones principales y noche en azul petróleo.
- **Firma y novedad:** "De la tarde a las estrellas": la sección pasa del cielo de la tarde al de la noche (color por tramos, brillo de fogata y cielo con estrellas quietas) mientras corren los cinco momentos del día. Novedad frente al registro: la **mochila de qué traer**, una lista con casillas que se guarda en el teléfono, cuenta lo listo y dibuja el sendero completo cuando todo está marcado.
- **Distinta a las últimas 5** (D' Luigi, Cotomaya, Quinta Miami, Vistas de Oriana, Faraona en curso): ni olas, ni neón, ni herbario botánico, ni verde campestre con crema. Fuente display redonda nunca usada; curvas de nivel nunca usadas; noche petróleo en vez de verde bosque.

## Frase de la idea
En esta página, **el mapa del terreno donde se acampa** se vuelve **el sistema visual entero** (curvas de nivel, hojas del mapa y el sendero de la mochila). Prueba del competidor: a un hotel de playa o a una posada de ciudad no le sirve; a otro camping le serviría el motivo, pero no la escena tarde-noche con spa ni el glamping que viene.

## Referencias (qué tomo de cada una)
- **EcoCamp Patagonia (Chile, ecocamp.travel):** presenta sus domos por niveles (Standard, Superior, Suite). Tomo la idea del **comparador** de parcela, carpa equipada y pasadía lado a lado.
- **Nayara Tented Camp (Costa Rica):** la carpa presentada como un hogar, con fotos a sangre del interior. Tomo las **fichas con galería grande** y foto de la carpa por dentro.
- **Sandat Glamping (Bali):** pocas opciones de hospedaje, cada una con su carácter. Tomo las **tarjetas grandes por forma de hospedaje**, una distinta de la otra.
- **Webs de parques nacionales y mapas de senderos (Awwwards, Land-book, categoría viajes y outdoor):** curvas de nivel, leyenda del mapa y señalética. Tomo el **motivo de marca** y los íconos de un solo grosor tipo señal de sendero.
- **chaletrancholuis.com (lo que le gustó al cliente):** guía al visitante en orden: qué es, dónde dormir, qué incluye, cómo reservar, y cada opción con su propio botón. Tomo ese **recorrido claro** y los botones por opción, con estética propia.

## Colores (contraste medido)
| Token | Hex | Uso |
|---|---|---|
| `--arena` | #F2EBDD | fondo de la mayoría de las secciones |
| `--arena-2` | #E6DBC5 | tarjetas y franjas (escalón de tono, sin sombra) |
| `--tinta` | #1D2B26 | texto (12,4:1 sobre arena) |
| `--tinta-suave` | #4A5550 | notas (6,5:1) |
| `--turquesa` | #1C7F7B | agua: rellenos, curvas, títulos grandes (4,05:1, solo texto grande) |
| `--turquesa-osc` | #105A57 | enlaces y texto turquesa (6,75:1) |
| `--turquesa-cl` | #6CC7BF | detalles sobre la noche (7,3:1) |
| `--hoja` | #4E7B3A | acento verde (íconos, casillas marcadas) |
| `--hoja-osc` | #2E5226 | texto verde (7,5:1) |
| `--terracota` | #A8462A | solo botones principales (texto crema 5,6:1) |
| `--noche` | #0E2D35 | secciones de noche, pie (texto 12,9:1) |
| `--noche-2` | #14404A | tarjetas sobre la noche |
| `--fogata` | #E9A04B | brillo de fogata y detalles sobre la noche (6,6:1) |

## Tipografía
- **Caprasimo 400** para títulos (h1 `clamp(2.6rem, 9vw, 5.6rem)`, h2 `clamp(2rem, 5.5vw, 3.6rem)`, h3 1.35rem).
- **Rethink Sans 400/500/700** para texto (17 px, interlineado 1.6) y botones (600 en 1rem).
- Cinco tamaños: 0.875 / 1.0625 / 1.35 / 2–3.6 / 2.6–5.6 rem. Titulares de 2 líneas como máximo; `text-wrap: balance`.

## Espacios, radios y sombras
- Escala de 8 px: 8, 16, 24, 40, 64, 104, 160. Entre secciones: 104 px en teléfono, 160 px en computadora.
- Contenedor: 1200 px, márgenes laterales `clamp(20px, 5vw, 56px)`.
- **Radios con criterio:** fotos y tarjetas con esquina de "hoja de mapa" (14 px arriba, 4 px abajo); botones en píldora; chips de filtro rectos con 6 px.
- **Sombras:** solo en lo que flota (menú abierto, hoja del armador, visor, botón flotante). Tarjetas con escalón de tono.

## Componentes
Cabecera (marca tipográfica + 6 enlaces + botón WhatsApp; hamburguesa en teléfono), botón flotante de WhatsApp, botón terracota, botón de contorno turquesa, chips de filtro, tarjeta de hospedaje (foto, íconos de capacidad, horario y carpa, precio de ejemplo, "Ver detalles"), comparador (tabla en computadora, tarjetas deslizables en teléfono), galería con visor a pantalla completa, armador de escapada (hoja que sube en teléfono, modal en computadora, versión completa en Reservar), pestañas de normas, mochila de qué traer, acordeón de preguntas, curvas de nivel (divisor, fondo y borde), cielo de estrellas quietas.

## Movimiento
- Portada: video de río con caída de agua (Pexels, 960 px, solo en computadora y sin ahorro de datos) con foto póster.
- Escena firma tarde-noche (fijada solo en computadora; lista vertical con color por tramos en teléfono).
- Galería horizontal de las formas de hospedaje que avanza al bajar (solo computadora, GSAP ScrollTrigger cargado solo ahí).
- Fotos que se aclaran con máscara desde un estado ya visible; comparador con transición al cambiar de opción.
- Curvas que se dibujan al entrar (máximo una por pantalla en el teléfono), tarjetas que se elevan, inclinación 3D leve con mouse, destello en el botón principal, check animado en la mochila, transición entre páginas.
- Con `prefers-reduced-motion`, todo quieto y visible.

## Páginas (12) frente a Cotomaya
| Oasis | Lleva | Equivale en Cotomaya |
|---|---|---|
| `index.html` | portada con video, buscador rápido, formas de hospedaje (galería horizontal), escena tarde-noche, adelanto del spa, lo que incluye, galería, cierre con armador | index |
| `acampar.html` | catálogo con filtros en la URL (panel en teléfono), contador, estado vacío, tarjetas, comparador | hospedajes |
| `hospedaje-parcela.html` | galería con visor, incluye, horario, capacidad, qué traer, precio, mini armador, otras opciones | propiedad?id= |
| `hospedaje-carpa-equipada.html` | igual | propiedad?id= |
| `hospedaje-pasadia.html` | igual, de un solo día | propiedad?id= |
| `glamping.html` | próximamente: qué será, fotos referenciales, "Quiero que me avisen" | (sin equivalente) |
| `spa.html` | servicios con duración y precio, plan Camping + spa, reservar spa | tours |
| `experiencias.html` | qué se vive, plan de fin de semana día por día, cerca de Oasis (fuentes) | destino / viajes |
| `galeria.html` | mosaico con filtros y visor | (galería dentro de propiedad) |
| `reservar.html` | armador completo, normas en pestañas, mochila de qué traer, preguntas | reservar |
| `contacto.html` | WhatsApp, zona, cómo llegar por WhatsApp, horario, llamado final | contacto |

Cotomaya tiene 9 páginas con contenido (más 2 legales y 5 redirecciones). Oasis tiene 12 páginas con contenido, todas hechas desde datos.
