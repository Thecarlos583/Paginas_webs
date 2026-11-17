# Chalet Vistas de Oriana: sistema de diseño

Vista previa para la Sra. Irene (prospecto). Lujo botánico y sereno, sacado del logo: espiral arena y dorada, rama oscura, flor ave del paraíso, letras en verde hoja.

## Referencias (qué se toma de cada una, sin copiar)
- **Forestis (Dolomitas, Italia):** silencio. Mucho aire, una sola foto grande por pantalla, textos de dos líneas. De aquí sale el ritmo lento y el blanco cálido.
- **Explora (Patagonia, Chile):** las habitaciones se presentan por lo que se ve desde la ventana, no por los metros. De aquí sale la fila de íconos (personas, cama, vista) y que la vista sea el tema.
- **Nayara Springs (Costa Rica):** lo botánico como identidad: hojas grandes, verdes profundos y un acento de flor. De aquí sale el verde bosque en vez del negro.
- **Borgo Santo Pietro (Toscana):** jardín y cocina como parte de la estadía; títulos en serif con cursiva. De aquí sale "Lo que se vive aquí" como franja de momentos del día.
- **Capella Ubud (Bali):** cada suite con nombre propio y su ficha de cuento corto. De aquí sale nombrar las habitaciones como láminas de una colección.
- Plantilla alpina "Aevum" (Framer): marcos de 1 px y numeración discreta.

**Lo nuevo frente a las webs anteriores de Carlos:** las habitaciones como **láminas de herbario** (Lámina I, II, III, con marco dorado de 1 px y leyenda en cursiva, como una colección botánica) y la portada **"La vista se abre"**: la espiral del logo se dibuja y desde su centro se abre en círculo la foto de la montaña.

## Color (contraste medido, WCAG)
| Nombre | Hex | Uso |
|---|---|---|
| Marfil | #FBF7EF | fondo principal |
| Arena | #F2E8D7 | secciones alternas, tarjetas |
| Verde hoja | #1F4A33 | títulos (9,4:1 sobre marfil; 8,3:1 sobre arena) |
| Verde bosque | #163829 | secciones oscuras y pie (nunca negro) |
| Texto | #2E3A31 | párrafos (11,1:1 / 9,8:1) |
| Texto suave | #5B6659 | notas (5,6:1 / 5,0:1) |
| Dorado arena | #B8935A | solo líneas de 1 px, espiral, bordes (no texto) |
| Dorado texto | #7D5E22 | numeración y leyendas sobre claro (5,5:1 marfil / 4,8:1 arena) |
| Dorado claro | #D9BC85 | detalles sobre verde bosque (7,0:1) |
| Naranja ave del paraíso | #C24C17 | solo botones principales, texto blanco (4,8:1) |
| Azul violeta | #4A4C9E | un acento puntual: ícono de vista y subrayado de enlaces (7,0:1) |
| Crema | #F3EAD8 | texto sobre verde bosque (10,8:1) |

## Tipografía (Google Fonts por CDN, display=swap)
- **Rosarivo** (títulos, recta y cursiva): serif de trazo caligráfico que conversa con lo manuscrito del logo sin ser letra de boda. Títulos grandes en cursiva; nunca una sola palabra resaltada.
- **Instrument Sans** 400/500/600 (texto, botones, menú).
- Escala: 14 / 16 / 18 / 22 / 30 / 42 / 64 (clamp en teléfono). Interlineado 1,6 en texto, 1,05 en títulos.

## Espacios, radios, sombras
- Base 8 px. Secciones: 72 px en teléfono, 120 px en computadora. Texto a 62 caracteres como máximo.
- Radios: 2 px en láminas y fotos (marco de herbario), 999 px solo en botones, 18 px en la hoja del cotizador.
- Sombras: casi ninguna. Las láminas se separan con el marco dorado de 1 px; al tocar, leve elevación (sombra verde #163829 al 12 %) y el borde brilla en dorado.

## Componentes
- **Lámina de habitación:** foto vertical 4:5 dentro de un marco dorado con 10 px de aire, "Lámina I" en dorado texto, nombre en Rosarivo cursiva, una línea, fila de íconos (se oculta si el dato está vacío), "Ver habitación" (texto con subrayado violeta) y "Consultar disponibilidad" (naranja).
- **Espiral divisora:** SVG de 1 px dorado, se dibuja al entrar en pantalla; en el teléfono, una animada por pantalla como máximo.
- **Cotizador:** hoja que sube desde abajo en el teléfono, modal centrado en computadora.
- **Botón flotante de WhatsApp:** círculo verde bosque con aro dorado, abajo a la derecha, visible desde el inicio.

## Movimiento
- Portada: espiral que se dibuja (stroke-dashoffset, 1,6 s), foto que se abre en círculo desde el centro (clip-path), flor que aparece con brillo. Una sola vez.
- Láminas: entran en cascada con la foto que se aclara desde un marco interior (siempre visibles; solo cambia la máscara y la escala).
- Galería "Lo que se vive aquí": avanza de lado al bajar en computadora; en el teléfono, deslizamiento normal.
- Con prefers-reduced-motion: todo quieto y la espiral ya dibujada.
