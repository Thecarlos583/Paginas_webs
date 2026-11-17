# Sistema de diseño de Cotomaya Venezuela

**Paleta elegida por la clienta el 17/11/2026** (mandó una foto de la portada y dijo: "Estos colores es lo que prefiero, con el movimiento de olas y el logo de COTOMAYA"). Turquesa profundo de la portada como fondo de **toda** la página, un turquesa más claro de respiro para alternar, naranja en los botones, coral en acentos, dorado en detalles y arena en los textos. **Nada de negro ni de fondos claros.** Ningún cambio futuro aclara ni oscurece esta paleta sin pedido de la clienta. Los valores salen de `:root` en `estilos.css`; si cambia el CSS, se actualiza este archivo.

Por qué este turquesa: la foto de la clienta es de la versión del 14/11 (petróleo `#0B2F35`) vista en una laptop, donde se ve más clara (entre `#124C5A` y `#1C4C60`). Ese mismo `#0B2F35` es el que en el catálogo se leía como negro, así que la base es el tono que ella ve en su foto: `#134F5D`.

> Logo oficial: insignia redonda (sol dorado con olas coral, "COTOMAYA · TOURISM & SERVICE"). Original sin tocar en `img/logo-cotomaya-original.jpg`; insignia recortada con transparencia en `img/logo-cotomaya.png` / `.webp` (512 px) y `img/logo-cotomaya-160.webp` (menú y pie); favicon con solo el sol y las olas en `img/favicon-32.png`, `favicon-180.png` (iPhone) y `favicon-512.png`. El marcador viejo quedó en `img/descartados/`. En `datos/config.json` el campo `"logo"` apunta a la insignia. Conviene pedirle a la clienta el archivo original con fondo transparente.

## 1. Colores

| Variable | Código | Nombre | Para qué se usa |
|---|---|---|---|
| `--fondo` / `--primario` | `#134F5D` | Turquesa profundo (portada) | Fondo principal: portada, menú, secciones, catálogo. |
| `--azul-claro` | `#1C6676` | Turquesa de respiro | Secciones alternas, cajas y chips. |
| `--tarjeta` | `#19606E` | Turquesa de tarjeta | Tarjetas, campos, fichas y hojas. |
| `--petroleo-medio` / `--azul-claro-2` | `#22707F` | Turquesa medio | Hover del botón turquesa, tarjetas de vidrio, países del mapa. |
| `--hondo` | `#0F4552` | Turquesa hondo | El fondo más oscuro permitido: pie y barra de abajo del teléfono. |
| `--tinta` | `#0A3540` | | **Solo texto** sobre naranja, coral, dorado y verde WhatsApp. Nunca fondo. |
| `--texto` | `#F6EEE2` | Arena | Texto normal y títulos. |
| `--azul-medio` | `#CFE3E2` | Texto suave | Textos secundarios (tipo de propiedad, ayudas, migas). |
| `--naranja` | `#F28C38` | Naranja del aro del logo | **Botones principales** ("Ver hospedajes", "Consultar disponibilidad", "Reservar"). |
| `--coral` | `#EF7D60` | Coral de las olas y las letras | Acentos, íconos, crestas de las olas, pestaña elegida, sellos "Pronto". |
| `--coral-oscuro` | `#FFD3C4` | | Coral como texto sobre turquesa. |
| `--dorado` | `#D4A851` | Dorado del sol | Solo detalles finos: bordes de 1 px, brillos, línea de las olas. |
| `--dorado-claro` / `--dorado-oscuro` | `#F0D49A` / `#F2D9A4` | | Dorado como texto sobre turquesa. |
| `--linea` | `#4A8794` | | Bordes de campos y divisiones. |
| WhatsApp | `#25D366` / texto `#0A3540` | | Solo el botón flotante y `.boton-wa`. |

Los nombres viejos de las variables (`--azul-medio`, `--azul-claro`, `--petroleo-medio`, `--dorado-oscuro`) se conservaron para no romper reglas; el comentario de `:root` dice qué son ahora.

**Contraste medido (mínimo 4,5:1):** arena sobre turquesa profundo 7,9, sobre respiro 5,7, sobre tarjeta 6,2 y sobre el pie 9,2; texto suave sobre tarjeta 5,4 y sobre respiro 4,9; dorado texto sobre respiro 4,7 y sobre tarjeta 5,2; coral texto sobre respiro 4,8; error `#FFCFC7` sobre respiro 4,7; tinta sobre naranja 5,4, sobre coral 4,9, sobre dorado 6,0 y sobre verde WhatsApp 6,6. La palabra "Caribe" en coral (`#F4937A`) es titular grande (3:1 basta): 4,0.

**El atardecer de la portada** va de turquesa profundo arriba a turquesa, naranja, coral y dorado abajo. Olas de la portada: turquesa (atrás), turquesa medio y hondo (adelante), con crestas coral y dorada.

Velos sobre fotos y capas translúcidas: turquesa profundo con poca opacidad (`rgba(19,79,93, .3 → .6)`), solo lo necesario para leer, más una sombra suave en el texto. Sombras siempre en turquesa hondo (`rgba(9,56,66,…)`), nunca negras.

### Olas en más partes

Un solo componente (`svg_ola()` y `ola_banda()` en el generador, plantilla `<template data-ola-plantilla>` en cada página): el mismo SVG de las olas de la portada. Va en los divisores entre secciones, al pie de la cabecera de cada página interna, en el pie de página y en la cabecera de Yates y lanchas. Atrás, una ola turquesa con cresta coral; adelante, la ola quieta del color del bloque vecino con una línea dorada de 1 px. Movimiento lento (12 s), solo `transform`, nunca encima de texto ni botones. **Como máximo una ola animada por pantalla**: `sitio.js` le pone `.viva` solo a la más visible y las demás quedan quietas. Con `prefers-reduced-motion`, todas quietas.

## 2. Tipografía

Fuentes locales en `assets/fuentes/` (WOFF2, `font-display: swap`, la de títulos precargada):

- **Títulos:** Cormorant Garamond 600, recta e itálica (`--titulo`). Respaldo: Iowan Old Style, Georgia. Interlineado 1, sin tracking, números de caja alta (`lining-nums`). La itálica se usa para una palabra de acento en titulares grandes (`.cursiva`).
- **Cuerpo:** Wix Madefor Text 400 y 600 (`--cuerpo`). Interlineado 1.55.
- **Marca:** "COTOMAYA" en Cormorant versalitas con tracking .16em; "VENEZUELA" en Wix 600, .6rem, tracking .32em, dorado claro.

| Elemento | Teléfono | Computadora (≥ 900 px) |
|---|---|---|
| Cuerpo | 16.5 px | 17 px |
| Titular de portada | `clamp(2.7rem, 13vw, 6.2rem)` | `clamp(4.4rem, 6.8vw, 7rem)` |
| Titular interior | `clamp(2.5rem, 11.4vw, 5rem)` | `clamp(4rem, 7vw, 6.2rem)` |
| `h2` | `clamp(2.4rem, 10vw, 3.9rem)` | `clamp(3.2rem, 5vw, 4.9rem)` |
| `h3` | 1.65rem (tarjetas 1.55rem) | igual |

## 3. Espacios y medidas

- Ancho máximo: **1240 px**. Margen lateral: 20 px teléfono, 40 px computadora.
- Secciones: 56/72 px en teléfono, 110/130 px en computadora.
- Menú arriba: 58 px teléfono, 74 px computadora. Barra de abajo del teléfono: 66 px con **6 accesos** (Inicio, Hospedajes, Tours, Viajes, Destinos, Contacto).
- Corte a computadora: 900 px. Todo lo tocable mide 44 px o más.

## 4. Radios

Botones, chips y etiquetas: píldora (999 px). Tarjetas de propiedad, tours y servicios: 22 px. Destinos, galería, hojas: 24–26 px. Cajas de datos: 16 px. Campos: 14 px. Logo: círculo.

## 5. Sombras

- Tarjeta: `0 1px 0 rgba(9,56,66,.06), 0 10px 28px rgba(9,56,66,.07)`; al pasar el mouse `0 20px 40px rgba(9,56,66,.14)`.
- Tarjeta de vidrio sobre turquesa: sin sombra negra; borde dorado de 1 px y elevación con `translateY`.
- Hoja de viajes: `0 -10px 40px rgba(9,56,66,.3)`.

## 6. Piezas

- **Botón principal (`.boton`):** naranja con texto tinta. Secundario `.boton-claro`: turquesa con texto blanco. `.boton-blanco`: borde arena de 1,5 px sobre turquesa translúcido, como el "Chat por WhatsApp" de la portada de la foto. `.boton-wa`: verde WhatsApp con texto tinta.
- **Etiqueta de categoría en la foto:** turquesa translúcido con borde dorado de 1 px y texto dorado claro.
- **Sellos "Muy pronto":** coral.
- **Pestañas Todos / Nacionales / Internacionales:** píldora coral que se desliza.
- **Servicios de viaje:** tarjeta con ícono propio en círculo turquesa y trazo dorado; al tocar abre una hoja desde abajo (modal en computadora) con el mini formulario. Personas con − y +, fechas con tope, aviso amable si falta un dato, "Cotización según disponibilidad" siempre a la vista.
- **WhatsApp:** principal en todos los botones; el secundario solo en Contacto y en el pie, con su etiqueta encima.

## 7. Referencias de nivel (qué se toma de cada una, nada copiado)

- **Aman:** el silencio. Mucho aire, fotos grandes que respiran, tipografía serif fina y movimiento lento. De aquí: el ritmo pausado (olas de 15 a 30 s, halo del sol de 6 s) y la serif Cormorant en titulares grandes.
- **Belmond:** la marca como protagonista editorial: bloques de color de la casa, detalles dorados finos y una palabra en itálica como acento. De aquí: secciones en azul marino con brillos dorados de 1 px y la itálica coral en "al *Caribe*" y "Dónde *estamos*".
- **Airbnb Luxe:** el pedido a la medida. Fotos inmersivas y un formulario corto que arma el viaje con un "diseñador de viajes". De aquí: la hoja de servicios de viaje con pocas preguntas y el mensaje armado para WhatsApp.
- **Awwwards (hoteles y viajes, 2026, por ejemplo *Explore Primland*, Site of the Day):** escenas de portada vivas y galerías horizontales con snap. De aquí: el atardecer animado y la galería de destinos que se desliza de lado.

## 8. Movimiento

Regla de oro: **nada queda escondido.** Todo empieza visible y legible; el scroll solo mueve, escala, fija o aclara. Solo se animan `transform` y `opacity`.

| Pieza | Qué hace | Cómo |
|---|---|---|
| Portada viva | Cielo de turquesa profundo a turquesa, naranja y coral que respira, sol que sube y brilla (es una ventana redonda con las fotos reales de las propiedades, que se relevan), tres capas de olas a 30, 21 y 15 s con crestas coral y dorada, paralaje leve al bajar | SVG + CSS; paralaje con `requestAnimationFrame` en `sitio.js` |
| Titular de portada | Palabras en cascada, termina antes de 1 s | CSS |
| Video de portada | Si `config.json → video_portada` tiene un archivo, va de fondo con las olas encima; vacío, se queda el atardecer | `sitio.js` |
| Destinos | Galería horizontal con snap; brillo dorado que recorre el borde al tocar (o al pasar el mouse) | CSS (`conic-gradient` que gira dentro de una máscara de 1,5 px) |
| Propiedades | Tarjetas de vidrio esmerilado sobre turquesa, borde dorado, elevación y zoom de la foto; en computadora se inclinan siguiendo el mouse (máx. 7°) | CSS + `sitio.js` |
| Tours y yates | Computadora: las tarjetas se fijan y se apilan; la de atrás se achica y se oscurece. Teléfono: lista normal con entrada suave (solo desplazamiento, nunca transparente) | `position: sticky` + **GSAP 3.13 y ScrollTrigger** en `assets/js/` (se cargan solo en computadora) + `animation-timeline: view()` |
| Mapa de destinos | SVG propio de Venezuela y Colombia (Natural Earth). Al tocar un punto o un nombre de la lista, el mapa se acerca suave a ese destino; las zonas muy juntas (Falcón) salen como un solo punto; al tocarlo, el mapa hace de lupa: se acerca lo justo para separarlas y cambia a la costa detallada real de Morrocoy (Natural Earth 1:10m, `cotomaya_semilla/costa-falcon.json`), con cada destino en su lugar real y sin líneas. La ficha del destino (foto, descripción, cuántas propiedades, Ver hospedajes) va al lado del mapa en la computadora y debajo en el teléfono, nunca encima. Los nombres buscan el lado donde caben. "Ver todo el mapa" vuelve | CSS (transform) + `sitio.js` |
| Olas en más partes | Franja de olas de la portada en divisores, cabeceras internas, pie y Yates; solo se mueve la más visible | `ola_banda()` + `sitio.js` (IntersectionObserver) |
| Botón coral | Destello dorado cada 7 s (botón Reservar del menú, Ver hospedajes, cierre y Cotizar mi viaje) | CSS |
| Entre páginas | Fundido con leve subida; menú y barra quedan fijos | View Transitions |
| Spline (opcional) | Si `config.json → spline_escena` trae una escena, solo en pantallas de 1024 px o más, después de cargar todo; si falla, queda el atardecer. En el teléfono nunca | `assets/js/spline.js` |

Con `prefers-reduced-motion`: todo quieto y visible (olas, sol, halo, puntos, destellos, pila y transiciones apagados; GSAP no se carga).
