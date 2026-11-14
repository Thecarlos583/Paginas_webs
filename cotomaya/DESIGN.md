# Sistema de diseño de Cotomaya Venezuela

Identidad nueva de noviembre 2026, sacada del logo (sol dorado con olas sobre un círculo petróleo, letras en coral y dorado). Reemplaza la paleta de azul marino, azul claro y dorado. Los valores salen de `:root` en `estilos.css`; si cambia el CSS, se actualiza este archivo.

> Logo: el original (`img/logo-cotomaya.png`) todavía no llegó. Mientras tanto se usa `img/logo-provisional.svg`, un marcador dibujado con la misma idea. Para cambiarlo: poner el PNG en `img/` y en `datos/config.json` cambiar `"logo"` a `"img/logo-cotomaya.png"`. Se usa en el menú, el pie y como ícono de la pestaña.

## 1. Colores

| Variable | Código | Nombre | Para qué se usa |
|---|---|---|---|
| `--primario` | `#0B2F35` | Petróleo profundo | Portada, menú, secciones oscuras, botón secundario, chips marcados. |
| `--hondo` | `#072227` | Petróleo hondo | Pie, barra de abajo del teléfono, texto sobre coral y dorado. |
| `--petroleo-medio` | `#134A52` | Petróleo medio | Tarjetas sobre fondo oscuro (vidrio), hover del botón petróleo. |
| `--azul-medio` | `#2C5A61` | Petróleo texto | Textos secundarios sobre arena (tipo de propiedad, ayudas, migas). |
| `--coral` | `#EF7D60` | Coral | Botón principal, acentos, pestaña elegida, página actual en la barra, sellos "Muy pronto". |
| `--coral-suave` | `#F4937A` | | Hover del botón coral. |
| `--coral-oscuro` | `#A8432A` | | Coral como texto sobre arena (subtítulos de tarjetas). |
| `--dorado` | `#D4A851` | Dorado | Solo detalles finos: bordes de 1 px, íconos, subrayados, brillos, sol del logo. |
| `--dorado-claro` | `#E6C47F` | | Dorado como texto sobre las tarjetas oscuras. |
| `--dorado-oscuro` | `#7A5A17` | | Dorado como texto sobre arena o blanco. Nunca `--dorado` como texto sobre claro. |
| `--fondo` | `#FBF6EE` | Arena muy clara | Fondo general y secciones claras (no blanco puro). |
| `--azul-claro` | `#F1E8DA` | Arena | Secciones alternas, cajas y chips. |
| `--linea` | `#E2D5BF` | | Bordes de campos y divisiones. |
| `--texto` | `#0E2B30` | | Texto normal. |
| WhatsApp | `#25D366` / texto `#06281A` | | Solo el botón flotante y `.boton-wa`. |

Los nombres viejos de las variables (`--azul-medio`, `--azul-claro`) se conservaron para no romper reglas; el comentario de `:root` dice qué son ahora.

**Contraste medido (mínimo 4,5:1):** texto sobre arena 12,3; texto secundario sobre arena 6,3; dorado oscuro sobre arena 5,2; coral oscuro sobre arena 4,9; petróleo hondo sobre coral (botón) 6,1; blanco sobre petróleo 14,3; dorado sobre petróleo 6,5; coral sobre petróleo 5,3; blanco sobre petróleo medio 9,9. El dorado normal sobre petróleo medio da 4,47, por eso ahí el texto va en `--dorado-claro`.

Velos sobre fotos: degradados de `rgba(8,38,43, .12 → .92)`. Sombras siempre con el petróleo, nunca negro puro.

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

- Tarjeta clara: `0 1px 0 rgba(8,38,43,.06), 0 10px 28px rgba(8,38,43,.07)`; al pasar el mouse `0 20px 40px rgba(8,38,43,.14)`.
- Tarjeta de vidrio sobre petróleo: sin sombra negra; borde dorado de 1 px y elevación con `translateY`.
- Hoja de viajes: `0 -10px 40px rgba(8,38,43,.3)`.

## 6. Piezas

- **Botón principal (`.boton`):** coral con texto petróleo hondo. Secundario `.boton-claro`: petróleo con texto blanco. `.boton-blanco`: arena con texto petróleo (sobre fotos). `.boton-wa`: verde WhatsApp.
- **Etiqueta de categoría en la foto:** petróleo translúcido con borde dorado de 1 px y texto dorado claro.
- **Sellos "Muy pronto":** coral.
- **Pestañas Todos / Nacionales / Internacionales:** píldora coral que se desliza.
- **Servicios de viaje:** tarjeta con ícono propio en círculo petróleo y trazo dorado; al tocar abre una hoja desde abajo (modal en computadora) con el mini formulario. Personas con − y +, fechas con tope, aviso amable si falta un dato, "Cotización según disponibilidad" siempre a la vista.
- **WhatsApp:** principal en todos los botones; el secundario solo en Contacto y en el pie, con su etiqueta encima.

## 7. Referencias de nivel (qué se toma de cada una, nada copiado)

- **Aman:** el silencio. Mucho aire, fotos grandes que respiran, tipografía serif fina y movimiento lento. De aquí: el ritmo pausado (olas de 15 a 30 s, halo del sol de 6 s) y la serif Cormorant en titulares grandes.
- **Belmond:** la marca como protagonista editorial: bloques de color de la casa, detalles dorados finos y una palabra en itálica como acento. De aquí: secciones en petróleo con brillos dorados de 1 px y la itálica coral en "al *Caribe*" y "Dónde *estamos*".
- **Airbnb Luxe:** el pedido a la medida. Fotos inmersivas y un formulario corto que arma el viaje con un "diseñador de viajes". De aquí: la hoja de servicios de viaje con pocas preguntas y el mensaje armado para WhatsApp.
- **Awwwards (hoteles y viajes, 2026, por ejemplo *Explore Primland*, Site of the Day):** escenas de portada vivas y galerías horizontales con snap. De aquí: el atardecer animado y la galería de destinos que se desliza de lado.

## 8. Movimiento

Regla de oro: **nada queda escondido.** Todo empieza visible y legible; el scroll solo mueve, escala, fija o aclara. Solo se animan `transform` y `opacity`.

| Pieza | Qué hace | Cómo |
|---|---|---|
| Portada viva | Cielo de petróleo a coral que respira, sol que sube y brilla (es una ventana redonda con las fotos reales de las propiedades, que se relevan), tres capas de olas a 30, 21 y 15 s con crestas coral y dorada, paralaje leve al bajar | SVG + CSS; paralaje con `requestAnimationFrame` en `sitio.js` |
| Titular de portada | Palabras en cascada, termina antes de 1 s | CSS |
| Video de portada | Si `config.json → video_portada` tiene un archivo, va de fondo con las olas encima; vacío, se queda el atardecer | `sitio.js` |
| Destinos | Galería horizontal con snap; brillo dorado que recorre el borde al tocar (o al pasar el mouse) | CSS (`conic-gradient` que gira dentro de una máscara de 1,5 px) |
| Propiedades | Tarjetas de vidrio esmerilado sobre petróleo, borde dorado, elevación y zoom de la foto; en computadora se inclinan siguiendo el mouse (máx. 7°) | CSS + `sitio.js` |
| Tours y yates | Computadora: las tarjetas se fijan y se apilan; la de atrás se achica y se oscurece. Teléfono: lista normal con entrada suave (solo desplazamiento, nunca transparente) | `position: sticky` + **GSAP 3.13 y ScrollTrigger** en `assets/js/` (se cargan solo en computadora) + `animation-timeline: view()` |
| Mapa de destinos | SVG propio de Venezuela y Colombia (contornos de Natural Earth, dominio público); un punto que late por zona de `destinos.json` (campo `coordenadas`); las zonas muy juntas se agrupan en una lista | CSS + `sitio.js` |
| Divisores | Ola del color del bloque anterior con una línea dorada | `sitio.js` |
| Botón coral | Destello dorado cada 7 s (botón Reservar del menú, Ver hospedajes, cierre y Cotizar mi viaje) | CSS |
| Entre páginas | Fundido con leve subida; menú y barra quedan fijos | View Transitions |
| Spline (opcional) | Si `config.json → spline_escena` trae una escena, solo en pantallas de 1024 px o más, después de cargar todo; si falla, queda el atardecer. En el teléfono nunca | `assets/js/spline.js` |

Con `prefers-reduced-motion`: todo quieto y visible (olas, sol, halo, puntos, destellos, pila y transiciones apagados; GSAP no se carga).
