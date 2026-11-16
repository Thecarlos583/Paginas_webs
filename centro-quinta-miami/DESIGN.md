# Quinta Miami · sistema de diseño

Neón de fiesta en Miami, sacado del logo: aro morado, palmera verde, isla naranja de atardecer, olas azules, "Quinta" celeste y "Miami" fucsia en letra manuscrita.

## Páginas

Web completa de 6 páginas: Inicio, Paquetes (cada uno en grande con 3 fotos), Espacios (galería fijada que avanza al bajar), Galería (filtros y visor), Cotizar (cotizador en página + preguntas) y Contacto (fachada, WhatsApp, preguntas). En el teléfono, barra fija abajo tipo app (Inicio, Paquetes, Espacios, Galería, Contacto) y arriba Cotizar y WhatsApp; transición suave entre páginas (`@view-transition`).

## Colores

| Token | Hex | Uso |
|---|---|---|
| `--noche` | #1B0C40 | Fondo de portada, Espacios, cierre y pie. Nunca negro puro |
| `--noche-2` | #120E3A | Final del degradado de noche |
| `--claro` | #FFF6FA | Fondo de las secciones claras (rosado muy suave, no crema) |
| `--claro-2` | #F7EEFF | Fondo de fotos mientras cargan, pendientes |
| `--tinta` | #26113F | Texto sobre claro (16:1) |
| `--gris` | #5E4F72 | Texto secundario sobre claro (7:1) |
| `--lila` | #C9B6EE | Texto secundario sobre noche (9,7:1) |
| `--texto-noche` | #F6EEFF | Texto sobre noche (15,9:1) |
| `--fucsia` | #FF3D9A | Botón principal, siempre con texto `--noche` (5,4:1). Nunca texto blanco encima (3,3:1) |
| `--fucsia-neon` | #FF5DAE | "Miami" y títulos de neón sobre noche |
| `--fucsia-osc` | #B4105E | Fucsia como texto sobre claro (6,2:1): obligatorios, errores |
| `--celeste` | #5CDBFF | "Quinta", enlaces sobre noche, foco del teclado (11:1 sobre noche) |
| `--morado` / `--morado-claro` | #A855F7 / #D29BFF | Aros, bordes y brillos |
| `--morado-osc` | #6A2BC9 | Títulos manuscritos sobre claro (7:1) |
| `--verde` | #43E08C | Palmera (detalle) |
| `--naranja` | #FF9A4D | Atardecer (detalle) |
| `--wa` | #25D366 | Botón de WhatsApp, con texto `--noche` (9:1) |

Contraste medido con la fórmula WCAG: toda combinación de texto queda en 4,5:1 o más.

## Fuentes

- **Yellowtail** (manuscrita de letrero, como el "Miami" del logo): solo títulos grandes (h1, títulos de sección, "Su evento" de la invitación). Nunca en texto corrido ni botones.
- **Quicksand** variable 400 a 700 (sans redondeado y limpio): todo lo demás. Texto 17 px / 1,55; etiquetas 700.
- Locales en `assets/fuentes/` con `font-display: swap`.

## Espacios, radios y sombras

- Margen lateral: 20 px teléfono, 32 px tablet, 48 px o centrado a 1240 px en computadora.
- Secciones: 52 a 72 px arriba y abajo en teléfono; 72 a 96 px en computadora.
- Radios: botones en píldora; tarjetas 24 px; fotos 18 px; campos 14 px.
- Sombras: vidrio `--sombra-vidrio` (luz arriba + sombra morada abajo); neón del botón fucsia `--sombra-neon-fucsia`.
- Brillo de neón con `text-shadow` solo en títulos sobre noche (dos capas, 8 px y 26 px).

## Componentes

- **Botones:** `btn-fucsia` (acción principal: cotizar), `btn-wa` (WhatsApp), `btn-borde` (secundaria: Ver flyer). Mínimo 48 px de alto.
- **Tarjeta de paquete:** vidrio blanco al 68 % con desenfoque, foto 4:3, insignia redonda con el emoji, nombre, una línea y "Cotizar este paquete". Campos `incluye`, `capacidad`, `horas`, `precio` y `flyer` se muestran solo si tienen dato.
- **Espacios:** carril horizontal de fotos 4:5 con texto encima del degradado. Teléfono: se desliza; computadora: la sección se fija y avanza de lado al bajar (GSAP).
- **Qué puede incluir:** cuadrícula de íconos de línea propios (24 px, trazo 1,6).
- **Divisores:** ola u hilera de palmeras entre noche y claro. Como máximo uno animado por pantalla.
- **Cotizador:** hoja que sube desde abajo en el teléfono y modal de dos columnas en computadora. Firma: la **invitación de neón** que se llena en vivo con lo que la persona elige.
- **Visor:** fotos de la galería y flyers a pantalla completa, con flechas y deslizar.

## Movimiento

Solo `transform` y `opacity`. Nada empieza escondido. Con `prefers-reduced-motion`, todo quieto.
- Portada: aro que respira, palmera que se mece, tres olas, resplandor del sol; el título se enciende una vez como letrero.
- Botón principal: destello cada 6 s.
- Escenas con scroll: paquetes en cascada (CSS `animation-timeline: view()`), fotos de Espacios que se acercan al centro (teléfono) y galería fijada que avanza de lado (computadora).
- Tarjetas: brillo que sigue el dedo; inclinación 3D leve solo con ratón.
