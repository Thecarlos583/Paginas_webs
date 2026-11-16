# Sistema de diseño de Cotomaya Venezuela

Paleta clara de noviembre 2026 (prompt 34): los colores del logo oficial más azul marino, naranja y coral. **Nada de negro ni fondos casi negros**: lo más oscuro de toda la web es el azul marino `#16305A`. La página se ve luminosa, con fondos blanco cálido y arena en la mayoría de las secciones. Los valores salen de `:root` en `estilos.css`; si cambia el CSS, se actualiza este archivo.

> Logo oficial: insignia redonda (sol dorado con olas coral, "COTOMAYA · TOURISM & SERVICE"). Original sin tocar en `img/logo-cotomaya-original.jpg`; insignia recortada con transparencia en `img/logo-cotomaya.png` / `.webp` (512 px) y `img/logo-cotomaya-160.webp` (menú y pie); favicon con solo el sol y las olas en `img/favicon-32.png`, `favicon-180.png` (iPhone) y `favicon-512.png`. El marcador viejo quedó en `img/descartados/`. En `datos/config.json` el campo `"logo"` apunta a la insignia. Conviene pedirle a la clienta el archivo original con fondo transparente.

## 1. Colores

| Variable | Código | Nombre | Para qué se usa |
|---|---|---|---|
| `--hondo` | `#16305A` | Azul marino | El tono más oscuro permitido. Pie, barra de abajo del teléfono, texto sobre naranja, coral y dorado, velos de fotos. |
| `--primario` | `#1B3B6F` | Azul marino | Menú, las pocas secciones oscuras (propiedades destacadas, catálogo), botón secundario, chips marcados. |
| `--petroleo-medio` | `#2B5089` | Marino medio | Tarjetas de vidrio sobre marino y hover del botón marino. |
| `--azul-medio` | `#3B5A86` | Azul texto | Textos secundarios sobre claro (tipo de propiedad, ayudas, migas). |
| `--turquesa` | `#1F7F89` | Turquesa del logo (tono medio) | Franjas y fondos de acento: sección del mapa, ola de atrás de las franjas, brillo de las secciones marinas. |
| `--turquesa-oscuro` | `#15646C` | | Turquesa como texto sobre claro. |
| `--turquesa-claro` | `#E3F2F1` | | Fondo claro de acento (sección de destinos y preguntas). |
| `--naranja` | `#F28C38` | Naranja del aro del logo | **Botones principales de reserva** ("Consultar disponibilidad", "Reservar por WhatsApp", "Buscar"). |
| `--naranja-suave` | `#F6A05A` | | Hover del botón naranja. |
| `--coral` | `#EF7D60` | Coral de las olas y las letras | Acentos, íconos, crestas de las olas, pestaña elegida, página actual en la barra, sellos "Pronto". |
| `--coral-oscuro` | `#B1462B` | | Coral como texto sobre arena. |
| `--dorado` | `#D4A851` | Dorado del sol | Solo detalles finos: bordes de 1 px, brillos, destellos, línea de las olas. |
| `--dorado-claro` | `#E6C47F` | | Dorado como texto sobre marino. |
| `--dorado-oscuro` | `#7A5A17` | | Dorado como texto sobre claro. Nunca `--dorado` como texto sobre claro. |
| `--fondo` | `#FFFBF5` | Blanco cálido | Fondo general y secciones claras. |
| `--azul-claro` | `#F6EEE2` | Arena | Secciones alternas, cajas y chips. |
| `--linea` | `#E8DCC8` | | Bordes de campos y divisiones. |
| `--texto` | `#16305A` | Azul marino | Texto normal y títulos. |
| WhatsApp | `#25D366` / texto `#16305A` | | Solo el botón flotante y `.boton-wa`. |

Los nombres viejos de las variables (`--azul-medio`, `--azul-claro`, `--petroleo-medio`) se conservaron para no romper reglas; el comentario de `:root` dice qué son ahora.

**Contraste medido (mínimo 4,5:1):** texto marino sobre blanco cálido 12,7 y sobre arena 11,4; azul texto sobre arena 6,1; marino sobre naranja (botón) 5,4; marino sobre coral 4,8; marino sobre verde WhatsApp 6,6; blanco sobre marino 13,1 y sobre marino de secciones 11,0; blanco sobre marino medio 8,0; blanco sobre turquesa 4,7; dorado claro sobre marino 6,6; dorado oscuro sobre arena 5,5; coral oscuro sobre arena 4,8 y sobre blanco cálido 5,4; turquesa oscuro sobre blanco cálido 6,6.

**El atardecer de la portada** va de azul marino arriba a turquesa, naranja, coral y dorado abajo. Olas de la portada: turquesa (atrás), azul turquesa y marino (adelante), con crestas coral y dorada.

Velos sobre fotos: azul marino con poca opacidad, solo lo necesario para leer (`rgba(22,48,90, .4 → .82)`), más una sombra suave en el texto. Sombras siempre en azul marino, nunca negras.

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

- Tarjeta clara: `0 1px 0 rgba(22,48,90,.06), 0 10px 28px rgba(22,48,90,.07)`; al pasar el mouse `0 20px 40px rgba(22,48,90,.14)`.
- Tarjeta de vidrio sobre marino: sin sombra negra; borde dorado de 1 px y elevación con `translateY`.
- Hoja de viajes: `0 -10px 40px rgba(22,48,90,.3)`.

## 6. Piezas

- **Botón principal (`.boton`):** naranja con texto azul marino. Secundario `.boton-claro`: azul marino con texto blanco. `.boton-blanco`: blanco cálido con texto marino (sobre fotos). `.boton-wa`: verde WhatsApp con texto marino.
- **Etiqueta de categoría en la foto:** azul marino translúcido con borde dorado de 1 px y texto dorado claro.
- **Sellos "Muy pronto":** coral.
- **Pestañas Todos / Nacionales / Internacionales:** píldora coral que se desliza.
- **Servicios de viaje:** tarjeta con ícono propio en círculo azul marino y trazo dorado; al tocar abre una hoja desde abajo (modal en computadora) con el mini formulario. Personas con − y +, fechas con tope, aviso amable si falta un dato, "Cotización según disponibilidad" siempre a la vista.
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
| Portada viva | Cielo de azul marino a turquesa, naranja y coral que respira, sol que sube y brilla (es una ventana redonda con las fotos reales de las propiedades, que se relevan), tres capas de olas a 30, 21 y 15 s con crestas coral y dorada, paralaje leve al bajar | SVG + CSS; paralaje con `requestAnimationFrame` en `sitio.js` |
| Titular de portada | Palabras en cascada, termina antes de 1 s | CSS |
| Video de portada | Si `config.json → video_portada` tiene un archivo, va de fondo con las olas encima; vacío, se queda el atardecer | `sitio.js` |
| Destinos | Galería horizontal con snap; brillo dorado que recorre el borde al tocar (o al pasar el mouse) | CSS (`conic-gradient` que gira dentro de una máscara de 1,5 px) |
| Propiedades | Tarjetas de vidrio esmerilado sobre azul marino, borde dorado, elevación y zoom de la foto; en computadora se inclinan siguiendo el mouse (máx. 7°) | CSS + `sitio.js` |
| Tours y yates | Computadora: las tarjetas se fijan y se apilan; la de atrás se achica y se oscurece. Teléfono: lista normal con entrada suave (solo desplazamiento, nunca transparente) | `position: sticky` + **GSAP 3.13 y ScrollTrigger** en `assets/js/` (se cargan solo en computadora) + `animation-timeline: view()` |
| Mapa de destinos | SVG propio de Venezuela y Colombia (contornos de Natural Earth, dominio público); un punto que late por zona de `destinos.json` (campo `coordenadas`); las zonas muy juntas se agrupan en una lista | CSS + `sitio.js` |
| Olas en más partes | Franja de olas de la portada en divisores, cabeceras internas, pie y Yates; solo se mueve la más visible | `ola_banda()` + `sitio.js` (IntersectionObserver) |
| Botón coral | Destello dorado cada 7 s (botón Reservar del menú, Ver hospedajes, cierre y Cotizar mi viaje) | CSS |
| Entre páginas | Fundido con leve subida; menú y barra quedan fijos | View Transitions |
| Spline (opcional) | Si `config.json → spline_escena` trae una escena, solo en pantallas de 1024 px o más, después de cargar todo; si falla, queda el atardecer. En el teléfono nunca | `assets/js/spline.js` |

Con `prefers-reduced-motion`: todo quieto y visible (olas, sol, halo, puntos, destellos, pila y transiciones apagados; GSAP no se carga).
