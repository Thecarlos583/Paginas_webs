# Casa Club Villa 52: diseño

Vista previa de prospección (demo con WhatsApp real). Piscina y espacio para pasadías y celebraciones en Charallave, Miranda.
Generador: `contexto-claude-code/_generadores/piscina.py` (+ `piscina_estilos.css`, `piscina_sitio.js`). Datos en `datos/*.json`.
Correr: `python _generadores/piscina.py casa-club-villa-52`. Sirve para otras piscinas, fincas y centros recreacionales (otra carpeta, otros datos).

## Referencias (qué se toma de cada una)
- **The Beach Murazzi** (mención en Awwwards): titulares enormes y aire; el lugar se cuenta con pocas palabras.
- **Habitas Tulum, Beach Day Pass**: el pase de día como producto con horario, lo que incluye y un solo botón.
- **ResortPass** (catálogo de pases de piscina): filtros por fecha y personas arriba, tarjeta con foto, horario y precio a la vista.
- **Marienlyst Pool Club**: zonas del club listadas por uso, con normas claras (edad, horarios).
- **Clubes de playa de Miami (MiMo)**: art déco suave, dorado fino sobre azul, letras geométricas de club.

## Frase
En esta página, **la luz del sol en el fondo de la piscina** se vuelve **la firma: los reflejos que se encienden sobre el "52"**.

## Distinta a las últimas 5
Cotomaya (Cormorant, petróleo y coral, atardecer en SVG), Oasis (Caprasimo, curvas de nivel), Faraona (Brygada, reloj de sol), Oriana (Italiana, horas del mirador), Quinta Miami (neón). Villa 52: **Federo / Gantari**, azul piscina con dorado de 1 px, reflejos de agua (cáusticas) como motivo, y la **franja de sol** como novedad.

## Colores
| Nombre | Hex | Uso |
|---|---|---|
| Abismo | #08394A | cabecera, pie, secciones de acento (nunca negro) |
| Marea | #0F5466 | segundo azul, tarjetas sobre abismo |
| Blanco cálido | #FBF9F4 | fondo de la mayoría de las secciones |
| Arena | #F1EADD | secciones alternas, tarjetas |
| Dorado | #CFA84E | líneas y bordes de 1 px, botón principal (texto abismo, 5,5:1) |
| Oro tinta | #7E621C | texto dorado sobre claro (5,5:1 / 4,8:1) |
| Turquesa | #35C9C6 | acento sobre abismo (6,1:1); sobre claro #0B7376 (5,4:1) |
| Tinta | #12313B | texto (13:1) |

## Tipografía
- **Federo** (art déco, un peso): titulares, el "52" gigante, precios.
- **Gantari** 400/500/600: texto, botones, datos.
- Escala: 15/17/22/30/48 y el 52 a 34vw en teléfono (máx. 22rem en computadora).

## Espacios, radios, sombras
- Contenedor 1200 px; márgenes 20 px (teléfono) a 48 px. Secciones 72 px (teléfono) a 140 px.
- Radios: fotos con esquina superior en arco suave (la puerta del club) `28px 28px 6px 6px`; botones en píldora; tarjetas 6 px.
- Sombras solo en lo que flota (hoja del armador, visor, botón de WhatsApp). Tarjetas: escalón de tono + borde dorado de 1 px al tocar.

## Componentes
Cabecera azul con insignia, menú con página actual marcada, botón "Reservar"; hamburguesa y botón flotante de WhatsApp en teléfono. Buscador rápido (plan, fecha, personas). Tarjeta de plan (foto, horario, capacidad, precio de ejemplo, "Ver plan"). Comparador. Armador de reserva (hoja desde abajo / modal / versión completa) con **franja de sol**. Visor de fotos. Pestañas de normas. Lista de qué traer con casillas. Acordeón de preguntas. Divisor de reflejos.

## Movimiento
- Firma **"El agua se enciende"**: cáusticas en SVG que derivan lentas sobre el "52" dorado y el fondo de la portada (teléfono: una sola vez al cargar y queda quieta).
- **Un día en Villa 52**: un sol recorre una línea fina con el scroll (computadora horizontal fija; teléfono lista vertical normal).
- Fotos que se aclaran desde un estado ya visible (zoom 1.08 a 1 con línea dorada).
- Comparador con transición al cambiar de plan; tarjetas con elevación, zoom e inclinación leve (computadora); destello en el botón principal; check animado en "qué traer"; transiciones entre páginas (View Transitions).
- Solo transform y opacity. Con movimiento reducido, todo quieto y visible. Sin librerías.

## Páginas (16) frente a Cotomaya (10 reales + fichas por consulta)
| Villa 52 | Lleva | Cotomaya |
|---|---|---|
| index | portada con video y 52, buscador, planes, Un día en Villa 52, instalaciones en íconos, adelanto de galería, cierre con armador | index |
| planes | filtros en la URL (panel en teléfono), contador, vacío amable, tarjetas, comparador | hospedajes |
| plan-pasadia-familiar, plan-pasadia-grupo, plan-alquiler-exclusivo, plan-celebraciones | galería con visor, horario, capacidad, incluye, precio, franja de sol, mini armador, otros planes | propiedad?id= |
| celebraciones | 4 tipos con foto, qué se puede organizar, cómo se arma, WhatsApp | tours / viajes |
| celebracion-cumpleanos, -bautizo, -familiar, -empresa | foto grande, ideas, plan sugerido, mini galería, armador con el tipo ya puesto, otras | destino?d= |
| instalaciones | recorrido por 7 espacios con foto grande y para qué sirve | (no tiene) |
| galeria | mosaico con filtros y visor | (en fichas) |
| reservar | armador completo + franja de sol, normas en pestañas, qué traer con casillas, preguntas | reservar |
| contacto | WhatsApp, zona, Cómo llegar por WhatsApp, horario, formas de pago, llamado | contacto |
