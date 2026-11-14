# Sistema de diseño de Cotomaya Venezuela

Documenta lo que **ya existe** en `estilos.css` (noviembre 2026). Cualquier cambio nuevo tiene que respetar esto. Los valores salen de `:root` y de las reglas de cada pieza; si cambia el CSS, se actualiza este archivo.

## 1. Colores

| Variable | Código | Para qué se usa |
|---|---|---|
| `--primario` | `#0B1F3A` | Azul marino de la marca. Menú de arriba, portadas, bloques oscuros, botón secundario (`.boton-claro`), pestaña elegida, chips marcados. |
| `--hondo` | `#071529` | Azul marino más profundo. Barra de abajo del teléfono, pie, cierre, texto sobre dorado. |
| `--azul-medio` | `#2C4A70` | Textos secundarios sobre fondo claro (tipo de propiedad, ayudas, migas). Hover del botón azul. |
| `--azul-claro` | `#EAF2FA` | Fondo de secciones alternas, cajas de datos, chips de filtros activos, esqueleto de carga. |
| `--azul-claro-2` | `#D8E6F4` | Variante un tono más fuerte del azul claro. |
| `--linea` | `#D3E0EE` | Bordes de campos, chips y divisiones. |
| `--dorado` | `#C9A54C` | Botón principal, línea de avance del menú, íconos, etiquetas de categoría, pestaña deslizante, foco de teclado. |
| `--dorado-suave` | `#D8BB72` | Hover del botón principal. |
| `--dorado-oscuro` | `#7A5D17` | Texto dorado sobre blanco o azul claro (contraste 5.4:1). Nunca usar `--dorado` como texto sobre claro. |
| `--fondo` | `#F7FAFD` | Fondo general de la página, hojas y paneles. |
| `--texto` | `#0B1F3A` | Texto normal (igual que el primario). |
| `--blanco` | `#FFFFFF` | Tarjetas, texto sobre oscuro. |
| WhatsApp | `#25D366` / texto `#06281A` | Solo el botón flotante y `.boton-wa`. Hover `#3DE07A`. |
| Mensaje | `#DCF8E9` | Burbuja que muestra el mensaje de WhatsApp armado. |
| Plataformas | Airbnb `#FF385C`, Booking `#003580`, Expedia `#FDDB32`, TripAdvisor `#34E0A1`, Agoda blanco con borde | Solo los botones de cada plataforma en la ficha. |

Velos sobre fotos: degradados de `rgba(11,31,58, .12 → .92)` (el azul marino con transparencia). Fondo del visor: `#050E1B`. Fondo de hojas y paneles abiertos: `rgba(11,31,58,.6)`.

Secciones: alternan `--fondo` (blanco azulado) y `--azul-claro`; los bloques oscuros van en `--primario` o `--hondo`. Esquema solo claro (`color-scheme: only light`).

## 2. Tipografía

Fuentes locales en `fuentes/` (WOFF2, `font-display: swap`):

- **Títulos:** Bricolage Grotesque 600 (`--titulo`). Respaldo: Arial Narrow, Arial. Interlineado 1.04, tracking −0.015em, `text-wrap: balance`.
- **Cuerpo:** Wix Madefor Text 400 y 600 (`--cuerpo`). Respaldo: Segoe UI, Arial. Interlineado 1.55, `text-wrap: pretty`.

| Elemento | Teléfono | Computadora (≥ 900 px) |
|---|---|---|
| Cuerpo | 16.5 px | 17 px |
| Titular de la portada del inicio | `clamp(2.7rem, 13vw, 6.2rem)` | `clamp(4.4rem, 6.8vw, 7rem)` |
| Titular de páginas interiores (`.cabeza h1`) | `clamp(2.5rem, 11.4vw, 5rem)` | `clamp(4rem, 7vw, 6.2rem)` |
| Título de ficha | `clamp(2.1rem, 9.4vw, 4.2rem)` | igual |
| `h2` | `clamp(2rem, 8.6vw, 3.5rem)` | `clamp(2.8rem, 4.6vw, 4.2rem)` |
| `h3` | 1.45rem (tarjetas 1.35rem) | igual |
| Marca (texto) | 1.5rem | 1.8rem |
| Precios (`.precio b`) | 2rem en Bricolage | igual |
| Etiquetas pequeñas | .78–.9rem en Wix 600 | igual |

Números destacados (contador de resultados, datos de la ficha, precios) van en Bricolage.

## 3. Espacios y medidas

- Ancho máximo del contenido: **1240 px** (`.contenedor`).
- Margen lateral (`--margen`): **20 px** en teléfono, **40 px** en computadora.
- Secciones: 56 px arriba / 72 px abajo en teléfono; 110 / 130 px en computadora.
- Separación entre tarjetas: 18 px en teléfono, 24 px en computadora.
- Barra de abajo del teléfono: **66 px** (`--barra-alto`) + zona segura del iPhone.
- Menú de arriba: 58 px en teléfono, 74 px en computadora. Pegado arriba (`sticky`); en el inicio va sobre la foto y se vuelve sólido al bajar.
- Corte a computadora: **900 px**. Catálogo con 3 columnas desde 1200 px.
- Toques: todo lo tocable mide **44 px** o más (botones 52 px, chips 44 px).

## 4. Radios

| Pieza | Radio |
|---|---|
| Botones, chips, pestañas, etiquetas | 999 px (píldora) |
| Tarjetas de propiedad y tours, paneles, bloques "Muy pronto" | 22 px |
| Destinos, galería de ficha, hojas del teléfono (arriba) | 24 px |
| Accesos por tipo | 20 px |
| Cajas de datos, preguntas frecuentes | 16 px |
| Campos y contadores | 14 px |
| Miniaturas de la galería | 10 px |

## 5. Sombras

- Tarjeta en reposo: `0 1px 0 rgba(11,31,58,.06), 0 10px 28px rgba(11,31,58,.07)`.
- Tarjeta al pasar el mouse: `0 18px 36px rgba(11,31,58,.13)`.
- Buscador (pase) de la portada: `0 18px 44px rgba(11,31,58,.22)`.
- Caja de reserva de la ficha: `0 14px 36px rgba(11,31,58,.1)`.
- Botón flotante de WhatsApp: `0 8px 22px rgba(11,31,58,.32)`.
- Siempre con el azul marino como color de sombra, nunca negro puro.

## 6. Piezas

**Botones (`.boton`):** píldora, alto mínimo 52 px (46 px el chico), relleno 12 × 22 px, Wix 600, ícono a la izquierda o flecha a la derecha con 9 px de separación.
- Principal: fondo dorado, texto `--hondo`; hover dorado suave.
- `.boton-claro`: azul marino con texto blanco (en tarjetas: "Ver propiedad").
- `.boton-blanco`: blanco con texto azul marino (sobre fotos).
- `.boton-wa`: verde WhatsApp.
- Al presionar se encogen un poco (`scale(.96)`).

**Tarjetas de propiedad (`.tarjeta`):** fondo blanco, radio 22 px, sombra suave. Foto 4:3 con hasta 5 fotos que se deslizan (puntos abajo, flechas en computadora al pasar el mouse). Etiqueta de categoría dorada arriba a la derecha. Debajo: tipo · zona (azul medio), nombre en Bricolage, subtítulo en dorado oscuro, resumen, capacidad y habitaciones con íconos, botón azul "Ver propiedad". Al pasar el mouse sube 3 px.

**Etiquetas:**
- Categoría en la foto (`.tarjeta-cat`): píldora dorada, texto `--hondo`, .78rem.
- Sello de categoría en texto (`.sello-cat`): borde dorado, texto dorado oscuro.
- "Muy pronto" (`.pronto-sello`): píldora dorada.
- "Ejemplo": píldora azul marino translúcida con desenfoque.
- Zonas sobre fotos: píldoras blancas translúcidas con desenfoque.

**Menú:**
- Teléfono: arriba solo la marca centrada; abajo una barra fija tipo app con 5 accesos (Inicio, Hospedajes, Tours, Destinos, Contacto), el actual en dorado. Botón flotante redondo de WhatsApp a la derecha, sobre la barra.
- Computadora: marca a la izquierda, enlaces al centro con subrayado dorado que se dibuja al pasar el mouse, botón dorado "Reservar" a la derecha. Línea dorada de avance de lectura bajo el menú. El flotante pasa a píldora con texto "Escríbanos".

**Pestañas Todos / Nacionales / Internacionales (`.pestanas-amb`):** cápsula azul marino translúcida sobre la foto de cabecera, con una píldora dorada que se desliza bajo la opción elegida.

**Filtros:** en teléfono, hoja que sube desde abajo con fondo oscurecido; en computadora, columna fija a la izquierda. Chips de opciones en píldora (marcado = azul marino). Contador de personas con − y +.

**Visor de fotos:** pantalla completa casi negra, fotos que se deslizan una por una, contador "3 / 20", flechas redondas translúcidas en computadora.

**Fotos:** siempre `object-fit: cover`, con versión de 600 px para teléfono (`-600.webp`). Sobre fotos con texto, velo azul marino en degradado.

## 7. Movimiento (lo que ya existe)

- Portada del inicio: fotos que se relevan con fundido y zoom lentísimo (22 s); palabras del titular que suben al cargar.
- Transiciones entre páginas con View Transitions (`@view-transition`).
- Duraciones cortas: .15–.35 s para toques, .5–.7 s para zoom de fotos.
- Solo se animan `transform` y `opacity` (más algún color de fondo en hover).
- Con `prefers-reduced-motion`, todo se queda quieto.
- Regla de la casa: nada de contenido que aparezca al bajar; todo se ve desde el principio.
